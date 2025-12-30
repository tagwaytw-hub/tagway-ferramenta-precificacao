import React, { useState, useRef, useEffect } from 'react';
import { SimulationInputs, NCMEntry } from '../types';
import { UF_LIST, NCM_DATABASE } from '../utils/ncmData';
import { getInterstateRate, calculateAdjustedMva } from '../utils/calculations';

interface FiscalHeaderProps {
  inputs: SimulationInputs;
  setInputs: React.Dispatch<React.SetStateAction<SimulationInputs>>;
}

const FiscalHeader: React.FC<FiscalHeaderProps> = ({ inputs, setInputs }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const suggestionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const currentNcm = NCM_DATABASE.find(n => n.codigo === inputs.ncmCodigo);
    if (currentNcm) {
      setSearchTerm(`${currentNcm.codigo} - ${currentNcm.descricao}`);
    }
  }, []);

  const handleUfChange = (field: 'ufOrigem' | 'ufDestino', val: string) => {
    const newOrigem = field === 'ufOrigem' ? val : inputs.ufOrigem;
    const newDestino = field === 'ufDestino' ? val : inputs.ufDestino;
    
    const origUf = UF_LIST.find(u => u.sigla === newOrigem);
    const destUf = UF_LIST.find(u => u.sigla === newDestino);
    
    if (origUf && destUf) {
      const interRate = getInterstateRate(origUf.sigla, destUf.sigla);
      const adjMva = calculateAdjustedMva(inputs.mvaOriginal, interRate, destUf.icms);
      
      setInputs(prev => ({
        ...prev,
        [field]: val,
        icmsInterestadual: interRate,
        icmsInternoDestino: destUf.icms,
        icmsVenda: prev.mode !== 'substituido' ? destUf.icms : prev.icmsVenda,
        mva: adjMva
      }));
    }
  };

  const selectNcm = (ncm: NCMEntry) => {
    const interRate = inputs.icmsInterestadual;
    const adjMva = calculateAdjustedMva(ncm.mvaOriginal, interRate, inputs.icmsInternoDestino);

    setInputs(prev => ({
      ...prev,
      ncmCodigo: ncm.codigo,
      mvaOriginal: ncm.mvaOriginal,
      mva: adjMva,
      nomeProduto: ncm.descricao
    }));
    setSearchTerm(`${ncm.codigo} - ${ncm.descricao}`);
    setShowSuggestions(false);
  };

  const filteredNcms = NCM_DATABASE.filter(n => 
    n.codigo.toLowerCase().includes(searchTerm.toLowerCase()) || 
    n.descricao.toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (suggestionRef.current && !suggestionRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="bg-[#1a2332] text-white p-5 rounded-2xl shadow-xl border border-slate-700">
      <div className="mb-5">
        <label className="block text-[9px] uppercase font-black text-blue-400 mb-1.5 tracking-wider">Nome Comercial / Produto</label>
        <input 
          type="text"
          value={inputs.nomeProduto}
          onChange={(e) => setInputs(prev => ({ ...prev, nomeProduto: e.target.value }))}
          placeholder="Ex: Piso Porcelanato 60x60"
          className="w-full bg-[#0f172a] border border-slate-600 rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-500 transition-colors placeholder:text-slate-700 font-medium"
        />
      </div>

      <div className="grid grid-cols-2 gap-4 mb-5">
        <div className="group">
          <label className="block text-[9px] uppercase font-black text-slate-400 mb-1.5 tracking-wider">Origem</label>
          <div className="relative">
            <select 
              value={inputs.ufOrigem}
              onChange={(e) => handleUfChange('ufOrigem', e.target.value)}
              className="w-full bg-[#0f172a] border border-slate-600 rounded-xl px-3 py-3 text-sm outline-none focus:border-blue-500 appearance-none"
            >
              {UF_LIST.map(uf => <option key={uf.sigla} value={uf.sigla}>{uf.sigla} - {uf.nome}</option>)}
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7"></path></svg>
            </div>
          </div>
        </div>
        <div className="group">
          <label className="block text-[9px] uppercase font-black text-slate-400 mb-1.5 tracking-wider">Destino</label>
          <div className="relative">
            <select 
              value={inputs.ufDestino}
              onChange={(e) => handleUfChange('ufDestino', e.target.value)}
              className="w-full bg-[#0f172a] border border-slate-600 rounded-xl px-3 py-3 text-sm outline-none focus:border-blue-500 appearance-none"
            >
              {UF_LIST.map(uf => <option key={uf.sigla} value={uf.sigla}>{uf.sigla} - {uf.nome}</option>)}
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7"></path></svg>
            </div>
          </div>
        </div>
      </div>

      <div className="mb-5 relative" ref={suggestionRef}>
        <label className="block text-[9px] uppercase font-black text-slate-400 mb-1.5 tracking-wider">Classificação NCM</label>
        <div className="relative">
          <input 
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setShowSuggestions(true);
            }}
            onFocus={() => setShowSuggestions(true)}
            placeholder="Pesquisar NCM..."
            className="w-full bg-[#0f172a] border border-slate-600 rounded-xl pl-10 pr-4 py-3 text-sm outline-none focus:border-blue-500 transition-colors"
          />
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
          </div>
        </div>

        {showSuggestions && (
          <div className="absolute z-50 w-full mt-2 bg-[#1e293b] border border-slate-600 rounded-2xl shadow-2xl max-h-60 overflow-y-auto custom-scrollbar">
            {filteredNcms.length > 0 ? (
              filteredNcms.map((ncm) => (
                <div 
                  key={ncm.codigo}
                  onClick={() => selectNcm(ncm)}
                  className="px-4 py-4 hover:bg-blue-600 cursor-pointer border-b border-slate-700/50 last:border-0 active:bg-blue-700"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-blue-300 group-hover:text-white tracking-wider">{ncm.codigo}</span>
                    <span className="text-[8px] bg-slate-700 px-2 py-0.5 rounded font-black text-slate-300">MVA: {ncm.mvaOriginal}%</span>
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1 line-clamp-1">{ncm.descricao}</div>
                </div>
              ))
            ) : (
              <div className="px-4 py-8 text-center text-slate-500 text-[10px] font-bold uppercase italic">
                Nenhum NCM encontrado
              </div>
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-3 pt-4 border-t border-slate-700/50">
        <div className="flex justify-between items-center bg-[#0f172a] p-3 rounded-xl border border-slate-700/50">
          <div className="flex flex-col">
            <span className="text-[8px] font-black text-slate-500 uppercase">Interestadual</span>
            <span className="text-[10px] text-slate-300 font-bold uppercase">{inputs.ufOrigem} ➔ {inputs.ufDestino}</span>
          </div>
          <span className="text-sm font-black text-blue-400">{inputs.icmsInterestadual}%</span>
        </div>
        <div className="flex justify-between items-center bg-[#0f172a] p-3 rounded-xl border border-slate-700/50">
          <div className="flex flex-col">
            <span className="text-[8px] font-black text-slate-500 uppercase">MVA Ajustada 2025</span>
            <span className="text-[10px] text-slate-300 font-bold uppercase italic">Recálculo Dinâmico</span>
          </div>
          <span className="text-sm font-black text-orange-400">{inputs.mva.toFixed(2).replace('.', ',')}%</span>
        </div>
      </div>
    </div>
  );
};

export default FiscalHeader;