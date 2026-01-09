
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface UserProfile {
  user_id: string;
  nome_completo: string;
  email: string;
  empresa_nome: string;
  regime_tributario: string;
  status: 'ativo' | 'atualizando' | 'bloqueado';
  is_admin: boolean;
}

const AdminView: React.FC = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [expandedUserId, setExpandedUserId] = useState<string | null>(null);
  const [isRegistering, setIsRegistering] = useState(false);
  const [isUpdating, setIsUpdating] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [newUser, setNewUser] = useState({
    nome: '',
    email: '',
    senha: '',
    empresa: '',
    regime: 'Real' as 'Simples' | 'Presumido' | 'Real'
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setErrorMessage(null);
    try {
      const { data, error } = await supabase
        .from('user_configs')
        .select('*');
      
      if (error) throw error;
      if (data) {
        setUsers(data as UserProfile[]);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Erro ao conectar com o banco de dados.');
    }
  };

  const handleUpdateUser = async (user: UserProfile) => {
    setIsUpdating(user.user_id);
    try {
      const { error } = await supabase
        .from('user_configs')
        .update({
          nome_completo: user.nome_completo,
          email: user.email,
          empresa_nome: user.empresa_nome,
          regime_tributario: user.regime_tributario,
          status: user.status
        })
        .eq('user_id', user.user_id);

      if (error) throw error;
      alert('Alterações aplicadas instantaneamente!');
      fetchUsers();
    } catch (err: any) {
      alert(`ERRO AO SALVAR: ${err.message}`);
    } finally {
      setIsUpdating(null);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUser.email || !newUser.senha || !newUser.nome) {
      alert('Nome, E-mail e Senha são obrigatórios.');
      return;
    }
    
    setIsRegistering(true);
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: newUser.email,
        password: newUser.senha,
        options: { data: { full_name: newUser.nome } }
      });

      if (authError) throw authError;

      if (authData.user) {
        const { error: configError } = await supabase.from('user_configs').insert([
          {
            user_id: authData.user.id,
            nome_completo: newUser.nome,
            email: newUser.email,
            empresa_nome: newUser.empresa,
            regime_tributario: newUser.regime,
            is_admin: false,
            status: 'ativo'
          }
        ]);

        if (configError) throw configError;
        alert('OPERADOR CRIADO COM SUCESSO!');
        setNewUser({ nome: '', email: '', senha: '', empresa: '', regime: 'Real' });
        fetchUsers();
      }
    } catch (err: any) {
      alert(`ERRO NO CADASTRO: ${err.message}\n\nNota: Verifique se o redirecionamento de e-mail está configurado no painel Supabase.`);
    } finally {
      setIsRegistering(false);
    }
  };

  const updateUserInState = (userId: string, field: keyof UserProfile, value: any) => {
    setUsers(prev => prev.map(u => u.user_id === userId ? { ...u, [field]: value } : u));
  };

  return (
    <div className="max-w-6xl mx-auto space-y-10 pb-20 animate-slide-up">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-slate-200 pb-8">
        <div>
          <div className="flex items-center gap-3">
            <div className="bg-purple-600 text-white p-2 rounded-lg shadow-lg">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04M12 2.944v10m0 0a2 2 0 100 4 2 2 0 000-4z"/></svg>
            </div>
            <h2 className="text-4xl font-black text-slate-900 tracking-tighter uppercase italic">Master Control</h2>
          </div>
          <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px] mt-2">Gestão de Licenças e Operadores</p>
        </div>
        <button onClick={fetchUsers} className="bg-slate-100 hover:bg-slate-200 text-slate-600 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all">
          Sincronizar Banco
        </button>
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <div className="xl:col-span-1 space-y-6">
          <section className="bg-white rounded-[2.5rem] p-8 border border-slate-200 shadow-xl space-y-6 sticky top-8">
            <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em]">Cadastrar Operador</h3>
            
            <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl">
               <p className="text-[9px] font-black text-amber-700 uppercase tracking-widest leading-relaxed">
                 DICA: Se o link de e-mail falhar, desative "Confirm Email" no painel do Supabase para liberação imediata.
               </p>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-4">
              <AdminInput label="Nome" value={newUser.nome} onChange={(v) => setNewUser({...newUser, nome: v})} />
              <AdminInput label="E-mail" type="email" value={newUser.email} onChange={(v) => setNewUser({...newUser, email: v})} />
              <AdminInput label="Senha" type="password" value={newUser.senha} onChange={(v) => setNewUser({...newUser, senha: v})} />
              <AdminInput label="Empresa" value={newUser.empresa} onChange={(v) => setNewUser({...newUser, empresa: v})} />
              <div className="space-y-1.5">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Regime Fiscal</label>
                <select 
                  value={newUser.regime}
                  onChange={(e) => setNewUser({...newUser, regime: e.target.value as any})}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-black outline-none"
                >
                  <option value="Real">Lucro Real</option>
                  <option value="Presumido">Lucro Presumido</option>
                  <option value="Simples">Simples Nacional</option>
                </select>
              </div>
              <button type="submit" disabled={isRegistering} className="w-full bg-black text-white py-4 rounded-xl font-black uppercase tracking-widest text-[10px] shadow-xl hover:bg-slate-800 disabled:opacity-50 transition-all">
                {isRegistering ? 'Criando...' : 'Gerar Acesso'}
              </button>
            </form>
          </section>
        </div>

        <div className="xl:col-span-2 space-y-6">
          <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] px-4">Operadores ({users.length})</h3>
          <div className="space-y-3">
            {users.map(user => (
              <div key={user.user_id} className={`bg-white border rounded-[2rem] overflow-hidden transition-all duration-300 ${expandedUserId === user.user_id ? 'border-black shadow-2xl scale-[1.01]' : 'border-slate-200 shadow-sm hover:border-slate-300'}`}>
                <button onClick={() => setExpandedUserId(expandedUserId === user.user_id ? null : user.user_id)} className="w-full flex items-center justify-between p-6 text-left hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className={`w-3 h-3 rounded-full ${user.status === 'ativo' ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : user.status === 'atualizando' ? 'bg-blue-500' : 'bg-rose-500'}`}></div>
                    <div>
                      <h4 className="font-black text-slate-900 tracking-tight leading-none mb-1">{user.nome_completo || 'Sem Nome'}</h4>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{user.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="hidden md:block text-right">
                       <span className="text-[9px] font-black text-slate-300 uppercase block leading-none mb-1">Status</span>
                       <span className={`text-[10px] font-black uppercase italic ${user.status === 'ativo' ? 'text-emerald-500' : user.status === 'atualizando' ? 'text-blue-500' : 'text-rose-500'}`}>{user.status}</span>
                    </div>
                    <svg className={`w-5 h-5 text-slate-300 transition-transform ${expandedUserId === user.user_id ? 'rotate-180 text-black' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7"/></svg>
                  </div>
                </button>

                {expandedUserId === user.user_id && (
                  <div className="p-8 border-t border-slate-100 space-y-8 animate-slide-up">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <AdminInput label="Nome Completo" value={user.nome_completo} onChange={(v) => updateUserInState(user.user_id, 'nome_completo', v)} />
                      <AdminInput label="E-mail" value={user.email} onChange={(v) => updateUserInState(user.user_id, 'email', v)} />
                      <AdminInput label="Empresa" value={user.empresa_nome} onChange={(v) => updateUserInState(user.user_id, 'empresa_nome', v)} />
                      <div className="space-y-1.5">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Regime Fiscal</label>
                        <select 
                          value={user.regime_tributario}
                          onChange={(e) => updateUserInState(user.user_id, 'regime_tributario', e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-black outline-none"
                        >
                          <option value="Real">Lucro Real</option>
                          <option value="Presumido">Lucro Presumido</option>
                          <option value="Simples">Simples Nacional</option>
                        </select>
                      </div>
                    </div>

                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                           <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 block">Configuração de Acesso</label>
                        </div>
                        <div className="grid grid-cols-3 gap-3">
                           <StatusButton label="ATIVO" active={user.status === 'ativo'} onClick={() => updateUserInState(user.user_id, 'status', 'ativo')} color="emerald" />
                           <StatusButton label="MANUTENÇÃO" active={user.status === 'atualizando'} onClick={() => updateUserInState(user.user_id, 'status', 'atualizando')} color="blue" />
                           <StatusButton label="BLOQUEADO" active={user.status === 'bloqueado'} onClick={() => updateUserInState(user.user_id, 'status', 'bloqueado')} color="rose" />
                        </div>
                        
                        <div className="bg-slate-50 rounded-2xl p-4 grid grid-cols-1 md:grid-cols-3 gap-4 border border-slate-100">
                          <div className="flex gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1 shrink-0"></div>
                            <p className="text-[8px] font-bold text-slate-500 uppercase leading-tight"><b className="text-slate-700">ATIVO:</b> Acesso total liberado.</p>
                          </div>
                          <div className="flex gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1 shrink-0"></div>
                            <p className="text-[8px] font-bold text-slate-500 uppercase leading-tight"><b className="text-slate-700">MANUTENÇÃO:</b> Mostra banner de alerta fiscal mas permite uso.</p>
                          </div>
                          <div className="flex gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-1 shrink-0"></div>
                            <p className="text-[8px] font-bold text-slate-500 uppercase leading-tight"><b className="text-slate-700">BLOQUEADO:</b> Trava a tela do usuário imediatamente.</p>
                          </div>
                        </div>
                    </div>

                    <div className="pt-6 border-t border-slate-50 flex justify-end">
                      <button onClick={() => handleUpdateUser(user)} disabled={isUpdating === user.user_id} className="bg-black text-white px-10 py-3 rounded-xl font-black uppercase text-[10px] tracking-widest shadow-xl disabled:opacity-50 transition-all active:scale-95">
                        {isUpdating === user.user_id ? 'Processando...' : 'Aplicar Mudanças'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

interface AdminInputProps { label: string; value: string; onChange: (v: string) => void; type?: string; }
const AdminInput: React.FC<AdminInputProps> = ({ label, value, onChange, type = 'text' }) => (
  <div className="space-y-1.5">
    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">{label}</label>
    <input type={type} value={value || ''} onChange={(e) => onChange(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold outline-none focus:border-black transition-all" />
  </div>
);

interface StatusButtonProps { label: string; active: boolean; onClick: () => void; color: 'emerald' | 'blue' | 'rose'; }
const StatusButton: React.FC<StatusButtonProps> = ({ label, active, onClick, color }) => {
  const styles = {
    emerald: active ? 'bg-emerald-500 text-white border-emerald-500 shadow-lg shadow-emerald-500/20' : 'bg-white text-slate-400 border-slate-100 hover:border-emerald-200',
    blue: active ? 'bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-500/20' : 'bg-white text-slate-400 border-slate-100 hover:border-blue-200',
    rose: active ? 'bg-rose-600 text-white border-rose-600 shadow-lg shadow-rose-500/20' : 'bg-white text-slate-400 border-slate-100 hover:border-rose-200',
  };
  return (
    <button type="button" onClick={(e) => { e.stopPropagation(); onClick(); }} className={`py-3 rounded-xl border-2 font-black uppercase text-[9px] tracking-widest transition-all ${styles[color]}`}>
      {label}
    </button>
  );
};

export default AdminView;
