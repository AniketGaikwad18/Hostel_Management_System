import React, { useState, useEffect } from 'react';
import { SystemSettings } from '../types';
import { fetchSettings, updateSettings, testWhatsAppMessage, testSMSMessage } from '../services/api';

export const SettingsView: React.FC = () => {
  const [settings, setSettings] = useState<SystemSettings>({
    CROWD_THRESHOLD: '8',
    FALL_CONFIDENCE_THRESHOLD: '0.80',
    FALL_DURATION_THRESHOLD: '3.0',
    RESTRICTED_HOURS_START: '22:00',
    RESTRICTED_HOURS_END: '06:00',
    DEMO_NOTIFICATION_MODE: 'False'
  });

  const [saving, setSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [testSending, setTestSending] = useState(false);
  const [testSmsSending, setTestSmsSending] = useState(false);

  useEffect(() => {
    fetchSettings().then(setSettings).catch(console.error);
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      await updateSettings(settings);
      setToastMessage('✓ Settings saved successfully');
      setTimeout(() => setToastMessage(null), 3000);
    } catch (err: any) {
      alert(`Save error: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleSendTestAlert = async () => {
    try {
      setTestSending(true);
      await testWhatsAppMessage();
      setToastMessage('✓ Test message delivered to warden WhatsApp');
      setTimeout(() => setToastMessage(null), 4000);
    } catch (err: any) {
      alert(`Test alert error: ${err.message}`);
    } finally {
      setTestSending(false);
    }
  };

  const handleSendTestSMS = async () => {
    try {
      setTestSmsSending(true);
      const res = await testSMSMessage();
      if (res.status === 'SMS_SENT') {
        setToastMessage('✓ Test SMS delivered via Android SIM gateway');
      } else if (res.status === 'SMS_GATEWAY_OFFLINE') {
        setToastMessage('⚠ SMS Gateway Offline (Check Android IP & local Wi-Fi)');
      } else {
        setToastMessage(`SMS Status: ${res.status}`);
      }
      setTimeout(() => setToastMessage(null), 5000);
    } catch (err: any) {
      alert(`Test SMS error: ${err.message}`);
    } finally {
      setTestSmsSending(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in pb-16 max-w-2xl">
      
      {/* ─── HEADER ─── */}
      <section className="space-y-4">
        <div className="flex items-center space-x-3">
          <span className="text-[11px] font-mono font-bold text-purple-600">07</span>
          <span className="text-[10px] font-bold text-navy-900/30">—</span>
          <span className="text-[11px] font-bold text-navy-900 uppercase tracking-wider">SETTINGS</span>
        </div>

        <p className="text-sm text-navy-900/50 font-medium">
          AI detection thresholds and notification configuration.
        </p>
      </section>

      <div className="editorial-line" />

      <form onSubmit={handleSave} className="space-y-8">
        
        {/* ─── 01 — AI DETECTION ─── */}
        <section className="space-y-5">
          <div className="flex items-center space-x-3">
            <span className="text-[11px] font-mono font-bold text-purple-600">01</span>
            <span className="text-[10px] font-bold text-navy-900/30">—</span>
            <span className="text-[11px] font-bold text-navy-900 uppercase tracking-wider">AI Detection</span>
          </div>

          <div className="space-y-0">
            {/* Crowd Threshold */}
            <div className="flex items-center justify-between py-4 border-b border-oat-200">
              <div>
                <span className="text-xs font-bold text-navy-900 block">Crowd Threshold</span>
                <span className="text-[10px] text-navy-900/40 font-medium">Persons to trigger alert</span>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="number"
                  value={settings.CROWD_THRESHOLD || '8'}
                  onChange={(e) => setSettings({ ...settings, CROWD_THRESHOLD: e.target.value })}
                  className="w-14 py-1.5 bg-white border border-oat-300 rounded-md font-mono font-bold text-center text-sm text-navy-900 focus:outline-none focus:ring-1 focus:ring-purple-600"
                />
                <span className="text-[10px] text-navy-900/40 font-medium">people</span>
              </div>
            </div>

            {/* Fall Confidence */}
            <div className="flex items-center justify-between py-4 border-b border-oat-200">
              <div>
                <span className="text-xs font-bold text-navy-900 block">Fall Confidence</span>
                <span className="text-[10px] text-navy-900/40 font-medium">Minimum AI certainty</span>
              </div>
              <span className="font-mono font-bold text-navy-900/60 bg-oat-50 px-3 py-1.5 rounded-md border border-oat-300 text-sm">
                80%
              </span>
            </div>

            {/* Fall Persistence */}
            <div className="flex items-center justify-between py-4 border-b border-oat-200">
              <div>
                <span className="text-xs font-bold text-navy-900 block">Fall Persistence</span>
                <span className="text-[10px] text-navy-900/40 font-medium">Sustained horizontal posture</span>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="number"
                  step="0.5"
                  value={settings.FALL_DURATION_THRESHOLD || '3'}
                  onChange={(e) => setSettings({ ...settings, FALL_DURATION_THRESHOLD: e.target.value })}
                  className="w-14 py-1.5 bg-white border border-oat-300 rounded-md font-mono font-bold text-center text-sm text-navy-900 focus:outline-none focus:ring-1 focus:ring-purple-600"
                />
                <span className="text-[10px] text-navy-900/40 font-medium">sec</span>
              </div>
            </div>

            {/* Restricted Hours */}
            <div className="flex items-center justify-between py-4">
              <div>
                <span className="text-xs font-bold text-navy-900 block">Restricted Hours</span>
                <span className="text-[10px] text-navy-900/40 font-medium">Nighttime corridor restrictions</span>
              </div>
              <div className="flex items-center space-x-2 font-mono text-sm font-bold text-navy-900/60">
                <span className="bg-oat-50 px-2.5 py-1.5 rounded-md border border-oat-300">10 PM</span>
                <span className="text-navy-900/20">–</span>
                <span className="bg-oat-50 px-2.5 py-1.5 rounded-md border border-oat-300">6 AM</span>
              </div>
            </div>
          </div>
        </section>

        <div className="editorial-line" />

        {/* ─── 02 — NOTIFICATIONS ─── */}
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <span className="text-[11px] font-mono font-bold text-purple-600">02</span>
              <span className="text-[10px] font-bold text-navy-900/30">—</span>
              <span className="text-[11px] font-bold text-navy-900 uppercase tracking-wider">Notifications (WhatsApp + SMS)</span>
            </div>
          </div>

          {/* Channel 1: WhatsApp */}
          <div className="space-y-3 p-4 bg-oat-50 rounded-md border border-oat-300/60">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-navy-900 uppercase">Channel 1 — WhatsApp</span>
              <span className="flex items-center space-x-1.5 text-[10px] font-bold text-safety-600">
                <span className="w-1.5 h-1.5 rounded-full bg-safety-500" />
                <span>Connected</span>
              </span>
            </div>
            <div className="flex items-center justify-between text-[11px] text-navy-900/60">
              <span>Recipient: Warden Mobile</span>
              <span className="font-mono font-bold text-navy-900">+91 ••••••100</span>
            </div>
            <button
              type="button"
              onClick={handleSendTestAlert}
              disabled={testSending}
              className="w-full bg-navy-900 hover:bg-navy-50 text-white text-[10px] font-bold py-2 rounded transition-colors uppercase tracking-wider"
            >
              {testSending ? 'Sending WhatsApp...' : 'Send Test WhatsApp →'}
            </button>
          </div>

          {/* Channel 2: Android SMS Gateway */}
          <div className="space-y-3 p-4 bg-oat-50 rounded-md border border-oat-300/60">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-black text-navy-900 uppercase">Channel 2 — Android SMS Gateway</span>
                <span className="text-[10px] text-navy-900/40 block font-medium">Physical SIM network (HIGH & CRITICAL alerts)</span>
              </div>
              <span className="flex items-center space-x-1.5 text-[10px] font-bold text-purple-600 bg-purple-50 px-2 py-0.5 rounded">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-600 animate-pulse-dot" />
                <span>SIM Ready</span>
              </span>
            </div>
            <div className="flex items-center justify-between text-[11px] text-navy-900/60">
              <span>Gateway Endpoint</span>
              <span className="font-mono text-[10px] text-navy-900/70 bg-white px-2 py-0.5 rounded border border-oat-300">
                http://192.168.1.100:8080
              </span>
            </div>
            <button
              type="button"
              onClick={handleSendTestSMS}
              disabled={testSmsSending}
              className="w-full bg-purple-600 hover:bg-purple-800 disabled:opacity-50 text-white text-[10px] font-bold py-2 rounded transition-all uppercase tracking-wider"
            >
              {testSmsSending ? 'Dispatching to Android Gateway...' : 'Send Test SMS →'}
            </button>
          </div>

          <p className="text-[10px] text-navy-900/30 text-center font-medium">
            Test alerts are dispatched to the warden's physical phone via live APIs.
          </p>
        </section>

        <div className="editorial-line" />

        {/* ─── SAVE BAR ─── */}
        <div className="flex items-center justify-between">
          {toastMessage ? (
            <span className="text-xs font-bold text-safety-600 animate-fade-in">{toastMessage}</span>
          ) : <div />}

          <button
            type="submit"
            disabled={saving}
            className="bg-navy-900 hover:bg-navy-50 text-white text-[11px] font-bold px-6 py-2.5 rounded-md transition-colors uppercase tracking-[0.15em] disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>

      </form>
    </div>
  );
};
