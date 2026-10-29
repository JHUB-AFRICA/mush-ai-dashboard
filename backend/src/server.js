const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const app = express();

app.use(cors());
app.use(express.json());

// The Pi sends sensor readings here
app.post('/api/telemetry', async (req, res) => {
  try {
    const { deviceId, co2, temperature, humidity, moisture, light } = req.body;

    const newLog = await prisma.sensorLog.create({
      data: { deviceId: deviceId || 'pie-node-01', co2, temperature, humidity, moisture, light }
    });

    res.status(201).json({ success: true, data: newLog });
  } catch (error) {
    console.error('Error saving telemetry:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// The website reads the latest reading from here
app.get('/api/status', async (req, res) => {
  try {
    const telemetry = await prisma.sensorLog.findFirst({ orderBy: { timestamp: 'desc' } });
    res.json({ success: true, telemetry });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Mush-AI Backend running on port ${PORT}`));
