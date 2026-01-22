
import React, { useState } from 'react';
import { SimulationInputs } from '../types';

interface SidebarProps {
  inputs: SimulationInputs;
  setInputs: React.Dispatch<React.SetStateAction<SimulationInputs>>;
  isAutoSync: boolean;
  setIsAutoSync: (val: boolean) => void;
  isMobile?: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ inputs, setInputs, isAutoSync, setIsAutoSync, isMobile = false }) => {
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

  const getImpact = (val: number, threshold: number) => {
    if (val === 0) return null;
    if (val > threshold) return { label: 'ALTO IMPACTO', color: 'text-rose-500 bg-rose-50' };
    return { label: 'IMPACTO MÉDIO', color: 'text-amber-600 bg-amber-50' };
  };

  const isReverse = inputs.simulationMode === 'sellToBuy';

  const FinalValuesSection = (
    <section className={`${isReverse ? 'bg-indigo-900' : 'bg-slate-900'} rounded-[2rem] p-8 text-white shadow-2xl shadow-black/20 ring-1 ring-white/10 space-y-4 relative overflow-hidden transition-all duration-500 mb-6`}>
      <div className={`absolute top-0 right-0 w-24 h-24 ${isReverse ? 'bg-indigo-400/20' : 'bg-emerald-500/10'} blur-2xl rounded-full -mr-10 -mt-10`}></div>
      
      <div className="flex justify-between items-center relative z-10">
        <label className="text-[9px] font-black uppercase tracking-widest text-white/40">
          {isReverse ? 'Preço de Venda Fixo' : 'Margem de Lucro Alvo'}
        </label>
        <div className={`w-2 h-2 rounded-full ${isReverse ? 'bg-indigo-400' : 'bg-emerald-500'} animate-pulse`}></div>
      </div>

      <div className="flex items-center gap-4 relative z-10">
        {isReverse && <span className="text-2xl font-black text-indigo-300 italic">R$</span>}
        <input 
          type="number" 
          step="0.01"
          autoFocus={isMobile}
          value={isReverse ? inputs.precoVendaDesejado : inputs.resultadoDesejado} 
          onChange={(e) => handleChange(isReverse ? 'precoVendaDesejado' : 'resultadoDesejado', e.target.value)}
          className={`w-full bg-transparent ${isReverse ? 'text-4xl' : 'text-6xl'} font-black font-mono outline-none border-none p-0 tracking-tighter ${isReverse ? 'text-indigo-100' : 'text-emerald-400'}`} 
          placeholder="0.00"
        />
        {!isReverse && <span className="text-3xl font-black text-emerald-600/50">%</span>}
        
        <div className="flex flex-col gap-2 shrink-0">
           <button 
             onClick={() => {
               const field = isReverse ? 'precoVendaDesejado' : 'resultadoDesejado';
               const step = isReverse ? 10 : 1;
               handleChange(field, (isReverse ? inputs.precoVendaDesejado : inputs.resultadoDesejado) + step);
             }} 
             className="p-2.5 bg-white/5 rounded-xl hover:bg-white/10 transition-all border border-white/5"
           >
             <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 15l7-7 7 7"/></svg>
           </button>
           <button 
             onClick={() => {
               const field = isReverse ? 'precoVendaDesejado' : 'resultadoDesejado';
               const step = isReverse ? 10 : 1;
               handleChange(field, Math.max(0, (isReverse ? inputs.precoVendaDesejado : inputs.resultadoDesejado) - step));
             }} 
             className="p-2.5 bg-white/5 rounded-xl hover:bg-white/10 transition-all border border-white/5"
           >
             <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7"/></svg>
           </button>
        </div>
      </div>
      
      {isReverse && (
        <p className="text-[8px] font-black text-indigo-300/50 uppercase tracking-widest mt-2 animate-pulse">
          O sistema deduzirá impostos deste valor
        </p>
      )}
    </section>
  );

  return (
    <div className="space-y-6">
      {/* Simulation Mode Toggle */}
      <section className="bg-white border border-slate-200 rounded-[2rem] p-1.5 flex shadow-sm">
        <button 
          onClick={() => handleChange('simulationMode', 'buyToSell')}
          className={`flex-1 py-3 rounded-[1.5rem] text-[9px] font-black uppercase tracking-widest transition-all ${!isReverse ? 'bg-black text-white shadow-xl' : 'text-slate-400 hover:text-slate-600'}`}
        >
          Normal
        </button>
        <button 
          onClick={() => handleChange('simulationMode', 'sellToBuy')}
          className={`flex-1 py-3 rounded-[1.5rem] text-[9px] font-black uppercase tracking-widest transition-all ${isReverse ? 'bg-indigo-600 text-white shadow-xl' : 'text-slate-400 hover:text-slate-600'}`}
        >
          Reverso
        </button>
      </section>

      {/* Reorder: Priority Input at TOP for Mobile Pop-up */}
      {isMobile && FinalValuesSection}

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
            <InputGroup 
              label="Valor de Compra (R$)" 
              value={inputs.valorCompra} 
              onChange={(v: string) => handleChange('valorCompra', v)} 
              impact={getImpact(inputs.valorCompra, 5000)}
            />
            <div className="grid grid-cols-2 gap-3">
              <InputGroup label="IPI (%)" value={inputs.ipiPerc} onChange={(v: string) => handleChange('ipiPerc', v)} />
              <InputGroup label="Frete (R$)" value={inputs.freteValor} onChange={(v: string) => handleChange('freteValor', v)} impact={getImpact(inputs.freteValor, 500)} />
            </div>
            
            <div className="p-4 bg-blue-50/30 rounded-[1.5rem] border border-blue-100 space-y-4">
              <div className="flex items-center gap-2">
                 <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                 <span className="text-[8px] font-black text-blue-500 uppercase tracking-widest block">Créditos Tributários</span>
              </div>
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
            <InputGroup label="Comissão Venda (%)" value={inputs.comissaoVenda} onChange={(v: string) => handleChange('comissaoVenda', v)} />
            
            <div className={`rounded-[1.5rem] p-5 shadow-sm relative group overflow-hidden border-2 transition-all ${isAutoSync ? 'bg-indigo-50/50 border-indigo-200' : 'bg-white border-slate-100'}`}>
              <div className="flex justify-between items-center mb-3">
                <label className={`block text-[8px] font-black uppercase tracking-widest ${isAutoSync ? 'text-indigo-600' : 'text-slate-400'}`}>Overhead / Custos Fixos</label>
                
                <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200">
                  <button 
                    onClick={() => setIsAutoSync(false)}
                    className={`px-3 py-1 rounded-md text-[8px] font-black uppercase transition-all ${!isAutoSync ? 'bg-white text-black shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                  >
                    OFF
                  </button>
                  <button 
                    onClick={() => setIsAutoSync(true)}
                    className={`px-3 py-1 rounded-md text-[8px] font-black uppercase transition-all ${isAutoSync ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                  >
                    SYNC
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input 
                  type="number" 
                  step="0.01"
                  readOnly={isAutoSync}
                  value={inputs.custosFixos} 
                  onChange={(e) => handleChange('custosFixos', e.target.value)}
                  className={`w-full text-2xl font-black font-mono bg-transparent outline-none transition-all ${isAutoSync ? 'text-indigo-700 cursor-not-allowed' : 'text-slate-900'}`} 
                />
                <span className={`text-[12px] font-black ${isAutoSync ? 'text-indigo-400' : 'text-slate-300'}`}>%</span>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Desktop rendering: Final Values Section at BOTTOM */}
      {!isMobile && FinalValuesSection}
    </div>
  );
};

const SidebarHeader = ({ label, isCollapsed, onToggle }: any) => (
  <button 
    onClick={onToggle}
    className="w-full flex items-center justify-between text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 hover:text-slate-900 transition-colors group"
  >
    {label}
    <div className={`w-6 h-6 rounded-lg flex items-center justify-center transition-all ${isCollapsed ? 'bg-slate-100' : 'bg-slate-900 text-white'}`}>
      <svg className={`w-3.5 h-3.5 transition-transform duration-300 ${isCollapsed ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7" />
      </svg>
    </div>
  </button>
);

const InputGroup = ({ label, value, onChange, impact }: { label: string, value: number, onChange: (v: string) => void, impact?: any }) => (
  <div className="bg-white border border-slate-100 rounded-[1.5rem] p-5 shadow-sm focus-within:ring-4 focus-within:ring-slate-100 focus-within:border-slate-900 transition-all group relative">
    <div className="flex justify-between items-start mb-1">
      <label className="block text-[8px] font-black text-slate-400 uppercase tracking-widest group-focus-within:text-slate-900 transition-colors">{label}</label>
      {impact && (
        <span className={`text-[6px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-tighter ${impact.color}`}>
          {impact.label}
        </span>
      )}
    </div>
    <input 
      type="number" 
      step="0.01"
      value={value === 0 ? '' : value} 
      placeholder="0.00"
      onChange={(e) => onChange(e.target.value)}
      className="w-full text-xl font-black text-slate-900 font-mono outline-none placeholder:text-slate-100" 
    />
  </div>
);

export default Sidebar;
