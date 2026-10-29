// ============================================================
// SMARTMUSHROOM SYSTEM
// Arduino <-> Raspberry Pi 4 over USB Serial
// Also supports HC-06 Bluetooth, LCD, IR remote and 5 relays
// ============================================================

// Force IRremote to use AVR Timer 1 before including headers
#define IR_USE_AVR_TIMER1

#include <IRremote.hpp>
#include <SoftwareSerial.h>
#include <Wire.h>

// ============================================================
// PIN DEFINITIONS
// ============================================================

// Sensors
#define LDR_PIN       A0
#define CO2_PIN       A1
#define MOISTURE_PIN  A3

// Infrared receiver
#define IR_RECEIVE_PIN 8

// Shift Register 1: LCD driver
#define SR1_DS_PIN    2
#define SR1_SHCP_PIN  3
#define SR1_STCP_PIN  4

// Shift Register 2: Relay driver
#define SR2_DS_PIN    5
#define SR2_SHCP_PIN  6
#define SR2_STCP_PIN  7

// HC-06 Bluetooth module
#define BT_RX_PIN     13
#define BT_TX_PIN     11
#define BT_STATE_PIN  12

// ============================================================
// IR REMOTE BUTTON CODES
// ============================================================

#define IR_BTN_UP     0x18
#define IR_BTN_DOWN   0x52
#define IR_BTN_RIGHT  0x5A
#define IR_BTN_LEFT   0x08
#define IR_BTN_OK     0x1C

// ============================================================
// COMMUNICATION
// ============================================================

// Arduino USB serial connected to Raspberry Pi
// Baud rate: 115200
//
// Bluetooth remains on SoftwareSerial at 9600 baud.

SoftwareSerial btSerial(BT_RX_PIN, BT_TX_PIN);

// ============================================================
// SENSOR DATA
// ============================================================

int ldrValue = 0;
int co2Value = 0;
int moistureValue = 0;

float temperature = 0.0;
float humidity = 0.0;

// ============================================================
// RELAYS AND LCD STATE
// ============================================================

// Bit 0 = Relay 1
// Bit 1 = Relay 2
// Bit 2 = Relay 3
// Bit 3 = Relay 4
// Bit 4 = Relay 5
//
// 1 = ON
// 0 = OFF

byte relayState = 0x00;

int currentLcdPage = 0;
int selectedRelayIndex = 0;

// ============================================================
// TIMERS
// ============================================================

unsigned long lastSensorRead = 0;
unsigned long lastSerialSend = 0;
unsigned long lastMarqueeScroll = 0;
unsigned long lastIrPressTime = 0;

// ============================================================
// WELCOME MESSAGE
// ============================================================

int marqueeIndex = 0;

const char welcomeText[] =
  "   we are pleased to have here with us and welcome to "
  "smartmushroom farm a product of JHUB .   ";

const int welcomeLen = sizeof(welcomeText) - 1;

// ============================================================
// SHIFT REGISTER HELPERS
// ============================================================

void writeShiftRegister(
  int dsPin,
  int shcpPin,
  int stcpPin,
  byte data
) {
  digitalWrite(stcpPin, LOW);

  shiftOut(dsPin, shcpPin, MSBFIRST, data);

  digitalWrite(stcpPin, HIGH);
}

// ============================================================
// LCD CONTROL
// ============================================================

void lcdPulseEnable(byte srData) {

  writeShiftRegister(
    SR1_DS_PIN,
    SR1_SHCP_PIN,
    SR1_STCP_PIN,
    srData | 0x02
  );

  delayMicroseconds(1);

  writeShiftRegister(
    SR1_DS_PIN,
    SR1_SHCP_PIN,
    SR1_STCP_PIN,
    srData & ~0x02
  );

  delayMicroseconds(50);
}

void lcdSendNibble(byte nibble, bool isData) {

  byte srData = isData ? 0x01 : 0x00;

  srData |= ((nibble & 0x0F) << 2);

  writeShiftRegister(
    SR1_DS_PIN,
    SR1_SHCP_PIN,
    SR1_STCP_PIN,
    srData
  );

  lcdPulseEnable(srData);
}

void lcdCommand(byte cmd) {

  lcdSendNibble(cmd >> 4, false);

  lcdSendNibble(cmd & 0x0F, false);

  delay(2);
}

