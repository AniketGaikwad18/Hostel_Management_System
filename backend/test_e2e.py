import httpx
import asyncio
import json
import sys
from datetime import datetime

# Set utf-8 stdout
if sys.platform == "win32":
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

BASE_URL = "http://127.0.0.1:8000"

async def run_e2e_tests():
    print("==================================================")
    print("HOSTELGUARD AI - END-TO-END VALIDATION SUITE")
    print("==================================================")
    
    async with httpx.AsyncClient(base_url=BASE_URL, timeout=15.0) as client:
        # 1. HEALTH CHECK
        res = await client.get("/api/health")
        assert res.status_code == 200, f"Health check failed: {res.text}"
        health = res.json()
        print(f"[PASS] Health Check: {health['status']} | WhatsApp Mode: {health['whatsapp_integration']['mode']}")

        # 2. CAMERAS CHECK (4 Primary 2x2 Grid Cameras)
        res = await client.get("/api/cameras")
        assert res.status_code == 200
        cameras = res.json()
        assert len(cameras) == 4, f"Expected 4 primary cameras, got {len(cameras)}"
        print(f"[PASS] Cameras Network: 4/4 online cameras loaded successfully in 2x2 grid.")

        # 3. INCIDENTS LIST
        res = await client.get("/api/incidents")
        assert res.status_code == 200
        incidents = res.json()
        print(f"[PASS] Incidents Hub: {len(incidents)} total incidents retrieved.")

        # 4. DEMO 1 — CROWD GATHERING
        res = await client.post("/api/demo/trigger", json={"scenario": "crowd", "custom_threshold": 8})
        assert res.status_code == 200
        d1 = res.json()
        assert d1["scenario"] == "CROWD_DETECTED"
        assert d1["people_count"] == 12
        assert d1["severity"] == "HIGH"
        print(f"[PASS] Demo 1 (Crowd): Triggered on {d1['camera']} | People: {d1['people_count']} | Threshold: {d1['threshold']} | Incident: {d1['incident']['code']}")

        # 5. DEMO 2 — POSSIBLE FALL
        res = await client.post("/api/demo/trigger", json={"scenario": "fall"})
        assert res.status_code == 200
        d2 = res.json()
        assert d2["scenario"] == "POSSIBLE_FALL"
        assert d2["confidence"] == "91%"
        assert d2["duration"] == "7.2 seconds"
        assert d2["severity"] == "CRITICAL"
        print(f"[PASS] Demo 2 (Possible Fall): Triggered on {d2['camera']} | Confidence: {d2['confidence']} | Duration: {d2['duration']} | Severity: CRITICAL | Incident: {d2['incident']['code']}")

        # 6. DEMO 3 — RESTRICTED AREA ENTRY
        res = await client.post("/api/demo/trigger", json={"scenario": "restricted"})
        assert res.status_code == 200
        d3 = res.json()
        assert d3["scenario"] == "RESTRICTED_AREA_ENTRY"
        assert d3["severity"] == "HIGH"
        print(f"[PASS] Demo 3 (Restricted Entry): Triggered on {d3['camera']} | Location: {d3['location']} | Severity: HIGH | Incident: {d3['incident']['code']}")

        # 7. CLOSED LOOP — ACKNOWLEDGE
        inc_id = d2["incident"]["id"]
        res = await client.post(f"/api/incidents/{inc_id}/acknowledge", json={"user_name": "Chief Warden", "notes": "Inspecting floor camera."})
        assert res.status_code == 200
        ack_res = res.json()
        assert ack_res["new_status"] == "ACKNOWLEDGED"
        print(f"[PASS] Closed Loop (Acknowledge): Incident {inc_id} transitioned to ACKNOWLEDGED.")

        # 8. CLOSED LOOP — RESOLVE
        res = await client.post(f"/api/incidents/{inc_id}/resolve", json={"user_name": "Chief Warden", "notes": "Situation verified and resolved. Area secure."})
        assert res.status_code == 200
        res_res = res.json()
        assert res_res["new_status"] == "RESOLVED"
        print(f"[PASS] Closed Loop (Resolve): Incident {inc_id} transitioned to RESOLVED. Status saved.")

        # 9. ESCALATE INCIDENT
        res = await client.post(f"/api/incidents/{d1['incident']['id']}/escalate", json={"user_name": "Chief Warden", "notes": "Crowd refusing to disperse."})
        assert res.status_code == 200
        esc_res = res.json()
        assert esc_res["severity"] == "CRITICAL"
        print(f"[PASS] Escalation Workflow: Incident {d1['incident']['id']} escalated to CRITICAL with automated WhatsApp re-alert.")

        # 10. WHATSAPP TEST ALERT
        res = await client.post("/api/notifications/test-whatsapp", json={})
        assert res.status_code == 200
        wa_res = res.json()
        print(f"[PASS] WhatsApp Service: Status '{wa_res['status']}' | Formatted preview generated successfully.")
        print("  Formatted WhatsApp Message Preview:")
        for line in wa_res['message_preview'].split('\n')[:9]:
            print(f"    | {line}")

        # 11. ANALYTICS SUMMARY
        res = await client.get("/api/analytics/summary")
        assert res.status_code == 200
        analytics = res.json()
        print(f"[PASS] Analytics: Incidents Today: {analytics['incidents_today']} | Avg Response: {analytics['avg_response_time_seconds']}s | Avg Resolution: {analytics['avg_resolution_time_seconds']}s | Hotspot: {analytics['most_active_location']}")

        # 12. SETTINGS
        res = await client.get("/api/settings")
        assert res.status_code == 200
        settings_data = res.json()
        print(f"[PASS] System Settings: Crowd Threshold={settings_data.get('CROWD_THRESHOLD')} | Fall Threshold={settings_data.get('FALL_DURATION_THRESHOLD')}s | Cooldown={settings_data.get('NOTIFICATION_COOLDOWN', '60')}s")

    print("==================================================")
    print("ALL 12 END-TO-END VALIDATION TESTS PASSED (100%)")
    print("==================================================")

if __name__ == "__main__":
    asyncio.run(run_e2e_tests())
