import cv2
import numpy as np
import os
import json
from typing import Dict, Any, List
from backend.config import settings

class DemoGenerator:
    """
    Generates realistic corridor safety imagery and test video assets
    for Demo 1 (Crowd), Demo 2 (Possible Fall), Demo 3 (Restricted Entry),
    and Normal corridor monitoring.
    """
    def __init__(self):
        self.snapshots_dir = settings.SNAPSHOT_DIR
        self.videos_dir = settings.SAMPLE_VIDEOS_DIR

    def _draw_corridor_background(self, w: int = 800, h: int = 450) -> np.ndarray:
        """
        Renders a realistic CCTV architectural corridor background:
        Perspective walls, ceiling fluorescent lighting, floor tiles, and doors.
        """
        img = np.zeros((h, w, 3), dtype=np.uint8)
        
        # Floor (Oat / Warm institutional tone)
        # Perspective floor
        cv2.rectangle(img, (0, int(h * 0.45)), (w, h), (45, 52, 60), -1) # Dark floor base
        
        # Floor perspective lines
        pts_floor = np.array([
            [int(w * 0.35), int(h * 0.45)],
            [int(w * 0.65), int(h * 0.45)],
            [w, h],
            [0, h]
        ], np.int32)
        cv2.fillPoly(img, [pts_floor], (200, 215, 225)) # Light corridor floor tiles
        
        # Perspective floor grid lines
        for offset in [0.1, 0.25, 0.4, 0.6, 0.75, 0.9]:
            x_bottom = int(w * offset)
            x_top = int(w * 0.35 + (w * 0.30) * offset)
            cv2.line(img, (x_top, int(h * 0.45)), (x_bottom, h), (170, 185, 195), 1)

        for depth in [0.52, 0.62, 0.74, 0.88]:
            y_d = int(h * depth)
            left_x = int((1.0 - depth) / 0.55 * w * 0.35)
            right_x = w - left_x
            cv2.line(img, (left_x, y_d), (right_x, y_d), (170, 185, 195), 1)

        # Ceiling
        pts_ceiling = np.array([
            [0, 0],
            [w, 0],
            [int(w * 0.65), int(h * 0.25)],
            [int(w * 0.35), int(h * 0.25)]
        ], np.int32)
        cv2.fillPoly(img, [pts_ceiling], (230, 235, 240))

        # Ceiling lights
        for lx in [0.42, 0.50, 0.58]:
            cv2.line(img, (int(w * lx), int(h * 0.08)), (int(w * lx), int(h * 0.22)), (255, 255, 255), 3)

        # Left Wall
        pts_left = np.array([
            [0, 0],
            [int(w * 0.35), int(h * 0.25)],
            [int(w * 0.35), int(h * 0.45)],
            [0, h]
        ], np.int32)
        cv2.fillPoly(img, [pts_left], (210, 220, 230))
        # Left door
        cv2.rectangle(img, (int(w * 0.12), int(h * 0.32)), (int(w * 0.22), int(h * 0.72)), (140, 120, 100), -1)

        # Right Wall
        pts_right = np.array([
            [w, 0],
            [int(w * 0.65), int(h * 0.25)],
            [int(w * 0.65), int(h * 0.45)],
            [w, h]
        ], np.int32)
        cv2.fillPoly(img, [pts_right], (190, 205, 215))
        # Right door
        cv2.rectangle(img, (int(w * 0.78), int(h * 0.32)), (int(w * 0.88), int(h * 0.72)), (140, 120, 100), -1)

        # End corridor door/window
        cv2.rectangle(img, (int(w * 0.43), int(h * 0.27)), (int(w * 0.57), int(h * 0.45)), (110, 130, 150), -1)

        return img

    def _draw_person(self, img: np.ndarray, x: int, y: int, w: int, h: int, color=(75, 52, 182), is_fall: bool = False):
        """
        Draws realistic silhouette representation of a person for CCTV view.
        """
        if is_fall:
            # Fallen person horizontal on floor
            # Head
            cv2.circle(img, (x + int(w * 0.15), y + h // 2), int(h * 0.35), (80, 80, 90), -1)
            # Torso horizontal
            cv2.rectangle(img, (x + int(w * 0.25), y + int(h * 0.2)), (x + int(w * 0.75), y + int(h * 0.8)), color, -1)
            # Legs
            cv2.line(img, (x + int(w * 0.75), y + int(h * 0.4)), (x + w, y + int(h * 0.35)), (60, 60, 70), int(h * 0.25))
            cv2.line(img, (x + int(w * 0.75), y + int(h * 0.6)), (x + w, y + int(h * 0.65)), (60, 60, 70), int(h * 0.25))
        else:
            # Standing person
            head_radius = max(6, int(w * 0.24))
            head_center = (x + w // 2, y + head_radius + 4)
            # Head
            cv2.circle(img, head_center, head_radius, (100, 100, 110), -1)
            # Torso
            torso_top = y + head_radius * 2 + 4
            torso_bottom = y + int(h * 0.65)
            cv2.rectangle(img, (x + int(w * 0.15), torso_top), (x + int(w * 0.85), torso_bottom), color, -1)
            # Legs
            leg_w = max(3, int(w * 0.22))
            cv2.rectangle(img, (x + int(w * 0.18), torso_bottom), (x + int(w * 0.18) + leg_w, y + h), (50, 50, 60), -1)
            cv2.rectangle(img, (x + int(w * 0.58), torso_bottom), (x + int(w * 0.58) + leg_w, y + h), (50, 50, 60), -1)

    def generate_demo_assets(self):
        """
        Creates sample snapshot images for Demo 1, Demo 2, Demo 3, and Normal corridor.
        """
        w, h = 800, 450
        
        # 1. Normal Corridor Snapshot (CAM-A-01)
        img_normal = self._draw_corridor_background(w, h)
        # Add 3 people walking normally
        self._draw_person(img_normal, 280, 190, 45, 120, (180, 100, 70))
        self._draw_person(img_normal, 480, 210, 50, 130, (70, 140, 90))
        self._draw_person(img_normal, 360, 230, 55, 145, (90, 90, 160))
        cv2.imwrite(os.path.join(self.snapshots_dir, "cam-a-01_incident.jpg"), img_normal)
        cv2.imwrite(os.path.join(self.snapshots_dir, "corridor_normal.jpg"), img_normal)

        # 2. Demo 1: Crowd Detected (CAM-A-02 - 12 people)
        img_crowd = self._draw_corridor_background(w, h)
        np.random.seed(101)
        for i in range(12):
            px = int(140 + (i % 6) * 90 + np.sin(i * 1.7) * 25)
            py = int(170 + (i // 6) * 80 + np.cos(i * 1.3) * 20)
            pw = int(45 + (i % 3) * 5)
            ph = int(115 + (i % 3) * 15)
            # Draw person
            self._draw_person(img_crowd, px, py, pw, ph, (182, 74, 108) if i % 2 == 0 else (120, 90, 200))
            # Draw bounding box in Tangerine (Warning)
            cv2.rectangle(img_crowd, (px - 5, py - 5), (px + pw + 5, py + ph + 5), (40, 140, 242), 2)
            cv2.putText(img_crowd, f"P#{i+1} 94%", (px - 5, py - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.45, (40, 140, 242), 1)

        # Add HUD Banner
        cv2.rectangle(img_crowd, (10, 10), (320, 60), (30, 30, 35), -1)
        cv2.putText(img_crowd, "AI: CROWD DETECTED (12/8)", (20, 35), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (40, 140, 242), 2)
        cv2.putText(img_crowd, "Block A - Floor 2 East Corridor", (20, 52), cv2.FONT_HERSHEY_SIMPLEX, 0.4, (220, 220, 220), 1)
        cv2.imwrite(os.path.join(self.snapshots_dir, "cam-a-02_incident.jpg"), img_crowd)
        cv2.imwrite(os.path.join(self.snapshots_dir, "demo_crowd.jpg"), img_crowd)

        # 3. Demo 2: Possible Fall (CAM-B-03 - Fallen person)
        img_fall = self._draw_corridor_background(w, h)
        # Fallen person
        fx, fy, fw, fh = 260, 290, 280, 85
        self._draw_person(img_fall, fx, fy, fw, fh, (60, 50, 180), is_fall=True)
        # Critical Red Bounding Box
        cv2.rectangle(img_fall, (fx - 8, fy - 8), (fx + fw + 8, fy + fh + 8), (50, 50, 230), 2)
        cv2.putText(img_fall, "POSSIBLE FALL 91% (7.2s)", (fx - 8, fy - 14), cv2.FONT_HERSHEY_SIMPLEX, 0.55, (50, 50, 230), 2)
        
        # Add HUD Banner
        cv2.rectangle(img_fall, (10, 10), (330, 60), (30, 30, 35), -1)
        cv2.putText(img_fall, "AI: CRITICAL FALL DETECTED", (20, 35), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (50, 50, 230), 2)
        cv2.putText(img_fall, "Block B - Floor 3 Corridor 2", (20, 52), cv2.FONT_HERSHEY_SIMPLEX, 0.4, (220, 220, 220), 1)
        cv2.imwrite(os.path.join(self.snapshots_dir, "cam-b-03_incident.jpg"), img_fall)
        cv2.imwrite(os.path.join(self.snapshots_dir, "demo_fall.jpg"), img_fall)

        # 4. Demo 3: Restricted Area Entry (CAM-B-01 - Maintenance Zone)
        img_restricted = self._draw_corridor_background(w, h)
        # Draw Restricted Zone Polygon overlay in translucent tangerine/red
        overlay = img_restricted.copy()
        poly_pts = np.array([
            [int(w * 0.55), int(h * 0.35)],
            [int(w * 0.95), int(h * 0.35)],
            [int(w * 0.98), int(h * 0.95)],
            [int(w * 0.50), int(h * 0.95)]
        ], np.int32)
        cv2.fillPoly(overlay, [poly_pts], (40, 100, 240))
        cv2.addWeighted(overlay, 0.35, img_restricted, 0.65, 0, img_restricted)
        cv2.polylines(img_restricted, [poly_pts], True, (40, 140, 242), 2)
        cv2.putText(img_restricted, "RESTRICTED ZONE (MAINTENANCE)", (int(w * 0.52), int(h * 0.33)), cv2.FONT_HERSHEY_SIMPLEX, 0.45, (40, 140, 242), 1)

        # Person inside restricted zone
        rx, ry, rw, rh = int(w * 0.66), int(h * 0.45), 60, 155
        self._draw_person(img_restricted, rx, ry, rw, rh, (100, 50, 180))
        cv2.rectangle(img_restricted, (rx - 5, ry - 5), (rx + rw + 5, ry + rh + 5), (40, 140, 242), 2)
        cv2.putText(img_restricted, "UNAUTHORIZED INTRUSION 94%", (rx - 25, ry - 12), cv2.FONT_HERSHEY_SIMPLEX, 0.45, (40, 140, 242), 2)

        # Add HUD Banner
        cv2.rectangle(img_restricted, (10, 10), (350, 60), (30, 30, 35), -1)
        cv2.putText(img_restricted, "AI: RESTRICTED AREA ENTRY", (20, 35), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (40, 140, 242), 2)
        cv2.putText(img_restricted, "Block B - Ground Floor Maintenance", (20, 52), cv2.FONT_HERSHEY_SIMPLEX, 0.4, (220, 220, 220), 1)
        cv2.imwrite(os.path.join(self.snapshots_dir, "cam-b-01_incident.jpg"), img_restricted)
        cv2.imwrite(os.path.join(self.snapshots_dir, "demo_restricted.jpg"), img_restricted)

demo_generator = DemoGenerator()
