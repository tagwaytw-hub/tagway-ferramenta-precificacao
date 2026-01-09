
import React from 'react';
import { SimulationResults, SimulationInputs } from '../types';
import { formatCurrency } from '../utils/calculations';

interface ResumoFiscalViewProps {
  results: SimulationResults;
  inputs: SimulationInputs;
}

const ResumoFiscalView: React.FC<ResumoFiscalViewProps> = ({ results, inputs }) => {
  const cargaTributariaPerc = results.precoVendaAlvo > 0 
    ? (results.impostosTotais / results.precoVendaAlvo) * 100 
    : 0;

  const pisCofinsVendaValor = results.precoVendaAlvo * (inputs.pisCofinsVenda / 100);
  const icmsVendaValor = results.precoVendaAlvo * (results.icmsVendaEfetivo / 100);

  return (
    <div className="max-w-5xl mx-auto space-y-10 pb-20 animate-slide-up">
      <header className="border-b border-slate-200 pb-8">
        <h2 className="text-4xl font-black text-slate-900 tracking-tighter uppercase italic leading-tight">Resumo Fiscal</h2>
        <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px] mt-2">Detalhamento Determinístico de Tributos</p>
      </header>

      {/* KPIs de Impostos */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <TaxCard label="ICMS ST a Recolher" value={results.stAPagar} color="text-rose-500" sub="Substituição Tributária" />
        <TaxCard label="ICMS Próprio (Venda)" value={icmsVendaValor} color="text-amber-600" sub={`Alíquota Efetiva: ${results.icmsVendaEfetivo}%`} />
        <TaxCard label="PIS / COFINS (Venda)" value={pisCofinsVendaValor} color="text-blue-600" sub={`Alíquota: ${inputs.pisCofinsVenda}%`} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Quadro Geral de Tributos */}
        <section className="bg-white rounded-[2.5rem] p-8 border border-slate-200 shadow-sm space-y-6">
          <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
            <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>
            Composição Tributária Total
          </h3>
          
          <div className="space-y-4">
            <TaxRow label="ICMS Substituição (ST)" value={results.stAPagar} />
            <TaxRow label="ICMS Débito Venda" value={icmsVendaValor} />
            <TaxRow label="PIS/COFINS Débito Venda" value={pisCofinsVendaValor} />
            <div className="h-px bg-slate-100 my-2"></div>
            <div className="flex justify-between items-center py-2">
              <span className="text-xs font-black text-slate-900 uppercase">Impostos Totais Absolutos</span>
              <span className="text-xl font-black text-rose-600 font-mono tracking-tighter">{formatCurrency(results.impostosTotais)}</span>
            </div>
            <div className="bg-slate-50 rounded-2xl p-6 flex items-center justify-between border border-slate-100">
              <div className="space-y-1">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Carga Tributária Total</span>
                <p className="text-[10px] text-slate-500 font-bold uppercase italic leading-none">Sobre Preço de Venda</p>
              </div>
              <div className="text-3xl font-black text-slate-900 tracking-tighter font-mono">{cargaTributariaPerc.toFixed(2)}%</div>
            </div>
          </div>
        </section>

        {/* Quadro de Preços e Equilíbrio */}
        <section className="bg-slate-900 rounded-[2.5rem] p-8 text-white shadow-2xl space-y-10">
          <h3 className="text-[11px] font-black text-white/30 uppercase tracking-[0.2em]">Metas e Viabilidade</h3>
          
          <div className="space-y-8">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-[9px] font-black text-white/40 uppercase tracking-widest block">Preço de Equilíbrio</span>
                <p className="text-[10px] text-white/20 font-bold uppercase italic leading-none">Margem Zero / Payback</p>
              </div>
              <div className="text-2xl font-black text-white font-mono tracking-tighter">{formatCurrency(results.precoEquilibrio)}</div>
            </div>

            <div className="h-px bg-white/5"></div>

            <div className="space-y-4">
              <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest block">Preço de Venda Alvo</span>
              <div className="flex items-baseline gap-2">
                <span className="text-5xl font-black text-white tracking-tighter font-mono italic">{formatCurrency(results.precoVendaAlvo)}</span>
                <span className="text-xs font-black text-white/30 uppercase tracking-widest italic">/ un</span>
              </div>
              <div className="flex gap-4 pt-4">
                 <div className="flex-1 bg-white/5 rounded-2xl p-4 border border-white/5">
                   <span className="text-[8px] font-black text-white/30 uppercase tracking-widest block mb-1">Lucro Unitário</span>
                   <span className="text-lg font-black text-emerald-400 font-mono tracking-tighter">{formatCurrency(results.margemAbsoluta)}</span>
                 </div>
                 <div className="flex-1 bg-white/5 rounded-2xl p-4 border border-white/5">
                   <span className="text-[8px] font-black text-white/30 uppercase tracking-widest block mb-1">Deduções Totais</span>
                   <span className="text-lg font-black text-rose-400 font-mono tracking-tighter">{results.totalDeducoesVendaPerc}%</span>
                 </div>
              </div>
            </div>
          </div>
          
          <div className="pt-4">
             <div className="text-[9px] font-bold text-white/20 uppercase tracking-widest leading-relaxed">
               As simulações acima consideram o regime tributário atual e a rota fiscal {inputs.ufOrigem} → {inputs.ufDestino}. Qualquer alteração nos parâmetros de entrada invalidará este resumo.
             </div>
          </div>
        </section>
      </div>
    </div>
  );
};

const TaxCard = ({ label, value, color, sub }: any) => (
  <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm hover:shadow-lg transition-all group overflow-hidden relative">
    <div className="relative z-10">
      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 block">{label}</span>
      <span className={`text-2xl font-black font-mono ${color} tracking-tighter block truncate`}>{formatCurrency(value)}</span>
      <span className="text-[8px] font-black text-slate-400 uppercase tracking-tighter mt-4 block opacity-60 truncate">{sub}</span>
    </div>
  </div>
);

const TaxRow = ({ label, value }: { label: string; value: number }) => (
  <div className="flex justify-between items-center py-1">
    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">{label}</span>
    <span className="text-xs font-black text-slate-800 font-mono">{formatCurrency(value)}</span>
  </div>
);

export default ResumoFiscalView;
