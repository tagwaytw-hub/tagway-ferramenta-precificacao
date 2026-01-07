
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
  // 1. PESSOAL / RH
  { id: 'f1-1', categoria: 'PESSOAL / RH', descricao: 'Salários administrativos', valor: 5000 },
  { id: 'f1-2', categoria: 'PESSOAL / RH', descricao: 'Pró-labore dos sócios', valor: 2000 },
  { id: 'f1-3', categoria: 'PESSOAL / RH', descricao: 'Encargos trabalhistas (INSS, FGTS)', valor: 0 },
  { id: 'f1-4', categoria: 'PESSOAL / RH', descricao: 'Férias (provisão mensal)', valor: 0 },
  { id: 'f1-5', categoria: 'PESSOAL / RH', descricao: '13º salário (provisão mensal)', valor: 0 },
  { id: 'f1-6', categoria: 'PESSOAL / RH', descricao: 'Vale-transporte', valor: 0 },
  { id: 'f1-7', categoria: 'PESSOAL / RH', descricao: 'Vale-refeição / alimentação', valor: 0 },
  { id: 'f1-8', categoria: 'PESSOAL / RH', descricao: 'Plano de acompanhamento', valor: 0 },
  { id: 'f1-9', categoria: 'PESSOAL / RH', descricao: 'Seguro de vida', valor: 0 },

  // 2. ESTRUTURA / OCUPAÇÃO
  { id: 'f2-1', categoria: 'ESTRUTURA / OCUPAÇÃO', descricao: 'Aluguel do imóvel', valor: 2500 },
  { id: 'f2-2', categoria: 'ESTRUTURA / OCUPAÇÃO', descricao: 'Condomínio', valor: 500 },
  { id: 'f2-3', categoria: 'ESTRUTURA / OCUPAÇÃO', descricao: 'IPTU (taxa mensal)', valor: 0 },
  { id: 'f2-4', categoria: 'ESTRUTURA / OCUPAÇÃO', descricao: 'Seguro predial', valor: 0 },
  { id: 'f2-5', categoria: 'ESTRUTURA / OCUPAÇÃO', descricao: 'Limpeza especializada', valor: 0 },
  { id: 'f2-6', categoria: 'ESTRUTURA / OCUPAÇÃO', descricao: 'Manutenção predial', valor: 0 },
  { id: 'f2-7', categoria: 'ESTRUTURA / OCUPAÇÃO', descricao: 'Portaria / vigilância', valor: 0 },
  { id: 'f2-8', categoria: 'ESTRUTURA / OCUPAÇÃO', descricao: 'Impostos importantes', valor: 0 },

  // 3. UTILIDADES
  { id: 'f3-1', categoria: 'UTILIDADES', descricao: 'Energia elétrica (custo mínimo)', valor: 0 },
  { id: 'f3-2', categoria: 'UTILIDADES', descricao: 'Água e Esgoto', valor: 0 },
  { id: 'f3-3', categoria: 'UTILIDADES', descricao: 'Internet', valor: 150 },
  { id: 'f3-4', categoria: 'UTILIDADES', descricao: 'Telefonia fixa', valor: 0 },
  { id: 'f3-5', categoria: 'UTILIDADES', descricao: 'Telefonia móvel', valor: 0 },
  { id: 'f3-6', categoria: 'UTILIDADES', descricao: 'Link dedicado', valor: 0 },

  // 4. TECNOLOGIA / TI
  { id: 'f4-1', categoria: 'TECNOLOGIA / TI', descricao: 'Sistema ERP', valor: 500 },
  { id: 'f4-2', categoria: 'TECNOLOGIA / TI', descricao: 'Sistema contábil', valor: 0 },
  { id: 'f4-3', categoria: 'TECNOLOGIA / TI', descricao: 'CRM', valor: 0 },
  { id: 'f4-4', categoria: 'TECNOLOGIA / TI', descricao: 'Softwares de precificação', valor: 0 },
  { id: 'f4-5', categoria: 'TECNOLOGIA / TI', descricao: 'Licenças de software', valor: 0 },
  { id: 'f4-6', categoria: 'TECNOLOGIA / TI', descricao: 'Hospedagem de site', valor: 0 },
  { id: 'f4-7', categoria: 'TECNOLOGIA / TI', descricao: 'Domínio', valor: 0 },
  { id: 'f4-8', categoria: 'TECNOLOGIA / TI', descricao: 'Manutenção de TI', valor: 0 },
  { id: 'f4-9', categoria: 'TECNOLOGIA / TI', descricao: 'Suporte técnico', valor: 0 },

  // 5. SERVIÇOS TERCEIRIZADOS
  { id: 'f5-1', categoria: 'SERVIÇOS TERCEIRIZADOS', descricao: 'Contabilidade', valor: 800 },
  { id: 'f5-2', categoria: 'SERVIÇOS TERCEIRIZADOS', descricao: 'Assessoria Jurídica', valor: 0 },
  { id: 'f5-3', categoria: 'SERVIÇOS TERCEIRIZADOS', descricao: 'Consultoria financeira', valor: 0 },
  { id: 'f5-4', categoria: 'SERVIÇOS TERCEIRIZADOS', descricao: 'RH Terceirizado', valor: 0 },
  { id: 'f5-5', categoria: 'SERVIÇOS TERCEIRIZADOS', descricao: 'Marketing (contrato mensal)', valor: 0 },
  { id: 'f5-6', categoria: 'SERVIÇOS TERCEIRIZADOS', descricao: 'Agência de publicidade', valor: 0 },
  { id: 'f5-7', categoria: 'SERVIÇOS TERCEIRIZADOS', descricao: 'Auditoria recorrente', valor: 0 },

  // 6. DESPESAS ADMINISTRATIVAS
  { id: 'f6-1', categoria: 'DESPESAS ADMINISTRATIVAS', descricao: 'Material de escritório', valor: 200 },
  { id: 'f6-2', categoria: 'DESPESAS ADMINISTRATIVAS', descricao: 'Papelaria', valor: 0 },
  { id: 'f6-3', categoria: 'DESPESAS ADMINISTRATIVAS', descricao: 'Correios', valor: 0 },
  { id: 'f6-4', categoria: 'DESPESAS ADMINISTRATIVAS', descricao: 'Mensageiro', valor: 0 },
  { id: 'f6-5', categoria: 'DESPESAS ADMINISTRATIVAS', descricao: 'Certificado Digital', valor: 0 },
  { id: 'f6-6', categoria: 'DESPESAS ADMINISTRATIVAS', descricao: 'Despesas gerais fixas', valor: 0 },
  { id: 'f6-7', categoria: 'DESPESAS ADMINISTRATIVAS', descricao: 'Assinaturas empresariais', valor: 0 },

  // 7. IMPOSTOS E TAXAS FIXAS
  { id: 'f7-1', categoria: 'IMPOSTOS E TAXAS FIXAS', descricao: 'DAS mínimo (Simples Nacional)', valor: 0 },
  { id: 'f7-2', categoria: 'IMPOSTOS E TAXAS FIXAS', descricao: 'Alvará de funcionamento', valor: 0 },
  { id: 'f7-3', categoria: 'IMPOSTOS E TAXAS FIXAS', descricao: 'Licenças municipais e estaduais', valor: 0 },
  { id: 'f7-4', categoria: 'IMPOSTOS E TAXAS FIXAS', descricao: 'Taxas ambientais', valor: 0 },
  { id: 'f7-5', categoria: 'IMPOSTOS E TAXAS FIXAS', descricao: 'Conselhos de classe (CRC, etc.)', valor: 0 },

  // 8. FINANCEIRO
  { id: 'f8-1', categoria: 'FINANCEIRO', descricao: 'Parcelas de Empréstimos', valor: 0 },
  { id: 'f8-2', categoria: 'FINANCEIRO', descricao: 'Juros bancários fixos', valor: 0 },
  { id: 'f8-3', categoria: 'FINANCEIRO', descricao: 'Locação de equipamentos', valor: 0 },
  { id: 'f8-4', categoria: 'FINANCEIRO', descricao: 'Aluguel de máquinas', valor: 0 },
  { id: 'f8-5', categoria: 'FINANCEIRO', descricao: 'Consórcios empresariais', valor: 0 },

  // 9. DEPRECIAÇÃO/AMORTIZAÇÃO
  { id: 'f9-1', categoria: 'DEPRECIAÇÃO/AMORTIZAÇÃO', descricao: 'Depreciação de máquinas', valor: 0 },
  { id: 'f9-2', categoria: 'DEPRECIAÇÃO/AMORTIZAÇÃO', descricao: 'Depreciação de veículos', valor: 0 },
  { id: 'f9-3', categoria: 'DEPRECIAÇÃO/AMORTIZAÇÃO', descricao: 'Depreciação de computadores', valor: 0 },
  { id: 'f9-4', categoria: 'DEPRECIAÇÃO/AMORTIZAÇÃO', descricao: 'Depreciação de móveis', valor: 0 },
  { id: 'f9-5', categoria: 'DEPRECIAÇÃO/AMORTIZAÇÃO', descricao: 'Amortização de softwares', valor: 0 },

  // 10. SOLUÇÃO DE MARKETING
  { id: 'f10-1', categoria: 'SOLUÇÃO DE MARKETING', descricao: 'Mensalidade ferramentas SEO', valor: 0 },
  { id: 'f10-2', categoria: 'SOLUÇÃO DE MARKETING', descricao: 'Ferramentas de marketing digital', valor: 0 },
  { id: 'f10-3', categoria: 'SOLUÇÃO DE MARKETING', descricao: 'Plataformas de automação', valor: 0 },
  { id: 'f10-4', categoria: 'SOLUÇÃO DE MARKETING', descricao: 'Produção recorrente de conteúdo', valor: 0 },
  { id: 'f10-5', categoria: 'SOLUÇÃO DE MARKETING', descricao: 'Assinaturas bancos de imagem', valor: 0 },
];

