# 🍄 Mush-AI Arduino Controller

Hardware firmware for the mushroom growth chamber environmental control system. The Arduino samples analog and digital environmental sensors, operates actuators and climate control hardware (relays, LCD, IR receiver, Bluetooth), and continuously streams structured telemetry across USB serial to the Raspberry Pi edge node (`/pie`).

---

## 🛠️ Hardware & Pin Configuration

### Sensors
- **A0 (LDR_PIN):** Ambient light level sensor
- **A1 (CO2_PIN):** Carbon dioxide sensor (MQ-135 / analog gas sensor)
- **A3 (MOISTURE_PIN):** Soil / substrate moisture probe
- **Digital / OneWire:** Temperature and humidity sensing

### Actuators & Peripherals
- **Pin 8 (IR_RECEIVE_PIN):** Infrared receiver for remote control commands
- **Shift Register 1 (LCD Driver):** Pins 2 (`DS`), 3 (`SHCP`), 4 (`STCP`)
- **Shift Register 2 (Relay Driver):** Pins 5 (`DS`), 6 (`SHCP`), 7 (`STCP`) driving 5 separate chamber relays (humidifier, heater, ventilation fans, lighting)
- **HC-06 Bluetooth Module:** Pin 13 (`RX`), Pin 11 (`TX`), Pin 12 (`STATE`)
- **USB Serial:** Baud rate `115200` (or `9600`) to communicate directly with Raspberry Pi

---

## 📂 Folder Structure

```
arduino/
├── src/
│   └── main.cpp           # Core firmware loop, sensor sampling, relay control & serial writer
├── include/               # Header definitions
├── lib/                   # Local libraries
├── test/                  # Embedded unit tests
└── platformio.ini         # PlatformIO build & upload configuration
```

---

## 🚀 Building & Uploading with PlatformIO

### Prerequisites
Install [PlatformIO Core](https://platformio.org/) or the PlatformIO extension in VSCode / Cursor.

### Build Firmware
```bash
cd arduino
pio run
```

### Upload to Arduino Board
Connect the board via USB and run:
```bash
pio run --target upload
```

### Serial Monitor
```bash
pio device monitor --baud 115200
```
