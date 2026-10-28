const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const app = express();

app.use(cors());
app.use(express.json());

// 1. PIE Device Endpoint: Ingests sensor data
app.post('/api/telemetry', async (req, res) => {
  try {
    const { deviceId, co2, temperature, humidity, moisture, light } = req.body;
    
    const newLog = await prisma.sensorLog.create({
      data: {
        deviceId: deviceId || 'pie-node-01',
        co2,
        temperature,
        humidity,
        moisture,
        light
      }
    });

    res.status(201).json({ success: true, data: newLog });
  } catch (error) {
    console.error('Error saving telemetry:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 2. Frontend / PIE Endpoint: Get latest sensor readings & valve state
app.get('/api/status', async (req, res) => {
  try {
    const latestSensor = await prisma.sensorLog.findFirst({
      orderBy: { timestamp: 'desc' }
    });

    const actuator = await prisma.actuatorState.upsert({
      where: { deviceId: 'pie-node-01' },
      update: {},
      create: { deviceId: 'pie-node-01', valveState: false }
    });

    res.json({ success: true, telemetry: latestSensor, actuator });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 3. Frontend Endpoint: Toggle the Valve actuator (PUT)
app.put('/api/actuator', async (req, res) => {
  try {
    const { valveState } = req.body;

    const updatedActuator = await prisma.actuatorState.upsert({
      where: { deviceId: 'pie-node-01' },
      update: { valveState },
      create: { deviceId: 'pie-node-01', valveState }
    });

    res.json({ success: true, data: updatedActuator });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 2. PIE polls this endpoint continuously to check what state it SHOULD be in
app.get('/api/actuator/command', async (req, res) => {
  try {
    const actuator = await prisma.actuatorState.findUnique({
      where: { deviceId: 'pie-node-01' }
    });
    res.json({ success: true, valveState: actuator ? actuator.valveState : false });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Mush-AI Backend running on port ${PORT}`);
});
