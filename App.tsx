
import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import ResultsTable from './components/ResultsTable';
import FiscalHeader from './components/FiscalHeader';
import ProductsView from './components/ProductsView';
import Login from './components/Login';
import { SimulationInputs } from './types';
import { calculateCosts, generatePriceMatrix } from './utils/calculations';
import { supabase } from './lib/supabase';

const defaultInputs: SimulationInputs = {
  nomeProduto: '',
  valorCompra: 100.00,
  ipiPerc: 0.00,
  freteValor: 0.00,
  mva: 32.00,
  mvaOriginal: 32.00,
  icmsInternoDestino: 18.00,
  icmsInterestadual: 12.00,
  ufOrigem: 'SP',
  ufDestino: 'RJ',
  ncmCodigo: '2523.29.10',
  pisCofinsRate: 9.25,
  excluirIcmsPis: true,
  pisCofinsVenda: 9.25,
  comissaoVenda: 0.0,
  icmsVenda: 18.00,
  outrosCustosVariaveis: 0.00,
  custosFixos: 15.00,
  resultadoDesejado: 8.00,
  tipoProduto: 'comod',
  mode: 'substituido',
  percReducaoBase: 0,
  simulationMode: 'buyToSell',
  precoVendaDesejado: 0
};

type Tab = 'calculadora' | 'catalogo' | 'meus-produtos' | 'overhead' | 'storage-period' | 'configuracao';

