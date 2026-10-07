import cv2
import time
import os
import asyncio
from typing import Generator, Dict, Any, Optional
import numpy as np

from backend.detectors.crowd_detector import CrowdDetector
from backend.detectors.fall_detector import FallDetector
from backend.detectors.restricted_area_detector import RestrictedAreaDetector
from backend.schemas import DetectionResult

class VideoProcessor:
    """
    Processes video files / RTSP streams frame-by-frame,
    running Computer Vision detectors and emitting detection metrics.
    """
    def __init__(self):
        self.crowd_detector = CrowdDetector()
        self.fall_detector = FallDetector()
        self.restricted_detector = RestrictedAreaDetector()

    def process_frame(self, frame: np.ndarray, scenario_type: str = "crowd", metadata: Optional[Dict[str, Any]] = None) -> DetectionResult:
        if metadata is None:
            metadata = {}

        if scenario_type == "crowd":
            return self.crowd_detector.detect(frame, metadata)
        elif scenario_type == "fall":
            return self.fall_detector.detect(frame, metadata)
        elif scenario_type == "restricted":
            return self.restricted_detector.detect(frame, metadata)
        else:
            return self.crowd_detector.detect(frame, metadata)

    def draw_annotations(self, frame: np.ndarray, result: DetectionResult) -> np.ndarray:
        """
        Overlays detection bounding boxes, confidence tags, and status HUD onto frame.
        """
        annotated = frame.copy()
        
        # Color definitions (BGR)
        # Oat/Purple/Tangerine/Red
        PURPLE = (182, 74, 108)
        TANGERINE = (40, 140, 242)
        RED = (40, 40, 235)
        GREEN = (70, 180, 80)

        box_color = RED if result.severity == "CRITICAL" else (TANGERINE if result.is_alert else PURPLE)

        for b in result.bounding_boxes:
            color = RED if (b.label == "possible_fall" or result.severity == "CRITICAL") else (TANGERINE if b.is_anomaly else PURPLE)
            cv2.rectangle(annotated, (b.x, b.y), (b.x + b.w, b.y + b.h), color, 2)
            
            # Label banner
            label_text = f"{b.label.upper()} {int(b.confidence * 100)}%"
            (tw, th), _ = cv2.getTextSize(label_text, cv2.FONT_HERSHEY_SIMPLEX, 0.45, 1)
            cv2.rectangle(annotated, (b.x, b.y - th - 6), (b.x + tw + 6, b.y), color, -1)
            cv2.putText(annotated, label_text, (b.x + 3, b.y - 4), cv2.FONT_HERSHEY_SIMPLEX, 0.45, (255, 255, 255), 1)

        # Top HUD Banner
        h, w = frame.shape[:2]
        cv2.rectangle(annotated, (12, 12), (320, 68), (20, 24, 28), -1)
        
        status_text = f"AI: {result.detection_type}"
        status_color = RED if result.severity == "CRITICAL" else (TANGERINE if result.is_alert else GREEN)
        
        cv2.putText(annotated, status_text, (22, 38), cv2.FONT_HERSHEY_SIMPLEX, 0.55, status_color, 2)
        cv2.putText(annotated, f"People: {result.person_count}  |  Confidence: {int(result.confidence * 100)}%", (22, 58), cv2.FONT_HERSHEY_SIMPLEX, 0.42, (200, 210, 220), 1)

        return annotated

video_processor = VideoProcessor()
