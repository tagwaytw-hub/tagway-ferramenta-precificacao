import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import ResultsTable from './components/ResultsTable';
import FiscalHeader from './components/FiscalHeader';
import Login from './components/Login';
import { SimulationInputs } from './types';
import { calculateCosts, generatePriceMatrix } from './utils/calculations';

const defaultInputs: SimulationInputs = {
  valorCompra: 100.00,
  ipiFrete: 0.00,
  mva: 32.00,
  mvaOriginal: 20.00,
  icmsInternoDestino: 20.00,
  icmsInterestadual: 12.00,
  ufOrigem: 'SP',
  ufDestino: 'RJ',
  ncmCodigo: '2523.29.10',
  pisCofinsRate: 9.25,
  excluirIcmsPis: true,
  pisCofinsVenda: 9.250,
  comissaoVenda: 0.00,
  icmsVenda: 18.00,
  outrosCustosVariaveis: 0.00,
  custosFixos: 20.00,
  resultadoDesejado: 8.00,
  tipoProduto: 'comod',
  mode: 'substituido',
  percReducaoBase: 0
};

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [inputs, setInputs] = useState<SimulationInputs>(defaultInputs);
  
  if (!isAuthenticated) {
    return <Login onLoginSuccess={() => setIsAuthenticated(true)} />;
  }

  const results = calculateCosts(inputs);
  const priceMatrix = generatePriceMatrix(results.custoFinal, inputs);

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-50 animate-in fade-in duration-700">
      {/* Mobile Header */}
      <div className="md:hidden bg-[#1a2332] p-4 shadow-sm border-b border-slate-800 flex justify-between items-center">
        <h1 className="text-lg font-bold text-white">📊 Tagway Technology</h1>
        <button 
          onClick={() => setIsAuthenticated(false)}
          className="text-xs text-slate-400 font-bold uppercase"
        >
          Sair
        </button>
      </div>

      {/* Sidebar de Inputs - Caminho Relativo */}
      <aside className="w-full md:w-80 lg:w-96 flex-shrink-0 md:h-screen sticky top-0 md:overflow-hidden p-4 md:p-6 bg-slate-50">
        <Sidebar inputs={inputs} setInputs={setInputs} />
      </aside>

      {/* Conteúdo Principal */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto relative custom-scrollbar">
        <header className="mb-8 hidden md:block flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Tagway <span className="text-slate-400 font-light">Technology</span></h1>
            <p className="text-sm text-slate-500 mt-1">Simulador Fiscal Estratégico | Regime: <span className="font-bold text-blue-600 uppercase">{inputs.mode}</span></p>
          </div>
          <button 
            onClick={() => setIsAuthenticated(false)}
            className="text-xs bg-white border border-slate-200 px-3 py-1.5 rounded-lg text-slate-500 hover:bg-slate-50 transition-colors font-bold uppercase tracking-wider"
          >
            Encerrar Sessão
          </button>
        </header>

        <div className="max-w-5xl mx-auto space-y-6 pb-20">
          <FiscalHeader inputs={inputs} setInputs={setInputs} />
          <ResultsTable results={results} priceMatrix={priceMatrix} inputs={inputs} />
        </div>
      </main>
    </div>
  );
};

export default App;