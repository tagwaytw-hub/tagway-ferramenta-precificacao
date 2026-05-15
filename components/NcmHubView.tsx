
import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { NCMEntry, NCMOverride } from '../types';
import { NCM_DATABASE, UF_LIST } from '../utils/ncmData';

interface NcmHubViewProps {
  overrides: NCMOverride[];
  onAddOverride: (override: NCMOverride) => void;
  onRemoveOverride: (id: string) => void;
}

const NcmHubView: React.FC<NcmHubViewProps> = ({ overrides, onAddOverride, onRemoveOverride }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUf, setSelectedUf] = useState('BA');
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    ncm: '',
    mva: 0,
    obs: ''
  });

  const filteredDb = useMemo(() => {
    return NCM_DATABASE.filter(n => 
      n.codigo.includes(searchTerm) || 
      n.descricao.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm]);

  const handleApplyOverride = (ncm: NCMEntry) => {
    const existing = overrides.find(o => o.ncmCodigo === ncm.codigo && o.uf === selectedUf);
    setFormData({
      ncm: ncm.codigo,
      mva: existing ? existing.mvaAdjusted : ncm.mvaOriginal,
      obs: existing ? (existing.observation || '') : ''
    });
    setIsEditing(ncm.codigo);
  };

  const saveOverride = () => {
    onAddOverride({
      id: `${formData.ncm}-${selectedUf}`,
      ncmCodigo: formData.ncm,
      uf: selectedUf,
      mvaAdjusted: formData.mva,
      observation: formData.obs,
      updatedAt: new Date().toISOString()
    });
    setIsEditing(null);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header Section */}
      <section className="bg-white rounded-[2.5rem] p-10 shadow-sm border border-slate-100">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 shadow-[0_0_8px_#6366f1]"></div>
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Inteligência Fiscal</span>
            </div>
            <h1 className="text-3xl font-black text-slate-900 uppercase">NCM Hub & Custom MVA</h1>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-tight mt-1">
              Gerencie exceções tributárias e ajustes finos por estado.
            </p>
          </div>
          
          <div className="flex bg-slate-50 p-1.5 rounded-2xl border border-slate-100 gap-2">
            <select 
              value={selectedUf}
              onChange={(e) => setSelectedUf(e.target.value)}
              className="bg-white border border-slate-200 rounded-xl px-4 py-2 text-xs font-black uppercase text-slate-900 outline-none focus:border-indigo-500"
            >
              {UF_LIST.map(uf => (
                <option key={uf.sigla} value={uf.sigla}>{uf.sigla} - {uf.nome}</option>
              ))}
            </select>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Database List */}
        <div className="lg:col-span-2 space-y-6">
          <div className="relative">
            <input 
              type="text"
              placeholder="PESQUISAR NCM OU DESCRIÇÃO..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-2xl px-6 py-4 text-xs font-black uppercase tracking-widest text-slate-900 outline-none focus:border-indigo-500 shadow-sm placeholder:text-slate-300"
            />
            <div className="absolute right-6 top-1/2 -translate-y-1/2">
              <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>

          <div className="bg-white rounded-[2.5rem] overflow-hidden border border-slate-100 shadow-sm">
            <div className="p-6 border-b border-slate-50 bg-slate-50/50 flex justify-between items-center">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Base de Dados Mestra (2025)</span>
              <span className="text-[10px] font-black uppercase text-slate-900 bg-white px-3 py-1 rounded-full border border-slate-100">
                {filteredDb.length} ITENS
              </span>
            </div>
            
            <div className="divide-y divide-slate-50 max-h-[600px] overflow-y-auto no-scrollbar">
              {filteredDb.map(ncm => {
                const override = overrides.find(o => o.ncmCodigo === ncm.codigo && o.uf === selectedUf);
                return (
                  <div key={ncm.codigo} className="p-6 hover:bg-slate-50/50 transition-colors group">
                    <div className="flex justify-between items-center">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-black text-slate-900 font-mono tracking-tighter">{ncm.codigo}</span>
                          {override && (
                            <span className="text-[8px] font-black bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded-full uppercase tracking-widest">Ajustado</span>
                          )}
                        </div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight line-clamp-1 max-w-md">
                          {ncm.descricao}
                        </p>
                      </div>
                      
                      <div className="flex items-center gap-8">
                        <div className="text-right">
                          <span className="text-[9px] font-black text-slate-300 uppercase block mb-0.5">MVA SISTEMA</span>
                          <span className={`text-base font-black font-mono ${override ? 'text-slate-300 line-through' : 'text-slate-900'}`}>
                            {ncm.mvaOriginal.toFixed(2)}%
                          </span>
                        </div>

                        {override && (
                          <div className="text-right">
                            <span className="text-[9px] font-black text-indigo-400 uppercase block mb-0.5">MVA HUB</span>
                            <span className="text-base font-black font-mono text-indigo-600">
                              {override.mvaAdjusted.toFixed(2)}%
                            </span>
                          </div>
                        )}

                        <button 
                          onClick={() => handleApplyOverride(ncm)}
                          className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 hover:bg-indigo-600 hover:text-white hover:border-indigo-600 transition-all"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Sidebar: Active Overrides & Editor */}
        <div className="space-y-8">
          <AnimatePresence mode="wait">
            {isEditing ? (
              <motion.div 
                key="editor"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="bg-indigo-900 rounded-[2.5rem] p-8 text-white shadow-xl shadow-indigo-200"
              >
                <div className="flex justify-between items-center mb-8">
                  <h3 className="text-sm font-black uppercase tracking-widest">Ajustar NCM {formData.ncm}</h3>
                  <button onClick={() => setIsEditing(null)} className="text-indigo-300 hover:text-white">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="space-y-6">
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-indigo-300 block mb-3">Nova MVA Aplicada ({selectedUf})</label>
                    <div className="flex items-center gap-4">
                      <input 
                        type="number"
                        value={formData.mva}
                        onChange={(e) => setFormData({...formData, mva: parseFloat(e.target.value)})}
                        className="flex-1 bg-white/10 border border-white/20 rounded-2xl px-6 py-4 text-xl font-black font-mono text-white outline-none focus:border-white"
                      />
                      <span className="text-2xl font-black">%</span>
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-indigo-300 block mb-3">Observação / Base Legal</label>
                    <textarea 
                      value={formData.obs}
                      onChange={(e) => setFormData({...formData, obs: e.target.value})}
                      placeholder="Ex: Redução conforme Decreto X..."
                      className="w-full bg-white/10 border border-white/20 rounded-2xl px-6 py-4 text-[11px] font-bold text-white outline-none focus:border-white h-24 resize-none placeholder:text-white/20"
                    />
                  </div>

                  <button 
                    onClick={saveOverride}
                    className="w-full py-4 bg-white text-indigo-900 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-indigo-50 transition-all shadow-lg"
                  >
                    Salvar no Hub
                  </button>
                </div>
              </motion.div>
            ) : (
              <motion.div 
                key="list"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm"
              >
                <div className="flex items-center gap-3 mb-8">
                  <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest">Exceções no HUB ({selectedUf})</h3>
                </div>

                <div className="space-y-4">
                  {overrides.filter(o => o.uf === selectedUf).length === 0 ? (
                    <div className="py-10 text-center border-2 border-dashed border-slate-50 rounded-[2rem]">
                      <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Nenhuma exceção configurada</p>
                    </div>
                  ) : (
                    overrides.filter(o => o.uf === selectedUf).map(ov => (
                      <div key={ov.id} className="p-5 bg-slate-50 rounded-2xl border border-slate-100 group">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <span className="text-[11px] font-black font-mono text-slate-900">NCM {ov.ncmCodigo}</span>
                            <span className="text-[10px] font-black text-indigo-600 ml-2">{ov.mvaAdjusted}%</span>
                          </div>
                          <button 
                            onClick={() => onRemoveOverride(ov.id)}
                            className="text-slate-300 hover:text-rose-500 transition-colors"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                        {ov.observation && (
                          <p className="text-[9px] font-bold text-slate-400 uppercase leading-tight italic">
                            "{ov.observation}"
                          </p>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="p-8 bg-slate-900 rounded-[2.5rem] text-white">
            <p className="text-[9px] font-black text-indigo-400 uppercase tracking-[0.2em] mb-4">Informação Crítica</p>
            <p className="text-[11px] font-bold text-white/70 leading-relaxed uppercase">
              As alterações feitas no HUB sobrepõem automaticamente a base de dados do sistema em todas as simulações futuras.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NcmHubView;
