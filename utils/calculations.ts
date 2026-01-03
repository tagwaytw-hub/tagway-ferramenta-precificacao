
import { SimulationInputs, SimulationResults } from '../types';

export const getInterstateRate = (origem: string, destino: string): number => {
  if (origem === destino) return 0;
  const sulSudeste = ['SP', 'RJ', 'MG', 'ES', 'PR', 'SC', 'RS'];
  const norteNordesteCentroOeste = ['AC', 'AL', 'AM', 'AP', 'BA', 'CE', 'DF', 'GO', 'MA', 'MS', 'MT', 'PA', 'PB', 'PE', 'PI', 'RN', 'RO', 'RR', 'SE', 'TO'];
  if (sulSudeste.includes(origem) && norteNordesteCentroOeste.includes(destino)) return 7;
  return 12;
};

export const calculateAdjustedMva = (mvaOriginal: number, alqInter: number, alqIntra: number): number => {
  if (alqInter === 0 || alqInter >= alqIntra) return mvaOriginal;
  const mvaOriginalDecimal = mvaOriginal / 100;
  const alqInterDecimal = alqInter / 100;
  const alqIntraDecimal = alqIntra / 100;
  const adjusted = ((1 + mvaOriginalDecimal) * (1 - alqInterDecimal) / (1 - alqIntraDecimal)) - 1;
  return adjusted * 100;
};

export const calculateCosts = (inputs: SimulationInputs): SimulationResults => {
  const {
    valorCompra,
    ipiFrete,
    mva,
    icmsInternoDestino,
    icmsInterestadual,
    pisCofinsRate,
    excluirIcmsPis,
    pisCofinsVenda,
    comissaoVenda,
    icmsVenda,
    outrosCustosVariaveis,
    custosFixos,
    resultadoDesejado,
    mode,
    percReducaoBase
  } = inputs;

  // 1. Valor da Nota e ICMS Próprio (Operação Própria do Fornecedor)
  const valorTotalNota = valorCompra + ipiFrete;
  // O ICMS próprio incide sobre o valor da mercadoria (valorCompra)
  const valorIcmsProprio = valorCompra * (icmsInterestadual / 100);
  
  let stAPagar = 0;
  let baseCalculoSt = 0;
  let icmsStBruto = 0;
  
  if (mode === 'substituido') {
    // Base ST inclui Mercadoria + IPI + Frete e aplica a MVA
    baseCalculoSt = valorTotalNota * (1 + mva / 100);
    icmsStBruto = baseCalculoSt * (icmsInternoDestino / 100);
    
    // CORREÇÃO: ICMS ST = (Base ST * Alíq. Interna Destino) - ICMS Operação Própria
    stAPagar = Math.max(0, icmsStBruto - valorIcmsProprio);
  }

  // 2. Créditos Tributários Entrada (PIS/COFINS)
  let basePisCofins = valorCompra;
  if (excluirIcmsPis) basePisCofins = valorCompra - valorIcmsProprio;
  const creditoPisCofinsValor = basePisCofins * (pisCofinsRate / 100);

  // 3. Determinação do Custo Final Líquido (Break-even para o revendedor)
  let custoFinal = 0;
  if (mode === 'substituido') {
    // Para o varejista substituído, o ST pago na entrada é custo, pois a saída é desonerada.
    custoFinal = valorTotalNota + stAPagar - creditoPisCofinsValor;
  } else {
    // Regime Débito/Crédito normal: Abate o ICMS da própria entrada pois gerará débito na saída
    custoFinal = valorTotalNota - valorIcmsProprio - creditoPisCofinsValor;
  }

  // 4. Alíquota de Saída Efetiva
  let icmsVendaEfetivo = icmsVenda;
  if (mode === 'substituido') {
    icmsVendaEfetivo = 0; // Saída isenta/não tributada por já ter pago ST
  } else if (mode === 'reduzido') {
    icmsVendaEfetivo = icmsVenda * (1 - (percReducaoBase / 100));
  }

  // 5. Cálculo do Preço de Venda (Markup Inside Price)
  const deducoesVendaPerc = pisCofinsVenda + comissaoVenda + icmsVendaEfetivo + outrosCustosVariaveis + custosFixos;
  const divisor = (100 - (deducoesVendaPerc + resultadoDesejado)) / 100;
  
  const precoVendaAlvo = divisor > 0 ? custoFinal / divisor : 0;
  const margemAbsoluta = precoVendaAlvo * (resultadoDesejado / 100);
  const precoEquilibrio = (100 - deducoesVendaPerc) > 0 ? custoFinal / ((100 - deducoesVendaPerc) / 100) : 0;
  
  // Total de impostos pagos na cadeia (Nesta etapa)
  const impostosTotais = stAPagar + (precoVendaAlvo * (icmsVendaEfetivo / 100)) + (precoVendaAlvo * (pisCofinsVenda / 100));

  return {
    valorTotalNota,
    baseCalculoSt,
    icmsStBruto,
    creditoIcmsEntrada: valorIcmsProprio,
    stAPagar,
    basePisCofins,
    creditoPisCofinsValor,
    custoFinal,
    precoEquilibrio,
    precoVendaAlvo,
    totalDeducoesVendaPerc: deducoesVendaPerc + resultadoDesejado,
    icmsVendaEfetivo,
    margemAbsoluta,
    impostosTotais
  };
};

export const generatePriceMatrix = (custoFinal: number, inputs: SimulationInputs): any => {
  const { mode, percReducaoBase, icmsVenda } = inputs;
  let icmsVendaEfetivo = mode === 'substituido' ? 0 : (mode === 'reduzido' ? icmsVenda * (1 - inputs.percReducaoBase / 100) : icmsVenda);
  
  const baseDeducoes = inputs.pisCofinsVenda + inputs.comissaoVenda + icmsVendaEfetivo + inputs.outrosCustosVariaveis + inputs.custosFixos;
  
  const categorias = [
    { label: 'Estratégico', margin: 8 },
    { label: 'Curva A', margin: 10 },
    { label: 'Curva B', margin: 12 },
    { label: 'Curva C', margin: 15 },
    { label: 'Serviço/Espec.', margin: 20 }
  ];

  return categorias.map(cat => {
    const total = baseDeducoes + cat.margin;
    const basePrice = total < 100 ? custoFinal / ((100 - total) / 100) : 0;
    return {
      label: cat.label,
      margin: cat.margin,
      levels: {
        A: basePrice * 0.95,
        B: basePrice,
        C: basePrice * 1.05,
        D: basePrice * 1.15
      }
    };
  });
};

export const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
export const formatPercent = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'percent', minimumFractionDigits: 2 }).format(val / 100);
