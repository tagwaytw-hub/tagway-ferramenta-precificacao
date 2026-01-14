
import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabase';

interface UserProfile {
  user_id: string;
  nome_completo: string;
  email: string;
  empresa_nome: string;
  status: 'ativo' | 'bloqueado' | 'manutencao';
  telefone?: string;
  is_admin: boolean;
  role?: string;
  access_level?: string;
  senha_acesso?: string;
}

const AdminView: React.FC = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isNewUser, setIsNewUser] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const stats = useMemo(() => {
    const total = users.length;
    const ativos = users.filter(u => u.status === 'ativo').length;
    const bloqueados = users.filter(u => u.status === 'bloqueado').length;
    const manutencao = users.filter(u => u.status === 'manutencao').length;
    return { total, ativos, bloqueados, manutencao };
  }, [users]);

  const fetchUsers = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const { data, error } = await supabase
        .from('user_configs')
        .select('*')
        .order('nome_completo', { ascending: true });
      
      if (error) throw error;
      if (data) setUsers(data as UserProfile[]);
    } catch (err: any) {
      setErrorMessage(err.message || "Erro ao ler rede master");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenAdd = () => {
    // Limite removido para permitir expansão ilimitada de operadores
    setIsNewUser(true);
    setSelectedUser({
      user_id: '',
      nome_completo: '',
      email: '',
      empresa_nome: '',
      status: 'ativo',
      is_admin: false,
      role: 'Operador',
      access_level: 'Nível 1',
      senha_acesso: ''
    });
  };

  const handleSave = async () => {
    if (!selectedUser) return;
    if (!selectedUser.user_id || !selectedUser.email) {
      alert("ID do Usuário e E-mail são obrigatórios.");
      return;
    }

    setIsSyncing(true);
    try {
      let error;
      if (isNewUser) {
        const { error: insError } = await supabase
          .from('user_configs')
          .insert([selectedUser]);
        error = insError;
      } else {
        const { error: updError } = await supabase
          .from('user_configs')
          .update({
            nome_completo: selectedUser.nome_completo,
            empresa_nome: selectedUser.empresa_nome,
            status: selectedUser.status,
            role: selectedUser.role,
            access_level: selectedUser.access_level,
            telefone: selectedUser.telefone,
            email: selectedUser.email,
            senha_acesso: selectedUser.senha_acesso
          })
          .eq('user_id', selectedUser.user_id);
        error = updError;
      }
      
      if (error) throw error;
      
      alert(`✅ Sincronização Master Concluída: ${selectedUser.nome_completo || 'Operador'} registrado.`);
      setSelectedUser(null);
      setIsNewUser(false);
      fetchUsers();
    } catch (err: any) {
      alert("Falha na Sincronização Master: " + (err.message || "Erro de dados"));
    } finally {
      setIsSyncing(false);
    }
  };

  const filteredUsers = useMemo(() => {
    return users.filter(u => 
      (u.email || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
      (u.nome_completo || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.empresa_nome || '').toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [users, searchTerm]);

  return (
    <div className="max-w-7xl mx-auto space-y-10 pb-40 animate-slide-up">
      <header className="bg-black p-10 lg:p-12 rounded-[4rem] text-white shadow-2xl relative overflow-hidden border border-white/5">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-indigo-600/10 blur-[180px] rounded-full -mr-40 -mt-40"></div>
        <div className="relative z-10 flex flex-col xl:flex-row justify-between items-center gap-10">
          <div className="flex items-center gap-6">
             <div className="bg-indigo-500/20 p-4 rounded-3xl border border-indigo-500/20">
                <svg className="w-10 h-10 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/></svg>
             </div>
             <div>
               <h2 className="text-4xl lg:text-5xl font-black tracking-tighter uppercase italic leading-none">Controle Master</h2>
               <p className="text-white/30 text-[10px] font-black uppercase tracking-[0.4em] mt-3">Monitoramento Global de Operadores</p>
             </div>
          </div>

          <div className="flex flex-wrap justify-center gap-3">
            <StatPill label="Ativos" value={stats.ativos} color="text-emerald-400" />
            <StatPill label="Blocked" value={stats.bloqueados} color="text-rose-500" />
            <StatPill label="Manut." value={stats.manutencao} color="text-amber-400" />
            <div className="bg-white/10 px-6 py-4 rounded-[1.5rem] border border-white/20 text-center shadow-xl backdrop-blur-md">
              <span className="text-[7px] font-black text-white/40 uppercase block mb-1 tracking-widest">Operadores Totais</span>
              <span className="text-xl font-black font-mono text-indigo-400">{stats.total}</span>
            </div>
          </div>

          <button 
            onClick={handleOpenAdd}
            className="bg-white text-black px-8 py-5 rounded-3xl font-black uppercase text-[11px] tracking-widest hover:bg-indigo-500 hover:text-white transition-all flex items-center gap-3 shadow-2xl active:scale-95 shrink-0"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/></svg>
            Novo Operador
          </button>
        </div>
      </header>

      <div className="relative">
        <input 
          type="text" 
          placeholder="Pesquisar por nome, email ou empresa..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-white border-2 border-slate-100 rounded-[2.5rem] px-8 py-5 pl-16 text-sm font-bold shadow-xl focus:border-black outline-none transition-all"
        />
        <svg className="w-6 h-6 absolute left-7 top-1/2 -translate-y-1/2 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
      </div>

      <div className="bg-white border-2 border-slate-100 rounded-[3rem] overflow-hidden shadow-2xl">
        <div className="overflow-x-auto no-scrollbar">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-900 text-white uppercase text-[9px] font-black tracking-widest italic">
                <th className="px-10 py-6">Operador</th>
                <th className="px-10 py-6">Cargo</th>
                <th className="px-10 py-6">Empresa</th>
                <th className="px-10 py-6">Status</th>
                <th className="px-10 py-6 text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr><td colSpan={5} className="p-32 text-center animate-pulse text-[10px] font-black uppercase text-slate-300 tracking-[0.5em]">Lendo Sinais Master...</td></tr>
              ) : filteredUsers.length === 0 ? (
                <tr><td colSpan={5} className="p-32 text-center text-[10px] font-black uppercase text-slate-300 tracking-[0.5em]">Nenhum operador registrado</td></tr>
              ) : filteredUsers.map(user => (
                <tr 
                  key={user.user_id} 
                  className="hover:bg-slate-50 transition-all group cursor-pointer" 
                  onClick={() => { setIsNewUser(false); setSelectedUser(user); }}
                >
                  <td className="px-10 py-7">
                    <div className="flex items-center gap-5">
                       <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400 font-black group-hover:bg-black group-hover:text-white transition-all">
                          {user.nome_completo?.charAt(0) || '?'}
                       </div>
                       <div>
                          <p className="text-sm font-black text-slate-900 tracking-tight leading-none">{user.nome_completo || 'Sem Nome'}</p>
                          <p className="text-[10px] font-bold text-slate-400 mt-2 italic">{user.email}</p>
                       </div>
                    </div>
                  </td>
                  <td className="px-10 py-7">
                    <span className="text-[10px] font-black uppercase text-indigo-500 tracking-widest">{user.role || 'Operador'}</span>
                  </td>
                  <td className="px-10 py-7">
                    <span className="text-[10px] font-black uppercase text-slate-400 italic">{user.empresa_nome || 'Tagway'}</span>
                  </td>
                  <td className="px-10 py-7">
                     <StatusBadge status={user.status} />
                  </td>
                  <td className="px-10 py-7 text-right">
                     <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-all">
                        <span className="text-[9px] font-black uppercase tracking-widest text-slate-900">Configurar</span>
                        <svg className="w-4 h-4 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M9 5l7 7-7 7"/></svg>
                     </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {selectedUser && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6 bg-black/95 backdrop-blur-sm">
           <div className="bg-white w-full max-w-4xl rounded-[4rem] shadow-2xl overflow-hidden animate-slide-up border border-white/10">
              <header className="bg-black p-12 text-white flex justify-between items-center relative overflow-hidden">
                 <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-emerald-500 to-rose-500"></div>
                 <div>
                    <h3 className="text-3xl font-black uppercase italic leading-none tracking-tighter">
                      {isNewUser ? 'Cadastrar Terminal' : 'Perfil Operacional'}
                    </h3>
                    <p className="text-white/40 text-[9px] font-black uppercase tracking-widest mt-3">Sincronização Cloud Tagway</p>
                 </div>
                 <button onClick={() => { setSelectedUser(null); setIsNewUser(false); }} className="text-white/20 hover:text-white transition-all bg-white/5 p-4 rounded-2xl">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12"/></svg>
                 </button>
              </header>
              
              <div className="p-12 grid grid-cols-1 lg:grid-cols-2 gap-10">
                 <div className="space-y-6">
                    {isNewUser && (
                      <AdminInput 
                        label="UUID do Usuário (Painel Supabase)" 
                        value={selectedUser.user_id} 
                        onChange={v => setSelectedUser({...selectedUser, user_id: v})} 
                        placeholder="Ex: 550e8400-e29b-41d4-a716..."
                      />
                    )}
                    <AdminInput label="Nome Completo" value={selectedUser.nome_completo} onChange={v => setSelectedUser({...selectedUser, nome_completo: v})} />
                    <AdminInput label="E-mail" value={selectedUser.email} onChange={v => setSelectedUser({...selectedUser, email: v})} type="email" />
                    
                    <div className="pt-4 border-t border-slate-100">
                      <AdminInput 
                        label="Senha de Acesso Master" 
                        value={selectedUser.senha_acesso || ''} 
                        onChange={v => setSelectedUser({...selectedUser, senha_acesso: v})} 
                        placeholder="Defina a senha para este terminal"
                      />
                      <div className="mt-4 p-5 bg-rose-50 rounded-2xl border border-rose-100 flex gap-4 items-start">
                         <div className="p-2 bg-rose-100 rounded-lg text-rose-600 shrink-0">
                           <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
                         </div>
                         <div>
                            <p className="text-[10px] font-black text-rose-600 uppercase tracking-widest leading-relaxed">
                               ⚠️ NOTA DE SEGURANÇA: Esta senha será exibida no perfil do operador para o primeiro acesso. O operador tem autonomia para alterá-la posteriormente no módulo de Ajustes.
                            </p>
                         </div>
                      </div>
                    </div>
                 </div>

                 <div className="space-y-6">
                    <AdminInput label="Cargo Operacional" value={selectedUser.role || ''} onChange={v => setSelectedUser({...selectedUser, role: v})} />
                    <AdminInput label="Empresa Vinculada" value={selectedUser.empresa_nome} onChange={v => setSelectedUser({...selectedUser, empresa_nome: v})} />
                    
                    <div className="space-y-3">
                       <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Estado do Terminal</label>
                       <div className="grid grid-cols-3 gap-3">
                          <StatusButton label="Ativo" active={selectedUser.status === 'ativo'} onClick={() => setSelectedUser({...selectedUser, status: 'ativo'})} color="bg-emerald-600" />
                          <StatusButton label="Manut." active={selectedUser.status === 'manutencao'} onClick={() => setSelectedUser({...selectedUser, status: 'manutencao'})} color="bg-amber-600" />
                          <StatusButton label="Block" active={selectedUser.status === 'bloqueado'} onClick={() => setSelectedUser({...selectedUser, status: 'bloqueado'})} color="bg-rose-600" />
                       </div>
                    </div>
                 </div>

                 <div className="lg:col-span-2 pt-10 border-t border-slate-100 flex gap-4">
                    <button 
                       onClick={handleSave}
                       disabled={isSyncing}
                       className="flex-1 bg-black text-white py-6 rounded-3xl font-black uppercase text-[12px] tracking-[0.2em] shadow-2xl hover:bg-emerald-600 transition-all flex items-center justify-center gap-4 active:scale-95 disabled:opacity-50"
                    >
                       {isSyncing ? 'Sincronizando Rede Cloud...' : isNewUser ? 'Cadastrar Operador na Nuvem' : 'Sincronizar Atualizações Master'}
                    </button>
                 </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

const StatPill = ({ label, value, color }: any) => (
  <div className="bg-white/5 px-4 py-3 rounded-2xl border border-white/10 text-center min-w-[80px]">
    <span className="text-[7px] font-black text-white/30 uppercase block mb-1 tracking-widest">{label}</span>
    <span className={`text-lg font-black font-mono ${color}`}>{value}</span>
  </div>
);

const StatusBadge = ({ status }: { status: string }) => {
  const styles: any = { ativo: 'bg-emerald-100 text-emerald-600', bloqueado: 'bg-rose-100 text-rose-600', manutencao: 'bg-amber-100 text-amber-600' };
  const labels: any = { ativo: 'Ativo', bloqueado: 'Block', manutencao: 'Manut.' };
  return (
    <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest ${styles[status]}`}>
      {labels[status]}
    </span>
  );
};

const StatusButton = ({ label, active, onClick, color }: any) => (
  <button onClick={onClick} className={`py-4 rounded-2xl text-[9px] font-black uppercase tracking-widest border-2 transition-all active:scale-95 ${active ? `${color} text-white border-transparent shadow-xl` : 'bg-slate-50 border-slate-100 text-slate-400 hover:bg-slate-100'}`}>
    {label}
  </button>
);

const AdminInput = ({ label, value, onChange, placeholder, type = 'text' }: any) => (
  <div className="space-y-2">
    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">{label}</label>
    <input 
      type={type} 
      value={value || ''}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 py-4 text-sm font-bold outline-none focus:border-black transition-all"
    />
  </div>
);

export default AdminView;
