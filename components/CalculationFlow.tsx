
import React from 'react';
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
      color: "slate",
      isHighlighted: true
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
    <div className="mt-12 space-y-8 animate-fade-in">
      <div className="flex items-center gap-3 ml-2 mb-8">
        <div className="w-1.5 h-6 bg-slate-900 rounded-full"></div>
        <h3 className="text-sm font-black text-slate-900 uppercase tracking-[0.2em]">Fluxo Logístico de Cálculo</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative">
        {/* Connection arrows for large screens */}
        <div className="hidden lg:block absolute top-[120px] left-0 right-0 h-px bg-slate-100 -z-10"></div>

        {steps.map((step, idx) => (
          <div key={idx} className="relative flex flex-col group">
            <div className={`p-8 rounded-[2.5rem] border bg-white shadow-sm transition-all duration-500 flex-1 flex flex-col ${step.isHighlighted ? 'border-slate-900 ring-4 ring-slate-50' : 'border-slate-100 hover:border-slate-200'}`}>
              <div className="mb-6">
                 <h4 className="text-[11px] font-black text-slate-900 uppercase tracking-tight mb-2 underline decoration-indigo-500/30 underline-offset-4">{step.title}</h4>
                 <p className="text-[9px] font-bold text-slate-400 uppercase leading-relaxed">{step.desc}</p>
              </div>

              <div className="space-y-3 flex-1">
                {step.items.map((item, iidx) => (
                  <div key={iidx} className="flex justify-between items-center group/item">
                    <div className="flex flex-col">
                      <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{item.label}</span>
                      {item.perc !== undefined && <span className="text-[7px] font-bold text-slate-300">({item.perc}%)</span>}
                      {item.note && <span className="text-[7px] font-bold text-indigo-400 uppercase">{item.note}</span>}
                    </div>
                    <span className="text-[11px] font-black font-mono text-slate-600">{formatCurrency(item.value)}</span>
                  </div>
                ))}
              </div>

              <div className={`mt-8 pt-6 border-t ${step.isSubtracted ? 'border-emerald-100' : 'border-slate-100'}`}>
                <div className="flex justify-between items-end">
                  <div className="flex flex-col">
                    <span className={`text-[7px] font-black uppercase tracking-widest ${step.isSubtracted ? 'text-emerald-500' : 'text-slate-400'}`}>
                      {step.isSubtracted ? '(-) ABATIMENTO' : '(=) ACUMULADO'}
                    </span>
                    <span className="text-[9px] font-black text-slate-900 uppercase tracking-tight">{step.totalLabel}</span>
                  </div>
                  <span className={`text-lg font-black font-mono tracking-tighter ${step.isSubtracted ? 'text-emerald-600' : 'text-slate-900'}`}>
                    {formatCurrency(step.total)}
                  </span>
                </div>
              </div>
            </div>
            
            {idx < steps.length - 1 && (
              <div className="hidden lg:flex absolute -right-3 top-[110px] z-20 w-6 h-6 bg-white border border-slate-100 rounded-full items-center justify-center shadow-sm">
                <svg className="w-3 h-3 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M9 5l7 7-7 7" />
                </svg>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Final Verification Block */}
      <div className="bg-slate-900 rounded-[2.5rem] p-10 lg:p-16 text-white overflow-hidden relative group">
        <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-indigo-500/10 via-transparent to-transparent"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-12">
          <div className="space-y-6 max-w-xl">
             <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-indigo-500/20 rounded-full border border-indigo-500/30">
               <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse"></div>
               <span className="text-[10px] font-black uppercase tracking-widest text-indigo-300">Equação Final de Rentabilidade</span>
             </div>
             <h2 className="text-3xl lg:text-5xl font-black italic tracking-tighter leading-[1.1]">
                Como chegamos no <span className="text-indigo-400">Preço de Venda Sugerido</span>?
             </h2>
             <p className="text-sm lg:text-base font-bold text-white/50 leading-relaxed uppercase tracking-wide">
                Dividimos o <span className="text-white">Custo Real ({formatCurrency(results.custoFinal)})</span> pelo 
                fator remanescente da receita <span className="text-white">({(100 - results.totalDeducoesVendaPerc).toFixed(2)}%)</span>.
                Isso garante que, após todas as deduções, sobrem exatamente os <span className="text-emerald-400">{isReverse ? results.margemAbsoluta.toFixed(2) : inputs.resultadoDesejado}%</span> planejados.
             </p>
          </div>
          
          <div className="w-full md:w-auto p-8 lg:p-12 bg-white/5 rounded-[3rem] border border-white/10 backdrop-blur-sm text-center space-y-4 min-w-[300px]">
             <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40 block">Resultado do Algoritmo</span>
             <p className="text-5xl lg:text-7xl font-black font-mono text-emerald-400 tracking-tighter italic">
               {formatCurrency(results.precoVendaAlvo)}
             </p>
             <div className="flex justify-center gap-1.5">
               <div className="h-1.5 w-8 bg-emerald-500/30 rounded-full"></div>
               <div className="h-1.5 w-2 bg-emerald-500/30 rounded-full"></div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CalculationFlow;
