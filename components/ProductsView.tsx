import React, { useState } from 'react';
import { NCM_DATABASE } from '../utils/ncmData';

interface ProductsViewProps {
  onSelectNcm?: (ncm: any) => void;
}

const ProductsView: React.FC<ProductsViewProps> = ({ onSelectNcm }) => {
  const [search, setSearch] = useState('');

  const filtered = NCM_DATABASE.filter(n => 
    n.codigo.toLowerCase().includes(search.toLowerCase()) || 
    n.descricao.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-black text-slate-800 tracking-tight uppercase">Catálogo NCM 2025</h2>
          <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Consulta de Alíquotas e MVA Original</p>
        </div>
        
        <div className="relative w-full md:w-96">
          <input 
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Pesquisar por NCM ou descrição..."
            className="w-full bg-white border border-slate-200 rounded-2xl px-5 py-3 pl-12 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all shadow-sm"
          />
          <svg className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((ncm) => (
          <div 
            key={ncm.codigo}
            className="bg-white border border-slate-200 rounded-2xl p-5 hover:border-blue-500 hover:shadow-xl hover:shadow-blue-500/5 transition-all group relative overflow-hidden"
          >
            <div className="flex justify-between items-start mb-3">
              <span className="bg-blue-50 text-blue-600 px-3 py-1 rounded-lg font-black text-xs tracking-wider border border-blue-100 uppercase">
                {ncm.codigo}
              </span>
              <div className="text-right">
                <p className="text-[9px] text-slate-400 font-black uppercase tracking-tighter">MVA Original</p>
                <p className="text-lg font-black text-slate-800">{ncm.mvaOriginal}%</p>
              </div>
            </div>
            
            <h3 className="text-sm font-bold text-slate-700 leading-snug line-clamp-3 min-h-[3rem]">
              {ncm.descricao}
            </h3>
            
            <div className="mt-4 pt-4 border-t border-slate-50 flex items-center justify-between">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Vigência 2025</span>
              {onSelectNcm && (
                 <button 
                   onClick={() => onSelectNcm(ncm)}
                   className="text-[10px] font-black text-blue-600 uppercase tracking-widest hover:underline"
                 >
                   Simular Preço →
                 </button>
              )}
            </div>

            {/* Detalhe visual de hover */}
            <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50 rounded-full -mr-12 -mt-12 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-0"></div>
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="col-span-full py-20 text-center bg-white rounded-3xl border-2 border-dashed border-slate-200">
             <div className="text-4xl mb-4">🔍</div>
             <p className="text-slate-500 font-black uppercase text-xs tracking-[0.2em]">Nenhum produto localizado</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductsView;