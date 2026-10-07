# HostelGuard AI — Android SMS Gateway

Companion Android application and local gateway service that turns any physical Android smartphone with an active SIM card into an automated emergency SMS dispatcher for **HostelGuard AI**.

---

## 1. Architecture

```
CCTV / Computer Vision Feeds
           ↓
   Detection Engines
           ↓
   Incident Engine
           ↓
Severity Assessment
           ↓
HIGH or CRITICAL Severity?
           ↓
   ┌───────────────┐
   │               │
   ▼               ▼
WhatsApp          SMS
   │               │
   ▼               ▼
Warden Mobile   Android SMS Gateway (Local Wi-Fi)
                   ↓
               Physical SIM Network
                   ↓
               Real Emergency SMS
                   ↓
               Warden Phone (+91 7843006100)
```

- **HostelGuard Backend (FastAPI)**: Decides *when* an emergency SMS should be dispatched (HIGH and CRITICAL alerts only) and enforces duplicate alert deduplication.
- **Android Phone**: Acts as the physical hardware transmitter. Listens for authenticated HTTP requests on local Wi-Fi port `8080` and transmits genuine SMS text messages using the device's SIM card and cellular network.

---

## 2. Android App Features

- **Real-Time Gateway Status**: Displays `● GATEWAY ONLINE` badge with device IP and port.
- **Physical SIM Monitor**: Displays carrier name and radio readiness.
- **Direct Test Button**: `[ SEND TEST SMS VIA SIM ]` triggers a local SIM test right from the phone.
- **Foreground Service**: Runs with a persistent notification and wake lock so the gateway continues listening even when the screen is locked or the app is minimized.
- **Live Audit Logs**: Displays a scrollable terminal showing incoming HTTP triggers, timestamps, and SMS delivery statuses.

---

## 3. Quick Setup & Installation

### Option A: Open & Build in Android Studio
1. Open **Android Studio**.
2. Select **Open an Existing Project** and navigate to:
   ```
   c:\Users\Aniket19\OneDrive\Desktop\Hostel_Mnagement\android_gateway
   ```
3. Connect your Android phone via USB (enable **USB Debugging** in Developer Options) or use Wi-Fi pairing.
4. Click **Run 'app'** (`Shift + F10`) to build and install the APK onto your device.
5. On the phone, grant the **SEND_SMS** and **Phone State** permissions when prompted.

### Option B: Local Simulation Runner (Zero-Setup Backup)
If you want to test the entire FastAPI and React UI pipeline on your laptop without an Android phone connected:
```bash
python android_gateway/mock_gateway.py
```
This starts an identical HTTP server on `http://127.0.0.1:8080` that verifies Bearer keys, logs incoming alerts, and confirms SMS transmissions.

---

## 4. Connecting Android Phone to HostelGuard AI

1. **Connect to Same Wi-Fi**:
   Ensure your laptop running HostelGuard and your Android phone are connected to the same Wi-Fi network (or connect your laptop to your Android phone's Mobile Hotspot).

2. **Find Your Android Phone's Local IP**:
   - The **HostelGuard SMS Gateway** app displays your device IP prominently at the top of the screen:
     ```
     GATEWAY ENDPOINT
     http://192.168.1.105:8080
     ```
   - Alternatively on your phone: Go to **Settings → Wi-Fi → [Your Wi-Fi Name] → Details / Advanced → IP Address**.

3. **Configure HostelGuard `.env`**:
   Open `.env` in the root of the HostelGuard repository and set:
   ```ini
   SMS_ENABLED=True
   SMS_GATEWAY_URL=http://192.168.1.105:8080
   SMS_GATEWAY_API_KEY=hostelguard_sms_gateway_secret_2026
   WARDEN_PHONE_NUMBER=+917843006100
   ```

4. **Verify Gateway Connectivity**:
   In HostelGuard AI, navigate to **Settings (07)** → **Notifications**.
   Click **SEND TEST SMS →**.
   Your Android phone will immediately beep and transmit the test SMS!

---

## 5. Security & Authentication

- Every HTTP request to `POST /send-sms` requires:
  ```http
  Authorization: Bearer hostelguard_sms_gateway_secret_2026
  ```
- Unauthorized requests are rejected with `HTTP 401 Unauthorized`.
- Phone numbers and keys are loaded strictly from server-side environment variables and never exposed to the browser.

---

## 6. Message Format

### CRITICAL Alert (Possible Fall):
```text
HOSTELGUARD AI ALERT

Severity: CRITICAL
Incident: Possible person fall
Location: Block B - Floor 3
Camera: CAM-B-03
Confidence: 91%

Please verify immediately.
Incident: INC-1042
```

### HIGH Alert (Crowd Detected):
```text
HOSTELGUARD AI ALERT

Severity: HIGH
Incident: Crowd detected
Location: Block A - Floor 2
Camera: CAM-A-02
People: 12
Threshold: 8

Please verify.
Incident: INC-1041
```
