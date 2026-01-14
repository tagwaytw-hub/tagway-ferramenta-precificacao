
import React, { useState, useEffect, useMemo, useCallback } from 'react';
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
import MyProductsView from './components/MyProductsView';
import { SimulationInputs, CostItem, VariableCostItem } from './types';
import { calculateCosts, generatePriceMatrix } from './utils/calculations';
import { supabase } from './lib/supabase';

const MASTER_EMAIL = 'tagwaytw@gmail.com';

const defaultInputs: SimulationInputs = {
  nomeProduto: '',
  valorCompra: 0,
  ipiPerc: 0,
  freteValor: 0,
  mva: 0,
  mvaOriginal: 0,
  icmsInternoDestino: 20.50,
  icmsInterestadual: 7.00,
  icmsCreditoMercadoria: 7.00,
  icmsCreditoFrete: 7.00,
  ufOrigem: 'SP',
  ufDestino: 'SP',
  ncmCodigo: '',
  pisCofinsRate: 9.25,
  excluirIcmsPis: false,
  pisCofinsVenda: 9.25,
  comissaoVenda: 0.0,
  icmsVenda: 20.50,
  outrosCustosVariaveis: 0.00,
  custosFixos: 20.00,
  resultadoDesejado: 8.00,
  mode: 'tributado',
  percReducaoBase: 0,
  simulationMode: 'buyToSell',
  precoVendaDesejado: 0
};

type Tab = 'calculadora' | 'catalogo' | 'meus-produtos' | 'overhead' | 'resumo-fiscal' | 'configuracao' | 'master' | 'jarvis' | 'logistica' | 'estoque' | 'metas' | 'dre' | 'caixa';

export const TagwayHorizontalLogo = ({ className = "w-auto h-8", textColor = "#FF6600", cerberusColor = "#8200AD" }: { className?: string, textColor?: string, cerberusColor?: string }) => (
  <svg className={className} viewBox="0 0 14918.7 3266.79" fill="none" xmlns="http://www.w3.org/2000/svg">
    <g id="_1949254011840">
      <path fill={cerberusColor} d="M2403.79 3133.39c-210.68,0 -386.67,-115.49 -429.1,-269.53l0 -481.67 358.15 0 141.55 245.17c-12.68,20.37 -20,44.43 -20,70.2 0,73.5 59.59,133.1 133.1,133.1 73.5,0 133.1,-59.59 133.1,-133.1 0,-73.51 -59.59,-133.1 -133.1,-133.1 -7.13,0 -14.14,0.56 -20.97,1.64l-169.94 -294.34 -421.9 0 0 -279.9 -110.42 0 0 886.24c21.19,217.4 254.65,388.68 539.52,388.68 244.16,0 450.56,-125.82 517.9,-298.66 211.22,11.92 414.96,-169.81 469.9,-430.53 25.85,-122.69 14.49,-242.67 -25.42,-343.07 150.55,-137.08 245.47,-369.17 236.8,-628.73 -11.32,-339.15 -195.89,-618.2 -437.02,-694.97 20.42,-51 31.64,-106.68 31.64,-164.98 0,-245.35 -198.9,-444.24 -444.25,-444.24 -25.03,0 -49.59,2.07 -73.49,6.05 -53.57,-154.78 -220.28,-267.64 -417.62,-267.64 -176.61,0 -328.67,90.38 -397.08,220.3l0 1081.68 110.42 0 0 -236.96 279.71 0 194.17 -351.84 2.26 -4.1c4.75,-0.73 9.41,-1.71 13.98,-2.92 18.96,-8.63 37.09,-18.43 54.26,-29.29 27.33,-24.37 44.53,-59.85 44.53,-99.35 0,-73.51 -59.59,-133.1 -133.1,-133.1 -73.5,0 -133.1,59.59 -133.1,133.1 0,39.67 17.36,75.29 44.89,99.67l-153.09 277.4 -214.53 0 0 -683.38c65.5,-78.21 170.22,-128.86 288.22,-128.86 172.11,0 315.95,107.74 351.09,251.59 34.64,-10.66 71.44,-16.41 109.58,-16.41 205.4,0 371.92,166.51 371.92,371.91 0,68.38 -18.46,132.45 -50.66,187.5 236.97,73.4 417.37,325.32 428.56,630.72 9.47,258.64 -104.92,487.35 -280.49,605.64 43.59,69.18 68.93,151.78 68.93,240.5 0,243.69 -191.13,441.23 -426.89,441.23 -0.22,0 -0.44,0 -0.65,0 -38.03,158.43 -216.7,278.36 -431.38,278.36z"/>
      <path fill={textColor} d="M4777.68 2721.46l0 -1844.66 647.62 0 0 -313.08 -1608.32 0 0 313.08 650.7 0 0 1844.66 310 0zm1332.08 -1691.2l263.97 758.12 -534.06 0 270.09 -758.12zm641.49 1681.99l331.49 0 -862.48 -2176.15 -227.13 0 -862.48 2176.15 334.56 0c67.53,-178.02 174.96,-435.84 257.82,-632.28l770.4 0 257.82 632.28zm2341.89 -1378.12c-113.57,-570.89 -610.8,-782.68 -1022.09,-782.68 -592.38,0 -1055.84,454.26 -1055.84,1089.61 0,632.29 454.25,1086.54 1055.84,1086.54 389.81,0 831.78,-263.96 979.11,-675.25l0 3.07c27.62,-70.6 42.97,-190.29 58.32,-371.39l-1157.14 0 0 310 794.96 0c-128.92,313.07 -411.29,435.84 -675.25,435.84 -420.5,0 -745.84,-334.56 -745.84,-788.82 0,-451.19 325.35,-779.61 745.84,-779.61 273.17,0 604.66,125.85 690.6,472.68l331.49 0zm1728.02 1396.53l230.2 0 715.15 -2163.86 -325.35 0c-159.61,488.02 -346.83,1034.36 -515.65,1546.94l-349.9 -1000.6 -248.61 0 -352.97 1003.67 -512.57 -1550 -322.28 0 715.14 2163.86 230.2 0c110.5,-325.35 242.48,-690.59 365.24,-1040.5l371.39 1040.5zm1645.15 -1700.4l263.97 758.12 -534.06 0 270.09 -758.12zm641.49 1681.99l331.49 0 -862.48 -2176.15 -227.13 0 -862.48 2176.15 334.56 0c67.53,-178.02 174.96,-435.84 257.82,-632.28l770.4 0 257.82 632.28zm-95.14 -2145.45l794.95 1270.69 0 874.76 313.07 0 0 -874.76 798.03 -1270.69 -368.32 0 -586.24 942.28 -586.24 -942.28 -365.24 0z"/>
    </g>
  </svg>
);

