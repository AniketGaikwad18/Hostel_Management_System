export type Severity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type IncidentStatus = 'DETECTED' | 'ACKNOWLEDGED' | 'RESOLVED';
export type CameraStatus = 'NORMAL' | 'WARNING' | 'CRITICAL' | 'OFFLINE';

export interface Location {
  id: number;
  code: string;
  block: string;
  floor: string;
  wing: string;
  name: string;
  description?: string;
}

export interface Camera {
  id: number;
  code: string;
  name: string;
  block: string;
  floor: string;
  corridor: string;
  is_online: boolean;
  current_status: CameraStatus;
  people_count: number;
  crowd_threshold: number;
  stream_type: string;
  sample_video_key?: string;
  restricted_polygon?: string;
  location_id?: number;
  last_heartbeat?: string;
}

export interface IncidentAction {
  id: number;
  incident_id: number;
  user_name: string;
  action_type: string;
  notes?: string;
  timestamp: string;
}

export interface Notification {
  id: number;
  incident_id: number;
  provider: string;
  recipient: string;
  message_body: string;
  status: 'PENDING' | 'SENT' | 'SIMULATED_SENT' | 'FAILED';
  error_message?: string;
  sent_at?: string;
  created_at: string;
}

export interface Incident {
  id: number;
  code: string;
  type: string;
  severity: Severity;
  status: IncidentStatus;
  camera_id?: number;
  location_id?: number;
  confidence: number;
  duration: number;
  description: string;
  ai_observation: string;
  snapshot_url?: string;
  video_url?: string;
  metadata_json?: string;
  assigned_warden?: string;
  resolution_notes?: string;
  detected_at: string;
  acknowledged_at?: string;
  resolved_at?: string;
  created_at: string;
  camera?: Camera;
  location?: Location;
  notifications?: Notification[];
  actions?: IncidentAction[];
}

export interface AnalyticsSummary {
  incidents_today: number;
  active_alerts: number;
  critical_alerts: number;
  cameras_online: number;
  total_cameras: number;
  avg_response_time_seconds: number;
  avg_resolution_time_seconds: number;
  most_active_location: string;
  incidents_by_type: Record<string, number>;
  incidents_by_severity: Record<string, number>;
  hourly_trend: Array<{ hour: string; count: number }>;
}

export interface SystemSettings {
  CROWD_THRESHOLD?: string;
  FALL_CONFIDENCE_THRESHOLD?: string;
  FALL_DURATION_THRESHOLD?: string;
  DEMO_NOTIFICATION_MODE?: string;
  RESTRICTED_HOURS_START?: string;
  RESTRICTED_HOURS_END?: string;
  WARDEN_PHONE_NUMBER?: string;
  WHATSAPP_CONFIGURED?: boolean;
}

export interface TimelineEvent {
  time: string;
  event: string;
  status: 'active' | 'warning' | 'alert' | 'notified' | 'success';
}
