from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, Text, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from backend.database import Base

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    role = Column(String(50), default="Warden") # Warden, Chief Warden, Security Guard, Admin
    email = Column(String(120), unique=True, index=True)
    phone = Column(String(30), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

class Location(Base):
    __tablename__ = "locations"
    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(50), unique=True, index=True) # e.g. LOC-BLK-A-FL2
    block = Column(String(20), nullable=False)          # Block A, Block B
    floor = Column(String(20), nullable=False)          # Floor 1, Floor 2, Floor 3, Ground Floor
    wing = Column(String(50), default="East Wing")
    name = Column(String(100), nullable=False)
    description = Column(String(255), nullable=True)
    
    cameras = relationship("Camera", back_populates="location")
    incidents = relationship("Incident", back_populates="location")

class Camera(Base):
    __tablename__ = "cameras"
    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(50), unique=True, index=True) # e.g. CAM-A-02
    name = Column(String(100), nullable=False)
    block = Column(String(20), nullable=False)
    floor = Column(String(20), nullable=False)
    corridor = Column(String(100), nullable=False)
    location_id = Column(Integer, ForeignKey("locations.id"), nullable=True)
    rtsp_url = Column(String(255), nullable=True)
    is_online = Column(Boolean, default=True)
    current_status = Column(String(50), default="NORMAL") # NORMAL, WARNING, CRITICAL, OFFLINE
    people_count = Column(Integer, default=0)
    crowd_threshold = Column(Integer, default=8)
    last_heartbeat = Column(DateTime, default=datetime.utcnow)
    stream_type = Column(String(50), default="SAMPLE") # SAMPLE, RTSP, WEBCAM, UPLOAD
    sample_video_key = Column(String(100), default="corridor_normal")
    restricted_polygon = Column(Text, nullable=True) # JSON coordinates of restricted zone
    
    location = relationship("Location", back_populates="cameras")
    incidents = relationship("Incident", back_populates="camera")
    detections = relationship("Detection", back_populates="camera")

class Incident(Base):
    __tablename__ = "incidents"
    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(50), unique=True, index=True) # e.g. INC-1042
    type = Column(String(50), nullable=False) # CROWD_DETECTED, POSSIBLE_FALL, RESTRICTED_AREA_ENTRY, LIQUID_DETECTED, FIRE_DETECTED
    severity = Column(String(20), default="HIGH") # LOW, MEDIUM, HIGH, CRITICAL
    status = Column(String(30), default="DETECTED") # DETECTED, ACKNOWLEDGED, RESOLVED
    camera_id = Column(Integer, ForeignKey("cameras.id"), nullable=True)
    location_id = Column(Integer, ForeignKey("locations.id"), nullable=True)
    confidence = Column(Float, default=0.90)
    duration = Column(Float, default=0.0) # duration in seconds
    description = Column(Text, nullable=False)
    ai_observation = Column(Text, nullable=False)
    snapshot_url = Column(String(255), nullable=True)
    video_url = Column(String(255), nullable=True)
    metadata_json = Column(Text, nullable=True) # JSON metadata e.g. people count, ROI, coordinates
    assigned_warden = Column(String(100), default="Warden On Duty")
    resolution_notes = Column(Text, nullable=True)
    
    detected_at = Column(DateTime, default=datetime.utcnow)
    acknowledged_at = Column(DateTime, nullable=True)
    resolved_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    camera = relationship("Camera", back_populates="incidents")
    location = relationship("Location", back_populates="incidents")
    notifications = relationship("Notification", back_populates="incident")
    actions = relationship("IncidentAction", back_populates="incident")
    detections = relationship("Detection", back_populates="incident")

class Detection(Base):
    __tablename__ = "detections"
    id = Column(Integer, primary_key=True, index=True)
    incident_id = Column(Integer, ForeignKey("incidents.id"), nullable=True)
    camera_id = Column(Integer, ForeignKey("cameras.id"), nullable=True)
    detection_type = Column(String(50), nullable=False)
    confidence = Column(Float, nullable=False)
    bounding_boxes_json = Column(Text, nullable=True)
    person_count = Column(Integer, default=0)
    timestamp = Column(DateTime, default=datetime.utcnow)
    
    camera = relationship("Camera", back_populates="detections")
    incident = relationship("Incident", back_populates="detections")

class Notification(Base):
    __tablename__ = "notifications"
    id = Column(Integer, primary_key=True, index=True)
    incident_id = Column(Integer, ForeignKey("incidents.id"), nullable=False)
    provider = Column(String(50), default="WHATSAPP") # WHATSAPP, DASHBOARD, EMAIL
    recipient = Column(String(100), nullable=False)
    message_body = Column(Text, nullable=False)
    status = Column(String(30), default="PENDING") # PENDING, SENT, SIMULATED_SENT, FAILED
    error_message = Column(Text, nullable=True)
    sent_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    incident = relationship("Incident", back_populates="notifications")

class IncidentAction(Base):
    __tablename__ = "incident_actions"
    id = Column(Integer, primary_key=True, index=True)
    incident_id = Column(Integer, ForeignKey("incidents.id"), nullable=False)
    user_name = Column(String(100), default="Warden")
    action_type = Column(String(50), nullable=False) # ACKNOWLEDGE, RESOLVE, ESCALATE, COMMENT, DISMISS
    notes = Column(Text, nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow)
    
    incident = relationship("Incident", back_populates="actions")

class SystemSetting(Base):
    __tablename__ = "system_settings"
    id = Column(Integer, primary_key=True, index=True)
    key = Column(String(100), unique=True, nullable=False)
    value = Column(Text, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
