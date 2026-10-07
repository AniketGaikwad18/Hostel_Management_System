import React, { useState, useEffect, useCallback } from 'react';
import { DashboardView } from './views/DashboardView';
import { IncidentsView } from './views/IncidentsView';
import { AIDemoCenterView } from './views/AIDemoCenterView';
import { CamerasView } from './views/CamerasView';
import { SettingsView } from './views/SettingsView';
import { LoginView } from './views/LoginView';
import { IncidentDetailView } from './views/IncidentDetailView';
import { Camera, Incident, AnalyticsSummary } from './types';
import { 
  fetchCameras, 
  fetchIncidents, 
  fetchAnalyticsSummary, 
  WS_BASE_URL 
} from './services/api';
import { audioAlert } from './utils/audioAlert';

export type NavTab = 'overview' | 'demo' | 'incidents' | 'cameras' | 'settings';

/* ─── WHATSAPP TOAST COMPONENT ─── */
interface WhatsAppToastProps {
  incident: Incident | null;
  onDismiss: () => void;
  onViewIncident: (inc: Incident) => void;
}

const WhatsAppToast: React.FC<WhatsAppToastProps> = ({ incident, onDismiss, onViewIncident }) => {
  if (!incident) return null;

  const typeLabel = incident.type === 'POSSIBLE_FALL' ? 'Possible fall detected' 
    : incident.type === 'CROWD_DETECTED' ? 'Crowd detected' 
    : 'Restricted area entry';

  const location = `${incident.camera?.block || 'Block A'} • ${incident.camera?.floor || 'Floor 2'}`;
  const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-slide-in-bottom">
      <div className="w-80 bg-white rounded-xl shadow-toast border border-oat-300 overflow-hidden">
        {/* WhatsApp Green Header */}
        <div className="bg-[#128C7E] px-4 py-2.5 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-5 h-5 rounded-full bg-[#25D366] flex items-center justify-center">
              <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
              </svg>
            </div>
            <span className="text-white text-xs font-bold tracking-wide">WhatsApp</span>
          </div>
          <button onClick={onDismiss} className="text-white/70 hover:text-white text-sm">✕</button>
        </div>

        {/* Toast Body */}
        <div className="px-4 py-3 space-y-2">
          <div>
            <p className="text-[10px] font-bold text-navy-900 uppercase tracking-wider opacity-60">HOSTELGUARD AI</p>
            <p className="text-[10px] font-medium text-navy-900/50">Safety Alert</p>
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold text-navy-900 flex items-center space-x-1.5">
                <span className={incident.severity === 'CRITICAL' ? 'text-emergency-500' : 'text-tangerine-500'}>
                  {incident.severity === 'CRITICAL' ? '🚨' : '⚠'}
                </span>
                <span>{typeLabel}</span>
              </p>
              <span className="text-[9px] font-mono font-bold text-navy-900/40">{incident.code}</span>
            </div>
            <p className="text-[11px] text-navy-900/60 font-medium">{location} • {incident.severity} severity</p>
          </div>

          <div className="pt-2 border-t border-oat-200 space-y-1">
            <div className="flex items-center justify-between text-[11px]">
              <span className="font-bold text-safety-600 flex items-center space-x-1.5">
                <span>✓</span>
                <span>WhatsApp alert sent</span>
              </span>
              <span className="text-[10px] font-mono text-navy-900/40">{time}</span>
            </div>

            {(incident.severity === 'HIGH' || incident.severity === 'CRITICAL') && (
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-bold text-safety-600 flex items-center space-x-1.5">
                  <span>✓</span>
                  <span>SMS alert sent</span>
                </span>
                <span className="text-[9px] font-mono font-bold text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded">
                  SIM Network
                </span>
              </div>
            )}
          </div>
        </div>

        {/* View Action */}
        <button
          onClick={() => onViewIncident(incident)}
          className="w-full px-4 py-2.5 bg-oat-50 border-t border-oat-200 text-xs font-bold text-purple-600 hover:bg-purple-50 transition-colors text-center uppercase tracking-wider"
        >
          View Incident →
        </button>
      </div>
    </div>
  );
};