const CompactLogo = () => (
  <svg className="w-8 h-8" viewBox="0 0 1080.48 979.51" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path fill="#8200AD" d="M720.75 939.52c-63.17,0-115.94-34.63-128.66-80.82l0-144.42 107.39 0 42.44 73.51c-3.8,6.11-6,13.32-6,21.05 0,22.04 17.87,39.91 39.91,39.91 22.04,0 39.91-17.87 39.91-39.91 0-22.04-17.87-39.91-39.91-39.91-2.14,0-4.24,0.17-6.29,0.49l-50.95-88.25-126.5 0 0-83.93-33.11 0 0 265.73c6.35,65.19 76.35,116.54 161.77,116.54 73.21,0 135.1-37.73 155.29-89.55 63.33,3.57 124.42-50.92 140.89-129.09 7.75-36.79 4.35-72.76-7.62-102.87 45.14-41.1 73.6-110.69 71-188.52-3.39-101.69-58.74-185.36-131.04-208.38 6.12-15.29 9.49-31.99 9.49-49.47 0-73.56-59.64-133.2-133.2-133.2-7.51,0-14.87,0.62-22.04,1.81-16.06-46.41-66.05-80.25-125.22-80.25-52.95,0-98.55,27.1-119.06,66.06l0 324.33 33.11 0 0-71.05 83.87 0 58.22-105.5 0.68-1.23c1.42-0.22 2.82-0.51 4.19-0.88 5.69-2.59 11.12-5.53 16.27-8.78 8.19-7.31 13.35-17.95 13.35-29.79 0-22.04 17.87-39.91 39.91-39.91 22.04,0 39.91 17.87 39.91 39.91 0,11.9 5.2,22.58 13.46,29.89l-45.9 83.17-64.33 0 0-204.91c19.64-23.45 51.04-38.64 86.42-38.64 51.6,0 94.73 32.31 105.27,75.44 10.39-3.2 21.42-4.92 32.86-4.92 61.59,0 111.51,49.93 111.51,111.51 0,20.5-5.54,39.71-15.19,56.22 71.05,22.01 125.14,97.54 128.5,189.11 2.84,77.55-31.46,146.13-84.1,181.6 13.07,20.74 20.67,45.51 20.67,72.11 0,73.07-57.31,132.3-128,132.3-0.07,0-0.13,0-0.2,0-11.4,47.5-64.97,83.46-129.34,83.46z"/>
    <path fill="#FF6600" d="M473.09 562.37l0-114.56 40.22 0 0-19.44-99.88 0 0 19.44 40.41 0 0 114.56 19.25 0zm134.2 0.57l14.3 0 44.41-134.38-20.21 0c-9.91,30.31-21.54,64.24-32.02,96.07l-21.73-62.14-15.44 0-21.92 62.33-31.83-96.26-20.01 0 44.41 134.38 14.3 0c6.86-20.21 15.06-42.89 22.68-64.62l23.06 64.62z"/>
  </svg>
);

