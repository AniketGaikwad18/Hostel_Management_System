import React from 'react';
import { Camera, Incident, AnalyticsSummary } from '../types';
import { acknowledgeIncident } from '../services/api';

interface DashboardViewProps {
  cameras: Camera[];
  incidents: Incident[];
  analytics: AnalyticsSummary | null;
  onSelectIncident: (incident: Incident) => void;
  onSelectCamera: (camera: Camera) => void;
  onRefreshData: () => void;
  onNavigateToIncidents?: () => void;
  onNavigateToDemo?: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  cameras,
  incidents,
  onSelectIncident,
  onRefreshData,
  onNavigateToDemo,
}) => {
  const activeIncidents = incidents.filter(i => i.status !== 'RESOLVED');

  const handleQuickAcknowledge = async (e: React.MouseEvent, incidentId: number) => {
    e.stopPropagation();
    try {
      await acknowledgeIncident(incidentId, 'Warden');
      onRefreshData();
    } catch (err) {
      console.error('Failed to acknowledge:', err);
    }
  };

  // Primary Cameras
  const camA = cameras.find(c => c.code === 'CAM-A-02') || {
    id: 2, code: 'CAM-A-02', name: 'East Corridor', block: 'Block A',
    floor: 'Floor 2', corridor: 'East Corridor', people_count: 12, current_status: 'WARNING'
  };

  const camB = cameras.find(c => c.code === 'CAM-B-03') || {
    id: 3, code: 'CAM-B-03', name: 'South Corridor', block: 'Block B',
    floor: 'Floor 3', corridor: 'South Corridor', people_count: 1, current_status: 'CRITICAL'
  };

  // Incidents
  const crowdIncident = incidents.find(i => i.type === 'CROWD_DETECTED') || {
    id: 101, code: 'HG-1042', type: 'CROWD_DETECTED', severity: 'HIGH',
    status: 'DETECTED', confidence: 0.94, duration: 12,
    description: 'Crowd detected in Block A Floor 2 East Corridor.',
    ai_observation: '12 persons detected in corridor, exceeding threshold of 8.',
    detected_at: new Date().toISOString(), created_at: new Date().toISOString(),
    camera: camA as any
  };

  const fallIncident = incidents.find(i => i.type === 'POSSIBLE_FALL') || {
    id: 102, code: 'HG-1043', type: 'POSSIBLE_FALL', severity: 'CRITICAL',
    status: 'DETECTED', confidence: 0.91, duration: 7.2,
    description: 'Possible person fall detected in Block B Floor 3 South Corridor.',
    ai_observation: 'Person detected in horizontal posture for 7.2 seconds.',
    detected_at: new Date().toISOString(), created_at: new Date().toISOString(),
    camera: camB as any
  };

  return (
    <div className="space-y-10 animate-fade-in pb-16">
      
      {/* ─── HERO SECTION ─── */}
      <section className="space-y-6">
        
        {/* Editorial headline */}
        <div className="space-y-4">
          <p className="text-[11px] font-bold text-purple-600 uppercase tracking-[0.2em]">
            AI • CCTV • SAFER HOSTELS
          </p>
          <h1 className="text-editorial-lg text-navy-900 leading-[1.05]">
            YOUR HOSTEL.<br />
            ALWAYS WATCHED.
          </h1>
          <p className="text-sm text-navy-900/50 font-medium max-w-md">
            From passive CCTV to proactive hostel safety. AI monitors every corridor, every moment.
          </p>
        </div>

        {/* Status bar */}
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-1.5 text-[11px] font-bold text-safety-600">
            <span className="w-1.5 h-1.5 rounded-full bg-safety-500 animate-pulse-dot" />
            <span>AI monitoring active</span>
            <span className="text-navy-900/20 mx-1">|</span>
            <span className="text-navy-900/40">{cameras.length || 4} cameras online</span>
          </div>

          {onNavigateToDemo && (
            <button
              onClick={onNavigateToDemo}
              className="text-[11px] font-bold text-purple-600 hover:text-purple-800 transition-colors uppercase tracking-wider"
            >
              AI Safety Lab →
            </button>
          )}
        </div>

      </section>

      {/* ─── THIN LINE SEPARATOR ─── */}
      <div className="editorial-line" />

      {/* ─── 01 — LIVE MONITORING ─── */}
      <section className="space-y-5">
        
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <span className="text-[11px] font-mono font-bold text-purple-600">01</span>
            <span className="text-[10px] font-bold text-navy-900/30 uppercase tracking-wider">—</span>
            <span className="text-[11px] font-bold text-navy-900 uppercase tracking-wider">LIVE MONITORING</span>
          </div>
          <span className="text-[10px] font-mono font-bold text-navy-900/30 bg-oat-50 px-2 py-1 rounded border border-oat-300">
            {camA.code}
          </span>
        </div>

        {/* ─── MAIN VISUAL: LARGE CCTV FEED ─── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* LEFT: Large CCTV Video (8 cols) */}
          <div className="lg:col-span-8 space-y-3">
            
            {/* Camera location bar */}
            <div className="flex items-center justify-between text-[10px] font-bold text-navy-900/40 uppercase tracking-wider">
              <span>{camA.block} • {camA.floor} • East Corridor</span>
              <span className="flex items-center space-x-1.5 text-safety-600">
                <span className="w-1.5 h-1.5 rounded-full bg-safety-500" />
                <span>LIVE</span>
              </span>
            </div>

            {/* 16:9 CCTV frame */}
            <div className="relative aspect-video rounded-md overflow-hidden bg-navy-900 shadow-editorial-lg">
              <img
                src="/snapshots/cam-a-02_incident.jpg"
                alt="CAM-A-02 Live CCTV feed — East Corridor"
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/snapshots/corridor_normal.jpg';
                }}
              />

              {/* CCTV Timestamp */}
              <div className="cctv-timestamp absolute top-3 right-3">
                REC • {new Date().toLocaleDateString('en-GB').replace(/\//g, '/')} {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </div>

              {/* Crowd Detection Overlay (Screen 3) */}
              <div className="absolute top-3 left-3 bg-navy-900/85 backdrop-blur-md border border-tangerine-500/60 p-2.5 rounded text-white space-y-1 shadow-lg">
                <div className="flex items-center space-x-1.5 text-tangerine-400 text-[11px] font-black tracking-wider uppercase">
                  <span>⚠</span>
                  <span>CROWD DETECTED</span>
                </div>
                <div className="flex items-center space-x-2 text-[9px] font-mono text-white/90">
                  <span className="font-bold text-yellow-300">12 PEOPLE</span>
                  <span className="text-white/30">•</span>
                  <span>THRESHOLD: 8</span>
                  <span className="text-white/30">•</span>
                  <span className="text-purple-300 font-bold">94% CONFIDENCE</span>
                </div>
              </div>

              {/* Subtle AI Bounding Boxes */}
              <div className="absolute left-[15%] top-[20%] w-[18%] h-[55%] border border-tangerine-500/60 rounded-sm pointer-events-none">
                <span className="absolute -top-4 left-0 bg-tangerine-600 text-white text-[8px] font-bold px-1.5 py-0.5 rounded-sm">
                  PERSON 94%
                </span>
              </div>
              <div className="absolute left-[38%] top-[18%] w-[16%] h-[58%] border border-tangerine-500/60 rounded-sm pointer-events-none">
                <span className="absolute -top-4 left-0 bg-tangerine-600 text-white text-[8px] font-bold px-1.5 py-0.5 rounded-sm">
                  PERSON 92%
                </span>
              </div>
              <div className="absolute left-[60%] top-[22%] w-[17%] h-[52%] border border-tangerine-500/40 rounded-sm pointer-events-none">
                <span className="absolute -top-4 left-0 bg-tangerine-600/80 text-white text-[8px] font-bold px-1.5 py-0.5 rounded-sm">
                  PERSON 95%
                </span>
              </div>

              {/* Bottom HUD */}
              <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 to-transparent px-4 py-3 flex items-end justify-between">
                <div className="flex items-center space-x-3 text-[10px] text-white/80 font-bold">
                  <span className="flex items-center space-x-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-safety-500" />
                    <span>AI MONITORING</span>
                  </span>
                  <span className="text-white/30">|</span>
                  <span className="text-yellow-300 font-black">People: 12</span>
                </div>
                <span className="text-[10px] font-mono text-white/50">
                  Block A • Floor 2 • East Corridor
                </span>
              </div>
            </div>

            {/* Camera stats below video */}
            <div className="flex items-center justify-between text-[11px]">
              <div className="flex items-center space-x-4 text-navy-900/40 font-medium">
                <span>Threshold: <strong className="text-navy-900 font-bold">8</strong></span>
                <span className="text-oat-400">•</span>
                <span>Confidence: <strong className="text-purple-600 font-bold">94%</strong></span>
                <span className="text-oat-400">•</span>
                <span>Severity: <strong className="text-tangerine-500 font-bold">HIGH</strong></span>
              </div>
              <button
                onClick={() => onSelectIncident(crowdIncident as any)}
                className="text-[11px] font-bold text-purple-600 hover:text-purple-800 transition-colors uppercase tracking-wider"
              >
                View Incident →
              </button>
            </div>
          </div>

          {/* RIGHT: AI Detection Panel (4 cols) */}
          <div className="lg:col-span-4 space-y-5">
            
            {/* ─── 02 — AI DETECTION ─── */}
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <span className="text-[11px] font-mono font-bold text-purple-600">02</span>
                <span className="text-[10px] font-bold text-navy-900/30">—</span>
                <span className="text-[11px] font-bold text-navy-900 uppercase tracking-wider">AI DETECTION</span>
              </div>

              {/* Detection badge */}
              <div className="bg-tangerine-500 text-white text-xs font-black px-4 py-2.5 rounded-md text-center uppercase tracking-wider">
                ⚠ CROWD DETECTED
              </div>

              {/* Detection details */}
              <div className="space-y-3 text-xs">
                <div className="flex items-center justify-between py-2 border-b border-oat-200">
                  <span className="font-medium text-navy-900/40 uppercase tracking-wider text-[10px]">Location</span>
                  <span className="font-bold text-navy-900">Block A • Floor 2</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-oat-200">
                  <span className="font-medium text-navy-900/40 uppercase tracking-wider text-[10px]">Corridor</span>
                  <span className="font-bold text-navy-900">East Corridor</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-oat-200">
                  <span className="font-medium text-navy-900/40 uppercase tracking-wider text-[10px]">People detected</span>
                  <span className="font-black text-navy-900 text-base">12</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-oat-200">
                  <span className="font-medium text-navy-900/40 uppercase tracking-wider text-[10px]">Threshold</span>
                  <span className="font-bold text-navy-900">8</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-oat-200">
                  <span className="font-medium text-navy-900/40 uppercase tracking-wider text-[10px]">Confidence</span>
                  <span className="font-bold text-purple-600">94%</span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="font-medium text-navy-900/40 uppercase tracking-wider text-[10px]">Severity</span>
                  <span className="font-black text-tangerine-500 uppercase text-[11px]">HIGH</span>
                </div>
              </div>

              {/* CTA */}
              <button
                onClick={() => onSelectIncident(crowdIncident as any)}
                className="w-full bg-navy-900 hover:bg-navy-50 text-white text-[11px] font-bold py-3 rounded-md transition-colors uppercase tracking-[0.15em]"
              >
                VIEW INCIDENT →
              </button>
            </div>

            {/* ─── THIN LINE ─── */}
            <div className="editorial-line" />

            {/* ─── SECONDARY ALERT: POSSIBLE FALL ─── */}
            <div className="space-y-3">
              <div className="bg-emergency-500 text-white text-[10px] font-black px-3 py-1.5 rounded-md uppercase tracking-wider text-center">
                🚨 POSSIBLE FALL — CRITICAL
              </div>

              <div className="flex items-center space-x-3">
                <div className="w-20 h-14 rounded overflow-hidden bg-navy-900 flex-shrink-0">
                  <img src="/snapshots/cam-b-03_incident.jpg" alt="CAM-B-03" className="w-full h-full object-cover" />
                </div>
                <div className="space-y-0.5 min-w-0">
                  <p className="text-xs font-bold text-navy-900">Block B • Floor 3</p>
                  <p className="text-[10px] text-navy-900/50 font-medium">South Corridor • 91% confidence</p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => onSelectIncident(fallIncident as any)}
                  className="flex-1 text-[10px] font-bold text-navy-900 bg-oat-50 border border-oat-300 py-2 rounded-md hover:bg-oat-200 transition-colors uppercase tracking-wider"
                >
                  Inspect
                </button>
                <button
                  onClick={(e) => handleQuickAcknowledge(e, fallIncident.id)}
                  className="flex-1 text-[10px] font-bold text-white bg-emergency-500 py-2 rounded-md hover:bg-emergency-700 transition-colors uppercase tracking-wider"
                >
                  Acknowledge
                </button>
              </div>
            </div>

            {/* ─── SYSTEM HEALTH ─── */}
            <div className="editorial-line" />
            <div className="space-y-2.5">
              <span className="text-[10px] font-bold text-navy-900/30 uppercase tracking-wider">System Health</span>
              <div className="space-y-1.5 text-[11px]">
                <div className="flex items-center justify-between">
                  <span className="text-navy-900/40 font-medium">Active Cameras</span>
                  <span className="font-bold text-navy-900">{cameras.length || 4} / {cameras.length || 4} Online</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-navy-900/40 font-medium">WhatsApp Dispatch</span>
                  <span className="font-bold text-safety-600">● Active</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

    </div>
  );
};
