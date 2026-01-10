
import React, { useState } from 'react';
import { supabase } from '../lib/supabase';

interface LoginProps {
  onLoginSuccess: (session: any) => void;
}

// Componente BrainIcon - Centralizado para a tela de Login (Imagem 1)
const BrainHeroIcon = () => (
  <svg className="w-24 h-24 mb-6" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="grad_hero_login" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#FF7A00" />
        <stop offset="100%" stopColor="#9D00FF" />
      </linearGradient>
    </defs>
    <path d="M50 15C38.9543 15 30 23.9543 30 35C30 37.0252 30.3005 38.98 30.8571 40.8163C24.7143 41.8367 20 47.1429 20 53.5C20 60.4036 25.5964 66 32.5 66C32.1667 67.9592 32 69.9592 32 72C32 83.0457 40.9543 92 52 92C63.0457 92 72 83.0457 72 72C72 69.9592 71.8333 67.9592 71.5 66C78.4036 66 84 60.4036 84 53.5C84 47.1429 79.2857 41.8367 73.1429 40.8163C73.6995 38.98 74 37.0252 74 35C74 23.9543 65.0457 15 54 15H50Z" fill="url(#grad_hero_login)" />
    <text x="50" y="63" textAnchor="middle" fill="white" fontSize="14" fontWeight="900" style={{ fontFamily: 'Inter' }}>TW</text>
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
    <div className="min-h-screen bg-[#000000] flex flex-col md:flex-row items-stretch overflow-hidden">
      {/* Lado Visual - Logo Vertical (Imagem 1) */}
      <div className="hidden md:flex flex-[1.4] bg-[#000000] p-20 flex-col justify-center items-center relative overflow-hidden">
        {/* Glow de fundo sutil */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-600/5 rounded-full blur-[100px]"></div>
        
        <div className="relative z-10 animate-slide-up flex flex-col items-center text-center">
          {/* Cérebro Standalone (Topo) */}
          <BrainHeroIcon />
          
          {/* TAGWAY (Meio) */}
          <h1 className="text-[7rem] font-black text-white tracking-tighter leading-none italic uppercase mb-4">
            TAGWAY
          </h1>
          
          {/* Sublinhado de Gradiente (Baixo) */}
          <div className="h-2 w-56 bg-gradient-to-r from-[#FF7A00] to-[#9D00FF] rounded-full"></div>
          
          <div className="mt-20 text-slate-500 space-y-4 max-w-md">
            <p className="text-xl font-medium tracking-tight leading-snug">
              Inteligência fiscal determinística para maximizar sua lucratividade.
            </p>
            <div className="flex justify-center gap-10 pt-10 opacity-30">
               <div className="flex flex-col">
                 <span className="text-[10px] font-black uppercase tracking-widest mb-1">Precisão</span>
                 <span className="text-2xl font-black text-white">100%</span>
               </div>
               <div className="flex flex-col">
                 <span className="text-[10px] font-black uppercase tracking-widest mb-1">Atualização</span>
                 <span className="text-2xl font-black text-white">2025</span>
               </div>
            </div>
          </div>
        </div>
      </div>

      {/* Lado do Formulário - Contraste Branco */}
      <div className="flex-1 flex items-center justify-center p-8 bg-white md:rounded-l-[4.5rem] shadow-[-30px_0_60px_rgba(0,0,0,0.5)] z-20">
        <div className="w-full max-w-sm space-y-12">
          {/* Header Mobile */}
          <div className="md:hidden text-center mb-10 flex flex-col items-center">
             <div className="w-14 h-14 mb-4 bg-black rounded-2xl flex items-center justify-center shadow-2xl">
                <svg className="w-9 h-9" viewBox="0 0 100 100" fill="none">
                  <path d="M50 15C38.9 15 30 23.9 30 35C30 37.1 30.3 39.1 30.9 41C24.8 42 20 47.3 20 53.5C20 60.4 25.6 66 32.5 66C32.2 68 32 70 32 72C32 83 41 92 52 92C63 92 72 83 72 72C72 70 71.8 68 71.5 66C78.4 66 84 60.4 84 53.5C84 47.3 79.2 42 73.1 41C73.7 39.1 74 37.1 74 35C74 23.9 65.1 15 54 15H50Z" fill="url(#grad_hero_login)" />
                </svg>
             </div>
             <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase italic">TAGWAY</h1>
             <div className="h-1 w-16 bg-gradient-to-r from-[#FF7A00] to-[#9D00FF] mt-2 rounded-full mx-auto"></div>
          </div>
          
          <div className="space-y-4">
            <h2 className="text-4xl font-black text-slate-900 tracking-tighter leading-tight">Acesso à Plataforma.</h2>
            <p className="text-slate-500 font-medium">Entre com suas credenciais de operador.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">E-mail ou Usuário</label>
                <input 
                  type="text"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@tagway.com.br"
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4.5 text-sm font-bold outline-none focus:border-black focus:bg-white transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Senha</label>
                <input 
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4.5 text-sm font-bold outline-none focus:border-black focus:bg-white transition-all"
                />
              </div>
            </div>
            
            <button 
              type="submit" 
              disabled={isLoading}
              className="w-full bg-slate-900 hover:bg-black text-white py-5 rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] shadow-2xl transition-all active:scale-95 disabled:opacity-50"
            >
              {isLoading ? 'Autenticando...' : 'Iniciar Sessão'}
            </button>
          </form>

          <footer className="pt-10 text-center border-t border-slate-100">
             <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest leading-relaxed">
               © 2025 TAGWAY TECHNOLOGY — Business Intelligence<br/>
               Sistemas de Alta Precisão
             </p>
          </footer>
        </div>
      </div>
    </div>
  );
};

export default Login;
