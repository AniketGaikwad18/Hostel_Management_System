from sqlalchemy.orm import Session
from datetime import datetime, timedelta
import json
import os

from backend.database import SessionLocal, engine, Base
from backend.models import User, Location, Camera, Incident, IncidentAction, Notification, SystemSetting
from backend.services.demo_generator import demo_generator

def seed_database():
    Base.metadata.create_all(bind=engine)
    demo_generator.generate_demo_assets()
    
    db: Session = SessionLocal()
    try:
        # If DB already has data, clear and reseed to ensure exact alignment
        db.query(Notification).delete()
        db.query(IncidentAction).delete()
        db.query(Incident).delete()
        db.query(Camera).delete()
        db.query(Location).delete()
        db.query(User).delete()
        db.query(SystemSetting).delete()
        db.commit()

        print("Seeding HostelGuard AI database...")

        # 1. WARDEN USER
        warden = User(
            name="Rajesh Sharma (Chief Warden)",
            role="Warden",
            email="warden@hostelguard.ai",
            phone="[CONFIGURED_WARDEN_PHONE]"
        )
        db.add(warden)
        db.commit()

        # 2. LOCATIONS
        loc_a_1 = Location(code="LOC-A-1", block="Block A", floor="Floor 1", wing="Main Corridor", name="Block A - 1st Floor Main")
        loc_a_2 = Location(code="LOC-A-2", block="Block A", floor="Floor 2", wing="East Corridor", name="Block A - 2nd Floor East")
        loc_b_0 = Location(code="LOC-B-0", block="Block B", floor="Ground Floor", wing="Maintenance Corridor", name="Block B - Ground Maintenance")
        loc_b_3 = Location(code="LOC-B-3", block="Block B", floor="Floor 3", wing="South Corridor", name="Block B - 3rd Floor South")

        locations = [loc_a_1, loc_a_2, loc_b_0, loc_b_3]
        db.add_all(locations)
        db.commit()

        # 3. 4 PRIMARY DASHBOARD CAMERAS (2x2 Grid)
        cameras_data = [
            {
                "code": "CAM-A-01",
                "name": "Block A 1F Main Corridor",
                "block": "Block A",
                "floor": "Floor 1",
                "corridor": "Main Corridor",
                "status": "NORMAL",
                "count": 3,
                "threshold": 8,
                "loc": loc_a_1
            },
            {
                "code": "CAM-A-02",
                "name": "Block A 2F East Corridor",
                "block": "Block A",
                "floor": "Floor 2",
                "corridor": "East Corridor",
                "status": "WARNING",
                "count": 12,
                "threshold": 8,
                "loc": loc_a_2
            },
            {
                "code": "CAM-B-01",
                "name": "Block B GF Maintenance",
                "block": "Block B",
                "floor": "Ground Floor",
                "corridor": "Maintenance Corridor",
                "status": "WARNING",
                "count": 1,
                "threshold": 0,
                "loc": loc_b_0
            },
            {
                "code": "CAM-B-03",
                "name": "Block B 3F South Corridor",
                "block": "Block B",
                "floor": "Floor 3",
                "corridor": "South Corridor",
                "status": "CRITICAL",
                "count": 1,
                "threshold": 1,
                "loc": loc_b_3
            }
        ]

        cam_objs = {}
        for c in cameras_data:
            cam = Camera(
                code=c["code"],
                name=c["name"],
                block=c["block"],
                floor=c["floor"],
                corridor=c["corridor"],
                is_online=True,
                current_status=c["status"],
                people_count=c["count"],
                crowd_threshold=c["threshold"],
                location_id=c["loc"].id,
                sample_video_key="corridor_normal"
            )
            db.add(cam)
            cam_objs[c["code"]] = cam
        db.commit()

        # 4. ACTIVE INCIDENTS (Exactly 3 Active Alerts, 1 Critical)
        now = datetime.utcnow()

        # Incident 1: Crowd Detected (CAM-A-02)
        inc_crowd = Incident(
            code="INC-1041",
            type="CROWD_DETECTED",
            severity="HIGH",
            status="DETECTED",
            camera_id=cam_objs["CAM-A-02"].id,
            location_id=loc_a_2.id,
            confidence=0.94,
            duration=34.0,
            description="⚠️ High crowd detected in Block A, Floor 2, East Corridor. 12 people detected (threshold: 8).",
            ai_observation="12 people detected in East Corridor region, exceeding configured safe threshold of 8.",
            snapshot_url="/uploads/snapshots/cam-a-02_incident.jpg",
            detected_at=now - timedelta(minutes=2),
            created_at=now - timedelta(minutes=2)
        )
        db.add(inc_crowd)
        db.commit()
        db.refresh(inc_crowd)

        # Incident 2: Possible Fall (CAM-B-03)
        inc_fall = Incident(
            code="INC-1042",
            type="POSSIBLE_FALL",
            severity="CRITICAL",
            status="DETECTED",
            camera_id=cam_objs["CAM-B-03"].id,
            location_id=loc_b_3.id,
            confidence=0.91,
            duration=7.2,
            description="🚨 Possible person fall detected in Block B, Floor 3, South Corridor.",
            ai_observation="Person detected in a horizontal position within the monitored corridor region for 7.2 seconds.",
            snapshot_url="/uploads/snapshots/cam-b-03_incident.jpg",
            detected_at=now - timedelta(minutes=2),
            created_at=now - timedelta(minutes=2)
        )
        db.add(inc_fall)
        db.commit()
        db.refresh(inc_fall)

        # Incident 3: Restricted Area (CAM-B-01)
        inc_restricted = Incident(
            code="INC-1040",
            type="RESTRICTED_AREA_ENTRY",
            severity="HIGH",
            status="DETECTED",
            camera_id=cam_objs["CAM-B-01"].id,
            location_id=loc_b_0.id,
            confidence=0.94,
            duration=15.0,
            description="⚠️ Unusual movement detected in restricted area in Block B, Ground Floor, Maintenance Corridor.",
            ai_observation="Person detected inside restricted maintenance corridor zone during active monitoring.",
            snapshot_url="/uploads/snapshots/cam-b-01_incident.jpg",
            detected_at=now - timedelta(minutes=3),
            created_at=now - timedelta(minutes=3)
        )
        db.add(inc_restricted)
        db.commit()
        db.refresh(inc_restricted)

        # 9 Historical Resolved Incidents to make Today's Incidents = 12
        past_types = [
            ("CROWD_DETECTED", "HIGH", cam_objs["CAM-A-02"], loc_a_2, 45, "Study group dispersed naturally."),
            ("RESTRICTED_AREA_ENTRY", "HIGH", cam_objs["CAM-B-01"], loc_b_0, 80, "Authorized electrician badge verified."),
            ("CROWD_DETECTED", "HIGH", cam_objs["CAM-A-02"], loc_a_2, 120, "Corridor cleared by floor warden."),
            ("POSSIBLE_FALL", "CRITICAL", cam_objs["CAM-A-01"], loc_a_1, 160, "Student dropped books; verified safe."),
            ("RESTRICTED_AREA_ENTRY", "HIGH", cam_objs["CAM-B-01"], loc_b_0, 210, "Housekeeping staff completed task."),
            ("CROWD_DETECTED", "HIGH", cam_objs["CAM-A-02"], loc_a_2, 260, "Hallway cleared."),
            ("POSSIBLE_FALL", "CRITICAL", cam_objs["CAM-B-03"], loc_b_3, 310, "False alarm (shoelace tying) verified."),
            ("RESTRICTED_AREA_ENTRY", "HIGH", cam_objs["CAM-B-01"], loc_b_0, 370, "Security inspected access lock."),
            ("CROWD_DETECTED", "HIGH", cam_objs["CAM-A-02"], loc_a_2, 420, "Evening queue dispersed.")
        ]

        for i, (p_type, p_sev, p_cam, p_loc, p_mins, p_notes) in enumerate(past_types):
            d_time = now - timedelta(minutes=p_mins)
            a_time = d_time + timedelta(minutes=1, seconds=15)
            r_time = a_time + timedelta(minutes=2, seconds=30)
            
            p_inc = Incident(
                code=f"INC-{1039 - i}",
                type=p_type,
                severity=p_sev,
                status="RESOLVED",
                camera_id=p_cam.id,
                location_id=p_loc.id,
                confidence=0.92,
                duration=12.0,
                description=f"Automated AI detection on {p_cam.code}.",
                ai_observation=f"Standard safety detection on {p_cam.name}.",
                snapshot_url=f"/uploads/snapshots/{p_cam.code.lower()}_incident.jpg",
                detected_at=d_time,
                acknowledged_at=a_time,
                resolved_at=r_time,
                resolution_notes=p_notes,
                created_at=d_time
            )
            db.add(p_inc)

        # 5. INITIAL NOTIFICATIONS
        notif_fall = Notification(
            incident_id=inc_fall.id,
            provider="WHATSAPP",
            recipient="[WARDEN_PHONE]",
            message_body="🚨 HOSTELGUARD AI\nSAFETY ALERT\n\n🚨 Possible person fall detected\n\n📍 Block B • Floor 3\nCorridor: South Corridor\n\n📊 Confidence: 91%\n\n🕐 09:42 PM\n\nSeverity: CRITICAL\n\nPlease verify the situation.\n\nIncident ID: INC-1042",
            status="SIMULATED_SENT",
            sent_at=now - timedelta(minutes=2)
        )
        notif_crowd = Notification(
            incident_id=inc_crowd.id,
            provider="WHATSAPP",
            recipient="[WARDEN_PHONE]",
            message_body="🚨 HOSTELGUARD AI\nSAFETY ALERT\n\n⚠️ Crowd detected\n\n📍 Block A • Floor 2\nCorridor: East Corridor\n\n👥 People: 12\nThreshold: 8\n\n📊 Confidence: 94%\n\n🕐 09:42 PM\n\nSeverity: HIGH\n\nPlease verify the situation.\n\nIncident ID: INC-1041",
            status="SIMULATED_SENT",
            sent_at=now - timedelta(minutes=2)
        )
        notif_restricted = Notification(
            incident_id=inc_restricted.id,
            provider="WHATSAPP",
            recipient="[WARDEN_PHONE]",
            message_body="🚨 HOSTELGUARD AI\nSAFETY ALERT\n\n⚠️ Restricted area movement detected\n\n📍 Block B • Ground Floor\nCorridor: Maintenance Corridor\n\n📊 Confidence: 94%\n\n🕐 09:41 PM\n\nSeverity: HIGH\n\nPlease verify the situation.\n\nIncident ID: INC-1040",
            status="SIMULATED_SENT",
            sent_at=now - timedelta(minutes=3)
        )
        db.add_all([notif_fall, notif_crowd, notif_restricted])

        # 6. INCIDENT ACTIONS
        act1 = IncidentAction(incident_id=inc_fall.id, user_name="AI Detection System", action_type="DETECTED", notes="Fallen posture detected > 3s (confidence 91%).", timestamp=now - timedelta(minutes=2))
        act2 = IncidentAction(incident_id=inc_crowd.id, user_name="AI Detection System", action_type="DETECTED", notes="Crowd count 12 exceeded limit 8.", timestamp=now - timedelta(minutes=2))
        act3 = IncidentAction(incident_id=inc_restricted.id, user_name="AI Detection System", action_type="DETECTED", notes="Movement inside restricted zone.", timestamp=now - timedelta(minutes=3))
        db.add_all([act1, act2, act3])

        # 7. SYSTEM SETTINGS
        settings_data = [
            ("CROWD_THRESHOLD", "8"),
            ("FALL_CONFIDENCE_THRESHOLD", "0.80"),
            ("FALL_DURATION_THRESHOLD", "3.0"),
            ("DEMO_NOTIFICATION_MODE", "True"),
            ("RESTRICTED_HOURS_START", "22:00"),
            ("RESTRICTED_HOURS_END", "06:00"),
            ("NOTIFICATION_COOLDOWN", "60")
        ]
        for k, v in settings_data:
            db.add(SystemSetting(key=k, value=v))

        db.commit()
        print("Database seeded with 4 primary cameras, 3 active alerts, 1 critical alert, 12 today's incidents!")
    except Exception as e:
        print(f"Error seeding database: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
