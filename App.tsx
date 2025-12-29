
import React, { useState } from 'react';
import Sidebar from './components/Sidebar.tsx';
import ResultsTable from './components/ResultsTable.tsx';
import FiscalHeader from './components/FiscalHeader.tsx';
import ProductsView from './components/ProductsView.tsx';
import Login from './components/Login.tsx';
import { SimulationInputs } from './types.ts';
import { calculateCosts, generatePriceMatrix } from './utils/calculations.ts';

const defaultInputs: SimulationInputs = {
  nomeProduto: '',
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
  percReducaoBase: 0,
  simulationMode: 'buyToSell',
  precoVendaDesejado: 250.00
};

type MainTab = 'calculadora' | 'configuracoes';

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [inputs, setInputs] = useState<SimulationInputs>(defaultInputs);
  const [mainTab, setMainTab] = useState('calculadora' as MainTab);
  const [activeCalcTab, setActiveCalcTab] = useState('config' as 'config' | 'results');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  if (!isAuthenticated) {
    return <Login onLoginSuccess={() => setIsAuthenticated(true)} />;
  }

  const results = calculateCosts(inputs);
  const priceMatrix = generatePriceMatrix(results.custoFinal, inputs);

  const renderContent = () => {
    switch (mainTab) {
      case 'calculadora':
        return (
          <div className="h-full flex flex-col md:flex-row relative">
            <aside className={`${activeCalcTab === 'config' ? 'flex' : 'hidden md:flex'} w-full md:w-80 lg:w-[450px] bg-white border-r border-slate-200 flex-shrink-0 flex-col h-full z-10 shadow-sm`}>
              <div className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-6 space-y-6">
                <div className="mb-4">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Configuração</h2>
                    <div className="bg-slate-100 rounded-full p-1 flex">
                      <button 
                        onClick={() => setInputs(prev => ({...prev, simulationMode: 'buyToSell'}))}
                        className={`px-3 py-1 rounded-full text-[8px] font-black uppercase transition-all ${inputs.simulationMode === 'buyToSell' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-400'}`}
                      >
                        Padrão
                      </button>
                      <button 
                        disabled
                        className="px-3 py-1 rounded-full text-[8px] font-black uppercase text-slate-300 cursor-not-allowed"
                        title="Em breve"
                      >
                        Reverso
                      </button>
                    </div>
                  </div>
                  <FiscalHeader inputs={inputs} setInputs={setInputs} />
                </div>
                <div className="h-px bg-slate-100 w-full my-6"></div>
                <Sidebar inputs={inputs} setInputs={setInputs} />
              </div>
            </aside>

            <main className={`${activeCalcTab === 'results' ? 'flex' : 'hidden md:flex'} flex-1 flex-col overflow-y-auto custom-scrollbar bg-[#f8fafc]`}>
              <div className="max-w-6xl mx-auto w-full p-4 md:p-8">
                <div className="md:hidden mb-6 flex justify-between items-center px-2">
                   <h2 className="text-sm font-black text-slate-800 uppercase tracking-widest italic">Resultados</h2>
                   <div className="bg-blue-50 text-blue-600 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter border border-blue-100">Simulação 2025</div>
                </div>
                <div className="md:hidden flex gap-2 mb-6">
                   <button 
                     onClick={() => setActiveCalcTab('config')}
                     className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest border ${activeCalcTab === 'config' ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-slate-200 text-slate-400'}`}
                   >
                     Configurações
                   </button>
                   <button 
                     onClick={() => setActiveCalcTab('results')}
                     className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest border ${activeCalcTab === 'results' ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-slate-200 text-slate-400'}`}
                   >
                     Resultados
                   </button>
                </div>
                <ResultsTable results={results} priceMatrix={priceMatrix} inputs={inputs} />
              </div>
            </main>
          </div>
        );
      case 'configuracoes':
        return (
          <div className="h-full overflow-y-auto custom-scrollbar bg-[#f8fafc] p-4 md:p-10">
            <div className="max-w-7xl mx-auto">
              <ProductsView onSelectNcm={(ncm: any) => {
                 setInputs(prev => ({
                   ...prev,
                   ncmCodigo: ncm.codigo,
                   mvaOriginal: ncm.mvaOriginal,
                   nomeProduto: ncm.descricao
                 }));
                 setMainTab('calculadora');
                 setActiveCalcTab('config');
              }} />
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="h-screen w-full flex bg-[#f8fafc] overflow-hidden font-sans text-slate-900">
      <aside className={`bg-[#1a2332] flex flex-col border-r border-slate-800 z-50 transition-all duration-300 ease-in-out relative ${isSidebarCollapsed ? 'w-16' : 'w-64'}`}>
        <button 
          onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          className="absolute -right-3 top-20 bg-blue-600 text-white p-1.5 rounded-full shadow-lg shadow-blue-500/40 hover:bg-blue-500 transition-all z-[60] group"
          title={isSidebarCollapsed ? "Expandir menu" : "Recolher menu"}
        >
          <svg className={`w-3 h-3 transition-transform duration-500 ${isSidebarCollapsed ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M15 19l-7-7 7-7"></path>
          </svg>
        </button>

        <div className="p-4 md:p-6 flex items-center border-b border-slate-800 overflow-hidden whitespace-nowrap">
          <div className="flex items-center gap-3 w-full">
            <div className="bg-blue-600 p-2 rounded-xl flex-shrink-0 shadow-lg shadow-blue-500/20">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
            </div>
            {!isSidebarCollapsed && (
              <h1 className="text-lg font-black text-white tracking-tighter italic uppercase animate-fadeIn">Tagway</h1>
            )}
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-2 mt-4 overflow-x-hidden custom-scrollbar">
          <button onClick={() => setMainTab('calculadora')} title="Calculadora" className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all group relative ${mainTab === 'calculadora' ? 'bg-blue-600 text-white shadow-xl shadow-blue-500/10' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'}`}>
            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"></path></svg>
            {!isSidebarCollapsed && <span className="text-[11px] font-black uppercase tracking-widest whitespace-nowrap animate-fadeIn">Calculadora</span>}
          </button>
          <button onClick={() => setMainTab('configuracoes')} title="Catálogo NCM" className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all group relative ${mainTab === 'configuracoes' ? 'bg-blue-600 text-white shadow-xl shadow-blue-500/10' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'}`}>
            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path></svg>
            {!isSidebarCollapsed && <span className="text-[11px] font-black uppercase tracking-widest whitespace-nowrap animate-fadeIn">Catálogo NCM</span>}
          </button>
        </nav>

        <div className="p-3 border-t border-slate-800">
          <button onClick={() => setIsAuthenticated(false)} title="Sair" className="w-full flex items-center gap-3 p-3 rounded-xl text-slate-500 hover:bg-red-500/10 hover:text-red-400 transition-all group">
            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
            {!isSidebarCollapsed && <span className="text-[10px] font-black uppercase tracking-widest whitespace-nowrap animate-fadeIn">Sair</span>}
          </button>
        </div>
      </aside>
      <div className="flex-1 flex flex-col overflow-hidden relative">
        {renderContent()}
      </div>
    </div>
  );
};

export default App;
