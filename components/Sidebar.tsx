import React from 'react';
import { SimulationInputs } from '../types';

interface SidebarProps {
  inputs: SimulationInputs;
  setInputs: React.Dispatch<React.SetStateAction<SimulationInputs>>;
}

const Sidebar: React.FC<SidebarProps> = ({ inputs, setInputs }) => {
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
    <div className="space-y-8">
      {/* Regime Selector */}
      <section className="space-y-3">
        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Regime de Operação</label>
        <div className="grid grid-cols-1 gap-2">
          {[
            { id: 'substituido', label: 'Substituição (ST)', sub: 'Saída Desonerada' },
            { id: 'tributado', label: 'Débito/Crédito', sub: 'Tributação Integral' },
            { id: 'reduzido', label: 'Base Reduzida', sub: 'Benefício Fiscal' },
          ].map(mode => (
            <button
              key={mode.id}
              onClick={() => handleChange('mode', mode.id)}
              className={`text-left p-4 rounded-xl border transition-all flex flex-col gap-0.5 ${
                inputs.mode === mode.id 
                ? 'bg-black border-black text-white shadow-xl shadow-black/10' 
                : 'bg-slate-50 border-slate-200 text-slate-500 hover:border-slate-300'
              }`}
            >
              <span className="text-[11px] font-black uppercase tracking-tight">{mode.label}</span>
              <span className={`text-[8px] font-bold uppercase opacity-50 ${inputs.mode === mode.id ? 'text-white' : 'text-slate-400'}`}>{mode.sub}</span>
            </button>
          ))}
        </div>
      </section>

      {/* Costs Inputs */}
      <section className="space-y-3">
        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Valores de Aquisição</label>
        <div className="grid grid-cols-1 gap-3">
          <InputGroup label="Compra (Líquida R$)" value={inputs.valorCompra} onChange={(v: string) => handleChange('valorCompra', v)} />
          <InputGroup label="Frete + IPI (R$)" value={inputs.ipiFrete} onChange={(v: string) => handleChange('ipiFrete', v)} />
        </div>
      </section>

      {/* Operating Expenses */}
      <section className="space-y-3">
        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Despesas de Venda</label>
        <div className="grid grid-cols-1 gap-3">
          <InputGroup label="Comissão (%)" value={inputs.comissaoVenda} onChange={(v: string) => handleChange('comissaoVenda', v)} />
          <InputGroup label="Fixos / Overhead (%)" value={inputs.custosFixos} onChange={(v: string) => handleChange('custosFixos', v)} />
        </div>
      </section>

      {/* Target Margin Slider/Input */}
      <section className="bg-black rounded-2xl p-6 text-white shadow-2xl shadow-black/20 ring-1 ring-white/10 space-y-4">
        <div className="flex justify-between items-center">
          <label className="text-[9px] font-black uppercase tracking-widest text-white/40">Target Net Margin</label>
          <span className="text-[8px] font-black text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded uppercase">Ideal</span>
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
