import React, { useState } from 'react';
import { Incident } from '../types';
import { acknowledgeIncident, resolveIncident, escalateIncident } from '../services/api';

interface IncidentDetailViewProps {
  incident: Incident;
  onBack: () => void;
  onUpdated: () => void;
}

export const IncidentDetailView: React.FC<IncidentDetailViewProps> = ({
  incident,
  onBack,
  onUpdated,
}) => {
  const [isActing, setIsActing] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const isCritical = incident.severity === 'CRITICAL';
  const isAcknowledged = incident.status === 'ACKNOWLEDGED';
  const isResolved = incident.status === 'RESOLVED';

  const handleAcknowledge = async () => {
    try {
      setIsActing(true);
      await acknowledgeIncident(incident.id, 'Warden');
      setToast('Warden acknowledged incident');
      setTimeout(() => setToast(null), 3000);
      onUpdated();
    } catch (e: any) {
      alert(e.message || 'Failed to acknowledge');
    } finally {
      setIsActing(false);
    }
  };

  const handleResolve = async () => {
    try {
      setIsActing(true);
      await resolveIncident(incident.id, 'Warden', 'Situation inspected and verified safe.');
      setToast('Incident marked as resolved');
      setTimeout(() => setToast(null), 3000);
      onUpdated();
    } catch (e: any) {
      alert(e.message || 'Failed to resolve');
    } finally {
      setIsActing(false);
    }
  };

  const handleEscalate = async () => {
    try {
      setIsActing(true);
      await escalateIncident(incident.id, 'Warden', 'Escalated to critical emergency status');
      setToast('Incident escalated to critical status');
      setTimeout(() => setToast(null), 3000);
      onUpdated();
    } catch (e: any) {
      alert(e.message || 'Failed to escalate');
    } finally {
      setIsActing(false);
    }
  };

  const getSnapshot = (code?: string, type?: string) => {
    if (type === 'POSSIBLE_FALL' || code === 'CAM-B-03') return '/snapshots/cam-b-03_incident.jpg';
    if (type === 'CROWD_DETECTED' || code === 'CAM-A-02') return '/snapshots/cam-a-02_incident.jpg';
    if (type === 'RESTRICTED_AREA_ENTRY' || code === 'CAM-B-01') return '/snapshots/cam-b-01_incident.jpg';
    return '/snapshots/corridor_normal.jpg';
  };

  const snapshotSrc = getSnapshot(incident.camera?.code, incident.type);
  const typeLabel = incident.type === 'POSSIBLE_FALL' ? 'POSSIBLE FALL' : incident.type.replace(/_/g, ' ');

  return (
    <div className="space-y-8 animate-fade-in pb-16">
      
      {/* ─── BACK NAVIGATION ─── */}
      <button
        onClick={onBack}
        className="text-[11px] font-bold text-navy-900/40 hover:text-purple-600 transition-colors uppercase tracking-wider"
      >
        ← Back to Incidents
      </button>

      {/* ─── HEADER ─── */}
      <section className="space-y-4">
        <div className="flex items-center space-x-3">
          <span className="text-[11px] font-mono font-bold text-purple-600">03</span>
          <span className="text-[10px] font-bold text-navy-900/30">—</span>
          <span className="text-[11px] font-bold text-navy-900 uppercase tracking-wider">INCIDENT</span>
        </div>

        <div className="flex items-center justify-between">
          <h1 className="text-editorial-md text-navy-900 uppercase">
            {typeLabel}
          </h1>
          <span className={`text-[10px] font-black px-3 py-1 rounded uppercase tracking-wider ${
            isCritical ? 'bg-emergency-500 text-white' : 'bg-tangerine-500 text-white'
          }`}>
            {incident.severity}
          </span>
        </div>

        <p className="text-[10px] font-mono text-navy-900/30">
          Incident ID: {incident.code} • Automated AI Computer Vision Detection
        </p>
      </section>

      <div className="editorial-line" />

      {/* ─── MAIN CONTENT: CCTV IMAGE + DETAILS ─── */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* LEFT: Large CCTV Snapshot (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          
          {/* Main frame */}
          <div className="relative aspect-video rounded-md overflow-hidden bg-navy-900 shadow-editorial-lg">
            <img
              src={snapshotSrc}
              alt="CCTV Incident Frame"
              className="w-full h-full object-cover"
            />

            {/* Bounding box */}
            <div className={`absolute inset-x-[12%] inset-y-[10%] border-2 rounded-sm pointer-events-none ${
              isCritical ? 'border-emergency-500 bg-emergency-500/10' : 'border-tangerine-500 bg-tangerine-500/10'
            }`}>
              <span className={`absolute top-1 left-1 text-[9px] font-black px-1.5 py-0.5 rounded text-white ${
                isCritical ? 'bg-emergency-500' : 'bg-tangerine-600'
              }`}>
                {typeLabel}
              </span>
            </div>

            {/* Timestamp */}
            <div className="cctv-timestamp absolute bottom-3 left-3">
              REC • 2024/10/27 15:42:18
            </div>
          </div>

          {/* Thumbnail gallery */}
          <div className="grid grid-cols-3 gap-2">
            <div className="aspect-video rounded overflow-hidden ring-2 ring-purple-600 ring-offset-1 ring-offset-oat-100">
              <img src={snapshotSrc} alt="Frame 1" className="w-full h-full object-cover" />
            </div>
            <div className="aspect-video rounded overflow-hidden opacity-60 hover:opacity-100 transition-opacity cursor-pointer">
              <img src="/snapshots/corridor_normal.jpg" alt="Frame 2" className="w-full h-full object-cover" />
            </div>
            <div className="aspect-video rounded overflow-hidden opacity-60 hover:opacity-100 transition-opacity cursor-pointer">
              <img src="/snapshots/cam-a-02_incident.jpg" alt="Frame 3" className="w-full h-full object-cover" />
            </div>
          </div>
        </div>

        {/* RIGHT: Details & Actions (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* ─── INCIDENT DETAILS ─── */}
          <div className="space-y-3">
            <span className="text-[10px] font-bold text-navy-900/30 uppercase tracking-wider">Details</span>
            
            <div className="space-y-0 text-[11px]">
              <div className="flex items-center justify-between py-2.5 border-b border-oat-200">
                <span className="font-medium text-navy-900/40 uppercase tracking-wider text-[10px]">Location</span>
                <span className="font-bold text-navy-900 text-right">
                  {incident.camera?.block || 'Block B'} • {incident.camera?.floor || 'Floor 3'}
                  <br />
                  <span className="text-[10px] text-navy-900/50 font-medium">{incident.camera?.corridor || 'South Corridor'}</span>
                </span>
              </div>

              <div className="flex items-center justify-between py-2.5 border-b border-oat-200">
                <span className="font-medium text-navy-900/40 uppercase tracking-wider text-[10px]">Camera</span>
                <span className="font-mono font-bold text-purple-600 bg-purple-50 px-2 py-0.5 rounded text-[10px]">
                  {incident.camera?.code || 'CAM-B-03'}
                </span>
              </div>

              <div className="flex items-center justify-between py-2.5 border-b border-oat-200">
                <span className="font-medium text-navy-900/40 uppercase tracking-wider text-[10px]">Confidence</span>
                <span className="font-bold text-purple-600">
                  {Math.round(incident.confidence * 100)}%
                </span>
              </div>

              <div className="flex items-center justify-between py-2.5 border-b border-oat-200">
                <span className="font-medium text-navy-900/40 uppercase tracking-wider text-[10px]">Duration</span>
                <span className="font-mono font-bold text-navy-900">
                  {incident.duration > 0 ? `${incident.duration} sec` : '7.2 sec'}
                </span>
              </div>

              <div className="flex items-center justify-between py-2.5 border-b border-oat-200">
                <span className="font-medium text-navy-900/40 uppercase tracking-wider text-[10px]">Time</span>
                <span className="font-mono text-navy-900/60 text-[10px]">
                  {new Date(incident.detected_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>

              <div className="flex items-center justify-between py-2.5">
                <span className="font-medium text-navy-900/40 uppercase tracking-wider text-[10px]">Status</span>
                {isResolved ? (
                  <span className="text-[10px] font-bold text-safety-600 uppercase">Resolved</span>
                ) : isAcknowledged ? (
                  <span className="text-[10px] font-bold text-purple-600 uppercase">Acknowledged</span>
                ) : (
                  <span className="text-[10px] font-bold text-tangerine-500 uppercase">Active</span>
                )}
              </div>
            </div>
          </div>

          <div className="editorial-line" />

          {/* ─── AI OBSERVATION ─── */}
          <div className="space-y-2">
            <span className="text-[10px] font-bold text-navy-900/30 uppercase tracking-wider">AI Observation</span>
            <div className="bg-purple-50 border-l-2 border-purple-600 px-4 py-3 rounded-r-md">
              <p className="text-xs text-navy-900/70 font-medium italic leading-relaxed">
                "{incident.ai_observation || 'Person detected in a horizontal position within the monitored corridor for 7.2 seconds.'}"
              </p>
            </div>
          </div>

          {/* ─── Emergency Notifications Dispatched ─── */}
          <div className="space-y-2">
            <div className="flex items-center justify-between py-2 bg-safety-50 border border-safety-200 rounded-md px-3">
              <span className="text-[11px] font-bold text-safety-600 flex items-center space-x-1.5">
                <span>✓</span>
                <span>WhatsApp Alert Sent</span>
              </span>
              <span className="text-[10px] font-bold text-safety-600">Warden Mobile</span>
            </div>

            {(incident.severity === 'HIGH' || incident.severity === 'CRITICAL') && (
              <div className="flex items-center justify-between py-2 bg-safety-50 border border-safety-200 rounded-md px-3">
                <span className="text-[11px] font-bold text-safety-600 flex items-center space-x-1.5">
                  <span>✓</span>
                  <span>SMS Alert Sent</span>
                </span>
                <span className="text-[10px] font-mono font-bold text-purple-600">Android SIM Gateway</span>
              </div>
            )}

            {isCritical && (
              <div className="py-2 bg-emergency-50 border border-emergency-200 text-emergency-600 text-[10px] font-black uppercase tracking-wider rounded-md text-center">
                ⚠ Immediate Verification Required
              </div>
            )}
          </div>

          {/* ─── Toast ─── */}
          {toast && (
            <div className="py-2 bg-safety-50 border border-safety-200 text-safety-600 text-xs font-bold rounded-md text-center animate-fade-in">
              ✓ {toast}
            </div>
          )}

          {/* ─── WARDEN ACTIONS ─── */}
          <div className="space-y-3">
            <span className="text-[10px] font-bold text-navy-900/30 uppercase tracking-wider">Warden Response</span>

            {!isResolved ? (
              <div className="space-y-2">
                {!isAcknowledged && (
                  <button
                    onClick={handleAcknowledge}
                    disabled={isActing}
                    className="w-full bg-navy-900 hover:bg-navy-50 text-white text-[11px] font-bold py-3 rounded-md transition-colors uppercase tracking-[0.15em] disabled:opacity-50"
                  >
                    ACKNOWLEDGE
                  </button>
                )}

                <button
                  onClick={handleResolve}
                  disabled={isActing}
                  className="w-full bg-white hover:bg-safety-50 text-safety-600 border border-safety-200 text-[11px] font-bold py-3 rounded-md transition-colors uppercase tracking-[0.15em] disabled:opacity-50"
                >
                  MARK AS RESOLVED
                </button>

                {!isCritical && (
                  <button
                    onClick={handleEscalate}
                    disabled={isActing}
                    className="w-full text-[11px] font-bold text-emergency-500 hover:text-emergency-700 py-2 transition-colors uppercase tracking-wider text-center"
                  >
                    Escalate Incident
                  </button>
                )}
              </div>
            ) : (
              <div className="py-3 bg-safety-50 border border-safety-200 text-safety-600 text-xs font-bold rounded-md text-center">
                ✓ Incident Resolved
              </div>
            )}
          </div>

        </div>
      </section>

    </div>
  );
};
