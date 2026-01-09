
import React, { useState, useEffect, useMemo } from 'react';
import Sidebar from './components/Sidebar';
import ResultsTable from './components/ResultsTable';
import FiscalHeader from './components/FiscalHeader';
import ProductsView from './components/ProductsView';
import OverheadView from './components/OverheadView';
import ConfiguracaoView from './components/ConfiguracaoView';
import AdminView from './components/AdminView';
import Login from './components/Login';
import { SimulationInputs, CostItem, VariableCostItem } from './types';
import { calculateCosts, generatePriceMatrix, getInterstateRate } from './utils/calculations';
import { supabase } from './lib/supabase';
import { UF_LIST } from './utils/ncmData';

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

const defaultFixedCosts: CostItem[] = [
  { id: 'f1-1', categoria: 'PESSOAL / RH', descricao: 'Salários administrativos', valor: 5000 },
];

const defaultVariableCosts: VariableCostItem[] = [
  { id: 'v1-4', categoria: 'IMPOSTOS SOBRE VENDAS', descricao: 'PIS e COFINS Saída', percentual: 9.25 },
];

type Tab = 'calculadora' | 'catalogo' | 'meus-produtos' | 'overhead' | 'configuracao' | 'master';

/**
 * Função Blindada de Diagnóstico de Erros.
 * Extrai a mensagem real mesmo que o objeto seja complexo.
 */
