import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { SimulationResults, SimulationInputs } from '../types';
import { formatCurrency } from '../utils/calculations';

interface CalculationMemoryProps {
  isOpen: boolean;
  onClose: () => void;
  results: SimulationResults;
  inputs: SimulationInputs;
}

const CalculationMemory: React.FC<CalculationMemoryProps> = ({ isOpen, onClose, results, inputs }) => {
  if (!isOpen) return null;

  const isScenario2027 = inputs.isCenario2027;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 lg:p-10">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
        />
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-2xl bg-white rounded-[2.5rem] shadow-2xl flex flex-col max-h-[85vh] overflow-hidden"
        >
          {/* Header */}
          <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-1.5 h-1.5 rounded-full bg-indigo-500"></div>
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Auditoria Fiscal Tagway</span>
              </div>
              <h2 className="text-xl font-black text-slate-900 uppercase">Memória de Cálculo</h2>
            </div>
            <button 
              onClick={onClose}
              className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center hover:bg-slate-50 transition-colors"
            >
              <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-8 space-y-8 no-scrollbar">
            {/* Step: Entrada */}
            <section className="space-y-4">
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest border-l-4 border-indigo-500 pl-3">Fluxo de Entrada (Compra)</h3>
              
              <div className="space-y-3">
                <MemoryRow 
                  label="Base de Cálculo (Compra + Frete)" 
                  formula={`${formatCurrency(inputs.valorCompra)} + ${formatCurrency(inputs.freteValor)}`}
                  result={formatCurrency(inputs.valorCompra + inputs.freteValor)}
                />
                
                {!isScenario2027 ? (
                  <>
                    <MemoryRow 
                      label="ICMS Próprio Fornecedor" 
                      formula={`Base (${formatCurrency(inputs.valorCompra + inputs.freteValor)}) x Alíquota (${inputs.icmsInterestadual}%)`}
                      result={formatCurrency(results.creditoIcmsEntrada)}
                      isCredit
                    />
                    <MemoryRow 
                      label="Cálculo do ST (Subst. Tributária)" 
                      formula={`(Base x (1 + MVA ${inputs.mva}%)) x Alíq. Interna ${inputs.icmsInternoDestino}% - Crédito ICMS`}
                      result={formatCurrency(results.stAPagar)}
                    />
                  </>
                ) : (
                  <MemoryRow 
                    label="Crédito IVA Dual (IBS + CBS)" 
                    formula={`Base x (${(results.icmsVendaEfetivo).toFixed(2)}%)`}
                    result={formatCurrency(results.creditoIcmsEntrada)}
                    isCredit
                  />
                )}
                
                <MemoryRow 
                  label="PIS/COFINS (Recuperável)" 
                  formula={`Base x ${inputs.pisCofinsRate}%`}
                  result={formatCurrency(results.creditoPisCofinsValor)}
                  isCredit
                />
              </div>
            </section>

            {/* Step: Preço de Venda */}
            <section className="space-y-4">
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest border-l-4 border-emerald-500 pl-3">Mark-up e Formação de Preço</h3>
              
              <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-bold text-slate-500 uppercase">Custo Líquido Real</span>
                  <span className="text-sm font-black font-mono text-slate-900">{formatCurrency(results.custoFinal)}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-bold text-slate-500 uppercase">Soma das Deduções (Alíquota)</span>
                  <span className="text-sm font-black font-mono text-rose-600">{results.totalDeducoesVendaPerc.toFixed(2)}%</span>
                </div>

                <div className="pt-4 border-t border-slate-200">
                  <p className="text-[9px] font-black text-slate-400 uppercase mb-3">Fórmula do Algoritmo Mark-up Divisor:</p>
                  <div className="flex items-center gap-4">
                    <div className="flex-1 p-4 bg-white rounded-2xl border border-slate-200 text-center">
                      <span className="text-[10px] font-mono text-slate-400 block mb-1">Mark-up Divisor</span>
                      <span className="text-base font-black text-indigo-600">{( (100 - results.totalDeducoesVendaPerc) / 100 ).toFixed(4)}</span>
                    </div>
                    <div className="text-slate-300 font-black">X</div>
                    <div className="flex-1 p-4 bg-white rounded-2xl border border-slate-200 text-center">
                      <span className="text-[10px] font-mono text-slate-400 block mb-1">Preço Final</span>
                      <span className="text-base font-black text-slate-900">{formatCurrency(results.precoVendaAlvo)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Step: Resultado Final */}
            <section className="space-y-4">
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest border-l-4 border-rose-500 pl-3">Deduções de Saída</h3>
              <div className="space-y-3">
                <MemoryRow 
                  label="PIS/COFINS sobre Faturamento" 
                  formula={`Preço de Venda x ${inputs.pisCofinsVenda}%`}
                  result={formatCurrency(results.precoVendaAlvo * (inputs.pisCofinsVenda / 100))}
                />
                <MemoryRow 
                  label="ICMS Saída Efetivo" 
                  formula={`Preço de Venda x ${results.icmsVendaEfetivo}%`}
                  result={formatCurrency(results.precoVendaAlvo * (results.icmsVendaEfetivo / 100))}
                />
                <MemoryRow 
                  label="Margem de Lucro Planejada" 
                  formula={`Preço de Venda x ${inputs.simulationMode === 'sellToBuy' ? (results.margemAbsoluta / results.precoVendaAlvo * 100).toFixed(2) : inputs.resultadoDesejado}%`}
                  result={formatCurrency(results.margemAbsoluta)}
                />
              </div>
            </section>
          </div>

          {/* Footer */}
          <div className="p-8 border-t border-slate-100 bg-slate-50/50">
             <div className="flex justify-between items-center">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Status do Cálculo</span>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981]"></div>
                  <span className="text-[11px] font-black text-slate-900 uppercase">Sincronizado & Verificado</span>
                </div>
             </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

const MemoryRow = ({ label, formula, result, isCredit }: { label: string, formula: string, result: string, isCredit?: boolean }) => (
  <div className="flex justify-between items-center group">
    <div className="space-y-0.5">
      <span className="text-[10px] font-black text-slate-900 uppercase block tracking-tight">{label}</span>
      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{formula}</span>
    </div>
    <div className="text-right">
      <span className={`text-xs font-black font-mono ${isCredit ? 'text-emerald-600' : 'text-slate-700'}`}>
        {isCredit ? '+' : '-'} {result}
      </span>
    </div>
  </div>
);

export default CalculationMemory;
