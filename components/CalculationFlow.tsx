
import React from 'react';
import { motion } from 'motion/react';
import { SimulationResults, SimulationInputs } from '../types';
import { formatCurrency } from '../utils/calculations';

interface CalculationFlowProps {
  results: SimulationResults;
  inputs: SimulationInputs;
}

interface FlowItem {
  label: string;
  value: number;
  perc?: number;
  note?: string;
}

interface Step {
  title: string;
  desc: string;
  items: FlowItem[];
  total: number;
  totalLabel: string;
  color: string;
  isSubtracted?: boolean;
  isHighlighted?: boolean;
}

const CalculationFlow: React.FC<CalculationFlowProps> = ({ results, inputs }) => {
  const isReverse = inputs.simulationMode === 'sellToBuy';
  const isScenario2027 = inputs.isCenario2027;

  const steps: Step[] = [
    {
      title: "1. Composição de Compra",
      desc: "Soma dos valores iniciais da nota fiscal de entrada.",
      items: [
        { label: "Valor de Compra", value: inputs.valorCompra },
        { label: isScenario2027 ? "IVA Entrada (IBS+CBS)" : "IPI", value: isScenario2027 ? results.creditoIcmsEntrada : results.valorIpi },
        { label: "Frete", value: inputs.freteValor },
      ],
      total: results.valorTotalNota,
      totalLabel: "Total Nota Fiscal",
      color: "blue"
    },
    {
      title: isScenario2027 ? "2. Crédito IVA Dual" : "2. Recuperação de Créditos",
      desc: isScenario2027 ? "Crédito imediato do imposto pago na aquisição." : "Impostos que retornam para a empresa como saldo credor.",
      items: isScenario2027 ? [
        { label: "Crédito IBS", value: results.valorIBS || 0 },
        { label: "Crédito CBS", value: results.valorCBS || 0 },
      ] : [
        { label: "Crédito ICMS", value: results.creditoIcmsEntrada },
        { label: "Crédito PIS/COFINS", value: results.creditoPisCofinsValor },
      ],
      total: isScenario2027 ? (results.valorIBS || 0) + (results.valorCBS || 0) : results.creditoIcmsEntrada + results.creditoPisCofinsValor,
      totalLabel: "Total Créditos",
      color: "emerald",
      isSubtracted: true
    },
    {
      title: "3. Custo Final Líquido",
      desc: "O valor real que o produto custa após impostos e taxas.",
      items: isScenario2027 ? [
        { label: "IVA Compensado", value: 0, note: "Não cumulativo" },
      ] : [
        { label: modeLabel(inputs.mode), value: results.stAPagar, note: "ICMS ST se aplicável" },
      ],
      total: results.custoFinal,
      totalLabel: "Custo de Aquisição Real",
      color: "slate"
    },
    {
      title: isScenario2027 ? "4. Débitos IVA Dual" : "4. Deduções de Venda",
      desc: isScenario2027 ? "Impostos incidentes sobre a nova receita." : "Custos que incidem sobre o faturamento bruto.",
      items: isScenario2027 ? [
        { label: "Débito IBS", value: results.valorIBS || 0, perc: inputs.ibsPerc },
        { label: "Débito CBS", value: results.valorCBS || 0, perc: inputs.cbsPerc },
        { label: "Comissão", value: results.precoVendaAlvo * (inputs.comissaoVenda / 100), perc: inputs.comissaoVenda },
        { label: "Overhead", value: results.precoVendaAlvo * (inputs.custosFixos / 100), perc: inputs.custosFixos },
      ] : [
        { label: "ICMS Saída", value: results.precoVendaAlvo * (results.icmsVendaEfetivo / 100), perc: results.icmsVendaEfetivo },
        { label: "PIS/COFINS Saída", value: results.precoVendaAlvo * (inputs.pisCofinsVenda / 100), perc: inputs.pisCofinsVenda },
        { label: "Comissão", value: results.precoVendaAlvo * (inputs.comissaoVenda / 100), perc: inputs.comissaoVenda },
        { label: "Overhead (Fixos)", value: results.precoVendaAlvo * (inputs.custosFixos / 100), perc: inputs.custosFixos },
      ],
      total: results.precoVendaAlvo * (results.totalDeducoesVendaPerc - (isReverse ? (results.margemAbsoluta / results.precoVendaAlvo * 100) : inputs.resultadoDesejado)) / 100,
      totalLabel: "Total Deduções",
      color: "rose"
    }
  ];

  function modeLabel(mode: string) {
    if (mode === 'substituido') return "ICMS ST (Entrada)";
    return "ICMS Próprio (Crédito)";
  }

  return (
    <div className="mt-12 space-y-12 animate-fade-in pb-20">
      <div className="flex items-center justify-between ml-2 mb-10">
        <div className="flex items-center gap-3">
          <div className="w-1.5 h-6 bg-indigo-600 rounded-full shadow-[0_0_15px_rgba(79,70,229,0.5)]"></div>
          <h3 className="text-sm font-black text-slate-900 uppercase tracking-[0.3em]">Fluxo Logístico de Cálculo</h3>
        </div>
        <div className="hidden md:flex gap-4">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-slate-100"></div>
            <span className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em]">Fluxo de Entrada</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-indigo-100"></div>
            <span className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em]">Fluxo de Saída</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 relative">
        {/* Decorative Background Lines */}
        <div className="hidden lg:block absolute top-[135px] left-[10%] right-[10%] h-[2px] bg-gradient-to-r from-transparent via-slate-100 to-transparent -z-10"></div>

        {steps.map((step, idx) => (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: idx * 0.1, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            key={idx} 
            className="relative flex flex-col group h-full"
          >
            {/* Glossy Effect Container */}
            <div className={`p-8 lg:p-10 rounded-[3rem] border bg-white shadow-[0_8px_30px_rgb(0,0,0,0.02)] transition-all duration-700 flex-1 flex flex-col relative overflow-hidden backdrop-blur-xl ${step.isHighlighted ? 'border-indigo-600 ring-8 ring-indigo-50/50 shadow-[0_20px_50px_rgba(79,70,229,0.1)]' : 'border-slate-100 hover:border-slate-200 hover:shadow-xl hover:-translate-y-1'}`}>
              
              {/* Highlight Background Glow */}
              {step.isHighlighted && (
                <div className="absolute -top-20 -right-20 w-40 h-40 bg-indigo-500/10 blur-[80px] rounded-full"></div>
              )}

              <div className="mb-8 relative z-10">
                 <div className="flex items-center justify-between mb-4">
                    <span className={`text-[9px] font-black uppercase tracking-[0.2em] px-3 py-1 rounded-full ${step.isHighlighted ? 'bg-indigo-600 text-white shadow-lg' : 'bg-slate-50 text-slate-400'}`}>
                      Etapa 0{idx + 1}
                    </span>
                 </div>
                 <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight mb-2 leading-none">{step.title}</h4>
                 <p className="text-[10px] font-bold text-slate-400 uppercase leading-relaxed h-8 line-clamp-2">{step.desc}</p>
              </div>

              <div className="space-y-4 flex-1 relative z-10">
                {step.items.map((item, iidx) => (
                  <div key={iidx} className="flex justify-between items-center group/item p-1 -mx-1 rounded-xl transition-colors">
                    <div className="flex flex-col">
                      <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{item.label}</span>
                      {item.perc !== undefined && <span className="text-[8px] font-bold text-indigo-400">({item.perc.toFixed(2)}%)</span>}
                      {item.note && <span className="text-[8px] font-bold text-indigo-500/60 uppercase tracking-tighter mt-0.5">{item.note}</span>}
                    </div>
                    <span className="text-[12px] font-black font-mono text-slate-700">{formatCurrency(item.value)}</span>
                  </div>
                ))}
              </div>

              <div className={`mt-10 pt-8 border-t relative z-10 ${step.isSubtracted ? 'border-emerald-100' : 'border-slate-100'} ${step.isHighlighted ? 'border-indigo-100' : ''}`}>
                <div className="flex justify-between items-end">
                  <div className="flex flex-col">
                    <span className={`text-[8px] font-black uppercase tracking-widest mb-1 ${step.isSubtracted ? 'text-emerald-500' : step.isHighlighted ? 'text-indigo-500' : 'text-slate-400'}`}>
                      {step.isSubtracted ? '(-) Abatimento' : step.isHighlighted ? '(✓) Objetivo' : '(=) Acumulado'}
                    </span>
                    <span className="text-[10px] font-black text-slate-900 uppercase tracking-tight">{step.totalLabel}</span>
                  </div>
                  <span className={`text-xl font-black font-mono tracking-tighter ${step.isSubtracted ? 'text-emerald-600' : step.isHighlighted ? 'text-indigo-600' : 'text-slate-900'}`}>
                    {formatCurrency(step.total)}
                  </span>
                </div>
              </div>

              {/* Decorative Corner Icon */}
              {step.isHighlighted && (
                <div className="absolute top-6 right-6">
                   <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center border border-indigo-100">
                     <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                     </svg>
                   </div>
                </div>
              )}
            </div>
            
            {/* Connector Arrow */}
            {idx < steps.length - 1 && (
              <div className="hidden lg:flex absolute -right-6 top-[135px] z-20 w-12 h-12 bg-white border border-slate-100 rounded-full items-center justify-center shadow-lg transform translate-x-1/2 -translate-y-1/2 group-hover:scale-110 transition-transform">
                <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center">
                  <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            )}
          </motion.div>
        ))}
      </div>

      {/* Hero Highlight Section: Final Result - COMPACT VERSION */}
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="bg-slate-900 rounded-[3rem] p-8 lg:p-14 text-white overflow-hidden relative shadow-2xl"
      >
        <div className="absolute inset-0 z-0 opacity-20">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-indigo-500/20 via-transparent to-transparent"></div>
        </div>
        
        <div className="relative z-10 flex flex-col lg:flex-row items-center gap-10 lg:gap-20">
          <div className="flex-1 space-y-6">
             <div className="inline-flex items-center gap-2.5 px-4 py-1.5 bg-white/5 rounded-xl border border-white/10 backdrop-blur-md">
               <div className="w-1.5 h-1.5 rounded-full bg-indigo-400"></div>
               <span className="text-[9px] font-black uppercase tracking-[0.3em] text-indigo-300/80">Tagway Core</span>
             </div>
             
             <div className="space-y-3">
               <h2 className="text-3xl lg:text-5xl font-black italic tracking-tighter leading-none">
                  Preço <span className="text-indigo-400">Determinístico</span>
               </h2>
               <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wide leading-relaxed max-w-md">
                  O algoritmo isola a margem líquida de <span className="text-white">{isReverse ? (results.margemAbsoluta / (results.precoVendaAlvo || 1) * 100).toFixed(2) : inputs.resultadoDesejado}%</span>, tornando-a imune a variações tributárias no fluxo de {isScenario2027 ? 'IVA Dual' : 'Substituição'}.
               </p>
             </div>

             <div className="flex gap-8 pt-2">
               <div className="space-y-0.5">
                 <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest block">Base</span>
                 <p className="text-sm font-black font-mono text-white">{formatCurrency(results.custoFinal)}</p>
               </div>
               <div className="space-y-0.5">
                 <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest block">Mark-up</span>
                 <p className="text-sm font-black font-mono text-indigo-400">{(divisor(results.totalDeducoesVendaPerc)).toFixed(4)}</p>
               </div>
             </div>
          </div>
          
          <div className="w-full lg:w-auto">
            <div className="px-10 py-10 lg:px-14 lg:py-12 bg-gradient-to-br from-white/10 to-white/5 rounded-[2.5rem] border border-white/10 backdrop-blur-3xl text-center flex flex-col justify-center gap-4 min-w-[280px]">
               <span className="text-[10px] font-black uppercase tracking-[0.4em] text-indigo-300/60">Venda Sugerida</span>
               <p className="text-5xl lg:text-7xl font-black font-mono text-white tracking-tighter leading-none">
                 {formatCurrency(results.precoVendaAlvo)}
               </p>
               <div className="flex items-center justify-center gap-2 mt-2">
                 <div className="w-1 h-1 rounded-full bg-emerald-500"></div>
                 <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest">Margem Preservada</span>
               </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

function divisor(deducoes: number) {
  return (100 - deducoes) / 100;
}

export default CalculationFlow;

