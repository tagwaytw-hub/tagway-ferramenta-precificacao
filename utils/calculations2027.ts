
import { SimulationInputs, SimulationResults } from '../types';

const round2 = (num: number) => Math.round((num + Number.EPSILON) * 100) / 100;

/**
 * Calculadora 2027: Baseada no modelo IVA Dual (IBS + CBS)
 * Conforme PEC 45/2019 e Leis Complementares da Reforma Tributária.
 */
export const calculateCosts2027 = (inputs: SimulationInputs): SimulationResults => {
  const {
    valorCompra,
    freteValor,
    comissaoVenda,
    outrosCustosVariaveis,
    custosFixos,
    resultadoDesejado,
    ibsPerc = 17.7,
    cbsPerc = 8.8,
  } = inputs;

  const totalIvaRate = ibsPerc + cbsPerc;

  // 1. BASE DE CÁLCULO E IMPOSTO NA ENTRADA (COMPRA)
  // No novo modelo, o IBS/CBS pago na entrada gera crédito IMEDIATO e PLENO.
  const baseCalculoEntrada = valorCompra + freteValor;
  const impostoPagoEntrada = round2(baseCalculoEntrada * (totalIvaRate / 100));
  
  // 2. CUSTO FINAL DE AQUISIÇÃO (LÍQUIDO)
  // O custo real é o valor da mercadoria menos o imposto recuperado.
  const custoFinal = round2(baseCalculoEntrada - impostoPagoEntrada);

  // 3. FORMAÇÃO DO PREÇO DE VENDA (MARK-UP DIVISOR)
  // Consideramos que o preço de venda bruto deve cobrir:
  // - Custo de Aquisição (Líquido)
  // - Impostos sobre a Venda (IBS + CBS)
  // - Despesas Variáveis (Comissão, etc)
  // - Despesas Fixas (Rateio Overhead)
  // - Lucro Alvo (Resultado Desejado)
  
  const totalDeducoesVendaPerc = round2(
    totalIvaRate + 
    comissaoVenda + 
    outrosCustosVariaveis + 
    custosFixos + 
    resultadoDesejado
  );
  
  const divisor = (100 - totalDeducoesVendaPerc) / 100;
  const precoVendaAlvo = divisor > 0 ? round2(custoFinal / divisor) : 0;
  
  // 4. CÁLCULO DOS IMPOSTOS SOBRE A VENDA (DÉBITO)
  const valorIBS = round2(precoVendaAlvo * (ibsPerc / 100));
  const valorCBS = round2(precoVendaAlvo * (cbsPerc / 100));
  const impostosTotais = round2(valorIBS + valorCBS);

  // 5. APURAÇÃO DE MARGEM E EQUILÍBRIO
  const margemAbsoluta = round2(precoVendaAlvo * (resultadoDesejado / 100));
  
  // Preço de equilíbrio: cobre todos os custos/impostos com lucro zero.
  const precoEquilibrio = round2(custoFinal / ((100 - (totalDeducoesVendaPerc - resultadoDesejado)) / 100));

  return {
    valorTotalNota: baseCalculoEntrada,
    valorIpi: 0,
    baseCalculoSt: 0,
    icmsStBruto: 0,
    creditoIcmsMercadoria: 0,
    creditoIcmsFrete: 0,
    creditoIcmsEntrada: impostoPagoEntrada,
    stAPagar: 0,
    basePisCofins: baseCalculoEntrada,
    creditoPisCofinsValor: 0, // No novo modelo tratamos tudo como IVA Único
    custoFinal,
    precoEquilibrio,
    precoVendaAlvo,
    totalDeducoesVendaPerc,
    icmsVendaEfetivo: totalIvaRate,
    margemAbsoluta,
    impostosTotais,
    valorIBS,
    valorCBS
  };
};
