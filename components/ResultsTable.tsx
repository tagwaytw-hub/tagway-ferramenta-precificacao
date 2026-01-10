
import React, { useState } from 'react';
import { SimulationResults, SimulationInputs } from '../types';
import { formatCurrency } from '../utils/calculations';

interface ResultsTableProps {
  results: SimulationResults;
  priceMatrix: any[];
  inputs: SimulationInputs;
}

const ResultsTable: React.FC<ResultsTableProps> = ({ results, priceMatrix, inputs }) => {
  // Estado para controlar qual cenário de markup está selecionado (Curva B padrão)
  const [selectedIdx, setSelectedIdx] = useState(2);
  const currentScenario = priceMatrix[selectedIdx];

  return (
    <div className="space-y-6 lg:space-y-10 pb-32 lg:pb-12 animate-slide-up">
      
      {/* Sugestão Final Hero */}
      <section className="bg-slate-900 rounded-[2.5rem] p-8 lg:p-10 shadow-2xl text-white relative overflow-hidden ring-1 ring-white/10">
        <div className="relative z-10">
          <header className="flex justify-between items-center mb-10">
            <div className="space-y-1">
              <span className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.3em]">Cálculo Determinístico</span>
              <h4 className="text-xl font-black text-white/90 tracking-tighter italic">Preço de Venda</h4>
            </div>
            <div className="bg-white/10 px-4 py-2 rounded-2xl border border-white/5">
              <span className="text-[10px] font-black font-mono text-white/60">NET {inputs.resultadoDesejado}%</span>
            </div>
          </header>

          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
            <div className="space-y-2">
              <span className="text-[9px] font-black text-white/40 uppercase tracking-widest block">Sugerido p/ Margem Alvo</span>
              <div className="text-6xl lg:text-7xl font-black font-mono tracking-tighter text-white tabular-nums">{formatCurrency(results.precoVendaAlvo)}</div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 lg:w-72">
               <div className="bg-white/5 p-4 rounded-3xl border border-white/5">
                 <span className="text-[8px] font-black text-white/30 uppercase tracking-widest block mb-1">Custo Líquido</span>
                 <span className="text-xl font-black text-white font-mono tabular-nums">{formatCurrency(results.custoFinal)}</span>
               </div>
               <div className="bg-white/5 p-4 rounded-3xl border border-white/5">
                 <span className="text-[8px] font-black text-white/30 uppercase tracking-widest block mb-1">Lucro un.</span>
                 <span className="text-xl font-black text-emerald-400 font-mono tabular-nums">{formatCurrency(results.margemAbsoluta)}</span>
               </div>
            </div>
          </div>
        </div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-[80px] -mr-32 -mt-32"></div>
      </section>

      {/* Cenários de Markup Interativos */}
      <section className="space-y-6">
        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] px-1">Cenários de Mercado (Clique p/ Analisar)</h3>
        
        {/* Seletor de Categorias Estilo Tabs - Suporta toque e scroll horizontal no mobile */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2 px-1">
          {priceMatrix.map((cat, i) => (
            <button
              key={i}
              onClick={() => setSelectedIdx(i)}
              className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shrink-0 border ${
                selectedIdx === i 
                ? 'bg-black text-white border-black shadow-xl shadow-black/20 scale-105' 
                : 'bg-white text-slate-400 border-slate-200 hover:border-slate-300'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Detalhes do Cenário Selecionado */}
        <div className="bg-white rounded-[2rem] border border-slate-200 p-8 shadow-xl animate-slide-up">
           <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4 border-b border-slate-100 pb-6">
              <div className="text-center md:text-left">
                <h4 className="text-2xl font-black text-slate-900 tracking-tighter uppercase italic">{currentScenario.label}</h4>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Base de Markup: {currentScenario.margin}% de Margem Líquida</p>
              </div>
              <div className="bg-slate-900 text-white px-6 py-2 rounded-xl">
                 <span className="text-xs font-black font-mono">MODO: {currentScenario.margin >= 15 ? 'ALTA PERFORMANCE' : 'VOLUME'}</span>
              </div>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { level: 'A', label: 'Mínimo (Agressivo)', color: 'bg-rose-500' },
                { level: 'B', label: 'Sugerido (Base)', color: 'bg-amber-500' },
                { level: 'C', label: 'Médio (Equilibrado)', color: 'bg-blue-500' },
                { level: 'D', label: 'Premium (Max)', color: 'bg-emerald-500' }
              ].map(item => (
                <div key={item.level} className="p-6 rounded-[1.5rem] bg-slate-50 border border-slate-100 space-y-3 hover:bg-white hover:shadow-lg transition-all group">
                   <div className="flex items-center gap-3">
                      <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-white font-black ${item.color} shadow-lg shadow-black/5`}>{item.level}</span>
                      <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none">{item.label}</span>
                   </div>
                   <div className="text-2xl font-black text-slate-900 font-mono tracking-tighter group-hover:scale-105 transition-transform">
                      {formatCurrency(currentScenario.levels[item.level])}
                   </div>
                </div>
              ))}
           </div>
        </div>
      </section>

      {/* KPI Grid Secundário */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 lg:gap-6">
        <KPIBox label="Fisco Saída" value={results.impostosTotais} sub="Carga Nominal" color="text-rose-500" icon="M19 14l-7 7m0 0l-7-7m7 7V3" />
        <KPIBox label="Créditos Fiscais" value={results.creditoIcmsEntrada + results.creditoPisCofinsValor} sub="Recuperável" color="text-blue-600" icon="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        <KPIBox label="Break Even" value={results.precoEquilibrio} sub="Meta p/ Margem 0" color="text-amber-600" icon="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2" />
      </div>

    </div>
  );
};

const KPIBox = ({ label, value, sub, color, icon }: any) => (
  <div className="bg-white p-5 lg:p-6 rounded-[2rem] border border-slate-200 shadow-sm transition-all btn-touch">
    <div className="flex items-center justify-between mb-4">
      <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block truncate pr-2">{label}</span>
      {icon && <svg className="w-3.5 h-3.5 text-slate-200 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d={icon}/></svg>}
    </div>
    <span className={`text-xl lg:text-2xl font-black font-mono ${color || 'text-slate-800'} tracking-tighter block truncate tabular-nums mb-1`}>{formatCurrency(value)}</span>
    <span className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter opacity-60 truncate">{sub}</span>
  </div>
);

export default ResultsTable;
