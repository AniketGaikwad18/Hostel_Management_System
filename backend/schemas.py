from pydantic import BaseModel, Field
from typing import List, Optional, Any, Dict
from datetime import datetime

# Camera Schemas
class CameraBase(BaseModel):
    code: str
    name: str
    block: str
    floor: str
    corridor: str
    is_online: bool = True
    current_status: str = "NORMAL"
    people_count: int = 0
    crowd_threshold: int = 8
    stream_type: str = "SAMPLE"
    sample_video_key: Optional[str] = "corridor_normal"
    restricted_polygon: Optional[str] = None
    location_id: Optional[int] = None

class CameraCreate(CameraBase):
    pass

class CameraUpdate(BaseModel):
    name: Optional[str] = None
    is_online: Optional[bool] = None
    current_status: Optional[str] = None
    people_count: Optional[int] = None
    crowd_threshold: Optional[int] = None
    restricted_polygon: Optional[str] = None

class CameraOut(CameraBase):
    id: int
    last_heartbeat: Optional[datetime] = None

    class Config:
        from_attributes = True

# Location Schemas
class LocationOut(BaseModel):
    id: int
    code: str
    block: str
    floor: str
    wing: str
    name: str
    description: Optional[str] = None

    class Config:
        from_attributes = True

# Notification Schemas
class NotificationOut(BaseModel):
    id: int
    incident_id: int
    provider: str
    recipient: str
    message_body: str
    status: str
    error_message: Optional[str] = None
    sent_at: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True

class TestWhatsAppRequest(BaseModel):
    phone_number: Optional[str] = None
    message: Optional[str] = None

class TestSMSRequest(BaseModel):
    phone_number: Optional[str] = None
    message: Optional[str] = None

# Incident Action Schemas
class IncidentActionOut(BaseModel):
    id: int
    incident_id: int
    user_name: str
    action_type: str
    notes: Optional[str] = None
    timestamp: datetime

    class Config:
        from_attributes = True

class IncidentActionRequest(BaseModel):
    user_name: Optional[str] = "Warden On Duty"
    notes: Optional[str] = None

# Incident Schemas
class IncidentBase(BaseModel):
    type: str
    severity: str = "HIGH"
    status: str = "DETECTED"
    confidence: float = 0.90
    duration: float = 0.0
    description: str
    ai_observation: str
    snapshot_url: Optional[str] = None
    video_url: Optional[str] = None
    assigned_warden: Optional[str] = "Warden On Duty"
    resolution_notes: Optional[str] = None

class IncidentCreate(IncidentBase):
    code: Optional[str] = None
    camera_id: Optional[int] = None
    location_id: Optional[int] = None
    metadata_json: Optional[str] = None

class IncidentOut(IncidentBase):
    id: int
    code: str
    camera_id: Optional[int] = None
    location_id: Optional[int] = None
    metadata_json: Optional[str] = None
    detected_at: datetime
    acknowledged_at: Optional[datetime] = None
    resolved_at: Optional[datetime] = None
    created_at: datetime
    camera: Optional[CameraOut] = None
    location: Optional[LocationOut] = None
    notifications: List[NotificationOut] = []
    actions: List[IncidentActionOut] = []

    class Config:
        from_attributes = True

# AI Detection Result Schema
class BoundingBox(BaseModel):
    x: int
    y: int
    w: int
    h: int
    label: str = "person"
    confidence: float = 0.95
    is_anomaly: bool = False

class DetectionResult(BaseModel):
    detection_type: str # CROWD_DETECTED, POSSIBLE_FALL, RESTRICTED_AREA_ENTRY, NORMAL
    confidence: float
    person_count: int
    bounding_boxes: List[BoundingBox] = []
    metadata: Dict[str, Any] = {}
    ai_observation: str
    is_alert: bool
    severity: str = "HIGH" # LOW, MEDIUM, HIGH, CRITICAL

# Demo Trigger Schema
class DemoTriggerRequest(BaseModel):
    scenario: str # "crowd", "fall", "restricted"
    camera_code: Optional[str] = None
    custom_threshold: Optional[int] = None
    auto_trigger_whatsapp: bool = True

# Analytics Summary Schema
class AnalyticsSummary(BaseModel):
    incidents_today: int
    active_alerts: int
    critical_alerts: int
    cameras_online: int
    total_cameras: int
    avg_response_time_seconds: int
    avg_resolution_time_seconds: int
    most_active_location: str
    incidents_by_type: Dict[str, int]
    incidents_by_severity: Dict[str, int]
    hourly_trend: List[Dict[str, Any]]
