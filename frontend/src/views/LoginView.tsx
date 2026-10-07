import React, { useState } from 'react';

interface LoginViewProps {
  onLoginSuccess: () => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('Warden');
  const [password, setPassword] = useState('warden123');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    setTimeout(() => {
      if (
        (username.trim().toLowerCase() === 'warden' || username.trim().toLowerCase() === 'admin') && 
        password === 'warden123'
      ) {
        localStorage.setItem('hostelguard_auth', 'true');
        localStorage.setItem('hostelguard_user', username);
        onLoginSuccess();
      } else {
        setError('Invalid credentials. Use Warden / warden123 for hackathon demo.');
        setLoading(false);
      }
    }, 400);
  };

  return (
    <div className="min-h-screen relative font-sans overflow-hidden">
      
      {/* ─── FULL-SCREEN BACKGROUND PHOTOGRAPH ─── */}
      <div 
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url('/campus_hero.jpg')` }}
      />
      
      {/* Dark overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-navy-900/85 via-navy-900/70 to-navy-900/80" />

      {/* ─── CONTENT GRID ─── */}
      <div className="relative z-10 min-h-screen grid grid-cols-1 lg:grid-cols-2">
        
        {/* ─── LEFT: EDITORIAL BRAND PROPOSITION ─── */}
        <div className="flex flex-col justify-between p-8 sm:p-12 lg:p-16">
          
          {/* Top: Brand */}
          <div className="flex items-center space-x-3 animate-fade-in">
            <div className="w-8 h-8 rounded-md bg-purple-600 flex items-center justify-center">
              <svg className="w-4.5 h-4.5 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2L3 7v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-9-5z"/>
              </svg>
            </div>
            <span className="text-base font-black text-white tracking-tight uppercase">
              HostelGuard <span className="text-purple-300">AI</span>
            </span>
          </div>

          {/* Center: Large Editorial Headline */}
          <div className="space-y-6 max-w-lg animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
            <div className="space-y-1">
              <p className="text-[11px] font-bold text-purple-300 uppercase tracking-[0.2em]">
                AI • CCTV • SAFER HOSTELS
              </p>
              <div className="editorial-line w-12 bg-purple-400/30 my-3" style={{ height: '1px' }} />
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white leading-[1.05] tracking-tight">
              SEE THE RISK.<br />
              PREVENT THE<br />
              INCIDENT.
            </h1>

            <p className="text-sm text-white/60 font-medium leading-relaxed max-w-sm">
              AI-powered safety monitoring for smarter, safer hostels. Transforming passive CCTV into proactive protection.
            </p>

            {/* 3 Feature Markers */}
            <div className="flex items-center space-x-6 pt-4">
              <div className="space-y-1">
                <span className="text-[10px] font-mono font-bold text-purple-400 block">01</span>
                <span className="text-[11px] font-bold text-white/80 uppercase tracking-wider">AI Monitoring</span>
              </div>
              <div className="w-px h-8 bg-white/15" />
              <div className="space-y-1">
                <span className="text-[10px] font-mono font-bold text-purple-400 block">02</span>
                <span className="text-[11px] font-bold text-white/80 uppercase tracking-wider">Smart Detection</span>
              </div>
              <div className="w-px h-8 bg-white/15" />
              <div className="space-y-1">
                <span className="text-[10px] font-mono font-bold text-purple-400 block">03</span>
                <span className="text-[11px] font-bold text-white/80 uppercase tracking-wider">Real-time Alerts</span>
              </div>
            </div>
          </div>

          {/* Bottom: Attribution */}
          <div className="animate-fade-in" style={{ animationDelay: '0.3s' }}>
            <p className="text-[10px] text-white/30 font-mono">
              HOSTELGUARD AI — HOSTEL SAFETY SYSTEM v2.4
            </p>
          </div>

        </div>

        {/* ─── RIGHT: MINIMAL CREAM LOGIN PANEL ─── */}
        <div className="flex items-center justify-center p-8 sm:p-12 lg:p-16">
          <div className="w-full max-w-sm bg-oat-50 rounded-lg p-8 sm:p-10 shadow-editorial-lg animate-fade-in-up border border-oat-300/50" style={{ animationDelay: '0.2s' }}>
            
            {/* Header */}
            <div className="space-y-1.5 mb-8">
              <h2 className="text-2xl font-black text-navy-900 tracking-tight">
                Welcome Back
              </h2>
              <p className="text-xs text-navy-900/50 font-medium">
                Sign in to your HostelGuard AI command center.
              </p>
            </div>

            {/* Error */}
            {error && (
              <div className="mb-4 p-3 bg-emergency-50 border border-emergency-200 text-emergency-600 text-xs font-bold rounded-md animate-fade-in">
                {error}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              
              {/* Username */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-navy-900/60 uppercase tracking-wider block">
                  Username
                </label>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Warden"
                  className="w-full px-4 py-3 bg-white border border-oat-300 rounded-md text-sm font-bold text-navy-900 focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent transition-all placeholder:text-navy-900/25"
                />
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-navy-900/60 uppercase tracking-wider block">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-4 py-3 bg-white border border-oat-300 rounded-md text-sm font-bold text-navy-900 focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent transition-all placeholder:text-navy-900/25"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-navy-900/40 hover:text-navy-900 uppercase tracking-wider"
                  >
                    {showPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-navy-900 hover:bg-navy-50 text-white text-xs font-black py-3.5 rounded-md shadow-editorial transition-all flex items-center justify-center space-x-2 uppercase tracking-[0.15em] active:scale-[0.99] disabled:opacity-50"
              >
                <span>{loading ? 'AUTHENTICATING...' : 'SIGN IN'}</span>
                {!loading && <span>→</span>}
              </button>

            </form>

            {/* Footer */}
            <div className="mt-8 pt-5 border-t border-oat-300">
              <div className="flex items-center justify-center space-x-3 text-[10px] font-bold text-navy-900/30 uppercase tracking-wider">
                <span>AI Monitoring</span>
                <span className="text-oat-400">•</span>
                <span>Smart Detection</span>
                <span className="text-oat-400">•</span>
                <span>Real-time Alerts</span>
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};
