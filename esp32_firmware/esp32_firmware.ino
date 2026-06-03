/*
  ========================================================================
  AERO SPRAY SYSTEM - ESP32 & SENSIRION SPS30 ARDUINO FIRMWARE (I2C)
  ========================================================================
  Hardware Wiring Guide for ESP32-S3 & SPS30:
  1. Sensirion SPS30 Sensor (Standard 5-Pin Connector):
     - Connector Pinout (looking at the JST-ZH connector on the sensor):
       * Pin 1: VDD (Power)      -> Connect to ESP32-S3 5V / VBUS (Must be 5V for internal fan/laser!)
       * Pin 2: SDA              -> Connect to ESP32-S3 SDA Pin (GPIO 8)
       * Pin 3: SCL              -> Connect to ESP32-S3 SCL Pin (GPIO 9)
       * Pin 4: SEL (Select)     -> Connect to ESP32-S3 GND (CRITICAL: MUST BE GND TO CHOOSE I2C MODE!)
       * Pin 5: GND (Ground)     -> Connect to ESP32-S3 GND Common Ground
     - Note: Pull-up resistors (4.7k Ohm) are recommended on the SDA and SCL lines to 3.3V.

  2. 5V/12V Water Pump Relay Module:
     - Connect control signal to ESP32-S3:
       * ESP32-S3 GPIO 35        -> Relay Trigger Input Pin
       * VCC                     -> 5V (or 3.3V depending on your module)
       * GND                     -> GND Common Ground
     - The pump motor wiring is in series with the Relay Common (COM) and Normally Open (NO) terminals.
  ========================================================================
*/

#include <WiFi.h>
#include <HTTPClient.h>
#include <WiFiClientSecure.h>
#include <ESPAsyncWebServer.h>
#include <Wire.h>
#include <SensirionI2cSps30.h>
#include <ArduinoJson.h>

// WiFi Settings - Modify with your local network details
const char* ssid = "OnePlus 7T-5acc";
const char* password = "TESTnode13";

// Direct HTTP Database Logging (Optional direct log bypassing frontend bridging)
bool enableDirectLogging = false; 
const char* dbServerEndpoint = "http://192.168.1.100:3000/api/readings"; // Replace with your server's IP address
unsigned long lastDbPostTime = 0;
const unsigned long DB_POST_INTERVAL = 6000; // Log to DB every 6 seconds

// Hardware Mappings
const int RELAY_PIN = 35;
// I2C Pin Mappings for ESP32-S3 and SPS30 I2C interface
const int SDA_PIN = 8;  // Connects to SPS30 Pin 2 (SDA)
const int SCL_PIN = 9;  // Connects to SPS30 Pin 3 (SCL)

// Global Servers Initialization
AsyncWebServer server(80);
AsyncWebSocket ws("/ws");

// Sensor Handler & Error Definitions
#ifdef NO_ERROR
#undef NO_ERROR
#endif
#define NO_ERROR 0

SensirionI2cSps30 sensor;
static char errorMessage[64];
static int16_t error;

// Threshold states (Shared between WebSocket requests and automated runs)
float thresholdPM25 = 35.0;
int sprayDurationSec = 10;
bool isManualMode = false;
bool isRelayActive = false;
unsigned long sprayStartTime = 0;
float latestPM25 = 0.0; // Cache for the automated spray trigger

// Sensor readings cache (Global variables)
float massPM1 = 4.8;
float massPM25 = 11.2;
float massPM4 = 15.6;
float massPM10 = 20.8;
float numPM05 = 120.0;
float numPM1 = 210.0;
float numPM25 = 45.0;
float numPM4 = 10.0;
float numPM10 = 3.0;
float typSize = 0.41;

// Package data and stream to all active WebSocket listeners
void notifyClients(String payload) {
  ws.textAll(payload);
}

