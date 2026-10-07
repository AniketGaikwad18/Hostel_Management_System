import React, { useState } from 'react';
import { Incident } from '../types';
import { IncidentDetailView } from './IncidentDetailView';

interface IncidentsViewProps {
  incidents: Incident[];
  onSelectIncident: (inc: Incident) => void;
  onRefreshData?: () => void;
}

export const IncidentsView: React.FC<IncidentsViewProps> = ({
  incidents,
  onRefreshData,
}) => {
  const [filter, setFilter] = useState<'ALL' | 'ACTIVE' | 'CRITICAL' | 'RESOLVED'>('ALL');
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);

  const fallbackIncidents: Incident[] = [
    {
      id: 101,
      code: 'HG-1041',
      type: 'CROWD_DETECTED',
      severity: 'HIGH',
      status: 'DETECTED',
      confidence: 0.94,
      duration: 12,
      description: 'Crowd detected in Block A Floor 2 East Corridor.',
      ai_observation: '12 persons detected in corridor, exceeding threshold of 8.',
      detected_at: new Date(Date.now() - 60000).toISOString(),
      created_at: new Date(Date.now() - 60000).toISOString(),
      camera: { id: 2, code: 'CAM-A-02', name: 'East Corridor', block: 'Block A', floor: 'Floor 2', corridor: 'East Corridor' } as any
    },
    {
      id: 102,
      code: 'HG-1042',
      type: 'POSSIBLE_FALL',
      severity: 'CRITICAL',
      status: 'ACKNOWLEDGED',
      confidence: 0.91,
      duration: 7.2,
      description: 'Possible person fall detected in Block B Floor 3 South Corridor.',
      ai_observation: 'Person detected in a horizontal position within the monitored corridor for 7.2 seconds.',
      detected_at: new Date(Date.now() - 360000).toISOString(),
      created_at: new Date(Date.now() - 360000).toISOString(),
      camera: { id: 3, code: 'CAM-B-03', name: 'South Corridor', block: 'Block B', floor: 'Floor 3', corridor: 'South Corridor' } as any
    },
    {
      id: 103,
      code: 'HG-1040',
      type: 'RESTRICTED_AREA_ENTRY',
      severity: 'HIGH',
      status: 'RESOLVED',
      confidence: 0.94,
      duration: 15,
      description: 'Restricted area entry detected in Block B Ground Floor Maintenance Corridor.',
      ai_observation: 'Person detected inside restricted maintenance corridor zone during active monitoring.',
      detected_at: new Date(Date.now() - 1920000).toISOString(),
      created_at: new Date(Date.now() - 1920000).toISOString(),
      camera: { id: 4, code: 'CAM-B-01', name: 'Maintenance Corridor', block: 'Block B', floor: 'Ground Floor', corridor: 'Maintenance Corridor' } as any
    }
  ];

  const sourceIncidents = incidents.length > 0 ? incidents : fallbackIncidents;

  const filtered = sourceIncidents.filter((i) => {
    if (filter === 'ACTIVE') return i.status !== 'RESOLVED';
    if (filter === 'CRITICAL') return i.severity === 'CRITICAL';
    if (filter === 'RESOLVED') return i.status === 'RESOLVED';
    return true;
  });

  const formatTime = (iso?: string) => {
    if (!iso) return '10:24 AM';
    return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getSnapshot = (inc: Incident) => {
    if (inc.type === 'POSSIBLE_FALL') return '/snapshots/cam-b-03_incident.jpg';
    if (inc.type === 'CROWD_DETECTED') return '/snapshots/cam-a-02_incident.jpg';
    if (inc.type === 'RESTRICTED_AREA_ENTRY') return '/snapshots/cam-b-01_incident.jpg';
    return '/snapshots/corridor_normal.jpg';
  };

  if (selectedIncident) {
    return (
      <IncidentDetailView
        incident={selectedIncident}
        onBack={() => setSelectedIncident(null)}
        onUpdated={() => {
          if (onRefreshData) onRefreshData();
          const updated = incidents.find(i => i.id === selectedIncident.id);
          if (updated) setSelectedIncident(updated);
        }}
      />
    );
  }

  return (
    <div className="space-y-8 animate-fade-in pb-16">
      
      {/* ─── HEADER ─── */}
      <section className="space-y-4">
        <div className="flex items-center space-x-3">
          <span className="text-[11px] font-mono font-bold text-purple-600">03</span>
          <span className="text-[10px] font-bold text-navy-900/30">—</span>
          <span className="text-[11px] font-bold text-navy-900 uppercase tracking-wider">INCIDENT ARCHIVE</span>
        </div>

        <div className="flex items-center justify-between">
          <p className="text-sm text-navy-900/50 font-medium">
            Log of AI corridor detections and warden responses.
          </p>

          {/* Filter tabs */}
          <div className="hidden sm:flex items-center space-x-1">
            {(['ALL', 'ACTIVE', 'CRITICAL', 'RESOLVED'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setFilter(tab)}
                className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider transition-all rounded-md ${
                  filter === tab
                    ? 'bg-navy-900 text-white'
                    : 'text-navy-900/40 hover:text-navy-900'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
      </section>

      <div className="editorial-line" />

      {/* ─── INCIDENT ENTRIES ─── */}
      <section className="space-y-5">
        {filtered.length === 0 ? (
          <p className="text-xs text-navy-900/30 font-medium text-center py-16">
            No incidents recorded under this filter.
          </p>
        ) : (
          filtered.map((inc, idx) => {
            const isCrit = inc.severity === 'CRITICAL';
            const isResolved = inc.status === 'RESOLVED';
            const isAck = inc.status === 'ACKNOWLEDGED';

            return (
              <div
                key={inc.id}
                onClick={() => setSelectedIncident(inc)}
                className="group cursor-pointer animate-fade-in"
                style={{ animationDelay: `${idx * 0.05}s` }}
              >
                <div className="grid grid-cols-12 gap-5 items-center py-5 border-b border-oat-200 group-hover:bg-oat-50/50 transition-colors -mx-4 px-4 rounded-md">
                  
                  {/* Thumbnail (3 cols) */}
                  <div className="col-span-3 sm:col-span-2">
                    <div className="aspect-video rounded-md overflow-hidden bg-navy-900">
                      <img
                        src={getSnapshot(inc)}
                        alt={inc.type}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    </div>
                  </div>

                  {/* Info (6 cols) */}
                  <div className="col-span-6 sm:col-span-7 space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-black text-navy-900 uppercase">
                        {isCrit ? '🚨' : '⚠'} {inc.type.replace(/_/g, ' ')}
                      </span>
                      <span className={`text-[9px] font-black px-2 py-0.5 rounded uppercase ${
                        isCrit ? 'bg-emergency-100 text-emergency-500' : 'bg-tangerine-100 text-tangerine-600'
                      }`}>
                        {inc.severity}
                      </span>
                    </div>
                    <p className="text-[11px] text-navy-900/50 font-medium">
                      {inc.camera?.block || 'Block A'} • {inc.camera?.floor || 'Floor 2'} — {Math.round(inc.confidence * 100)}% confidence
                    </p>
                    <div className="flex items-center space-x-3 text-[10px]">
                      <span className="font-mono text-navy-900/30">{formatTime(inc.detected_at)}</span>
                      {isResolved ? (
                        <span className="font-bold text-safety-600">RESOLVED</span>
                      ) : isAck ? (
                        <span className="font-bold text-purple-600">ACKNOWLEDGED</span>
                      ) : (
                        <span className="font-bold text-tangerine-500">ACTIVE</span>
                      )}
                    </div>
                  </div>

                  {/* Action (3 cols) */}
                  <div className="col-span-3 text-right">
                    <button className="text-[11px] font-bold text-purple-600 hover:text-purple-800 transition-colors uppercase tracking-wider">
                      VIEW →
                    </button>
                  </div>

                </div>
              </div>
            );
          })
        )}
      </section>

    </div>
  );
};