const defaultVariableCosts: VariableCostItem[] = [
  // 1. IMPOSTOS SOBRE VENDAS
  { id: 'v1-1', categoria: 'IMPOSTOS SOBRE VENDAS', descricao: 'Simples Nacional', percentual: 6 },
  { id: 'v1-2', categoria: 'IMPOSTOS SOBRE VENDAS', descricao: 'ICMS Saída', percentual: 0 },
  { id: 'v1-3', categoria: 'IMPOSTOS SOBRE VENDAS', descricao: 'ISS', percentual: 0 },
  { id: 'v1-4', categoria: 'IMPOSTOS SOBRE VENDAS', descricao: 'PIS e COFINS Saída', percentual: 9.25 },

  // 2. CUSTO DO PRODUTO / SERVIÇO
  { id: 'v2-1', categoria: 'CUSTO DO PRODUTO / SERVIÇO', descricao: 'Custo da Mercadoria Vendida (CMV)', percentual: 0 },
  { id: 'v2-2', categoria: 'CUSTO DO PRODUTO / SERVIÇO', descricao: 'Matéria-prima / Insumos', percentual: 0 },
  { id: 'v2-4', categoria: 'CUSTO DO PRODUTO / SERVIÇO', descricao: 'Terceirização por demanda', percentual: 0 },

  // 3. LOGÍSTICA
  { id: 'v3-1', categoria: 'LOGÍSTICA', descricao: 'Frete sobre vendas', percentual: 0 },
  { id: 'v3-4', categoria: 'LOGÍSTICA', descricao: 'Embalagens', percentual: 0 },

  // 4. COMERCIAL / VENDAS
  { id: 'v4-1', categoria: 'COMERCIAL / VENDAS', descricao: 'Comissão de vendas', percentual: 0 },
  { id: 'v4-2', categoria: 'COMERCIAL / VENDAS', descricao: 'Bônus por meta', percentual: 0 },

  // 5. MEIOS DE PAGAMENTO
  { id: 'v5-1', categoria: 'MEIOS DE PAGAMENTO', descricao: 'Taxa de cartão / Gateway', percentual: 0 },

  // 6. VARIÁVEL DE MARKETING
  { id: 'v6-1', categoria: 'VARIÁVEL DE MARKETING', descricao: 'Tráfego pago (Ads)', percentual: 0 },

  // 7. FINANCEIRO VARIÁVEL
  { id: 'v7-1', categoria: 'FINANCEIRO VARIÁVEL', descricao: 'Multas e Juros (Variavel)', percentual: 0 },

  // 8. OUTROS CUSTOS VARIÁVEIS
  { id: 'v8-1', categoria: 'OUTROS CUSTOS VARIÁVEIS', descricao: 'Royalties / Taxas', percentual: 0 },
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

  useEffect(() => {
    if (isAutoSync) {
      const totalFixed = fixedCosts.reduce((acc, curr) => acc + curr.valor, 0);
      const totalVarPerc = variableCosts.reduce((acc, curr) => acc + curr.percentual, 0);
      const fixedPercOnFat = faturamento > 0 ? (totalFixed / faturamento) * 100 : 0;
      const totalOverheadWeight = fixedPercOnFat + totalVarPerc;
      const truncatedOverhead = Math.floor(totalOverheadWeight * 100) / 100;
      setInputs(prev => ({
        ...prev,
        custosFixos: truncatedOverhead
      }));
    }
  }, [faturamento, fixedCosts, variableCosts, isAutoSync]);

  useEffect(() => {
    let mounted = true;
    const init = async () => {
      try {
        const { data: { session: currentSession }, error } = await supabase.auth.getSession();
        
        if (error && error.message.includes('Refresh Token Not Found')) {
          await supabase.auth.signOut();
          if (mounted) {
            setSession(null);
            setIsInitialized(true);
          }
          return;
        }

        if (mounted) {
          setSession(currentSession);
          if (currentSession) {
            fetchMyProducts(currentSession);
            fetchOverheadConfig(currentSession);
          }
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
        if (event === 'SIGNED_IN' && newSession) {
          fetchMyProducts(newSession);
          fetchOverheadConfig(newSession);
        }
        if (event === 'SIGNED_OUT') {
          setSavedSimulations([]);
          setFaturamento(100000);
          setFixedCosts(defaultFixedCosts);
          setVariableCosts(defaultVariableCosts);
        }
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const fetchOverheadConfig = async (userSession: any) => {
    if (!userSession) return;
    try {
      const { data, error } = await supabase
        .from('overhead_configs')
        .select('*')
        .eq('user_id', userSession.user.id)
        .maybeSingle();

      if (data && !error) {
        setFaturamento(data.faturamento);
        const savedFixed = data.fixed_costs as CostItem[];
        const mergedFixed = defaultFixedCosts.map(def => {
          const saved = savedFixed.find((s:any) => s.descricao === def.descricao);
          return saved ? { ...def, valor: saved.valor, id: saved.id || def.id } : def;
        });
        const savedVar = data.variable_costs as VariableCostItem[];
        const mergedVar = defaultVariableCosts.map(def => {
          const saved = savedVar.find((s:any) => s.descricao === def.descricao);
          return saved ? { ...def, percentual: saved.percentual, id: saved.id || def.id } : def;
        });
        setFixedCosts(mergedFixed);
        setVariableCosts(mergedVar);
      }
    } catch (e) {
      console.error('Falha ao buscar overhead:', e);
    }
  };

  const fetchMyProducts = async (currentSession = session) => {
    if (!currentSession) return;
    try {
      const { data } = await supabase.from('simulacoes').select('*').order('created_at', { ascending: false });
      if (data) setSavedSimulations(data);
    } catch (e) {
      console.error('Falha ao buscar produtos:', e);
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

  if (!isInitialized) return <div className="h-screen w-full flex items-center justify-center bg-slate-50"><div className="w-10 h-10 border-4 border-black border-t-transparent rounded-full animate-spin"></div></div>;
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
        <nav className="flex-1 flex lg:flex-col items-center lg:items-stretch justify-start lg:justify-start lg:px-4 lg:space-y-2 p-1 lg:p-0 overflow-x-auto lg:overflow-x-visible no-scrollbar">
          <MenuButton active={activeTab === 'calculadora'} onClick={() => setActiveTab('calculadora')} label="Calculadora" collapsed={sidebarCollapsed} icon="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/>
          <MenuButton active={activeTab === 'catalogo'} onClick={() => setActiveTab('catalogo')} label="Catálogo" collapsed={sidebarCollapsed} icon="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
          <MenuButton active={activeTab === 'meus-produtos'} onClick={() => setActiveTab('meus-produtos')} label="Meus Produtos" collapsed={sidebarCollapsed} icon="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/>
          <MenuButton active={activeTab === 'overhead'} onClick={() => setActiveTab('overhead')} label="Overhead" collapsed={sidebarCollapsed} icon="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 002 2h2a2 2 0 002-2"/>
          <MenuButton active={activeTab === 'storage-period'} onClick={() => setActiveTab('storage-period')} label="Storage (SP)" collapsed={sidebarCollapsed} icon="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
          <MenuButton active={activeTab === 'configuracao'} onClick={() => setActiveTab('configuracao')} label="Ajustes" collapsed={sidebarCollapsed} icon="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/>
        </nav>
        <div className="hidden lg:flex p-4 mt-auto flex-col space-y-2 border-t border-white/5">
          <button onClick={() => setSidebarCollapsed(!sidebarCollapsed)} className="w-full flex items-center gap-4 p-4 text-white/40 hover:text-white rounded-2xl transition-all"><svg className={`w-5 h-5 transition-transform ${sidebarCollapsed ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M11 19l-7-7 7-7m8 14l-7-7 7-7"/></svg>{!sidebarCollapsed && <span className="text-[10px] font-black uppercase tracking-[0.2em]">Recolher</span>}</button>
          <button onClick={() => supabase.auth.signOut()} className="w-full flex items-center gap-4 p-4 text-white/30 hover:text-rose-500 hover:bg-rose-500/10 rounded-2xl transition-all"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/></svg>{!sidebarCollapsed && <span className="text-[10px] font-black uppercase tracking-[0.2em]">Sair</span>}</button>
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
                <Sidebar 
                  inputs={inputs} 
                  setInputs={setInputs} 
                  isAutoSync={isAutoSync} 
                  setIsAutoSync={setIsAutoSync} 
                />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar bg-[#f8fafc] p-4 md:p-8 lg:p-12"><div className="max-w-5xl mx-auto animate-slide-up"><ResultsTable results={results} priceMatrix={priceMatrix} inputs={inputs}/></div></div>
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
              <header className="border-b border-slate-200 pb-8"><h2 className="text-3xl lg:text-4xl font-black text-slate-900 tracking-tighter uppercase italic">Histórico</h2><p className="text-slate-400 font-bold uppercase tracking-widest text-[10px] mt-2">Simulações gravadas no seu portfólio</p></header>
              <div className="grid gap-4">{savedSimulations.map(sim => (<div key={sim.id} className="bg-white border border-slate-200 p-6 rounded-[2rem] flex flex-col md:flex-row md:items-center justify-between gap-6 hover:shadow-2xl transition-all group hover:border-black"><div className="flex items-center gap-6"><div className="w-14 h-14 bg-slate-50 text-slate-400 rounded-2xl flex items-center justify-center shrink-0 group-hover:bg-black group-hover:text-white transition-all shadow-sm"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg></div><div className="overflow-hidden"><h4 className="font-black text-slate-800 tracking-tight text-lg truncate">{sim.nome_produto}</h4><div className="flex items-center flex-wrap gap-2 mt-1 text-[9px] font-bold text-slate-400 uppercase tracking-widest"><span className="bg-slate-100 px-2 py-0.5 rounded text-slate-600 font-mono">{sim.dados.ncmCodigo}</span><span className="text-black">{sim.dados.ufOrigem}➔{sim.dados.ufDestino}</span><span>{new Date(sim.created_at).toLocaleDateString('pt-BR')}</span></div></div></div><div className="flex items-center gap-2"><button onClick={() => handleSelectProduct(sim)} className="flex-1 md:flex-none bg-black text-white px-8 py-3.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg active:scale-95">Abrir</button><button onClick={() => handleDelete(sim.id)} className="p-3.5 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg></button></div></div>))}</div>
            </div>
          </div>
        )}
        {(activeTab === 'storage-period' || activeTab === 'configuracao') && (
          <div className="flex-1 flex flex-col items-center justify-center p-8 bg-slate-50">
             <div className="w-24 h-24 bg-white rounded-[2rem] shadow-xl flex items-center justify-center mb-8 border border-slate-200">
                <svg className="w-10 h-10 text-black animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/></svg>
             </div>
             <h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase italic text-center">
                Módulo em Desenvolvimento
             </h2>
             <p className="text-slate-400 font-bold uppercase tracking-[0.2em] text-[10px] mt-4 text-center max-w-xs leading-loose">
                Estamos refinando os algoritmos de {activeTab === 'storage-period' ? 'custo de estocagem e movimentação' : 'configurações avançadas do sistema'}.
                Disponível na próxima atualização Enterprise.
             </p>
          </div>
        )}
      </main>
    </div>
  );
};

interface MenuButtonProps { active: boolean; onClick: () => void; icon: string; label: string; collapsed: boolean; }
const MenuButton: React.FC<MenuButtonProps> = ({ active, onClick, icon, label, collapsed }) => (
  <button onClick={onClick} className={`flex flex-col lg:flex-row items-center lg:w-full gap-2 lg:gap-4 p-3 lg:p-4 lg:rounded-2xl transition-all relative group shrink-0 ${active ? 'bg-white text-black lg:shadow-xl lg:ring-1 lg:ring-white/10' : 'text-white/40 hover:text-white lg:hover:bg-white/10'}`}><div className="w-6 h-6 flex items-center justify-center shrink-0"><svg className={`w-5 h-5 shrink-0 transition-colors ${active ? 'text-black' : 'text-white/40 group-hover:text-white'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d={icon}/></svg></div>{!collapsed && <span className="text-[9px] lg:text-[11px] font-black uppercase tracking-[0.1em] lg:tracking-[0.15em] whitespace-nowrap">{label}</span>}{active && <div className="lg:hidden absolute bottom-1 w-1 h-1 bg-black rounded-full"></div>}</button>
);
export default App;
