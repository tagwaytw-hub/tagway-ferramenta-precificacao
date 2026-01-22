
import { SimulationInputs, SimulationResults } from '../types';

/**
 * Arredondamento determinístico para 2 casas decimais, 
 * simulando o comportamento padrão de planilhas financeiras (Excel/Google Sheets).
 */
const round2 = (num: number) => Math.round((num + Number.EPSILON) * 100) / 100;

export const calculateCosts = (inputs: SimulationInputs): SimulationResults => {
  const {
    valorCompra,
    ipiPerc,
    freteValor,
    mva,
    icmsInternoDestino,
    icmsCreditoMercadoria,
    icmsCreditoFrete,
    pisCofinsRate,
    pisCofinsVenda,
    comissaoVenda,
    icmsVenda,
    outrosCustosVariaveis,
    custosFixos,
    resultadoDesejado,
    mode,
    excluirIcmsPis,
    simulationMode,
    precoVendaDesejado
  } = inputs;

  const valorIpi = round2(valorCompra * (ipiPerc / 100));
  const valorTotalNota = round2(valorCompra + valorIpi + freteValor);
  
  const creditoIcmsMercadoria = round2(valorCompra * (icmsCreditoMercadoria / 100));
  const creditoIcmsFrete = round2(freteValor * (icmsCreditoFrete / 100));
  const totalCreditoIcms = round2(creditoIcmsMercadoria + creditoIcmsFrete);
  
  let stAPagar = 0;
  let baseCalculoSt = 0;
  let icmsStBruto = 0;
  
  if (mode === 'substituido') {
    baseCalculoSt = round2(valorTotalNota * (1 + mva / 100));
    icmsStBruto = round2(baseCalculoSt * (icmsInternoDestino / 100));
    stAPagar = round2(Math.max(0, icmsStBruto - totalCreditoIcms));
  }

  let baseCreditoPisCofins = 0;
  if (mode === 'substituido') {
    baseCreditoPisCofins = round2((valorCompra + freteValor) - totalCreditoIcms);
  } else {
    baseCreditoPisCofins = round2((valorCompra + freteValor) - creditoIcmsMercadoria);
  }
  
  const creditoPisCofinsValor = round2(baseCreditoPisCofins * (pisCofinsRate / 100));

  let custoFinal = 0;
  if (mode === 'substituido') {
    custoFinal = round2(valorTotalNota + stAPagar - creditoPisCofinsValor);
  } else {
    custoFinal = round2(valorTotalNota - totalCreditoIcms - creditoPisCofinsValor);
  }

  let icmsVendaEfetivo = icmsVenda;
  if (mode === 'substituido') {
    icmsVendaEfetivo = 0;
  } else if (mode === 'reduzido') {
    icmsVendaEfetivo = round2(icmsVenda * (1 - (inputs.percReducaoBase / 100)));
  }

  let pisCofinsVendaEfetivo = pisCofinsVenda;
  if (excluirIcmsPis && mode !== 'substituido') {
     pisCofinsVendaEfetivo = round2(pisCofinsVenda * (1 - icmsVendaEfetivo / 100));
  }

  const totalDeducoesSemMargemPerc = round2(
    pisCofinsVendaEfetivo + 
    comissaoVenda + 
    icmsVendaEfetivo + 
    outrosCustosVariaveis + 
    custosFixos
  );

  let precoVendaAlvo = 0;
  let margemCalculadaAbs = 0;
  let margemCalculadaPerc = resultadoDesejado;

  if (simulationMode === 'sellToBuy') {
    // MODO REVERSO: Preço é fixo, calculamos a margem
    precoVendaAlvo = precoVendaDesejado;
    const deducoesValores = round2(precoVendaAlvo * (totalDeducoesSemMargemPerc / 100));
    margemCalculadaAbs = round2(precoVendaAlvo - custoFinal - deducoesValores);
    margemCalculadaPerc = precoVendaAlvo > 0 ? round2((margemCalculadaAbs / precoVendaAlvo) * 100) : 0;
  } else {
    // MODO NORMAL: Margem é fixa, calculamos o preço
    const totalDeducoesComMargemPerc = totalDeducoesSemMargemPerc + resultadoDesejado;
    const divisor = (100 - totalDeducoesComMargemPerc) / 100;
    precoVendaAlvo = divisor > 0 ? round2(custoFinal / divisor) : 0;
    margemCalculadaAbs = round2(precoVendaAlvo * (resultadoDesejado / 100));
    margemCalculadaPerc = resultadoDesejado;
  }
  
  const valorIcmsVenda = round2(precoVendaAlvo * (icmsVendaEfetivo / 100));
  const valorPisCofinsVenda = round2(precoVendaAlvo * (pisCofinsVendaEfetivo / 100));
  
  const precoEquilibrio = (100 - totalDeducoesSemMargemPerc) > 0 
    ? round2(custoFinal / ((100 - totalDeducoesSemMargemPerc) / 100)) 
    : 0;

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
    totalDeducoesVendaPerc: simulationMode === 'sellToBuy' ? round2(totalDeducoesSemMargemPerc + margemCalculadaPerc) : round2(totalDeducoesSemMargemPerc + resultadoDesejado),
    icmsVendaEfetivo,
    margemAbsoluta: margemCalculadaAbs,
    impostosTotais: round2(stAPagar + valorIcmsVenda + valorPisCofinsVenda)
  };
};

