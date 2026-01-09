
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://pvisyuhhyruuxrylzpqr.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB2aXN5dWhoeXJ1dXhyeWx6cHFyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjczOTQ2NDEsImV4cCI6MjA4Mjk3MDY0MX0.NGc5ws9ERsgDzelKYMiDZFA34MSyPiwn10agfQU1OnQ';

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
  const [currentAdminStatus, setCurrentAdminStatus] = useState<{is_admin: boolean, email: string} | null>(null);
  const [expandedUserId, setExpandedUserId] = useState<string | null>(null);
  const [isRegistering, setIsRegistering] = useState(false);
  const [isUpdating, setIsUpdating] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [newUser, setNewUser] = useState({
    nome: '',
    email: '',
    senha: '',
    empresa: '',
    regime: 'Real' as 'Simples' | 'Presumido' | 'Real'
  });

  useEffect(() => {
    checkAdminStatus();
    fetchUsers();
  }, []);

  const checkAdminStatus = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      const { data } = await supabase.from('user_configs').select('is_admin, email').eq('user_id', session.user.id).single();
      if (data) setCurrentAdminStatus(data);
      else if (session.user.email === 'tagwaytw@gmail.com') {
        setCurrentAdminStatus({ is_admin: true, email: 'tagwaytw@gmail.com' });
      }
    }
  };

  const fetchUsers = async () => {
    setErrorMessage(null);
    try {
      const { data, error } = await supabase
        .from('user_configs')
        .select('*')
        .order('nome_completo', { ascending: true });
      
      if (error) throw error;
      if (data) setUsers(data as UserProfile[]);
    } catch (err: any) {
      setErrorMessage(err.message || 'Erro ao carregar usuários.');
    }
  };

  const handleDeleteUser = async (userId: string, userName: string) => {
    const isMaster = currentAdminStatus?.email === 'tagwaytw@gmail.com';
    
    if (!currentAdminStatus?.is_admin && !isMaster) {
      alert("ERRO: O Banco de Dados não identifica você como um Admin.");
      return;
    }

    const confirmation = window.prompt(`Para apagar ${userName.toUpperCase()}, digite EXCLUIR:`);
    if (confirmation !== 'EXCLUIR') return;

    setIsDeleting(userId);
    try {
      // 1. Apagar dependências
      await supabase.from('simulacoes').delete().eq('user_id', userId);
      await supabase.from('overhead_configs').delete().eq('user_id', userId);
      
      // 2. Apagar Perfil Principal
      const { error, count } = await supabase
        .from('user_configs')
        .delete({ count: 'exact' })
        .eq('user_id', userId);

      if (error) throw error;

      if (count === 0 && !isMaster) {
        throw new Error("O banco recusou a exclusão. Verifique as políticas RLS.");
      }

      alert(`Sucesso! O usuário ${userName} foi removido.`);
      setExpandedUserId(null);
      fetchUsers();
    } catch (err: any) {
      alert(`FALHA NA EXCLUSÃO: ${err.message}`);
    } finally {
      setIsDeleting(null);
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
      alert('Usuário atualizado!');
      fetchUsers();
    } catch (err: any) {
      alert(`Erro na atualização: ${err.message}`);
    } finally {
      setIsUpdating(null);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUser.email || !newUser.senha || !newUser.nome) {
      alert('Preencha os campos obrigatórios.');
      return;
    }
    
    setIsRegistering(true);
    const tempClient = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false, autoRefreshToken: false }
    });

    try {
      const { data: authData, error: authError } = await tempClient.auth.signUp({
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
        alert('OPERADOR CRIADO!');
        setNewUser({ nome: '', email: '', senha: '', empresa: '', regime: 'Real' });
        fetchUsers();
      }
    } catch (err: any) {
      alert(`Erro no cadastro: ${err.message}`);
    } finally {
      setIsRegistering(false);
    }
  };

  const updateUserInState = (userId: string, field: keyof UserProfile, value: any) => {
    setUsers(prev => prev.map(u => u.user_id === userId ? { ...u, [field]: value } : u));
  };

  return (
    <div className="max-w-6xl mx-auto space-y-10 pb-20 animate-slide-up">
      <div className={`p-4 rounded-2xl border flex items-center justify-between ${currentAdminStatus?.is_admin ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-rose-50 border-rose-100 text-rose-700'}`}>
         <div className="flex items-center gap-3">
            <div className={`w-2 h-2 rounded-full animate-pulse ${currentAdminStatus?.is_admin ? 'bg-emerald-500' : 'bg-rose-500'}`}></div>
            <span className="text-[10px] font-black uppercase tracking-widest">
              Status do seu Acesso: {currentAdminStatus?.is_admin ? 'ADMINISTRADOR VALIDADO' : 'OPERADOR COMUM'}
            </span>
         </div>
      </div>

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
          Atualizar Lista
        </button>
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <div className="xl:col-span-1 space-y-6">
          <section className="bg-white rounded-[2.5rem] p-8 border border-slate-200 shadow-xl space-y-6 sticky top-8">
            <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em]">Cadastrar Operador</h3>
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
                    <div className={`w-3 h-3 rounded-full ${user.status === 'ativo' ? 'bg-emerald-500' : user.status === 'atualizando' ? 'bg-blue-500' : 'bg-rose-500'}`}></div>
                    <div>
                      <h4 className="font-black text-slate-900 tracking-tight leading-none mb-1">{user.nome_completo || 'Sem Nome'}</h4>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{user.email}</p>
                    </div>
                  </div>
                  <svg className={`w-5 h-5 text-slate-300 transition-transform ${expandedUserId === user.user_id ? 'rotate-180 text-black' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7"/></svg>
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
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 block">Acesso</label>
                        <div className="grid grid-cols-3 gap-3">
                           <StatusButton label="ATIVO" active={user.status === 'ativo'} onClick={() => updateUserInState(user.user_id, 'status', 'ativo')} color="emerald" />
                           <StatusButton label="MANUTENÇÃO" active={user.status === 'atualizando'} onClick={() => updateUserInState(user.user_id, 'status', 'atualizando')} color="blue" />
                           <StatusButton label="BLOQUEADO" active={user.status === 'bloqueado'} onClick={() => updateUserInState(user.user_id, 'status', 'bloqueado')} color="rose" />
                        </div>
                    </div>

                    <div className="pt-8 border-t border-slate-100 flex flex-col md:flex-row items-center justify-between gap-6">
                      <div className="bg-rose-50 p-6 rounded-2xl border border-rose-100 flex-1 w-full">
                        <button 
                          onClick={() => handleDeleteUser(user.user_id, user.nome_completo)}
                          disabled={isDeleting === user.user_id || user.email === 'tagwaytw@gmail.com'}
                          className="w-full md:w-auto bg-rose-600 text-white px-6 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest shadow-lg hover:bg-rose-700 disabled:opacity-30"
                        >
                          {isDeleting === user.user_id ? 'EXCLUINDO...' : 'DELETAR OPERADOR'}
                        </button>
                      </div>
                      <button onClick={() => handleUpdateUser(user)} disabled={isUpdating === user.user_id} className="bg-black text-white px-10 py-4 rounded-xl font-black uppercase text-[10px] tracking-widest shadow-xl w-full md:w-auto">
                        {isUpdating === user.user_id ? 'Salvando...' : 'Salvar Alterações'}
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
    emerald: active ? 'bg-emerald-500 text-white border-emerald-500 shadow-lg' : 'bg-white text-slate-400 border-slate-100',
    blue: active ? 'bg-blue-600 text-white border-blue-600 shadow-lg' : 'bg-white text-slate-400 border-slate-100',
    rose: active ? 'bg-rose-600 text-white border-rose-600 shadow-lg' : 'bg-white text-slate-400 border-slate-100',
  };
  return (
    <button type="button" onClick={(e) => { e.stopPropagation(); onClick(); }} className={`py-3 rounded-xl border-2 font-black uppercase text-[9px] tracking-widest transition-all ${styles[color]}`}>
      {label}
    </button>
  );
};

export default AdminView;
