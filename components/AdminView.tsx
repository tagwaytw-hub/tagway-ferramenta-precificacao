
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const AdminView: React.FC = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [aiRequest, setAiRequest] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
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
    const { data } = await supabase.from('user_configs').select('*');
    if (data) setUsers(data);
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsRegistering(true);
    try {
      // 1. Cria o usuário no Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: newUser.email,
        password: newUser.senha,
      });

      if (authError) throw authError;

      if (authData.user) {
        // 2. Cria a configuração do usuário no banco
        const { error: configError } = await supabase.from('user_configs').insert({
          user_id: authData.user.id,
          nome_completo: newUser.nome,
          email: newUser.email,
          empresa_nome: newUser.empresa,
          regime_tributario: newUser.regime,
          uf_padrao_destino: 'SP', // Default
          is_admin: false
        });

        if (configError) throw configError;
        
        alert('Usuário cadastrado com sucesso!');
        setNewUser({ nome: '', email: '', senha: '', empresa: '', regime: 'Real' });
        fetchUsers();
      }
    } catch (err: any) {
      alert('Erro ao cadastrar: ' + err.message);
    } finally {
      setIsRegistering(false);
    }
  };

  const generateAIPrompt = () => {
    const prompt = `ATUAR COMO SENIOR FRONTEND ENGINEER. SOLICITAÇÃO DE EDIÇÃO: ${aiRequest}`;
    navigator.clipboard.writeText(prompt);
    alert('Prompt copiado! Cole no chat da IA.');
  };

  return (
    <div className="max-w-6xl mx-auto space-y-10 pb-20 animate-slide-up">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-slate-200 pb-8">
        <div>
          <div className="flex items-center gap-3">
            <div className="bg-purple-600 text-white p-2 rounded-lg shadow-lg shadow-purple-500/20">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04M12 2.944v10m0 0a2 2 0 100 4 2 2 0 000-4z"/></svg>
            </div>
            <h2 className="text-4xl font-black text-slate-900 tracking-tighter uppercase italic">Master Control</h2>
          </div>
          <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px] mt-2">Gestão de Usuários e IA Bridge</p>
        </div>
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Painel de Cadastro */}
        <div className="xl:col-span-1">
          <section className="bg-white rounded-[2.5rem] p-8 border border-slate-200 shadow-xl space-y-6 sticky top-8">
            <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em]">Novo Usuário</h3>
            <form onSubmit={handleCreateUser} className="space-y-4">
              <AdminInput label="Nome Completo" value={newUser.nome} onChange={(v: string) => setNewUser({...newUser, nome: v})} />
              <AdminInput label="E-mail" type="email" value={newUser.email} onChange={(v: string) => setNewUser({...newUser, email: v})} />
              <AdminInput label="Senha Inicial" type="password" value={newUser.senha} onChange={(v: string) => setNewUser({...newUser, senha: v})} />
              <AdminInput label="Empresa" value={newUser.empresa} onChange={(v: string) => setNewUser({...newUser, empresa: v})} />
              
              <div className="space-y-2">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Regime Inicial</label>
                <select 
                  value={newUser.regime}
                  onChange={(e) => setNewUser({...newUser, regime: e.target.value as any})}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-black outline-none focus:border-black transition-all"
                >
                  <option value="Real">Lucro Real</option>
                  <option value="Presumido">Lucro Presumido</option>
                  <option value="Simples">Simples Nacional</option>
                </select>
              </div>

              <button 
                type="submit"
                disabled={isRegistering}
                className="w-full bg-black text-white py-4 rounded-xl font-black uppercase tracking-widest text-[10px] shadow-xl hover:bg-slate-800 transition-all disabled:opacity-50"
              >
                {isRegistering ? 'Cadastrando...' : 'Criar Conta'}
              </button>
            </form>
          </section>
        </div>

        {/* Listagem e IA Bridge */}
        <div className="xl:col-span-2 space-y-8">
          {/* IA Bridge */}
          <section className="bg-slate-900 rounded-[2.5rem] p-8 text-white shadow-2xl space-y-6">
            <div className="flex items-center gap-3">
               <div className="w-8 h-8 bg-purple-500/20 rounded-full flex items-center justify-center animate-pulse">
                 <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
               </div>
               <span className="text-xs font-black uppercase tracking-widest text-purple-300">IA Bridge - Edição de Código</span>
            </div>
            <textarea 
              value={aiRequest}
              onChange={(e) => setAiRequest(e.target.value)}
              placeholder="Descreva a alteração que deseja no código..."
              className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-xs font-bold focus:border-purple-500 outline-none min-h-[100px] transition-all"
            />
            <button 
              onClick={generateAIPrompt}
              className="w-full bg-purple-600 hover:bg-purple-500 text-white py-4 rounded-xl font-black uppercase tracking-[0.2em] text-[10px] shadow-xl transition-all"
            >
              Gerar Prompt para IA
            </button>
          </section>

          {/* Lista de Usuários */}
          <section className="space-y-4">
            <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] px-2">Usuários Ativos</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {users.map(u => (
                <div key={u.user_id} className="bg-white border border-slate-200 p-6 rounded-[2rem] hover:shadow-xl transition-all group">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-black text-slate-900 tracking-tight">{u.nome_completo || 'Sem Nome'}</h4>
                      <p className="text-[10px] text-slate-400 font-bold uppercase">{u.email}</p>
                    </div>
                    <span className="bg-emerald-50 text-emerald-600 px-2 py-1 rounded-lg text-[8px] font-black uppercase">
                      {u.regime_tributario}
                    </span>
                  </div>
                  <div className="mt-4 pt-4 border-t border-slate-50 flex justify-between items-center">
                    <span className="text-[9px] font-black text-slate-300 uppercase italic">{u.empresa_nome || 'Tagway User'}</span>
                    {u.is_admin && <span className="text-[8px] font-black text-purple-600 uppercase">Master</span>}
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

interface AdminInputProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
}

const AdminInput: React.FC<AdminInputProps> = ({ label, value, onChange, type = 'text' }) => (
  <div className="space-y-1.5">
    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">{label}</label>
    <input 
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold outline-none focus:border-black transition-all"
    />
  </div>
);

export default AdminView;
