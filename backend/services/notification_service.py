from abc import ABC, abstractmethod
from typing import Dict, Any, List, Optional
from datetime import datetime
import logging
from sqlalchemy.orm import Session

from backend.models import Notification, Incident
from backend.services.whatsapp_service import whatsapp_service
from backend.services.sms_service import sms_service
from backend.websocket_manager import ws_manager

logger = logging.getLogger("hostelguard.notifications")

class BaseNotificationProvider(ABC):
    @abstractmethod
    async def send(self, incident_data: Dict[str, Any], recipient: str) -> Dict[str, Any]:
        pass

class WhatsAppProvider(BaseNotificationProvider):
    async def send(self, incident_data: Dict[str, Any], recipient: str) -> Dict[str, Any]:
        status, body, meta = await whatsapp_service.send_alert(incident_data, recipient)
        return {
            "provider": "WHATSAPP",
            "status": status,
            "recipient": recipient,
            "message_body": body,
            "meta": meta
        }

class SMSProvider(BaseNotificationProvider):
    async def send(self, incident_data: Dict[str, Any], recipient: str) -> Dict[str, Any]:
        status, body, meta = await sms_service.send_sms_alert(incident_data, recipient)
        return {
            "provider": "SMS",
            "status": status,
            "recipient": recipient,
            "message_body": body,
            "meta": meta
        }

class DashboardProvider(BaseNotificationProvider):
    async def send(self, incident_data: Dict[str, Any], recipient: str = "WARDEN_DASHBOARD") -> Dict[str, Any]:
        title = incident_data.get("type", "INCIDENT")
        severity = incident_data.get("severity", "HIGH")
        # Broadcast immediately to frontend via WebSockets
        await ws_manager.broadcast("INCIDENT_ALERT", {
            "incident": incident_data,
            "timestamp": datetime.utcnow().isoformat()
        })
        return {
            "provider": "DASHBOARD",
            "status": "SENT",
            "recipient": "Warden UI Console",
            "message_body": f"Real-time HUD trigger: {title} ({severity})",
            "meta": {"delivered_via": "WebSocket"}
        }

class EmailProvider(BaseNotificationProvider):
    async def send(self, incident_data: Dict[str, Any], recipient: str) -> Dict[str, Any]:
        # Optional architectural provider stub
        return {
            "provider": "EMAIL",
            "status": "SENT",
            "recipient": recipient,
            "message_body": f"HostelGuard Safety Notification: {incident_data.get('type')}",
            "meta": {"mode": "STANDBY"}
        }

class NotificationService:
    def __init__(self):
        self.providers: Dict[str, BaseNotificationProvider] = {
            "WHATSAPP": WhatsAppProvider(),
            "SMS": SMSProvider(),
            "DASHBOARD": DashboardProvider(),
            "EMAIL": EmailProvider()
        }

    async def send_incident_alert(self, incident: Incident, db: Optional[Session] = None, phone_number: Optional[str] = None) -> List[Dict[str, Any]]:
        """
        Executes multi-channel incident alerting workflow.
        1. Formats message payload
        2. Dispatches to WhatsApp and Dashboard providers
        3. Records notification state into database
        4. Broadcasts WebSocket event
        """
        incident_data = {
            "id": incident.id,
            "code": incident.code,
            "type": incident.type,
            "severity": incident.severity,
            "status": incident.status,
            "confidence": incident.confidence,
            "duration": incident.duration,
            "detected_at": incident.detected_at,
            "block": incident.camera.block if incident.camera else "Block A",
            "floor": incident.camera.floor if incident.camera else "Floor 2",
            "corridor": incident.camera.corridor if incident.camera else "East Corridor",
            "camera_code": incident.camera.code if incident.camera else "CAM-A-02",
            "ai_observation": incident.ai_observation
        }

        target_phone = phone_number or whatsapp_service.warden_phone
        results = []

        # 1. Dispatch Dashboard UI notification
        dashboard_res = await self.providers["DASHBOARD"].send(incident_data, "WARDEN_DASHBOARD")
        results.append(dashboard_res)

        # 2. Dispatch WhatsApp Notification
        whatsapp_res = await self.providers["WHATSAPP"].send(incident_data, target_phone)
        results.append(whatsapp_res)

        # 3. Store WhatsApp notification record in Database if DB session provided
        if db:
            try:
                notif_record = Notification(
                    incident_id=incident.id,
                    provider="WHATSAPP",
                    recipient=target_phone,
                    message_body=whatsapp_res["message_body"],
                    status=whatsapp_res["status"],
                    error_message=str(whatsapp_res.get("meta", {}).get("error", "")) if whatsapp_res["status"] == "FAILED" else None,
                    sent_at=datetime.utcnow() if whatsapp_res["status"] in ("SENT", "SIMULATED_SENT") else None
                )
                db.add(notif_record)
                db.commit()
                db.refresh(notif_record)
            except Exception as e:
                logger.error(f"Failed to save WhatsApp notification record to DB: {e}")
                db.rollback()

        # 4. Broadcast WhatsApp notification status to WebSockets
        await ws_manager.broadcast("NOTIFICATION_STATUS", {
            "incident_id": incident.id,
            "incident_code": incident.code,
            "provider": "WHATSAPP",
            "status": whatsapp_res["status"],
            "badge": whatsapp_res["meta"].get("badge", "WhatsApp Alert Sent"),
            "details": whatsapp_res["meta"]
        })

        # 5. Dispatch SMS Notification (ONLY for HIGH and CRITICAL severity)
        if str(incident.severity).upper() in ("HIGH", "CRITICAL"):
            logger.info(f"Triggering emergency SMS alert for {incident.code} ({incident.severity})...")
            sms_res = await self.providers["SMS"].send(incident_data, target_phone)
            results.append(sms_res)

            sms_status = sms_res["status"]
            sms_badge = (
                "SMS Alert Sent" if sms_status == "SMS_SENT" 
                else "SMS Gateway Offline" if sms_status == "SMS_GATEWAY_OFFLINE"
                else "SMS Alert Disabled" if sms_status == "SMS_DISABLED"
                else "SMS Failed"
            )

            # Store SMS notification record in DB
            if db:
                try:
                    sms_record = Notification(
                        incident_id=incident.id,
                        provider="SMS",
                        recipient=target_phone,
                        message_body=sms_res["message_body"] or f"SMS Alert for {incident.code}",
                        status=sms_status,
                        error_message=str(sms_res.get("meta", {}).get("error", "")) if sms_status != "SMS_SENT" else None,
                        sent_at=datetime.utcnow() if sms_status == "SMS_SENT" else None
                    )
                    db.add(sms_record)
                    db.commit()
                    db.refresh(sms_record)
                except Exception as e:
                    logger.error(f"Failed to save SMS notification record to DB: {e}")
                    db.rollback()

            # Broadcast SMS notification status to WebSockets
            await ws_manager.broadcast("NOTIFICATION_STATUS", {
                "incident_id": incident.id,
                "incident_code": incident.code,
                "provider": "SMS",
                "status": sms_status,
                "badge": sms_badge,
                "details": sms_res["meta"]
            })
        else:
            logger.info(f"SMS notification skipped for {incident.code}: Severity is {incident.severity} (SMS requires HIGH or CRITICAL).")

        return results

notification_service = NotificationService()
