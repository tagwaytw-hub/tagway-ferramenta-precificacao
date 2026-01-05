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
    <div className="space-y-10 pb-12">
      {/* Hero KPIs - 2 columns on mobile, 4 on desktop */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
        <KPIBox label="Total NF-e" value={results.valorTotalNota} sub="Base Bruta" />
        <KPIBox label="Créditos Fiscais" value={results.creditoIcmsEntrada + results.creditoPisCofinsValor} sub="Ativo Recuperável" color="text-blue-600" />
        <KPIBox label="Impostos Saída" value={results.impostosTotais} sub="Carga Tributária" color="text-rose-500" />
        <KPIBox label="Custo Líquido" value={results.custoFinal} sub="Break Even" color="text-slate-900" />
      </div>

      {/* Main Pricing Card */}
      <section className="bg-white rounded-[2rem] border border-slate-200 overflow-hidden shadow-2xl shadow-black/5">
        <div className="flex flex-col lg:flex-row divide-y lg:divide-y-0 lg:divide-x divide-slate-100">
          <div className="flex-1 p-6 md:p-10 space-y-8">
            <header className="flex justify-between items-start">
              <div className="space-y-1">
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Price Intelligence</h3>
                <h4 className="text-xl md:text-2xl font-black text-slate-800 tracking-tighter">Sugerido p/ Meta {inputs.resultadoDesejado}%</h4>
              </div>
              <div className="bg-black text-white p-3 md:p-4 rounded-2xl shadow-lg">
                <svg className="w-5 h-5 md:w-6 md:h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
              </div>
            </header>

            <div className="bg-black rounded-[1.5rem] md:rounded-[2rem] p-8 md:p-12 text-white text-center shadow-2xl shadow-black/20 border border-white/5">
              <span className="text-[9px] font-black uppercase tracking-[0.4em] opacity-40">Valor Unitário Alvo</span>
              <div className="text-4xl md:text-6xl lg:text-7xl font-black font-mono tracking-tighter mt-4 leading-none">{formatCurrency(results.precoVendaAlvo)}</div>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-end">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Composição Analítica</span>
              </div>
              <div className="w-full h-3 bg-slate-100 rounded-full flex overflow-hidden ring-1 ring-slate-200/50">
                <div style={{ width: `${pCusto}%` }} className="h-full bg-slate-900"></div>
                <div style={{ width: `${pFisco}%` }} className="h-full bg-rose-500"></div>
                <div style={{ width: `${pLucro}%` }} className="h-full bg-emerald-500"></div>
              </div>
              <div className="flex flex-wrap gap-x-6 gap-y-2 pt-1">
                <CompositionLabel dot="bg-slate-900" label="Custo" perc={pCusto} />
                <CompositionLabel dot="bg-rose-500" label="Fisco" perc={pFisco} />
                <CompositionLabel dot="bg-emerald-500" label="Net" perc={pLucro} />
              </div>
            </div>
          </div>
          
          <div className="bg-slate-50 p-6 md:p-10 lg:w-[350px] space-y-5">
            <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest pb-4 border-b border-slate-200">Deduções Variáveis</h5>
            <DetailRow label="ICMS Saída" value={results.precoVendaAlvo * (results.icmsVendaEfetivo / 100)} />
            <DetailRow label="PIS/COFINS" value={results.precoVendaAlvo * (inputs.pisCofinsVenda / 100)} />
            <DetailRow label="Comissão" value={results.precoVendaAlvo * (inputs.comissaoVenda / 100)} />
            <DetailRow label="Fixos/Overhead" value={results.precoVendaAlvo * (inputs.custosFixos / 100)} />
            <div className="h-px bg-slate-200 my-2"></div>
            <DetailRow label="Net Profit (R$)" value={results.margemAbsoluta} color="text-emerald-600 font-black" />
          </div>
        </div>
      </section>

      {/* Dynamic Price Matrix */}
      <section className="space-y-6">
        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Escalonamento de Margens</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {priceMatrix.map((cat, idx) => (
            <div key={idx} className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4 hover:border-black transition-all hover:shadow-xl group">
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

const KPIBox = ({ label, value, sub, color }: any) => (
  <div className="bg-white p-4 md:p-6 rounded-[1.5rem] md:rounded-[2rem] border border-slate-200 shadow-sm hover:shadow-lg transition-all">
    <span className="text-[8px] md:text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 block">{label}</span>
    <span className={`text-lg md:text-2xl font-black font-mono ${color || 'text-slate-800'} tracking-tighter block truncate`}>{formatCurrency(value)}</span>
    <span className="text-[8px] font-black text-slate-400 uppercase tracking-tighter mt-3 block opacity-60 truncate">{sub}</span>
  </div>
);

const CompositionLabel = ({ dot, label, perc }: any) => (
  <div className="flex items-center gap-2">
    <div className={`w-2 h-2 rounded-full ${dot}`}></div>
    <span className="text-[9px] font-black text-slate-400 uppercase">{label}</span>
    <span className="text-[9px] font-black text-slate-800">{perc.toFixed(1)}%</span>
  </div>
);

const DetailRow = ({ label, value, color }: any) => (
  <div className="flex justify-between items-center text-[10px] md:text-[11px]">
    <span className="font-bold text-slate-500 uppercase tracking-tighter">{label}</span>
    <span className={`font-black font-mono ${color || 'text-slate-800'}`}>{formatCurrency(value)}</span>
  </div>
);

export default ResultsTable;
