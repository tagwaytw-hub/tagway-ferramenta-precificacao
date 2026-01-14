
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface UserConfigs {
  empresa_nome: string;
  nome_completo: string;
  email: string;
  telefone: string;
  data_nascimento: string;
  regime_tributario: 'Simples' | 'Presumido' | 'Real';
  uf_padrao_origem: string;
  uf_padrao_destino: string;
  margem_padrao: number;
  modo_apresentacao: boolean;
  senha_acesso?: string;
}

interface ConfiguracaoViewProps {
  userId: string; // Tornando obrigatório para segurança
  onLogout?: () => void;
  onProfileUpdate?: () => void;
}

const ConfiguracaoView: React.FC<ConfiguracaoViewProps> = ({ userId, onLogout, onProfileUpdate }) => {
  const [configs, setConfigs] = useState<UserConfigs>({
    empresa_nome: '',
    nome_completo: '',
    email: '',
    telefone: '',
    data_nascimento: '',
    regime_tributario: 'Real',
    uf_padrao_origem: 'SP',
    uf_padrao_destino: 'SP',
    margem_padrao: 10,
    modo_apresentacao: false,
    senha_acesso: ''
  });
  const [password, setPassword] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [showMasterPass, setShowMasterPass] = useState(false);

  // Carregamento inicial do perfil do usuário logado
  useEffect(() => {
    if (!userId) return;
    const loadConfigs = async () => {
      const { data, error } = await supabase
        .from('user_configs')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();
      
      if (data) {
        setConfigs(prev => ({ ...prev, ...data }));
      } else if (error) {
        console.error("Erro ao carregar perfil:", error);
      }
    };
    loadConfigs();
  }, [userId]);

  const handleSave = async () => {
    if (!userId) {
      alert("Erro de autenticação: Sessão inválida.");
      return;
    }

    // Validação de campos obrigatórios
    if (!configs.nome_completo?.trim() || !configs.empresa_nome?.trim()) {
      alert("⚠️ DADOS INCOMPLETOS: Preencha seu Nome e Empresa para salvar.");
      return;
    }

    setIsSaving(true);
    try {
      // Garantimos que o objeto enviado para o Supabase não contenha campos nulos ou IDs errados
      const payload = {
        user_id: userId, // Força o ID da sessão atual
        nome_completo: configs.nome_completo,
        empresa_nome: configs.empresa_nome,
        email: configs.email,
        telefone: configs.telefone,
        data_nascimento: configs.data_nascimento || null,
        regime_tributario: configs.regime_tributario,
        uf_padrao_origem: configs.uf_padrao_origem,
        uf_padrao_destino: configs.uf_padrao_destino,
        margem_padrao: configs.margem_padrao,
        modo_apresentacao: configs.modo_apresentacao
      };

      // O uso de upsert com onConflict garante que NUNCA seja criada uma nova conta se o user_id bater
      const { error: configError } = await supabase
        .from('user_configs')
        .upsert(payload, { onConflict: 'user_id' });
      
      if (configError) throw configError;

      // Atualização de senha (opcional)
      if (password.length >= 6) {
        const { error: authError } = await supabase.auth.updateUser({ password });
        if (authError) throw authError;
        setPassword(''); // Limpa campo de senha após sucesso
      }

      // Notifica App.tsx para atualizar saudações no header
      if (onProfileUpdate) onProfileUpdate();

      alert('✅ Perfil salvo com sucesso!');
    } catch (err: any) {
      console.error("Erro ao salvar perfil:", err);
      alert('❌ Erro ao salvar: ' + (err.message || "Verifique sua conexão."));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-10 pb-40 animate-slide-up">
      <header className="border-b border-slate-200 pb-8 flex justify-between items-end">
        <div>
          <h2 className="text-4xl font-black text-slate-900 tracking-tighter uppercase italic">Configurações</h2>
          <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px] mt-2">Perfil Operacional & Segurança</p>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <section className="bg-white rounded-[2.5rem] p-8 lg:p-10 border border-slate-200 shadow-sm space-y-8">
            <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>
              Sua Identidade
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <ConfigField label="Seu Nome Completo *" value={configs.nome_completo} onChange={(v: string) => setConfigs({...configs, nome_completo: v})} />
              <ConfigField label="E-mail de Contato" type="email" value={configs.email} onChange={(v: string) => setConfigs({...configs, email: v})} />
              <ConfigField label="Sua Empresa *" value={configs.empresa_nome} onChange={(v: string) => setConfigs({...configs, empresa_nome: v})} />
              <ConfigField label="Telefone" value={configs.telefone} onChange={(v: string) => setConfigs({...configs, telefone: v})} />
            </div>

            <div className="pt-8 border-t border-slate-100 space-y-6">
              <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Segurança & Acesso</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <ConfigField label="Nova Senha de Login" type="password" value={password} onChange={(v: string) => setPassword(v)} placeholder="Mínimo 6 caracteres" />
                
                <div className="space-y-2">
                  <label className="text-[9px] font-black uppercase tracking-widest ml-1 text-slate-400">Senha Master (Admin)</label>
                  <div className="relative group">
                    <input 
                      type={showMasterPass ? 'text' : 'password'}
                      readOnly
                      value={configs.senha_acesso || '••••••••'}
                      className="w-full rounded-xl px-5 py-3.5 text-sm font-mono font-bold outline-none border bg-slate-50 border-slate-200 text-slate-900 pr-12 cursor-default"
                    />
                    <button 
                      onClick={() => setShowMasterPass(!showMasterPass)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-black transition-colors"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={showMasterPass ? "M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" : "M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.542-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88L1 1m11 11l11 11"}/></svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col md:flex-row gap-4 pt-4">
              <button 
                onClick={handleSave}
                disabled={isSaving}
                className="flex-1 bg-black text-white py-5 rounded-2xl font-black uppercase tracking-widest text-[11px] hover:bg-indigo-600 transition-all shadow-xl disabled:opacity-50 active:scale-[0.98]"
              >
                {isSaving ? 'Gravando...' : 'Salvar Alterações'}
              </button>
              
              {onLogout && (
                <button 
                  onClick={onLogout}
                  className="bg-rose-50 text-rose-600 border border-rose-100 py-5 px-8 rounded-2xl font-black uppercase tracking-widest text-[11px] hover:bg-rose-600 hover:text-white transition-all active:scale-[0.98]"
                >
                  Sair
                </button>
              )}
            </div>
          </section>
        </div>

        <div className="space-y-6">
           <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white shadow-2xl">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-6">Status do Terminal</h4>
              <div className="flex items-center gap-4 mb-8">
                 <div className="w-4 h-4 rounded-full bg-emerald-500 animate-pulse"></div>
                 <span className="text-xs font-black uppercase tracking-widest">Sincronizado</span>
              </div>
              <p className="text-[9px] font-medium text-white/30 uppercase leading-relaxed italic">
                Sua conta está vinculada ao identificador {userId.substring(0,8)}...
              </p>
           </div>
        </div>
      </div>
    </div>
  );
};

const ConfigField = ({ label, value, onChange, placeholder, type = 'text' }: any) => (
  <div className="space-y-2">
    <label className="text-[9px] font-black uppercase tracking-widest ml-1 text-slate-400">{label}</label>
    <input 
      type={type}
      value={value || ''}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full rounded-xl px-5 py-3.5 text-sm font-bold outline-none border bg-slate-50 border-slate-200 text-slate-900 focus:border-black transition-all"
    />
  </div>
);

export default ConfiguracaoView;
