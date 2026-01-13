
import React, { useState, useEffect, useRef } from 'react';
import { SimulationInputs } from '../types';
import { NCM_DATABASE, UF_LIST } from '../utils/ncmData';
import { calculateAdjustedMva, getInterstateRate } from '../utils/calculations';

interface FiscalHeaderProps {
  inputs: SimulationInputs;
  setInputs: React.Dispatch<React.SetStateAction<SimulationInputs>>;
}

const FiscalHeader: React.FC<FiscalHeaderProps> = ({ inputs, setInputs }) => {
  const [showNcmSearch, setShowNcmSearch] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowNcmSearch(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleUfChange = (field: 'ufOrigem' | 'ufDestino', val: string) => {
    setInputs(prev => {
      const newOrigem = field === 'ufOrigem' ? val : prev.ufOrigem;
      const newDestino = field === 'ufDestino' ? val : prev.ufDestino;
      
      const destUf = UF_LIST.find(u => u.sigla === newDestino);
      const interstateRate = getInterstateRate(newOrigem, newDestino);
      const isInternal = newOrigem === newDestino;

      // Se for interna, a alíquota de crédito (compra) é a alíquota interna do estado
      const internalRate = destUf?.icms || 18;
      const effectivePurchaseRate = isInternal ? internalRate : interstateRate;

      // Calcula MVA Ajustada (em operações internas o ajuste resulta na MVA original)
      const rawAdjMva = calculateAdjustedMva(prev.mvaOriginal, effectivePurchaseRate, internalRate);
      const adjMva = Math.floor(rawAdjMva * 100) / 100;

      return {
        ...prev,
        [field]: val,
        icmsInterestadual: effectivePurchaseRate,
        icmsInternoDestino: internalRate,
        icmsCreditoMercadoria: effectivePurchaseRate,
        icmsCreditoFrete: effectivePurchaseRate,
        icmsVenda: internalRate,
        mva: adjMva
      };
    });
  };

  const selectNcm = (ncm: any) => {
    const destUf = UF_LIST.find(u => u.sigla === inputs.ufDestino);
    const interstateRate = getInterstateRate(inputs.ufOrigem, inputs.ufDestino);
    const isInternal = inputs.ufOrigem === inputs.ufDestino;
    const internalRate = destUf?.icms || 18;
    const effectivePurchaseRate = isInternal ? internalRate : interstateRate;

    const rawAdjMva = calculateAdjustedMva(ncm.mvaOriginal, effectivePurchaseRate, internalRate);
    const adjMva = Math.floor(rawAdjMva * 100) / 100;
    
    setInputs(prev => ({
      ...prev,
      ncmCodigo: ncm.codigo,
      mvaOriginal: ncm.mvaOriginal,
      mva: adjMva,
      nomeProduto: ncm.descricao
    }));
    setShowNcmSearch(false);
    setSearchTerm('');
  };

  const filteredNcm = NCM_DATABASE.filter(n => 
    n.codigo.includes(searchTerm) || n.descricao.toLowerCase().includes(searchTerm.toLowerCase())
  ).slice(0, 8);

  const isInternal = inputs.ufOrigem === inputs.ufDestino;
  const purchaseLabel = isInternal ? "Operação Interna" : "Inter (Compra)";
  const purchaseRate = inputs.icmsCreditoMercadoria;

  return (
    <div className="bg-black rounded-[1.2rem] lg:rounded-[1.5rem] p-4 lg:p-6 text-white space-y-4 lg:space-y-6 shadow-2xl relative overflow-visible ring-1 ring-white/10">
      
      {/* Produto */}
      <div className="space-y-1.5">
        <label className="text-[8px] lg:text-[9px] font-black text-white/40 uppercase tracking-[0.2em] ml-1">Produto / Referência</label>
        <input 
          type="text" 
          value={inputs.nomeProduto}
          onChange={(e) => setInputs(prev => ({...prev, nomeProduto: e.target.value}))}
          placeholder="Ex: Porcelanato 80x80"
          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 lg:py-3 text-xs lg:text-sm font-bold focus:border-white/40 outline-none transition-all placeholder:text-white/10"
        />
      </div>

      {/* Rota Fiscal */}
      <div className="grid grid-cols-2 gap-3 lg:gap-4">
        <div className="space-y-1.5">
          <label className="text-[8px] lg:text-[9px] font-black text-white/40 uppercase tracking-widest ml-1">Compra de (UF)</label>
          <div className="relative">
            <select 
              value={inputs.ufOrigem} 
              onChange={(e) => handleUfChange('ufOrigem', e.target.value)}
              className="w-full bg-slate-800 border border-white/10 rounded-xl px-3 py-2.5 lg:py-3 text-[10px] lg:text-xs font-black outline-none cursor-pointer focus:border-white/20 transition-all text-white"
            >
              {UF_LIST.map(uf => <option key={uf.sigla} value={uf.sigla}>{uf.sigla} - {uf.nome}</option>)}
            </select>
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-[8px] lg:text-[9px] font-black text-white/40 uppercase tracking-widest ml-1">Sua Sede (UF)</label>
          <div className="relative">
            <select 
              value={inputs.ufDestino}
              onChange={(e) => handleUfChange('ufDestino', e.target.value)}
              className="w-full bg-slate-800 border border-white/10 rounded-xl px-3 py-2.5 lg:py-3 text-[10px] lg:text-xs font-black outline-none cursor-pointer focus:border-white/20 transition-all text-white"
            >
              {UF_LIST.map(uf => <option key={uf.sigla} value={uf.sigla}>{uf.sigla} - {uf.nome}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Busca NCM */}
      <div className="space-y-1.5 relative" ref={searchRef}>
        <label className="text-[8px] lg:text-[9px] font-black text-white/40 uppercase tracking-widest ml-1">Inteligência NCM</label>
        <div 
          onClick={() => setShowNcmSearch(true)}
          className={`flex items-center bg-white/5 border ${showNcmSearch ? 'border-white/40' : 'border-white/10'} rounded-xl px-4 py-2.5 lg:py-3 cursor-text transition-all`}
        >
          <input 
            type="text" placeholder="Buscar NCM..."
            value={showNcmSearch ? searchTerm : `${inputs.ncmCodigo}`}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-transparent text-xs lg:text-sm font-black text-white outline-none placeholder:text-white/10"
          />
        </div>

        {showNcmSearch && (
          <div className="absolute top-[calc(100%+10px)] left-0 w-full bg-[#111] border border-white/10 rounded-xl shadow-2xl z-[1000] overflow-hidden max-h-60 overflow-y-auto custom-scrollbar">
            {filteredNcm.map(ncm => (
              <button 
                key={ncm.codigo} onClick={() => selectNcm(ncm)}
                className="w-full text-left p-4 hover:bg-white/5 transition-all flex flex-col border-b border-white/5 btn-touch"
              >
                <span className="text-[10px] font-black text-white font-mono">{ncm.codigo}</span>
                <span className="text-[10px] text-white/40 truncate">{ncm.descricao}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Quick Summary Grid */}
      <div className="grid grid-cols-2 gap-3 lg:gap-4 pt-1">
         <div className="bg-white/5 p-2 lg:p-3 rounded-xl border border-white/5 text-center">
            <p className="text-[7px] lg:text-[8px] font-black text-white/30 uppercase mb-1">{purchaseLabel}</p>
            <p className="text-xs lg:text-sm font-black text-white font-mono">{purchaseRate.toFixed(1)}%</p>
         </div>
         <div className={`bg-white/5 p-2 lg:p-3 rounded-xl border border-white/5 text-center transition-opacity ${inputs.mode === 'tributado' ? 'opacity-20' : 'opacity-100'}`}>
            <p className="text-[7px] lg:text-[8px] font-black text-white/30 uppercase mb-1">MVA Ajustada</p>
            <p className="text-xs lg:text-sm font-black text-amber-400 font-mono">
              {inputs.mode === 'tributado' ? '0.00' : inputs.mva.toFixed(2)}%
            </p>
         </div>
      </div>
    </div>
  );
};

export default FiscalHeader;
