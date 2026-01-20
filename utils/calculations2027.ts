
import { SimulationInputs, SimulationResults } from '../types';

const round2 = (num: number) => Math.round((num + Number.EPSILON) * 100) / 100;

/**
 * Calculadora 2027: Baseada no modelo IVA Dual (IBS + CBS)
 * Substitui ICMS, ISS, IPI, PIS e COFINS gradualmente.
 */
export const calculateCosts2027 = (inputs: SimulationInputs): SimulationResults => {
  const {
    valorCompra,
    freteValor,
    comissaoVenda,
    outrosCustosVariaveis,
    custosFixos,
    resultadoDesejado,
  } = inputs;

  // Alíquotas padrão estimadas para 2027 (Transição)
  const cbsRate = 8.8; // Exemplo de transição Federal
  const ibsRate = 17.7; // Exemplo de transição Estadual/Municipal
  const totalIvaRate = cbsRate + ibsRate;

  // Na compra, assumimos crédito pleno do IVA Dual pago na entrada
  const creditoIvaEntrada = round2((valorCompra + freteValor) * (totalIvaRate / 100));
  
  const custoFinal = round2((valorCompra + freteValor) - (creditoIvaEntrada * 0.9)); // Fator de ajuste de crédito

  // Deduções na venda
  const totalDeducoesPerc = round2(
    totalIvaRate + 
    comissaoVenda + 
    outrosCustosVariaveis + 
    custosFixos + 
    resultadoDesejado
  );
  
  const divisor = (100 - totalDeducoesPerc) / 100;
  const precoVendaAlvo = divisor > 0 ? round2(custoFinal / divisor) : 0;
  
  const margemAbsoluta = round2(precoVendaAlvo * (resultadoDesejado / 100));
  const impostosTotais = round2(precoVendaAlvo * (totalIvaRate / 100));

  return {
    valorTotalNota: valorCompra + freteValor,
    valorIpi: 0,
    baseCalculoSt: 0,
    icmsStBruto: 0,
    creditoIcmsMercadoria: 0,
    creditoIcmsFrete: 0,
    creditoIcmsEntrada: 0,
    stAPagar: 0,
    basePisCofins: 0,
    creditoPisCofinsValor: 0,
    custoFinal,
    precoEquilibrio: round2(custoFinal / ((100 - (totalDeducoesPerc - resultadoDesejado)) / 100)),
    precoVendaAlvo,
    totalDeducoesVendaPerc: totalDeducoesPerc,
    icmsVendaEfetivo: totalIvaRate,
    margemAbsoluta,
    impostosTotais,
    valorIBS: round2(precoVendaAlvo * (ibsRate / 100)),
    valorCBS: round2(precoVendaAlvo * (cbsRate / 100))
  };
};
