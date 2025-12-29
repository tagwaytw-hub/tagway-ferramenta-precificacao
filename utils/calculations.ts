
import { SimulationInputs, SimulationResults } from '../types.ts';

export const getInterstateRate = (origem: string, destino: string): number => {
  if (origem === destino) return 0;
  const sulSudeste = ['SP', 'RJ', 'MG', 'ES', 'PR', 'SC', 'RS'];
  const norteNordesteCentroOeste = ['AC', 'AL', 'AM', 'AP', 'BA', 'CE', 'DF', 'GO', 'MA', 'MS', 'MT', 'PA', 'PB', 'PE', 'PI', 'RN', 'RO', 'RR', 'SE', 'TO'];
  if (sulSudeste.includes(origem) && norteNordesteCentroOeste.includes(destino)) return 7;
  return 12;
};

export const calculateAdjustedMva = (mvaOriginal: number, alqInter: number, alqIntra: number): number => {
  if (alqInter === 0) return mvaOriginal;
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

  const valorTotalNota = valorCompra + ipiFrete;
  const creditoIcmsEntrada = valorCompra * (icmsInterestadual / 100);
  
  let stAPagar = 0;
  let baseCalculoSt = 0;
  let icmsStBruto = 0;
  
  if (mode === 'substituido') {
    baseCalculoSt = valorTotalNota * (1 + mva / 100);
    icmsStBruto = baseCalculoSt * (icmsInternoDestino / 100);
    stAPagar = Math.max(0, icmsStBruto - creditoIcmsEntrada);
  }

  let basePisCofins = valorCompra;
  if (excluirIcmsPis) basePisCofins = valorCompra - creditoIcmsEntrada;
  const creditoPisCofinsValor = basePisCofins * (pisCofinsRate / 100);

  let custoFinal = 0;
  if (mode === 'substituido') {
    custoFinal = valorTotalNota + stAPagar - creditoPisCofinsValor;
  } else {
    custoFinal = valorTotalNota - creditoIcmsEntrada - creditoPisCofinsValor;
  }

  let icmsVendaEfetivo = icmsVenda;
  if (mode === 'reduzido') {
    icmsVendaEfetivo = icmsVenda * (1 - (percReducaoBase / 100));
  }

  const deducoesSemMargem = pisCofinsVenda + comissaoVenda + icmsVendaEfetivo + outrosCustosVariaveis + custosFixos;
  const totalDeducoesVendaPerc = deducoesSemMargem + resultadoDesejado;
  
  const precoVendaAlvo = totalDeducoesVendaPerc < 100 ? custoFinal / ((100 - totalDeducoesVendaPerc) / 100) : 0;
  const precoEquilibrio = deducoesSemMargem < 100 ? custoFinal / ((100 - deducoesSemMargem) / 100) : 0;
  
  const margemAbsoluta = precoVendaAlvo * (resultadoDesejado / 100);
  const impostosTotais = stAPagar + (precoVendaAlvo * (icmsVendaEfetivo / 100)) + (precoVendaAlvo * (pisCofinsVenda / 100));

  return {
    valorTotalNota,
    baseCalculoSt,
    icmsStBruto,
    creditoIcmsEntrada,
    stAPagar,
    basePisCofins,
    creditoPisCofinsValor,
    custoFinal,
    precoEquilibrio,
    precoVendaAlvo,
    totalDeducoesVendaPerc,
    icmsVendaEfetivo,
    margemAbsoluta,
    impostosTotais
  };
};

export const generatePriceMatrix = (custoFinal: number, inputs: SimulationInputs): any => {
  const { mode, percReducaoBase, icmsVenda } = inputs;
  const icmsVendaEfetivo = mode === 'reduzido' ? icmsVenda * (1 - (percReducaoBase / 100)) : icmsVenda;
  const baseDeducoes = inputs.pisCofinsVenda + inputs.comissaoVenda + icmsVendaEfetivo + inputs.outrosCustosVariaveis + inputs.custosFixos;
  
  const categorias = [
    { label: 'Comod.', margin: 8 },
    { label: 'Curva A', margin: 10 },
    { label: 'Curva B', margin: 11 },
    { label: 'Curva C', margin: 12 },
    { label: 'Produtos Técnicos', margin: 15 }
  ];

  const getPrice = (margin: number) => {
    const total = baseDeducoes + margin;
    return total < 100 ? custoFinal / ((100 - total) / 100) : 0;
  };

  return categorias.map(cat => {
    const basePrice = getPrice(cat.margin);
    return {
      label: cat.label,
      margin: cat.margin,
      levels: {
        A: basePrice * 0.95,
        B: basePrice,
        C: basePrice * 1.111,
        D: basePrice * 1.1765
      }
    };
  });
};

export const formatCurrency = (val: number) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
};

export const formatPercent = (val: number) => {
  return new Intl.NumberFormat('pt-BR', { style: 'percent', minimumFractionDigits: 2 }).format(val / 100);
};
