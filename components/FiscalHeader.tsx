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
    const newOrigem = field === 'ufOrigem' ? val : inputs.ufOrigem;
    const newDestino = field === 'ufDestino' ? val : inputs.ufDestino;
    const destUf = UF_LIST.find(u => u.sigla === newDestino);
    const interRate = getInterstateRate(newOrigem, newDestino);
    const adjMva = calculateAdjustedMva(inputs.mvaOriginal, interRate, destUf?.icms || 18);

    setInputs(prev => ({
      ...prev,
      [field]: val,
      icmsInterestadual: interRate,
      icmsInternoDestino: destUf?.icms || 18,
      mva: adjMva
    }));
  };

  const selectNcm = (ncm: any) => {
    const destUf = UF_LIST.find(u => u.sigla === inputs.ufDestino);
    const interRate = getInterstateRate(inputs.ufOrigem, inputs.ufDestino);
    const adjMva = calculateAdjustedMva(ncm.mvaOriginal, interRate, destUf?.icms || 18);
    
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

  return (
    <div className="bg-black rounded-[1.5rem] p-5 md:p-6 text-white space-y-6 shadow-2xl relative overflow-visible ring-1 ring-white/10">
      
      {/* Produto */}
      <div className="space-y-2">
        <label className="text-[9px] font-black text-white/40 uppercase tracking-[0.2em] ml-1">Produto / Referência</label>
        <input 
          type="text" 
          value={inputs.nomeProduto}
          onChange={(e) => setInputs(prev => ({...prev, nomeProduto: e.target.value}))}
          placeholder="Ex: Porcelanato 80x80"
          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm font-bold focus:border-white/40 outline-none transition-all placeholder:text-white/10"
        />
      </div>

      {/* Rota Fiscal */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-[9px] font-black text-white/40 uppercase tracking-widest ml-1">Origem</label>
          <div className="relative">
            <select 
              value={inputs.ufOrigem} onChange={(e) => handleUfChange('ufOrigem', e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs font-black outline-none appearance-none cursor-pointer focus:border-white/20 transition-all"
            >
              {UF_LIST.map(uf => <option key={uf.sigla} value={uf.sigla} className="bg-slate-900">{uf.sigla}</option>)}
            </select>
          </div>
        </div>
        <div className="space-y-2">
          <label className="text-[9px] font-black text-white/40 uppercase tracking-widest ml-1">Destino</label>
          <div className="relative">
            <select 
              value={inputs.ufDestino} onChange={(e) => handleUfChange('ufDestino', e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs font-black outline-none appearance-none cursor-pointer focus:border-white/20 transition-all"
            >
              {UF_LIST.map(uf => <option key={uf.sigla} value={uf.sigla} className="bg-slate-900">{uf.sigla}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Busca NCM */}
      <div className="space-y-2 relative" ref={searchRef}>
        <label className="text-[9px] font-black text-white/40 uppercase tracking-widest ml-1">Inteligência NCM</label>
        <div 
          onClick={() => setShowNcmSearch(true)}
          className={`flex items-center bg-white/5 border ${showNcmSearch ? 'border-white/40' : 'border-white/10'} rounded-xl px-4 py-3 cursor-text transition-all`}
        >
          <input 
            type="text" placeholder="Buscar NCM..."
            value={showNcmSearch ? searchTerm : `${inputs.ncmCodigo}`}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-transparent text-sm font-black text-white outline-none placeholder:text-white/10"
          />
        </div>

        {showNcmSearch && (
          <div className="absolute top-[calc(100%+10px)] left-0 w-full bg-[#111] border border-white/10 rounded-xl shadow-2xl z-[1000] overflow-hidden max-h-60 overflow-y-auto custom-scrollbar">
            {filteredNcm.map(ncm => (
              <button 
                key={ncm.codigo} onClick={() => selectNcm(ncm)}
                className="w-full text-left p-4 hover:bg-white/5 transition-all flex flex-col border-b border-white/5"
              >
                <span className="text-[10px] font-black text-white font-mono">{ncm.codigo}</span>
                <span className="text-[10px] text-white/40 truncate">{ncm.descricao}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Quick Summary */}
      <div className="grid grid-cols-2 gap-4 pt-2">
         <div className="bg-white/5 p-3 rounded-xl border border-white/5 text-center">
            <p className="text-[8px] font-black text-white/30 uppercase mb-1">Inter</p>
            <p className="text-sm font-black text-white font-mono">{inputs.icmsInterestadual}%</p>
         </div>
         <div className="bg-white/5 p-3 rounded-xl border border-white/5 text-center">
            <p className="text-[8px] font-black text-white/30 uppercase mb-1">MVA Adj</p>
            <p className="text-sm font-black text-amber-400 font-mono">{inputs.mva.toFixed(1)}%</p>
         </div>
      </div>
    </div>
  );
};

export default FiscalHeader;
