
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { SimulationInputs } from '../types';

interface OnboardingWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (updates: Partial<SimulationInputs>) => void;
}

const SEGMENTS = [
  { 
    id: 'food', 
    label: 'Alimentos & Bebidas', 
    icon: '🍎', 
    mva: 40, 
    icmsInterno: 18,
    desc: 'Produtos básicos com MVA moderada.'
  },
  { 
    id: 'electronics', 
    label: 'Eletrônicos', 
    icon: '💻', 
    mva: 65, 
    icmsInterno: 12,
    desc: 'Alta tecnologia e maior valor agregado.'
  },
  { 
    id: 'construction', 
    label: 'Mat. Construção', 
    icon: '🧱', 
    mva: 50, 
    icmsInterno: 18,
    desc: 'Segmento com forte incidência de ST.'
  },
  { 
    id: 'fashion', 
    label: 'Moda & Vestuário', 
    icon: '👕', 
    mva: 102, 
    icmsInterno: 12,
    desc: 'Geralmente possui MVAs mais agressivas.'
  },
];

const REGIMES = [
  { id: 'simples', label: 'Simples Nacional', desc: 'Créditos limitados, cálculo simplificado.' },
  { id: 'presumido', label: 'Lucro Presumido', desc: 'PIS/COFINS cumulativo (3.65%).' },
  { id: 'real', label: 'Lucro Real', desc: 'Crédito pleno de IVA (9.25%).' },
];

const OnboardingWizard: React.FC<OnboardingWizardProps> = ({ isOpen, onClose, onApply }) => {
  const [step, setStep] = useState(1);
  const [selection, setSelection] = useState<any>({
    segment: null,
    regime: null,
    targetProfit: 15
  });

  if (!isOpen) return null;

  const handleFinish = () => {
    const updates: Partial<SimulationInputs> = {
      mva: selection.segment?.mva || 50,
      icmsInternoDestino: selection.segment?.icmsInterno || 18,
      resultadoDesejado: selection.targetProfit,
      pisCofinsVenda: selection.regime?.id === 'real' ? 9.25 : selection.regime?.id === 'presumido' ? 3.65 : 0,
    };
    onApply(updates);
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-900/80 backdrop-blur-xl"
        />
        
        <motion.div 
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          className="relative w-full max-w-xl bg-white rounded-[3rem] shadow-2xl overflow-hidden"
        >
          {/* Progress Bar */}
          <div className="absolute top-0 left-0 right-0 h-1.5 flex gap-1 px-4 pt-4">
            {[1, 2, 3].map((s) => (
              <div key={s} className={`flex-1 h-full rounded-full transition-all duration-500 ${s <= step ? 'bg-indigo-600' : 'bg-slate-100'}`} />
            ))}
          </div>

          <div className="p-10 pt-16">
            {step === 1 && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
                <div className="space-y-2">
                  <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">Passo 01</span>
                  <h2 className="text-2xl font-black text-slate-900 uppercase">Qual o seu segmento?</h2>
                  <p className="text-xs font-bold text-slate-400 uppercase">Isso definirá sua MVA e alíquotas base automaticamente.</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  {SEGMENTS.map(seg => (
                    <button 
                      key={seg.id}
                      onClick={() => { setSelection({...selection, segment: seg}); setStep(2); }}
                      className={`p-6 rounded-[2rem] border text-left transition-all ${selection.segment?.id === seg.id ? 'border-indigo-600 bg-indigo-50/50' : 'border-slate-100 hover:border-slate-200'}`}
                    >
                      <span className="text-3xl mb-3 block">{seg.icon}</span>
                      <span className="text-xs font-black text-slate-900 uppercase block mb-1">{seg.label}</span>
                      <span className="text-[9px] font-bold text-slate-400 uppercase leading-tight block">{seg.desc}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
                <div className="space-y-2">
                  <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">Passo 02</span>
                  <h2 className="text-2xl font-black text-slate-900 uppercase">Regime Tributário</h2>
                  <p className="text-xs font-bold text-slate-400 uppercase">Como sua empresa apura os impostos federais?</p>
                </div>
                
                <div className="space-y-3">
                  {REGIMES.map(reg => (
                    <button 
                      key={reg.id}
                      onClick={() => { setSelection({...selection, regime: reg}); setStep(3); }}
                      className="w-full p-6 rounded-[1.5rem] border border-slate-100 text-left hover:border-indigo-600 transition-all flex items-center justify-between group"
                    >
                      <div>
                        <span className="text-xs font-black text-slate-900 uppercase block mb-1">{reg.label}</span>
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tight">{reg.desc}</span>
                      </div>
                      <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-indigo-600 transition-colors">
                        <svg className="w-4 h-4 text-slate-300 group-hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </button>
                  ))}
                </div>
                <button onClick={() => setStep(1)} className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-900">Voltar</button>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
                <div className="space-y-2">
                  <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">Passo 03</span>
                  <h2 className="text-2xl font-black text-slate-900 uppercase">Qual o lucro alvo?</h2>
                  <p className="text-xs font-bold text-slate-400 uppercase">Quanto você espera que sobre limpo no bolso (%)?</p>
                </div>
                
                <div className="space-y-6">
                  <div className="bg-slate-50 p-10 rounded-[2rem] text-center border border-slate-100">
                    <span className="text-5xl font-black font-mono text-slate-900">{selection.targetProfit}%</span>
                    <input 
                      type="range" min="5" max="40" step="1"
                      value={selection.targetProfit}
                      onChange={(e) => setSelection({...selection, targetProfit: parseInt(e.target.value)})}
                      className="w-full mt-8 accent-indigo-600"
                    />
                  </div>
                  
                  <button 
                    onClick={handleFinish}
                    className="w-full py-6 bg-slate-900 text-white rounded-[1.5rem] text-[11px] font-black uppercase tracking-[0.2em] hover:bg-black transition-all shadow-xl"
                  >
                    Finalizar Configuração
                  </button>
                </div>
                <button onClick={() => setStep(2)} className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-900">Voltar</button>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default OnboardingWizard;
