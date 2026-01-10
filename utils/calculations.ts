
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
    excluirIcmsPis
  } = inputs;

  // 1. DADOS DA ENTRADA (AQUISIÇÃO)
  // Valor do IPI calculado sobre o valor líquido da mercadoria
  const valorIpi = round2(valorCompra * (ipiPerc / 100));
  // Total da Nota Fiscal: Mercadoria + IPI + Frete
  const valorTotalNota = round2(valorCompra + valorIpi + freteValor);
  
  // 2. CRÉDITOS DE ICMS (OPERAÇÃO PRÓPRIA / ENTRADA)
  const creditoIcmsMercadoria = round2(valorCompra * (icmsCreditoMercadoria / 100));
  const creditoIcmsFrete = round2(freteValor * (icmsCreditoFrete / 100));
  const totalCreditoIcms = round2(creditoIcmsMercadoria + creditoIcmsFrete);
  
  // 3. CÁLCULO DO ICMS ST (SUBSTITUIÇÃO TRIBUTÁRIA)
  let stAPagar = 0;
  let baseCalculoSt = 0;
  let icmsStBruto = 0;
  
  if (mode === 'substituido') {
    // Base ST = (Valor Total da Nota) * (1 + MVA)
    baseCalculoSt = round2(valorTotalNota * (1 + mva / 100));
    // ICMS ST Bruto = Base ST * Alíquota Interna
    icmsStBruto = round2(baseCalculoSt * (icmsInternoDestino / 100));
    // ST a Recolher = ICMS ST Bruto - Créditos da Entrada
    stAPagar = round2(Math.max(0, icmsStBruto - totalCreditoIcms));
  }

  // 4. CRÉDITOS DE PIS/COFINS (ENTRADA)
  // De acordo com as imagens da planilha:
  // No modo Tributado, a base exclui apenas o Crédito de ICMS da Mercadoria.
  // No modo ST, a base exclui o crédito total (Mercadoria + Frete).
  let baseCreditoPisCofins = 0;
  if (mode === 'substituido') {
    baseCreditoPisCofins = round2((valorCompra + freteValor) - totalCreditoIcms);
  } else {
    // Lógica específica da planilha "Tributado": Mercadoria + Frete - Crédito ICMS Mercadoria
    baseCreditoPisCofins = round2((valorCompra + freteValor) - creditoIcmsMercadoria);
  }
  
  const creditoPisCofinsValor = round2(baseCreditoPisCofins * (pisCofinsRate / 100));

  // 5. CUSTO FINAL LÍQUIDO (DESEMBOLSO EFETIVO)
  let custoFinal = 0;
  if (mode === 'substituido') {
    // Custo ST = Valor Nota + ST a Pagar - Crédito PIS/COFINS
    custoFinal = round2(valorTotalNota + stAPagar - creditoPisCofinsValor);
  } else {
    // Custo Tributado = Valor Nota - Créditos ICMS - Créditos PIS/COFINS
    custoFinal = round2(valorTotalNota - totalCreditoIcms - creditoPisCofinsValor);
  }

  // 6. FORMAÇÃO DO PREÇO DE VENDA (MARKUP DIVISOR)
  let icmsVendaEfetivo = icmsVenda;
  if (mode === 'substituido') {
    icmsVendaEfetivo = 0; // ST não tem débito de ICMS na saída (desonerada)
  } else if (mode === 'reduzido') {
    icmsVendaEfetivo = round2(icmsVenda * (1 - (inputs.percReducaoBase / 100)));
  }

  // Cálculo do PIS/COFINS na Venda (Considerando Exclusão do ICMS se flag ativa)
  let pisCofinsVendaEfetivo = pisCofinsVenda;
  if (excluirIcmsPis && mode !== 'substituido') {
     // Aplica a redução da base (Tema 69 STF)
     pisCofinsVendaEfetivo = round2(pisCofinsVenda * (1 - icmsVendaEfetivo / 100));
  }

  // Somatória das deduções para o divisor do Markup
  const totalDeducoesPerc = round2(
    pisCofinsVendaEfetivo + 
    comissaoVenda + 
    icmsVendaEfetivo + 
    outrosCustosVariaveis + 
    custosFixos + 
    resultadoDesejado
  );
  
  const divisor = (100 - totalDeducoesPerc) / 100;
  
  // Preço de Venda = Custo / (1 - %Deduções)
  const precoVendaAlvo = divisor > 0 ? round2(custoFinal / divisor) : 0;
  
  const margemAbsoluta = round2(precoVendaAlvo * (resultadoDesejado / 100));
  const valorIcmsVenda = round2(precoVendaAlvo * (icmsVendaEfetivo / 100));
  const valorPisCofinsVenda = round2(precoVendaAlvo * (pisCofinsVendaEfetivo / 100));
  
  const precoEquilibrio = (100 - (totalDeducoesPerc - resultadoDesejado)) > 0 
    ? round2(custoFinal / ((100 - (totalDeducoesPerc - resultadoDesejado)) / 100)) 
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
    totalDeducoesVendaPerc: totalDeducoesPerc,
    icmsVendaEfetivo,
    margemAbsoluta,
    impostosTotais: round2(stAPagar + valorIcmsVenda + valorPisCofinsVenda)
  };
};

export const generatePriceMatrix = (custoFinal: number, inputs: SimulationInputs): any => {
  const results = calculateCosts(inputs);
  const baseDeducoes = results.totalDeducoesVendaPerc - inputs.resultadoDesejado;
  
  const categorias = [
    { label: 'Estratégico', margin: 8 },
    { label: 'Curva A', margin: 10 },
    { label: 'Curva B', margin: 12 },
    { label: 'Curva C', margin: 15 },
    { label: 'Serviço/Espec.', margin: 20 }
  ];

  return categorias.map(cat => {
    const total = baseDeducoes + cat.margin;
    const basePrice = total < 100 ? round2(custoFinal / ((100 - total) / 100)) : 0;
    return {
      label: cat.label,
      margin: cat.margin,
      levels: {
        A: round2(basePrice * 0.95),
        B: basePrice,
        C: round2(basePrice * 1.05),
        D: round2(basePrice * 1.15)
      }
    };
  });
};

export const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2 }).format(val);

export const getInterstateRate = (origem: string, destino: string): number => {
  if (origem === destino) return 0;
  const sulSudesteExcetoES = ['SP', 'RJ', 'MG', 'PR', 'SC', 'RS'];
  const norteNordesteCentroOesteES = ['AC', 'AL', 'AM', 'AP', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MS', 'MT', 'PA', 'PB', 'PE', 'PI', 'RN', 'RO', 'RR', 'SE', 'TO'];
  
  if (sulSudesteExcetoES.includes(origem) && norteNordesteCentroOesteES.includes(destino)) {
    return 7;
  }
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
