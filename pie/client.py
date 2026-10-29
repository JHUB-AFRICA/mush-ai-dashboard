import json
import time
import queue
import threading
import serial
import requests

# ------------------------------------------------------------
# CONFIG (config.json overrides any of these defaults)
# ------------------------------------------------------------
DEFAULTS = {
    "serial_port": "/dev/ttyACM0",      # Uno/Mega = ttyACM0, CH340/FTDI clones = ttyUSB0
    "baud_rate": 115200,                # must match Serial.begin() on the Arduino
    "backend_url": "http://localhost:5000",
    "device_id": "pie-node-01",
    "poll_interval_seconds": 5,
    "moving_average_window": 5,
    "allow_simulation": False,          # True = fake data if Arduino missing (tagged simulated)
    "send_relay_state": False,          # True = include "relays" in the cloud payload
    "command_poll_enabled": False,      # True = poll backend for relay commands
    "command_poll_seconds": 3,
    # Linear calibration per key: value = raw * gain + offset
    # Defaults pass the raw 0-1023 ADC value through. Tune these for your sensors.
    "calibration": {
        "co2":      {"gain": 1.0, "offset": 0.0},
        "moisture": {"gain": 1.0, "offset": 0.0},
        "light":    {"gain": 1.0, "offset": 0.0},
    },
}

config = dict(DEFAULTS)
try:
    with open("config.json", "r") as f:
        config.update(json.load(f))
except FileNotFoundError:
    print("config.json not found, using defaults.")

# Arduino JSON key -> cloud key
KEY_MAP = {
    "CO2": "co2",
    "MST": "moisture",
    "LDR": "light",
    "TMP": "temperature",
    "HUM": "humidity",
}

VALID_COMMANDS = {f"R{n}_{s}" for n in range(1, 6) for s in ("ON", "OFF")} | {"RALL_ON", "RALL_OFF"}

data_queue = queue.Queue(maxsize=100)
serial_lock = threading.Lock()
serial_handle = None
simulating = False
relay_state = None


class MovingAverageFilter:
    def __init__(self, window_size):
        self.window_size = window_size
        self.buffer = {"co2": [], "temperature": [], "humidity": [], "moisture": [], "light": []}

    def update_and_get(self, new_readings):
        smoothed = {}
        for key in self.buffer:
            if key in new_readings:
                self.buffer[key].append(new_readings[key])
                if len(self.buffer[key]) > self.window_size:
                    self.buffer[key].pop(0)
                smoothed[key] = round(sum(self.buffer[key]) / len(self.buffer[key]), 2)
        return smoothed


def calibrate(key, value):
    cal = config["calibration"].get(key)
    if not cal:
        return value
    return value * cal.get("gain", 1.0) + cal.get("offset", 0.0)


def open_serial():
    """Open the Arduino port. Retries forever, unless simulation is allowed."""
    while True:
        try:
            ser = serial.Serial(config["serial_port"], config["baud_rate"], timeout=1)
            time.sleep(2)               # Arduino resets when the port opens
            ser.reset_input_buffer()
            print(f"Connected to Arduino on {config['serial_port']} at {config['baud_rate']} baud.")
            return ser
        except Exception as e:
            print(f"Could not open serial port ({e}).")
            if config["allow_simulation"]:
                print("Running in SIMULATION mode (data is tagged simulated).")
                return None
            print("Retrying in 5 seconds...")
            time.sleep(5)


def send_command(cmd):
    """Send a relay command to the Arduino. Example: send_command('R1_ON')."""
    cmd = cmd.strip().upper()
    if cmd not in VALID_COMMANDS:
        print(f"[COMMAND] Ignored invalid command: {cmd}")
        return False
    with serial_lock:
        if serial_handle is None:
            print("[COMMAND] No Arduino connected.")
            return False
        try:
            serial_handle.write((cmd + "\n").encode("utf-8"))   # newline is required
            return True
        except Exception as e:
            print(f"[COMMAND ERROR]: {e}")
            return False


