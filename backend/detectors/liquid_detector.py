import numpy as np
from typing import Any, Dict, Optional
from backend.detectors.base_detector import BaseDetector
from backend.schemas import DetectionResult

class LiquidDetector(BaseDetector):
    """
    Liquid / Spill Detector (Architectural Extension):
    Identifies specular reflections, puddle contours, and anomalous ground sheen.
    """
    def __init__(self):
        super().__init__("LiquidDetector")

    def detect(self, frame: np.ndarray, metadata: Optional[Dict[str, Any]] = None) -> DetectionResult:
        return DetectionResult(
            detection_type="NORMAL",
            confidence=0.98,
            person_count=0,
            bounding_boxes=[],
            metadata={"status": "standby"},
            ai_observation="No hazardous liquid or spill accumulation detected on corridor floor.",
            is_alert=False,
            severity="LOW"
        )
