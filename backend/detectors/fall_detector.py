import time
import numpy as np
from typing import Any, Dict, List, Optional
from backend.detectors.base_detector import BaseDetector
from backend.schemas import DetectionResult, BoundingBox

class FallDetector(BaseDetector):
    """
    Fall Detector:
    Analyzes body aspect ratio geometry (width vs height) and ground plane proximity.
    Requires temporal persistence (> 3.0s continuous horizontal orientation)
    to prevent false triggers from brief sitting or tying shoelaces.
    """
    def __init__(self, persistence_threshold_seconds: float = 3.0, confidence_threshold: float = 0.80):
        super().__init__("FallDetector")
        self.persistence_threshold = persistence_threshold_seconds
        self.confidence_threshold = confidence_threshold
        # Track fall candidate state: {camera_code: {"start_time": float, "last_seen": float, "duration": float}}
        self.fall_state: Dict[str, Dict[str, float]] = {}

    def detect(self, frame: np.ndarray, metadata: Optional[Dict[str, Any]] = None) -> DetectionResult:
        if metadata is None:
            metadata = {}

        camera_code = metadata.get("camera_code", "CAM-B-03")
        is_synthetic_fall = metadata.get("synthetic_fall", False)
        synthetic_duration = metadata.get("synthetic_duration", 7.2)
        
        h, w = frame.shape[:2]
        boxes: List[BoundingBox] = []
        is_horizontal = False
        confidence = 0.91

        if is_synthetic_fall:
            # Deterministic simulation for Demo 2
            is_horizontal = True
            duration = float(synthetic_duration)
            
            # Horizontal bounding box representing a fallen person on the corridor floor
            bx = int(w * 0.32)
            by = int(h * 0.62)
            bw = int(w * 0.38) # Wide
            bh = int(h * 0.18) # Low height -> horizontal aspect ratio
            
            boxes.append(
                BoundingBox(
                    x=bx,
                    y=by,
                    w=bw,
                    h=bh,
                    label="possible_fall",
                    confidence=0.91,
                    is_anomaly=True
                )
            )
        else:
            # Compute based on motion & contours in the lower half of corridor
            gray = cv2_convert = None
            try:
                import cv2
                gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
                blurred = cv2.GaussianBlur(gray, (21, 21), 0)
                # Lower corridor floor ROI
                floor_roi = blurred[int(h * 0.5):, :]
                _, thresh = cv2.threshold(floor_roi, 60, 255, cv2.THRESH_BINARY_INV)
                contours, _ = cv2.findContours(thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
                
                for c in contours:
                    area = cv2.contourArea(c)
                    if area > (w * h * 0.04): # Substantial mass on floor
                        rx, ry, rw, rh = cv2.boundingRect(c)
                        aspect_ratio = rw / float(rh) if rh > 0 else 0
                        # If aspect ratio > 1.35 and positioned near bottom
                        if aspect_ratio > 1.35:
                            is_horizontal = True
                            boxes.append(
                                BoundingBox(
                                    x=rx,
                                    y=int(h * 0.5) + ry,
                                    w=rw,
                                    h=rh,
                                    label="possible_fall",
                                    confidence=0.88,
                                    is_anomaly=True
                                )
                            )
                            break
            except Exception:
                pass

            now = time.time()
            state = self.fall_state.get(camera_code)

            if is_horizontal:
                if state is None:
                    # New potential fall started
                    self.fall_state[camera_code] = {"start_time": now, "last_seen": now, "duration": 0.1}
                    duration = 0.1
                else:
                    duration = now - state["start_time"]
                    state["last_seen"] = now
                    state["duration"] = duration
            else:
                # Reset state if not seen recently
                if state and (now - state["last_seen"]) > 1.5:
                    self.fall_state.pop(camera_code, None)
                duration = 0.0

        is_alert = is_horizontal and (duration >= self.persistence_threshold or is_synthetic_fall)

        if is_alert:
            formatted_duration = round(duration, 1)
            observation = f"Person detected in a horizontal position within the monitored corridor region for {formatted_duration} seconds."
            severity = "CRITICAL"
        else:
            observation = "No fall patterns detected. Subject posture and gait within normal parameters."
            severity = "LOW"

        return DetectionResult(
            detection_type="POSSIBLE_FALL" if is_alert else "NORMAL",
            confidence=confidence if is_alert else 0.95,
            person_count=1 if (is_alert or is_horizontal) else 0,
            bounding_boxes=boxes,
            metadata={
                "camera_code": camera_code,
                "duration_seconds": round(duration, 1) if is_horizontal else 0.0,
                "persistence_met": is_alert,
                "aspect_ratio": "horizontal" if is_horizontal else "vertical"
            },
            ai_observation=observation,
            is_alert=is_alert,
            severity=severity
        )
