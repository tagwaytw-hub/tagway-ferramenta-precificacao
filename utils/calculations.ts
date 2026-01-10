
import { SimulationInputs, SimulationResults } from '../types';
import { UF_LIST } from './ncmData';

// Helper para arredondamento fiscal padrão (2 casas)
const round2 = (num: number) => Math.round((num + Number.EPSILON) * 100) / 100;

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
    icmsCreditoMercadoria,
    icmsCreditoFrete,
    pisCofinsRate,
    pisCofinsVenda,
    comissaoVenda,
    icmsVenda,
    outrosCustosVariaveis,
    custosFixos,
    resultadoDesejado,
    mode
  } = inputs;

  // 1. DADOS MERCADORIA
  const valorIpi = round2(valorCompra * (ipiPerc / 100));
  const valorTotalNota = round2(valorCompra + valorIpi + freteValor);
  
  // 2. DADOS COMPRA (Créditos ICMS)
  const creditoIcmsMercadoria = round2(valorCompra * (icmsCreditoMercadoria / 100));
  const creditoIcmsFrete = round2(freteValor * (icmsCreditoFrete / 100));
  const totalCreditoIcms = round2(creditoIcmsMercadoria + creditoIcmsFrete);
  
  // 3. SUBSTITUIÇÃO TRIBUTÁRIA
  let stAPagar = 0;
  let baseCalculoSt = 0;
  let icmsStBruto = 0;
  
  if (mode === 'substituido') {
    baseCalculoSt = round2(valorTotalNota * (1 + mva / 100));
    icmsStBruto = round2(baseCalculoSt * (icmsInternoDestino / 100));
    stAPagar = round2(Math.max(0, icmsStBruto - totalCreditoIcms));
  }

  // 4. CRÉDITOS PIS E COFINS
  const baseCreditoPisCofins = round2(valorTotalNota - totalCreditoIcms);
  const creditoPisCofinsValor = round2(baseCreditoPisCofins * (pisCofinsRate / 100));

  // 5. CUSTO MERCADORIA (Líquido)
  let custoFinal = 0;
  if (mode === 'substituido') {
    custoFinal = round2(valorTotalNota + stAPagar - creditoPisCofinsValor);
  } else {
    custoFinal = round2(valorTotalNota - totalCreditoIcms - creditoPisCofinsValor);
  }

  // 6. DADOS VENDA (Markup Divisor)
  let icmsVendaEfetivo = icmsVenda;
  if (mode === 'substituido') {
    icmsVendaEfetivo = 0;
  } else if (mode === 'reduzido') {
    icmsVendaEfetivo = round2(icmsVenda * (1 - (inputs.percReducaoBase / 100)));
  }

  const deducoesSaidaPerc = round2(
    pisCofinsVenda + 
    comissaoVenda + 
    icmsVendaEfetivo + 
    outrosCustosVariaveis + 
    custosFixos + 
    resultadoDesejado
  );
  
  const divisor = (100 - deducoesSaidaPerc) / 100;
  const precoVendaAlvo = divisor > 0 ? round2(custoFinal / divisor) : 0;
  
  const valorIcmsVenda = round2(precoVendaAlvo * (icmsVendaEfetivo / 100));
  const valorPisCofinsVenda = round2(precoVendaAlvo * (pisCofinsVenda / 100));
  const margemAbsoluta = round2(precoVendaAlvo * (resultadoDesejado / 100));
  
  const precoEquilibrio = (100 - (deducoesSaidaPerc - resultadoDesejado)) > 0 
    ? round2(custoFinal / ((100 - (deducoesSaidaPerc - resultadoDesejado)) / 100)) 
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
    totalDeducoesVendaPerc: deducoesSaidaPerc,
    icmsVendaEfetivo,
    margemAbsoluta,
    impostosTotais: round2(stAPagar + valorIcmsVenda + valorPisCofinsVenda)
  };
};

export const generatePriceMatrix = (custoFinal: number, inputs: SimulationInputs): any => {
  const { mode, icmsVenda, percReducaoBase } = inputs;
  let icmsVendaEfetivo = mode === 'substituido' ? 0 : (mode === 'reduzido' ? icmsVenda * (1 - percReducaoBase / 100) : icmsVenda);
  
  const baseDeducoes = inputs.pisCofinsVenda + inputs.comissaoVenda + icmsVendaEfetivo + inputs.outrosCustosVariaveis + inputs.custosFixos;
  
  const categorias = [
    { label: 'Estratégico', margin: 8 },
    { label: 'Curva A', margin: 10 },
    { label: 'Curva B', margin: 12 },
    { label: 'Curva C', margin: 15 },
    { label: 'Produtos Técnicos', margin: 20 }
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

export const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
export const formatPercent = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'percent', minimumFractionDigits: 2 }).format(val / 100);
