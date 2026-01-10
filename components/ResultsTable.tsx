
import React from 'react';
import { SimulationResults, SimulationInputs } from '../types';
import { formatCurrency } from '../utils/calculations';

interface ResultsTableProps {
  results: SimulationResults;
  priceMatrix: any[];
  inputs: SimulationInputs;
}

const ResultsTable: React.FC<ResultsTableProps> = ({ results, priceMatrix, inputs }) => {
  const totalWeight = results.custoFinal + results.impostosTotais + results.margemAbsoluta;
  const pCusto = (results.custoFinal / totalWeight) * 100;
  const pFisco = (results.impostosTotais / totalWeight) * 100;
  const pLucro = (results.margemAbsoluta / totalWeight) * 100;

  return (
    <div className="space-y-8 lg:space-y-10 pb-12">
      {/* Hero KPIs - 2 columns on mobile, 4 on desktop */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-6">
        <KPIBox label="Total NF-e" value={results.valorTotalNota} sub="Bruto Compra" icon="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        <KPIBox label="Créditos Fiscais" value={results.creditoIcmsEntrada + results.creditoPisCofinsValor} sub="Recuperável" color="text-blue-600" icon="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        <KPIBox label="Impostos Saída" value={results.impostosTotais} sub="Carga Total" color="text-rose-500" icon="M19 14l-7 7m0 0l-7-7m7 7V3" />
        <KPIBox label="Custo Líquido" value={results.custoFinal} sub="Unitário" color="text-slate-900" icon="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
        {/* Detalhamento de Créditos */}
        <section className="bg-white rounded-[1.5rem] lg:rounded-[2rem] border border-slate-200 p-6 lg:p-8 space-y-6 shadow-sm">
           <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest pb-4 border-b border-slate-100 flex items-center gap-2">
             <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
             Créditos
           </h5>
           <div className="space-y-4">
             <DetailRow label="ICMS Mercadoria" value={results.creditoIcmsMercadoria} />
             <DetailRow label="ICMS Frete" value={results.creditoIcmsFrete} />
             <DetailRow label="PIS e COFINS" value={results.creditoPisCofinsValor} />
             <div className="h-px bg-slate-100 my-2"></div>
             <div className="flex justify-between items-center">
                <span className="text-[10px] font-black text-blue-600 uppercase">Total Créditos</span>
                <span className="text-sm font-black text-blue-600 font-mono">{formatCurrency(results.creditoIcmsEntrada + results.creditoPisCofinsValor)}</span>
             </div>
           </div>
        </section>

        {/* Detalhamento de Aquisição */}
        <section className="bg-white rounded-[1.5rem] lg:rounded-[2rem] border border-slate-200 p-6 lg:p-8 space-y-6 shadow-sm">
           <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest pb-4 border-b border-slate-100">NF-e Compra</h5>
           <div className="space-y-4">
             <DetailRow label="Valor Líquido" value={inputs.valorCompra} />
             <DetailRow label="IPI" value={results.valorIpi} />
             <DetailRow label="Frete" value={inputs.freteValor} />
             <div className="h-px bg-slate-100 my-2"></div>
             <div className="flex justify-between items-center">
                <span className="text-[10px] font-black text-slate-900 uppercase">Valor Total</span>
                <span className="text-sm font-black text-slate-900 font-mono">{formatCurrency(results.valorTotalNota)}</span>
             </div>
           </div>
        </section>

        {/* Custo Mercadoria (Final) */}
        <section className="bg-slate-900 rounded-[1.5rem] lg:rounded-[2rem] p-6 lg:p-8 space-y-6 shadow-2xl text-white">
           <h5 className="text-[10px] font-black text-white/30 uppercase tracking-widest pb-4 border-b border-white/5">Sugestão Final</h5>
           <div className="space-y-6">
             <div>
               <span className="text-[9px] font-black text-white/40 uppercase tracking-widest block mb-2">Custo Líquido</span>
               <div className="text-3xl font-black font-mono tracking-tighter text-emerald-400">{formatCurrency(results.custoFinal)}</div>
             </div>
             <div className="h-px bg-white/5"></div>
             <div>
               <span className="text-[9px] font-black text-white/40 uppercase tracking-widest block mb-2">Venda Sugerida</span>
               <div className="text-4xl font-black font-mono tracking-tighter text-white">{formatCurrency(results.precoVendaAlvo)}</div>
             </div>
           </div>
        </section>
      </div>

      {/* Main Analysis Card */}
      <section className="bg-white rounded-[1.5rem] lg:rounded-[2rem] border border-slate-200 overflow-hidden shadow-2xl shadow-black/5">
        <div className="flex flex-col lg:flex-row divide-y lg:divide-y-0 lg:divide-x divide-slate-100">
          <div className="flex-1 p-6 lg:p-10 space-y-6 lg:space-y-8">
            <header className="flex justify-between items-start">
              <div className="space-y-1">
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Composição</h3>
                <h4 className="text-lg lg:text-2xl font-black text-slate-800 tracking-tighter">Markup Divisor {inputs.resultadoDesejado}% Net</h4>
              </div>
            </header>

            <div className="space-y-4">
              <div className="w-full h-4 bg-slate-100 rounded-full flex overflow-hidden ring-1 ring-slate-200/50">
                <div style={{ width: `${pCusto}%` }} className="h-full bg-slate-900 transition-all duration-500"></div>
                <div style={{ width: `${pFisco}%` }} className="h-full bg-rose-500 transition-all duration-500"></div>
                <div style={{ width: `${pLucro}%` }} className="h-full bg-emerald-500 transition-all duration-500"></div>
              </div>
              <div className="flex flex-wrap gap-x-6 gap-y-3 pt-1">
                <CompositionLabel dot="bg-slate-900" label="Estoque" perc={pCusto} />
                <CompositionLabel dot="bg-rose-500" label="Fisco" perc={pFisco} />
                <CompositionLabel dot="bg-emerald-500" label="Lucro" perc={pLucro} />
              </div>
            </div>
          </div>
          
          <div className="bg-slate-50 p-6 lg:p-10 lg:w-[350px] space-y-4 lg:space-y-5">
            <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest pb-4 border-b border-slate-200">Deduções de Saída</h5>
            <DetailRow label="ICMS Efetivo" value={results.precoVendaAlvo * (results.icmsVendaEfetivo / 100)} />
            <DetailRow label="PIS e COFINS" value={results.precoVendaAlvo * (inputs.pisCofinsVenda / 100)} />
            <DetailRow label="Comissão" value={results.precoVendaAlvo * (inputs.comissaoVenda / 100)} />
            <DetailRow label="Overhead" value={results.precoVendaAlvo * (inputs.custosFixos / 100)} />
            <div className="h-px bg-slate-200 my-2"></div>
            <DetailRow label="Lucro Net (R$)" value={results.margemAbsoluta} color="text-emerald-600 font-black" />
          </div>
        </div>
      </section>

      {/* Dynamic Price Matrix - Horizontal scroll on mobile */}
      <section className="space-y-6">
        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Cenários de Mercado</h3>
        <div className="flex lg:grid lg:grid-cols-5 gap-4 overflow-x-auto lg:overflow-x-visible no-scrollbar pb-4 -mx-4 px-4 lg:mx-0 lg:px-0">
          {priceMatrix.map((cat, idx) => (
            <div key={idx} className="min-w-[200px] lg:min-w-0 bg-white rounded-2xl border border-slate-200 p-5 space-y-4 hover:border-black transition-all hover:shadow-xl group shrink-0">
               <header className="flex justify-between items-center">
                 <span className="text-[9px] font-black text-black uppercase bg-slate-100 px-2 py-1 rounded-md">{cat.label}</span>
                 <span className="text-xs font-bold text-slate-400 group-hover:text-black">{cat.margin}%</span>
               </header>
               <div className="space-y-2.5">
                 {['A', 'B', 'C', 'D'].map(level => (
                   <div key={level} className="flex justify-between items-center text-[11px]">
                     <span className={`w-5 h-5 rounded flex items-center justify-center font-black text-white ${
                        level === 'A' ? 'bg-rose-500' : level === 'B' ? 'bg-amber-500' : level === 'C' ? 'bg-blue-500' : 'bg-emerald-500'
                     }`}>{level}</span>
                     <span className="font-mono font-black text-slate-700">{formatCurrency(cat.levels[level])}</span>
                   </div>
                 ))}
               </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

const KPIBox = ({ label, value, sub, color, icon }: any) => (
  <div className="bg-white p-4 lg:p-6 rounded-[1.2rem] lg:rounded-[2rem] border border-slate-200 shadow-sm transition-all btn-touch relative overflow-hidden">
    <div className="relative z-10">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[8px] lg:text-[9px] font-black text-slate-400 uppercase tracking-widest block truncate">{label}</span>
        {icon && <svg className={`w-3.5 h-3.5 lg:w-4 lg:h-4 text-slate-200`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d={icon}/></svg>}
      </div>
      <span className={`text-lg lg:text-2xl font-black font-mono ${color || 'text-slate-800'} tracking-tighter block truncate leading-none mb-2`}>{formatCurrency(value)}</span>
      <span className="text-[8px] font-black text-slate-400 uppercase tracking-tighter opacity-60 truncate">{sub}</span>
    </div>
    {/* Subtle background glow */}
    <div className="absolute -bottom-4 -right-4 w-12 h-12 bg-slate-50 rounded-full opacity-50"></div>
  </div>
);

const CompositionLabel = ({ dot, label, perc }: any) => (
  <div className="flex items-center gap-2">
    <div className={`w-1.5 h-1.5 rounded-full ${dot}`}></div>
    <span className="text-[8px] lg:text-[9px] font-black text-slate-400 uppercase tracking-tight">{label}</span>
    <span className="text-[8px] lg:text-[9px] font-black text-slate-800">{perc.toFixed(1)}%</span>
  </div>
);

const DetailRow = ({ label, value, color }: any) => (
  <div className="flex justify-between items-center text-[10px] lg:text-[11px]">
    <span className="font-bold text-slate-500 uppercase tracking-tighter truncate pr-2">{label}</span>
    <span className={`font-black font-mono ${color || 'text-slate-800'} shrink-0`}>{formatCurrency(value)}</span>
  </div>
);

export default ResultsTable;
