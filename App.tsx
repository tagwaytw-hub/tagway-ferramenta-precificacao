
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

export const TagwayHorizontalLogo = ({ className = "w-auto h-8", light = false }: { className?: string, light?: boolean }) => (
  <svg className={className} viewBox="0 0 14918.7 3266.79" fill="none" xmlns="http://www.w3.org/2000/svg">
    <g id="_1949254011840">
      <path fill="#8200AD" d="M2403.79 3133.39c-210.68,0 -386.67,-115.49 -429.1,-269.53l0 -481.67 358.15 0 141.55 245.17c-12.68,20.37 -20,44.43 -20,70.2 0,73.5 59.59,133.1 133.1,133.1 73.5,0 133.1,-59.59 133.1,-133.1 0,-73.51 -59.59,-133.1 -133.1,-133.1 -7.13,0 -14.14,0.56 -20.97,1.64l-169.94 -294.34 -421.9 0 0 -279.9 -110.42 0 0 886.24c21.19,217.4 254.65,388.68 539.52,388.68 244.16,0 450.56,-125.82 517.9,-298.66 211.22,11.92 414.96,-169.81 469.9,-430.53 25.85,-122.69 14.49,-242.67 -25.42,-343.07 150.55,-137.08 245.47,-369.17 236.8,-628.73 -11.32,-339.15 -195.89,-618.2 -437.02,-694.97 20.42,-51 31.64,-106.68 31.64,-164.98 0,-245.35 -198.9,-444.24 -444.25,-444.24 -25.03,0 -49.59,2.07 -73.49,6.05 -53.57,-154.78 -220.28,-267.64 -417.62,-267.64 -176.61,0 -328.67,90.38 -397.08,220.3l0 1081.68 110.42 0 0 -236.96 279.71 0 194.17 -351.84 2.26 -4.1c4.75,-0.73 9.41,-1.71 13.98,-2.92 18.96,-8.63 37.09,-18.43 54.26,-29.29 27.33,-24.37 44.53,-59.85 44.53,-99.35 0,-73.51 -59.59,-133.1 -133.1,-133.1 -73.5,0 -133.1,59.59 -133.1,133.1 0,39.67 17.36,75.29 44.89,99.67l-153.09 277.4 -214.53 0 0 -683.38c65.5,-78.21 170.22,-128.86 288.22,-128.86 172.11,0 315.95,107.74 351.09,251.59 34.64,-10.66 71.44,-16.41 109.58,-16.41 205.4,0 371.92,166.51 371.92,371.91 0,68.38 -18.46,132.45 -50.66,187.5 236.97,73.4 417.37,325.32 428.56,630.72 9.47,258.64 -104.92,487.35 -280.49,605.64 43.59,69.18 68.93,151.78 68.93,240.5 0,243.69 -191.13,441.23 -426.89,441.23 -0.22,0 -0.44,0 -0.65,0 -38.03,158.43 -216.7,278.36 -431.38,278.36z"/>
      <path fill={light ? "#000000" : "#FF6600"} d="M4777.68 2721.46l0 -1844.66 647.62 0 0 -313.08 -1608.32 0 0 313.08 650.7 0 0 1844.66 310 0zm1332.08 -1691.2l263.97 758.12 -534.06 0 270.09 -758.12zm641.49 1681.99l331.49 0 -862.48 -2176.15 -227.13 0 -862.48 2176.15 334.56 0c67.53,-178.02 174.96,-435.84 257.82,-632.28l770.4 0 257.82 632.28zm2341.89 -1378.12c-113.57,-570.89 -610.8,-782.68 -1022.09,-782.68 -592.38,0 -1055.84,454.26 -1055.84,1089.61 0,632.29 454.25,1086.54 1055.84,1086.54 389.81,0 831.78,-263.96 979.11,-675.25l0 3.07c27.62,-70.6 42.97,-190.29 58.32,-371.39l-1157.14 0 0 310 794.96 0c-128.92,313.07 -411.29,435.84 -675.25,435.84 -420.5,0 -745.84,-334.56 -745.84,-788.82 0,-451.19 325.35,-779.61 745.84,-779.61 273.17,0 604.66,125.85 690.6,472.68l331.49 0zm1728.02 1396.53l230.2 0 715.15 -2163.86 -325.35 0c-159.61,488.02 -346.83,1034.36 -515.65,1546.94l-349.9 -1000.6 -248.61 0 -352.97 1003.67 -512.57 -1550 -322.28 0 715.14 2163.86 230.2 0c110.5,-325.35 242.48,-690.59 365.24,-1040.5l371.39 1040.5zm1645.15 -1700.4l263.97 758.12 -534.06 0 270.09 -758.12zm641.49 1681.99l331.49 0 -862.48 -2176.15 -227.13 0 -862.48 2176.15 334.56 0c67.53,-178.02 174.96,-435.84 257.82,-632.28l770.4 0 257.82 632.28zm-95.14 -2145.45l794.95 1270.69 0 874.76 313.07 0 0 -874.76 798.03 -1270.69 -368.32 0 -586.24 942.28 -586.24 -942.28 -365.24 0z"/>
    </g>
  </svg>
);