/* ─── MAIN APP ─── */
export function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem('hostelguard_auth') === 'true';
  });

  const [currentTab, setCurrentTab] = useState<NavTab>('overview');
  const [cameras, setCameras] = useState<Camera[]>([]);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null);
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [selectedCamera, setSelectedCamera] = useState<Camera | null>(null);
  const [toastIncident, setToastIncident] = useState<Incident | null>(null);

  const handleLogout = () => {
    localStorage.removeItem('hostelguard_auth');
    localStorage.removeItem('hostelguard_user');
    setIsAuthenticated(false);
  };

  // Load Data
  const loadData = useCallback(async () => {
    try {
      const [camsData, incsData, analData] = await Promise.all([
        fetchCameras(),
        fetchIncidents(),
        fetchAnalyticsSummary()
      ]);
      setCameras(camsData);
      setIncidents(incsData);
      setAnalytics(analData);
    } catch (err) {
      console.error('Error loading data:', err);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      loadData();
      const interval = setInterval(loadData, 10000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated, loadData]);

  // WebSocket Live Updates
  useEffect(() => {
    if (!isAuthenticated) return;

    let ws: WebSocket | null = null;
    let reconnectTimeout: any = null;

    const connectWs = () => {
      try {
        ws = new WebSocket(WS_BASE_URL);

        ws.onopen = () => {};

        ws.onmessage = (event) => {
          try {
            const msg = JSON.parse(event.data);
            if (msg.event === 'NEW_INCIDENT') {
              const inc = msg.data;
              if (inc.severity === 'CRITICAL') {
                audioAlert.playCriticalAlert();
              } else {
                audioAlert.playSafetyChime();
              }
              // Show WhatsApp toast
              setToastIncident(inc);
              setTimeout(() => setToastIncident(null), 8000);
              loadData();
            } else if (
              msg.event === 'INCIDENT_ACKNOWLEDGED' || 
              msg.event === 'INCIDENT_RESOLVED' || 
              msg.event === 'INCIDENT_ESCALATED' ||
              msg.event === 'INCIDENT_ALERT'
            ) {
              loadData();
            } else if (msg.event === 'CAMERA_TELEMETRY') {
              setCameras((prev) =>
                prev.map((c) =>
                  c.id === msg.data.camera_id
                    ? { ...c, people_count: msg.data.people_count, current_status: msg.data.status }
                    : c
                )
              );
            }
          } catch (e) {
            console.error('Error in WS listener:', e);
          }
        };

        ws.onclose = () => {
          reconnectTimeout = setTimeout(connectWs, 3000);
        };

        ws.onerror = () => {};
      } catch (e) {
        reconnectTimeout = setTimeout(connectWs, 3000);
      }
    };

    connectWs();

    return () => {
      if (ws) ws.close();
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
    };
  }, [isAuthenticated, loadData]);

  // If not authenticated, render Login Page
  if (!isAuthenticated) {
    return <LoginView onLoginSuccess={() => setIsAuthenticated(true)} />;
  }

  const activeIncidents = incidents.filter(i => i.status !== 'RESOLVED');
  const navTabs: Array<{ id: NavTab; label: string; number: string }> = [
    { id: 'overview', label: 'LIVE MONITORING', number: '01' },
    { id: 'demo', label: 'AI DEMO', number: '04' },
    { id: 'incidents', label: 'INCIDENTS', number: '03' },
    { id: 'cameras', label: 'CAMERAS', number: '06' },
    { id: 'settings', label: 'SETTINGS', number: '07' },
  ];

  return (
    <div className="min-h-screen bg-oat-100 flex flex-col font-sans text-navy-900">
      
      {/* ─── TOP EDITORIAL NAVIGATION ─── */}
      <header className="bg-oat-50/80 backdrop-blur-md border-b border-oat-300 sticky top-0 z-40">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-10">
          <div className="flex items-center justify-between h-14">
            
            {/* Left: Brand */}
            <div className="flex items-center space-x-3">
              <div className="w-7 h-7 rounded-md bg-purple-600 flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2L3 7v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-9-5z"/>
                </svg>
              </div>
              <span className="text-sm font-black text-navy-900 tracking-tight uppercase">
                HostelGuard <span className="text-purple-600">AI</span>
              </span>
            </div>

            {/* Center: Navigation */}
            <nav className="hidden md:flex items-center space-x-1">
              {navTabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => {
                    setSelectedIncident(null);
                    setCurrentTab(tab.id);
                  }}
                  className={`px-3.5 py-1.5 text-[11px] font-bold tracking-wider transition-all ${
                    currentTab === tab.id
                      ? 'text-purple-600 border-b-2 border-purple-600'
                      : 'text-navy-900/50 hover:text-navy-900'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>

            {/* Right: Status & Profile */}
            <div className="flex items-center space-x-4">
              {/* Monitoring Active Badge */}
              <div className="hidden sm:flex items-center space-x-1.5 text-[11px] font-bold text-safety-600">
                <span className="w-1.5 h-1.5 rounded-full bg-safety-500 animate-pulse-dot" />
                <span>MONITORING ACTIVE</span>
              </div>

              {/* Active Alerts */}
              {activeIncidents.length > 0 && (
                <button
                  onClick={() => { setSelectedIncident(null); setCurrentTab('incidents'); }}
                  className="flex items-center space-x-1.5 text-[11px] font-bold text-tangerine-600 bg-tangerine-50 px-2.5 py-1 rounded-md border border-tangerine-200"
                >
                  <span>⚠</span>
                  <span>{activeIncidents.length} ALERT{activeIncidents.length > 1 ? 'S' : ''}</span>
                </button>
              )}

              {/* Divider */}
              <div className="h-5 w-px bg-oat-300 hidden sm:block" />

              {/* Warden */}
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 rounded-full bg-navy-900 text-white flex items-center justify-center text-[10px] font-black">
                  W
                </div>
                <span className="text-xs font-bold text-navy-900 hidden sm:block uppercase tracking-wider">WARDEN</span>
                <button
                  onClick={handleLogout}
                  className="text-[10px] text-navy-900/40 hover:text-emergency-500 font-bold transition-colors ml-1"
                  title="Sign out"
                >
                  ✕
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* ─── MAIN CONTENT ─── */}
      <main className="flex-1 max-w-[1400px] mx-auto w-full px-6 lg:px-10 py-8">
        
        {selectedIncident ? (
          <IncidentDetailView
            incident={selectedIncident}
            onBack={() => setSelectedIncident(null)}
            onUpdated={() => {
              loadData();
              const updated = incidents.find(i => i.id === selectedIncident.id);
              if (updated) setSelectedIncident(updated);
            }}
          />
        ) : (
          <>
            {currentTab === 'overview' && (
              <DashboardView
                cameras={cameras}
                incidents={incidents}
                analytics={analytics}
                onSelectIncident={(inc) => setSelectedIncident(inc)}
                onSelectCamera={(cam) => {
                  setSelectedCamera(cam);
                  setCurrentTab('cameras');
                }}
                onRefreshData={loadData}
                onNavigateToIncidents={() => setCurrentTab('incidents')}
                onNavigateToDemo={() => setCurrentTab('demo')}
              />
            )}

            {currentTab === 'demo' && (
              <AIDemoCenterView
                onRefreshIncidents={loadData}
              />
            )}

            {currentTab === 'incidents' && (
              <IncidentsView
                incidents={incidents}
                onSelectIncident={(inc) => setSelectedIncident(inc)}
                onRefreshData={loadData}
              />
            )}

            {currentTab === 'cameras' && (
              <CamerasView
                cameras={cameras}
                onSelectCamera={(cam) => setSelectedCamera(cam)}
              />
            )}

            {currentTab === 'settings' && (
              <SettingsView />
            )}
          </>
        )}

      </main>

      {/* ─── WHATSAPP TOAST NOTIFICATION ─── */}
      <WhatsAppToast
        incident={toastIncident}
        onDismiss={() => setToastIncident(null)}
        onViewIncident={(inc) => {
          setToastIncident(null);
          setSelectedIncident(inc);
        }}
      />

    </div>
  );
}

export default App;
