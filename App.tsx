
import React, { useState, useEffect, useMemo } from 'react';
import Sidebar from './components/Sidebar';
import ResultsTable from './components/ResultsTable';
import FiscalHeader from './components/FiscalHeader';
import ProductsView from './components/ProductsView';
import OverheadView from './components/OverheadView';
import ResumoFiscalView from './components/ResumoFiscalView';
import ConfiguracaoView from './components/ConfiguracaoView';
import AdminView from './components/AdminView';
import Login from './components/Login';
import ComingSoonView from './components/ComingSoonView';
import AIView from './components/AIView';
import { SimulationInputs, CostItem, VariableCostItem } from './types';
import { calculateCosts, generatePriceMatrix } from './utils/calculations';
import { supabase } from './lib/supabase';

const MASTER_EMAIL = 'tagwaytw@gmail.com';

const defaultInputs: SimulationInputs = {
  nomeProduto: 'Exemplo Planilha Ref',
  valorCompra: 100.00,
  ipiPerc: 0.65,
  freteValor: 5.88,
  mva: 81.32,
  mvaOriginal: 81.32,
  icmsInternoDestino: 20.50,
  icmsInterestadual: 7.00,
  icmsCreditoMercadoria: 7.00,
  icmsCreditoFrete: 7.00,
  ufOrigem: 'SP',
  ufDestino: 'SP',
  ncmCodigo: '6907',
  pisCofinsRate: 9.25,
  excluirIcmsPis: true,
  pisCofinsVenda: 9.25,
  comissaoVenda: 0.0,
  icmsVenda: 20.50,
  outrosCustosVariaveis: 0.00,
  custosFixos: 20.00,
  resultadoDesejado: 8.00,
  mode: 'substituido',
  percReducaoBase: 0,
  simulationMode: 'buyToSell',
  precoVendaDesejado: 0
};

type Tab = 'calculadora' | 'catalogo' | 'meus-produtos' | 'overhead' | 'resumo-fiscal' | 'configuracao' | 'master' | 
           'logistica' | 'estoque' | 'metas' | 'dre' | 'caixa' | 'ia';

export const stringifyError = (err: any): string => {
  if (!err) return 'Erro desconhecido';
  if (typeof err === 'string') return err;
  const msg = err.message || err.error_description || err.error || err.msg;
  return msg || JSON.stringify(err);
};

// Componente BrainIcon - Fiel à nova marca (Esquerda Laranja / Direita Roxo)
const BrainIcon = () => (
  <svg className="w-9 h-9 shrink-0" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="brain_grad_sidebar" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#FF7A00" />
        <stop offset="100%" stopColor="#9D00FF" />
      </linearGradient>
    </defs>
    <path d="M50 15C38.9 15 30 23.9 30 35C30 37.1 30.3 39.1 30.9 41C24.8 42 20 47.3 20 53.5C20 60.4 25.6 66 32.5 66C32.2 68 32 70 32 72C32 83 41 92 52 92C63 92 72 83 72 72C72 70 71.8 68 71.5 66C78.4 66 84 60.4 84 53.5C84 47.3 79.2 42 73.1 41C73.7 39.1 74 37.1 74 35C74 23.9 65.1 15 54 15H50Z" fill="url(#brain_grad_sidebar)" />
    <text x="50" y="63" textAnchor="middle" fill="white" fontSize="14" fontWeight="900" style={{ fontFamily: 'Inter' }}>TW</text>
  </svg>
);