const DesktopMenuButton = ({ active, onClick, label, icon, isAi, isDev }: any) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all ${
      active ? 'bg-white/10 text-white shadow-lg' : 'text-white/40 hover:bg-white/5 hover:text-white'
    } ${isDev ? 'opacity-50' : ''}`}
  >
    <div className={`shrink-0 ${isAi ? 'text-indigo-400' : ''}`}>
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d={icon} />
      </svg>
    </div>
    <span className="text-[11px] font-black uppercase tracking-widest truncate">{label}</span>
    {isDev && <span className="ml-auto text-[7px] bg-white/10 px-1 py-0.5 rounded">DEV</span>}
  </button>
);

const MobileDockItem = ({ active, onClick, icon, label, isAi, isDev }: any) => (
  <button
    onClick={onClick}
    className={`flex flex-col items-center justify-center gap-1 min-w-[64px] transition-all ${
      active ? (isAi ? 'text-indigo-600' : 'text-slate-900') : 'text-slate-300'
    } ${isDev ? 'opacity-50' : ''}`}
  >
    <div className={`p-2 rounded-xl transition-all ${active ? (isAi ? 'bg-indigo-50' : 'bg-slate-100') : ''}`}>
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d={icon} />
      </svg>
    </div>
    <span className="text-[8px] font-black uppercase tracking-widest">{label}</span>
  </button>
);

const App: React.FC = () => {
  const [session, setSession] = useState<any>(null);
  const [inputs, setInputs] = useState<SimulationInputs>(defaultInputs);
  const [activeTab, setActiveTab] = useState<Tab>('calculadora');
  const [isMobileSheetOpen, setIsMobileSheetOpen] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [faturamento, setFaturamento] = useState<number>(100000);
  const [fixedCosts, setFixedCosts] = useState<CostItem[]>([]);
  const [variableCosts, setVariableCosts] = useState<VariableCostItem[]>([]);
  const [isAutoSync, setIsAutoSync] = useState(false);
  const [isSavingSim, setIsSavingSim] = useState(false);

  const isMaster = useMemo(() => session?.user?.email === MASTER_EMAIL, [session]);

  useEffect(() => {
    const init = async () => {
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      setSession(currentSession);
      if (currentSession) {
        const { data } = await supabase.from('user_configs').select('*').eq('user_id', currentSession.user.id).maybeSingle();
        if (data) setUserProfile(data);
        const { data: oh } = await supabase.from('overhead_configs').select('*').eq('user_id', currentSession.user.id).maybeSingle();
        if (oh) {
          setFaturamento(oh.faturamento || 100000);
          setFixedCosts(oh.fixed_costs || []);
          setVariableCosts(oh.variable_costs || []);
          setIsAutoSync(!!oh.is_auto_sync);
        }
      }
      setIsInitialized(true);
    };
    init();
  }, []);

  const results = calculateCosts(inputs);
  const priceMatrix = generatePriceMatrix(results.custoFinal, inputs);

  useEffect(() => {
    if (isAutoSync && faturamento > 0) {
      const totalF = fixedCosts.reduce((a, b) => a + b.valor, 0);
      const totalV = variableCosts.reduce((a, b) => a + b.percentual, 0);
      const percFixed = (totalF / faturamento) * 100;
      setInputs(prev => ({
        ...prev,
        custosFixos: Number(percFixed.toFixed(2)),
        outrosCustosVariaveis: Number(totalV.toFixed(2))
      }));
    }
  }, [fixedCosts, variableCosts, faturamento, isAutoSync]);

  const handleReset = () => {
    setInputs(prev => ({
      ...prev,
      nomeProduto: '',
      valorCompra: 0,
      ipiPerc: 0,
      freteValor: 0,
      ncmCodigo: '',
      mva: 0,
      mvaOriginal: 0,
    }));
  };

  const handleSaveSimulation = async () => {
    if (!session) {
      alert('Sessão expirada. Faça login novamente.');
      return;
    }
    
    setIsSavingSim(true);
    try {
      const { error } = await supabase.from('saved_simulations').insert([{
        user_id: session.user.id,
        nome_produto: inputs.nomeProduto || 'Sem Nome',
        inputs: JSON.parse(JSON.stringify(inputs)),
        results: JSON.parse(JSON.stringify(results))
      }]);
      
      if (error) {
        if (error.message?.includes('schema cache') || error.message?.includes('not found')) {
           alert('ERRO: A tabela "saved_simulations" não foi encontrada. Verifique se executou o SQL de criação no Supabase.');
        } else {
           throw new Error(error.message);
        }
      } else {
        alert('Simulação arquivada com sucesso!');
      }
    } catch (e: any) {
      console.error('Erro ao salvar simulação:', e);
      alert('Erro técnico ao salvar: ' + (e.message || 'Verifique sua conexão.'));
    } finally {
      setIsSavingSim(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setSession(null);
    window.location.reload();
  };

  if (!isInitialized) return null;
  if (!session) return <Login onLoginSuccess={setSession} />;

  return (
    <div className="flex h-screen w-full bg-[#000000] overflow-hidden text-slate-900">
      {/* Desktop Aside */}
      <aside className="hidden lg:flex w-[280px] h-full flex-col border-r border-white/5 p-6 overflow-y-auto custom-scrollbar">
        <div className="mb-10"><TagwayHorizontalLogo className="h-7 w-auto" /></div>
        <nav className="flex-1 space-y-1">
          <DesktopMenuButton active={activeTab === 'calculadora'} onClick={() => setActiveTab('calculadora')} label="Calculadora" icon="M3 12h18M3 6h18M3 18h18" />
          <DesktopMenuButton active={activeTab === 'meus-produtos'} onClick={() => setActiveTab('meus-produtos')} label="Meus Itens" icon="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          <DesktopMenuButton active={activeTab === 'resumo-fiscal'} onClick={() => setActiveTab('resumo-fiscal')} label="Análise Fisco" icon="M9 17v-2m3 2v-4m3 2v-6m-8-2h8a2 2 0 012 2v9a2 2 0 01-2 2H7a2 2 0 01-2-2V5a2 2 0 012-2z" />
          <DesktopMenuButton active={activeTab === 'catalogo'} onClick={() => setActiveTab('catalogo')} label="NCM 2025" icon="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          <DesktopMenuButton active={activeTab === 'overhead'} onClick={() => setActiveTab('overhead')} label="Overhead" icon="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2" />
          <DesktopMenuButton active={activeTab === 'jarvis'} onClick={() => setActiveTab('jarvis')} label="Jarvis AI" icon="M13 10V3L4 14h7v7l9-11h-7z" isAi />
          
          <div className="pt-6">
            <DesktopMenuButton active={activeTab === 'configuracao'} onClick={() => setActiveTab('configuracao')} label="Configuração" icon="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            {isMaster && <DesktopMenuButton active={activeTab === 'master'} onClick={() => setActiveTab('master')} label="Master" icon="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944" />}
          </div>
        </nav>
        <button onClick={handleLogout} className="mt-auto p-4 text-rose-500 font-black uppercase text-[10px] tracking-widest hover:bg-rose-500/10 rounded-xl transition-all border border-rose-500/20">Sair</button>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 bg-[#f8fafc] lg:rounded-l-[3rem] shadow-2xl overflow-hidden flex flex-col">
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 lg:p-12 pb-32 lg:pb-12">
          {activeTab === 'calculadora' && (
            <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 max-w-[1600px] mx-auto animate-slide-up">
              <div className="w-full lg:w-80 space-y-6 shrink-0">
                <FiscalHeader inputs={inputs} setInputs={setInputs} />
                <Sidebar 
                  inputs={inputs} 
                  setInputs={setInputs} 
                  isAutoSync={isAutoSync} 
                  setIsAutoSync={setIsAutoSync} 
                />
                <button 
                  onClick={handleSaveSimulation} 
                  disabled={isSavingSim}
                  className="w-full bg-emerald-600 text-white py-4 rounded-xl font-black uppercase text-[11px] tracking-widest shadow-xl hover:bg-emerald-700 transition-all flex items-center justify-center gap-2"
                >
                  {isSavingSim ? 'Gravando...' : 'Arquivar Item'}
                </button>
              </div>
              <div className="flex-1">
                <ResultsTable 
                  results={results} 
                  priceMatrix={priceMatrix} 
                  inputs={inputs} 
                  onReset={handleReset} 
                />
              </div>
            </div>
          )}
          
          {activeTab === 'meus-produtos' && (
            <MyProductsView onSelect={(sim) => { setInputs(sim.inputs); setActiveTab('calculadora'); }} />
          )}
          
          {activeTab === 'resumo-fiscal' && (
            <ResumoFiscalView results={results} inputs={inputs} />
          )}
          
          {activeTab === 'catalogo' && (
            <ProductsView onSelectNcm={(n) => { setInputs(p => ({...p, ...n, nomeProduto: n.descricao})); setActiveTab('calculadora'); }} />
          )}
          
          {activeTab === 'overhead' && (
            <OverheadView 
              faturamento={faturamento} 
              setFaturamento={setFaturamento} 
              fixedCosts={fixedCosts} 
              setFixedCosts={setFixedCosts} 
              variableCosts={variableCosts} 
              setVariableCosts={setVariableCosts} 
              userId={session?.user?.id} 
              isAutoSync={isAutoSync} 
              setIsAutoSync={setIsAutoSync} 
            />
          )}
          
          {activeTab === 'jarvis' && (
            <AIView results={results} inputs={inputs} />
          )}
          
          {activeTab === 'configuracao' && (
            <ConfiguracaoView userId={session?.user?.id} />
          )}
          
          {activeTab === 'master' && <AdminView />}
        </div>
      </main>

      {/* Mobile Bottom Dock */}
      <nav className="lg:hidden mobile-dock fixed bottom-6 left-6 right-6 h-[72px] rounded-[2rem] flex items-center gap-2 overflow-x-auto no-scrollbar px-6 z-[100] shadow-2xl bg-white border border-slate-100">
        <MobileDockItem active={activeTab === 'calculadora'} onClick={() => setActiveTab('calculadora')} label="Calc" icon="M3 12h18M3 6h18M3 18h18" />
        <MobileDockItem active={activeTab === 'meus-produtos'} onClick={() => setActiveTab('meus-produtos')} label="Meus" icon="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        <MobileDockItem active={activeTab === 'resumo-fiscal'} onClick={() => setActiveTab('resumo-fiscal')} label="Fisco" icon="M9 17v-2m3 2v-4m3 2v-6m-8-2h8a2 2 0 012 2v9a2 2 0 01-2 2H7a2 2 0 01-2-2V5a2 2 0 012-2z" />
        <MobileDockItem active={activeTab === 'jarvis'} onClick={() => setActiveTab('jarvis')} label="Jarvis" icon="M13 10V3L4 14h7v7l9-11h-7z" isAi />
        <MobileDockItem active={activeTab === 'configuracao'} onClick={() => setActiveTab('configuracao')} label="Ajuste" icon="M4 6h16M4 12h16m-7 6h7" />
      </nav>
    </div>
  );
};

export default App;
