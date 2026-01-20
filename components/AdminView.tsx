
import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { UserProfile, AuditLog } from '../types';

const MASTER_EMAIL = 'tagwaytw@gmail.com';

type AdminTab = 'operadores' | 'auditoria' | 'broadcast' | 'sistema';

interface AdminInputProps {
  label: string;
  value: string | undefined;
  onChange: (v: string) => void;
  type?: string;
}

const AdminView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AdminTab>('operadores');
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [broadcastMessage, setBroadcastMessage] = useState('');

  useEffect(() => {
    fetchUsers();
    fetchAuditLogs();
  }, []);

  const stats = useMemo(() => {
    const total = users.length;
    const ativos = users.filter(u => u.status === 'ativo').length;
    const bloqueados = users.filter(u => u.status === 'bloqueado').length;
    return { total, ativos, bloqueados };
  }, [users]);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('user_configs')
        .select('*')
        .order('nome_completo', { ascending: true });
      if (error) throw error;
      setUsers(data as UserProfile[]);
    } catch (err: any) {
      setErrorMessage(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAuditLogs = async () => {
    try {
      const { data, error } = await supabase
        .from('saved_simulations')
        .select('id, user_id, nome_produto, created_at')
        .order('created_at', { ascending: false })
        .limit(20);
      
      if (data) {
        const logs: AuditLog[] = data.map(item => ({
          id: item.id,
          user_id: item.user_id,
          action: 'SIMULAÇÃO_SALVA',
          details: `Item: ${item.nome_produto}`,
          created_at: item.created_at
        }));
        setAuditLogs(logs);
      }
    } catch (e) { console.error(e); }
  };

  const handleSaveUser = async () => {
    if (!selectedUser) return;
    setIsSyncing(true);
    try {
      const payload = {
        ...selectedUser,
        feature_flags: selectedUser.feature_flags || {
          jarvis_enabled: true,
          dre_enabled: false,
          estoque_enabled: false,
          logistica_enabled: false,
          calculadora_2027_enabled: false
        }
      };

      const { error } = await supabase
        .from('user_configs')
        .upsert(payload, { onConflict: 'user_id' });
      
      if (error) throw error;
      alert('✅ Terminal Sincronizado com Sucesso.');
      setSelectedUser(null);
      fetchUsers();
    } catch (err: any) {
      alert("Erro: " + err.message);
    } finally {
      setIsSyncing(false);
    }
  };

  const toggleGlobal2027 = async (enable: boolean) => {
    if (!confirm(`Deseja ${enable ? 'Habilitar' : 'Ocultar'} o módulo 2027 para TODOS os usuários?`)) return;
    setIsSyncing(true);
    try {
      for(const user of users) {
        const newFlags = { ...(user.feature_flags || {}), calculadora_2027_enabled: enable };
        await supabase.from('user_configs').update({ feature_flags: newFlags }).eq('user_id', user.user_id);
      }
      alert('✅ Status Global do Módulo 2027 Atualizado.');
      fetchUsers();
    } catch (e) {
      alert('Erro na atualização global.');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleExportData = () => {
    const dataStr = JSON.stringify({ users, auditLogs, timestamp: new Date().toISOString() }, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `tagway_master_backup_${new Date().getTime()}.json`;
    link.click();
  };

  const filteredUsers = users.filter(u => 
    u.nome_completo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-40 animate-slide-up">
      <header className="bg-slate-900 p-10 rounded-[3rem] text-white shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 blur-[120px] rounded-full"></div>
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="space-y-2">
            <h2 className="text-4xl font-black tracking-tighter uppercase italic leading-none">Console Master</h2>
            <p className="text-white/30 text-[9px] font-black uppercase tracking-[0.4em]">Business Intelligence Administration</p>
          </div>
          <div className="flex gap-4">
             <QuickStat label="Ativos" value={stats.ativos} color="text-emerald-400" />
             <QuickStat label="Total" value={stats.total} color="text-indigo-400" />
          </div>
        </div>

        <div className="flex gap-2 mt-10 p-1.5 bg-white/5 rounded-2xl w-fit">
          <TabButton active={activeTab === 'operadores'} onClick={() => setActiveTab('operadores')} label="Operadores" />
          <TabButton active={activeTab === 'auditoria'} onClick={() => setActiveTab('auditoria')} label="Auditoria" />
          <TabButton active={activeTab === 'broadcast'} onClick={() => setActiveTab('broadcast')} label="Broadcast" />
          <TabButton active={activeTab === 'sistema'} onClick={() => setActiveTab('sistema')} label="Sistema" />
        </div>
      </header>

      <div className="space-y-6">
        {activeTab === 'operadores' && (
          <section className="space-y-6">
            <div className="relative">
              <input 
                type="text" 
                placeholder="Pesquisar operadores..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-white border-2 border-slate-100 rounded-[2rem] px-8 py-5 pl-14 text-sm font-bold shadow-sm focus:border-black outline-none transition-all"
              />
              <svg className="w-5 h-5 absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
            </div>

            <div className="bg-white border-2 border-slate-100 rounded-[2.5rem] overflow-hidden shadow-xl">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50 text-[9px] font-black uppercase tracking-widest text-slate-400">
                    <th className="px-8 py-5">Terminal</th>
                    <th className="px-8 py-5">Flags Ativas</th>
                    <th className="px-8 py-5">Status</th>
                    <th className="px-8 py-5 text-right">Config</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredUsers.map(u => (
                    <tr key={u.user_id} className="hover:bg-slate-50 transition-colors cursor-pointer group" onClick={() => setSelectedUser(u)}>
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center text-white text-[10px] font-black uppercase">
                            {u.nome_completo?.substring(0,2)}
                          </div>
                          <div>
                            <p className="text-sm font-black text-slate-900 leading-none">{u.nome_completo}</p>
                            <p className="text-[10px] font-bold text-slate-400 mt-1">{u.empresa_nome}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex gap-1.5 flex-wrap">
                           <FlagIndicator active={!!u.feature_flags?.jarvis_enabled} label="AI" />
                           <FlagIndicator active={!!u.feature_flags?.calculadora_2027_enabled} label="2027" />
                           <FlagIndicator active={!!u.feature_flags?.dre_enabled} label="DRE" />
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${u.status === 'ativo' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                          {u.status}
                        </span>
                      </td>
                      <td className="px-8 py-6 text-right">
                         <svg className="w-4 h-4 text-slate-200 group-hover:text-black transition-colors ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M9 5l7 7-7 7"/></svg>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {activeTab === 'sistema' && (
          <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
             <div className="bg-indigo-900 rounded-[2.5rem] p-10 space-y-6 text-white shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 blur-3xl rounded-full"></div>
                <h3 className="text-lg font-black uppercase italic tracking-tighter">Módulo de Transição 2027</h3>
                <p className="text-[11px] text-indigo-200 font-bold uppercase leading-relaxed">Controle global de visibilidade da nova calculadora. Ative para liberar o acesso a todos os terminais simultaneamente ou oculte para manutenção.</p>
                <div className="flex gap-4">
                  <button onClick={() => toggleGlobal2027(true)} className="flex-1 bg-white text-indigo-900 py-5 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-lg hover:bg-indigo-50 transition-all">Habilitar Visibilidade</button>
                  <button onClick={() => toggleGlobal2027(false)} className="flex-1 bg-indigo-800 text-white/50 py-5 rounded-2xl font-black uppercase text-[10px] tracking-widest border border-indigo-700 hover:bg-indigo-700 transition-all">Ocultar Módulo</button>
                </div>
             </div>

             <div className="bg-white border-2 border-slate-100 rounded-[2.5rem] p-10 space-y-6 shadow-xl">
                <h3 className="text-lg font-black text-slate-900 uppercase italic">Backup & Auditoria</h3>
                <p className="text-[11px] text-slate-400 font-bold uppercase leading-relaxed">Exporte o estado completo da rede Tagway para auditoria externa ou salvaguarda offline.</p>
                <button onClick={handleExportData} className="w-full bg-slate-100 text-slate-800 py-5 rounded-2xl font-black uppercase text-[10px] tracking-widest border border-slate-200 hover:bg-slate-200 transition-all">Extrair Snapshot Master</button>
             </div>
          </section>
        )}
      </div>

      {selectedUser && (
        <div className="fixed inset-0 z-[1000] bg-black/90 backdrop-blur-md flex items-center justify-center p-6 overflow-y-auto">
           <div className="bg-white w-full max-w-4xl rounded-[3.5rem] shadow-2xl overflow-hidden animate-slide-up border border-white/20">
              <header className="bg-slate-900 p-10 text-white flex justify-between items-center">
                 <div>
                   <h3 className="text-2xl font-black uppercase italic leading-none tracking-tighter">Gestão de Terminal</h3>
                   <p className="text-white/30 text-[9px] font-black uppercase tracking-widest mt-2 italic">{selectedUser.email}</p>
                 </div>
                 <button onClick={() => setSelectedUser(null)} className="p-3 bg-white/5 rounded-2xl hover:bg-white/10 transition-all">
                   <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12"/></svg>
                 </button>
              </header>

              <div className="p-10 grid grid-cols-1 md:grid-cols-2 gap-10">
                 <div className="space-y-6">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Acesso Operacional</label>
                    <div className="grid grid-cols-3 gap-2">
                       <StatusButton active={selectedUser.status === 'ativo'} label="Ativo" onClick={() => setSelectedUser({...selectedUser, status: 'ativo'})} color="bg-emerald-600" />
                       <StatusButton active={selectedUser.status === 'bloqueado'} label="Block" onClick={() => setSelectedUser({...selectedUser, status: 'bloqueado'})} color="bg-rose-600" />
                       <StatusButton active={selectedUser.status === 'manutencao'} label="Maint." onClick={() => setSelectedUser({...selectedUser, status: 'manutencao'})} color="bg-amber-600" />
                    </div>
                    
                    <div className="space-y-4 pt-6 border-t border-slate-100">
                       <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Feature Flags (Módulos)</label>
                       <FlagToggle label="Jarvis AI Expert" active={!!selectedUser.feature_flags?.jarvis_enabled} onClick={() => setSelectedUser({
                         ...selectedUser, feature_flags: { ...selectedUser.feature_flags!, jarvis_enabled: !selectedUser.feature_flags?.jarvis_enabled }
                       })} />
                       <FlagToggle label="Calculadora 2027 (Alpha)" active={!!selectedUser.feature_flags?.calculadora_2027_enabled} onClick={() => setSelectedUser({
                         ...selectedUser, feature_flags: { ...selectedUser.feature_flags!, calculadora_2027_enabled: !selectedUser.feature_flags?.calculadora_2027_enabled }
                       })} />
                       <FlagToggle label="Módulo DRE / Financeiro" active={!!selectedUser.feature_flags?.dre_enabled} onClick={() => setSelectedUser({
                         ...selectedUser, feature_flags: { ...selectedUser.feature_flags!, dre_enabled: !selectedUser.feature_flags?.dre_enabled }
                       })} />
                    </div>
                 </div>

                 <div className="space-y-6">
                    <AdminInput label="Nome do Operador" value={selectedUser.nome_completo} onChange={(v: string) => setSelectedUser({...selectedUser, nome_completo: v})} />
                    <AdminInput label="Unidade / Empresa" value={selectedUser.empresa_nome} onChange={(v: string) => setSelectedUser({...selectedUser, empresa_nome: v})} />
                    <AdminInput label="Senha de Login" value={selectedUser.senha_acesso} onChange={(v: string) => setSelectedUser({...selectedUser, senha_acesso: v})} />
                    
                    <button 
                      onClick={handleSaveUser}
                      disabled={isSyncing}
                      className="w-full bg-slate-900 text-white py-6 rounded-2xl font-black uppercase text-[11px] tracking-widest mt-10 shadow-2xl hover:bg-indigo-600 transition-all disabled:opacity-50"
                    >
                      {isSyncing ? 'Sincronizando Cloud...' : 'Salvar Configurações Master'}
                    </button>
                 </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

const QuickStat = ({ label, value, color }: any) => (
  <div className="bg-white/5 border border-white/10 px-6 py-3 rounded-2xl text-center backdrop-blur-md">
    <span className="text-[7px] font-black uppercase tracking-widest text-white/40 block mb-1">{label}</span>
    <span className={`text-xl font-black font-mono ${color}`}>{value}</span>
  </div>
);

const TabButton = ({ active, onClick, label }: any) => (
  <button onClick={onClick} className={`px-6 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${active ? 'bg-white text-slate-900 shadow-xl' : 'text-white/40 hover:text-white hover:bg-white/5'}`}>
    {label}
  </button>
);

const FlagIndicator = ({ active, label }: any) => (
  <span className={`px-1.5 py-0.5 rounded text-[7px] font-black uppercase tracking-tighter ${active ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-300'}`}>
    {label}
  </span>
);

const FlagToggle = ({ label, active, onClick }: any) => (
  <button onClick={onClick} className="w-full flex items-center justify-between p-4 bg-slate-50 rounded-2xl hover:bg-slate-100 transition-all border border-slate-100">
    <span className="text-[10px] font-black text-slate-900 uppercase tracking-tight">{label}</span>
    <div className={`w-10 h-5 rounded-full relative transition-all ${active ? 'bg-indigo-500' : 'bg-slate-200'}`}>
       <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${active ? 'left-6' : 'left-1'}`}></div>
    </div>
  </button>
);

const StatusButton = ({ label, active, onClick, color }: any) => (
  <button onClick={onClick} className={`py-3 rounded-xl text-[8px] font-black uppercase tracking-widest border-2 transition-all ${active ? `${color} text-white border-transparent shadow-lg` : 'bg-slate-50 border-slate-100 text-slate-400 hover:bg-slate-100'}`}>
    {label}
  </button>
);

const AdminInput = ({ label, value, onChange, type = 'text' }: AdminInputProps) => (
  <div className="space-y-2">
    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">{label}</label>
    <input 
      type={type} 
      value={value || ''} 
      onChange={(e) => onChange(e.target.value)}
      className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 py-4 text-sm font-bold outline-none focus:border-indigo-600 transition-all"
    />
  </div>
);

export default AdminView;
