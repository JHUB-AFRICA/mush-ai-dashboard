-- CreateTable
CREATE TABLE "SensorLog" (
    "id" TEXT NOT NULL,
    "deviceId" TEXT NOT NULL DEFAULT 'pie-node-01',
    "co2" DOUBLE PRECISION NOT NULL,
    "temperature" DOUBLE PRECISION NOT NULL,
    "humidity" DOUBLE PRECISION NOT NULL,
    "moisture" DOUBLE PRECISION NOT NULL,
    "light" DOUBLE PRECISION NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SensorLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SensorLog_timestamp_idx" ON "SensorLog"("timestamp");
