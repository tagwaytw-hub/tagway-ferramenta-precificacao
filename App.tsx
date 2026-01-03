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
  ipiFrete: 0.00,
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

type Tab = 'calculadora' | 'catalogo' | 'meus-produtos' | 'configuracoes';

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
        // Obter sessão inicial
        const { data: { session: currentSession }, error } = await supabase.auth.getSession();
        
        if (mounted) {
          if (error) {
            console.debug('Nota: Sessão não encontrada ou erro de inicialização:', error.message);
          }
          setSession(currentSession);
          if (currentSession) {
            fetchMyProducts(currentSession);
          }
          setIsInitialized(true);
        }
      } catch (err: any) {
        // Silenciamos erros de lock que já foram tratados no polyfill, mas logamos falhas de rede
        console.warn('Processo de inicialização do Auth finalizado.');
        if (mounted) setIsInitialized(true);
      }
    };

    init();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event: string, newSession: any) => {
      if (mounted) {
        setSession(newSession);
        if (newSession) fetchMyProducts(newSession);
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
      const { data, error } = await supabase
        .from('simulacoes')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (!error) {
        setSavedSimulations(data || []);
      }
    } catch (err: any) {
      console.error('Erro ao buscar produtos:', err.message || err);
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
        alert('Produto salvo com sucesso!');
        await fetchMyProducts();
        setActiveTab('meus-produtos');
      } else {
        throw error;
      }
    } catch (err: any) {
      const errorMessage = err?.message || (typeof err === 'object' ? JSON.stringify(err) : String(err));
      alert(`Falha ao salvar: ${errorMessage}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja realmente excluir este produto salvo?')) return;
    try {
      const { error } = await supabase.from('simulacoes').delete().eq('id', id);
      if (!error) {
        setSavedSimulations(prev => prev.filter(p => p.id !== id));
      } else {
        throw error;
      }
    } catch (err: any) {
      const errorMessage = err?.message || (typeof err === 'object' ? JSON.stringify(err) : String(err));
      alert(`Erro ao excluir: ${errorMessage}`);
    }
  };

  const handleSelectProduct = (sim: any) => {
    setInputs(sim.dados);
    setActiveTab('calculadora');
  };

  if (!isInitialized) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-[#FF4D00] border-t-transparent rounded-full animate-spin"></div>
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Verificando Credenciais...</span>
        </div>
      </div>
    );
  }

  if (!session) return <Login onLoginSuccess={setSession} />;

  const results = calculateCosts(inputs);
  const priceMatrix = generatePriceMatrix(results.custoFinal, inputs);

  return (
    <div className="h-screen w-full flex bg-[#f8fafc] overflow-hidden text-slate-900">
      <aside className={`bg-[#FF4D00] flex flex-col transition-all duration-300 ${sidebarCollapsed ? 'w-[70px]' : 'w-[260px]'} shrink-0 z-50`}>
        <div className="p-6 mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-10 h-10 bg-white/15 rounded-xl flex items-center justify-center shrink-0 border border-white/10">
               <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
            </div>
            {!sidebarCollapsed && <span className="text-white font-black tracking-tighter text-2xl italic uppercase">Tagway</span>}
          </div>
        </div>

        <nav className="flex-1 px-4 space-y-1.5">
          <MenuButton 
            active={activeTab === 'calculadora'} 
            onClick={() => setActiveTab('calculadora')} 
            icon="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
            label="Calculadora"
            collapsed={sidebarCollapsed}
          />
          <MenuButton 
            active={activeTab === 'catalogo'} 
            onClick={() => setActiveTab('catalogo')} 
            icon="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
            label="Catálogo NCM"
            collapsed={sidebarCollapsed}
          />
          <MenuButton 
            active={activeTab === 'meus-produtos'} 
            onClick={() => setActiveTab('meus-produtos')} 
            icon="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
            label="Meus Produtos"
            collapsed={sidebarCollapsed}
          />
          <MenuButton 
            active={activeTab === 'configuracoes'} 
            onClick={() => setActiveTab('configuracoes')} 
            icon="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
            label="Configurações"
            collapsed={sidebarCollapsed}
            badge="Dev"
          />
        </nav>

        <div className="p-4 mt-auto space-y-2">
          <button onClick={() => setSidebarCollapsed(!sidebarCollapsed)} className="w-full flex items-center gap-3 p-3 text-white/60 hover:text-white rounded-xl transition-all">
            <svg className={`w-5 h-5 transition-transform ${sidebarCollapsed ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 19l-7-7 7-7m8 14l-7-7 7-7"/></svg>
            {!sidebarCollapsed && <span className="text-[10px] font-bold uppercase tracking-widest">Recolher</span>}
          </button>
          <button onClick={() => supabase.auth.signOut()} className="w-full flex items-center gap-3 p-3 text-white/50 hover:text-white hover:bg-white/10 rounded-xl transition-all">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/></svg>
            {!sidebarCollapsed && <span className="text-[10px] font-bold uppercase tracking-widest">Sair</span>}
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-hidden flex flex-col relative">
        {activeTab === 'calculadora' && (
          <div className="flex-1 flex overflow-hidden">
            <div className="w-[360px] border-r border-slate-200 bg-white overflow-y-auto custom-scrollbar p-6 space-y-8 shadow-inner">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Configurações</h2>
                <button 
                  onClick={handleSave} 
                  disabled={isSaving}
                  className="bg-blue-600 hover:bg-blue-700 text-white text-[9px] font-black uppercase px-4 py-2 rounded-lg transition-all active:scale-95 disabled:opacity-50 shadow-lg shadow-blue-500/20"
                >
                  {isSaving ? 'Gravando...' : 'Salvar Produto'}
                </button>
              </div>
              <FiscalHeader inputs={inputs} setInputs={setInputs} />
              <Sidebar inputs={inputs} setInputs={setInputs} />
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar bg-[#f8fafc] p-10">
              <div className="max-w-5xl mx-auto animate-slide-up">
                 <ResultsTable results={results} priceMatrix={priceMatrix} inputs={inputs} />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'catalogo' && (
          <div className="flex-1 p-10 overflow-y-auto custom-scrollbar bg-white">
            <ProductsView onSelectNcm={(ncm) => {
              setInputs(prev => ({...prev, ncmCodigo: ncm.codigo, mvaOriginal: ncm.mvaOriginal, nomeProduto: ncm.descricao}));
              setActiveTab('calculadora');
            }} />
          </div>
        )}

        {activeTab === 'meus-produtos' && (
          <div className="flex-1 p-10 overflow-y-auto custom-scrollbar bg-slate-50">
            <div className="max-w-4xl mx-auto space-y-8">
              <header className="border-b border-slate-200 pb-8">
                <h2 className="text-4xl font-black text-slate-900 tracking-tighter uppercase italic">Meus Produtos</h2>
                <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px] mt-2">Simulações gravadas no seu histórico profissional</p>
              </header>

              <div className="grid gap-4">
                {savedSimulations.map(sim => (
                  <div key={sim.id} className="bg-white border border-slate-200 p-6 rounded-[2.5rem] flex flex-col md:flex-row md:items-center justify-between gap-6 hover:shadow-2xl transition-all group hover:border-blue-200">
                    <div className="flex items-center gap-6">
                      <div className="w-16 h-16 bg-slate-50 text-slate-400 rounded-3xl flex items-center justify-center shrink-0 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>
                      </div>
                      <div>
                        <h4 className="font-black text-slate-800 tracking-tight text-xl">{sim.nome_produto}</h4>
                        <div className="flex items-center gap-3 mt-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                          <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-600 font-mono">{sim.dados.ncmCodigo}</span>
                          <span className="text-blue-600">{sim.dados.ufOrigem} ➔ {sim.dados.ufDestino}</span>
                          <span>•</span>
                          <span>{new Date(sim.created_at).toLocaleDateString('pt-BR')}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <button onClick={() => handleSelectProduct(sim)} className="bg-slate-900 text-white px-8 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 transition-all active:scale-95 shadow-xl">Abrir</button>
                      <button onClick={() => handleDelete(sim.id)} className="p-4 text-slate-300 hover:text-rose-500 transition-colors hover:bg-rose-50 rounded-2xl">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                      </button>
                    </div>
                  </div>
                ))}

                {savedSimulations.length === 0 && (
                  <div className="py-24 text-center bg-white border-2 border-dashed border-slate-200 rounded-[3rem]">
                    <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                       <svg className="w-10 h-10 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"/></svg>
                    </div>
                    <p className="text-slate-400 font-black uppercase tracking-widest text-xs">Nenhum produto salvo</p>
                    <button onClick={() => setActiveTab('calculadora')} className="mt-4 text-blue-600 font-bold text-[10px] uppercase hover:underline tracking-widest">Fazer primeira simulação →</button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'configuracoes' && (
          <div className="flex-1 flex items-center justify-center bg-white">
            <div className="text-center space-y-4">
              <div className="w-24 h-24 bg-orange-50 text-orange-500 rounded-full flex items-center justify-center mx-auto mb-8 animate-pulse">
                <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/></svg>
              </div>
              <h3 className="text-2xl font-black text-slate-800 uppercase italic tracking-tighter">Módulo em Desenvolvimento</h3>
              <p className="text-slate-500 text-sm max-w-xs mx-auto font-medium">As configurações globais de impostos e usuários estarão disponíveis na versão 2.0.</p>
              <button onClick={() => setActiveTab('calculadora')} className="mt-6 bg-slate-900 text-white px-10 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-orange-600 transition-all active:scale-95 shadow-2xl">Voltar para Início</button>
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
  badge?: string;
}

const MenuButton: React.FC<MenuButtonProps> = ({ active, onClick, icon, label, collapsed, badge }) => (
  <button 
    onClick={onClick}
    className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all relative group ${
      active 
      ? 'bg-black/20 text-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)] ring-1 ring-white/10' 
      : 'text-white/70 hover:text-white hover:bg-white/10'
    }`}
  >
    <svg className={`w-5 h-5 shrink-0 ${active ? 'text-white' : 'text-white/60 group-hover:text-white'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d={icon}/>
    </svg>
    {!collapsed && (
      <div className="flex-1 flex items-center justify-between overflow-hidden">
        <span className="text-[11px] font-black uppercase tracking-[0.1em] whitespace-nowrap">{label}</span>
        {badge ? (
          <span className="text-[8px] bg-white text-[#FF4D00] px-1.5 py-0.5 rounded font-black uppercase shrink-0 shadow-sm">{badge}</span>
        ) : (
          <svg className="w-3 h-3 text-white/20" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd"/></svg>
        )}
      </div>
    )}
    {collapsed && (
      <div className="absolute left-full ml-4 bg-slate-900 text-white text-[10px] font-black uppercase px-4 py-3 rounded-xl opacity-0 group-hover:opacity-100 pointer-events-none transition-all translate-x-[-10px] group-hover:translate-x-0 z-[100] shadow-2xl border border-slate-800 whitespace-nowrap">
        {label}
      </div>
    )}
  </button>
);

export default App;
