
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

const ConfiguracaoView: React.FC<{ userId: string }> = ({ userId }) => {
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
    setIsSaving(true);
    try {
      // Atualiza Perfil e Configurações
      const { error: configError } = await supabase
        .from('user_configs')
        .upsert({ user_id: userId, ...configs }, { onConflict: 'user_id' });
      
      if (configError) throw configError;

      // Se houver nova senha, atualiza no Auth do Supabase
      if (password.length >= 6) {
        const { error: authError } = await supabase.auth.updateUser({ password });
        if (authError) throw authError;
      }

      alert('Perfil e configurações atualizados com sucesso!');
      window.location.reload(); // Recarrega para atualizar o greeting global
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
        <div className="bg-emerald-50 text-emerald-600 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border border-emerald-100">
          Conta Ativa
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Coluna 1: Dados Pessoais */}
        <div className="lg:col-span-2 space-y-8">
          <section className="bg-white rounded-[2.5rem] p-8 border border-slate-200 shadow-sm space-y-6">
            <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>
              Identidade do Usuário
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <ConfigField label="Nome Completo" value={configs.nome_completo} onChange={(v) => setConfigs({...configs, nome_completo: v})} />
              <ConfigField label="E-mail de Acesso" type="email" value={configs.email} onChange={(v) => setConfigs({...configs, email: v})} />
              <ConfigField label="Telefone / WhatsApp" value={configs.telefone} onChange={(v) => setConfigs({...configs, telefone: v})} />
              <ConfigField label="Data de Nascimento" type="date" value={configs.data_nascimento} onChange={(v) => setConfigs({...configs, data_nascimento: v})} />
              <ConfigField label="Alterar Senha" type="password" value={password} onChange={setPassword} placeholder="Mínimo 6 caracteres" />
              <ConfigField label="Nome da Empresa" value={configs.empresa_nome} onChange={(v) => setConfigs({...configs, empresa_nome: v})} />
            </div>
          </section>

          {/* Regime Tributário - CENTRAL */}
          <section className="bg-white rounded-[2.5rem] p-8 border border-slate-200 shadow-sm space-y-6">
            <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Regime Tributário da Operação</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <RegimeButton 
                label="Simples Nacional" 
                active={configs.regime_tributario === 'Simples'} 
                onClick={() => alert("Regime Simples Nacional em desenvolvimento. Utilizando base Lucro Real por enquanto.")} 
                disabled
              />
              <RegimeButton 
                label="Lucro Presumido" 
                active={configs.regime_tributario === 'Presumido'} 
                onClick={() => alert("Regime Lucro Presumido em desenvolvimento. Utilizando base Lucro Real por enquanto.")} 
                disabled
              />
              <RegimeButton 
                label="Lucro Real" 
                active={configs.regime_tributario === 'Real'} 
                onClick={() => setConfigs({...configs, regime_tributario: 'Real'})} 
              />
            </div>
            <p className="text-[9px] font-bold text-slate-400 uppercase text-center mt-4">Nota: O regime define o comportamento dos créditos de PIS/COFINS e ICMS.</p>
          </section>
        </div>

        {/* Coluna 2: Configurações Fiscais (Destaque) */}
        <div className="space-y-8">
          <section className="bg-slate-900 rounded-[2.5rem] p-8 text-white shadow-2xl space-y-8 h-full">
            <h3 className="text-[11px] font-black text-white/30 uppercase tracking-[0.2em]">Estratégia Fiscal</h3>
            
            <div className="space-y-6">
              <div className="space-y-3">
                <label className="text-[9px] font-black text-white/40 uppercase tracking-widest ml-1">Estado de Destino (Sede Fixa)</label>
                <select 
                  value={configs.uf_padrao_destino}
                  onChange={(e) => setConfigs({...configs, uf_padrao_destino: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs font-black outline-none appearance-none cursor-pointer focus:border-white/30 transition-all"
                >
                  {['AC','AL','AM','AP','BA','CE','DF','ES','GO','MA','MG','MS','MT','PA','PB','PE','PI','PR','RJ','RN','RO','RR','RS','SC','SE','SP','TO'].map(uf => (
                    <option key={uf} value={uf} className="bg-slate-900">{uf}</option>
                  ))}
                </select>
                <p className="text-[8px] text-white/20 font-bold uppercase leading-tight italic">Este campo define o estado de destino padrão para todas as suas simulações de compra.</p>
              </div>

              <ConfigField dark label="Margem Net Padrão (%)" type="number" value={configs.margem_padrao} onChange={(v) => setConfigs({...configs, margem_padrao: parseFloat(v)})} />
              
              <div className="pt-6 border-t border-white/5">
                <label className="flex items-center justify-between cursor-pointer group">
                  <div className="space-y-1">
                    <span className="text-xs font-black uppercase tracking-widest">Modo Apresentação</span>
                    <p className="text-[9px] text-white/40 font-bold uppercase">Ocultar custos em reuniões</p>
                  </div>
                  <div 
                    onClick={() => setConfigs({...configs, modo_apresentacao: !configs.modo_apresentacao})}
                    className={`w-12 h-6 rounded-full transition-all relative ${configs.modo_apresentacao ? 'bg-emerald-500' : 'bg-white/10'}`}
                  >
                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${configs.modo_apresentacao ? 'left-7' : 'left-1'}`}></div>
                  </div>
                </label>
              </div>
            </div>

            <div className="pt-10">
              <button 
                onClick={handleSave}
                disabled={isSaving}
                className="w-full bg-white text-black py-5 rounded-2xl font-black uppercase tracking-widest text-[11px] hover:bg-slate-200 transition-all shadow-xl active:scale-95 disabled:opacity-50"
              >
                {isSaving ? 'Gravando...' : 'Salvar Alterações'}
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

const ConfigField = ({ label, value, onChange, placeholder, type = 'text', dark = false }: any) => (
  <div className="space-y-2">
    <label className={`text-[9px] font-black uppercase tracking-widest ml-1 ${dark ? 'text-white/40' : 'text-slate-400'}`}>{label}</label>
    <input 
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={`w-full rounded-xl px-5 py-3.5 text-sm font-bold outline-none border transition-all ${
        dark 
        ? 'bg-white/5 border-white/10 text-white focus:border-white/30' 
        : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-black'
      }`}
    />
  </div>
);

const RegimeButton = ({ label, active, onClick, disabled }: any) => (
  <button 
    onClick={onClick}
    className={`p-6 rounded-2xl border-2 transition-all text-center flex flex-col items-center gap-3 ${
      active 
      ? 'bg-black border-black text-white shadow-xl scale-[1.02]' 
      : 'bg-slate-50 border-slate-100 text-slate-400 hover:border-slate-200'
    } ${disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
  >
    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${active ? 'bg-white/10 text-white' : 'bg-white text-slate-300'}`}>
       <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/></svg>
    </div>
    <span className="text-[10px] font-black uppercase tracking-widest">{label}</span>
  </button>
);

export default ConfiguracaoView;
