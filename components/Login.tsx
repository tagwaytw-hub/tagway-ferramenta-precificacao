
import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { stringifyError } from '../App';

interface LoginProps {
  onLoginSuccess: (session: any) => void;
}

const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
  const [emailInput, setEmailInput] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Lógica de resolução de e-mail idêntica à do envio
  const resolvedEmail = emailInput.trim() 
    ? (emailInput.includes('@') ? emailInput.trim() : `${emailInput.trim()}@tagway.com.br`)
    : '';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    
    if (!emailInput.trim() || !password.trim()) {
      setErrorMsg('Por favor, preencha todos os campos.');
      return;
    }

    setIsLoading(true);
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ 
        email: resolvedEmail, 
        password 
      });

      if (error) {
        setErrorMsg(stringifyError(error));
      } else if (data.session) {
        onLoginSuccess(data.session);
      }
    } catch (err: any) {
      setErrorMsg(stringifyError(err));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f1f5f9] flex flex-col md:flex-row items-stretch overflow-hidden">
      {/* Lado Visual - Desktop */}
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

      {/* Lado do Formulário */}
      <div className="flex-1 flex items-center justify-center p-8 bg-white md:rounded-l-[4rem] shadow-[-20px_0_40px_rgba(0,0,0,0.02)] z-20">
        <div className="w-full max-w-sm space-y-10">
          <div className="md:hidden text-center mb-8">
            <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase italic">Tagway Pro</h1>
          </div>
          
          <div className="space-y-3">
            <h2 className="text-3xl font-black text-slate-900 tracking-tighter">Login.</h2>
            <p className="text-slate-500 font-medium">Insira seus dados para acessar o painel.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-5">
              {/* Campo de Usuário/E-mail */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Usuário ou E-mail</label>
                <div className="relative">
                  <input 
                    type="text"
                    required
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    placeholder="ex: tagwaytw@gmail.com ou 'admin'"
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4.5 text-sm font-bold outline-none focus:border-blue-600 focus:bg-white transition-all placeholder:text-slate-300"
                  />
                </div>
                {emailInput.trim() && (
                  <div className="flex items-center gap-2 ml-1 animate-slide-up">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></div>
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tight">
                      Entrando como: <span className="text-blue-600 lowercase">{resolvedEmail}</span>
                    </span>
                  </div>
                )}
              </div>

              {/* Campo de Senha */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Sua Senha</label>
                <div className="relative">
                  <input 
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4.5 text-sm font-bold outline-none focus:border-blue-600 focus:bg-white transition-all placeholder:text-slate-300"
                  />
                  <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-600 transition-colors"
                  >
                    {showPassword ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18"/></svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Mensagem de Erro amigável */}
            {errorMsg && (
              <div className="bg-rose-50 border border-rose-100 p-4 rounded-xl flex gap-3 items-center animate-slide-up">
                <div className="bg-rose-500 text-white p-1 rounded-md">
                   <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12"/></svg>
                </div>
                <p className="text-[10px] font-black text-rose-600 uppercase tracking-tight leading-tight">{errorMsg}</p>
              </div>
            )}
            
            <button 
              type="submit" 
              disabled={isLoading}
              className="w-full bg-slate-900 hover:bg-black text-white py-5 rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] shadow-2xl transition-all active:scale-[0.98] disabled:opacity-50"
            >
              {isLoading ? 'Validando Acesso...' : 'Acessar Inteligência Fiscal'}
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

const Metric = ({ label, val }: any) => (
  <div className="flex flex-col">
    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{label}</span>
    <span className="text-xl font-black text-white">{val}</span>
  </div>
);

export default Login;
