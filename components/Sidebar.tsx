
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
    <div className="space-y-10">
      {/* Regime Switcher */}
      <section className="space-y-3">
        <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.25em]">Regime de Operação</label>
        <div className="grid grid-cols-1 gap-2">
          {[
            { id: 'substituido', label: 'ST (Retenção)', sub: 'Saída Isenta' },
            { id: 'tributado', label: 'Tributação Integral', sub: 'Débito/Crédito' },
            { id: 'reduzido', label: 'Base Reduzida', sub: 'Incentivo Fiscal' },
          ].map(mode => (
            <button
              key={mode.id}
              onClick={() => handleChange('mode', mode.id)}
              className={`text-left p-4 rounded-2xl border transition-all flex flex-col gap-0.5 ${
                inputs.mode === mode.id 
                ? 'bg-blue-600 border-blue-600 text-white shadow-xl shadow-blue-600/20' 
                : 'bg-slate-50 border-slate-200 text-slate-500 hover:border-slate-300'
              }`}
            >
              <span className="text-[11px] font-black uppercase tracking-tight">{mode.label}</span>
              <span className={`text-[9px] font-bold uppercase opacity-50 ${inputs.mode === mode.id ? 'text-white' : 'text-slate-400'}`}>{mode.sub}</span>
            </button>
          ))}
        </div>
      </section>

      {/* Parâmetros de Custo de Entrada */}
      <section className="space-y-4">
        <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.25em]">Parâmetros de Custo</label>
        <div className="space-y-4">
          <InputGroup label="Compra Líquida (R$)" value={inputs.valorCompra} onChange={(v: string) => handleChange('valorCompra', v)} />
          <InputGroup label="IPI + Frete (R$)" value={inputs.ipiFrete} onChange={(v: string) => handleChange('ipiFrete', v)} />
        </div>
      </section>

      {/* Custo Operacional & Vendas - CAMPOS SOLICITADOS VISÍVEIS */}
      <section className="space-y-4">
        <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.25em]">Custos Operacionais & Vendas</label>
        <div className="space-y-4">
          <InputGroup label="Comissão de Venda (%)" value={inputs.comissaoVenda} onChange={(v: string) => handleChange('comissaoVenda', v)} />
          <InputGroup label="Custos Fixos / Overhead (%)" value={inputs.custosFixos} onChange={(v: string) => handleChange('custosFixos', v)} />
        </div>
      </section>

      {/* Margem Desejada */}
      <section className="bg-slate-900 rounded-[2rem] p-6 text-white shadow-2xl space-y-4 ring-1 ring-slate-800">
        <div className="flex justify-between items-center">
          <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">Net Margin Alvo</label>
          <div className="bg-blue-500 text-white text-[9px] font-black px-2 py-0.5 rounded uppercase">Meta</div>
        </div>
        <div className="flex items-center gap-4">
          <input 
            type="number" 
            value={inputs.resultadoDesejado} 
            onChange={(e) => handleChange('resultadoDesejado', e.target.value)}
            className="w-full bg-transparent text-5xl font-black font-mono outline-none border-none p-0 tracking-tighter" 
          />
          <div className="flex flex-col gap-1.5">
             <button onClick={() => handleChange('resultadoDesejado', inputs.resultadoDesejado + 0.5)} className="p-2 bg-slate-800 rounded-lg hover:bg-blue-600 transition-colors"><svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M7 14l5-5 5 5z"/></svg></button>
             <button onClick={() => handleChange('resultadoDesejado', Math.max(0, inputs.resultadoDesejado - 0.5))} className="p-2 bg-slate-800 rounded-lg hover:bg-blue-600 transition-colors"><svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M7 10l5 5 5-5z"/></svg></button>
          </div>
        </div>
      </section>
    </div>
  );
};

const InputGroup = ({ label, value, onChange }: { label: string, value: number, onChange: (v: string) => void }) => (
  <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm focus-within:ring-2 focus-within:ring-blue-500/20 transition-all group">
    <label className="block text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1 group-focus-within:text-blue-500 transition-colors">{label}</label>
    <input 
      type="number" 
      step="0.01"
      value={value} 
      onChange={(e) => onChange(e.target.value)}
      className="w-full text-xl font-black text-slate-800 font-mono outline-none" 
    />
  </div>
);

export default Sidebar;
