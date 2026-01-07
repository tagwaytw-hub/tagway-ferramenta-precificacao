
import React, { useState, useEffect, useMemo } from 'react';
import Sidebar from './components/Sidebar';
import ResultsTable from './components/ResultsTable';
import FiscalHeader from './components/FiscalHeader';
import ProductsView from './components/ProductsView';
import OverheadView from './components/OverheadView';
import Login from './components/Login';
import { SimulationInputs, CostItem, VariableCostItem } from './types';
import { calculateCosts, generatePriceMatrix } from './utils/calculations';
import { supabase } from './lib/supabase';

const defaultFixedCosts: CostItem[] = [
  { id: 'f1-1', categoria: 'PESSOAL / RH', descricao: 'Salários administrativos', valor: 5000 },
  { id: 'f1-2', categoria: 'PESSOAL / RH', descricao: 'Pró-labore dos sócios', valor: 2000 },
  { id: 'f2-1', categoria: 'ESTRUTURA / OCUPAÇÃO', descricao: 'Aluguel do imóvel', valor: 2500 },
  { id: 'f2-2', categoria: 'ESTRUTURA / OCUPAÇÃO', descricao: 'Condomínio', valor: 500 },
  { id: 'f3-3', categoria: 'UTILIDADES', descricao: 'Internet', valor: 150 },
  { id: 'f4-1', categoria: 'TECNOLOGIA / TI', descricao: 'Sistema ERP', valor: 500 },
  { id: 'f5-1', categoria: 'SERVIÇOS TERCEIRIZADOS', descricao: 'Contabilidade', valor: 800 },
  { id: 'f6-1', categoria: 'DESPESAS ADMINISTRATIVAS', descricao: 'Material de escritório', valor: 200 },
];

const defaultVariableCosts: VariableCostItem[] = [
  { id: 'v1-4', categoria: 'IMPOSTOS SOBRE VENDAS', descricao: 'PIS e COFINS Saída', percentual: 9.25 },
  { id: 'v1-1', categoria: 'IMPOSTOS SOBRE VENDAS', descricao: 'Simples Nacional', percentual: 6 },
];

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
  ufDestino: 'BA',
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

type Tab = 'calculadora' | 'catalogo' | 'meus-produtos' | 'overhead' | 'storage-period' | 'configuracao';

