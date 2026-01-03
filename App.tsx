
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

const App: React.FC = () => {
  const [session, setSession] = useState<any>(null);
  const [inputs, setInputs] = useState<SimulationInputs>(defaultInputs);
  const [mainTab, setMainTab] = useState<'calculadora' | 'catalogo' | 'meus-produtos'>('calculadora');
  const [isSaving, setIsSaving] = useState(false);
  const [savedSimulations, setSavedSimulations] = useState<any[]>([]);
  const [configCollapsed, setConfigCollapsed] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchMyProducts();
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) fetchMyProducts();
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchMyProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('simulacoes')
        .select('*')
        .order('created_at', { ascending: false });
      if (!error) setSavedSimulations(data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSave = async () => {
    if (!session) return;
    if (savedSimulations.length >= 100) {
      alert('Limite atingido (100/100).');
      return;
    }
    setIsSaving(true);
    try {
      const { error } = await supabase.from('simulacoes').insert([{ 
        user_id: session.user.id, 
        nome_produto: inputs.nomeProduto || 'Produto Sem Nome', 
        dados: inputs 
      }]);
      if (!error) {
        alert('Simulação salva!');
        fetchMyProducts();
      }
    } catch (err) {
      alert('Erro ao salvar');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!confirm('Excluir permanentemente?')) return;
    try {
      const { error } = await supabase.from('simulacoes').delete().eq('id', id);
      if (!error) setSavedSimulations(prev => prev.filter(p => p.id !== id));
    } catch (err) {
      alert('Erro ao excluir');
    }
  };

  if (!session) return <Login onLoginSuccess={setSession} />;

  const results = calculateCosts(inputs);
  const priceMatrix = generatePriceMatrix(results.custoFinal, inputs);

  return (
    <div className="h-screen w-full flex flex-col md:flex-row bg-[#f8fafc] overflow-hidden text-slate-900 font-sans">
      
      {/* Sidebar Desktop Navigation */}
      <aside className="hidden md:flex w-[70px] bg-[#0f172a] flex-col items-center py-8 gap-8 border-r border-slate-800 shrink-0 z-50">
        <div className="w-11 h-11 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/30 transition-transform hover:scale-105 active:scale-95 cursor-pointer">
          <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
        </div>
        
        <nav className="flex flex-col gap-6">
          <NavItem icon="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" label="Calculadora" active={mainTab === 'calculadora'} onClick={() => setMainTab('calculadora')} />
          <NavItem icon="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" label="Catálogo" active={mainTab === 'catalogo'} onClick={() => setMainTab('catalogo')} />
          <NavItem icon="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" label="Meus Produtos" active={mainTab === 'meus-produtos'} onClick={() => setMainTab('meus-produtos')} />
          
          <div className="h-px bg-slate-800/50 w-8 mx-auto my-2"></div>
          
          <button 
            onClick={() => setConfigCollapsed(!configCollapsed)}
            className={`p-3 rounded-2xl transition-all ${!configCollapsed ? 'text-blue-400 bg-blue-500/10' : 'text-slate-500 hover:text-white'}`}
            title="Recolher Painel"
          >
            <svg className={`w-6 h-6 transition-transform duration-500 ${configCollapsed ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 19l-7-7 7-7m8 14l-7-7 7-7"/>
            </svg>
          </button>
        </nav>

        <button onClick={() => supabase.auth.signOut()} className="mt-auto p-3 text-slate-500 hover:text-rose-400 transition-colors">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/></svg>
        </button>
      </aside>

      {/* Main Container */}
      <main className="flex-1 flex flex-col md:flex-row overflow-hidden relative pb-[70px] md:pb-0">
        {mainTab === 'calculadora' ? (
          <>
            {/* Sidebar Config Desktop (Animada) */}
            <div className={`hidden md:flex flex-col border-r border-slate-200 bg-white transition-all duration-500 ease-in-out overflow-hidden ${configCollapsed ? 'w-0 opacity-0' : 'w-[360px] opacity-100'}`}>
              <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-8 min-w-[360px]">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Configuração Fiscal</span>
                    <span className="text-[11px] font-bold text-slate-400">Slots: {savedSimulations.length}/100</span>
                  </div>
                  <button onClick={handleSave} disabled={isSaving} className="bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-black uppercase px-5 py-2.5 rounded-xl shadow-lg shadow-blue-500/20 transition-all active:scale-95 disabled:opacity-50">
                    {isSaving ? 'Gravando...' : 'Salvar'}
                  </button>
                </div>
                <FiscalHeader inputs={inputs} setInputs={setInputs} />
                <Sidebar inputs={inputs} setInputs={setInputs} />
              </div>
            </div>

            {/* Dashboard Central */}
            <div className="flex-1 overflow-y-auto custom-scrollbar bg-[#f8fafc] scroll-smooth">
              <div className="p-4 md:p-10 max-w-7xl mx-auto space-y-10 animate-slide-up">
                {/* Mobile Fiscal Summary Header (Visible only on mobile) */}
                <div className="md:hidden bg-[#0f172a] rounded-[2.5rem] p-6 text-white mb-6 shadow-2xl">
                   <div className="flex justify-between items-center mb-4">
                     <h2 className="text-xl font-black uppercase italic italic">Calculadora</h2>
                     <button onClick={() => setConfigCollapsed(!configCollapsed)} className="p-2 bg-slate-800 rounded-lg">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"/></svg>
                     </button>
                   </div>
                   {!configCollapsed && (
                     <div className="space-y-4 pt-4 border-t border-slate-800">
                        <FiscalHeader inputs={inputs} setInputs={setInputs} />
                        <Sidebar inputs={inputs} setInputs={setInputs} />
                        <button onClick={handleSave} className="w-full bg-blue-600 py-4 rounded-2xl font-black uppercase tracking-widest text-xs">Salvar Simulação</button>
                     </div>
                   )}
                </div>

                <ResultsTable results={results} priceMatrix={priceMatrix} inputs={inputs} />
              </div>
            </div>
          </>
        ) : mainTab === 'catalogo' ? (
          <div className="flex-1 p-6 md:p-12 overflow-y-auto bg-slate-50 custom-scrollbar">
            <ProductsView onSelectNcm={(ncm) => { 
              setInputs(prev => ({...prev, ncmCodigo: ncm.codigo, mvaOriginal: ncm.mvaOriginal, nomeProduto: ncm.descricao})); 
              setMainTab('calculadora'); 
              setConfigCollapsed(false);
            }} />
          </div>
        ) : (
          <div className="flex-1 p-6 md:p-12 overflow-y-auto bg-slate-50 custom-scrollbar">
            <div className="max-w-4xl mx-auto">
              <header className="mb-12">
                <h2 className="text-4xl font-black text-slate-900 tracking-tighter uppercase italic italic">Biblioteca</h2>
                <p className="text-slate-500 font-bold uppercase tracking-widest text-xs mt-2">Gestão de {savedSimulations.length} produtos salvos</p>
              </header>
              <div className="grid gap-4">
                {savedSimulations.map(sim => (
                  <ProductCard key={sim.id} sim={sim} onSelect={() => { setInputs(sim.dados); setMainTab('calculadora'); }} onDelete={() => handleDeleteProduct(sim.id)} />
                ))}
                {savedSimulations.length === 0 && (
                  <div className="py-20 text-center border-2 border-dashed border-slate-200 rounded-[3rem] bg-white">
                    <p className="text-slate-400 font-black uppercase tracking-widest text-xs">Nenhum registro encontrado</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Mobile Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 w-full h-[75px] bg-white border-t border-slate-200 flex items-center justify-around px-6 z-[100] shadow-[0_-10px_30px_rgba(0,0,0,0.05)]">
        <MobileNavItem active={mainTab === 'calculadora'} onClick={() => setMainTab('calculadora')} icon="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
        <MobileNavItem active={mainTab === 'catalogo'} onClick={() => setMainTab('catalogo')} icon="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        <MobileNavItem active={mainTab === 'meus-produtos'} onClick={() => setMainTab('meus-produtos')} icon="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
        <button onClick={() => supabase.auth.signOut()} className="p-3 text-rose-500"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/></svg></button>
      </nav>
    </div>
  );
};

const NavItem = ({ icon, label, active, onClick }: any) => (
  <button onClick={onClick} className={`p-3.5 rounded-2xl transition-all relative group ${active ? 'bg-blue-600 text-white' : 'text-slate-500 hover:text-white hover:bg-slate-800'}`}>
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={icon}/></svg>
    <span className="absolute left-[70px] bg-slate-900 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap font-black uppercase tracking-widest">{label}</span>
  </button>
);

const MobileNavItem = ({ icon, active, onClick }: any) => (
  <button onClick={onClick} className={`p-4 rounded-2xl transition-all ${active ? 'bg-blue-600 text-white -translate-y-4 shadow-xl shadow-blue-500/30' : 'text-slate-400'}`}>
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d={icon}/></svg>
  </button>
);

const ProductCard = ({ sim, onSelect, onDelete }: any) => (
  <div className="bg-white border border-slate-200 p-6 rounded-[2rem] flex flex-col md:flex-row md:items-center justify-between gap-6 hover:shadow-2xl hover:-translate-y-1 transition-all group">
    <div className="flex items-center gap-5">
      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${sim.dados.mode === 'substituido' ? 'bg-blue-50 text-blue-600' : 'bg-emerald-50 text-emerald-600'}`}>
        <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/></svg>
      </div>
      <div>
        <h4 className="font-black text-slate-800 tracking-tight text-lg">{sim.nome_produto}</h4>
        <div className="flex items-center gap-3 mt-1.5">
          <span className="text-[10px] font-black uppercase text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">{sim.dados.ufOrigem} ➔ {sim.dados.ufDestino}</span>
          <span className="text-[10px] font-bold text-slate-400 uppercase">{new Date(sim.created_at).toLocaleDateString()}</span>
        </div>
      </div>
    </div>
    <div className="flex items-center gap-3">
      <button onClick={onSelect} className="flex-1 md:flex-none bg-slate-900 text-white px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 transition-all active:scale-95 shadow-lg">Abrir</button>
      <button onClick={onDelete} className="p-3 text-slate-300 hover:text-rose-500 transition-colors"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg></button>
    </div>
  </div>
);

export default App;
