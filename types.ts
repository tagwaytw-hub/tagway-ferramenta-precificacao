
export interface SimulationInputs {
  nomeProduto: string;
  valorCompra: number;
  ipiPerc: number;
  freteValor: number;
  mva: number;
  icmsInternoDestino: number;
  icmsInterestadual: number;
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
  baseCalculoSt: number;
  icmsStBruto: number;
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
}

export interface NCMEntry {
  codigo: string;
  descricao: string;
  mvaOriginal: number;
  cest?: string;
}
