
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
    <div className="bg-[#1a2332] rounded-[2rem] p-7 text-white space-y-7 shadow-2xl relative overflow-visible ring-1 ring-slate-800">
      
      {/* Nome Comercial / Produto */}
      <div className="space-y-2.5">
        <label className="text-[10px] font-black text-blue-400 uppercase tracking-[0.2em] ml-1">Nome Comercial / Produto</label>
        <input 
          type="text" 
          value={inputs.nomeProduto}
          onChange={(e) => setInputs(prev => ({...prev, nomeProduto: e.target.value}))}
          placeholder="Ex: Piso Porcelanato 60x60"
          className="w-full bg-[#0f172a] border border-slate-700/50 rounded-2xl px-5 py-4 text-xs font-bold focus:border-blue-500 outline-none transition-all placeholder:text-slate-600 shadow-inner"
        />
      </div>

      {/* Origem / Destino */}
      <div className="grid grid-cols-2 gap-5">
        <div className="space-y-2.5">
          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Origem</label>
          <div className="relative">
            <select 
              value={inputs.ufOrigem} 
              onChange={(e) => handleUfChange('ufOrigem', e.target.value)}
              className="w-full bg-[#0f172a] border border-slate-700/50 rounded-2xl px-5 py-4 text-xs font-black outline-none appearance-none cursor-pointer focus:border-blue-500/50 transition-all shadow-inner"
            >
              {UF_LIST.map(uf => <option key={uf.sigla} value={uf.sigla}>{uf.sigla} - {uf.nome}</option>)}
            </select>
            <svg className="w-4 h-4 absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" fill="currentColor" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"/></svg>
          </div>
        </div>
        <div className="space-y-2.5">
          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Destino</label>
          <div className="relative">
            <select 
              value={inputs.ufDestino} 
              onChange={(e) => handleUfChange('ufDestino', e.target.value)}
              className="w-full bg-[#0f172a] border border-slate-700/50 rounded-2xl px-5 py-4 text-xs font-black outline-none appearance-none cursor-pointer focus:border-blue-500/50 transition-all shadow-inner"
            >
              {UF_LIST.map(uf => <option key={uf.sigla} value={uf.sigla}>{uf.sigla} - {uf.nome}</option>)}
            </select>
            <svg className="w-4 h-4 absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" fill="currentColor" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"/></svg>
          </div>
        </div>
      </div>

      {/* Classificação NCM (Busca Funcional) */}
      <div className="space-y-2.5 relative" ref={searchRef}>
        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Classificação NCM</label>
        <div 
          onClick={() => setShowNcmSearch(true)}
          className={`flex items-center bg-[#0f172a] border ${showNcmSearch ? 'border-blue-500 ring-1 ring-blue-500/20' : 'border-slate-700/50'} rounded-2xl px-5 py-4 cursor-text transition-all shadow-inner`}
        >
          <svg className="w-4 h-4 text-blue-500 mr-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
          <input 
            type="text" 
            placeholder="Digite para buscar NCM ou descrição..."
            value={showNcmSearch ? searchTerm : `${inputs.ncmCodigo} - ${inputs.nomeProduto}`}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-transparent text-xs font-black text-blue-100 outline-none placeholder:text-slate-600"
          />
        </div>

        {/* Dropdown de Resultados da Busca */}
        {showNcmSearch && (
          <div className="absolute top-[calc(100%+8px)] left-0 w-full bg-[#1e293b] border border-slate-700 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] z-[999] overflow-hidden animate-slide-up">
            <div className="max-h-72 overflow-y-auto custom-scrollbar p-2">
              {filteredNcm.map(ncm => (
                <button 
                  key={ncm.codigo}
                  onClick={() => selectNcm(ncm)}
                  className="w-full text-left p-4 hover:bg-blue-600 rounded-xl transition-all group flex flex-col gap-0.5 mb-1 last:mb-0"
                >
                  <span className="text-[10px] font-black text-blue-400 group-hover:text-blue-100 font-mono tracking-widest">{ncm.codigo}</span>
                  <span className="text-xs font-bold text-slate-200 group-hover:text-white line-clamp-1">{ncm.descricao}</span>
                </button>
              ))}
              {filteredNcm.length === 0 && (
                <div className="p-10 text-center text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] italic">
                  Nenhum registro encontrado
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Stats Summary - Conforme Imagem */}
      <div className="space-y-4 pt-2">
         <div className="bg-[#0f172a]/80 p-5 rounded-2xl flex justify-between items-center border border-slate-800/50">
            <div>
              <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Interestadual</p>
              <p className="text-[11px] font-black text-blue-400 font-mono">{inputs.ufOrigem} ➔ {inputs.ufDestino}</p>
            </div>
            <p className="text-xl font-black text-blue-400 font-mono tracking-tighter">{inputs.icmsInterestadual}%</p>
         </div>

         <div className="bg-[#0f172a]/80 p-5 rounded-2xl flex justify-between items-center border border-slate-800/50">
            <div>
              <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">MVA Ajustada 2025</p>
              <p className="text-[10px] font-black text-slate-400 uppercase italic">Recálculo Dinâmico</p>
            </div>
            <p className="text-xl font-black text-amber-500 font-mono tracking-tighter">{inputs.mva.toFixed(2)}%</p>
         </div>
      </div>
    </div>
  );
};

export default FiscalHeader;
