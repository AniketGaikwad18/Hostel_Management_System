import { Camera, Incident, AnalyticsSummary, SystemSettings, TimelineEvent } from '../types';

export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
export const WS_BASE_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8000/ws';

export async function fetchHealth() {
  const res = await fetch(`${API_BASE_URL}/api/health`);
  if (!res.ok) throw new Error('Health check failed');
  return res.json();
}

export async function fetchCameras(params?: { block?: string; status?: string }): Promise<Camera[]> {
  const query = new URLSearchParams();
  if (params?.block) query.append('block', params.block);
  if (params?.status) query.append('status', params.status);
  const res = await fetch(`${API_BASE_URL}/api/cameras?${query.toString()}`);
  if (!res.ok) throw new Error('Failed to fetch cameras');
  return res.json();
}

export async function fetchIncidents(params?: { status?: string; severity?: string; limit?: number }): Promise<Incident[]> {
  const query = new URLSearchParams();
  if (params?.status) query.append('status', params.status);
  if (params?.severity) query.append('severity', params.severity);
  if (params?.limit) query.append('limit', params.limit.toString());
  const res = await fetch(`${API_BASE_URL}/api/incidents?${query.toString()}`);
  if (!res.ok) throw new Error('Failed to fetch incidents');
  return res.json();
}

export async function fetchIncidentById(id: number): Promise<Incident> {
  const res = await fetch(`${API_BASE_URL}/api/incidents/${id}`);
  if (!res.ok) throw new Error('Failed to fetch incident');
  return res.json();
}

export async function acknowledgeIncident(id: number, userName: string = 'Warden Rajesh', notes?: string) {
  const res = await fetch(`${API_BASE_URL}/api/incidents/${id}/acknowledge`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_name: userName, notes: notes || 'Warden acknowledged incident and verified camera feed.' })
  });
  if (!res.ok) throw new Error('Failed to acknowledge incident');
  return res.json();
}

export async function resolveIncident(id: number, userName: string = 'Warden Rajesh', notes?: string) {
  const res = await fetch(`${API_BASE_URL}/api/incidents/${id}/resolve`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_name: userName, notes: notes || 'Situation resolved on floor. Hallway safe and clear.' })
  });
  if (!res.ok) throw new Error('Failed to resolve incident');
  return res.json();
}

export async function escalateIncident(id: number, userName: string = 'Warden Rajesh', notes?: string) {
  const res = await fetch(`${API_BASE_URL}/api/incidents/${id}/escalate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_name: userName, notes: notes || 'Emergency escalation triggered.' })
  });
  if (!res.ok) throw new Error('Failed to escalate incident');
  return res.json();
}

export async function retryNotification(id: number) {
  const res = await fetch(`${API_BASE_URL}/api/incidents/${id}/retry-notification`, {
    method: 'POST'
  });
  if (!res.ok) throw new Error('Failed to retry notification');
  return res.json();
}

export async function triggerDemoScenario(scenario: 'crowd' | 'fall' | 'restricted', customThreshold?: number): Promise<{
  scenario: string;
  camera: string;
  location: string;
  people_count?: number;
  confidence?: string;
  duration?: string;
  severity: string;
  incident: { id: number; code: string; status: string; observation: string };
  timeline: TimelineEvent[];
}> {
  const res = await fetch(`${API_BASE_URL}/api/demo/trigger`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ scenario, custom_threshold: customThreshold })
  });
  if (!res.ok) throw new Error('Failed to trigger demo scenario');
  return res.json();
}

export async function uploadCustomVideo(file: File, scenario: string = 'crowd', cameraCode: string = 'CAM-A-01') {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('scenario', scenario);
  formData.append('camera_code', cameraCode);
  
  const res = await fetch(`${API_BASE_URL}/api/demo/upload-video`, {
    method: 'POST',
    body: formData
  });
  if (!res.ok) throw new Error('Failed to upload video');
  return res.json();
}

export async function testWhatsAppMessage(phoneNumber?: string, message?: string) {
  const res = await fetch(`${API_BASE_URL}/api/notifications/test-whatsapp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone_number: phoneNumber, message })
  });
  if (!res.ok) throw new Error('Failed to send test WhatsApp message');
  return res.json();
}

export async function testSMSMessage(phoneNumber?: string, message?: string) {
  const res = await fetch(`${API_BASE_URL}/api/notifications/test-sms`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone_number: phoneNumber, message })
  });
  if (!res.ok) throw new Error('Failed to send test SMS message');
  return res.json();
}

export async function fetchSMSStatus() {
  const res = await fetch(`${API_BASE_URL}/api/notifications/sms-status`);
  if (!res.ok) throw new Error('Failed to fetch SMS status');
  return res.json();
}

export async function fetchAnalyticsSummary(): Promise<AnalyticsSummary> {
  const res = await fetch(`${API_BASE_URL}/api/analytics/summary`);
  if (!res.ok) throw new Error('Failed to fetch analytics summary');
  return res.json();
}

export async function fetchSettings(): Promise<SystemSettings> {
  const res = await fetch(`${API_BASE_URL}/api/settings`);
  if (!res.ok) throw new Error('Failed to fetch settings');
  return res.json();
}

export async function updateSettings(settingsData: Record<string, any>) {
  const res = await fetch(`${API_BASE_URL}/api/settings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(settingsData)
  });
  if (!res.ok) throw new Error('Failed to save settings');
  return res.json();
}
