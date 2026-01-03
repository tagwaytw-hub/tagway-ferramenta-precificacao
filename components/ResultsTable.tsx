
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
    <div className="space-y-10">
      {/* Hero KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <KPIBox label="Total NF-e" value={results.valorTotalNota} sub="Base Bruta" />
        <KPIBox label="Créditos Fiscais" value={results.creditoIcmsEntrada + results.creditoPisCofinsValor} sub="Ativo Recuperável" color="text-blue-600" />
        <KPIBox label="Impostos Saída" value={results.impostosTotais} sub="Carga Tributária" color="text-rose-500" />
        <KPIBox label="Custo Líquido" value={results.custoFinal} sub="Break Even" color="text-slate-900" />
      </div>

      {/* Sugestão de Preço Principal */}
      <section className="bg-white rounded-[2.5rem] border border-slate-200 overflow-hidden shadow-2xl shadow-blue-500/5 group">
        <div className="flex flex-col lg:flex-row">
          <div className="flex-1 p-8 md:p-12 space-y-8">
            <header className="flex justify-between items-center">
              <div>
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Proposta Comercial</h3>
                <h4 className="text-2xl font-black text-slate-800 tracking-tighter mt-1">Sugerido para {inputs.resultadoDesejado}% Net</h4>
              </div>
              <div className="bg-blue-50 text-blue-600 p-4 rounded-3xl group-hover:scale-110 transition-transform">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
              </div>
            </header>

            <div className="bg-blue-600 rounded-[2rem] p-10 md:p-14 text-white text-center shadow-xl shadow-blue-600/20 group">
              <span className="text-[10px] font-black uppercase tracking-[0.5em] opacity-60">Valor Unitário Alvo</span>
              <div className="text-6xl md:text-7xl font-black font-mono tracking-tighter mt-4 leading-none">{formatCurrency(results.precoVendaAlvo)}</div>
            </div>

            {/* Composição Analítica */}
            <div className="space-y-4">
              <div className="flex justify-between items-end">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Estrutura de Preço</span>
                <span className="text-[10px] font-black text-slate-800 uppercase bg-slate-100 px-3 py-1 rounded-full">100% Volume</span>
              </div>
              <div className="w-full h-4 bg-slate-100 rounded-full flex overflow-hidden">
                <div style={{ width: `${pCusto}%` }} className="h-full bg-slate-900 transition-all duration-700"></div>
                <div style={{ width: `${pFisco}%` }} className="h-full bg-rose-500 transition-all duration-700"></div>
                <div style={{ width: `${pLucro}%` }} className="h-full bg-emerald-500 transition-all duration-700"></div>
              </div>
              <div className="flex flex-wrap gap-6 pt-2">
                <CompositionLabel dot="bg-slate-900" label="Custo" perc={pCusto} />
                <CompositionLabel dot="bg-rose-500" label="Impostos" perc={pFisco} />
                <CompositionLabel dot="bg-emerald-500" label="Lucro Net" perc={pLucro} />
              </div>
            </div>
          </div>
          
          <div className="bg-slate-50 border-l border-slate-200 p-8 md:p-12 lg:w-[400px] flex flex-col justify-center gap-6">
            <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-200 pb-4">Detalhamento</h5>
            <DetailRow label="ICMS de Saída" value={results.precoVendaAlvo * (results.icmsVendaEfetivo / 100)} />
            <DetailRow label="PIS/COFINS Venda" value={results.precoVendaAlvo * (inputs.pisCofinsVenda / 100)} />
            <DetailRow label="Comissão Operacional" value={results.precoVendaAlvo * (inputs.comissaoVenda / 100)} />
            <DetailRow label="Custo Operacional Fixo" value={results.precoVendaAlvo * (inputs.custosFixos / 100)} />
            <div className="h-px bg-slate-200 my-2"></div>
            <DetailRow label="Lucro Líquido (R$)" value={results.margemAbsoluta} color="text-emerald-600 font-black" />
          </div>
        </div>
      </section>

      {/* Matriz Dinâmica Responsiva */}
      <section className="space-y-6">
        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Escalonamento Dinâmico</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {priceMatrix.map((cat, idx) => (
            <div key={idx} className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4 hover:shadow-xl transition-all hover:border-blue-300">
               <header className="flex justify-between items-center mb-4">
                 <span className="text-[10px] font-black text-blue-600 uppercase tracking-tighter bg-blue-50 px-2.5 py-1 rounded-lg">{cat.label}</span>
                 <span className="text-xs font-bold text-slate-400">{cat.margin}%</span>
               </header>
               <div className="space-y-3">
                 {['A', 'B', 'C', 'D'].map(level => (
                   <div key={level} className="flex justify-between items-center group/item">
                     <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-black text-white ${
                        level === 'A' ? 'bg-rose-500' : level === 'B' ? 'bg-amber-500' : level === 'C' ? 'bg-blue-500' : 'bg-emerald-500'
                     }`}>{level}</span>
                     <span className="text-xs font-black font-mono text-slate-700 group-hover/item:text-slate-900 transition-colors">{formatCurrency(cat.levels[level])}</span>
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
  <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm flex flex-col justify-between hover:shadow-lg transition-shadow">
    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</span>
    <span className={`text-2xl font-black font-mono ${color || 'text-slate-800'} tracking-tighter`}>{formatCurrency(value)}</span>
    <span className="text-[8px] font-black text-slate-400 uppercase tracking-tighter mt-3 opacity-60">{sub}</span>
  </div>
);

const CompositionLabel = ({ dot, label, perc }: any) => (
  <div className="flex items-center gap-2.5">
    <div className={`w-2.5 h-2.5 rounded-full ${dot}`}></div>
    <div className="flex flex-col">
      <span className="text-[8px] font-black text-slate-400 uppercase tracking-tighter">{label}</span>
      <span className="text-[11px] font-black text-slate-800">{perc.toFixed(1)}%</span>
    </div>
  </div>
);

const DetailRow = ({ label, value, color }: any) => (
  <div className="flex justify-between items-center">
    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-tighter">{label}</span>
    <span className={`text-xs font-bold font-mono ${color || 'text-slate-800'}`}>{formatCurrency(value)}</span>
  </div>
);

export default ResultsTable;
