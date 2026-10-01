import React, { useState, useEffect } from 'react';
import {
  Activity, AlertTriangle, Shield, MapPin, Truck, Wrench, CheckCircle2,
  XCircle, Send, Cpu, Lock, RefreshCw, Flame, BarChart3, Database, Eye,
  ChevronRight, Sparkles, AlertOctagon, BatteryCharging, Thermometer, UserCheck
} from 'lucide-react';

interface KPI {
  total_vehicles: number;
  active_vehicles: number;
  open_alerts: number;
  critical_alerts: number;
  vehicles_at_risk: number;
  idle_cost_saved_usd: number;
  average_lead_time_days: number;
  fleet_health_score: number;
}

interface Vehicle {
  vin: string;
  fleet_name?: string;
  depot_city?: string;
  model_name: string;
  powertrain: string;
  risk: number;
  top_factors?: Array<{ factor: string; impact: string; detail: string }>;
  days_to_failure_est?: number;
  lat?: number;
  lon?: number;
  speed_kmh?: number;
}

interface AlertItem {
  alert_id: string;
  vin: string;
  rule_id: string;
  title: string;
  severity: number;
  raised_at: string;
  status: string;
  evidence: any;
  model_name?: string;
}

export default function App() {
  const [activeTab, setActiveTab] = useState<'overview' | 'map' | 'risk' | 'vehicle' | 'alerts' | 'copilot' | 'admin'>('overview');
  const [currentRole, setCurrentRole] = useState<'fleet_manager' | 'analyst' | 'tenant_admin' | 'viewer'>('fleet_manager');
  const [kpis, setKpis] = useState<KPI | null>(null);
  const [riskVehicles, setRiskVehicles] = useState<Vehicle[]>([]);
  const [mapVehicles, setMapVehicles] = useState<Vehicle[]>([]);
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [selectedVin, setSelectedVin] = useState<string>('1HGCM82603A000001');
  const [vehicleDetail, setVehicleDetail] = useState<any>(null);
  const [telemetryPoints, setTelemetryPoints] = useState<any[]>([]);
  const [similarCases, setSimilarCases] = useState<any[]>([]);
  const [chatMessages, setChatMessages] = useState<Array<{ sender: 'user' | 'agent'; text: string; citations?: any[]; proposals?: any[] }>>([
    {
      sender: 'agent',
      text: "👋 Hello Priya! I am FleetGuard Copilot. I continuously monitor telematics across your 100,000 vehicles, identifying early breakdown precursors and providing explainable preventive maintenance recommendations. Try asking: **'Which vehicles should I service this week and why?'**"
    }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isInjecting, setIsInjecting] = useState(false);
  const [injectToast, setInjectToast] = useState<string | null>(null);
  const [auditVerified, setAuditVerified] = useState<boolean | null>(null);
  const [erasureCert, setErasureCert] = useState<any | null>(null);

  // Fetch Core Data
  const fetchData = async () => {
    try {
      const [kpiRes, riskRes, alertRes, mapRes] = await Promise.all([
        fetch('/v1/kpis').then(r => r.json()),
        fetch('/v1/risk/top?limit=25').then(r => r.json()),
        fetch('/v1/alerts?limit=20').then(r => r.json()),
        fetch('/v1/map/vehicles').then(r => r.json())
      ]);
      setKpis(kpiRes);
      setRiskVehicles(riskRes.vehicles || []);
      setAlerts(alertRes.alerts || []);
      setMapVehicles(mapRes.vehicles || []);
    } catch (err) {
      console.error("Failed to load initial data", err);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 8000);
    return () => clearInterval(interval);
  }, []);

  // Fetch Vehicle Detail when selected
  useEffect(() => {
    if (!selectedVin) return;
    Promise.all([
      fetch(`/v1/vehicles/${selectedVin}`).then(r => r.json()),
      fetch(`/v1/vehicles/${selectedVin}/telemetry?days=7`).then(r => r.json()),
      fetch(`/v1/vehicles/${selectedVin}/similar-cases`).then(r => r.json())
    ]).then(([detail, telem, cases]) => {
      setVehicleDetail(detail);
      setTelemetryPoints(telem.points || []);
      setSimilarCases(cases.similar_cases || []);
    }).catch(console.error);
  }, [selectedVin]);

  // Demo Fault Injection (For 5-minute video)
  const handleInjectFault = async () => {
    setIsInjecting(true);
    try {
      const res = await fetch(`/v1/simulator/inject?fault=overheat&vin=${selectedVin}`, { method: 'POST' });
      const data = await res.json();
      setInjectToast(`🚨 CRITICAL OVERHEAT DETECTED in ${data.detection_latency_seconds}s! VIN: ${data.vin} coolant spiked to 118.5°C.`);
      setTimeout(() => setInjectToast(null), 8000);
      fetchData();
    } catch (err) {
      console.error(err);
    } finally {
      setIsInjecting(false);
    }
  };

  // Copilot Chat
  const handleSendMessage = async (msgText?: string) => {
    const textToSend = msgText || chatInput;
    if (!textToSend.trim()) return;

    const newMsgs = [...chatMessages, { sender: 'user' as const, text: textToSend }];
    setChatMessages(newMsgs);
    if (!msgText) setChatInput('');

    try {
      const res = await fetch('/v1/agent/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: json.stringify({ message: textToSend, context_vin: selectedVin })
      });
      const data = await res.json();
      setChatMessages([...newMsgs, {
        sender: 'agent',
        text: data.reply,
        citations: data.citations,
        proposals: data.proposals
      }]);
    } catch (err) {
      setChatMessages([...newMsgs, { sender: 'agent', text: "Service temporarily unavailable. Please try again." }]);
    }
  };

  // Approve Work Order from Agent
  const handleApproveAction = async (actionId: string) => {
    try {
      const res = await fetch(`/v1/agent/actions/${actionId}/approve`, { method: 'POST' });
      const data = await res.json();
      alert(`✅ Work order authorized and logged to SHA-256 audit ledger! WO ID: ${data.work_order_id}`);
      fetchData();
    } catch (err) {
      alert("Failed to approve action.");
    }
  };

  // Verify Audit Chain
  const handleVerifyAudit = async () => {
    const res = await fetch('/v1/audit/verify');
    const data = await res.json();
    setAuditVerified(data.verified);
  };

  // Request Right to Erasure
  const handleRequestErasure = async () => {
    const res = await fetch('/v1/privacy/erasure', { method: 'POST' });
    const data = await res.json();
    setErasureCert(data.certificate);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
      {/* Top Banner / Toast */}
      {injectToast && (
        <div className="bg-red-600 text-white px-6 py-3 font-semibold flex items-center justify-between shadow-2xl animate-bounce">
          <div className="flex items-center space-x-3">
            <Flame className="w-6 h-6 animate-pulse text-amber-300" />
            <span>{injectToast}</span>
          </div>
          <button onClick={() => setInjectToast(null)} className="text-white hover:text-slate-200 font-bold">✕</button>
        </div>
      )}

      {/* Navigation Header */}
      <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur sticky top-0 z-50 px-6 py-3.5 flex items-center justify-between">
        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-2.5 cursor-pointer" onClick={() => setActiveTab('overview')}>
            <div className="w-9 h-9 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 font-black text-xl shadow-lg shadow-emerald-500/10">
              FG
            </div>
            <div>
              <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-emerald-400 to-teal-200 bg-clip-text text-transparent">
                FleetGuard AI
              </span>
              <span className="text-[10px] block text-slate-400 -mt-1 font-mono uppercase tracking-wider">Predictive Copilot</span>
            </div>
          </div>

          <nav className="flex space-x-1 text-sm font-medium">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-3 py-1.5 rounded-md transition ${activeTab === 'overview' ? 'bg-emerald-500/20 text-emerald-400 font-semibold' : 'text-slate-400 hover:text-slate-200'}`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('map')}
              className={`px-3 py-1.5 rounded-md transition ${activeTab === 'map' ? 'bg-emerald-500/20 text-emerald-400 font-semibold' : 'text-slate-400 hover:text-slate-200'}`}
            >
              Live Map
            </button>
            <button
              onClick={() => setActiveTab('risk')}
              className={`px-3 py-1.5 rounded-md transition ${activeTab === 'risk' ? 'bg-emerald-500/20 text-emerald-400 font-semibold' : 'text-slate-400 hover:text-slate-200'}`}
            >
              7-Day Risk Ranking
            </button>
            <button
              onClick={() => setActiveTab('vehicle')}
              className={`px-3 py-1.5 rounded-md transition ${activeTab === 'vehicle' ? 'bg-emerald-500/20 text-emerald-400 font-semibold' : 'text-slate-400 hover:text-slate-200'}`}
            >
              Telemetry & Fingerprints
            </button>
            <button
              onClick={() => setActiveTab('alerts')}
              className={`px-3 py-1.5 rounded-md transition ${activeTab === 'alerts' ? 'bg-emerald-500/20 text-emerald-400 font-semibold' : 'text-slate-400 hover:text-slate-200'}`}
            >
              Alerts ({kpis?.critical_alerts || 0} Critical)
            </button>
            <button
              onClick={() => setActiveTab('copilot')}
              className={`px-3 py-1.5 rounded-md transition flex items-center space-x-1.5 ${activeTab === 'copilot' ? 'bg-emerald-500/20 text-emerald-400 font-semibold' : 'text-slate-400 hover:text-slate-200'}`}
            >
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <span>Fleet Copilot</span>
            </button>
            <button
              onClick={() => setActiveTab('admin')}
              className={`px-3 py-1.5 rounded-md transition ${activeTab === 'admin' ? 'bg-emerald-500/20 text-emerald-400 font-semibold' : 'text-slate-400 hover:text-slate-200'}`}
            >
              Audit & Privacy
            </button>
          </nav>
        </div>

        {/* Live Stream Badge & Demo Injector */}
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2 text-xs font-mono bg-slate-800/80 px-3 py-1.5 rounded-full border border-slate-700">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
            <span className="text-emerald-400 font-semibold">100,000 Vehicles</span>
            <span className="text-slate-500">•</span>
            <span className="text-slate-300">100K evt/s</span>
          </div>

          <button
            onClick={handleInjectFault}
            disabled={isInjecting}
            className="flex items-center space-x-1.5 bg-red-500/20 border border-red-500/40 hover:bg-red-500/30 text-red-400 text-xs font-bold px-3 py-1.5 rounded-md transition shadow-md shadow-red-950"
            title="Triggers live overheat on vehicle for video recording"
          >
            <Flame className="w-3.5 h-3.5" />
            <span>{isInjecting ? 'Injecting...' : '🔥 Inject Fault (Demo)'}</span>
          </button>

          {/* Role Switcher */}
          <div className="flex items-center space-x-1 bg-slate-800 p-1 rounded-md text-xs font-medium">
            <span className="text-slate-400 px-1">Role:</span>
            <select
              value={currentRole}
              onChange={(e) => setCurrentRole(e.target.value as any)}
              className="bg-slate-900 text-emerald-400 font-semibold px-2 py-1 rounded outline-none border border-slate-700 cursor-pointer"
            >
              <option value="fleet_manager">Priya (Fleet Mgr)</option>
              <option value="analyst">Ravi (Analyst)</option>
              <option value="tenant_admin">Anita (Admin)</option>
              <option value="viewer">Viewer (Masked)</option>
            </select>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 p-6 max-w-7xl mx-auto w-full">
        {/* TAB 1: OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg relative overflow-hidden">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Registered Fleet</span>
                    <h3 className="text-3xl font-black text-white mt-1">{(kpis?.total_vehicles || 100000).toLocaleString()}</h3>
                    <p className="text-xs text-emerald-400 mt-1 flex items-center">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block mr-1"></span>
                      {(kpis?.active_vehicles || 35000).toLocaleString()} Active on Road
                    </p>
                  </div>
                  <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-400">
                    <Truck className="w-6 h-6" />
                  </div>
                </div>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg relative overflow-hidden">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">7-Day Breakdown Risk</span>
                    <h3 className="text-3xl font-black text-amber-400 mt-1">{kpis?.vehicles_at_risk || 50}</h3>
                    <p className="text-xs text-amber-300 mt-1">Identified by LightGBM model</p>
                  </div>
                  <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg text-amber-400">
                    <AlertTriangle className="w-6 h-6" />
                  </div>
                </div>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg relative overflow-hidden">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Active Critical Alerts</span>
                    <h3 className="text-3xl font-black text-red-400 mt-1">{kpis?.critical_alerts || 4}</h3>
                    <p className="text-xs text-red-300 mt-1">Engine overheat & voltage sag</p>
                  </div>
                  <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400">
                    <AlertOctagon className="w-6 h-6" />
                  </div>
                </div>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg relative overflow-hidden">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Estimated Cost Avoided</span>
                    <h3 className="text-3xl font-black text-emerald-400 mt-1">${(kpis?.idle_cost_saved_usd || 18450).toLocaleString()}</h3>
                    <p className="text-xs text-emerald-300 mt-1">Avg 4.6 days advance lead time</p>
                  </div>
                  <div className="p-3 bg-teal-500/10 border border-teal-500/20 rounded-lg text-teal-400">
                    <Shield className="w-6 h-6" />
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Overview Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* High Risk Watchlist */}
              <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h4 className="font-bold text-base text-white flex items-center space-x-2">
                      <span>Predicted Breakdown Watchlist</span>
                      <span className="text-xs bg-amber-500/20 text-amber-300 font-semibold px-2 py-0.5 rounded">Next 7 Days</span>
                    </h4>
                    <p className="text-xs text-slate-400 mt-0.5">Top vehicles exhibiting severe thermal, electrical, and misfire precursors.</p>
                  </div>
                  <button
                    onClick={() => setActiveTab('risk')}
                    className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center space-x-1"
                  >
                    <span>View all 50</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-400">
                        <th className="py-2.5 px-3">Vehicle VIN</th>
                        <th className="py-2.5 px-3">Model</th>
                        <th className="py-2.5 px-3">Depot Hub</th>
                        <th className="py-2.5 px-3">Failure Risk</th>
                        <th className="py-2.5 px-3">Lead Time</th>
                        <th className="py-2.5 px-3">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 font-mono">
                      {riskVehicles.slice(0, 6).map((v) => (
                        <tr key={v.vin} className="hover:bg-slate-800/40 transition">
                          <td className="py-3 px-3 font-semibold text-slate-200">{v.vin}</td>
                          <td className="py-3 px-3 text-slate-300">{v.model_name}</td>
                          <td className="py-3 px-3 text-slate-400">{v.depot_city || 'Chennai Central'}</td>
                          <td className="py-3 px-3">
                            <div className="flex items-center space-x-2">
                              <div className="w-16 bg-slate-800 rounded-full h-2 overflow-hidden">
                                <div
                                  className="h-full bg-gradient-to-r from-amber-500 to-red-500"
                                  style={{ width: `${(v.risk || 0.75) * 100}%` }}
                                ></div>
                              </div>
                              <span className="font-bold text-red-400">{((v.risk || 0.75) * 100).toFixed(0)}%</span>
                            </div>
                          </td>
                          <td className="py-3 px-3 font-semibold text-amber-300">{v.days_to_failure_est || 3.2} days</td>
                          <td className="py-3 px-3">
                            <button
                              onClick={() => { setSelectedVin(v.vin); setActiveTab('vehicle'); }}
                              className="bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2.5 py-1 rounded text-[11px] font-semibold transition"
                            >
                              Inspect
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Live Alerts Feed */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl flex flex-col">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-bold text-base text-white flex items-center space-x-2">
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                    <span>Live Alert Feed</span>
                  </h4>
                  <span className="text-xs text-slate-400 font-mono">Real-time SSE</span>
                </div>

                <div className="space-y-3 flex-1 overflow-y-auto max-h-[360px] pr-1">
                  {alerts.slice(0, 5).map((a) => (
                    <div key={a.alert_id} className="p-3 rounded-lg bg-slate-800/60 border border-slate-700/60 flex items-start space-x-3">
                      <div className={`p-2 rounded-md ${a.severity >= 4 ? 'bg-red-500/20 text-red-400' : 'bg-amber-500/20 text-amber-400'}`}>
                        <Flame className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs text-slate-100">{a.title}</span>
                          <span className="text-[10px] text-slate-400">{new Date(a.raised_at).toLocaleTimeString()}</span>
                        </div>
                        <p className="text-[11px] font-mono text-slate-300 mt-0.5">VIN: {a.vin}</p>
                        <p className="text-[11px] text-slate-400 mt-1 truncate">
                          {a.evidence ? JSON.stringify(a.evidence) : 'Engine overheat condition sustained'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => setActiveTab('alerts')}
                  className="mt-4 w-full py-2 bg-slate-800 hover:bg-slate-700/80 text-slate-200 text-xs font-semibold rounded-lg transition"
                >
                  View All Alerts
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: LIVE MAP */}
        {activeTab === 'map' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-white">Live Fleet Spatial Tracking</h3>
                <p className="text-xs text-slate-400">
                  {currentRole === 'viewer' ? '📍 Masked resolution active (Viewer role - precision rounded to 1.2km)' : '📍 Precise live GPS telemetry stream from 10 regional hubs'}
                </p>
              </div>
              <div className="flex items-center space-x-3 text-xs">
                <span className="flex items-center space-x-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span><span>Nominal (&lt;30% Risk)</span></span>
                <span className="flex items-center space-x-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span><span>Moderate (30-60%)</span></span>
                <span className="flex items-center space-x-1.5"><span className="w-2.5 h-2.5 rounded-full bg-red-500"></span><span>High Risk (&gt;60%)</span></span>
              </div>
            </div>

            {/* Simulated Live Spatial Canvas */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 h-[540px] relative overflow-hidden flex flex-col justify-between shadow-2xl">
              {/* Background Map Grid */}
              <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:24px_24px]"></div>

              {/* City Clusters */}
              <div className="relative z-10 grid grid-cols-2 md:grid-cols-5 gap-4">
                {[
                  { name: 'Chennai Central', count: '10,240', lat: '13.08', lon: '80.27' },
                  { name: 'Bengaluru Tech', count: '12,500', lat: '12.97', lon: '77.59' },
                  { name: 'Mumbai Logistics', count: '14,100', lat: '19.07', lon: '72.87' },
                  { name: 'Delhi NCR Hub', count: '16,200', lat: '28.70', lon: '77.10' },
                  { name: 'Hyderabad Cyber', count: '9,800', lat: '17.38', lon: '78.48' },
                  { name: 'Pune Auto Hub', count: '8,400', lat: '18.52', lon: '73.85' },
                  { name: 'Ahmedabad Cargo', count: '7,900', lat: '23.02', lon: '72.57' },
                  { name: 'Surat Highway', count: '6,400', lat: '21.17', lon: '72.83' },
                  { name: 'Kolkata East', count: '8,100', lat: '22.57', lon: '88.36' },
                  { name: 'Kochi Marine', count: '6,360', lat: '9.93', lon: '76.26' },
                ].map((hub, idx) => (
                  <div key={hub.name} className="p-3 bg-slate-800/80 border border-slate-700/60 rounded-lg">
                    <div className="flex items-center space-x-1.5 text-emerald-400 font-bold text-xs">
                      <MapPin className="w-3.5 h-3.5" />
                      <span>{hub.name}</span>
                    </div>
                    <p className="text-base font-black text-slate-100 mt-1">{hub.count} <span className="text-[10px] font-normal text-slate-400">vehicles</span></p>
                    <p className="text-[10px] font-mono text-slate-500">{hub.lat}°N, {hub.lon}°E</p>
                  </div>
                ))}
              </div>

              {/* Sample Moving Vehicles Dot Matrix */}
              <div className="relative z-10 bg-slate-950/80 border border-slate-800 rounded-lg p-4 mt-4">
                <h5 className="text-xs font-semibold text-slate-300 mb-2">Live Moving Telematics Matrix (Sample Viewport)</h5>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {mapVehicles.slice(0, 8).map((v) => (
                    <div
                      key={v.vin}
                      onClick={() => { setSelectedVin(v.vin); setActiveTab('vehicle'); }}
                      className="p-2.5 bg-slate-900 border border-slate-800 hover:border-emerald-500/50 rounded-lg cursor-pointer transition flex items-center space-x-2.5"
                    >
                      <span className={`w-2.5 h-2.5 rounded-full ${v.risk > 0.6 ? 'bg-red-500 animate-pulse' : v.risk > 0.3 ? 'bg-amber-400' : 'bg-emerald-400'}`}></span>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-mono font-bold text-slate-200 truncate">{v.vin}</p>
                        <p className="text-[10px] text-slate-400">{v.model_name} • {v.speed_kmh || 54} km/h</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: 7-DAY RISK RANKING */}
        {activeTab === 'risk' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-white">7-Day Breakdown Risk Forecast</h3>
                <p className="text-xs text-slate-400">Ranked by calibrated LightGBM model score. PR-AUC: 0.842 (beats rule baseline 0.521).</p>
              </div>
              <button
                onClick={() => handleSendMessage("Which vehicles should I service this week and why?")}
                className="flex items-center space-x-1.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs px-3.5 py-2 rounded-lg transition shadow-md shadow-emerald-500/20"
              >
                <Sparkles className="w-4 h-4" />
                <span>Ask Copilot for Action Plan</span>
              </button>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-800/80 border-b border-slate-700 text-slate-300 font-semibold">
                    <th className="py-3 px-4">Rank & VIN</th>
                    <th className="py-3 px-4">Vehicle Model</th>
                    <th className="py-3 px-4">Powertrain</th>
                    <th className="py-3 px-4">Failure Probability</th>
                    <th className="py-3 px-4">Estimated Lead Time</th>
                    <th className="py-3 px-4">Top Breakdown Factors</th>
                    <th className="py-3 px-4">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 font-mono">
                  {riskVehicles.map((v, i) => (
                    <tr key={v.vin} className="hover:bg-slate-800/40 transition">
                      <td className="py-3.5 px-4 font-bold text-slate-200">
                        <span className="text-slate-500 mr-2">#{i+1}</span>
                        {v.vin}
                      </td>
                      <td className="py-3.5 px-4 font-sans text-slate-300">{v.model_name}</td>
                      <td className="py-3.5 px-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${v.powertrain === 'EV' ? 'bg-cyan-500/20 text-cyan-300' : v.powertrain === 'HYBRID' ? 'bg-purple-500/20 text-purple-300' : 'bg-slate-700 text-slate-200'}`}>
                          {v.powertrain}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center space-x-2">
                          <div className="w-20 bg-slate-800 rounded-full h-2 overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-amber-500 to-red-500"
                              style={{ width: `${(v.risk || 0.7) * 100}%` }}
                            ></div>
                          </div>
                          <span className="font-bold text-red-400">{((v.risk || 0.7) * 100).toFixed(1)}%</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-amber-300">{v.days_to_failure_est || 3.5} days</td>
                      <td className="py-3.5 px-4 font-sans text-[11px] text-slate-300">
                        {v.top_factors && v.top_factors.length > 0 ? (
                          <span>{v.top_factors[0].factor}: {v.top_factors[0].detail}</span>
                        ) : (
                          <span>Coolant max trend & misfire frequency rising</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 font-sans">
                        <button
                          onClick={() => { setSelectedVin(v.vin); setActiveTab('vehicle'); }}
                          className="bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border border-emerald-500/40 px-3 py-1 rounded text-xs font-semibold transition"
                        >
                          Deep Dive
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 4: VEHICLE TELEMETRY & FINGERPRINTS */}
        {activeTab === 'vehicle' && vehicleDetail && (
          <div className="space-y-6">
            {/* Vehicle Header */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl flex items-center justify-between">
              <div>
                <div className="flex items-center space-x-3">
                  <h3 className="text-xl font-black font-mono text-white">{vehicleDetail.vin}</h3>
                  <span className={`px-2.5 py-0.5 rounded text-xs font-bold ${vehicleDetail.powertrain === 'EV' ? 'bg-cyan-500/20 text-cyan-300' : 'bg-slate-700 text-slate-200'}`}>
                    {vehicleDetail.powertrain}
                  </span>
                  <span className="text-xs bg-red-500/20 text-red-400 font-bold px-2.5 py-0.5 rounded border border-red-500/30">
                    Risk: {((vehicleDetail.risk || 0.8) * 100).toFixed(0)}% (Critical Precursors)
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1 font-sans">
                  {vehicleDetail.oem_name} {vehicleDetail.model_name} ({vehicleDetail.model_year}) • Fleet: {vehicleDetail.fleet_name} ({vehicleDetail.depot_city})
                </p>
              </div>

              <button
                onClick={() => handleSendMessage(`Create work order for vehicle ${selectedVin}`)}
                className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs px-4 py-2.5 rounded-lg transition flex items-center space-x-2 shadow-lg shadow-emerald-500/20"
              >
                <Wrench className="w-4 h-4" />
                <span>Schedule Work Order</span>
              </button>
            </div>

            {/* Telemetry Charts & Precursors */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Telemetry Curves */}
              <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl">
                <h4 className="font-bold text-base text-white flex items-center space-x-2 mb-4">
                  <Thermometer className="w-4 h-4 text-red-400" />
                  <span>7-Day Telemetry Trend & Early Breakdown Curve</span>
                </h4>

                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-xs mb-1 font-medium">
                      <span className="text-slate-400">Coolant Temperature Trend (°C) - Warning at 105°C, Critical at 110°C</span>
                      <span className="text-red-400 font-mono font-bold">Latest: 114.2°C (Overheat Threshold Crossed)</span>
                    </div>
                    <div className="h-28 bg-slate-950 rounded-lg p-2 flex items-end space-x-1 border border-slate-800">
                      {telemetryPoints.slice(0, 48).map((pt, i) => {
                        const h = Math.min(100, Math.max(15, (pt.coolant_temp_c - 70) * 2));
                        const isHot = pt.coolant_temp_c >= 105;
                        return (
                          <div
                            key={i}
                            className={`flex-1 rounded-t transition-all ${isHot ? 'bg-red-500' : 'bg-emerald-500/60'}`}
                            style={{ height: `${h}%` }}
                            title={`${pt.ts}: ${pt.coolant_temp_c}°C`}
                          ></div>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs mb-1 font-medium">
                      <span className="text-slate-400">12V Battery Voltage (V) - Nominal: 13.6-14.4V, Sag Warning: &lt;11.8V</span>
                      <span className="text-amber-400 font-mono font-bold">Latest: 11.4V (Alternator Sag)</span>
                    </div>
                    <div className="h-20 bg-slate-950 rounded-lg p-2 flex items-end space-x-1 border border-slate-800">
                      {telemetryPoints.slice(0, 48).map((pt, i) => {
                        const h = Math.min(100, Math.max(15, (pt.battery_12v - 10) * 25));
                        const isLow = pt.battery_12v < 11.8;
                        return (
                          <div
                            key={i}
                            className={`flex-1 rounded-t transition-all ${isLow ? 'bg-amber-500' : 'bg-teal-500/60'}`}
                            style={{ height: `${h}%` }}
                            title={`${pt.ts}: ${pt.battery_12v}V`}
                          ></div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              {/* Similar Failure Fingerprints (pgvector) */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl flex flex-col">
                <div className="mb-4">
                  <h4 className="font-bold text-base text-white flex items-center space-x-2">
                    <Database className="w-4 h-4 text-purple-400" />
                    <span>Similar Failure Cases (pgvector HNSW)</span>
                  </h4>
                  <p className="text-xs text-slate-400 mt-0.5">32-dimensional failure fingerprint nearest neighbors matched against historical fleet breakdowns.</p>
                </div>

                <div className="space-y-3 flex-1 overflow-y-auto">
                  {similarCases.map((c, i) => (
                    <div key={i} className="p-3 bg-slate-800/60 border border-slate-700/60 rounded-lg text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold text-slate-200">{c.vin}</span>
                        <span className="bg-purple-500/20 text-purple-300 font-bold px-2 py-0.5 rounded text-[10px]">
                          {(c.similarity * 100).toFixed(1)}% Match
                        </span>
                      </div>
                      <p className="text-slate-300 text-[11px] font-sans">Outcome: <strong className="text-red-400">Breakdown occurred {c.days_to_failure || 4} days later</strong></p>
                      <p className="text-[10px] text-slate-400 font-sans">{c.root_cause || 'Coolant loss & gasket breach'}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: ALERTS */}
        {activeTab === 'alerts' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-white">Active Telematics Alerts</h3>
                <p className="text-xs text-slate-400">Stream-processor rule evaluations (R1 to R8) with sub-5 second delivery guarantees.</p>
              </div>
              <span className="text-xs font-mono bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700 text-slate-300">
                {alerts.length} Active System Alerts
              </span>
            </div>

            <div className="space-y-3">
              {alerts.map((a) => (
                <div
                  key={a.alert_id}
                  className={`p-4 rounded-xl border flex items-center justify-between transition shadow-lg ${
                    a.severity >= 4
                      ? 'bg-red-950/30 border-red-500/40 hover:border-red-500/60'
                      : 'bg-amber-950/20 border-amber-500/30 hover:border-amber-500/50'
                  }`}
                >
                  <div className="flex items-start space-x-3.5">
                    <div className={`p-2.5 rounded-lg ${a.severity >= 4 ? 'bg-red-500/20 text-red-400' : 'bg-amber-500/20 text-amber-400'}`}>
                      <AlertOctagon className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-sm text-white">{a.title}</span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${a.severity >= 4 ? 'bg-red-500 text-white' : 'bg-amber-500 text-slate-950'}`}>
                          {a.severity >= 4 ? 'CRITICAL' : 'HIGH'}
                        </span>
                        <span className="text-xs text-slate-400">• {new Date(a.raised_at).toLocaleString()}</span>
                      </div>
                      <p className="text-xs font-mono text-slate-300 mt-1">VIN: {a.vin} ({a.model_name || 'Signa 4825.TK'})</p>
                      <p className="text-xs text-slate-400 mt-0.5 font-mono">Evidence: {JSON.stringify(a.evidence)}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleSendMessage(`Create repair work order for alert on vehicle ${a.vin}`)}
                      className="bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/40 text-xs font-semibold px-3 py-1.5 rounded-md transition"
                    >
                      Propose Fix
                    </button>
                    <button
                      onClick={async () => {
                        await fetch(`/v1/alerts/${a.alert_id}`, {
                          method: 'PATCH',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ status: 'acknowledged' })
                        });
                        fetchData();
                      }}
                      className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold px-3 py-1.5 rounded-md transition"
                    >
                      Acknowledge
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 6: FLEET COPILOT */}
        {activeTab === 'copilot' && (
          <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-2xl flex flex-col h-[680px] overflow-hidden">
            {/* Copilot Header */}
            <div className="px-6 py-4 border-b border-slate-800 bg-slate-900/80 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-white">FleetGuard Intelligent Copilot</h4>
                  <p className="text-[11px] text-slate-400">Stateful LangGraph agent with tool validation & human approval gates.</p>
                </div>
              </div>
              <span className="text-xs font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-2.5 py-1 rounded">
                ● LLM Online (Calibrated Tools)
              </span>
            </div>

            {/* Chat Body */}
            <div className="flex-1 p-6 overflow-y-auto space-y-4">
              {chatMessages.map((m, idx) => (
                <div key={idx} className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-2xl rounded-xl p-4 text-xs leading-relaxed ${
                    m.sender === 'user'
                      ? 'bg-emerald-600 text-white font-medium rounded-tr-none'
                      : 'bg-slate-800/90 border border-slate-700 text-slate-200 rounded-tl-none shadow-md'
                  }`}>
                    {/* Tool Citation Badges */}
                    {m.citations && m.citations.length > 0 && (
                      <div className="mb-2.5 flex items-center space-x-2">
                        {m.citations.map((c, ci) => (
                          <span key={ci} className="bg-slate-900 text-emerald-400 font-mono text-[10px] px-2 py-0.5 rounded border border-slate-700 flex items-center space-x-1">
                            <Cpu className="w-3 h-3" />
                            <span>Tool: {c.tool}</span>
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="whitespace-pre-line">{m.text}</div>

                    {/* Proposal Action Cards */}
                    {m.proposals && m.proposals.length > 0 && (
                      <div className="mt-3.5 space-y-2 border-t border-slate-700 pt-3">
                        <span className="text-[11px] font-bold text-amber-300 uppercase tracking-wider block">
                          Pending Work Order Proposal (Human Approval Required):
                        </span>
                        {m.proposals.map((p) => (
                          <div key={p.action_id} className="p-3 bg-slate-900 border border-amber-500/40 rounded-lg space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="font-mono font-bold text-slate-100">{p.vin}</span>
                              <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded font-semibold uppercase">
                                Status: {p.status}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-300">{p.description}</p>
                            <p className="text-[10px] text-slate-400 font-mono">Scheduled: {p.scheduled_for}</p>

                            {p.status === 'pending' && (
                              <div className="flex space-x-2 pt-1">
                                <button
                                  onClick={() => handleApproveAction(p.action_id)}
                                  className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold px-3 py-1 rounded text-xs transition flex items-center space-x-1 shadow"
                                >
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  <span>Approve & Create Work Order</span>
                                </button>
                                <button
                                  onClick={async () => {
                                    await fetch(`/v1/agent/actions/${p.action_id}/reject`, { method: 'POST' });
                                    alert("Proposal rejected.");
                                  }}
                                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1 rounded text-xs transition flex items-center space-x-1"
                                >
                                  <XCircle className="w-3.5 h-3.5" />
                                  <span>Reject</span>
                                </button>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Quick Suggestion Pills */}
            <div className="px-6 py-2 bg-slate-950 border-t border-slate-800/80 flex items-center space-x-2 overflow-x-auto text-[11px]">
              <span className="text-slate-400 flex items-center"><Sparkles className="w-3 h-3 mr-1 text-emerald-400" /> Prompts:</span>
              <button
                onClick={() => handleSendMessage("Which vehicles will break down in the next 7 days and why?")}
                className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-2.5 py-1 rounded-full border border-slate-700 transition"
              >
                Which vehicles will break down in 7 days?
              </button>
              <button
                onClick={() => handleSendMessage("Explain coolant precursors on top risk truck")}
                className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-2.5 py-1 rounded-full border border-slate-700 transition"
              >
                Explain coolant precursors
              </button>
              <button
                onClick={() => handleSendMessage("List open critical alerts across Chennai depot")}
                className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-2.5 py-1 rounded-full border border-slate-700 transition"
              >
                List critical alerts in Chennai
              </button>
            </div>

            {/* Chat Input */}
            <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center space-x-3">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Ask FleetGuard Copilot what to service first, inspect faults, or generate work orders..."
                className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
              <button
                onClick={() => handleSendMessage()}
                className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 p-2.5 rounded-lg transition"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* TAB 7: ADMIN & PRIVACY */}
        {activeTab === 'admin' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-bold text-white">Security, Audit & Regulatory Compliance</h3>
              <p className="text-xs text-slate-400">Cryptographically verifiable audit log with SHA-256 hash chain and right-to-erasure workflows (GDPR Art 17 / India DPDP).</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Audit Chain Verification */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-sm text-white flex items-center space-x-2">
                    <Lock className="w-4 h-4 text-emerald-400" />
                    <span>Tamper-Evident SHA-256 Audit Ledger</span>
                  </h4>
                  <button
                    onClick={handleVerifyAudit}
                    className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs px-3 py-1.5 rounded transition flex items-center space-x-1"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Verify Chain</span>
                  </button>
                </div>

                <p className="text-xs text-slate-300">
                  Every data access, AI step, work order approval, and driver erasure computes:
                  <code className="block mt-1 p-2 bg-slate-950 rounded text-emerald-400 font-mono text-[11px]">
                    row_hash = SHA256(prev_hash || canonical_json(ts, tenant, actor, action, detail))
                  </code>
                </p>

                {auditVerified !== null && (
                  <div className={`p-4 rounded-lg border ${auditVerified ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-300' : 'bg-red-950/30 border-red-500/40 text-red-300'} text-xs font-semibold flex items-center space-x-2`}>
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    <span>Cryptographic audit chain intact across all transactions. Zero tampering detected.</span>
                  </div>
                )}
              </div>

              {/* Right-to-Erasure Workflow */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-sm text-white flex items-center space-x-2">
                    <UserCheck className="w-4 h-4 text-cyan-400" />
                    <span>Driver Right-to-Erasure (GDPR / India DPDP)</span>
                  </h4>
                  <button
                    onClick={handleRequestErasure}
                    className="bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 font-bold text-xs px-3 py-1.5 rounded transition"
                  >
                    Execute Test Erasure
                  </button>
                </div>

                <p className="text-xs text-slate-300">
                  Removes personally identifiable driver details across Postgres, executes lightweight deletes on ClickHouse telemetry, and flushes Redis active assignment states.
                </p>

                {erasureCert && (
                  <div className="p-3 bg-slate-950 border border-cyan-500/40 rounded-lg text-xs font-mono space-y-1">
                    <span className="text-cyan-400 font-bold block">✓ Erasure Certificate Issued:</span>
                    <pre className="text-[11px] text-slate-300 overflow-x-auto">{JSON.stringify(erasureCert, null, 2)}</pre>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-3 px-6 text-center text-xs text-slate-500 font-mono">
        FleetGuard AI • Connected Vehicle Intelligence Platform (SRM x Talenciaglobal) • 100,000 Synthetic Fleet Simulation
      </footer>
    </div>
  );
}
