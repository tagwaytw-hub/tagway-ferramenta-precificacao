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
    <div className="h-screen w-full flex flex-col md:flex-row bg-[#f8fafc] overflow-hidden font-sans">
      {/* Mobile Header - Integrado e Sólido */}
      <div className="md:hidden bg-[#1a2332] p-4 z-20 flex justify-between items-center border-b border-slate-800">
        <h1 className="text-white font-bold tracking-tight">📊 TAGWAY TECHNOLOGY</h1>
        <button 
          onClick={() => setIsAuthenticated(false)}
          className="bg-red-500 text-white px-3 py-1 rounded text-[10px] font-black uppercase tracking-widest"
        >
          Sair
        </button>
      </div>

      {/* Sidebar - Fixa e Conectada ao Layout */}
      <aside className="w-full md:w-80 lg:w-96 bg-white border-r border-slate-200 flex-shrink-0 flex flex-col h-full z-10">
        <div className="p-6 border-b border-slate-100 hidden md:block">
          <div className="flex items-center gap-3 mb-1">
            <div className="bg-blue-600 p-2 rounded-lg text-white">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"></path></svg>
            </div>
            <h1 className="text-xl font-black text-slate-800 tracking-tighter italic">TAGWAY</h1>
          </div>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Inteligência Fiscal 2025</p>
        </div>
        
        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-6 bg-slate-50/50">
          <Sidebar inputs={inputs} setInputs={setInputs} />
        </div>

        <div className="p-4 border-t border-slate-100 bg-white hidden md:block">
          <button 
            onClick={() => setIsAuthenticated(false)}
            className="w-full flex items-center justify-center gap-2 text-xs text-slate-400 hover:text-red-500 transition-colors font-black uppercase py-2 tracking-widest"
          >
            Encerrar Sessão
          </button>
        </div>
      </aside>

      {/* Main Content Area - Sem espaços flutuantes */}
      <main className="flex-1 overflow-y-auto custom-scrollbar relative bg-[#f8fafc]">
        {/* Header Superior Interno */}
        <div className="bg-white border-b border-slate-200 px-8 py-4 hidden md:flex justify-between items-center sticky top-0 z-10">
          <div className="flex items-center gap-4">
            <h2 className="text-xs font-black text-blue-600 uppercase tracking-widest border-r border-slate-200 pr-4">Simulador 2025</h2>
            <div className="flex items-center gap-2">
               <span className="h-2 w-2 bg-green-500 rounded-full"></span>
               <span className="text-[10px] text-slate-500 font-bold uppercase tracking-tight">Regras de Negócio Validadas</span>
            </div>
          </div>
          <div className="text-right">
             <p className="text-[10px] text-slate-400 uppercase font-bold tracking-tighter">Regime Ativo</p>
             <p className="text-xs font-black text-slate-800 uppercase tracking-tight">
               {inputs.mode === 'substituido' ? 'Substituição Tributária' : inputs.mode === 'reduzido' ? 'Redução de Base' : 'Tributável'}
             </p>
          </div>
        </div>

        <div className="max-w-6xl mx-auto p-4 md:p-8 space-y-6">
          {/* Cabeçalho Fiscal */}
          <section className="animate-in fade-in slide-in-from-top-4 duration-500">
            <FiscalHeader inputs={inputs} setInputs={setInputs} />
          </section>

          {/* Tabelas e Resultados */}
          <section className="animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100 pb-20">
            <ResultsTable results={results} priceMatrix={priceMatrix} inputs={inputs} />
          </section>
        </div>
      </main>
    </div>
  );
};

export default App;