
import React, { useState } from 'react';
import { supabase } from '../lib/supabase';

interface LoginProps {
  onLoginSuccess: (session: any) => void;
}

const BrainHeroIcon = () => (
  <svg className="w-10 h-10" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="grad_hero" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#FF7A00" />
        <stop offset="100%" stopColor="#9D00FF" />
      </linearGradient>
    </defs>
    <path d="M50 15C38.9543 15 30 23.9543 30 35C30 37.0252 30.3005 38.98 30.8571 40.8163C24.7143 41.8367 20 47.1429 20 53.5C20 60.4036 25.5964 66 32.5 66C32.1667 67.9592 32 69.9592 32 72C32 83.0457 40.9543 92 52 92C63.0457 92 72 83.0457 72 72C72 69.9592 71.8333 67.9592 71.5 66C78.4036 66 84 60.4036 84 53.5C84 47.1429 79.2857 41.8367 73.1429 40.8163C73.6995 38.98 74 37.0252 74 35C74 23.9543 65.0457 15 54 15H50Z" fill="url(#grad_hero)" />
    <text x="50" y="62" textAnchor="middle" fill="white" fontSize="14" fontWeight="900" style={{ fontFamily: 'Inter' }}>TW</text>
  </svg>
);

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
      {/* Visual Side - Matching the new TAGWAY Branding */}
      <div className="hidden md:flex flex-1 bg-[#0f172a] p-20 flex-col justify-center items-start relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-blue-600/5 rounded-full blur-[120px] -mr-96 -mt-96"></div>
        
        <div className="relative z-10 animate-slide-up">
          {/* Logo container with rounded glass effect */}
          <div className="w-24 h-24 bg-white/5 rounded-[2rem] flex items-center justify-center shadow-2xl border border-white/10 backdrop-blur-xl">
            <BrainHeroIcon />
          </div>
          
          {/* Main Title TAGWAY - Bold Italic */}
          <h1 className="text-[5rem] font-black text-white mt-8 tracking-tighter leading-none italic uppercase">
            TAGWAY
          </h1>
          
          {/* Gradient Underline */}
          <div className="h-2 w-36 bg-gradient-to-r from-[#FF7A00] to-[#9D00FF] mt-4 rounded-full"></div>
          
          <div className="mt-16 text-slate-400 space-y-2">
            <p className="text-xl font-medium tracking-tight leading-snug max-w-sm">
              Sua plataforma de inteligência fiscal e precificação estratégica.
            </p>
            <div className="flex gap-10 pt-8 opacity-60">
               <Metric label="Precisão" val="100%" />
               <Metric label="NCM 2025" val="ATIVO" />
            </div>
          </div>
        </div>
      </div>

      {/* Form Side */}
      <div className="flex-1 flex items-center justify-center p-8 bg-white md:rounded-l-[4rem] shadow-[-20px_0_40px_rgba(0,0,0,0.02)] z-20">
        <div className="w-full max-w-sm space-y-12">
          <div className="md:hidden text-center mb-8 flex flex-col items-center">
             <div className="w-16 h-16 mb-4 bg-[#0f172a] rounded-2xl flex items-center justify-center">
               <BrainHeroIcon />
             </div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase italic">TAGWAY</h1>
            <div className="h-1 w-16 bg-gradient-to-r from-orange-500 to-purple-600 mt-2 rounded-full mx-auto"></div>
          </div>
          
          <div className="space-y-4">
            <h2 className="text-3xl font-black text-slate-900 tracking-tighter">Login.</h2>
            <p className="text-slate-500 font-medium">Acesse a plataforma de análise fiscal.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <LoginInput label="E-mail ou Usuário" type="text" value={email} onChange={setEmail} placeholder="contato@tagway.com.br" />
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
             <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">© 2025 TAGWAY TECHNOLOGY — Business Intelligence</p>
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
