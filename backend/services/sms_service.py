import os
import logging
import json
import httpx
from datetime import datetime
from typing import Dict, Any, Optional, Tuple, Set

from backend.config import settings

logger = logging.getLogger("hostelguard.sms_service")

class SMSService:
    """
    Android SMS Gateway Integration Service for HostelGuard AI.
    
    Responsibilities:
    - Evaluates incident severity (HIGH / CRITICAL only)
    - Deduplicates incident alerts to prevent SIM SMS flooding
    - Formats concise, actionable emergency SMS copy
    - Dispatches authenticated POST /send-sms request to local Android Gateway
    - Accurately tracks delivery statuses: SMS_SENT, SMS_FAILED, SMS_GATEWAY_OFFLINE
    - Operates safely in local Wi-Fi / fallback environments
    """
    def __init__(self):
        self.gateway_url = settings.SMS_GATEWAY_URL.rstrip('/')
        self.api_key = settings.SMS_GATEWAY_API_KEY
        self.warden_phone = settings.WARDEN_PHONE_NUMBER
        self.enabled = settings.SMS_ENABLED
        self.timeout = settings.SMS_GATEWAY_TIMEOUT_SECONDS
        
        # Incident deduplication cache: { incident_id: { "severity": str, "timestamp": datetime } }
        self._sent_incidents: Dict[Any, Dict[str, Any]] = {}

    def is_eligible_severity(self, severity: str) -> bool:
        """SMS must be triggered ONLY for HIGH and CRITICAL severity incidents."""
        return str(severity).upper() in ("HIGH", "CRITICAL")

    def should_suppress_duplicate(self, incident_id: Any, current_severity: str, force_resend: bool = False) -> bool:
        """
        Deduplication rule:
        - Genuinely new incident -> allow
        - Incident escalated from HIGH -> CRITICAL -> allow
        - Explicit resend -> allow
        - Otherwise, suppress duplicate frame spam
        """
        if force_resend:
            return False
            
        if incident_id not in self._sent_incidents:
            return False
            
        prev_record = self._sent_incidents[incident_id]
        prev_severity = prev_record.get("severity", "").upper()
        curr_sev = current_severity.upper()
        
        # Allow escalation from HIGH to CRITICAL
        if prev_severity == "HIGH" and curr_sev == "CRITICAL":
            logger.info(f"Incident {incident_id} escalated HIGH -> CRITICAL: Allowing new SMS alert.")
            return False
            
        logger.info(f"Duplicate SMS suppressed for incident {incident_id} (already alerted at {prev_severity}).")
        return True

    def format_sms_message(self, incident_data: Dict[str, Any]) -> str:
        """
        Formats concise, professional emergency SMS copy.
        Strictly adheres to specified field structure:
        - CRITICAL: includes location, camera, confidence, immediate verification directive.
        - HIGH: includes location, camera, count, threshold.
        """
        severity = str(incident_data.get("severity", "HIGH")).upper()
        inc_type = str(incident_data.get("type", "INCIDENT")).replace("_", " ").title()
        
        # Clean type labels
        if "Fall" in inc_type:
            inc_type = "Possible person fall"
        elif "Crowd" in inc_type:
            inc_type = "Crowd detected"
        elif "Restricted" in inc_type:
            inc_type = "Restricted area entry"

        block = incident_data.get("block", "Block A")
        floor = incident_data.get("floor", "Floor 2")
        camera_code = incident_data.get("camera_code") or incident_data.get("camera", "CAM-A-02")
        code = incident_data.get("code", "HG-1042")
        
        # Format location
        location_str = f"{block} - {floor}"
        
        if severity == "CRITICAL":
            conf = incident_data.get("confidence", 0.91)
            conf_str = f"{int(conf * 100)}%" if isinstance(conf, (int, float)) and conf <= 1.0 else str(conf)
            if not conf_str.endswith("%"):
                conf_str = f"{conf_str}%"
                
            return (
                "HOSTELGUARD AI ALERT\n\n"
                f"Severity: CRITICAL\n"
                f"Incident: {inc_type}\n"
                f"Location: {location_str}\n"
                f"Camera: {camera_code}\n"
                f"Confidence: {conf_str}\n\n"
                "Please verify immediately.\n"
                f"Incident: {code}"
            )
        else:
            # HIGH Severity
            people = incident_data.get("people_count") or incident_data.get("people", 12)
            threshold = incident_data.get("threshold", 8)
            
            return (
                "HOSTELGUARD AI ALERT\n\n"
                f"Severity: HIGH\n"
                f"Incident: {inc_type}\n"
                f"Location: {location_str}\n"
                f"Camera: {camera_code}\n"
                f"People: {people}\n"
                f"Threshold: {threshold}\n\n"
                "Please verify.\n"
                f"Incident: {code}"
            )

    async def send_raw_sms(self, phone: str, message: str) -> Tuple[str, str, Dict[str, Any]]:
        """
        Dispatches an authenticated HTTP POST request to the Android SMS Gateway:
        POST /send-sms
        Authorization: Bearer <API_KEY>
        Body: { "phone": ..., "message": ... }
        
        Returns:
            status: "SMS_SENT" | "SMS_FAILED" | "SMS_GATEWAY_OFFLINE" | "SMS_DISABLED"
            message: formatted message text
            meta: dictionary with delivery telemetry
        """
        if not self.enabled:
            logger.info("SMS alerting is disabled in settings (SMS_ENABLED=False).")
            return "SMS_DISABLED", message, {
                "reason": "SMS_ENABLED=False in configuration",
                "sim_gateway": self.gateway_url,
                "phone": phone
            }

        endpoint = f"{self.gateway_url}/send-sms"
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
        payload = {
            "phone": phone,
            "message": message
        }

        try:
            logger.info(f"Connecting to Android SMS Gateway at {endpoint} for recipient {phone}...")
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.post(endpoint, headers=headers, json=payload)
                
                if response.status_code == 200:
                    try:
                        resp_data = response.json()
                    except Exception:
                        resp_data = {"raw": response.text}
                        
                    if resp_data.get("status") in ("SUCCESS", "SMS_SENT", "OK", True):
                        logger.info(f"SMS successfully dispatched by Android SIM Gateway: {resp_data}")
                        return "SMS_SENT", message, {
                            "gateway_status": 200,
                            "sim_response": resp_data,
                            "phone": phone,
                            "delivered_at": datetime.utcnow().isoformat()
                        }
                    else:
                        logger.warning(f"Android Gateway reported send failure: {resp_data}")
                        return "SMS_FAILED", message, {
                            "gateway_status": 200,
                            "error": resp_data.get("error", "Gateway reported send failure"),
                            "sim_response": resp_data
                        }
                        
                elif response.status_code == 401 or response.status_code == 403:
                    logger.error("Android SMS Gateway authentication failed (Check SMS_GATEWAY_API_KEY).")
                    return "SMS_FAILED", message, {
                        "gateway_status": response.status_code,
                        "error": "Authentication failed: Invalid SMS_GATEWAY_API_KEY on Android Gateway"
                    }
                else:
                    logger.error(f"Android SMS Gateway returned HTTP {response.status_code}: {response.text}")
                    return "SMS_FAILED", message, {
                        "gateway_status": response.status_code,
                        "error": f"HTTP {response.status_code}: {response.text[:100]}"
                    }

        except httpx.ConnectError as ce:
            logger.warning(f"Android SMS Gateway is offline / unreachable at {endpoint}: {ce}")
            return "SMS_GATEWAY_OFFLINE", message, {
                "error": "Android Gateway unreachable on local Wi-Fi",
                "target_url": endpoint,
                "details": str(ce)
            }
        except httpx.TimeoutException as te:
            logger.warning(f"Android SMS Gateway request timed out after {self.timeout}s: {te}")
            return "SMS_GATEWAY_OFFLINE", message, {
                "error": f"Connection timed out after {self.timeout}s",
                "target_url": endpoint
            }
        except Exception as e:
            logger.error(f"Unexpected error communicating with Android SMS Gateway: {e}")
            return "SMS_FAILED", message, {
                "error": str(e),
                "target_url": endpoint
            }

    async def send_sms_alert(
        self,
        incident_data: Dict[str, Any],
        recipient: Optional[str] = None,
        force_resend: bool = False
    ) -> Tuple[str, str, Dict[str, Any]]:
        """
        High-level incident alerting endpoint:
        1. Checks severity eligibility (HIGH / CRITICAL only)
        2. Applies deduplication
        3. Formats SMS text
        4. Calls Android Gateway via physical SIM
        5. Caches record
        """
        severity = str(incident_data.get("severity", "HIGH")).upper()
        incident_id = incident_data.get("id") or incident_data.get("code")

        # Severity filter: ONLY HIGH and CRITICAL
        if not self.is_eligible_severity(severity):
            logger.info(f"Skipping SMS alert for incident {incident_id}: Severity '{severity}' is neither HIGH nor CRITICAL.")
            return "SMS_SKIPPED_SEVERITY", "", {
                "reason": f"Severity {severity} does not require SMS alert"
            }

        # Deduplication check
        if incident_id and self.should_suppress_duplicate(incident_id, severity, force_resend=force_resend):
            return "SMS_SUPPRESSED_DUPLICATE", "", {
                "reason": f"SMS already dispatched for incident {incident_id}"
            }

        target_phone = recipient or self.warden_phone
        message = self.format_sms_message(incident_data)

        status, msg_body, meta = await self.send_raw_sms(target_phone, message)

        # Update cache if requested or sent
        if incident_id:
            self._sent_incidents[incident_id] = {
                "severity": severity,
                "status": status,
                "timestamp": datetime.utcnow()
            }

        return status, msg_body, meta

    async def send_test_alert(self, recipient: Optional[str] = None) -> Tuple[str, str, Dict[str, Any]]:
        """Sends a verification test SMS via the Android SIM gateway."""
        target_phone = recipient or self.warden_phone
        time_str = datetime.now().strftime("%I:%M:%S %p")
        message = (
            "HOSTELGUARD AI ALERT\n\n"
            "SYSTEM TEST: Android SMS Gateway verified.\n"
            f"Timestamp: {time_str}\n"
            "Target: Physical Warden Phone\n"
            "Status: OPERATIONAL"
        )
        return await self.send_raw_sms(target_phone, message)

    async def check_gateway_health(self) -> Dict[str, Any]:
        """Checks connectivity to the Android SMS Gateway health endpoint."""
        endpoint = f"{self.gateway_url}/health"
        headers = {
            "Authorization": f"Bearer {self.api_key}"
        }
        try:
            async with httpx.AsyncClient(timeout=3.0) as client:
                res = await client.get(endpoint, headers=headers)
                if res.status_code == 200:
                    data = res.json()
                    return {
                        "status": "ONLINE",
                        "gateway_url": self.gateway_url,
                        "details": data
                    }
                return {
                    "status": "ERROR",
                    "http_code": res.status_code,
                    "gateway_url": self.gateway_url
                }
        except Exception as e:
            return {
                "status": "OFFLINE",
                "error": str(e),
                "gateway_url": self.gateway_url
            }

sms_service = SMSService()
