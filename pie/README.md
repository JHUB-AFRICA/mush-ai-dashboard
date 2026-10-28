# 🥧 Mush-AI PIE Edge Node

This folder contains the Python edge client running on the Raspberry Pi. It reads sensor telemetry from an Arduino via USB serial, applies a Moving Average smoothing filter, syncs data to the cloud backend via HTTP POST, and polls for valve/actuator states to control local hardware pins.

---

## 🛠️ Hardware Wiring & Pinout
* **Arduino Connection:** Plugged into the Raspberry Pi via a USB cable.
* **Actuator LED / Relay:** Connected to **Digital Pin 5 (BCM)** and Ground (`GND`).

---

## ⚙️ Configuration (`config.json`)
Before running, verify your `config.json` settings:
```json
{
  "serial_port": "/dev/ttyUSB0",
  "baud_rate": 9600,
  "backend_url": "http://localhost:5000",
  "device_id": "pie-node-01",
  "poll_interval_seconds": 5,
  "moving_average_window": 5
}