const App: React.FC = () => {
  const [session, setSession] = useState<any>(null);
  const [inputs, setInputs] = useState<SimulationInputs>(defaultInputs);
  const [activeTab, setActiveTab] = useState<Tab>('calculadora');
  const [isSaving, setIsSaving] = useState(false);
  const [savedSimulations, setSavedSimulations] = useState<any[]>([]);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    let mounted = true;
    const init = async () => {
      try {
        const { data: { session: currentSession }, error } = await supabase.auth.getSession();
        
        // Handle Invalid Refresh Token error by clearing session
        if (error && (error.message.toLowerCase().includes('refresh_token') || error.message.toLowerCase().includes('not found'))) {
          await supabase.auth.signOut();
          if (mounted) {
            setSession(null);
            setIsInitialized(true);
          }
          return;
        }

        if (mounted) {
          setSession(currentSession);
          if (currentSession) fetchMyProducts(currentSession);
          setIsInitialized(true);
        }
      } catch (err) {
        if (mounted) setIsInitialized(true);
      }
    };
    init();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, newSession) => {
      if (mounted) {
        setSession(newSession);
        if (newSession) fetchMyProducts(newSession);
        
        if (event === 'SIGNED_OUT') {
           setSavedSimulations([]);
        }
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const fetchMyProducts = async (currentSession = session) => {
    if (!currentSession) return;
    try {
      const { data } = await supabase.from('simulacoes').select('*').order('created_at', { ascending: false });
      if (data) setSavedSimulations(data);
    } catch (e) {
      console.warn('Erro ao carregar produtos salvos');
    }
  };

  const handleSave = async () => {
    if (!session) return;
    setIsSaving(true);
    try {
      const { error } = await supabase.from('simulacoes').insert([{ 
        user_id: session.user.id, 
        nome_produto: inputs.nomeProduto || 'Produto Sem Nome', 
        dados: inputs 
      }]);
      if (!error) {
        alert('Produto salvo!');
        await fetchMyProducts();
        setActiveTab('meus-produtos');
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Excluir produto?')) return;
    const { error } = await supabase.from('simulacoes').delete().eq('id', id);
    if (!error) setSavedSimulations(prev => prev.filter(p => p.id !== id));
  };

  const handleSelectProduct = (sim: any) => {
    if (sim && sim.dados) {
      setInputs(sim.dados);
      setActiveTab('calculadora');
    }
  };

  if (!isInitialized) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-slate-50">
        <div className="w-10 h-10 border-4 border-black border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!session) return <Login onLoginSuccess={setSession} />;

  const results = calculateCosts(inputs);
  const priceMatrix = generatePriceMatrix(results.custoFinal, inputs);

  return (
    <div className="h-screen w-full flex flex-col lg:flex-row bg-[#f8fafc] overflow-hidden text-slate-900">
      
      {/* Sidebar Desktop / Bottom Nav Mobile */}
      <aside className={`bg-black flex lg:flex-col transition-all duration-300 z-[100] border-t lg:border-t-0 lg:border-r border-white/5 shadow-2xl 
        ${sidebarCollapsed ? 'lg:w-[80px]' : 'lg:w-[280px]'} 
        fixed bottom-0 left-0 w-full lg:relative lg:h-screen h-[70px] lg:h-auto`}>
        
        <div className="hidden lg:flex p-8 mb-6 items-center justify-between">
          <div className="flex items-center gap-4 overflow-hidden">
            <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center shrink-0 border border-white/10 shadow-lg">
               <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
            </div>
            {!sidebarCollapsed && (
              <div className="flex flex-col leading-none">
                <span className="text-white font-black tracking-tighter text-2xl italic uppercase">Tagway</span>
                <span className="text-[9px] font-black text-white/30 uppercase tracking-[0.2em] mt-1">Intelligence</span>
              </div>
            )}
          </div>
        </div>

        <nav className="flex-1 flex lg:flex-col items-center lg:items-stretch justify-start lg:justify-start lg:px-4 lg:space-y-2 p-1 lg:p-0 overflow-x-auto lg:overflow-x-visible no-scrollbar">
          <MenuButton 
            active={activeTab === 'calculadora'} onClick={() => setActiveTab('calculadora')} label="Calculadora" collapsed={sidebarCollapsed}
            icon="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
          />
          <MenuButton 
            active={activeTab === 'catalogo'} onClick={() => setActiveTab('catalogo')} label="Catálogo" collapsed={sidebarCollapsed}
            icon="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
          />
          <MenuButton 
            active={activeTab === 'meus-produtos'} onClick={() => setActiveTab('meus-produtos')} label="Meus Produtos" collapsed={sidebarCollapsed}
            icon="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
          />
          <MenuButton 
            active={activeTab === 'overhead'} onClick={() => setActiveTab('overhead')} label="Overhead" collapsed={sidebarCollapsed}
            icon="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 002 2h2a2 2 0 002-2"
          />
          <MenuButton 
            active={activeTab === 'storage-period'} onClick={() => setActiveTab('storage-period')} label="Storage (SP)" collapsed={sidebarCollapsed}
            icon="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
          />
          <MenuButton 
            active={activeTab === 'configuracao'} onClick={() => setActiveTab('configuracao')} label="Ajustes" collapsed={sidebarCollapsed}
            icon="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
          />
        </nav>

        <div className="hidden lg:flex p-4 mt-auto flex-col space-y-2 border-t border-white/5">
          <button onClick={() => setSidebarCollapsed(!sidebarCollapsed)} className="w-full flex items-center gap-4 p-4 text-white/40 hover:text-white rounded-2xl transition-all">
            <svg className={`w-5 h-5 transition-transform ${sidebarCollapsed ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M11 19l-7-7 7-7m8 14l-7-7 7-7"/></svg>
            {!sidebarCollapsed && <span className="text-[10px] font-black uppercase tracking-[0.2em]">Recolher</span>}
          </button>
          <button onClick={() => supabase.auth.signOut()} className="w-full flex items-center gap-4 p-4 text-white/30 hover:text-rose-500 hover:bg-rose-500/10 rounded-2xl transition-all">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/></svg>
            {!sidebarCollapsed && <span className="text-[10px] font-black uppercase tracking-[0.2em]">Sair</span>}
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-hidden flex flex-col relative pb-[70px] lg:pb-0">
        
        {activeTab === 'calculadora' && (
          <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
            <div className="w-full lg:w-[380px] border-b lg:border-b-0 lg:border-r border-slate-200 bg-white overflow-y-auto custom-scrollbar p-6 pt-0 space-y-8 shadow-inner">
              <div className="flex items-center justify-between sticky top-0 bg-white/95 backdrop-blur-sm z-30 -mx-6 px-6 py-5 border-b border-slate-100 mb-6">
                <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Parâmetros</h2>
                <button 
                  onClick={handleSave} disabled={isSaving}
                  className="bg-black hover:bg-slate-800 text-white text-[9px] font-black uppercase px-6 py-2.5 rounded-xl transition-all shadow-xl shadow-black/10 active:scale-95 disabled:opacity-50"
                >
                  {isSaving ? 'Salvando...' : 'Salvar'}
                </button>
              </div>
              <div className="space-y-8">
                <FiscalHeader inputs={inputs} setInputs={setInputs} />
                <Sidebar inputs={inputs} setInputs={setInputs} />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar bg-[#f8fafc] p-4 md:p-8 lg:p-12">
              <div className="max-w-5xl mx-auto animate-slide-up">
                 <ResultsTable results={results} priceMatrix={priceMatrix} inputs={inputs} />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'catalogo' && (
          <div className="flex-1 p-6 md:p-12 overflow-y-auto custom-scrollbar bg-white">
            <ProductsView onSelectNcm={(ncm) => {
              setInputs(prev => ({...prev, ncmCodigo: ncm.codigo, mvaOriginal: ncm.mvaOriginal, nomeProduto: ncm.descricao}));
              setActiveTab('calculadora');
            }} />
          </div>
        )}

        {activeTab === 'meus-produtos' && (
          <div className="flex-1 p-6 md:p-12 overflow-y-auto custom-scrollbar bg-slate-50">
            <div className="max-w-4xl mx-auto space-y-8">
              <header className="border-b border-slate-200 pb-8">
                <h2 className="text-3xl lg:text-4xl font-black text-slate-900 tracking-tighter uppercase italic">Histórico</h2>
                <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px] mt-2">Simulações gravadas no seu portfólio</p>
              </header>

              <div className="grid gap-4">
                {savedSimulations.map(sim => (
                  <div key={sim.id} className="bg-white border border-slate-200 p-6 rounded-[2rem] flex flex-col md:flex-row md:items-center justify-between gap-6 hover:shadow-2xl transition-all group hover:border-black">
                    <div className="flex items-center gap-6">
                      <div className="w-14 h-14 bg-slate-50 text-slate-400 rounded-2xl flex items-center justify-center shrink-0 group-hover:bg-black group-hover:text-white transition-all shadow-sm">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>
                      </div>
                      <div className="overflow-hidden">
                        <h4 className="font-black text-slate-800 tracking-tight text-lg truncate">{sim.nome_produto}</h4>
                        <div className="flex items-center flex-wrap gap-2 mt-1 text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                          <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-600 font-mono">{sim.dados.ncmCodigo}</span>
                          <span className="text-black">{sim.dados.ufOrigem}➔{sim.dados.ufDestino}</span>
                          <span>{new Date(sim.created_at).toLocaleDateString('pt-BR')}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => handleSelectProduct(sim)} className="flex-1 md:flex-none bg-black text-white px-8 py-3.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg active:scale-95">Abrir</button>
                      <button onClick={() => handleDelete(sim.id)} className="p-3.5 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {(activeTab === 'overhead' || activeTab === 'storage-period' || activeTab === 'configuracao') && (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-slate-50 animate-slide-up">
            <div className="w-32 h-32 bg-white rounded-[3rem] border border-slate-200 flex items-center justify-center mb-8 shadow-2xl shadow-black/5">
              <svg className="w-12 h-12 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z"/>
              </svg>
            </div>
            <h2 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tighter uppercase italic leading-none">
              {activeTab === 'overhead' ? 'Análise Overhead' : activeTab === 'storage-period' ? 'Storage (SP)' : 'Configurações'}
            </h2>
            <div className="mt-4 flex flex-col items-center gap-3">
              <p className="text-slate-400 font-bold uppercase tracking-[0.3em] text-[10px]">Módulo em Fase de Desenvolvimento</p>
              <div className="px-6 py-2 bg-black text-white text-[9px] font-black uppercase tracking-[0.2em] rounded-full shadow-lg">
                Disponível em breve • 2026
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

interface MenuButtonProps {
  active: boolean;
  onClick: () => void;
  icon: string;
  label: string;
  collapsed: boolean;
}

const MenuButton: React.FC<MenuButtonProps> = ({ active, onClick, icon, label, collapsed }) => (
  <button 
    onClick={onClick}
    className={`flex flex-col lg:flex-row items-center lg:w-full gap-2 lg:gap-4 p-3 lg:p-4 lg:rounded-2xl transition-all relative group shrink-0 ${
      active 
      ? 'bg-white text-black lg:shadow-xl lg:ring-1 lg:ring-white/10' 
      : 'text-white/40 hover:text-white lg:hover:bg-white/10'
    }`}
  >
    <div className="w-6 h-6 flex items-center justify-center shrink-0">
      <svg className={`w-5 h-5 shrink-0 transition-colors ${active ? 'text-black' : 'text-white/40 group-hover:text-white'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d={icon}/>
      </svg>
    </div>
    {!collapsed && (
      <span className="text-[9px] lg:text-[11px] font-black uppercase tracking-[0.1em] lg:tracking-[0.15em] whitespace-nowrap">{label}</span>
    )}
    {active && <div className="lg:hidden absolute bottom-1 w-1 h-1 bg-black rounded-full"></div>}
  </button>
);

export default App;
