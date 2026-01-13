
import React, { useState, useRef } from 'react';
import { NCM_DATABASE } from '../utils/ncmData';

interface ProductsViewProps {
  onSelectNcm?: (ncm: any) => void;
}

const ProductsView: React.FC<ProductsViewProps> = ({ onSelectNcm }) => {
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('table');
  const [customDatabase, setCustomDatabase] = useState(NCM_DATABASE);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filtered = customDatabase.filter(n => 
    n.codigo.toLowerCase().includes(search.toLowerCase()) || 
    n.descricao.toLowerCase().includes(search.toLowerCase())
  );

  const handleExportCSV = () => {
    const headers = ['codigo', 'descricao', 'mvaOriginal'];
    const csvContent = [
      headers.join(','),
      ...customDatabase.map(n => `${n.codigo},"${n.descricao.replace(/"/g, '""')}",${n.mvaOriginal}`)
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', 'tagway_catalogo_ncm.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImportCSV = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const lines = text.split('\n');
      const newItems = lines.slice(1).map(line => {
        const parts = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
        if (parts.length < 3) return null;
        return {
          codigo: parts[0].trim(),
          descricao: parts[1].replace(/^"|"$/g, '').trim(),
          mvaOriginal: parseFloat(parts[2]) || 0
        };
      }).filter(Boolean) as any[];

      if (newItems.length > 0) {
        setCustomDatabase(newItems);
        alert(`${newItems.length} itens importados com sucesso!`);
      }
    };
    reader.readAsText(file);
  };

  const handleDownloadPDF = (ncm: any) => {
    // Simulação de integração com Aleph/Documentos
    alert(`Iniciando conexão segura com Aleph...\nBaixando Ficha Técnica PDF para NCM: ${ncm.codigo}`);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-slide-up">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase italic">Inteligência de Itens</h2>
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em] mt-1">Gestão de Catálogo via Excel / CSV</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <button 
            onClick={() => setViewMode(viewMode === 'cards' ? 'table' : 'cards')}
            className="bg-white border border-slate-200 p-2.5 rounded-xl text-slate-600 hover:bg-slate-50 transition-all shadow-sm flex items-center gap-2 text-[10px] font-black uppercase"
          >
            {viewMode === 'cards' ? (
              <><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 6h16M4 10h16M4 14h16M4 18h16"/></svg> Tabela</>
            ) : (
              <><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"/></svg> Cards</>
            )}
          </button>

          <input type="file" ref={fileInputRef} onChange={handleImportCSV} accept=".csv" className="hidden" />
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="bg-slate-100 text-slate-700 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 transition-all border border-slate-200"
          >
            Importar CSV
          </button>
          
          <button 
            onClick={handleExportCSV}
            className="bg-black text-white px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg"
          >
            Exportar CSV
          </button>
        </div>
      </div>

      <div className="relative">
        <input 
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Filtrar por código ou descrição (Ex: Pisos, 6907...)"
          className="w-full bg-white border border-slate-200 rounded-2xl px-6 py-4 pl-14 text-sm font-bold focus:ring-4 focus:ring-black/5 focus:border-black outline-none transition-all shadow-sm"
        />
        <svg className="w-6 h-6 absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
      </div>

      {viewMode === 'table' ? (
        <div className="bg-white border border-slate-200 rounded-[2rem] overflow-hidden shadow-xl overflow-x-auto no-scrollbar">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="bg-slate-900 text-white">
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest">NCM</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest">Descrição</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-center">MVA Original</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((ncm) => (
                <tr key={ncm.codigo} className="hover:bg-slate-50 transition-colors group">
                  <td className="px-6 py-4">
                    <span className="font-mono font-black text-xs text-slate-900 bg-slate-100 px-2 py-1 rounded">
                      {ncm.codigo}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-xs font-bold text-slate-600 truncate max-w-md">{ncm.descricao}</p>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`text-xs font-black ${ncm.mvaOriginal > 50 ? 'text-rose-500' : 'text-emerald-600'}`}>
                      {ncm.mvaOriginal.toFixed(2)}%
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        onClick={() => handleDownloadPDF(ncm)}
                        className="p-2 text-slate-300 hover:text-blue-500 transition-all opacity-0 group-hover:opacity-100"
                        title="Download PDF Técnico"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 17h6m-6-4h6m-6-8l3 3m0 0l3-3m-3 3V3"/></svg>
                      </button>
                      <button 
                        onClick={() => onSelectNcm?.(ncm)}
                        className="bg-slate-900 text-white px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 transition-all active:scale-95"
                      >
                        Simular
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((ncm) => (
            <div 
              key={ncm.codigo}
              className="bg-white border border-slate-200 rounded-[2rem] p-6 hover:border-black hover:shadow-2xl transition-all group relative overflow-hidden"
            >
              <div className="flex justify-between items-start mb-4">
                <span className="bg-slate-900 text-white px-3 py-1 rounded-lg font-black text-[10px] tracking-wider uppercase">
                  {ncm.codigo}
                </span>
                <div className="text-right">
                  <p className="text-[8px] text-slate-400 font-black uppercase tracking-widest">MVA Original</p>
                  <p className={`text-xl font-black ${ncm.mvaOriginal > 50 ? 'text-rose-500' : 'text-slate-800'}`}>{ncm.mvaOriginal}%</p>
                </div>
              </div>
              
              <h3 className="text-xs font-bold text-slate-600 leading-relaxed line-clamp-2 min-h-[2.5rem] mb-6">
                {ncm.descricao}
              </h3>
              
              <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                <button 
                  onClick={() => handleDownloadPDF(ncm)}
                  className="flex items-center gap-1.5 text-[9px] font-black text-slate-400 uppercase tracking-widest hover:text-blue-500 transition-colors"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
                  Documento
                </button>
                {onSelectNcm && (
                   <button 
                     onClick={() => onSelectNcm(ncm)}
                     className="bg-black text-white px-5 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-blue-600 transition-all active:scale-95"
                   >
                     Simular Agora
                   </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {filtered.length === 0 && (
        <div className="col-span-full py-20 text-center bg-white rounded-[3rem] border-2 border-dashed border-slate-200 shadow-inner">
           <div className="text-5xl mb-4 opacity-20">📂</div>
           <p className="text-slate-400 font-black uppercase text-[10px] tracking-[0.3em]">Nenhum item encontrado na planilha</p>
        </div>
      )}
    </div>
  );
};

export default ProductsView;
