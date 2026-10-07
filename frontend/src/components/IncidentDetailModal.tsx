import React, { useState } from 'react';
import { 
  X, 
  CheckCircle2, 
  CheckCheck,
  Send
} from 'lucide-react';
import { Incident } from '../types';
import { API_BASE_URL, acknowledgeIncident, resolveIncident } from '../services/api';

interface IncidentDetailModalProps {
  incident: Incident | null;
  onClose: () => void;
  onUpdated: () => void;
}

export const IncidentDetailModal: React.FC<IncidentDetailModalProps> = ({
  incident,
  onClose,
  onUpdated,
}) => {
  const [isActing, setIsActing] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  if (!incident) return null;

  const isCritical = incident.severity === 'CRITICAL';
  const isAcknowledged = incident.status === 'ACKNOWLEDGED';
  const isResolved = incident.status === 'RESOLVED';

  const formatTime = (isoString?: string) => {
    if (!isoString) return '10:24 PM';
    return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const handleAcknowledge = async () => {
    try {
      setIsActing(true);
      await acknowledgeIncident(incident.id, 'Warden');
      setActionSuccess('Warden Acknowledged');
      setTimeout(() => setActionSuccess(null), 3000);
      onUpdated();
    } catch (err: any) {
      alert(err.message || 'Failed to acknowledge');
    } finally {
      setIsActing(false);
    }
  };

  const handleResolve = async () => {
    try {
      setIsActing(true);
      await resolveIncident(incident.id, 'Warden', 'Situation inspected and verified safe.');
      setActionSuccess('Incident Resolved');
      setTimeout(() => setActionSuccess(null), 3000);
      onUpdated();
    } catch (err: any) {
      alert(err.message || 'Failed to resolve');
    } finally {
      setIsActing(false);
    }
  };

  const snapshotSrc = incident.snapshot_url
    ? (incident.snapshot_url.startsWith('http') ? incident.snapshot_url : `${API_BASE_URL}${incident.snapshot_url}`)
    : `${API_BASE_URL}/uploads/snapshots/corridor_normal.jpg`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
      <div className="bg-oat-50 rounded-3xl border border-oat-300 shadow-modal max-w-lg w-full max-h-[92vh] overflow-y-auto flex flex-col font-sans">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-oat-300 flex items-center justify-between bg-white rounded-t-3xl">
          <div className="flex items-center space-x-2">
            <span className="text-xl">
              {isCritical ? '🚨' : '⚠'}
            </span>
            <h3 className={`text-base font-black tracking-tight uppercase ${
              isCritical ? 'text-emergency-700' : 'text-tangerine-800'
            }`}>
              {incident.type.replace(/_/g, ' ')}
            </h3>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-oat-200 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5">
          
          {/* Location details */}
          <div className="text-sm font-bold text-gray-900">
            <p>{incident.camera?.block || 'Block A'}</p>
            <p className="text-gray-700">{incident.camera?.floor || 'Floor 2'}</p>
            <p className="text-gray-500 font-medium">{incident.camera?.corridor || 'East Corridor'}</p>
          </div>

          {/* Metrics summary */}
          <div className="grid grid-cols-4 gap-2 text-xs">
            <div className="bg-white p-3 rounded-2xl border border-oat-300 text-center">
              <span className="text-[10px] uppercase font-bold text-gray-400 block">People</span>
              <strong className="text-sm font-black text-gray-900">
                {incident.type === 'CROWD_DETECTED' ? '12 people' : '1 person'}
              </strong>
            </div>

            <div className="bg-white p-3 rounded-2xl border border-oat-300 text-center">
              <span className="text-[10px] uppercase font-bold text-gray-400 block">Confidence</span>
              <strong className="text-sm font-black text-purple-700">
                {Math.round(incident.confidence * 100)}%
              </strong>
            </div>

            <div className="bg-white p-3 rounded-2xl border border-oat-300 text-center">
              <span className="text-[10px] uppercase font-bold text-gray-400 block">Severity</span>
              <strong className={`text-sm font-black uppercase ${
                isCritical ? 'text-emergency-600' : 'text-tangerine-600'
              }`}>
                {incident.severity}
              </strong>
            </div>

            <div className="bg-white p-3 rounded-2xl border border-oat-300 text-center">
              <span className="text-[10px] uppercase font-bold text-gray-400 block">Time</span>
              <strong className="text-xs font-bold text-gray-900 font-mono block mt-0.5">
                {formatTime(incident.detected_at)}
              </strong>
            </div>
          </div>

          {/* Large Video / Snapshot View */}
          <div className="relative rounded-2xl overflow-hidden bg-gray-950 aspect-video shadow-inner flex items-center justify-center border border-gray-800">
            <img
              src={snapshotSrc}
              alt="Incident snapshot"
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).src = `${API_BASE_URL}/uploads/snapshots/corridor_normal.jpg`;
              }}
            />
            <div className="absolute top-2.5 left-2.5 bg-black/75 backdrop-blur-xs px-2.5 py-1 rounded-md text-white text-[11px] font-mono flex items-center space-x-1.5">
              <span className="w-2 h-2 rounded-full bg-emergency-500 animate-pulse" />
              <span>{incident.camera?.code || 'CAM-A-02'}</span>
            </div>
          </div>

          {/* Action Success Toast */}
          {actionSuccess && (
            <div className="p-3 bg-safety-50 border border-safety-200 text-safety-800 text-xs font-bold rounded-2xl text-center animate-fade-in">
              ✓ {actionSuccess}
            </div>
          )}

          {/* Warden Response Actions */}
          <div className="pt-2 border-t border-oat-200 space-y-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-gray-400 block">
              WARDEN RESPONSE
            </span>

            {!isResolved ? (
              <div className="grid grid-cols-2 gap-3">
                {!isAcknowledged && (
                  <button
                    onClick={handleAcknowledge}
                    disabled={isActing}
                    className="bg-purple-600 hover:bg-purple-700 text-white text-xs font-black py-3 rounded-2xl shadow-xs transition-colors flex items-center justify-center space-x-1.5 active:scale-95"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>ACKNOWLEDGE</span>
                  </button>
                )}

                <button
                  onClick={handleResolve}
                  disabled={isActing}
                  className={`bg-safety-600 hover:bg-safety-700 text-white text-xs font-black py-3 rounded-2xl shadow-xs transition-colors flex items-center justify-center space-x-1.5 active:scale-95 ${
                    !isAcknowledged ? 'col-span-1' : 'col-span-2'
                  }`}
                >
                  <CheckCheck className="w-4 h-4" />
                  <span>RESOLVE</span>
                </button>
              </div>
            ) : (
              <div className="p-3 bg-safety-50 border border-safety-200 text-safety-800 text-xs font-bold rounded-2xl text-center">
                ✓ Incident Resolved
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
};