const App: React.FC = () => {
  const [session, setSession] = useState<any>(null);
  const [inputs, setInputs] = useState<SimulationInputs>(defaultInputs);
  const [activeTab, setActiveTab] = useState<Tab>('calculadora');
  const [isSaving, setIsSaving] = useState(false);
  const [savedSimulations, setSavedSimulations] = useState<any[]>([]);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  const [faturamento, setFaturamento] = useState<number>(100000);
  const [fixedCosts, setFixedCosts] = useState<CostItem[]>(defaultFixedCosts);
  const [variableCosts, setVariableCosts] = useState<VariableCostItem[]>(defaultVariableCosts);
  const [isAutoSync, setIsAutoSync] = useState(false);

  // Sincronização automática Overhead -> Calculadora (Custo Fixo %)
  useEffect(() => {
    if (isAutoSync) {
      const totalFixed = fixedCosts.reduce((acc, curr) => acc + curr.valor, 0);
      const totalVarPerc = variableCosts.reduce((acc, curr) => acc + curr.percentual, 0);
      const fixedPercOnFat = faturamento > 0 ? (totalFixed / faturamento) * 100 : 0;
      const totalOverheadWeight = fixedPercOnFat + totalVarPerc;
      const truncatedOverhead = Math.floor(totalOverheadWeight * 100) / 100;
      setInputs(prev => ({ ...prev, custosFixos: truncatedOverhead }));
    }
  }, [faturamento, fixedCosts, variableCosts, isAutoSync]);

  useEffect(() => {
    let mounted = true;
    const init = async () => {
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      if (mounted) {
        setSession(currentSession);
        if (currentSession) {
          await Promise.all([
            fetchMyProducts(currentSession),
            fetchOverheadConfig(currentSession)
          ]);
        }
        setIsInitialized(true);
      }
    };
    init();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, newSession) => {
      if (mounted) {
        setSession(newSession);
        if (newSession) {
          fetchMyProducts(newSession);
          fetchOverheadConfig(newSession);
        } else {
          // Limpa estados ao sair
          setSavedSimulations([]);
          setFixedCosts(defaultFixedCosts);
          setVariableCosts(defaultVariableCosts);
          setFaturamento(100000);
          setInputs(defaultInputs);
        }
      }
    });

    return () => { mounted = false; subscription.unsubscribe(); };
  }, []);

  const fetchOverheadConfig = async (userSession: any) => {
    if (!userSession?.user?.id) return;
    try {
      const { data, error } = await supabase
        .from('overhead_configs')
        .select('*')
        .eq('user_id', userSession.user.id)
        .maybeSingle();

      if (error) throw error;
      
      if (data) {
        setFaturamento(data.faturamento || 100000);
        if (Array.isArray(data.fixed_costs) && data.fixed_costs.length > 0) {
          setFixedCosts(data.fixed_costs);
        }
        if (Array.isArray(data.variable_costs) && data.variable_costs.length > 0) {
          setVariableCosts(data.variable_costs);
        }
      }
    } catch (e) {
      console.warn('Configuração de overhead personalizada não encontrada. Usando padrões do sistema.');
    }
  };

  const fetchMyProducts = async (currentSession = session) => {
    if (!currentSession?.user?.id) return;
    const { data } = await supabase
      .from('simulacoes')
      .select('*')
      .eq('user_id', currentSession.user.id)
      .order('created_at', { ascending: false });
    if (data) setSavedSimulations(data);
  };

  const handleSave = async () => {
    if (!session?.user?.id) return;
    setIsSaving(true);
    try {
      const { error } = await supabase.from('simulacoes').insert([{ 
        user_id: session.user.id, 
        nome_produto: inputs.nomeProduto || 'Produto Sem Nome', 
        dados: inputs 
      }]);
      if (error) throw error;
      alert('Produto salvo com sucesso!');
      await fetchMyProducts();
      setActiveTab('meus-produtos');
    } catch (err: any) {
      alert('Erro ao salvar produto: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja realmente excluir este produto?')) return;
    try {
      const { error } = await supabase.from('simulacoes').delete().eq('id', id);
      if (error) throw error;
      setSavedSimulations(prev => prev.filter(p => p.id !== id));
    } catch (err: any) {
      alert('Erro ao excluir: ' + err.message);
    }
  };

  if (!isInitialized) return null;
  if (!session) return <Login onLoginSuccess={setSession} />;

  const results = calculateCosts(inputs);
  const priceMatrix = generatePriceMatrix(results.custoFinal, inputs);

  return (
    <div className="h-screen w-full flex flex-col lg:flex-row bg-[#f8fafc] overflow-hidden text-slate-900">
      <aside className={`bg-black flex lg:flex-col transition-all duration-300 z-[100] border-t lg:border-t-0 lg:border-r border-white/5 shadow-2xl ${sidebarCollapsed ? 'lg:w-[80px]' : 'lg:w-[280px]'} fixed bottom-0 left-0 w-full lg:relative lg:h-screen h-[70px] lg:h-auto`}>
        <div className="hidden lg:flex p-8 mb-6 items-center justify-between">
          <div className="flex items-center gap-4 overflow-hidden">
            <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center shrink-0 border border-white/10 shadow-lg"><svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M13 10V3L4 14h7v7l9-11h-7z"/></svg></div>
            {!sidebarCollapsed && <div className="flex flex-col leading-none"><span className="text-white font-black tracking-tighter text-2xl italic uppercase">Tagway</span><span className="text-[9px] font-black text-white/30 uppercase tracking-[0.2em] mt-1">Intelligence</span></div>}
          </div>
        </div>
        <nav className="flex-1 flex lg:flex-col items-center lg:items-stretch justify-start lg:px-4 lg:space-y-2 p-1 overflow-x-auto lg:overflow-x-visible no-scrollbar">
          <MenuButton active={activeTab === 'calculadora'} onClick={() => setActiveTab('calculadora')} label="Calculadora" collapsed={sidebarCollapsed} icon="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/>
          <MenuButton active={activeTab === 'catalogo'} onClick={() => setActiveTab('catalogo')} label="Catálogo" collapsed={sidebarCollapsed} icon="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
          <MenuButton active={activeTab === 'meus-produtos'} onClick={() => setActiveTab('meus-produtos')} label="Meus Produtos" collapsed={sidebarCollapsed} icon="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/>
          <MenuButton active={activeTab === 'overhead'} onClick={() => setActiveTab('overhead')} label="Overhead" collapsed={sidebarCollapsed} icon="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 002 2h2a2 2 0 002-2"/>
          <MenuButton active={activeTab === 'configuracao'} onClick={() => setActiveTab('configuracao')} label="Ajustes" collapsed={sidebarCollapsed} icon="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/>
        </nav>
        <div className="hidden lg:flex p-4 mt-auto flex-col space-y-2 border-t border-white/5">
          <button onClick={() => setSidebarCollapsed(!sidebarCollapsed)} className="w-full flex items-center gap-4 p-4 text-white/40 hover:text-white rounded-2xl transition-all font-black text-[10px] uppercase tracking-widest leading-none">
             <svg className={`w-5 h-5 transition-transform ${sidebarCollapsed ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M11 19l-7-7 7-7m8 14l-7-7 7-7"/></svg>
             {!sidebarCollapsed && "Recolher"}
          </button>
          <button onClick={() => supabase.auth.signOut()} className="w-full flex items-center gap-4 p-4 text-white/30 hover:text-rose-500 hover:bg-rose-500/10 rounded-2xl transition-all font-black text-[10px] uppercase tracking-widest leading-none">
             <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/></svg>
             {!sidebarCollapsed && "Sair"}
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-hidden flex flex-col relative pb-[70px] lg:pb-0">
        {activeTab === 'calculadora' && (
          <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
            <div className="w-full lg:w-[380px] border-b lg:border-b-0 lg:border-r border-slate-200 bg-white overflow-y-auto custom-scrollbar p-6 pt-0 space-y-8 shadow-inner">
              <div className="flex items-center justify-between sticky top-0 bg-white/95 backdrop-blur-sm z-30 -mx-6 px-6 py-5 border-b border-slate-100 mb-6">
                <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Parâmetros</h2>
                <button onClick={handleSave} disabled={isSaving} className="bg-black hover:bg-slate-800 text-white text-[9px] font-black uppercase px-6 py-2.5 rounded-xl transition-all shadow-xl shadow-black/10 active:scale-95 disabled:opacity-50">{isSaving ? 'Salvando...' : 'Salvar'}</button>
              </div>
              <div className="space-y-8">
                <FiscalHeader inputs={inputs} setInputs={setInputs}/>
                <Sidebar inputs={inputs} setInputs={setInputs} isAutoSync={isAutoSync} setIsAutoSync={setIsAutoSync} />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar bg-[#f8fafc] p-4 md:p-8 lg:p-12">
              <div className="max-w-5xl mx-auto animate-slide-up"><ResultsTable results={results} priceMatrix={priceMatrix} inputs={inputs}/></div>
            </div>
          </div>
        )}
        {activeTab === 'overhead' && (
          <div className="flex-1 p-6 md:p-12 overflow-y-auto custom-scrollbar bg-slate-50">
            <OverheadView 
              faturamento={faturamento} setFaturamento={setFaturamento}
              fixedCosts={fixedCosts} setFixedCosts={setFixedCosts}
              variableCosts={variableCosts} setVariableCosts={setVariableCosts}
              userId={session?.user?.id}
            />
          </div>
        )}
        {activeTab === 'catalogo' && <div className="flex-1 p-6 md:p-12 overflow-y-auto custom-scrollbar bg-white"><ProductsView onSelectNcm={(ncm) => { setInputs(prev => ({...prev, ncmCodigo: ncm.codigo, mvaOriginal: ncm.mvaOriginal, nomeProduto: ncm.descricao})); setActiveTab('calculadora'); }}/></div>}
        {activeTab === 'meus-produtos' && (
          <div className="flex-1 p-6 md:p-12 overflow-y-auto custom-scrollbar bg-slate-50">
            <div className="max-w-4xl mx-auto space-y-8">
              <header className="border-b border-slate-200 pb-8"><h2 className="text-3xl lg:text-4xl font-black text-slate-900 tracking-tighter uppercase italic">Histórico</h2></header>
              <div className="grid gap-4">
                {savedSimulations.map(sim => (
                  <div key={sim.id} className="bg-white border border-slate-200 p-6 rounded-[2rem] flex flex-col md:flex-row md:items-center justify-between gap-6 hover:shadow-2xl transition-all group hover:border-black">
                    <div className="flex items-center gap-6">
                      <div className="w-14 h-14 bg-slate-50 text-slate-400 rounded-2xl flex items-center justify-center shrink-0 group-hover:bg-black group-hover:text-white transition-all shadow-sm"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg></div>
                      <div className="overflow-hidden">
                        <h4 className="font-black text-slate-800 tracking-tight text-lg truncate">{sim.nome_produto}</h4>
                        <div className="flex items-center flex-wrap gap-2 mt-1 text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                           <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-600 font-mono">{sim.dados.ncmCodigo}</span>
                           <span>{new Date(sim.created_at).toLocaleDateString('pt-BR')}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => { setInputs(sim.dados); setActiveTab('calculadora'); }} className="bg-black text-white px-8 py-3.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg">Abrir</button>
                      <button onClick={() => handleDelete(sim.id)} className="p-3.5 text-slate-300 hover:text-rose-500 rounded-xl transition-all"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg></button>
                    </div>
                  </div>
                ))}
                {savedSimulations.length === 0 && (
                  <div className="py-20 text-center bg-white rounded-3xl border-2 border-dashed border-slate-200">
                    <p className="text-slate-400 font-black uppercase text-xs tracking-widest">Nenhuma simulação salva ainda.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

interface MenuButtonProps { active: boolean; onClick: () => void; icon: string; label: string; collapsed: boolean; }
const MenuButton: React.FC<MenuButtonProps> = ({ active, onClick, icon, label, collapsed }) => (
  <button onClick={onClick} className={`flex flex-col lg:flex-row items-center lg:w-full gap-2 lg:gap-4 p-3 lg:p-4 lg:rounded-2xl transition-all relative group shrink-0 ${active ? 'bg-white text-black lg:shadow-xl' : 'text-white/40 hover:text-white lg:hover:bg-white/10'}`}>
    <div className="w-6 h-6 flex items-center justify-center shrink-0">
      <svg className={`w-5 h-5 shrink-0 transition-colors ${active ? 'text-black' : 'text-white/40 group-hover:text-white'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d={icon}/></svg>
    </div>
    {!collapsed && <span className="text-[9px] lg:text-[11px] font-black uppercase tracking-[0.1em] lg:tracking-[0.15em] whitespace-nowrap">{label}</span>}
  </button>
);

export default App;
