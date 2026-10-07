from abc import ABC, abstractmethod
from typing import Any, Dict, List, Optional
import numpy as np
from backend.schemas import DetectionResult, BoundingBox

class BaseDetector(ABC):
    """
    Base Detector Interface for HostelGuard AI Computer Vision Module.
    Every detector implements detect() returning a structured DetectionResult.
    """
    def __init__(self, name: str):
        self.name = name

    @abstractmethod
    def detect(self, frame: np.ndarray, metadata: Optional[Dict[str, Any]] = None) -> DetectionResult:
        """
        Process a video frame and return structured detection results.
        :param frame: BGR image numpy array
        :param metadata: Optional frame/camera metadata (ROI, threshold, timestamp, etc.)
        :return: DetectionResult object
        """
        pass
