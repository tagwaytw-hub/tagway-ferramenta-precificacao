
import React, { useState, useRef, useEffect } from 'react';
import { SimulationInputs, NCMEntry } from '../types.ts';
import { UF_LIST, NCM_DATABASE } from '../utils/ncmData.ts';
import { getInterstateRate, calculateAdjustedMva } from '../utils/calculations.ts';

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
    <div className="bg-[#1a2332] text-white p-4 md:p-6 rounded-2xl shadow-xl border border-slate-700">
      <div className="mb-6">
        <label className="block text-[9px] md:text-[10px] uppercase font-black text-blue-400 mb-1.5 tracking-wider">Identificação do Item (Nome Comercial)</label>
        <input 
          type="text"
          value={inputs.nomeProduto}
          onChange={(e) => setInputs(prev => ({ ...prev, nomeProduto: e.target.value }))}
          placeholder="Ex: Piso Porcelanato Bege 60x60"
          className="w-full bg-[#0f172a] border border-slate-600 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-500 transition-colors placeholder:text-slate-700 font-medium"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-6">
        <div className="group">
          <label className="block text-[9px] md:text-[10px] uppercase font-black text-slate-400 mb-1.5 tracking-wider group-focus-within:text-blue-400 transition-colors">UF de Origem</label>
          <div className="relative">
            <select 
              value={inputs.ufOrigem}
              onChange={(e) => handleUfChange('ufOrigem', e.target.value)}
              className="w-full bg-[#0f172a] border border-slate-600 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-blue-500 transition-colors cursor-pointer appearance-none"
            >
              {UF_LIST.map(uf => <option key={uf.sigla} value={uf.sigla}>{uf.nome} ({uf.sigla})</option>)}
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
            </div>
          </div>
        </div>
        <div className="group">
          <label className="block text-[9px] md:text-[10px] uppercase font-black text-slate-400 mb-1.5 tracking-wider group-focus-within:text-blue-400 transition-colors">UF de Destino</label>
          <div className="relative">
            <select 
              value={inputs.ufDestino}
              onChange={(e) => handleUfChange('ufDestino', e.target.value)}
              className="w-full bg-[#0f172a] border border-slate-600 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-blue-500 transition-colors cursor-pointer appearance-none"
            >
              {UF_LIST.map(uf => <option key={uf.sigla} value={uf.sigla}>{uf.nome} ({uf.sigla})</option>)}
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
            </div>
          </div>
        </div>
      </div>

      <div className="mb-6 relative" ref={suggestionRef}>
        <label className="block text-[9px] md:text-[10px] uppercase font-black text-slate-400 mb-1.5 tracking-wider">Classificação NCM 2025</label>
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
            className="w-full bg-[#0f172a] border border-slate-600 rounded-xl pl-10 pr-4 py-2.5 text-sm outline-none focus:border-blue-500 transition-colors placeholder:text-slate-600"
          />
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
          </div>
        </div>

        {showSuggestions && (
          <div className="absolute z-50 w-full mt-1 bg-[#1e293b] border border-slate-600 rounded-xl shadow-2xl max-h-60 overflow-y-auto custom-scrollbar">
            {filteredNcms.length > 0 ? (
              filteredNcms.map((ncm) => (
                <div 
                  key={ncm.codigo}
                  onClick={() => selectNcm(ncm)}
                  className="px-4 py-3 hover:bg-blue-600 cursor-pointer border-b border-slate-700/50 last:border-0 transition-colors group active:bg-blue-700"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-black text-blue-300 group-hover:text-white">{ncm.codigo}</span>
                    <span className="text-[9px] bg-slate-700 px-2 py-0.5 rounded font-black text-slate-300 group-hover:bg-blue-500">MVA: {ncm.mvaOriginal}%</span>
                  </div>
                  <div className="text-[11px] text-slate-400 group-hover:text-blue-100 mt-1 line-clamp-1">{ncm.descricao}</div>
                </div>
              ))
            ) : (
              <div className="px-4 py-8 text-center text-slate-500 text-[10px] font-bold uppercase tracking-widest italic">
                Nenhum resultado
              </div>
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-700/50">
        <div className="space-y-2">
          <h4 className="text-[9px] md:text-[10px] font-black text-blue-400 uppercase tracking-widest">ICMS Interestadual</h4>
          <div className="flex justify-between items-center bg-[#0f172a] p-2 rounded-lg border border-slate-700/50">
            <span className="text-[10px] text-slate-400 font-bold uppercase">{inputs.ufOrigem} → {inputs.ufDestino}</span>
            <span className="text-sm font-black text-blue-300">{inputs.icmsInterestadual}%</span>
          </div>
        </div>
        <div className="space-y-2">
          <h4 className="text-[9px] md:text-[10px] font-black text-orange-400 uppercase tracking-widest">MVA Ajustada (2025)</h4>
          <div className="flex justify-between items-center bg-[#0f172a] p-2 rounded-lg border border-slate-700/50">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">Cálculo Dinâmico</span>
            <span className="text-sm font-black text-orange-500">{inputs.mva.toFixed(2).replace('.', ',')}%</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FiscalHeader;
