
import React, { useState } from 'react';
import { SimulationInputs } from '../types';

interface SidebarProps {
  inputs: SimulationInputs;
  setInputs: React.Dispatch<React.SetStateAction<SimulationInputs>>;
  isAutoSync: boolean;
  setIsAutoSync: (val: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ inputs, setInputs, isAutoSync, setIsAutoSync }) => {
  const [collapsed, setCollapsed] = useState<string[]>([]);

  const toggleCollapse = (id: string) => {
    setCollapsed(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleChange = (field: keyof SimulationInputs, value: any) => {
    const textFields = ['mode', 'ufOrigem', 'ufDestino', 'nomeProduto', 'ncmCodigo', 'simulationMode'];
    setInputs(prev => ({
      ...prev,
      [field]: textFields.includes(field) 
        ? value 
        : (typeof value === 'string' ? parseFloat(value.replace(',', '.')) || 0 : value),
    }));
  };

  return (
    <div className="space-y-6">
      {/* Regime Selector */}
      <section className="space-y-3">
        <SidebarHeader 
          label="Regime de Operação" 
          isCollapsed={collapsed.includes('regime')} 
          onToggle={() => toggleCollapse('regime')} 
        />
        {!collapsed.includes('regime') && (
          <div className="grid grid-cols-1 gap-2 animate-slide-up">
            {[
              { id: 'substituido', label: 'Substituição (ST)', sub: 'Saída Desonerada' },
              { id: 'tributado', label: 'Tributado', sub: 'Débito e Crédito' },
              { id: 'reduzido', label: 'Base Reduzida', sub: 'Benefício Fiscal' },
            ].map(mode => (
              <button
                key={mode.id}
                onClick={() => handleChange('mode', mode.id)}
                className={`text-left p-4 rounded-xl border transition-all flex flex-col gap-0.5 ${
                  inputs.mode === mode.id 
                  ? 'bg-black border-black text-white shadow-xl shadow-black/10' 
                  : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'
                }`}
              >
                <span className="text-[11px] font-black uppercase tracking-tight">{mode.label}</span>
                <span className={`text-[8px] font-bold uppercase opacity-50 ${inputs.mode === mode.id ? 'text-white' : 'text-slate-400'}`}>{mode.sub}</span>
              </button>
            ))}
          </div>
        )}
      </section>

      {/* Costs Inputs */}
      <section className="space-y-3">
        <SidebarHeader 
          label="Valores de Aquisição" 
          isCollapsed={collapsed.includes('costs')} 
          onToggle={() => toggleCollapse('costs')} 
        />
        {!collapsed.includes('costs') && (
          <div className="grid grid-cols-1 gap-3 animate-slide-up">
            <InputGroup label="Valor Líquido (R$)" value={inputs.valorCompra} onChange={(v: string) => handleChange('valorCompra', v)} />
            <div className="grid grid-cols-2 gap-3">
              <InputGroup label="IPI (%)" value={inputs.ipiPerc} onChange={(v: string) => handleChange('ipiPerc', v)} />
              <InputGroup label="Frete (R$)" value={inputs.freteValor} onChange={(v: string) => handleChange('freteValor', v)} />
            </div>
            
            <div className="p-4 bg-blue-50/50 rounded-xl border border-blue-100 space-y-3">
              <span className="text-[8px] font-black text-blue-400 uppercase tracking-widest block">Créditos de Entrada (Fixos)</span>
              <div className="grid grid-cols-2 gap-3">
                <InputGroup label="ICMS Merc (%)" value={inputs.icmsCreditoMercadoria} onChange={(v: string) => handleChange('icmsCreditoMercadoria', v)} />
                <InputGroup label="ICMS Frete (%)" value={inputs.icmsCreditoFrete} onChange={(v: string) => handleChange('icmsCreditoFrete', v)} />
              </div>
              <InputGroup label="PIS/COFINS Créd (%)" value={inputs.pisCofinsRate} onChange={(v: string) => handleChange('pisCofinsRate', v)} />
            </div>
          </div>
        )}
      </section>

      {/* Operating Expenses */}
      <section className="space-y-3">
        <SidebarHeader 
          label="Despesas Operacionais" 
          isCollapsed={collapsed.includes('expenses')} 
          onToggle={() => toggleCollapse('expenses')} 
        />
        {!collapsed.includes('expenses') && (
          <div className="grid grid-cols-1 gap-3 animate-slide-up">
            <InputGroup label="Comissão (%)" value={inputs.comissaoVenda} onChange={(v: string) => handleChange('comissaoVenda', v)} />
            
            <div className={`rounded-xl p-4 shadow-inner relative group overflow-hidden border-2 transition-all ${isAutoSync ? 'bg-blue-50/50 border-dashed border-blue-100' : 'bg-white border-slate-200 border-solid shadow-sm'}`}>
              <div className="flex justify-between items-center mb-2">
                <label className={`block text-[8px] font-black uppercase tracking-widest ${isAutoSync ? 'text-blue-500' : 'text-slate-400'}`}>Overhead / Fixo (%)</label>
                
                <div className="flex bg-slate-200/50 p-0.5 rounded-lg">
                  <button 
                    onClick={() => setIsAutoSync(false)}
                    className={`px-2 py-1 rounded-md text-[7px] font-black uppercase transition-all ${!isAutoSync ? 'bg-white text-black shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                  >
                    M
                  </button>
                  <button 
                    onClick={() => setIsAutoSync(true)}
                    className={`px-2 py-1 rounded-md text-[7px] font-black uppercase transition-all ${isAutoSync ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                  >
                    A
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input 
                  type="number" 
                  readOnly={isAutoSync}
                  value={inputs.custosFixos} 
                  onChange={(e) => handleChange('custosFixos', e.target.value)}
                  className={`w-full text-lg font-black font-mono bg-transparent outline-none transition-all ${isAutoSync ? 'text-blue-600 cursor-default' : 'text-slate-900 cursor-text'}`} 
                />
                <span className={`text-[10px] font-black ${isAutoSync ? 'text-blue-300' : 'text-slate-300'}`}>%</span>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Margem Final */}
      <section className="bg-black rounded-2xl p-6 text-white shadow-2xl shadow-black/20 ring-1 ring-white/10 space-y-4">
        <div className="flex justify-between items-center">
          <label className="text-[9px] font-black uppercase tracking-widest text-white/40">Margem Líquida Alvo</label>
          <span className="text-[8px] font-black text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded uppercase">Meta</span>
        </div>
        <div className="flex items-center gap-4">
          <input 
            type="number" 
            value={inputs.resultadoDesejado} 
            onChange={(e) => handleChange('resultadoDesejado', e.target.value)}
            className="w-full bg-transparent text-5xl font-black font-mono outline-none border-none p-0 tracking-tighter" 
          />
          <div className="flex flex-col gap-1 shrink-0">
             <button onClick={() => handleChange('resultadoDesejado', inputs.resultadoDesejado + 0.5)} className="p-2 bg-white/10 rounded-lg hover:bg-white/20 transition-all"><svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M7 14l5-5 5 5z"/></svg></button>
             <button onClick={() => handleChange('resultadoDesejado', Math.max(0, inputs.resultadoDesejado - 0.5))} className="p-2 bg-white/10 rounded-lg hover:bg-white/20 transition-all"><svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M7 10l5 5 5-5z"/></svg></button>
          </div>
        </div>
      </section>
    </div>
  );
};

const SidebarHeader = ({ label, isCollapsed, onToggle }: any) => (
  <button 
    onClick={onToggle}
    className="w-full flex items-center justify-between text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1 hover:text-slate-600 transition-colors group"
  >
    {label}
    <div className={`w-6 h-6 rounded-lg flex items-center justify-center transition-all ${isCollapsed ? 'bg-slate-100' : 'bg-black text-white'}`}>
      <svg className={`w-3 h-3 transition-transform ${isCollapsed ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7" />
      </svg>
    </div>
  </button>
);

const InputGroup = ({ label, value, onChange }: { label: string, value: number, onChange: (v: string) => void }) => (
  <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm focus-within:ring-2 focus-within:ring-black/5 focus-within:border-black transition-all group">
    <label className="block text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1 group-focus-within:text-black transition-colors">{label}</label>
    <input 
      type="number" 
      step="0.01"
      value={value} 
      onChange={(e) => onChange(e.target.value)}
      className="w-full text-lg font-black text-slate-800 font-mono outline-none" 
    />
  </div>
);

export default Sidebar;
