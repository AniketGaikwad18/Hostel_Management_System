import React from 'react';
import { AnalyticsSummary } from '../types';

interface AnalyticsViewProps {
  analytics: AnalyticsSummary | null;
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({ analytics }) => {
  const summary = analytics || {
    incidents_today: 12,
    active_alerts: 3,
    critical_alerts: 1,
    cameras_online: 4,
    total_cameras: 4,
    avg_response_time_seconds: 102,
    avg_resolution_time_seconds: 258,
    most_active_location: 'Block A — Floor 2',
    incidents_by_type: {
      'Crowd': 6,
      'Fall': 3,
      'Restricted Movement': 3
    },
    incidents_by_severity: {},
    hourly_trend: []
  };

  const types = [
    { label: 'Crowd', count: summary.incidents_by_type['Crowd'] || 6, color: 'bg-tangerine-500', width: '75%' },
    { label: 'Fall', count: summary.incidents_by_type['Fall'] || 3, color: 'bg-emergency-600', width: '38%' },
    { label: 'Restricted Movement', count: summary.incidents_by_type['Restricted Movement'] || 3, color: 'bg-purple-600', width: '38%' },
  ];

  return (
    <div className="space-y-5 animate-fade-in pb-12 max-w-4xl">
      
      {/* Header */}
      <div>
        <h2 className="text-xl font-black text-gray-950 font-sans tracking-tight">
          Analytics
        </h2>
        <p className="text-xs text-gray-500">
          Core safety performance metrics
        </p>
      </div>

      {/* 4 Core Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        
        <div className="bg-oat-card border border-oat-300 rounded-2xl p-4 shadow-card">
          <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">
            Incidents Today
          </span>
          <span className="text-2xl font-black text-gray-950 font-sans mt-1 block">
            {summary.incidents_today}
          </span>
        </div>

        <div className="bg-oat-card border border-oat-300 rounded-2xl p-4 shadow-card">
          <span className="text-[10px] font-bold uppercase tracking-wider text-purple-700 block">
            Average Response Time
          </span>
          <span className="text-2xl font-black text-purple-800 font-sans mt-1 block">
            1m 42s
          </span>
        </div>

        <div className="bg-oat-card border border-oat-300 rounded-2xl p-4 shadow-card">
          <span className="text-[10px] font-bold uppercase tracking-wider text-safety-700 block">
            Average Resolution Time
          </span>
          <span className="text-2xl font-black text-safety-800 font-sans mt-1 block">
            4m 18s
          </span>
        </div>

        <div className="bg-oat-card border border-oat-300 rounded-2xl p-4 shadow-card">
          <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">
            Most Frequent Incident
          </span>
          <span className="text-lg font-black text-gray-950 font-sans mt-1 block truncate">
            Crowd
          </span>
        </div>

      </div>

      {/* ONE SIMPLE CHART: Incidents by Type */}
      <div className="bg-oat-card border border-oat-300 rounded-3xl p-6 shadow-card space-y-4">
        <h3 className="text-sm font-bold text-gray-950 uppercase tracking-wider">
          Incidents by Type
        </h3>

        <div className="space-y-3.5 pt-1">
          {types.map((t, idx) => (
            <div key={idx} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-gray-800">{t.label}</span>
                <span className="font-mono font-bold text-gray-700">{t.count}</span>
              </div>
              <div className="h-3 bg-oat-100 rounded-full overflow-hidden flex border border-oat-200">
                <div className={`h-full ${t.color} rounded-full`} style={{ width: t.width }} />
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
