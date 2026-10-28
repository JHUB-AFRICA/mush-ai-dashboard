import json
import time
import queue
import threading
import serial
import requests

# Load configuration
try:
    with open("config.json", "r") as f:
        config = json.load(f)
except FileNotFoundError:
    config = {
        "serial_port": "/dev/ttyUSB0",
        "baud_rate": 9600,
        "backend_url": "http://localhost:5000",
        "device_id": "pie-node-01",
        "poll_interval_seconds": 5,
        "moving_average_window": 5
    }

data_queue = queue.Queue(maxsize=100)

# --- HARDWARE GPIO SETUP (Digital Pin 5 for LED Valve Indicator) ---
VALVE_PIN = 5
gpio_available = False

try:
    import RPi.GPIO as GPIO
    GPIO.setmode(GPIO.BCM) # or GPIO.BOARD depending on your wiring scheme
    GPIO.setup(VALVE_PIN, GPIO.OUT)
    GPIO.output(VALVE_PIN, GPIO.LOW) # Start with LED off (Valve closed)
    gpio_available = True
    print(f"[HARDWARE] GPIO successfully initialized. LED connected to Digital Pin {VALVE_PIN}")
except (ImportError, RuntimeError):
    print(f"[HARDWARE WARNING] RPi.GPIO not available (running on non-Pi OS). Pin {VALVE_PIN} will be simulated.")


class MovingAverageFilter:
    def __init__(self, window_size):
        self.window_size = window_size
        self.buffer = {
            "co2": [],
            "temperature": [],
            "humidity": [],
            "moisture": [],
            "light": []
        }

    def update_and_get(self, new_readings):
        smoothed = {}
        for key in self.buffer:
            if key in new_readings:
                self.buffer[key].append(new_readings[key])
                if len(self.buffer[key]) > self.window_size:
                    self.buffer[key].pop(0)
                smoothed[key] = round(sum(self.buffer[key]) / len(self.buffer[key]), 2)
        return smoothed


# 1. PRODUCER THREAD: Reads from Arduino via Serial & applies Moving Average
def serial_producer():
    print(f"Connecting to Arduino on {config['serial_port']} at {config['baud_rate']} baud...")
    filter_engine = MovingAverageFilter(config["moving_average_window"])
    
    simulating = False
    try:
        ser = serial.Serial(config["serial_port"], config["baud_rate"], timeout=1)
    except Exception as e:
        print(f"Warning: Could not open serial port ({e}). Running in SIMULATION mode.")
        simulating = True

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
                    "light": random.randint(200, 400)
                }
                time.sleep(2)
            else:
                line = ser.readline().decode('utf-8').strip()
                if line:
                    raw_data = json.loads(line)

            if raw_data:
                smoothed_data = filter_engine.update_and_get(raw_data)
                if data_queue.full():
                    data_queue.get()
                data_queue.put(smoothed_data)
                print(f"[PRODUCER] Smoothed Data Buffered: {smoothed_data}")

        except Exception as err:
            print(f"[PRODUCER ERROR]: {err}")
            time.sleep(2)


# 2. CONSUMER THREAD: Pushes Telemetry to Cloud & Polls Actuator Command
def cloud_consumer():
    url_telemetry = f"{config['backend_url']}/api/telemetry"
    url_actuator = f"{config['backend_url']}/api/actuator/command"
    
    last_valve_state = None

    while True:
        # A. Send Buffered Telemetry
        if not data_queue.empty():
            reading = data_queue.get()
            payload = {
                "deviceId": config["device_id"],
                **reading
            }
            try:
                res = requests.post(url_telemetry, json=payload, timeout=5)
                if res.status_code == 201:
                    print(f"[CONSUMER] Successfully pushed telemetry to cloud.")
                else:
                    print(f"[CONSUMER] Failed to push telemetry: {res.status_code}")
            except Exception as e:
                print(f"[CONSUMER NETWORK ERROR (POST)]: {e}")

        # B. Poll Actuator Endpoint & Control Pin 5 LED
        try:
            res = requests.get(url_actuator, timeout=5)
            if res.status_code == 200:
                data = res.json()
                current_valve_state = data.get("valveState", False)
                
                if current_valve_state != last_valve_state:
                    last_valve_state = current_valve_state
                    state_label = "OPEN (LED ON)" if current_valve_state else "CLOSED (LED OFF)"
                    print(f"\n[ACTUATOR HOOK] 🚰 Valve Command Changed -> State: {state_label}")
                    
                    # Physical actuation check
                    if gpio_available:
                        GPIO.output(VALVE_PIN, GPIO.HIGH if current_valve_state else GPIO.LOW)
                    else:
                        print(f"[SIMULATION] Digital Pin {VALVE_PIN} set to: {'HIGH' if current_valve_state else 'LOW'}")
                    
        except Exception as e:
            print(f"[CONSUMER NETWORK ERROR (GET)]: {e}")

        time.sleep(config["poll_interval_seconds"])


if __name__ == "__main__":
    print("Starting PIE Edge Node Services...")
    t_producer = threading.Thread(target=serial_producer, daemon=True)
    t_consumer = threading.Thread(target=cloud_consumer, daemon=True)

    t_producer.start()
    t_consumer.start()

    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print("Shutting down PIE Edge Node gracefully.")
        if gpio_available:
            GPIO.cleanup()