void lcdWriteChar(char ch) {

  lcdSendNibble(ch >> 4, true);

  lcdSendNibble(ch & 0x0F, true);
}

void lcdPrintString(const char* str) {

  while (*str) {
    lcdWriteChar(*str++);
  }
}

void initLCD() {

  delay(50);

  lcdSendNibble(0x03, false);
  delay(5);

  lcdSendNibble(0x03, false);
  delay(5);

  lcdSendNibble(0x03, false);
  delay(1);

  lcdSendNibble(0x02, false);

  lcdCommand(0x28);  // 4-bit, 2-line display
  lcdCommand(0x0C);  // Display ON, cursor OFF
  lcdCommand(0x01);  // Clear display

  delay(2);
}

void setLcdCursor(uint8_t col, uint8_t row) {

  uint8_t rowOffsets[] = {0x00, 0x40};

  lcdCommand(0x80 | (col + rowOffsets[row]));
}

// ============================================================
// RELAY CONTROL
// ============================================================

// The relay driver is active LOW.
// A stored state bit of 1 means the relay is ON.
// The output bits are inverted before transmission.

void updateRelays(byte state) {

  relayState = state & 0x1F;

  writeShiftRegister(
    SR2_DS_PIN,
    SR2_SHCP_PIN,
    SR2_STCP_PIN,
    (byte)~relayState
  );
}

// ============================================================
// AHT20 / DHT20 I2C TEMPERATURE AND HUMIDITY
// ============================================================

void readI2CDHT() {

  Wire.beginTransmission(0x38);

  Wire.write(0xAC);
  Wire.write(0x33);
  Wire.write(0x00);

  if (Wire.endTransmission() == 0) {

    delay(80);

    Wire.requestFrom(0x38, 6);

    if (Wire.available() >= 6) {

      byte data[6];

      for (int i = 0; i < 6; i++) {
        data[i] = Wire.read();
      }

      uint32_t rawHum =
        (((uint32_t)data[1] << 12) |
         ((uint32_t)data[2] << 4) |
         (data[3] >> 4));

      uint32_t rawTemp =
        ((((uint32_t)data[3] & 0x0F) << 16) |
         ((uint32_t)data[4] << 8) |
         data[5]);

      humidity =
        ((float)rawHum / 1048576.0) * 100.0;

      temperature =
        (((float)rawTemp / 1048576.0) * 200.0) - 50.0;
    }
  }
}

// ============================================================
// LCD DISPLAY REFRESH
// ============================================================

void updateLCDDisplay() {

  lcdCommand(0x01);
  delay(2);

  // ----------------------------------------------------------
  // PAGE 0: WELCOME MESSAGE
  // ----------------------------------------------------------

  if (currentLcdPage == 0) {

    setLcdCursor(0, 0);

    lcdPrintString("SmartMushroom");

    setLcdCursor(0, 1);

    char buffer[17];

    for (int i = 0; i < 16; i++) {

      buffer[i] =
        welcomeText[(marqueeIndex + i) % welcomeLen];
    }

    buffer[16] = '\0';

    lcdPrintString(buffer);
  }

  // ----------------------------------------------------------
  // PAGE 1: TEMPERATURE AND HUMIDITY
  // ----------------------------------------------------------

  else if (currentLcdPage == 1) {

    setLcdCursor(0, 0);

    lcdPrintString("Temp : ");
    lcdPrintString(String(temperature, 1).c_str());
    lcdPrintString("C");

    setLcdCursor(0, 1);

    lcdPrintString("Humid: ");
    lcdPrintString(String(humidity, 1).c_str());
    lcdPrintString("%");
  }

  // ----------------------------------------------------------
  // PAGE 2: AIR AND SOIL
  // ----------------------------------------------------------

  else if (currentLcdPage == 2) {

    setLcdCursor(0, 0);

    lcdPrintString("CO2  : ");
    lcdPrintString(String(co2Value).c_str());
    lcdPrintString(" PPM");

    setLcdCursor(0, 1);

    lcdPrintString("Moist: ");
    lcdPrintString(String(moistureValue).c_str());
  }

  // ----------------------------------------------------------
  // PAGE 3: LIGHT AND RELAY STATUS
  // ----------------------------------------------------------

  else if (currentLcdPage == 3) {

    setLcdCursor(0, 0);

    lcdPrintString("LDR  : ");
    lcdPrintString(String(ldrValue).c_str());

    setLcdCursor(0, 1);

    lcdPrintString("Relays: ");

    for (int i = 0; i < 5; i++) {

      lcdWriteChar(
        (relayState & (1 << i)) ? '1' : '0'
      );
    }
  }

  // ----------------------------------------------------------
  // PAGE 4: INTERACTIVE RELAY CONTROL
  // ----------------------------------------------------------

  else if (currentLcdPage == 4) {

    setLcdCursor(0, 0);

    lcdPrintString("Select Relay: R");
    lcdPrintString(
      String(selectedRelayIndex + 1).c_str()
    );

    setLcdCursor(0, 1);

    lcdPrintString("Status: ");

    lcdPrintString(
      (relayState & (1 << selectedRelayIndex))
        ? "ON "
        : "OFF"
    );
  }
}

