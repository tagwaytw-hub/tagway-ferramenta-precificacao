
export interface SimulationInputs {
  valorCompra: number;
  ipiFrete: number;
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
  // Campos fiscais
  ufOrigem: string;
  ufDestino: string;
  ncmCodigo: string;
  mvaOriginal: number;
  // Regimes
  mode: 'substituido' | 'tributado' | 'reduzido';
  percReducaoBase: number;
}

export interface SimulationResults {
  valorTotalNota: number;
  baseCalculoSt: number;
  icmsStBruto: number;
  creditoIcmsEntrada: number;
  stAPagar: number;
  basePisCofins: number;
  creditoPisCofinsVenda?: number; // Optional if needed, but results uses creditoPisCofinsValor
  creditoPisCofinsValor: number;
  custoFinal: number;
  precoEquilibrio: number;
  precoVendaAlvo: number;
  totalDeducoesVendaPerc: number;
  icmsVendaEfetivo: number;
}

export interface NCMEntry {
  codigo: string;
  descricao: string;
  mvaOriginal: number;
  cest?: string;
}

// Interface for Google Search grounding results
export interface SearchResult {
  text: string;
  sources: any[];
}
