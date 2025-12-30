import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import ResultsTable from './components/ResultsTable';
import FiscalHeader from './components/FiscalHeader';
import ProductsView from './components/ProductsView';
import Login from './components/Login';
import { SimulationInputs } from './types';
import { calculateCosts, generatePriceMatrix } from './utils/calculations';

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
          <div className="h-full flex flex-col md:flex-row relative bg-[#f8fafc]">
            {/* Seção de Configuração (Esquerda no Desktop / Aba 1 no Mobile) */}
            <aside className={`${activeCalcTab === 'config' ? 'flex' : 'hidden md:flex'} w-full md:w-80 lg:w-[450px] bg-white border-r border-slate-200 flex-shrink-0 flex-col h-full z-10 shadow-sm overflow-hidden`}>
              <div className="flex-1 overflow-y-auto custom-scrollbar p-5 md:p-6 space-y-6 pb-24 md:pb-6">
                <div className="mb-4">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Configuração Fiscal</h2>
                    <div className="bg-slate-100 rounded-full p-1 flex">
                      <button 
                        onClick={() => setInputs(prev => ({...prev, simulationMode: 'buyToSell'}))}
                        className={`px-3 py-1 rounded-full text-[8px] font-black uppercase transition-all ${inputs.simulationMode === 'buyToSell' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-400'}`}
                      >
                        Padrão
                      </button>
                    </div>
                  </div>
                  <FiscalHeader inputs={inputs} setInputs={setInputs} />
                </div>
                <div className="h-px bg-slate-100 w-full my-6"></div>
                <Sidebar inputs={inputs} setInputs={setInputs} />
              </div>
            </aside>

            {/* Seção de Resultados (Direita no Desktop / Aba 2 no Mobile) */}
            <main className={`${activeCalcTab === 'results' ? 'flex' : 'hidden md:flex'} flex-1 flex-col overflow-y-auto custom-scrollbar`}>
              <div className="max-w-6xl mx-auto w-full p-4 md:p-8 pb-32 md:pb-8">
                {/* Header Mobile Interno */}
                <div className="md:hidden mb-6 flex justify-between items-center px-2">
                   <div className="flex flex-col">
                      <h2 className="text-lg font-black text-slate-800 uppercase tracking-tight italic">Relatório</h2>
                      <span className="text-[9px] text-slate-400 font-bold uppercase">{inputs.nomeProduto || 'Produto não identificado'}</span>
                   </div>
                   <div className="bg-blue-600 text-white px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-tighter shadow-lg shadow-blue-500/20">Live 2025</div>
                </div>
                
                <ResultsTable results={results} priceMatrix={priceMatrix} inputs={inputs} />
              </div>
            </main>

            {/* Navegação Mobile Fixa no Rodapé */}
            <div className="md:hidden fixed bottom-4 left-4 right-4 bg-white/80 backdrop-blur-md border border-slate-200 rounded-2xl p-2 flex gap-2 shadow-2xl z-[100]">
               <button 
                 onClick={() => setActiveCalcTab('config')}
                 className={`flex-1 py-3 rounded-xl flex flex-col items-center justify-center gap-1 transition-all ${activeCalcTab === 'config' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50'}`}
               >
                 <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                 <span className="text-[9px] font-black uppercase tracking-widest">Config</span>
               </button>
               <button 
                 onClick={() => setActiveCalcTab('results')}
                 className={`flex-1 py-3 rounded-xl flex flex-col items-center justify-center gap-1 transition-all ${activeCalcTab === 'results' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50'}`}
               >
                 <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path></svg>
                 <span className="text-[9px] font-black uppercase tracking-widest">Painel</span>
               </button>
            </div>
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
      {/* Sidebar Lateral Desktop (Hidden on Mobile) */}
      <aside className={`hidden md:flex bg-[#1a2332] flex-col border-r border-slate-800 z-50 transition-all duration-300 ease-in-out relative ${isSidebarCollapsed ? 'w-16' : 'w-64'}`}>
        <button 
          onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          className="absolute -right-3 top-20 bg-blue-600 text-white p-1.5 rounded-full shadow-lg shadow-blue-500/40 hover:bg-blue-500 transition-all z-[60]"
        >
          <svg className={`w-3 h-3 transition-transform duration-500 ${isSidebarCollapsed ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M15 19l-7-7 7-7"></path>
          </svg>
        </button>

        <div className="p-6 flex items-center border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2 rounded-xl flex-shrink-0">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
            </div>
            {!isSidebarCollapsed && <h1 className="text-lg font-black text-white tracking-tighter uppercase italic">Tagway</h1>}
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-2 mt-4 overflow-hidden">
          <button onClick={() => setMainTab('calculadora')} className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${mainTab === 'calculadora' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"></path></svg>
            {!isSidebarCollapsed && <span className="text-[11px] font-black uppercase tracking-widest">Calculadora</span>}
          </button>
          <button onClick={() => setMainTab('configuracoes')} className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${mainTab === 'configuracoes' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path></svg>
            {!isSidebarCollapsed && <span className="text-[11px] font-black uppercase tracking-widest">Catálogo NCM</span>}
          </button>
        </nav>

        <div className="p-3 border-t border-slate-800">
          <button onClick={() => setIsAuthenticated(false)} className="w-full flex items-center gap-3 p-3 rounded-xl text-slate-500 hover:text-red-400 transition-all">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
            {!isSidebarCollapsed && <span className="text-[10px] font-black uppercase tracking-widest">Sair</span>}
          </button>
        </div>
      </aside>

      {/* Header Mobile Simplificado (Top Nav) */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-14 bg-[#1a2332] border-b border-slate-800 flex items-center px-4 z-[90] justify-between">
         <div className="flex items-center gap-2">
            <div className="bg-blue-600 p-1.5 rounded-lg">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
            </div>
            <h1 className="text-sm font-black text-white tracking-tighter uppercase italic">Tagway</h1>
         </div>
         <div className="flex gap-4 items-center">
            <button onClick={() => setMainTab('configuracoes')} className="text-slate-400">
               <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
            </button>
            <div className="w-8 h-8 rounded-full bg-slate-700 border border-slate-600 flex items-center justify-center text-[10px] font-black text-slate-300">AD</div>
         </div>
      </div>

      <div className="flex-1 flex flex-col pt-14 md:pt-0 overflow-hidden relative">
        {renderContent()}
      </div>
    </div>
  );
};

export default App;