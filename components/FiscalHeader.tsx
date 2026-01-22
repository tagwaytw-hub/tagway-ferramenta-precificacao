
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

      const internalRate = destUf?.icms || 18;
      const effectivePurchaseRate = isInternal ? internalRate : interstateRate;

      // Só atualiza MVA se o modo automático estiver ligado
      let newMva = prev.mva;
      if (prev.isMvaAuto) {
        const rawAdjMva = calculateAdjustedMva(prev.mvaOriginal, effectivePurchaseRate, internalRate);
        newMva = Math.floor(rawAdjMva * 100) / 100;
      }

      return {
        ...prev,
        [field]: val,
        icmsInterestadual: effectivePurchaseRate,
        icmsInternoDestino: internalRate,
        icmsCreditoMercadoria: effectivePurchaseRate,
        icmsCreditoFrete: effectivePurchaseRate,
        icmsVenda: internalRate,
        mva: newMva
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
      mva: prev.isMvaAuto ? adjMva : prev.mva,
      nomeProduto: ncm.descricao // Preenche inicialmente, mas permanece editável
    }));
    setShowNcmSearch(false);
    setSearchTerm('');
  };

  const toggleMvaMode = (auto: boolean) => {
    setInputs(prev => {
      let currentMva = prev.mva;
      if (auto) {
        // Se voltar para auto, recalcula
        const rawAdjMva = calculateAdjustedMva(prev.mvaOriginal, prev.icmsCreditoMercadoria, prev.icmsInternoDestino);
        currentMva = Math.floor(rawAdjMva * 100) / 100;
      }
      return { ...prev, isMvaAuto: auto, mva: currentMva };
    });
  };

  const filteredNcm = NCM_DATABASE.filter(n => 
    n.codigo.includes(searchTerm) || n.descricao.toLowerCase().includes(searchTerm.toLowerCase())
  ).slice(0, 8);

  const isInternal = inputs.ufOrigem === inputs.ufDestino;
  const purchaseLabel = isInternal ? "Operação Interna" : "Inter (Compra)";
  const purchaseRate = inputs.icmsCreditoMercadoria;

  return (
    <div className="bg-black rounded-[1.2rem] lg:rounded-[1.5rem] p-4 lg:p-6 text-white space-y-4 lg:space-y-6 shadow-2xl relative overflow-visible ring-1 ring-white/10">
      
      {/* Produto - Editável Livremente */}
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

      {/* MVA Control Grid */}
      <div className="grid grid-cols-2 gap-3 lg:gap-4 pt-1">
         <div className="bg-white/5 p-2 lg:p-3 rounded-xl border border-white/5 text-center">
            <p className="text-[7px] lg:text-[8px] font-black text-white/30 uppercase mb-1">{purchaseLabel}</p>
            <p className="text-xs lg:text-sm font-black text-white font-mono">{purchaseRate.toFixed(1)}%</p>
         </div>

         {/* Controle Inteligente de MVA */}
         <div className={`bg-white/5 p-2 lg:p-3 rounded-xl border border-white/5 relative group transition-all ${inputs.mode === 'tributado' ? 'opacity-20 pointer-events-none' : 'opacity-100'}`}>
            <div className="flex justify-between items-center mb-1">
              <p className="text-[7px] lg:text-[8px] font-black text-white/30 uppercase tracking-tighter">MVA Ajustada</p>
              <div className="flex items-center gap-1">
                <button 
                  onClick={() => toggleMvaMode(true)}
                  className={`text-[6px] font-black px-1 rounded uppercase transition-all ${inputs.isMvaAuto ? 'bg-indigo-500 text-white' : 'bg-white/10 text-white/40'}`}
                >AUTO</button>
                <button 
                  onClick={() => toggleMvaMode(false)}
                  className={`text-[6px] font-black px-1 rounded uppercase transition-all ${!inputs.isMvaAuto ? 'bg-amber-500 text-white' : 'bg-white/10 text-white/40'}`}
                >MANUAL</button>
              </div>
            </div>
            
            <div className="flex items-center gap-1 justify-center">
              <input 
                type="number" 
                step="0.01"
                disabled={inputs.isMvaAuto}
                value={inputs.mva === 0 && !inputs.isMvaAuto ? '' : inputs.mva}
                onChange={(e) => setInputs(prev => ({...prev, mva: parseFloat(e.target.value) || 0}))}
                className={`w-full bg-transparent text-xs lg:text-sm font-black font-mono text-center outline-none ${inputs.isMvaAuto ? 'text-white' : 'text-amber-400'}`}
              />
              <span className="text-[10px] font-black text-white/20">%</span>
            </div>
         </div>
      </div>
    </div>
  );
};

export default FiscalHeader;
