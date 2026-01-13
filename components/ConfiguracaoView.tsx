
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
}

const ConfiguracaoView: React.FC<{ userId?: string }> = ({ userId }) => {
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
    modo_apresentacao: false
  });
  const [password, setPassword] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!userId) return;
    const loadConfigs = async () => {
      const { data } = await supabase
        .from('user_configs')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();
      
      if (data) setConfigs(prev => ({ ...prev, ...data }));
    };
    loadConfigs();
  }, [userId]);

  const handleSave = async () => {
    if (!userId) return;
    setIsSaving(true);
    try {
      const { error: configError } = await supabase
        .from('user_configs')
        .upsert({ user_id: userId, ...configs }, { onConflict: 'user_id' });
      
      if (configError) throw configError;

      if (password.length >= 6) {
        const { error: authError } = await supabase.auth.updateUser({ password });
        if (authError) throw authError;
      }

      alert('Perfil e configurações atualizados!');
    } catch (err: any) {
      alert('Erro ao salvar: ' + (err.message || JSON.stringify(err)));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-10 pb-24 animate-slide-up">
      <header className="border-b border-slate-200 pb-8 flex justify-between items-end">
        <div>
          <h2 className="text-4xl font-black text-slate-900 tracking-tighter uppercase italic">Configurações</h2>
          <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px] mt-2">Gestão de perfil e inteligência fiscal</p>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <section className="bg-white rounded-[2.5rem] p-8 border border-slate-200 shadow-sm space-y-6">
            <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>
              Identidade do Usuário
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <ConfigField label="Nome Completo" value={configs.nome_completo} onChange={(v: string) => setConfigs({...configs, nome_completo: v})} />
              <ConfigField label="E-mail" type="email" value={configs.email} onChange={(v: string) => setConfigs({...configs, email: v})} />
              <ConfigField label="Empresa" value={configs.empresa_nome} onChange={(v: string) => setConfigs({...configs, empresa_nome: v})} />
              <ConfigField label="Alterar Senha" type="password" value={password} onChange={(v: string) => setPassword(v)} placeholder="Mínimo 6 caracteres" />
            </div>
            <button 
              onClick={handleSave}
              disabled={isSaving || !userId}
              className="w-full bg-black text-white py-4 rounded-xl font-black uppercase tracking-widest text-[10px] hover:bg-slate-800 transition-all shadow-xl disabled:opacity-50"
            >
              {isSaving ? 'Salvando...' : 'Salvar Alterações'}
            </button>
          </section>
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