// ============================================================
// ACTUATOR COMMAND PARSER
// ============================================================

// Accepted commands:
//
// R1_ON
// R1_OFF
// R2_ON
// R2_OFF
// R3_ON
// R3_OFF
// R4_ON
// R4_OFF
// R5_ON
// R5_OFF
// RALL_ON
// RALL_OFF
//
// Commands can come from the Raspberry Pi or HC-06.

void processActuatorCommand(String cmd) {

  cmd.trim();

  // Handle all-relay commands FIRST.
  // This avoids accidentally interpreting RALL_ON as R1_ON.

  if (cmd == "RALL_ON") {

    relayState = 0x1F;
  }

  else if (cmd == "RALL_OFF") {

    relayState = 0x00;
  }

  // Handle individual relay commands.

  else if (
    cmd.length() >= 5 &&
    cmd.charAt(0) == 'R' &&
    cmd.charAt(1) >= '1' &&
    cmd.charAt(1) <= '5'
  ) {

    int relayNum = cmd.charAt(1) - '0';

    if (cmd.endsWith("_ON")) {

      relayState |= (1 << (relayNum - 1));
    }

    else if (cmd.endsWith("_OFF")) {

      relayState &= ~(1 << (relayNum - 1));
    }
  }

  // Apply updated relay state.

  updateRelays(relayState);

  // Refresh the LCD if a relay-related page is active.

  if (currentLcdPage == 4 || currentLcdPage == 3) {

    updateLCDDisplay();
  }

  // Send a confirmation to the Raspberry Pi.
  // Python can read this as a separate serial line.

  Serial.print("ACK:");
  Serial.println(cmd);
}

// ============================================================
// TELEMETRY: SEND SENSOR DATA TO RASPBERRY PI AND BLUETOOTH
// ============================================================

void sendTelemetry() {

  String telemetry =
    "{\"co2\":" + String(co2Value) +
    ",\"moisture\":" + String(moistureValue) +
    ",\"light\":" + String(ldrValue) +
    ",\"temperature\":" + String(temperature, 1) +
    ",\"humidity\":" + String(humidity, 1) +
    ",\"RLY\":" + String(relayState) +
    "}";

  // Raspberry Pi receives JSON through the Arduino USB cable.
  Serial.println(telemetry);

  // Bluetooth receives the same telemetry.
  btSerial.println(telemetry);
}

// ============================================================
// SETUP
// ============================================================

void setup() {

  // ----------------------------------------------------------
  // USB SERIAL: RASPBERRY PI 4
  // ----------------------------------------------------------

  Serial.begin(115200);

  // ----------------------------------------------------------
  // BLUETOOTH HC-06
  // ----------------------------------------------------------

  btSerial.begin(9600);

  pinMode(BT_STATE_PIN, INPUT);

  // ----------------------------------------------------------
  // I2C BUS: TEMPERATURE / HUMIDITY SENSOR
  // ----------------------------------------------------------

  Wire.begin();

  // ----------------------------------------------------------
  // LCD SHIFT REGISTER PINS
  // ----------------------------------------------------------

  pinMode(SR1_DS_PIN, OUTPUT);
  pinMode(SR1_SHCP_PIN, OUTPUT);
  pinMode(SR1_STCP_PIN, OUTPUT);

  // ----------------------------------------------------------
  // RELAY SHIFT REGISTER PINS
  // ----------------------------------------------------------

  pinMode(SR2_DS_PIN, OUTPUT);
  pinMode(SR2_SHCP_PIN, OUTPUT);
  pinMode(SR2_STCP_PIN, OUTPUT);

  // ----------------------------------------------------------
  // INITIALIZE RELAYS OFF
  // ----------------------------------------------------------

  updateRelays(0x00);

  // ----------------------------------------------------------
  // INITIALIZE LCD
  // ----------------------------------------------------------

  initLCD();

  // ----------------------------------------------------------
  // INITIALIZE INFRARED RECEIVER
  // ----------------------------------------------------------

  IrReceiver.begin(
    IR_RECEIVE_PIN,
    DISABLE_LED_FEEDBACK
  );

  // ----------------------------------------------------------
  // INITIAL DISPLAY
  // ----------------------------------------------------------

  updateLCDDisplay();

  lastIrPressTime = millis();
}