// Packages all readings and variables into a single JSON payload
void sendSystemStatus() {
  StaticJsonDocument<512> doc;
  
  uint16_t dataReadyFlag = 0;
  error = sensor.readDataReadyFlag(dataReadyFlag);
  if (error == NO_ERROR && dataReadyFlag) {
    uint16_t mc1p0 = 0, mc2p5 = 0, mc4p0 = 0, mc10p0 = 0;
    uint16_t nc0p5 = 0, nc1p0 = 0, nc2p5 = 0, nc4p0 = 0, nc10p0 = 0;
    uint16_t typicalParticleSize = 0;

    error = sensor.readMeasurementValuesUint16(
      mc1p0, mc2p5, mc4p0, mc10p0,
      nc0p5, nc1p0, nc2p5, nc4p0,
      nc10p0, typicalParticleSize
    );
    if (error == NO_ERROR) {
      massPM1 = mc1p0 / 10.0;
      massPM25 = mc2p5 / 10.0;
      massPM4 = mc4p0 / 10.0;
      massPM10 = mc10p0 / 10.0;
      numPM05 = nc0p5 / 10.0;
      numPM1 = nc1p0 / 10.0;
      numPM25 = nc2p5 / 10.0;
      numPM4 = nc4p0 / 10.0;
      numPM10 = nc10p0 / 10.0;
      typSize = typicalParticleSize / 10.0;
      latestPM25 = massPM25;
    } else {
      Serial.print("readMeasurementValuesUint16 failed: ");
      errorToString(error, errorMessage, sizeof errorMessage);
      Serial.println(errorMessage);
    }
  } else if (error != NO_ERROR) {
    Serial.print("readDataReadyFlag failed: ");
    errorToString(error, errorMessage, sizeof errorMessage);
    Serial.println(errorMessage);
  }

  // Bind values to JSON object
  doc["pm1"] = massPM1;
  doc["pm25"] = massPM25;
  doc["pm4"] = massPM4;
  doc["pm10"] = massPM10;
  
  doc["nc05"] = numPM05;
  doc["nc1"] = numPM1;
  doc["nc25"] = numPM25;
  doc["nc4"] = numPM4;
  doc["nc10"] = numPM10;
  
  doc["tps"] = typSize;
  doc["relay"] = isRelayActive ? 1 : 0;
  doc["mode"] = isManualMode ? "manual" : "auto";
  
  String output;
  serializeJson(doc, output);
  notifyClients(output);
}

// Processes JSON controls sent from the dashboard
void handleWebSocketMessage(void *arg, uint8_t *data, size_t len) {
  AwsFrameInfo *info = (AwsFrameInfo*)arg;
  if (info->final && info->index == 0 && info->len == len && info->opcode == WS_TEXT) {
    data[len] = 0;
    String message = (char*)data;
    Serial.println("Received Control Packet: " + message);
    
    StaticJsonDocument<256> doc;
    DeserializationError error = deserializeJson(doc, message);
    if (error) return;

    // Relay commands
    if (doc.containsKey("command")) {
      String cmd = doc["command"].as<String>();
      if (cmd == "spray_on") {
        isRelayActive = true;
        digitalWrite(RELAY_PIN, HIGH);
        Serial.println("Pump motor switched ON via Manual Command.");
        sendSystemStatus();
      } else if (cmd == "spray_off") {
        isRelayActive = false;
        digitalWrite(RELAY_PIN, LOW);
        Serial.println("Pump motor switched OFF via Manual Command.");
        sendSystemStatus();
      } else if (cmd == "set_mode_manual") {
        isManualMode = true;
        Serial.println("Mode changed: MANUAL");
      } else if (cmd == "set_mode_auto") {
        isManualMode = false;
        isRelayActive = false;
        digitalWrite(RELAY_PIN, LOW);
        Serial.println("Mode changed: AUTOMATIC. Relay reset to standby.");
      }
    }
    
    // Config updates
    if (doc.containsKey("threshold")) {
      thresholdPM25 = doc["threshold"].as<float>();
      Serial.printf("PM2.5 Threshold updated: %.1f µg/m3\n", thresholdPM25);
    }
    
    if (doc.containsKey("duration")) {
      sprayDurationSec = doc["duration"].as<int>();
      Serial.printf("Spray duration updated: %d seconds\n", sprayDurationSec);
    }
  }
}

// Websocket Events Router
void onEvent(AsyncWebSocket *server, AsyncWebSocketClient *client, AwsEventType type,
             void *arg, uint8_t *data, size_t len) {
  switch (type) {
    case WS_EVT_CONNECT:
      Serial.printf("Dashboard client connected (ID: %u)\n", client->id());
      sendSystemStatus();
      break;
    case WS_EVT_DISCONNECT:
      Serial.printf("Dashboard client disconnected (ID: %u)\n", client->id());
      break;
    case WS_EVT_DATA:
      handleWebSocketMessage(arg, data, len);
      break;
    case WS_EVT_PONG:
    case WS_EVT_ERROR:
      break;
  }
}

