# 🥧 Mush-AI PIE Edge Node

The edge client service running on the Raspberry Pi located at the mushroom farm. It bridges low-level Arduino sensor streams to the cloud backend, filtering and smoothing readings before transmitting them via HTTP REST.

---

## 🛠️ How It Works

1. **Serial Ingestion:** Continuously reads newline-delimited sensor telemetry emitted by the Arduino over USB serial (`/dev/ttyUSB0` or `/dev/ttyACM0`).
2. **Moving Average Filter:** Buffers recent sensor samples into a sliding window and calculates smoothed averages for CO2, temperature, humidity, moisture, and light. This eliminates jitter and sensor noise.
3. **Cloud Synchronization:** Dispatches an HTTP `POST /api/telemetry` payload to the Mush-AI backend service every configurable poll interval.

---

## ⚙️ Configuration (`config.json`)

Adjust your configuration parameters to match your hardware and network setup:

```json
{
  "serial_port": "/dev/ttyUSB0",
  "baud_rate": 115200,
  "backend_url": "https://api.your-app.prisma.build",
  "device_id": "pie-node-01",
  "poll_interval_seconds": 5,
  "moving_average_window": 5
}
```

- **`serial_port`:** The serial device path assigned to the Arduino (e.g. `/dev/ttyUSB0` or `/dev/ttyACM0`).
- **`baud_rate`:** Must match the serial baud rate defined in the Arduino firmware (`115200` or `9600`).
- **`backend_url`:** Live URL of your deployed backend service or local server (`http://localhost:5000`).
- **`device_id`:** Identifier for the farm node (useful for multi-chamber setups).
- **`poll_interval_seconds`:** Telemetry upload frequency.
- **`moving_average_window`:** Number of recent samples averaged per transmission.

---

## 🚀 Setup & Execution

### 1. Create Virtual Environment & Install Dependencies
```bash
cd pie
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

### 2. Run Interactively
```bash
python client.py
```

---

## 🔄 Running as a Background Daemon (`systemd`)

To ensure the edge node starts automatically on boot and recovers from failures, install it as a `systemd` service on the Raspberry Pi:

Create `/etc/systemd/system/mush-ai-pie.service`:
```ini
[Unit]
Description=Mush-AI Edge Node Daemon
After=network.target

[Service]
Type=simple
User=pi
WorkingDirectory=/home/pi/mush-ai-dashboard/pie
ExecStart=/home/pi/mush-ai-dashboard/pie/.venv/bin/python client.py
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```

Enable and start the service:
```bash
sudo systemctl daemon-reload
sudo systemctl enable mush-ai-pie
sudo systemctl start mush-ai-pie
sudo systemctl status mush-ai-pie
```