// ============================================================
// MAIN LOOP
// ============================================================

void loop() {

  // ----------------------------------------------------------
  // 1. READ SENSORS EVERY 500 ms
  // ----------------------------------------------------------

  if (millis() - lastSensorRead >= 500) {

    lastSensorRead = millis();

    ldrValue = analogRead(LDR_PIN);

    co2Value = analogRead(CO2_PIN);

    moistureValue = analogRead(MOISTURE_PIN);

    readI2CDHT();
  }

  // ----------------------------------------------------------
  // 2. AUTO-SCROLL WELCOME MESSAGE
  // ----------------------------------------------------------

  if (
    currentLcdPage == 0 &&
    millis() - lastMarqueeScroll >= 350
  ) {

    lastMarqueeScroll = millis();

    marqueeIndex =
      (marqueeIndex + 1) % welcomeLen;

    updateLCDDisplay();
  }

  // ----------------------------------------------------------
  // 3. RETURN TO WELCOME PAGE AFTER 10 SECONDS
  // ----------------------------------------------------------

  if (
    currentLcdPage != 0 &&
    millis() - lastIrPressTime > 10000
  ) {

    currentLcdPage = 0;

    updateLCDDisplay();
  }

  // ----------------------------------------------------------
  // 4. INFRARED REMOTE CONTROL
  // ----------------------------------------------------------

  if (IrReceiver.decode()) {

    if (
      !(IrReceiver.decodedIRData.flags &
        IRDATA_FLAGS_IS_REPEAT)
    ) {

      uint16_t command =
        IrReceiver.decodedIRData.command;

      lastIrPressTime = millis();

      switch (command) {

        // Next LCD page
        case IR_BTN_RIGHT:

          currentLcdPage =
            (currentLcdPage + 1) % 5;

          updateLCDDisplay();

          break;

        // Previous LCD page
        case IR_BTN_LEFT:

          currentLcdPage =
            (currentLcdPage + 4) % 5;

          updateLCDDisplay();

          break;

        // Select next relay
        case IR_BTN_UP:

          selectedRelayIndex =
            (selectedRelayIndex + 1) % 5;

          currentLcdPage = 4;

          updateLCDDisplay();

          break;

        // Select previous relay
        case IR_BTN_DOWN:

          selectedRelayIndex =
            (selectedRelayIndex + 4) % 5;

          currentLcdPage = 4;

          updateLCDDisplay();

          break;

        // Toggle selected relay
        case IR_BTN_OK:

          relayState ^=
            (1 << selectedRelayIndex);

          updateRelays(relayState);

          currentLcdPage = 4;

          updateLCDDisplay();

          break;

        default:

          break;
      }
    }

    IrReceiver.resume();
  }

  // ----------------------------------------------------------
  // 5. RECEIVE COMMANDS FROM RASPBERRY PI OVER USB
  // ----------------------------------------------------------

  if (Serial.available() > 0) {

    String piCmd = Serial.readStringUntil('\n');

    processActuatorCommand(piCmd);
  }

  // ----------------------------------------------------------
  // 6. RECEIVE COMMANDS FROM HC-06 BLUETOOTH
  // ----------------------------------------------------------

  if (btSerial.available() > 0) {

    String btCmd = btSerial.readStringUntil('\n');

    processActuatorCommand(btCmd);
  }

  // ----------------------------------------------------------
  // 7. SEND TELEMETRY EVERY SECOND
  // ----------------------------------------------------------

  if (millis() - lastSerialSend >= 1000) {

    lastSerialSend = millis();

    sendTelemetry();
  }
}