export const generatePriceMatrix = (custoFinal: number, inputs: SimulationInputs): any => {
  const results = calculateCosts(inputs);
  const baseDeducoes = results.totalDeducoesVendaPerc - (inputs.simulationMode === 'sellToBuy' ? (results.margemAbsoluta / results.precoVendaAlvo * 100) : inputs.resultadoDesejado);
  
  const categorias = [
    { label: 'Commodity', margin: 8 },
    { label: 'Curva A', margin: 10 },
    { label: 'Curva B', margin: 11 },
    { label: 'Curva C', margin: 12 },
    { label: 'Específicos', margin: 15 }
  ];

  return categorias.map(cat => {
    const total = baseDeducoes + cat.margin;
    // Ideal Price using category margin
    const idealPrice = total < 100 ? round2(custoFinal / ((100 - total) / 100)) : 0;
    
    return {
      label: cat.label,
      margin: cat.margin,
      levels: {
        'D': round2(idealPrice * 0.95),      // Discount: -5%
        'I': idealPrice,                     // Ideal (Base)
        'P6': round2(idealPrice * 1.1111),   // P6: +11.11% markup
        'P6+': round2(idealPrice * 1.1765)   // P6+: +17.65% markup
      }
    };
  });
};

export const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2 }).format(val);

export const getInterstateRate = (origem: string, destino: string): number => {
  if (origem === destino) return 0;
  const sulSudesteExcetoES = ['SP', 'RJ', 'MG', 'PR', 'SC', 'RS'];
  const norteNordesteCentroOesteES = ['AC', 'AL', 'AM', 'AP', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MS', 'MT', 'PA', 'PB', 'PE', 'PI', 'RN', 'RO', 'RR', 'SE', 'TO'];
  if (sulSudesteExcetoES.includes(origem) && norteNordesteCentroOesteES.includes(destino)) return 7;
  return 12;
};

export const calculateAdjustedMva = (mvaOriginal: number, alqInter: number, alqIntra: number): number => {
  if (alqInter === 0 || alqInter >= alqIntra) return mvaOriginal;
  const mvaOriginalDec = mvaOriginal / 100;
  const alqInterDec = alqInter / 100;
  const alqIntraDec = alqIntra / 100;
  const mvaAjustada = (((1 + mvaOriginalDec) * (1 - alqInterDec)) / (1 - alqIntraDec)) - 1;
  return mvaAjustada * 100;
};
