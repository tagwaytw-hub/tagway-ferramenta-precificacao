import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import ResultsTable from './components/ResultsTable';
import FiscalHeader from './components/FiscalHeader';
import Login from './components/Login';
import { SimulationInputs } from './types';
import { calculateCosts, generatePriceMatrix, formatCurrency } from './utils/calculations';

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
  const [activeTab, setActiveTab] = useState<'config' | 'results'>('config');
  
  if (!isAuthenticated) {
    return <Login onLoginSuccess={() => setIsAuthenticated(true)} />;
  }

  const results = calculateCosts(inputs);
  const priceMatrix = generatePriceMatrix(results.custoFinal, inputs);

  return (
    <div className="h-screen w-full flex flex-col md:flex-row bg-[#f8fafc] overflow-hidden font-sans">
      {/* Mobile Header - Otimizado com Resumo */}
      <div className="md:hidden bg-[#1a2332] p-4 z-30 flex justify-between items-center border-b border-slate-800 shadow-lg">
        <div>
          <h1 className="text-white text-xs font-black tracking-widest uppercase">Tagway</h1>
          <p className="text-[10px] text-blue-400 font-bold uppercase">Preço Alvo: {formatCurrency(results.precoVendaAlvo)}</p>
        </div>
        <button 
          onClick={() => setIsAuthenticated(false)}
          className="bg-slate-800 text-slate-400 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest border border-slate-700"
        >
          Sair
        </button>
      </div>

      {/* Sidebar - Visível apenas em Desktop ou se a aba 'config' estiver ativa no Mobile */}
      <aside className={`
        ${activeTab === 'config' ? 'flex' : 'hidden'} 
        md:flex w-full md:w-80 lg:w-96 bg-white border-r border-slate-200 flex-shrink-0 flex-col h-full z-10
      `}>
        <div className="p-6 border-b border-slate-100 hidden md:block">
          <div className="flex items-center gap-3 mb-1">
            <div className="bg-blue-600 p-2 rounded-lg text-white shadow-lg shadow-blue-500/20">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"></path></svg>
            </div>
            <h1 className="text-xl font-black text-slate-800 tracking-tighter italic">TAGWAY</h1>
          </div>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Inteligência Fiscal 2025</p>
        </div>
        
        <div className="flex-1 overflow-y-auto custom-scrollbar p-5 md:p-6 bg-slate-50/30">
          <Sidebar inputs={inputs} setInputs={setInputs} />
        </div>

        <div className="p-4 border-t border-slate-100 bg-white hidden md:block">
          <button 
            onClick={() => setIsAuthenticated(false)}
            className="w-full flex items-center justify-center gap-2 text-[10px] text-slate-400 hover:text-red-500 transition-colors font-black uppercase py-2 tracking-widest"
          >
            Encerrar Sessão
          </button>
        </div>
      </aside>

      {/* Main Content Area - Visível apenas em Desktop ou se a aba 'results' estiver ativa no Mobile */}
      <main className={`
        ${activeTab === 'results' ? 'flex' : 'hidden'} 
        md:flex flex-1 flex-col overflow-y-auto custom-scrollbar relative bg-[#f8fafc]
      `}>
        {/* Header Superior Interno Desktop */}
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
               {inputs.mode === 'substituido' ? 'Substituição Tributária' : inputs.mode === 'reduzido' ? 'Redução' : 'Tributável'}
             </p>
          </div>
        </div>

        <div className="max-w-6xl mx-auto w-full p-4 md:p-8 space-y-6">
          {/* Cabeçalho Fiscal */}
          <section className="animate-in fade-in slide-in-from-top-2 duration-300">
            <FiscalHeader inputs={inputs} setInputs={setInputs} />
          </section>

          {/* Tabelas e Resultados */}
          <section className="animate-in fade-in slide-in-from-bottom-2 duration-500 pb-24 md:pb-12">
            <ResultsTable results={results} priceMatrix={priceMatrix} inputs={inputs} />
          </section>
        </div>
      </main>

      {/* Barra de Navegação Mobile (Tab Bar) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 flex items-center h-16 z-40 shadow-[0_-4px_10px_rgba(0,0,0,0.05)]">
        <button 
          onClick={() => setActiveTab('config')}
          className={`flex-1 flex flex-col items-center justify-center gap-1 h-full transition-colors ${activeTab === 'config' ? 'text-blue-600' : 'text-slate-400'}`}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"></path></svg>
          <span className="text-[10px] font-bold uppercase">Ajustes</span>
        </button>
        <button 
          onClick={() => setActiveTab('results')}
          className={`flex-1 flex flex-col items-center justify-center gap-1 h-full transition-colors ${activeTab === 'results' ? 'text-blue-600' : 'text-slate-400'}`}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path></svg>
          <span className="text-[10px] font-bold uppercase">Resultados</span>
        </button>
      </div>
    </div>
  );
};

export default App;