const DesktopMenuButton = ({ active, onClick, label, icon, isAi, collapsed }: any) => (
  <button
    onClick={onClick}
    title={collapsed ? label : undefined}
    className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all ${
      active ? 'bg-white/10 text-white shadow-lg' : 'text-white/40 hover:bg-white/5 hover:text-white'
    } ${collapsed ? 'justify-center' : ''}`}
  >
    <div className={`shrink-0 ${isAi ? 'text-indigo-400' : ''}`}>
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d={icon} />
      </svg>
    </div>
    {!collapsed && <span className="text-[11px] font-black uppercase tracking-widest truncate">{label}</span>}
  </button>
);

const MobileDockItem = ({ active, onClick, icon, label, isAi, colorClass }: any) => (
  <button
    onClick={onClick}
    className={`flex flex-col items-center justify-center gap-1.5 min-w-[72px] transition-all px-2 py-1 ${
      active ? (colorClass || 'text-slate-900') : 'text-slate-400'
    }`}
  >
    <div className={`p-2.5 rounded-2xl transition-all ${active ? (isAi ? 'bg-indigo-50' : 'bg-slate-100') : ''}`}>
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d={icon} />
      </svg>
    </div>
    <span className="text-[7px] font-black uppercase tracking-[0.1em] whitespace-nowrap">{label}</span>
  </button>
);

const App: React.FC = () => {
  const [session, setSession] = useState<any>(null);
  const [inputs, setInputs] = useState<SimulationInputs>(defaultInputs);
  const [activeTab, setActiveTab] = useState<Tab>('calculadora');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [faturamento, setFaturamento] = useState<number>(100000);
  const [fixedCosts, setFixedCosts] = useState<CostItem[]>([]);
  const [variableCosts, setVariableCosts] = useState<VariableCostItem[]>([]);
  const [isAutoSync, setIsAutoSync] = useState(false);

  // Monitora se o usuário é Master
  const isMaster = useMemo(() => {
    return session?.user?.email?.toLowerCase() === MASTER_EMAIL.toLowerCase();
  }, [session]);

  // Função para buscar perfil do banco de dados (Sincronização Cloud)
  const fetchProfile = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_configs')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();
      
      if (data) {
        setUserProfile(data);
      } else if (error) {
        console.warn("Perfil não encontrado no banco de dados.");
      }
    } catch (e) {
      console.warn("Erro ao buscar perfil.");
    }
  }, []);

  const userGreetingName = useMemo(() => userProfile?.nome_completo || 'Usuário Master', [userProfile]);
  const userEmpresaName = useMemo(() => userProfile?.empresa_nome || 'Tagway Technology', [userProfile]);

  // Sincronização automática do Overhead para a Calculadora
  useEffect(() => {
    if (isAutoSync && faturamento > 0) {
      const totalFixedValue = fixedCosts.reduce((acc, curr) => acc + curr.valor, 0);
      const fixedPerc = (totalFixedValue / faturamento) * 100;
      const variablePerc = variableCosts.reduce((acc, curr) => acc + curr.percentual, 0);
      const totalOverheadConsolidado = Number((fixedPerc + variablePerc).toFixed(2));
      
      if (Math.abs(inputs.custosFixos - totalOverheadConsolidado) > 0.001) {
        setInputs(prev => ({
          ...prev,
          custosFixos: totalOverheadConsolidado
        }));
      }
    }
  }, [isAutoSync, fixedCosts, variableCosts, faturamento, inputs.custosFixos]);

  // Inicialização do App
  useEffect(() => {
    const init = async () => {
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      setSession(currentSession);
      
      if (currentSession) {
        await fetchProfile(currentSession.user.id);
        
        try {
          const { data: oh } = await supabase
            .from('overhead_configs')
            .select('*')
            .eq('user_id', currentSession.user.id)
            .maybeSingle();
            
          if (oh) {
            setFaturamento(oh.faturamento || 100000);
            setFixedCosts(oh.fixed_costs || []);
            setVariableCosts(oh.variable_costs || []);
            setIsAutoSync(!!oh.is_auto_sync);
          }
        } catch (e) { 
          console.warn("Sincronia Financeira indisponível no momento."); 
        }
      }
      setIsInitialized(true);
    };
    init();
  }, [fetchProfile]);

  const results = calculateCosts(inputs);
  const priceMatrix = generatePriceMatrix(results.custoFinal, inputs);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setSession(null);
    window.location.reload();
  };

  if (!isInitialized) return null;
  if (!session) return <Login onLoginSuccess={setSession} />;

  const menuItems = [
    { id: 'calculadora', label: 'Calc', icon: "M3 12h18M3 6h18M3 18h18" },
    { id: 'meus-produtos', label: 'Itens', icon: "M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" },
    { id: 'resumo-fiscal', label: 'Análise', icon: "M9 17v-2m3 2v-4m3 2v-6m-8-2h8a2 2 0 012 2v9a2 2 0 01-2 2H7a2 2 0 01-2-2V5a2 2 0 012-2z" },
    { id: 'overhead', label: 'Ganhos', icon: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2" },
    { id: 'jarvis', label: 'Jarvis', icon: "M13 10V3L4 14h7v7l9-11h-7z", isAi: true },
  ];

  const devItems = [
    { id: 'logistica', label: 'Logística', icon: "M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" },
    { id: 'estoque', label: 'Estoque', icon: "M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" },
    { id: 'metas', label: 'Metas', icon: "M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" },
    { id: 'dre', label: 'DRE', icon: "M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" },
    { id: 'caixa', label: 'Caixa', icon: "M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2z" }
  ];

  return (
    <div className="flex h-screen w-full bg-[#000000] overflow-hidden text-slate-900">
      <aside className={`hidden lg:flex flex-col border-r border-white/5 p-6 transition-all duration-300 ease-in-out relative ${isSidebarCollapsed ? 'w-[100px]' : 'w-[280px]'} h-full overflow-y-auto custom-scrollbar`}>
        <div className="mb-10 flex items-center justify-between">
          {!isSidebarCollapsed ? <TagwayHorizontalLogo className="h-7 w-auto" textColor="#FF6600" /> : <CompactLogo />}
          <button onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)} className="p-2 text-white/20 hover:text-white transition-colors">
            <svg className={`w-4 h-4 transition-transform ${isSidebarCollapsed ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" /></svg>
          </button>
        </div>
        
        <nav className="flex-1 space-y-1">
          {menuItems.map(item => (
            <DesktopMenuButton key={item.id} active={activeTab === item.id} onClick={() => setActiveTab(item.id as Tab)} label={item.label} icon={item.icon} isAi={item.isAi} collapsed={isSidebarCollapsed} />
          ))}
          <div className="pt-6 space-y-1">
            <p className={`text-[8px] font-black uppercase tracking-[0.3em] text-white/20 mb-3 ml-4 ${isSidebarCollapsed ? 'hidden' : ''}`}>Módulos Operacionais</p>
            {devItems.map(item => (
              <DesktopMenuButton key={item.id} active={activeTab === item.id} onClick={() => setActiveTab(item.id as Tab)} label={item.label} icon={item.icon} collapsed={isSidebarCollapsed} />
            ))}
          </div>
          <div className="pt-6 border-t border-white/5 mt-4">
            <DesktopMenuButton active={activeTab === 'configuracao'} onClick={() => setActiveTab('configuracao')} label="Ajustes" icon="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" collapsed={isSidebarCollapsed} />
            {isMaster && <DesktopMenuButton active={activeTab === 'master'} onClick={() => setActiveTab('master')} label="Master" icon="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944" collapsed={isSidebarCollapsed} />}
          </div>
        </nav>
      </aside>

      <main className="flex-1 bg-[#f8fafc] lg:rounded-l-[3rem] shadow-2xl overflow-hidden flex flex-col relative">
        <div className="lg:hidden sticky top-0 left-0 right-0 z-[110] bg-white/80 backdrop-blur-xl border-b border-slate-100 px-6 py-4 flex items-center justify-between shadow-sm">
           <div className="flex items-center gap-3">
              <TagwayHorizontalLogo className="h-6 w-auto" textColor="#64748b" /> 
           </div>
           <div className="text-right">
              <p className="text-[10px] font-black text-slate-900 tracking-tight leading-none uppercase">Bem-vindo, {userGreetingName}</p>
              <p className="text-[7px] font-bold text-slate-400 uppercase tracking-widest mt-1 italic">{userEmpresaName}</p>
           </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 lg:p-12 pb-32 lg:pb-12">
          {activeTab === 'calculadora' && (
            <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 max-w-[1600px] mx-auto animate-slide-up">
              <div className="w-full lg:w-80 space-y-6 shrink-0">
                <FiscalHeader inputs={inputs} setInputs={setInputs} />
                <Sidebar inputs={inputs} setInputs={setInputs} isAutoSync={isAutoSync} setIsAutoSync={setIsAutoSync} />
              </div>
              <div className="flex-1">
                <ResultsTable results={results} priceMatrix={priceMatrix} inputs={inputs} onReset={() => setInputs(defaultInputs)} />
              </div>
            </div>
          )}
          
          {activeTab === 'meus-produtos' && <MyProductsView onSelect={(sim) => { setInputs(sim.inputs); setActiveTab('calculadora'); }} />}
          {activeTab === 'resumo-fiscal' && <ResumoFiscalView results={results} inputs={inputs} />}
          {activeTab === 'catalogo' && <ProductsView onSelectNcm={(n) => { setInputs(p => ({...p, ...n, nomeProduto: n.descricao})); setActiveTab('calculadora'); }} />}
          {activeTab === 'overhead' && <OverheadView faturamento={faturamento} setFaturamento={setFaturamento} fixedCosts={fixedCosts} setFixedCosts={setFixedCosts} variableCosts={variableCosts} setVariableCosts={setVariableCosts} userId={session?.user?.id} isAutoSync={isAutoSync} setIsAutoSync={setIsAutoSync} />}
          {activeTab === 'jarvis' && <AIView results={results} inputs={inputs} />}
          {activeTab === 'configuracao' && session && (
            <ConfiguracaoView 
              userId={session.user.id} 
              onLogout={handleLogout} 
              onProfileUpdate={() => fetchProfile(session.user.id)} 
            />
          )}
          {activeTab === 'master' && <AdminView />}
          
          {['logistica', 'estoque', 'metas', 'dre', 'caixa'].includes(activeTab) && (
            <ComingSoonView 
              title={activeTab.toUpperCase()} 
              desc={`O módulo ${activeTab} está em fase de implantação para o seu terminal.`} 
              icon={devItems.find(i => i.id === activeTab)?.icon || "M13 10V3L4 14h7v7l9-11h-7z"}
              status="Sincronizando Rede" 
              date="Março 2025" 
            />
          )}
        </div>

        <div className="lg:hidden fixed bottom-0 left-0 right-0 z-[100] mobile-dock shadow-[0_-10px_40px_rgba(0,0,0,0.1)]">
           <div className="flex items-center gap-1 overflow-x-auto no-scrollbar px-4 py-3">
              {menuItems.map(item => (
                <MobileDockItem key={item.id} active={activeTab === item.id} onClick={() => setActiveTab(item.id as Tab)} label={item.label} icon={item.icon} isAi={item.isAi} colorClass={item.isAi ? 'text-indigo-600' : ''} />
              ))}
              <div className="w-px h-8 bg-slate-100 shrink-0 mx-2"></div>
              {devItems.map(item => (
                <MobileDockItem key={item.id} active={activeTab === item.id} onClick={() => setActiveTab(item.id as Tab)} label={item.label} icon={item.icon} />
              ))}
              
              {isMaster && (
                <>
                  <div className="w-px h-8 bg-slate-100 shrink-0 mx-2"></div>
                  <MobileDockItem active={activeTab === 'master'} onClick={() => setActiveTab('master')} label="Master" icon="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944" colorClass="text-amber-600" />
                </>
              )}

              <MobileDockItem active={activeTab === 'configuracao'} onClick={() => setActiveTab('configuracao')} label="Ajustes" icon="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
           </div>
        </div>
      </main>
    </div>
  );
};

export default App;