export const stringifyError = (err: any): string => {
  if (err == null) return 'Erro nulo ou indefinido';
  if (typeof err === 'string') return err;
  
  // Se for erro do Supabase
  if (err.error && typeof err.error === 'object') return stringifyError(err.error);

  try {
    // 1. Tenta extrair mensagem de propriedades padrão (incluindo ocultas)
    const props = Object.getOwnPropertyNames(err);
    for (const p of ['message', 'msg', 'details', 'hint', 'code', 'error_description']) {
      if (err[p] && typeof err[p] === 'string' && err[p].trim().length > 0) {
        return `${p.toUpperCase()}: ${err[p]}`;
      }
    }

    // 2. Se falhar, tenta converter o objeto inteiro para JSON legível
    const seen = new WeakSet();
    const json = JSON.stringify(err, (key, value) => {
      if (typeof value === "object" && value !== null) {
        if (seen.has(value)) return "[Circular]";
        seen.add(value);
      }
      return value;
    }, 2);

    if (json && json !== '{}') return `LOG TÉCNICO: ${json}`;
  } catch (e) {
    // Falha na serialização
  }

  // 3. Fallback final listando as chaves se for um objeto
  if (typeof err === 'object') {
    return `Objeto de erro com chaves: [${Object.keys(err).join(', ')}]. Verifique o Console (F12) para o dump completo.`;
  }

  return String(err);
};

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
  const [fixedCosts, setFixedCosts] = useState<CostItem[]>(defaultFixedCosts);
  const [variableCosts, setVariableCosts] = useState<VariableCostItem[]>(defaultVariableCosts);
  const [isAutoSync, setIsAutoSync] = useState(false);

  useEffect(() => {
    let mounted = true;
    const init = async () => {
      try {
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        if (mounted) {
          setSession(currentSession);
          if (currentSession) {
            await fetchUserProfile(currentSession);
            await Promise.all([
              fetchMyProducts(currentSession),
              fetchOverheadConfig(currentSession)
            ]).catch(() => {});
          }
          setIsInitialized(true);
        }
      } catch (e) {
        if (mounted) setIsInitialized(true);
      }
    };
    init();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, newSession) => {
      if (mounted) {
        setSession(newSession);
        if (newSession) {
          fetchUserProfile(newSession);
          fetchMyProducts(newSession);
          fetchOverheadConfig(newSession);
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
    setProfileError(null); 
    try {
      // Usando query direta para diagnosticar melhor
      const { data, error } = await supabase
        .from('user_configs')
        .select('*')
        .eq('user_id', userSession.user.id)
        .maybeSingle();
      
      if (error) throw error;

      if (!data) {
        // Se for o master, tenta criar o perfil automaticamente
        if (userSession.user.email === MASTER_EMAIL) {
          const { data: upsertedData, error: upsertError } = await supabase
            .from('user_configs')
            .upsert({
              user_id: userSession.user.id,
              email: userSession.user.email,
              nome_completo: 'Master Admin',
              is_admin: true,
              status: 'ativo',
              regime_tributario: 'Real',
              empresa_nome: 'Tagway Technology'
            }, { onConflict: 'user_id' })
            .select()
            .single();
          
          if (upsertError) throw upsertError;
          setUserProfile(upsertedData);
        } else {
          setProfileError('ACESSO NEGADO: Seu e-mail não foi encontrado na tabela "user_configs". Certifique-se de que o SQL foi executado no Supabase.');
        }
      } else {
        setUserProfile(data);
      }
    } catch (err: any) {
      console.error('ERRO CRÍTICO NO PERFIL:', err);
      setProfileError(stringifyError(err));
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
      const { error } = await supabase.from('simulacoes').insert([{ 
        user_id: session.user.id, 
        nome_produto: inputs.nomeProduto || 'Produto Sem Nome', 
        dados: inputs 
      }]);
      if (error) throw error;
      alert('Simulação salva!');
      await fetchMyProducts();
      setActiveTab('meus-produtos');
    } catch (err: any) { 
      alert('Erro ao salvar: ' + stringifyError(err)); 
    } finally { 
      setIsSaving(false); 
    }
  };

  const results = calculateCosts(inputs);
  const priceMatrix = generatePriceMatrix(results.custoFinal, inputs);

  if (!isInitialized) return null;

  const isMaster = session?.user?.email === MASTER_EMAIL;

  if (session && profileError && !userProfile && !isMaster) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-[#0f172a] p-8 fixed inset-0 z-[5000]">
        <div className="max-w-xl w-full bg-white rounded-[3rem] p-10 text-center space-y-8 shadow-2xl animate-slide-up">
          <div className="w-20 h-20 bg-rose-50 text-rose-500 rounded-3xl flex items-center justify-center mx-auto shadow-xl">
             <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
          </div>
          <div className="space-y-4">
            <h2 className="text-2xl font-black text-slate-900 tracking-tighter uppercase italic leading-none">Erro de Conectividade Fiscal</h2>
            <div className="bg-slate-50 p-6 rounded-2xl text-[11px] font-mono text-slate-600 break-words text-left border border-slate-100 max-h-64 overflow-y-auto custom-scrollbar leading-relaxed">
               <span className="text-slate-400 font-bold block mb-2 uppercase text-[9px] tracking-widest text-center border-b border-slate-200 pb-2 mb-3">Relatório de Exceção</span>
               <p className="whitespace-pre-wrap">{profileError}</p>
            </div>
          </div>
          <div className="space-y-3">
            <button onClick={() => window.location.reload()} className="w-full bg-slate-900 text-white py-4 rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-black transition-all shadow-lg">Recarregar e Tentar Novamente</button>
            <button onClick={() => { supabase.auth.signOut(); localStorage.clear(); window.location.reload(); }} className="w-full bg-slate-100 text-slate-500 py-4 rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-slate-200 transition-all">Sair e Limpar Sessão</button>
          </div>
        </div>
      </div>
    );
  }

  if (!session) return <Login onLoginSuccess={setSession} />;

  return (
    <div className="h-screen w-full flex flex-col lg:flex-row bg-[#f8fafc] overflow-hidden text-slate-900 relative">
      <aside className={`bg-black flex lg:flex-col transition-all duration-500 z-[100] border-t lg:border-t-0 lg:border-r border-white/5 shadow-2xl ${sidebarCollapsed ? 'lg:w-[90px]' : 'lg:w-[280px]'} fixed bottom-0 left-0 w-full lg:relative lg:h-screen h-[70px] lg:h-auto`}>
        <div className="hidden lg:flex p-6 mb-6 items-center justify-between border-b border-white/5">
          <div className="flex items-center gap-4 overflow-hidden">
            <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center shrink-0 border border-white/10">
              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
            </div>
            {!sidebarCollapsed && <span className="text-white font-black tracking-tighter text-2xl italic uppercase">Tagway</span>}
          </div>
          <button onClick={() => setSidebarCollapsed(!sidebarCollapsed)} className="p-2 hover:bg-white/10 rounded-lg text-white/40"><svg className={`w-4 h-4 ${sidebarCollapsed ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M11 19l-7-7 7-7"/></svg></button>
        </div>
        <nav className="flex-1 flex lg:flex-col items-center lg:items-stretch justify-start lg:px-4 lg:space-y-2 p-1 overflow-x-auto lg:overflow-x-visible no-scrollbar">
          <MenuButton active={activeTab === 'calculadora'} onClick={() => setActiveTab('calculadora')} label="Calculadora" collapsed={sidebarCollapsed} icon="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/>
          <MenuButton active={activeTab === 'catalogo'} onClick={() => setActiveTab('catalogo')} label="Catálogo" collapsed={sidebarCollapsed} icon="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
          <MenuButton active={activeTab === 'meus-produtos'} onClick={() => setActiveTab('meus-produtos')} label="Meus Produtos" collapsed={sidebarCollapsed} icon="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/>
          <MenuButton active={activeTab === 'overhead'} onClick={() => setActiveTab('overhead')} label="Overhead" collapsed={sidebarCollapsed} icon="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 002 2h2a2 2 0 002-2"/>
          <MenuButton active={activeTab === 'configuracao'} onClick={() => setActiveTab('configuracao')} label="Ajustes" collapsed={sidebarCollapsed} icon="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/>
          {(userProfile?.is_admin || isMaster) && <MenuButton active={activeTab === 'master'} onClick={() => setActiveTab('master')} label="Master" collapsed={sidebarCollapsed} icon="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04M12 2.944v10m0 0a2 2 0 100 4 2 2 0 000-4z"/>}
        </nav>
        <div className="lg:mt-auto lg:p-4 border-t border-white/5 hidden lg:block">
           <button onClick={() => supabase.auth.signOut()} className={`flex items-center gap-4 w-full p-4 rounded-2xl text-rose-500 hover:bg-rose-500/10 transition-all ${sidebarCollapsed ? 'justify-center' : ''}`}><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/></svg>{!sidebarCollapsed && <span className="text-[11px] font-black uppercase tracking-widest">Sair</span>}</button>
        </div>
      </aside>

      <main className="flex-1 overflow-hidden flex flex-col relative pb-[70px] lg:pb-0">
        <div className="absolute top-10 right-10 z-[90] hidden md:flex items-center gap-4 animate-slide-up">
           <div className="glass-card border border-slate-200/50 px-6 py-3 rounded-2xl flex items-center gap-4 shadow-xl">
              <div className={`w-2 h-2 rounded-full animate-pulse ${userProfile?.status === 'ativo' ? 'bg-emerald-500' : 'bg-rose-500'}`}></div>
              <div className="flex flex-col">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-800 leading-none mb-1">{userProfile?.nome_completo || (isMaster ? 'Master Admin' : 'Operador')}</span>
                <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">{userProfile?.empresa_nome || 'Tagway Pro'}</span>
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
        {activeTab === 'configuracao' && <div className="flex-1 p-6 md:p-12 overflow-y-auto custom-scrollbar bg-slate-50"><ConfiguracaoView userId={session?.user?.id} /></div>}
        {activeTab === 'master' && (userProfile?.is_admin || isMaster) && <div className="flex-1 p-6 md:p-12 overflow-y-auto custom-scrollbar bg-slate-50"><AdminView /></div>}
        {activeTab === 'overhead' && <div className="flex-1 p-6 md:p-12 overflow-y-auto custom-scrollbar bg-slate-50"><OverheadView faturamento={faturamento} setFaturamento={setFaturamento} fixedCosts={fixedCosts} setFixedCosts={setFixedCosts} variableCosts={variableCosts} setVariableCosts={setVariableCosts} userId={session?.user?.id} isAutoSync={isAutoSync} setIsAutoSync={setIsAutoSync} /></div>}
        {activeTab === 'catalogo' && <div className="flex-1 p-6 md:p-12 overflow-y-auto custom-scrollbar bg-white"><ProductsView onSelectNcm={(ncm) => { setInputs(prev => ({...prev, ncmCodigo: ncm.codigo, mvaOriginal: ncm.mvaOriginal, nomeProduto: ncm.descricao})); setActiveTab('calculadora'); }}/></div>}
        {activeTab === 'meus-produtos' && <div className="flex-1 p-6 md:p-12 overflow-y-auto custom-scrollbar bg-slate-50"><div className="max-w-4xl mx-auto space-y-8"><header className="border-b border-slate-200 pb-8"><h2 className="text-3xl lg:text-4xl font-black text-slate-900 tracking-tighter uppercase italic leading-tight">Meus Produtos</h2></header><div className="grid gap-4">{savedSimulations.map(sim => (<div key={sim.id} className="bg-white border border-slate-200 p-6 rounded-[2rem] flex flex-col md:flex-row md:items-center justify-between gap-6 hover:shadow-2xl transition-all group hover:border-black"><div className="flex items-center gap-6"><div className="w-14 h-14 bg-slate-50 text-slate-400 rounded-2xl flex items-center justify-center shrink-0 group-hover:bg-black group-hover:text-white transition-all"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg></div><div><h4 className="font-black text-slate-800 tracking-tight text-lg truncate">{sim.nome_produto}</h4><span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{new Date(sim.created_at).toLocaleDateString('pt-BR')}</span></div></div><button onClick={() => { setInputs(sim.dados); setActiveTab('calculadora'); }} className="bg-black text-white px-8 py-3.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg">Abrir Cálculo</button></div>))}</div></div></div>}
      </main>
    </div>
  );
};

interface MenuButtonProps { active: boolean; onClick: () => void; icon: string; label: string; collapsed: boolean; }
const MenuButton: React.FC<MenuButtonProps> = ({ active, onClick, icon, label, collapsed }) => (
  <button onClick={onClick} className={`flex flex-col lg:flex-row items-center lg:w-full gap-2 lg:gap-4 p-3 lg:p-4 lg:rounded-2xl transition-all relative group shrink-0 ${active ? 'bg-white text-black lg:shadow-xl' : 'text-white/40 hover:text-white lg:hover:bg-white/10'}`}>
    <svg className={`w-5 h-5 shrink-0 transition-colors ${active ? 'text-black' : 'text-white/40 group-hover:text-white'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d={icon}/></svg>
    {!collapsed && <span className="text-[11px] font-black uppercase tracking-widest whitespace-nowrap">{label}</span>}
  </button>
);

export default App;
