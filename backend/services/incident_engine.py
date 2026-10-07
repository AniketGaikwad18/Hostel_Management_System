import json
import logging
from datetime import datetime, timedelta
from typing import Dict, Any, Optional
from sqlalchemy.orm import Session

from backend.models import Incident, Camera, Location, IncidentAction, Detection
from backend.schemas import DetectionResult
from backend.services.notification_service import notification_service
from backend.websocket_manager import ws_manager
from backend.config import settings

logger = logging.getLogger("hostelguard.incident_engine")

class IncidentEngine:
    """
    Central Event Processing Engine for HostelGuard AI:
    - Ingests Computer Vision detection events
    - Evaluates confidence threshold & temporal persistence
    - Enforces duplicate suppression / cooldown windows
    - Assigns appropriate severity
    - Creates or updates incident database records
    - Dispatches multi-channel notifications
    - Emits live WebSocket telemetry to Warden Console
    """
    def __init__(self):
        self.cooldown_seconds = settings.COOLDOWN_SUPPRESSION_SECONDS

    def _generate_incident_code(self, db: Session) -> str:
        count = db.query(Incident).count() + 1040
        return f"INC-{count}"

    async def process_detection(
        self,
        detection_result: DetectionResult,
        camera: Camera,
        db: Session,
        snapshot_url: Optional[str] = None,
        video_url: Optional[str] = None
    ) -> Optional[Incident]:
        if not detection_result.is_alert:
            # Update camera heartbeat and people count without creating an incident
            camera.people_count = detection_result.person_count
            camera.current_status = "NORMAL"
            camera.last_heartbeat = datetime.utcnow()
            db.commit()
            
            # Broadcast camera telemetry
            await ws_manager.broadcast("CAMERA_TELEMETRY", {
                "camera_id": camera.id,
                "camera_code": camera.code,
                "people_count": camera.people_count,
                "status": "NORMAL",
                "last_scan": "Just now"
            })
            return None

        # Check for active existing incident on the same camera to suppress duplicate spam
        recent_cutoff = datetime.utcnow() - timedelta(seconds=self.cooldown_seconds)
        existing_incident = db.query(Incident).filter(
            Incident.camera_id == camera.id,
            Incident.type == detection_result.detection_type,
            Incident.status.in_(["DETECTED", "ACKNOWLEDGED"]),
            Incident.created_at >= recent_cutoff
        ).first()

        if existing_incident:
            # Update existing incident metadata & duration
            logger.info(f"Updating active incident {existing_incident.code} on camera {camera.code}")
            existing_incident.confidence = max(existing_incident.confidence, detection_result.confidence)
            existing_incident.duration = detection_result.metadata.get("duration_seconds", existing_incident.duration)
            existing_incident.metadata_json = json.dumps(detection_result.metadata)
            camera.current_status = "CRITICAL" if existing_incident.severity == "CRITICAL" else "WARNING"
            camera.people_count = detection_result.person_count
            db.commit()
            
            await ws_manager.broadcast("INCIDENT_UPDATED", {
                "incident_id": existing_incident.id,
                "code": existing_incident.code,
                "confidence": existing_incident.confidence,
                "duration": existing_incident.duration,
                "people_count": camera.people_count,
                "status": existing_incident.status
            })
            return existing_incident

        # CREATE NEW INCIDENT
        incident_code = self._generate_incident_code(db)
        severity = detection_result.severity
        
        # Build clean, objective description
        type_titles = {
            "CROWD_DETECTED": f"High crowd detected in {camera.block}, {camera.floor}, {camera.corridor}.",
            "POSSIBLE_FALL": f"Possible person fall detected in {camera.block}, {camera.floor}, {camera.corridor}.",
            "RESTRICTED_AREA_ENTRY": f"Unusual movement detected in restricted zone in {camera.block}, {camera.floor}."
        }
        description = type_titles.get(detection_result.detection_type, f"Safety anomaly detected on {camera.code}.")

        new_incident = Incident(
            code=incident_code,
            type=detection_result.detection_type,
            severity=severity,
            status="DETECTED",
            camera_id=camera.id,
            location_id=camera.location_id,
            confidence=detection_result.confidence,
            duration=float(detection_result.metadata.get("duration_seconds", 0.0)),
            description=description,
            ai_observation=detection_result.ai_observation,
            snapshot_url=snapshot_url or f"/uploads/snapshots/{camera.code.lower()}_incident.jpg",
            video_url=video_url,
            metadata_json=json.dumps(detection_result.metadata),
            assigned_warden="Warden On Duty",
            detected_at=datetime.utcnow(),
            created_at=datetime.utcnow()
        )
        db.add(new_incident)
        
        # Update camera state
        camera.current_status = "CRITICAL" if severity == "CRITICAL" else "WARNING"
        camera.people_count = detection_result.person_count
        camera.last_heartbeat = datetime.utcnow()
        db.commit()
        db.refresh(new_incident)

        # Log initial action
        initial_action = IncidentAction(
            incident_id=new_incident.id,
            user_name="AI Detection System",
            action_type="DETECTED",
            notes=f"AI Computer Vision triggered alert with {int(new_incident.confidence * 100)}% confidence."
        )
        db.add(initial_action)
        db.commit()

        # DISPATCH REAL-TIME NOTIFICATIONS
        await notification_service.send_incident_alert(new_incident, db)

        # BROADCAST NEW INCIDENT TO LIVE DASHBOARD VIA WEBSOCKET
        await ws_manager.broadcast("NEW_INCIDENT", {
            "id": new_incident.id,
            "code": new_incident.code,
            "type": new_incident.type,
            "severity": new_incident.severity,
            "status": new_incident.status,
            "camera_code": camera.code,
            "camera_name": camera.name,
            "block": camera.block,
            "floor": camera.floor,
            "corridor": camera.corridor,
            "confidence": new_incident.confidence,
            "duration": new_incident.duration,
            "people_count": camera.people_count,
            "description": new_incident.description,
            "ai_observation": new_incident.ai_observation,
            "detected_at": new_incident.detected_at.isoformat(),
            "snapshot_url": new_incident.snapshot_url
        })

        return new_incident

    async def acknowledge_incident(self, incident_id: int, user_name: str, notes: Optional[str], db: Session) -> Incident:
        incident = db.query(Incident).filter(Incident.id == incident_id).first()
        if not incident:
            raise ValueError("Incident not found")

        incident.status = "ACKNOWLEDGED"
        incident.acknowledged_at = datetime.utcnow()
        
        action = IncidentAction(
            incident_id=incident.id,
            user_name=user_name or "Warden On Duty",
            action_type="ACKNOWLEDGE",
            notes=notes or "Warden acknowledged incident and is actively inspecting situation.",
            timestamp=datetime.utcnow()
        )
        db.add(action)
        db.commit()
        db.refresh(incident)

        # Broadcast update
        await ws_manager.broadcast("INCIDENT_ACKNOWLEDGED", {
            "incident_id": incident.id,
            "code": incident.code,
            "status": "ACKNOWLEDGED",
            "acknowledged_at": incident.acknowledged_at.isoformat(),
            "user_name": user_name
        })
        return incident

    async def resolve_incident(self, incident_id: int, user_name: str, notes: Optional[str], db: Session) -> Incident:
        incident = db.query(Incident).filter(Incident.id == incident_id).first()
        if not incident:
            raise ValueError("Incident not found")

        incident.status = "RESOLVED"
        incident.resolved_at = datetime.utcnow()
        incident.resolution_notes = notes or "Corridor verified. Situation normal and safe."
        
        # Reset camera status if no other active incidents
        if incident.camera:
            other_active = db.query(Incident).filter(
                Incident.camera_id == incident.camera.id,
                Incident.id != incident.id,
                Incident.status.in_(["DETECTED", "ACKNOWLEDGED"])
            ).count()
            if other_active == 0:
                incident.camera.current_status = "NORMAL"

        action = IncidentAction(
            incident_id=incident.id,
            user_name=user_name or "Warden On Duty",
            action_type="RESOLVE",
            notes=incident.resolution_notes,
            timestamp=datetime.utcnow()
        )
        db.add(action)
        db.commit()
        db.refresh(incident)

        # Broadcast update
        await ws_manager.broadcast("INCIDENT_RESOLVED", {
            "incident_id": incident.id,
            "code": incident.code,
            "status": "RESOLVED",
            "resolved_at": incident.resolved_at.isoformat(),
            "resolution_notes": incident.resolution_notes,
            "user_name": user_name
        })
        return incident

    async def escalate_incident(self, incident_id: int, user_name: str, notes: Optional[str], db: Session) -> Incident:
        incident = db.query(Incident).filter(Incident.id == incident_id).first()
        if not incident:
            raise ValueError("Incident not found")

        incident.severity = "CRITICAL"
        
        action = IncidentAction(
            incident_id=incident.id,
            user_name=user_name or "Warden On Duty",
            action_type="ESCALATE",
            notes=notes or "Incident escalated to CRITICAL emergency status.",
            timestamp=datetime.utcnow()
        )
        db.add(action)
        db.commit()
        db.refresh(incident)

        # Trigger re-alert via WhatsApp
        await notification_service.send_incident_alert(incident, db)

        # Broadcast update
        await ws_manager.broadcast("INCIDENT_ESCALATED", {
            "incident_id": incident.id,
            "code": incident.code,
            "severity": "CRITICAL",
            "status": incident.status,
            "notes": action.notes
        })
        return incident

incident_engine = IncidentEngine()
