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
    { label: 'Produtos técnicos', value: 15, key: 'prodTec' },
  ];

  const handleCategorySelect = (type: typeof productCategories[0]) => {
    setInputs((prev) => ({
      ...prev,
      tipoProduto: type.key,
      resultadoDesejado: type.value,
    }));
  };

  return (
    <div className="space-y-8">
      {/* Seletor de Regime */}
      <div>
        <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
          <span className="h-px w-4 bg-slate-300"></span> 0. Regime Tributável
        </h2>
        <div className="grid grid-cols-1 gap-2">
          {[
            { id: 'substituido', label: 'Substituição Tributária (ST)' },
            { id: 'tributado', label: 'Tributável' },
            { id: 'reduzido', label: 'Redução' },
          ].map(item => (
            <button
              key={item.id}
              onClick={() => handleModeChange(item.id as any)}
              className={`px-4 py-3 rounded-xl border text-xs font-bold transition-all text-left ${
                inputs.mode === item.id
                  ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-500/20'
                  : 'bg-white border-slate-200 text-slate-600 hover:border-blue-300 hover:bg-blue-50/30'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
          <span className="h-px w-4 bg-slate-300"></span> 1. Dados da Compra
        </h3>
        <div className="space-y-4">
          <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm">
            <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase tracking-tight">Valor Mercadoria (R$)</label>
            <input
              type="number"
              value={inputs.valorCompra}
              onChange={(e) => handleChange('valorCompra', e.target.value)}
              className="w-full text-lg font-black text-slate-800 bg-transparent outline-none focus:text-blue-600 transition-colors"
            />
          </div>
          <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm">
            <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase tracking-tight">IPI + Frete (R$)</label>
            <input
              type="number"
              value={inputs.ipiFrete}
              onChange={(e) => handleChange('ipiFrete', e.target.value)}
              className="w-full text-lg font-black text-slate-800 bg-transparent outline-none focus:text-blue-600 transition-colors"
            />
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
          <span className="h-px w-4 bg-slate-300"></span> 2. Parâmetros Entrada
        </h3>
        <div className="space-y-4">
          {inputs.mode === 'substituido' && (
            <div className="bg-blue-50 p-3 rounded-xl border border-blue-100 shadow-sm">
              <label className="block text-[10px] font-bold text-blue-600 mb-1 uppercase tracking-tight">MVA Final (%)</label>
              <input
                type="number"
                step="0.01"
                value={inputs.mva}
                onChange={(e) => handleChange('mva', e.target.value)}
                className="w-full text-lg font-black text-blue-800 bg-transparent outline-none"
              />
            </div>
          )}
          
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm">
              <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase tracking-tight">ICMS Int. (%)</label>
              <input
                type="number"
                step="0.01"
                value={inputs.icmsInterestadual}
                onChange={(e) => handleChange('icmsInterestadual', e.target.value)}
                className="w-full font-bold text-slate-800 bg-transparent outline-none"
              />
            </div>
            <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm">
              <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase tracking-tight">PIS/COF (%)</label>
              <input
                type="number"
                step="0.01"
                value={inputs.pisCofinsRate}
                onChange={(e) => handleChange('pisCofinsRate', e.target.value)}
                className="w-full font-bold text-slate-800 bg-transparent outline-none"
              />
            </div>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
          <span className="h-px w-4 bg-slate-300"></span> 3. Parâmetros Venda
        </h3>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm">
              <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase tracking-tight">ICMS Venda (%)</label>
              <input
                type="number"
                step="0.01"
                value={inputs.icmsVenda}
                onChange={(e) => handleChange('icmsVenda', e.target.value)}
                className="w-full font-bold text-slate-800 bg-transparent outline-none"
              />
            </div>
            {inputs.mode === 'reduzido' && (
              <div className="bg-orange-50 p-3 rounded-xl border border-orange-100 shadow-sm">
                <label className="block text-[10px] font-black text-orange-600 mb-1 uppercase tracking-tight">Redução (%)</label>
                <input
                  type="number"
                  step="0.01"
                  value={inputs.percReducaoBase}
                  onChange={(e) => handleChange('percReducaoBase', e.target.value)}
                  className="w-full font-black text-orange-800 bg-transparent outline-none"
                />
              </div>
            )}
          </div>
          
          <div className="grid grid-cols-2 gap-4">
             <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm">
                <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase tracking-tight">Comissão (%)</label>
                <input
                  type="number"
                  step="0.01"
                  value={inputs.comissaoVenda}
                  onChange={(e) => handleChange('comissaoVenda', e.target.value)}
                  className="w-full font-bold text-slate-800 bg-transparent outline-none"
                />
              </div>
              <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm">
                <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase tracking-tight">Custos Fixos (%)</label>
                <input
                  type="number"
                  step="0.01"
                  value={inputs.custosFixos}
                  onChange={(e) => handleChange('custosFixos', e.target.value)}
                  className="w-full font-bold text-slate-800 bg-transparent outline-none"
                />
              </div>
          </div>

          <div className="bg-indigo-50 p-3 rounded-xl border border-indigo-100 shadow-md">
            <label className="block text-[10px] font-black text-indigo-700 mb-1 uppercase tracking-widest flex justify-between">
              <span>Resultado Alvo (%)</span>
              <span className="text-indigo-400">Net Margin</span>
            </label>
            <input
              type="number"
              step="0.01"
              value={inputs.resultadoDesejado}
              onChange={(e) => handleChange('resultadoDesejado', e.target.value)}
              className="w-full text-xl font-black text-indigo-900 bg-transparent outline-none"
            />
          </div>
        </div>
      </div>

      <div className="pb-8">
        <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
          <span className="h-px w-4 bg-slate-300"></span> 4. Matriz de Categorias
        </h3>
        <div className="grid grid-cols-1 gap-1.5">
          {productCategories.map((type) => (
            <button
              key={type.key}
              onClick={() => handleCategorySelect(type)}
              className={`text-left px-4 py-3 rounded-xl border transition-all flex justify-between items-center group ${
                inputs.tipoProduto === type.key
                  ? 'bg-slate-800 border-slate-800 text-white shadow-lg'
                  : 'bg-white border-slate-200 text-slate-700 hover:border-slate-400'
              }`}
            >
              <span className="font-bold text-[11px] uppercase tracking-tight">{type.label}</span>
              <span className={`text-[10px] font-black px-2 py-0.5 rounded-md ${
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