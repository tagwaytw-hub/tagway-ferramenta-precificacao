
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
      {/* Hero KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
        <KPIBox label="Total NF-e" value={results.valorTotalNota} sub="Valor Bruto Compra" />
        <KPIBox label="Créditos Fiscais" value={results.creditoIcmsEntrada + results.creditoPisCofinsValor} sub="Ativo Recuperável" color="text-blue-600" />
        <KPIBox label="Impostos Saída" value={results.impostosTotais} sub="Carga Tributária" color="text-rose-500" />
        <KPIBox label="Custo Líquido" value={results.custoFinal} sub="Custo Mercadoria" color="text-slate-900" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Detalhamento de Créditos (Novo) */}
        <section className="bg-white rounded-[2rem] border border-slate-200 p-8 space-y-6 shadow-sm">
           <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest pb-4 border-b border-slate-100 flex items-center gap-2">
             <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
             Créditos Recuperáveis
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
        <section className="bg-white rounded-[2rem] border border-slate-200 p-8 space-y-6 shadow-sm">
           <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest pb-4 border-b border-slate-100">Composição NF-e</h5>
           <div className="space-y-4">
             <DetailRow label="Valor Líquido" value={inputs.valorCompra} />
             <DetailRow label="IPI" value={results.valorIpi} />
             <DetailRow label="Frete" value={inputs.freteValor} />
             <div className="h-px bg-slate-100 my-2"></div>
             <div className="flex justify-between items-center">
                <span className="text-[10px] font-black text-slate-900 uppercase">Total Nota</span>
                <span className="text-sm font-black text-slate-900 font-mono">{formatCurrency(results.valorTotalNota)}</span>
             </div>
           </div>
        </section>

        {/* Custo Mercadoria (Final) */}
        <section className="bg-slate-900 rounded-[2rem] p-8 space-y-6 shadow-2xl text-white">
           <h5 className="text-[10px] font-black text-white/30 uppercase tracking-widest pb-4 border-b border-white/5">Resultado Unitário</h5>
           <div className="space-y-6">
             <div>
               <span className="text-[9px] font-black text-white/40 uppercase tracking-widest block mb-2">Custo Mercadoria (Líquido)</span>
               <div className="text-3xl font-black font-mono tracking-tighter text-emerald-400">{formatCurrency(results.custoFinal)}</div>
             </div>
             <div className="h-px bg-white/5"></div>
             <div>
               <span className="text-[9px] font-black text-white/40 uppercase tracking-widest block mb-2">Preço de Venda Sugerido</span>
               <div className="text-4xl font-black font-mono tracking-tighter text-white">{formatCurrency(results.precoVendaAlvo)}</div>
             </div>
           </div>
        </section>
      </div>

      {/* Main Analysis Card */}
      <section className="bg-white rounded-[2rem] border border-slate-200 overflow-hidden shadow-2xl shadow-black/5">
        <div className="flex flex-col lg:flex-row divide-y lg:divide-y-0 lg:divide-x divide-slate-100">
          <div className="flex-1 p-6 md:p-10 space-y-8">
            <header className="flex justify-between items-start">
              <div className="space-y-1">
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Análise de Margem</h3>
                <h4 className="text-xl md:text-2xl font-black text-slate-800 tracking-tighter">Composição do Preço {inputs.resultadoDesejado}% Net</h4>
              </div>
            </header>

            <div className="space-y-4">
              <div className="w-full h-3 bg-slate-100 rounded-full flex overflow-hidden ring-1 ring-slate-200/50">
                <div style={{ width: `${pCusto}%` }} className="h-full bg-slate-900 transition-all duration-500"></div>
                <div style={{ width: `${pFisco}%` }} className="h-full bg-rose-500 transition-all duration-500"></div>
                <div style={{ width: `${pLucro}%` }} className="h-full bg-emerald-500 transition-all duration-500"></div>
              </div>
              <div className="flex flex-wrap gap-x-6 gap-y-2 pt-1">
                <CompositionLabel dot="bg-slate-900" label="Custo de Estoque" perc={pCusto} />
                <CompositionLabel dot="bg-rose-500" label="Impostos e Taxas" perc={pFisco} />
                <CompositionLabel dot="bg-emerald-500" label="Margem Líquida" perc={pLucro} />
              </div>
            </div>
          </div>
          
          <div className="bg-slate-50 p-6 md:p-10 lg:w-[350px] space-y-5">
            <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest pb-4 border-b border-slate-200">Deduções sobre Venda</h5>
            <DetailRow label="ICMS Saída" value={results.precoVendaAlvo * (results.icmsVendaEfetivo / 100)} />
            <DetailRow label="PIS e COFINS" value={results.precoVendaAlvo * (inputs.pisCofinsVenda / 100)} />
            <DetailRow label="Comissão" value={results.precoVendaAlvo * (inputs.comissaoVenda / 100)} />
            <DetailRow label="Custo Fixo (Overhead)" value={results.precoVendaAlvo * (inputs.custosFixos / 100)} />
            <div className="h-px bg-slate-200 my-2"></div>
            <DetailRow label="Lucro Líquido (R$)" value={results.margemAbsoluta} color="text-emerald-600 font-black" />
          </div>
        </div>
      </section>

      {/* Dynamic Price Matrix */}
      <section className="space-y-6">
        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Simulador de Cenários</h3>
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
    <span className="text-[9px] font-black text-slate-400 uppercase tracking-tight">{label}</span>
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
