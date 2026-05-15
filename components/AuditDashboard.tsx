import React, { useMemo, useState } from 'react';
import { UserProfile, AuditLog } from '../types';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  Cell, PieChart, Pie, AreaChart, Area 
} from 'recharts';

interface AuditDashboardProps {
  users: UserProfile[];
  logs: AuditLog[];
}

const AuditDashboard: React.FC<AuditDashboardProps> = ({ users, logs }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const stats = useMemo(() => {
    const total = users.length;
    const ativos = users.filter(u => u.status === 'ativo' && !u.feature_flags?.is_maintenance).length;
    const bloqueados = users.filter(u => u.status === 'bloqueado').length;
    const manutencao = users.filter(u => u.feature_flags?.is_maintenance).length;

    // Adoption Distribution
    const features = [
      { name: '2025', count: users.filter(u => u.feature_flags?.calculadora_2025_enabled).length },
      { name: '2027', count: users.filter(u => u.feature_flags?.calculadora_2027_enabled).length },
      { name: 'Matriz', count: users.filter(u => u.feature_flags?.matriz_estrategica_enabled).length },
      { name: 'Overhead', count: users.filter(u => u.feature_flags?.overhead_enabled).length },
      { name: 'Jarvis', count: users.filter(u => u.feature_flags?.jarvis_enabled).length },
    ];

    const statusData = [
      { name: 'Ativos', value: ativos, color: '#10b981' },
      { name: 'Bloqueados', value: bloqueados, color: '#f43f5e' },
      { name: 'Manutenção', value: manutencao, color: '#f59e0b' },
    ];

    // Activity Trend (last 7 data points)
    const trendData = logs.slice(0, 10).reverse().map((log, i) => ({
      time: new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      intensity: 30 + (i * 10) + Math.random() * 20 // Simulated intensity based on event sequence
    }));

    return { total, statusData, features, trendData, ativos };
  }, [users, logs]);

  const filteredLogs = logs.filter(log => 
    log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.details.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Top KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <KpiCard title="Total Terminais" value={stats.total.toString()} sub="Cadastrados" icon="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197" color="bg-blue-500" />
        <KpiCard title="Em Operação" value={stats.ativos.toString()} sub="Terminais Online" icon="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" color="bg-emerald-500" />
        <KpiCard title="Eventos Hoje" value={logs.length.toString()} sub="Transações" icon="M13 10V3L4 14h7v7l9-11h-7z" color="bg-indigo-500" />
        <KpiCard title="Uptime Global" value="99.9%" sub="Disponibilidade" icon="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" color="bg-amber-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Activity Trend Graph */}
        <div className="lg:col-span-2 bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-6">
          <div className="flex justify-between items-center">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Timeline de Telemetria</h4>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
              <span className="text-[9px] font-black text-emerald-600 uppercase">Live Sync</span>
            </div>
          </div>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.trendData}>
                <defs>
                  <linearGradient id="colorIntensity" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 700, fill: '#94a3b8' }} />
                <Tooltip 
                  contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Area type="monotone" dataKey="intensity" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorIntensity)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Status Distribution */}
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-6">
          <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Status dos Terminais</h4>
          <div className="h-[200px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stats.statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {stats.statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {stats.statusData.map(s => (
              <div key={s.name} className="text-center p-3 rounded-2xl bg-slate-50 border border-slate-100">
                <p className="text-[8px] font-black uppercase text-slate-400 mb-1">{s.name}</p>
                <p className="text-sm font-black font-mono" style={{ color: s.color }}>{s.value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
         {/* Features Availability */}
         <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-6">
          <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Adoção de Módulos (Top Features)</h4>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.features} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" hide />
                <YAxis 
                  dataKey="name" 
                  type="category"
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 9, fontWeight: 900, fill: '#475569' }} 
                  width={80}
                />
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ borderRadius: '1rem', border: 'none' }}
                />
                <Bar dataKey="count" radius={[0, 10, 10, 0]} barSize={20}>
                  {stats.features.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill="#6366f1" />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Logs Interaction Area */}
        <div className="lg:col-span-2 bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col h-full">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
            <div>
              <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Log de Auditoria</h4>
              <p className="text-[9px] font-bold text-slate-300 uppercase">Telemetria de ações em tempo real</p>
            </div>
            <div className="flex-1 max-w-sm w-full relative">
               <input 
                 type="text" 
                 placeholder="BUSCAR AÇÃO OU DETALHE..."
                 value={searchTerm}
                 onChange={(e) => setSearchTerm(e.target.value)}
                 className="w-full bg-slate-50 border border-slate-100 rounded-full px-12 py-3 text-[10px] font-bold uppercase tracking-widest focus:ring-2 focus:ring-indigo-500 transition-all outline-none"
               />
               <svg className="absolute left-6 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
               </svg>
            </div>
          </div>

          <div className="space-y-3 overflow-y-auto custom-scrollbar pr-2 max-h-[400px]">
            {filteredLogs.map((log, idx) => (
              <div key={idx} className="flex items-center justify-between p-5 hover:bg-slate-50 border border-transparent hover:border-slate-100 rounded-3xl transition-all group">
                <div className="flex items-center gap-5">
                  <div className={`w-2.5 h-2.5 rounded-full ${getActionColor(log.action)} shadow-[0_0_10px_currentColor]`}></div>
                  <div>
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] font-black text-slate-900 uppercase">{log.action}</span>
                      <span className="text-[8px] font-black px-2 py-0.5 rounded bg-slate-100 text-slate-400 uppercase tracking-tighter">Event #{idx + 1024}</span>
                    </div>
                    <p className="text-[10px] font-bold text-slate-400 mt-1 leading-relaxed">{log.details}</p>
                  </div>
                </div>
                <div className="text-right flex flex-col items-end">
                   <span className="text-[10px] font-black text-slate-900 mb-1 flex items-center gap-1.5">
                     <svg className="w-3 h-3 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                     {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                   </span>
                   <span className="bg-slate-900 text-white text-[7px] font-black px-2 py-0.5 rounded-full leading-none">SYS</span>
                </div>
              </div>
            ))}
            
            {filteredLogs.length === 0 && (
              <div className="py-20 text-center space-y-4">
                 <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-200">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>
                 </div>
                 <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Nenhum evento encontrado para esta busca.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const KpiCard = ({ title, value, sub, icon, color }: any) => (
  <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
    <div className={`absolute top-0 right-0 w-24 h-24 ${color} opacity-[0.03] -mr-8 -mt-8 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700`}></div>
    <div className="relative z-10">
      <div className="flex justify-between items-start mb-4">
        <div className={`p-2 rounded-xl bg-slate-50 ${color.replace('bg-', 'text-')}`}>
           <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d={icon} />
           </svg>
        </div>
      </div>
      <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{title}</h3>
      <div className="flex items-baseline gap-2">
        <span className="text-3xl font-black text-slate-900">{value}</span>
        <span className="text-[9px] font-bold text-slate-300 uppercase">{sub}</span>
      </div>
    </div>
  </div>
);

const getActionColor = (action: string) => {
  const a = action.toLowerCase();
  if (a.includes('login')) return 'text-emerald-500';
  if (a.includes('delete') || a.includes('remove') || a.includes('bloqueio')) return 'text-rose-500';
  if (a.includes('update') || a.includes('edit')) return 'text-amber-500';
  return 'text-indigo-500';
};

export default AuditDashboard;
