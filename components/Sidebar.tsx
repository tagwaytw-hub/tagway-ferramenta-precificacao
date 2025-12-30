import React from 'react';
import { SimulationInputs } from '../types';

interface SidebarProps {
  inputs: SimulationInputs;
  setInputs: React.Dispatch<React.SetStateAction<SimulationInputs>>;
}

const Sidebar: React.FC<SidebarProps> = ({ inputs, setInputs }) => {
  
  const handleModeChange = (mode: SimulationInputs['mode']) => {
    setInputs(prev => ({ ...prev, mode }));
  };

  const handleChange = (field: keyof SimulationInputs, value: any) => {
    setInputs((prev) => ({
      ...prev,
      [field]: typeof value === 'string' ? parseFloat(value) || 0 : value,
    }));
  };

  const productCategories = [
    { label: 'Commodity', value: 8, key: 'comod' },
    { label: 'Curva A', value: 10, key: 'curvaA' },
    { label: 'Curva B', value: 11, key: 'curvaB' },
    { label: 'Curva C', value: 12, key: 'curvaC' },
    { label: 'Produtos Técnicos', value: 15, key: 'prodTec' },
  ];

  const handleCategorySelect = (type: typeof productCategories[0]) => {
    setInputs((prev) => ({
      ...prev,
      tipoProduto: type.key,
      resultadoDesejado: type.value,
    }));
  };

  return (
    <div className="space-y-6 md:space-y-8">
      {/* Seletor de Regime */}
      <div>
        <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
          <span className="h-px w-4 bg-slate-300"></span> Regime Tributário
        </h2>
        <div className="flex flex-col gap-2">
          {[
            { id: 'substituido', label: 'ST (Substituição Tributária)' },
            { id: 'tributado', label: 'Tributação Integral' },
            { id: 'reduzido', label: 'Redução de Base' },
          ].map(item => (
            <button
              key={item.id}
              onClick={() => handleModeChange(item.id as any)}
              className={`px-4 py-4 rounded-xl border text-[11px] font-black transition-all text-left shadow-sm active:scale-[0.98] ${
                inputs.mode === item.id
                  ? 'bg-blue-600 border-blue-600 text-white shadow-blue-500/20 shadow-lg'
                  : 'bg-white border-slate-200 text-slate-600'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
          <span className="h-px w-4 bg-slate-300"></span> Valores de Entrada
        </h3>
        <div className="grid grid-cols-1 gap-3">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
            <label className="block text-[9px] font-black text-slate-400 mb-1 uppercase tracking-tight">Valor da Mercadoria (R$)</label>
            <input
              type="number"
              inputMode="decimal"
              value={inputs.valorCompra}
              onChange={(e) => handleChange('valorCompra', e.target.value)}
              className="w-full text-xl font-black text-slate-800 bg-transparent outline-none"
            />
          </div>
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
            <label className="block text-[9px] font-black text-slate-400 mb-1 uppercase tracking-tight">IPI + Frete Estimado (R$)</label>
            <input
              type="number"
              inputMode="decimal"
              value={inputs.ipiFrete}
              onChange={(e) => handleChange('ipiFrete', e.target.value)}
              className="w-full text-xl font-black text-slate-800 bg-transparent outline-none"
            />
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
          <span className="h-px w-4 bg-slate-300"></span> Parâmetros de Venda
        </h3>
        <div className="space-y-4">
          <div className="bg-indigo-600 p-5 rounded-3xl shadow-xl shadow-indigo-500/30 border border-indigo-400/30">
            <label className="block text-[9px] font-black text-indigo-100 mb-1 uppercase tracking-widest flex justify-between items-center">
              <span>Resultado Alvo (%)</span>
              <span className="text-[8px] bg-indigo-500/50 px-2 py-0.5 rounded uppercase">Net Margin</span>
            </label>
            <input
              type="number"
              inputMode="decimal"
              step="0.01"
              value={inputs.resultadoDesejado}
              onChange={(e) => handleChange('resultadoDesejado', e.target.value)}
              className="w-full text-2xl font-black text-white bg-transparent outline-none"
            />
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
          <span className="h-px w-4 bg-slate-300"></span> Matriz de Margens
        </h3>
        <div className="grid grid-cols-1 gap-2">
          {productCategories.map((type) => (
            <button
              key={type.key}
              onClick={() => handleCategorySelect(type)}
              className={`text-left px-5 py-4 rounded-2xl border transition-all flex justify-between items-center active:scale-[0.98] ${
                inputs.tipoProduto === type.key
                  ? 'bg-slate-800 border-slate-800 text-white shadow-lg'
                  : 'bg-white border-slate-200 text-slate-700'
              }`}
            >
              <span className="font-black text-[11px] uppercase tracking-tight">{type.label}</span>
              <span className={`text-[10px] font-black px-2.5 py-1 rounded-lg ${
                inputs.tipoProduto === type.key ? 'bg-slate-700 text-white' : 'bg-slate-100 text-slate-500'
              }`}>
                {type.value}%
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Sidebar;