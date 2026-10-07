import cv2
import time
import numpy as np
from typing import Any, Dict, List, Optional
from backend.detectors.base_detector import BaseDetector
from backend.schemas import DetectionResult, BoundingBox

class CrowdDetector(BaseDetector):
    """
    Crowd Detector:
    Monitors people density in corridors and public areas.
    Triggers CROWD_DETECTED when the number of people exceeds configured threshold.
    Maintains cooldown and incident update states.
    """
    def __init__(self, default_threshold: int = 8, cooldown_seconds: int = 60):
        super().__init__("CrowdDetector")
        self.default_threshold = default_threshold
        self.cooldown_seconds = cooldown_seconds
        self.last_alert_time: Dict[str, float] = {}

    def detect(self, frame: np.ndarray, metadata: Optional[Dict[str, Any]] = None) -> DetectionResult:
        if metadata is None:
            metadata = {}

        threshold = metadata.get("crowd_threshold", self.default_threshold)
        camera_code = metadata.get("camera_code", "CAM-DEFAULT")
        force_count = metadata.get("synthetic_person_count", None)
        
        boxes: List[BoundingBox] = []
        person_count = 0
        h, w = frame.shape[:2]

        if force_count is not None:
            # Deterministic simulation/demo mode for reproducible hackathon demonstrations
            person_count = int(force_count)
            np.random.seed(42)
            for i in range(person_count):
                bw = int(w * 0.12)
                bh = int(h * 0.45)
                bx = int((w * 0.15) + (i % 6) * (w * 0.12) + (np.sin(i * 1.5) * 20))
                by = int((h * 0.35) + ((i // 6) * (h * 0.15)) + (np.cos(i) * 15))
                bx = max(10, min(w - bw - 10, bx))
                by = max(10, min(h - bh - 10, by))
                boxes.append(
                    BoundingBox(
                        x=bx,
                        y=by,
                        w=bw,
                        h=bh,
                        label="person",
                        confidence=round(0.88 + (i % 10) * 0.01, 2),
                        is_anomaly=(person_count > threshold)
                    )
                )
        else:
            # Real visual contour/blob person cluster detection
            try:
                gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
                blurred = cv2.GaussianBlur(gray, (15, 15), 0)
                # Adaptive threshold for subject separation
                _, thresh = cv2.threshold(blurred, 110, 255, cv2.THRESH_BINARY_INV)
                contours, _ = cv2.findContours(thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
                
                for i, c in enumerate(contours):
                    area = cv2.contourArea(c)
                    if area > (w * h * 0.012): # Person-sized contour
                        rx, ry, rw, rh = cv2.boundingRect(c)
                        aspect_ratio = rh / float(rw) if rw > 0 else 0
                        if aspect_ratio >= 1.0: # Vertical posture
                            boxes.append(
                                BoundingBox(
                                    x=rx,
                                    y=ry,
                                    w=rw,
                                    h=rh,
                                    label="person",
                                    confidence=round(min(0.96, 0.85 + (area / (w * h)) * 0.5), 2),
                                    is_anomaly=False
                                )
                            )
                person_count = len(boxes)
                if person_count > threshold:
                    for b in boxes:
                        b.is_anomaly = True
            except Exception:
                person_count = 0

        is_alert = person_count > threshold
        now = time.time()
        last_alert = self.last_alert_time.get(camera_code, 0)
        in_cooldown = (now - last_alert) < self.cooldown_seconds

        if is_alert and not in_cooldown:
            self.last_alert_time[camera_code] = now

        confidence = round(0.92 if is_alert else 0.95, 2)
        
        if is_alert:
            observation = f"High crowd gathering detected: {person_count} people in monitored corridor region (threshold: {threshold})."
        else:
            observation = f"Corridor occupancy normal: {person_count} people detected (within safe threshold of {threshold})."

        return DetectionResult(
            detection_type="CROWD_DETECTED" if is_alert else "NORMAL",
            confidence=confidence,
            person_count=person_count,
            bounding_boxes=boxes,
            metadata={
                "threshold": threshold,
                "camera_code": camera_code,
                "in_cooldown": in_cooldown,
                "exceeded_by": max(0, person_count - threshold)
            },
            ai_observation=observation,
            is_alert=is_alert,
            severity="HIGH" if is_alert else "LOW"
        )
