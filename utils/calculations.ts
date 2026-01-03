
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

  // 1. Cálculo da Operação Própria (Crédito para o adquirente / Abatimento do ST)
  const valorTotalNota = valorCompra + ipiFrete;
  const valorIcmsProprio = valorCompra * (icmsInterestadual / 100);
  
  let stAPagar = 0;
  let baseCalculoSt = 0;
  let icmsStBruto = 0;
  
  if (mode === 'substituido') {
    // Base ST = (Mercadoria + IPI + Frete) * (1 + MVA)
    baseCalculoSt = valorTotalNota * (1 + mva / 100);
    icmsStBruto = baseCalculoSt * (icmsInternoDestino / 100);
    
    // REGRA FISCAL: ST a recolher = (Base ST * Alíquota Interna Destino) - ICMS Operação Própria
    stAPagar = Math.max(0, icmsStBruto - valorIcmsProprio);
  }

  // 2. PIS e COFINS de Entrada
  let basePisCofins = valorCompra;
  if (excluirIcmsPis) basePisCofins = valorCompra - valorIcmsProprio;
  const creditoPisCofinsValor = basePisCofins * (pisCofinsRate / 100);

  // 3. Custo Líquido (Break-even do Estoque)
  let custoFinal = 0;
  if (mode === 'substituido') {
    // No ST, o valor pago de ST é custo de aquisição. O ICMS Próprio é "embutido" no preço.
    custoFinal = valorTotalNota + stAPagar - creditoPisCofinsValor;
  } else {
    // No regime normal, o ICMS próprio gera crédito que abate o custo.
    custoFinal = valorTotalNota - valorIcmsProprio - creditoPisCofinsValor;
  }

  // 4. ICMS na Saída (Venda)
  let icmsVendaEfetivo = icmsVenda;
  if (mode === 'substituido') {
    icmsVendaEfetivo = 0; // Saída desonerada (ST já recolhido)
  } else if (mode === 'reduzido') {
    icmsVendaEfetivo = icmsVenda * (1 - (percReducaoBase / 100));
  }

  // 5. Formação de Preço (Inside Price / Divisor)
  const deducoesVendaPerc = pisCofinsVenda + comissaoVenda + icmsVendaEfetivo + outrosCustosVariaveis + custosFixos;
  const divisor = (100 - (deducoesVendaPerc + resultadoDesejado)) / 100;
  
  const precoVendaAlvo = divisor > 0 ? custoFinal / divisor : 0;
  const margemAbsoluta = precoVendaAlvo * (resultadoDesejado / 100);
  const precoEquilibrio = (100 - deducoesVendaPerc) > 0 ? custoFinal / ((100 - deducoesVendaPerc) / 100) : 0;
  
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