# Reads the Arduino over USB, maps keys, calibrates and smooths the numbers
def serial_producer():
    global serial_handle, simulating, relay_state

    filter_engine = MovingAverageFilter(config["moving_average_window"])

    ser = open_serial()
    if ser is None:
        simulating = True
    else:
        with serial_lock:
            serial_handle = ser

    while True:
        try:
            raw_data = None

            if simulating:
                import random
                raw_data = {
                    "co2": random.randint(400, 600),
                    "temperature": round(random.uniform(22.0, 26.0), 1),
                    "humidity": round(random.uniform(80.0, 90.0), 1),
                    "moisture": round(random.uniform(50.0, 70.0), 1),
                    "light": random.randint(200, 400),
                }
                time.sleep(2)
            else:
                line = ser.readline().decode("utf-8", errors="ignore").strip()

                if not line:
                    continue

                # ACK:/NACK: replies from the Arduino are not telemetry
                if line.startswith("ACK:") or line.startswith("NACK:"):
                    print(f"[ARDUINO] {line}")
                    continue

                # Ignore anything that is not a JSON line (boot noise, partial lines)
                if not line.startswith("{"):
                    continue

                parsed = json.loads(line)

                if "RLY" in parsed:
                    relay_state = parsed["RLY"]

                raw_data = {
                    KEY_MAP[k]: calibrate(KEY_MAP[k], v)
                    for k, v in parsed.items()
                    if k in KEY_MAP
                }

            if raw_data:
                smoothed_data = filter_engine.update_and_get(raw_data)
                if data_queue.full():
                    data_queue.get()
                data_queue.put(smoothed_data)
                print(f"[PRODUCER] Smoothed Data Buffered: {smoothed_data}")

        except json.JSONDecodeError:
            continue    # a half-received line; skip it

        except (serial.SerialException, OSError) as err:
            print(f"[PRODUCER] Serial connection lost: {err}")
            with serial_lock:
                serial_handle = None
            try:
                ser.close()
            except Exception:
                pass
            ser = open_serial()
            if ser is None:
                simulating = True
            else:
                with serial_lock:
                    serial_handle = ser

        except Exception as err:
            print(f"[PRODUCER ERROR]: {err}")
            time.sleep(1)


# Sends the readings to the backend
def cloud_consumer():
    url_telemetry = f"{config['backend_url']}/api/telemetry"

    while True:
        if not data_queue.empty():
            reading = data_queue.get()
            while not data_queue.empty():       # only send the newest reading
                reading = data_queue.get()

            if reading:                          # never post an empty payload
                payload = {"deviceId": config["device_id"], **reading}
                if config["send_relay_state"] and relay_state is not None:
                    payload["relays"] = relay_state
                if simulating:
                    payload["simulated"] = True

                try:
                    res = requests.post(url_telemetry, json=payload, timeout=5)
                    if res.status_code in (200, 201):
                        print("[CONSUMER] Successfully pushed telemetry to cloud.")
                    else:
                        print(f"[CONSUMER] Failed to push telemetry: {res.status_code}")
                except Exception as e:
                    print(f"[CONSUMER NETWORK ERROR (POST)]: {e}")

        time.sleep(config["poll_interval_seconds"])


# OPTIONAL: pulls relay commands from the backend and forwards them to the Arduino.
# ASSUMPTION: backend answers GET /api/commands/<deviceId> with {"commands": ["R1_ON", ...]}
# Adjust this to your real API, then set "command_poll_enabled": true.
def command_poller():
    url = f"{config['backend_url']}/api/commands/{config['device_id']}"

    while True:
        try:
            res = requests.get(url, timeout=5)
            if res.status_code == 200:
                for cmd in res.json().get("commands", []):
                    if send_command(cmd):
                        print(f"[COMMAND] Sent {cmd}")
        except Exception as e:
            print(f"[COMMAND POLL ERROR]: {e}")

        time.sleep(config["command_poll_seconds"])


if __name__ == "__main__":
    print("Starting PIE Edge Node Services...")
    threading.Thread(target=serial_producer, daemon=True).start()
    threading.Thread(target=cloud_consumer, daemon=True).start()

    if config["command_poll_enabled"]:
        threading.Thread(target=command_poller, daemon=True).start()

    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print("Shutting down PIE Edge Node gracefully.")
