import React from 'react';
import { SimulationInputs } from '../types.ts';

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
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 h-full overflow-y-auto custom-scrollbar">
      <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
        <span className="text-blue-600">📦</span> Tipo de Produto
      </h2>

      <div className="grid grid-cols-1 gap-2 mb-8">
        {[
          { id: 'substituido', label: 'Produto Substituído (ST)' },
          { id: 'tributado', label: 'Produtos Tributados' },
          { id: 'reduzido', label: 'Produtos com Redução' },
        ].map(item => (
          <button
            key={item.id}
            onClick={() => handleModeChange(item.id as any)}
            className={`px-4 py-3 rounded-lg border text-sm font-bold transition-all text-left ${
              inputs.mode === item.id
                ? 'bg-blue-600 border-blue-600 text-white shadow-md'
                : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="mb-8">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 border-b pb-2">1. Dados da Compra</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Valor Mercadoria (R$)</label>
            <input
              type="number"
              value={inputs.valorCompra}
              onChange={(e) => handleChange('valorCompra', e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">IPI + Frete (R$)</label>
            <input
              type="number"
              value={inputs.ipiFrete}
              onChange={(e) => handleChange('ipiFrete', e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
        </div>
      </div>

      <div className="mb-8">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 border-b pb-2">2. Parâmetros Entrada</h3>
        <div className="space-y-4">
          {inputs.mode === 'substituido' && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">MVA (%)</label>
              <input
                type="number"
                step="0.01"
                value={inputs.mva}
                onChange={(e) => handleChange('mva', e.target.value)}
                className="w-full px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          )}
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">ICMS Orig. (%)</label>
              <input
                type="number"
                step="0.01"
                value={inputs.icmsInterestadual}
                onChange={(e) => handleChange('icmsInterestadual', e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">PIS/COF Créd. (%)</label>
              <input
                type="number"
                step="0.01"
                value={inputs.pisCofinsRate}
                onChange={(e) => handleChange('pisCofinsRate', e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg outline-none"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="mb-8">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 border-b pb-2">3. Configuração de Venda</h3>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1 uppercase">ICMS Venda (%)</label>
              <input
                type="number"
                step="0.01"
                value={inputs.icmsVenda}
                onChange={(e) => handleChange('icmsVenda', e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg outline-none"
              />
            </div>
            {inputs.mode === 'reduzido' && (
              <div>
                <label className="block text-xs font-medium text-orange-600 mb-1 uppercase font-bold">Redução Base (%)</label>
                <input
                  type="number"
                  step="0.01"
                  value={inputs.percReducaoBase}
                  onChange={(e) => handleChange('percReducaoBase', e.target.value)}
                  className="w-full px-3 py-2 bg-orange-50 border border-orange-200 rounded-lg outline-none font-bold"
                />
              </div>
            )}
          </div>
          
          <div className="grid grid-cols-2 gap-4">
             <div>
                <label className="block text-xs font-medium text-slate-700 mb-1 uppercase">Comissão (%)</label>
                <input
                  type="number"
                  step="0.01"
                  value={inputs.comissaoVenda}
                  onChange={(e) => handleChange('comissaoVenda', e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1 uppercase">PIS/COF Saída (%)</label>
                <input
                  type="number"
                  step="0.01"
                  value={inputs.pisCofinsVenda}
                  onChange={(e) => handleChange('pisCofinsVenda', e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg outline-none"
                />
              </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1 uppercase">Custos Fixos (%)</label>
            <input
              type="number"
              step="0.01"
              value={inputs.custosFixos}
              onChange={(e) => handleChange('custosFixos', e.target.value)}
              className="w-full px-3 py-2 bg-gray-100 border border-slate-300 rounded-lg outline-none font-semibold"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-indigo-700 mb-1 uppercase font-bold">Resul. Antes I.R. e CSLL (%)</label>
            <input
              type="number"
              step="0.01"
              value={inputs.resultadoDesejado}
              onChange={(e) => handleChange('resultadoDesejado', e.target.value)}
              className="w-full px-3 py-2 bg-indigo-50 border border-indigo-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-indigo-900"
            />
          </div>
        </div>
      </div>

      <div className="mb-4">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 border-b pb-2">4. Matriz de Categorias</h3>
        <div className="grid grid-cols-1 gap-2">
          {productCategories.map((type) => (
            <button
              key={type.key}
              onClick={() => handleCategorySelect(type)}
              className={`text-left px-4 py-3 rounded-lg border transition-all flex justify-between items-center group ${
                inputs.tipoProduto === type.key
                  ? 'bg-indigo-600 border-indigo-600 text-white shadow-md'
                  : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-indigo-400 hover:bg-indigo-50'
              }`}
            >
              <span className="font-semibold text-sm">{type.label}</span>
              <span className={`text-xs font-bold px-2 py-1 rounded-md ${
                inputs.tipoProduto === type.key ? 'bg-indigo-500 text-white' : 'bg-slate-200 text-slate-500 group-hover:bg-indigo-100 group-hover:text-indigo-600'
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