void setup() {
  Serial.begin(115200);
  
  // Relay control setup
  pinMode(RELAY_PIN, OUTPUT);
  digitalWrite(RELAY_PIN, LOW);

  // Initialize I2C interface with custom SDA and SCL pins
  Wire.begin(SDA_PIN, SCL_PIN);
  sensor.begin(Wire, SPS30_I2C_ADDR_69);

  sensor.stopMeasurement();
  delay(500);

  int8_t serialNumber[32] = {0};
  int8_t productType[8] = {0};
  
  error = sensor.readSerialNumber(serialNumber, 32);
  if (error != NO_ERROR) {
    Serial.print("Error trying to execute readSerialNumber(): ");
    errorToString(error, errorMessage, sizeof errorMessage);
    Serial.println(errorMessage);
  } else {
    Serial.print("Serial Number : ");
    Serial.println((const char*)serialNumber);
  }

  error = sensor.readProductType(productType, 8);
  if (error != NO_ERROR) {
    Serial.print("Error trying to execute readProductType(): ");
    errorToString(error, errorMessage, sizeof errorMessage);
    Serial.println(errorMessage);
  } else {
    Serial.print("Product Type  : ");
    Serial.println((const char*)productType);
  }

  error = sensor.startMeasurement(SPS30_OUTPUT_FORMAT_OUTPUT_FORMAT_UINT16);
  if (error != NO_ERROR) {
    Serial.print("Error trying to execute startMeasurement(): ");
    errorToString(error, errorMessage, sizeof errorMessage);
    Serial.println(errorMessage);
  } else {
    Serial.println("[OK] SPS30 started measurements successfully.");
  }

  // Connect to Local WiFi network
  WiFi.begin(ssid, password);
  Serial.print("Connecting to WiFi Network");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("");
  Serial.println("[OK] Connected to WiFi network successfully.");
  Serial.print("ESP32 Station IP Address: ");
  Serial.println(WiFi.localIP());

  // Attach WebSocket handlers
  ws.onEvent(onEvent);
  server.addHandler(&ws);
  
  // Startup web server
  server.begin();
  Serial.println("[OK] Server listening on HTTP port 80.");
}

void loop() {
  ws.cleanupClients();
  
  // Sensor readout interval (Every 2 seconds)
  static unsigned long lastReading = 0;
  if (millis() - lastReading > 2000) {
    lastReading = millis();
    sendSystemStatus();
    
    // Automating air purification mist loops
    if (!isManualMode) {
      // Auto Start Trigger
      if (latestPM25 > thresholdPM25 && !isRelayActive) {
        isRelayActive = true;
        digitalWrite(RELAY_PIN, HIGH);
        sprayStartTime = millis();
        Serial.printf("Automated spray initiated: PM2.5 (%.1f) > Threshold (%.1f)\n", latestPM25, thresholdPM25);
        sendSystemStatus();
      }
      
      // Auto Stop Duration check
      if (isRelayActive && (millis() - sprayStartTime > (sprayDurationSec * 1000))) {
        isRelayActive = false;
        digitalWrite(RELAY_PIN, LOW);
        Serial.println("Automated spray cycle completed. Standby.");
        sendSystemStatus();
      }
    }
  }

  // Direct database HTTP POST if enabled (Throttled to DB_POST_INTERVAL)
  if (enableDirectLogging && (millis() - lastDbPostTime > DB_POST_INTERVAL)) {
    lastDbPostTime = millis();
    if (WiFi.status() == WL_CONNECTED) {
      HTTPClient http;
      if (String(dbServerEndpoint).startsWith("https")) {
        WiFiClientSecure client;
        client.setInsecure();
        http.begin(client, dbServerEndpoint);
      } else {
        http.begin(dbServerEndpoint);
      }
      http.addHeader("Content-Type", "application/json");

      StaticJsonDocument<512> postDoc;
      postDoc["pm1"] = massPM1;
      postDoc["pm25"] = massPM25;
      postDoc["pm4"] = massPM4;
      postDoc["pm10"] = massPM10;
      postDoc["nc05"] = numPM05;
      postDoc["nc1"] = numPM1;
      postDoc["nc25"] = numPM25;
      postDoc["nc4"] = numPM4;
      postDoc["nc10"] = numPM10;
      postDoc["tps"] = typSize;
      postDoc["relay"] = isRelayActive ? 1 : 0;
      postDoc["mode"] = isManualMode ? "manual" : "auto";
      postDoc["source"] = "esp32";

      String jsonPayload;
      serializeJson(postDoc, jsonPayload);

      int httpResponseCode = http.POST(jsonPayload);
      if (httpResponseCode > 0) {
        Serial.printf("Direct DB Log SUCCESS: HTTP %d\n", httpResponseCode);
      } else {
        Serial.printf("Direct DB Log FAILED: Error code %d\n", httpResponseCode);
      }
      http.end();
    }
  }

  delay(10);
}
