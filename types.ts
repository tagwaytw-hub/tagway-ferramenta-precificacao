
export interface SimulationInputs {
  nomeProduto: string;
  valorCompra: number;
  ipiPerc: number;
  freteValor: number;
  mva: number;
  icmsInternoDestino: number;
  icmsInterestadual: number;
  icmsCreditoMercadoria: number;
  icmsCreditoFrete: number;
  pisCofinsRate: number;
  excluirIcmsPis: boolean;
  pisCofinsVenda: number;
  comissaoVenda: number;
  icmsVenda: number;
  outrosCustosVariaveis: number;
  custosFixos: number;
  resultadoDesejado: number;
  tipoProduto?: string;
  ufOrigem: string;
  ufDestino: string;
  ncmCodigo: string;
  mvaOriginal: number;
  mode: 'substituido' | 'tributado' | 'reduzido';
  percReducaoBase: number;
  simulationMode: 'buyToSell' | 'sellToBuy';
  precoVendaDesejado: number;
  totalDeducoesVendaPerc?: number;
  isMvaAuto: boolean; // Flag para controle manual/auto
  // Campos específicos para 2027
  ibsPerc?: number;
  cbsPerc?: number;
  isCenario2027?: boolean;
}

export interface UserProfile {
  user_id: string;
  nome_completo: string;
  email: string;
  empresa_nome: string;
  status: 'ativo' | 'bloqueado' | 'manutencao';
  telefone?: string;
  senha_acesso?: string;
  feature_flags?: {
    block_reason?: string;
    jarvis_enabled: boolean;
    dre_enabled: boolean;
    estoque_enabled: boolean;
    logistica_enabled: boolean;
    calculadora_2025_enabled: boolean;
    calculadora_2027_enabled: boolean;
    matriz_estrategica_enabled: boolean;
    overhead_enabled: boolean;
  };
}

export interface AuditLog {
  id: string;
  user_id: string;
  action: string;
  details: string;
  created_at: string;
  user_name?: string;
}

export interface CostItem {
  id: string;
  descricao: string;
  valor: number;
  categoria: string;
}

export interface VariableCostItem {
  id: string;
  descricao: string;
  percentual: number;
  categoria: string;
}

export interface SimulationResults {
  valorTotalNota: number;
  valorIpi: number;
  baseCalculoSt: number;
  icmsStBruto: number;
  creditoIcmsMercadoria: number;
  creditoIcmsFrete: number;
  creditoIcmsEntrada: number;
  stAPagar: number;
  basePisCofins: number;
  creditoPisCofinsValor: number;
  custoFinal: number;
  precoEquilibrio: number;
  precoVendaAlvo: number;
  valorCompraMaximo?: number;
  totalDeducoesVendaPerc: number;
  icmsVendaEfetivo: number;
  margemAbsoluta: number;
  impostosTotais: number;
  valorIBS?: number;
  valorCBS?: number;
}

export interface NCMEntry {
  codigo: string;
  descricao: string;
  mvaOriginal: number;
  cest?: string;
}

export interface NCMOverride {
  id: string;
  ncmCodigo: string;
  uf: string;
  mvaAdjusted: number;
  observation?: string;
  updatedAt: string;
}

export interface MetaMensal {
  id: string;
  user_id: string;
  mes: number; // 1-12
  ano: number;
  faturamento_alvo: number;
  margem_alvo_perc: number;
  lucro_alvo: number;
  created_at?: string;
}

export interface DREData {
  receitaBruta: number;
  impostos: number;
  receitaLiquida: number;
  cpv: number;
  margemContribuicao: number;
  margemContribuicaoPerc: number;
  custosFixos: number;
  ebitda: number;
  ebitdaPerc: number;
  lucroLiquido: number;
  lucroLiquidoPerc: number;
  pontoEquilibrio: number;
}
