
import React, { useState } from 'react';
import { SimulationInputs } from '../types';
import { calculateCosts2027 } from '../utils/calculations2027';
import ResultsTable from './ResultsTable';
import Sidebar from './Sidebar';

// Fix: Added missing 'isMvaAuto' property which is required by the SimulationInputs interface.
const defaultInputs2027: SimulationInputs = {
  nomeProduto: '',
  valorCompra: 0,
  ipiPerc: 0,
  freteValor: 0,
  mva: 0,
  mvaOriginal: 0,
  icmsInternoDestino: 0,
  icmsInterestadual: 0,
  icmsCreditoMercadoria: 0,
  icmsCreditoFrete: 0,
  ufOrigem: 'SP',
  ufDestino: 'SP',
  ncmCodigo: '',
  pisCofinsRate: 0,
  excluirIcmsPis: false,
  pisCofinsVenda: 0,
  comissaoVenda: 0,
  icmsVenda: 0,
  outrosCustosVariaveis: 0,
  custosFixos: 20,
  resultadoDesejado: 8,
  mode: 'tributado',
  percReducaoBase: 0,
  simulationMode: 'buyToSell',
  precoVendaDesejado: 0,
  isCenario2027: true,
  isMvaAuto: true
};

const Calculadora2027View: React.FC = () => {
  const [inputs, setInputs] = useState<SimulationInputs>(defaultInputs2027);
  const results = calculateCosts2027(inputs);

  return (
    <div className="space-y-10 animate-slide-up">
      <header className="bg-gradient-to-r from-indigo-900 via-slate-900 to-black p-12 rounded-[3.5rem] text-white shadow-2xl relative overflow-hidden border border-indigo-500/20">
        <div className="absolute top-0 right-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10"></div>
        <div className="relative z-10 space-y-4">
          <div className="flex items-center gap-3">
             <span className="bg-indigo-500 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest animate-pulse">Tecnologia Antecipada</span>
             <span className="text-white/40 text-[10px] font-black uppercase tracking-widest">Roadmap Fiscal v2.0</span>
          </div>
          <h2 className="text-6xl font-black tracking-tighter uppercase italic leading-none">Cenário 2027</h2>
          <p className="text-indigo-300 font-bold uppercase tracking-[0.3em] text-xs">Simulação Baseada na Reforma Tributária (IBS + CBS)</p>
        </div>
      </header>

      <div className="flex flex-col lg:flex-row gap-12">
        <div className="w-full lg:w-80 shrink-0">
          <div className="bg-indigo-950/20 p-6 rounded-[2rem] border border-indigo-500/10 mb-6">
            <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-4">Nota do Master</p>
            <p className="text-xs text-indigo-200/60 leading-relaxed italic">"Este módulo está em fase de desenvolvimento. As alíquotas de IBS/CBS são estimativas baseadas nos textos aprovados."</p>
          </div>
          <Sidebar inputs={inputs} setInputs={setInputs as any} isAutoSync={false} setIsAutoSync={() => {}} />
        </div>
        <div className="flex-1">
          <ResultsTable results={results} priceMatrix={[]} inputs={inputs} />
        </div>
      </div>
    </div>
  );
};

export default Calculadora2027View;