const App: React.FC = () => {
  const [session, setSession] = useState<any>(null);
  const [inputs, setInputs] = useState<SimulationInputs>(defaultInputs);
  const [activeTab, setActiveTab] = useState<Tab>('calculadora');
  const [isSaving, setIsSaving] = useState(false);
  const [savedSimulations, setSavedSimulations] = useState<any[]>([]);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [profileError, setProfileError] = useState<string | null>(null);

  const [faturamento, setFaturamento] = useState<number>(100000);
  const [fixedCosts, setFixedCosts] = useState<CostItem[]>([]);
  const [variableCosts, setVariableCosts] = useState<VariableCostItem[]>([]);
  const [isAutoSync, setIsAutoSync] = useState(false);

  const isMaster = useMemo(() => session?.user?.email === MASTER_EMAIL, [session]);
  const hasAdminAccess = useMemo(() => !!userProfile?.is_admin || isMaster, [userProfile, isMaster]);

  useEffect(() => {
    let mounted = true;
    const init = async () => {
      try {
        const { data: { session: currentSession }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError && sessionError.message.includes('refresh_token')) await supabase.auth.signOut();
        if (mounted) {
          setSession(currentSession);
          if (currentSession) {
            await fetchUserProfile(currentSession);
            await Promise.all([fetchMyProducts(currentSession), fetchOverheadConfig(currentSession)]).catch(() => {});
          }
          setIsInitialized(true);
        }
      } catch (e) {
        if (mounted) setIsInitialized(true);
      }
    };
    init();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      if (mounted) {
        setSession(newSession);
        if (newSession) {
          await fetchUserProfile(newSession);
          await fetchMyProducts(newSession);
          await fetchOverheadConfig(newSession);
        } else {
          setUserProfile(null);
          setProfileError(null);
        }
      }
    });
    return () => { mounted = false; subscription.unsubscribe(); };
  }, []);

  const fetchUserProfile = async (userSession: any) => {
    if (!userSession?.user?.id) return;
    try {
      const { data, error } = await supabase.from('user_configs').select('*').eq('user_id', userSession.user.id).maybeSingle();
      if (error) throw error;
      if (data) setUserProfile(data);
      else if (!isMaster) setProfileError(`Conta não configurada no banco de dados. UID: ${userSession.user.id}`);
    } catch (err: any) {
      if (err.status !== 401) setProfileError(stringifyError(err));
    }
  };

  const fetchOverheadConfig = async (userSession: any) => {
    try {
      const { data } = await supabase.from('overhead_configs').select('*').eq('user_id', userSession.user.id).maybeSingle();
      if (data) {
        if (data.faturamento) setFaturamento(Number(data.faturamento));
        if (data.fixed_costs) setFixedCosts(data.fixed_costs);
        if (data.variable_costs) setVariableCosts(data.variable_costs);
        if (data.is_auto_sync !== undefined) setIsAutoSync(!!data.is_auto_sync);
      }
    } catch (e) {}
  };

  const fetchMyProducts = async (currentSession = session) => {
    if (!currentSession?.user?.id) return;
    try {
      const { data } = await supabase.from('simulacoes').select('*').eq('user_id', currentSession.user.id).order('created_at', { ascending: false });
      if (data) setSavedSimulations(data);
    } catch (e) {}
  };

  const handleSave = async () => {
    if (!session?.user?.id) return;
    setIsSaving(true);
    try {
      const { error } = await supabase.from('simulacoes').insert([{ user_id: session.user.id, nome_produto: inputs.nomeProduto || 'Produto Sem Nome', dados: inputs }]);
      if (error) throw error;
      alert('Simulação salva!');
      await fetchMyProducts();
      setActiveTab('meus-produtos');
    } catch (err: any) { 
      alert('Erro: ' + stringifyError(err)); 
    } finally { 
      setIsSaving(false); 
    }
  };

  const results = calculateCosts(inputs);
  const priceMatrix = generatePriceMatrix(results.custoFinal, inputs);

  if (!isInitialized) return null;
  if (!session) return <Login onLoginSuccess={setSession} />;

  if (profileError && !isMaster) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-[#000000] p-8 fixed inset-0 z-[5000]">
        <div className="max-w-md bg-white rounded-[3rem] p-10 text-center shadow-2xl animate-slide-up">
          <div className="w-20 h-20 bg-rose-50 text-rose-500 rounded-3xl flex items-center justify-center mx-auto mb-6"><svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg></div>
          <h2 className="text-2xl font-black text-slate-900 mb-4 uppercase italic tracking-tighter">Perfil Indisponível</h2>
          <p className="text-slate-500 text-sm mb-8 font-medium">{profileError}</p>
          <button onClick={() => supabase.auth.signOut()} className="w-full bg-slate-900 text-white py-4 rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-black transition-all shadow-lg">Sair da Conta</button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-full flex flex-col lg:flex-row bg-[#f8fafc] overflow-hidden text-slate-900 relative">
      {/* Sidebar - Black Background (Requested) */}
      <aside className={`bg-[#000000] flex lg:flex-col transition-all duration-500 z-[100] border-t lg:border-t-0 lg:border-r border-white/5 shadow-2xl ${sidebarCollapsed ? 'lg:w-[90px]' : 'lg:w-[280px]'} fixed bottom-0 left-0 w-full lg:relative lg:h-screen h-[70px] lg:h-auto overflow-y-auto no-scrollbar`}>
        {/* Header Logo - Horizontal (Imagem 3) */}
        <div className="hidden lg:flex p-6 mb-4 items-center justify-between border-b border-white/5">
          <div className="flex items-center gap-4 overflow-hidden">
            <div className="shrink-0 flex items-center justify-center">
              <BrainIcon />
            </div>
            {!sidebarCollapsed && (
              <span className="text-white font-black tracking-tighter text-[2.2rem] italic uppercase animate-slide-up leading-none">
                TAGWAY
              </span>
            )}
          </div>
          <button onClick={() => setSidebarCollapsed(!sidebarCollapsed)} className="p-2 hover:bg-white/10 rounded-lg text-white/40">
             <svg className={`w-4 h-4 transition-transform ${sidebarCollapsed ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M11 19l-7-7 7-7"/></svg>
          </button>
        </div>
        
        <nav className="flex-1 flex lg:flex-col items-center lg:items-stretch justify-start lg:px-4 lg:space-y-1 p-1">
          <div className={`hidden lg:block text-[8px] font-black text-white/20 uppercase tracking-[0.2em] px-4 py-2 transition-opacity ${sidebarCollapsed ? 'opacity-0 h-0 p-0 overflow-hidden' : 'opacity-100'}`}>Operacional</div>
          <MenuButton active={activeTab === 'calculadora'} onClick={() => setActiveTab('calculadora')} label="Calculadora" collapsed={sidebarCollapsed} icon="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/>
          <MenuButton active={activeTab === 'resumo-fiscal'} onClick={() => setActiveTab('resumo-fiscal')} label="Resumo Fiscal" collapsed={sidebarCollapsed} icon="M9 17v-2m3 2v-4m3 2v-6m-8-2h8a2 2 0 012 2v9a2 2 0 01-2 2H7a2 2 0 01-2-2V5a2 2 0 012-2z"/>
          <MenuButton active={activeTab === 'catalogo'} onClick={() => setActiveTab('catalogo')} label="Catálogo" collapsed={sidebarCollapsed} icon="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
          <MenuButton active={activeTab === 'meus-produtos'} onClick={() => setActiveTab('meus-produtos')} label="Meus Produtos" collapsed={sidebarCollapsed} icon="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/>
          
          <div className={`hidden lg:block text-[8px] font-black text-white/20 uppercase tracking-[0.2em] px-4 py-4 border-t border-white/5 mt-2 transition-opacity ${sidebarCollapsed ? 'opacity-0 h-0 p-0 overflow-hidden' : 'opacity-100'}`}> ROADMAP 2026</div>
          <MenuButton active={activeTab === 'logistica'} onClick={() => setActiveTab('logistica')} label="Logística" collapsed={sidebarCollapsed} icon="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" isDev />
          <MenuButton active={activeTab === 'estoque'} onClick={() => setActiveTab('estoque')} label="Estoque Médio" collapsed={sidebarCollapsed} icon="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" isDev />
          <MenuButton active={activeTab === 'metas'} onClick={() => setActiveTab('metas')} label="Metas" collapsed={sidebarCollapsed} icon="M13 10V3L4 14h7v7l9-11h-7z" isDev />
          <MenuButton active={activeTab === 'dre'} onClick={() => setActiveTab('dre')} label="DRE" collapsed={sidebarCollapsed} icon="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2" isDev />
          <MenuButton active={activeTab === 'caixa'} onClick={() => setActiveTab('caixa')} label="Fluxo de Caixa" collapsed={sidebarCollapsed} icon="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2" isDev />
          <MenuButton active={activeTab === 'ia'} onClick={() => setActiveTab('ia')} label="Módulo IA" collapsed={sidebarCollapsed} icon="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" isDev isAi />

          <div className={`hidden lg:block text-[8px] font-black text-white/20 uppercase tracking-[0.2em] px-4 py-4 border-t border-white/5 mt-2 transition-opacity ${sidebarCollapsed ? 'opacity-0 h-0 p-0 overflow-hidden' : 'opacity-100'}`}>Configuração</div>
          <MenuButton active={activeTab === 'overhead'} onClick={() => setActiveTab('overhead')} label="Overhead" collapsed={sidebarCollapsed} icon="M4 6h16M4 12h16m-7 6h7"/>
          <MenuButton active={activeTab === 'configuracao'} onClick={() => setActiveTab('configuracao')} label="Ajustes" collapsed={sidebarCollapsed} icon="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/>
          {hasAdminAccess && <MenuButton active={activeTab === 'master'} onClick={() => setActiveTab('master')} label="Master" collapsed={sidebarCollapsed} icon="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04M12 2.944v10m0 0a2 2 0 100 4 2 2 0 000-4z"/>}
        </nav>

        <div className="lg:mt-auto lg:p-4 border-t border-white/5 hidden lg:block">
           <button onClick={() => setSidebarCollapsed(!sidebarCollapsed)} className={`hidden lg:flex items-center gap-4 w-full p-4 rounded-2xl text-white/20 hover:text-white hover:bg-white/10 transition-all mb-2 ${sidebarCollapsed ? 'justify-center' : ''}`}>
             <svg className={`w-5 h-5 transition-transform ${sidebarCollapsed ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 5l7 7-7 7M5 5l7 7-7 7"/></svg>
             {!sidebarCollapsed && <span className="text-[10px] font-black uppercase tracking-widest">Recolher</span>}
           </button>
           <button onClick={() => supabase.auth.signOut()} className={`flex items-center gap-4 w-full p-4 rounded-2xl text-rose-500 hover:bg-rose-500/10 transition-all ${sidebarCollapsed ? 'justify-center' : ''}`}>
             <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013-3v1"/></svg>
             {!sidebarCollapsed && <span className="text-[11px] font-black uppercase tracking-widest">Sair</span>}
           </button>
        </div>
      </aside>

      <main className="flex-1 overflow-hidden flex flex-col relative pb-[70px] lg:pb-0">
        <div className="absolute top-10 right-10 z-[90] hidden md:flex items-center gap-4 animate-slide-up">
           <div className="glass-card border border-slate-200/50 px-6 py-3 rounded-2xl flex items-center gap-4 shadow-xl">
              <div className={`w-2 h-2 rounded-full animate-pulse ${userProfile?.status === 'ativo' || isMaster ? 'bg-emerald-500' : 'bg-rose-500'}`}></div>
              <div className="flex flex-col">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-800 leading-none mb-1">{userProfile?.nome_completo || (isMaster ? 'Master Admin' : 'Operador')}</span>
                <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">{userProfile?.empresa_nome || 'Tagway Cloud'}</span>
              </div>
           </div>
        </div>

        {activeTab === 'calculadora' && (
          <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
            <div className="w-full lg:w-[380px] border-b lg:border-b-0 lg:border-r border-slate-200 bg-white overflow-y-auto custom-scrollbar p-6 pt-0 space-y-8 shadow-inner">
              <div className="flex items-center justify-between sticky top-0 bg-white/95 backdrop-blur-sm z-30 -mx-6 px-6 py-5 border-b border-slate-100 mb-6">
                <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Parâmetros</h2>
                <button onClick={handleSave} disabled={isSaving} className="bg-black text-white text-[9px] font-black uppercase px-6 py-2.5 rounded-xl transition-all shadow-xl">{isSaving ? 'Salvando...' : 'Salvar'}</button>
              </div>
              <FiscalHeader inputs={inputs} setInputs={setInputs}/>
              <Sidebar inputs={inputs} setInputs={setInputs} isAutoSync={isAutoSync} setIsAutoSync={setIsAutoSync} />
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar bg-[#f8fafc] p-4 md:p-8 lg:p-12">
              <div className="max-w-5xl mx-auto animate-slide-up"><ResultsTable results={results} priceMatrix={priceMatrix} inputs={inputs}/></div>
            </div>
          </div>
        )}
        {activeTab === 'resumo-fiscal' && <div className="flex-1 p-6 md:p-12 overflow-y-auto custom-scrollbar bg-slate-50"><ResumoFiscalView results={results} inputs={inputs} /></div>}
        {activeTab === 'configuracao' && <div className="flex-1 p-6 md:p-12 overflow-y-auto custom-scrollbar bg-slate-50"><ConfiguracaoView userId={session?.user?.id} /></div>}
        {activeTab === 'master' && hasAdminAccess && <div className="flex-1 p-6 md:p-12 overflow-y-auto custom-scrollbar bg-slate-50"><AdminView /></div>}
        {activeTab === 'overhead' && <div className="flex-1 p-6 md:p-12 overflow-y-auto custom-scrollbar bg-slate-50"><OverheadView faturamento={faturamento} setFaturamento={setFaturamento} fixedCosts={fixedCosts} setFixedCosts={setFixedCosts} variableCosts={variableCosts} setVariableCosts={setVariableCosts} userId={session?.user?.id} isAutoSync={isAutoSync} setIsAutoSync={setIsAutoSync} /></div>}
        {activeTab === 'catalogo' && <div className="flex-1 p-6 md:p-12 overflow-y-auto custom-scrollbar bg-white"><ProductsView onSelectNcm={(ncm) => { setInputs(prev => ({...prev, ncmCodigo: ncm.codigo, mvaOriginal: ncm.mvaOriginal, nomeProduto: ncm.descricao})); setActiveTab('calculadora'); }}/></div>}
        {activeTab === 'meus-produtos' && <div className="flex-1 p-6 md:p-12 overflow-y-auto custom-scrollbar bg-slate-50"><div className="max-w-4xl mx-auto space-y-8"><header className="border-b border-slate-200 pb-8"><h2 className="text-3xl lg:text-4xl font-black text-slate-900 tracking-tighter uppercase italic leading-tight">Meus Produtos</h2></header><div className="grid gap-4">{savedSimulations.map(sim => (<div key={sim.id} className="bg-white border border-slate-200 p-6 rounded-[2rem] flex flex-col md:flex-row md:items-center justify-between gap-6 hover:shadow-2xl transition-all group hover:border-black"><div className="flex items-center gap-6"><div className="w-14 h-14 bg-slate-50 text-slate-400 rounded-2xl flex items-center justify-center shrink-0 group-hover:bg-black group-hover:text-white transition-all shadow-sm"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg></div><div><h4 className="font-black text-slate-800 tracking-tight text-lg truncate">{sim.nome_produto}</h4><span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{new Date(sim.created_at).toLocaleDateString('pt-BR')}</span></div></div><button onClick={() => { setInputs(sim.dados); setActiveTab('calculadora'); }} className="bg-black text-white px-8 py-3.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg">Abrir Cálculo</button></div>))}</div></div></div>}
        
        {/* RoadMap 2026 Views */}
        {activeTab === 'logistica' && <ComingSoonView title="Logística Inteligente" desc="Comparativo de fretes e rotas otimizadas para redução de ICMS no transporte." icon="M8 7h12m0 0l-4-4m4 4l-4 4" />}
        {activeTab === 'estoque' && <ComingSoonView title="Giro e Tempo Médio" desc="Análise preditiva de obsolescência e impacto do custo financeiro no estoque parado." icon="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />}
        {activeTab === 'metas' && <ComingSoonView title="Painel de Metas" desc="Defina orçamentos mensais e acompanhe o desempenho comercial vs. impostos recolhidos." icon="M13 10V3L4 14h7v7l9-11h-7z" />}
        {activeTab === 'dre' && <ComingSoonView title="DRE Gerencial" desc="Demonstrativo completo de resultados: do faturamento ao lucro líquido real pós-impostos." icon="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2" />}
        {activeTab === 'caixa' && <ComingSoonView title="Fluxo de Caixa" desc="Gestão de pagamentos de guias (DARE/GNRE) e entradas de recebíveis parcelados." icon="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2" />}
        {activeTab === 'ia' && <AIView results={results} inputs={inputs} />}
      </main>
    </div>
  );
};

interface MenuButtonProps { active: boolean; onClick: () => void; icon: string; label: string; collapsed: boolean; isDev?: boolean; isAi?: boolean; }
const MenuButton: React.FC<MenuButtonProps> = ({ active, onClick, icon, label, collapsed, isDev, isAi }) => (
  <button onClick={onClick} className={`flex flex-col lg:flex-row items-center lg:w-full gap-2 lg:gap-3 p-2.5 lg:p-3 lg:rounded-xl transition-all relative group shrink-0 ${active ? 'bg-white text-black lg:shadow-xl' : 'text-white/40 hover:text-white lg:hover:bg-white/10'} ${collapsed ? 'justify-center' : ''}`}>
    <div className={`relative ${isAi && 'animate-pulse'}`}>
      <svg className={`w-4 h-4 shrink-0 transition-colors ${active ? 'text-black' : isAi ? 'text-indigo-400' : 'text-white/40 group-hover:text-white'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d={icon}/></svg>
      {isDev && !active && <div className="absolute -top-1 -right-1 w-1.5 h-1.5 bg-indigo-500 rounded-full"></div>}
    </div>
    {!collapsed && (
      <div className="flex items-center justify-between flex-1 overflow-hidden transition-all duration-300">
        <span className={`text-[9px] font-black uppercase tracking-widest whitespace-nowrap ${isAi ? 'text-indigo-200' : ''}`}>{label}</span>
        {isDev && !active && <span className="hidden lg:block text-[6px] font-black bg-indigo-500/20 text-indigo-300 px-1 py-0.5 rounded leading-none">2026</span>}
      </div>
    )}
  </button>
);

export default App;
