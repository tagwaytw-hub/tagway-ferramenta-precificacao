import React, { useState } from 'react';
import { supabase } from '../lib/supabase';

interface LoginProps {
  onLoginSuccess: (session: any) => void;
}

const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    const loginEmail = email.includes('@') ? email : `${email}@tagway.com.br`;
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email: loginEmail, password });
      if (error) {
        // Extrai mensagem real para evitar [object Object]
        alert(`Erro de login: ${error.message || 'Credenciais inválidas'}`);
      } else if (data.session) {
        onLoginSuccess(data.session);
      }
    } catch (err: any) {
      const errorMessage = err?.message || (typeof err === 'object' ? JSON.stringify(err) : String(err));
      alert(`Erro inesperado: ${errorMessage}`);
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f1f5f9] flex flex-col md:flex-row items-stretch overflow-hidden">
      {/* Visual Side */}
      <div className="hidden md:flex flex-1 bg-[#0f172a] p-20 flex-col justify-between relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-blue-600/10 rounded-full blur-[120px] -mr-96 -mt-96"></div>
        <div className="relative z-10">
          <div className="w-14 h-14 bg-blue-600 rounded-[20px] flex items-center justify-center shadow-2xl shadow-blue-500/40">
            <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
          </div>
          <h1 className="text-6xl font-black text-white mt-12 tracking-tighter leading-none italic">TAGWAY<br/>PRO</h1>
          <div className="h-1.5 w-24 bg-blue-600 mt-6 rounded-full"></div>
        </div>
        <div className="relative z-10 text-slate-400 space-y-4">
          <p className="text-2xl font-medium tracking-tight leading-snug max-w-sm">A nova inteligência para simulações fiscais e tributárias determinísticas.</p>
          <div className="flex gap-10 pt-10">
             <Metric label="Precisão" val="100%" />
             <Metric label="Dados NCM" val="2025" />
          </div>
        </div>
      </div>

      {/* Form Side */}
      <div className="flex-1 flex items-center justify-center p-8 bg-white md:rounded-l-[4rem] shadow-[-20px_0_40px_rgba(0,0,0,0.02)] z-20">
        <div className="w-full max-w-sm space-y-12">
          <div className="md:hidden text-center mb-8">
            <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase italic">Tagway Pro</h1>
          </div>
          
          <div className="space-y-4">
            <h2 className="text-3xl font-black text-slate-900 tracking-tighter">Bem-vindo.</h2>
            <p className="text-slate-500 font-medium">Acesse sua conta para começar as simulações.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <LoginInput label="E-mail ou Usuário" type="text" value={email} onChange={setEmail} placeholder="admin@tagway.com.br" />
              <LoginInput label="Senha" type="password" value={password} onChange={setPassword} placeholder="••••••••" />
            </div>
            
            <button 
              type="submit" 
              disabled={isLoading}
              className="w-full bg-slate-900 hover:bg-black text-white py-5 rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] shadow-2xl transition-all active:scale-95 disabled:opacity-50"
            >
              {isLoading ? 'Autenticando...' : 'Entrar no Sistema'}
            </button>
          </form>

          <footer className="pt-10 text-center border-t border-slate-100">
             <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">© 2025 Tagway Technology — Enterprise Version</p>
          </footer>
        </div>
      </div>
    </div>
  );
};

const LoginInput = ({ label, type, value, onChange, placeholder }: any) => (
  <div className="space-y-2">
    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{label}</label>
    <input 
      type={type}
      required
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4.5 text-sm font-bold outline-none focus:border-blue-600 focus:bg-white transition-all placeholder:text-slate-300"
    />
  </div>
);

const Metric = ({ label, val }: any) => (
  <div className="flex flex-col">
    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{label}</span>
    <span className="text-xl font-black text-white">{val}</span>
  </div>
);

export default Login;
