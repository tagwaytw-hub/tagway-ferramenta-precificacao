
import { SimulationInputs, SimulationResults } from '../types';
import { UF_LIST } from './ncmData';

export const getInterstateRate = (origem: string, destino: string): number => {
  if (origem === destino) {
    const uf = UF_LIST.find(u => u.sigla === origem);
    return uf ? uf.icms : 18;
  }
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
    ipiPerc,
    freteValor,
    mva,
    icmsInternoDestino,
    icmsInterestadual,
    icmsCreditoMercadoria,
    icmsCreditoFrete,
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

  // 1. Dados Compra
  const valorIpi = valorCompra * (ipiPerc / 100);
  const valorTotalNota = valorCompra + valorIpi + freteValor;
  
  // 2. Créditos Fiscais (Destaque conforme planilha - Entradas)
  const creditoIcmsMercadoria = valorCompra * (icmsCreditoMercadoria / 100);
  const creditoIcmsFrete = freteValor * (icmsCreditoFrete / 100);
  const totalCreditoIcms = creditoIcmsMercadoria + creditoIcmsFrete;
  
  let stAPagar = 0;
  let baseCalculoSt = 0;
  let icmsStBruto = 0;
  
  // Lógica de ST (Somente se modo for Substituído)
  if (mode === 'substituido') {
    baseCalculoSt = valorTotalNota * (1 + mva / 100);
    icmsStBruto = baseCalculoSt * (icmsInternoDestino / 100);
    stAPagar = Math.max(0, icmsStBruto - (valorCompra * (icmsInterestadual / 100)));
  }

  // 3. PIS e COFINS de Entrada (Crédito sobre base líquida de ICMS conforme planilha)
  let baseCreditoPisCofins = valorCompra + freteValor;
  if (excluirIcmsPis) {
    // Base de cálculo para o crédito de 9,25% na planilha é (110 - 4,40) = 105,60
    baseCreditoPisCofins = (valorCompra + freteValor) - totalCreditoIcms;
  }
  const creditoPisCofinsValor = baseCreditoPisCofins * (pisCofinsRate / 100);

  // 4. Custo Mercadoria (Igual à planilha: 112,33)
  // Valor Total Nota - Crédito ICMS Merc - Crédito ICMS Frete - Crédito PIS/COFINS
  let custoFinal = 0;
  if (mode === 'substituido') {
    custoFinal = valorTotalNota + stAPagar - creditoPisCofinsValor;
  } else {
    // Tributado: 126,50 - 4,40 - 0 - 9,77 = 112,33
    custoFinal = valorTotalNota - (totalCreditoIcms + creditoPisCofinsValor);
  }

  // 5. ICMS na Saída (Venda)
  let icmsVendaEfetivo = icmsVenda;
  if (mode === 'substituido') {
    icmsVendaEfetivo = 0;
  } else if (mode === 'reduzido') {
    icmsVendaEfetivo = icmsVenda * (1 - (percReducaoBase / 100));
  }

  // 6. Formação de Preço via Markup Divisor (Exatamente conforme planilha)
  // Soma das % de saída: PIS/COF (9,25) + Comissão (0) + ICMS (20,5) + Fixos (20) + Margem (8) = 57,75%
  const deducoesSaidaPerc = pisCofinsVenda + comissaoVenda + icmsVendaEfetivo + outrosCustosVariaveis + custosFixos + resultadoDesejado;
  const divisor = (100 - deducoesSaidaPerc) / 100;
  
  // Preço de Venda: 112,33 / 0,4225 = 265,87
  const precoVendaAlvo = divisor > 0 ? custoFinal / divisor : 0;
  const margemAbsoluta = precoVendaAlvo * (resultadoDesejado / 100);
  
  const deducoesVariaveisSemMargem = pisCofinsVenda + comissaoVenda + icmsVendaEfetivo + outrosCustosVariaveis + custosFixos;
  const precoEquilibrio = (100 - deducoesVariaveisSemMargem) > 0 ? custoFinal / ((100 - deducoesVariaveisSemMargem) / 100) : 0;
  
  const impostosTotais = stAPagar + (precoVendaAlvo * (icmsVendaEfetivo / 100)) + (precoVendaAlvo * (pisCofinsVenda / 100));

  return {
    valorTotalNota,
    valorIpi,
    baseCalculoSt,
    icmsStBruto,
    creditoIcmsMercadoria,
    creditoIcmsFrete,
    creditoIcmsEntrada: totalCreditoIcms,
    stAPagar,
    basePisCofins: baseCreditoPisCofins,
    creditoPisCofinsValor,
    custoFinal,
    precoEquilibrio,
    precoVendaAlvo,
    totalDeducoesVendaPerc: deducoesSaidaPerc,
    icmsVendaEfetivo,
    margemAbsoluta,
    impostosTotais
  };
};

export const generatePriceMatrix = (custoFinal: number, inputs: SimulationInputs): any => {
  const { mode, icmsVenda } = inputs;
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
