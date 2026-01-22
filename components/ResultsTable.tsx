
import React, { useState } from 'react';
import { SimulationResults, SimulationInputs } from '../types';
import { formatCurrency } from '../utils/calculations';
import { supabase } from '../lib/supabase';

interface ResultsTableProps {
  results: SimulationResults;
  priceMatrix: any[];
  inputs: SimulationInputs;
  onReset?: () => void;
}

const ResultsTable: React.FC<ResultsTableProps> = ({ results, priceMatrix, inputs, onReset }) => {
  const [isSaving, setIsSaving] = useState(false);
  const isReverse = inputs.simulationMode === 'sellToBuy';

  const totalWeight = results.precoVendaAlvo; // No reverso, a base é o preço de venda
  const pCusto = results.precoVendaAlvo > 0 ? (results.custoFinal / results.precoVendaAlvo) * 100 : 0;
  const pFisco = results.precoVendaAlvo > 0 ? (results.impostosTotais / results.precoVendaAlvo) * 100 : 0;
  const pLucro = results.precoVendaAlvo > 0 ? (results.margemAbsoluta / results.precoVendaAlvo) * 100 : 0;
  const pEquilibrio = results.precoVendaAlvo > 0 ? (results.precoEquilibrio / results.precoVendaAlvo) * 100 : 0;

  // Cálculos detalhados para o resumo
  const totalCreditos = results.creditoIcmsEntrada + results.creditoPisCofinsValor;
  const valorCustoFixo = results.precoVendaAlvo * (inputs.custosFixos / 100);
  const valorComissao = results.precoVendaAlvo * (inputs.comissaoVenda / 100);
  const valorIcmsVenda = results.precoVendaAlvo * (results.icmsVendaEfetivo / 100);
  const valorPisCofinsVenda = results.precoVendaAlvo * (inputs.pisCofinsVenda / 100);

  const generateReportText = () => {
    const timestamp = new Date().toLocaleString('pt-BR');
    const modeLabel = isReverse ? "MODO REVERSO (ANÁLISE DE PREÇO FIXO)" : "MODO NORMAL (CÁLCULO DE MARGEM ALVO)";
    
    let report = `
============================================================
                TAGWAY FISCAL - RELATÓRIO
============================================================
GERADO EM: ${timestamp}
PRODUTO: ${inputs.nomeProduto || 'NOME NÃO INFORMADO'}
ROTA: ${inputs.ufOrigem} -> ${inputs.ufDestino}
REGIME: ${inputs.mode.toUpperCase()}
MODO: ${modeLabel}
============================================================\n`;

    if (isReverse) {
      report += `
1. PREÇO DE VENDA ANALISADO (BRUTO)
------------------------------------------------------------
VALOR DE VENDA FIXADO: ${formatCurrency(results.precoVendaAlvo).padStart(30)} (100%)

2. DEDUÇÕES FISCAIS (IMPOSTOS SOBRE VENDA)
------------------------------------------------------------
(-) ICMS VENDA:        ${formatCurrency(valorIcmsVenda).padStart(15)} (${results.icmsVendaEfetivo.toFixed(2)}%)
(-) PIS/COFINS VENDA:  ${formatCurrency(valorPisCofinsVenda).padStart(15)} (${inputs.pisCofinsVenda.toFixed(2)}%)
(-) ICMS ST (ANTECIP.): ${formatCurrency(results.stAPagar).padStart(15)}
TOTAL FISCO:           ${formatCurrency(results.impostosTotais).padStart(15)} (${pFisco.toFixed(2)}%)

3. DESPESAS OPERACIONAIS
------------------------------------------------------------
(-) COMISSÃO:          ${formatCurrency(valorComissao).padStart(15)} (${inputs.comissaoVenda.toFixed(2)}%)
(-) OVERHEAD (FIXO):   ${formatCurrency(valorCustoFixo).padStart(15)} (${inputs.custosFixos.toFixed(2)}%)
TOTAL OPERACIONAL:     ${formatCurrency(valorComissao + valorCustoFixo).padStart(15)}

4. CUSTO DE AQUISIÇÃO (ENTRADA)
------------------------------------------------------------
VALOR COMPRA:          ${formatCurrency(inputs.valorCompra).padStart(15)}
(+) FRETE COMPRA:      ${formatCurrency(inputs.freteValor).padStart(15)}
(+) IPI:               ${formatCurrency(results.valorIpi).padStart(15)}
(-) CRÉDITO IMPOSTOS:  ${formatCurrency(totalCreditos).padStart(15)}
CUSTO FINAL LÍQUIDO:   ${formatCurrency(results.custoFinal).padStart(15)}

5. RESULTADO FINAL (O QUE SOBRA NO BOLSO)
------------------------------------------------------------
LUCRO NOMINAL (R$):    ${formatCurrency(results.margemAbsoluta).padStart(30)}
MARGEM LÍQUIDA (%):    ${pLucro.toFixed(2).padStart(30)}%
PONTO DE EQUILÍBRIO:   ${formatCurrency(results.precoEquilibrio).padStart(30)}

VEREDITO: ${results.margemAbsoluta > 0 ? "OPERAÇÃO LUCRATIVA" : "ATENÇÃO: OPERAÇÃO COM PREJUÍZO"}
`;
    } else {
      report += `
1. VALORES DE AQUISIÇÃO (ENTRADA)
------------------------------------------------------------
VALOR DO PRODUTO:      ${formatCurrency(inputs.valorCompra).padStart(15)}
FRETE COMPRA:          ${formatCurrency(inputs.freteValor).padStart(15)}
(+) IPI:               ${formatCurrency(results.valorIpi).padStart(15)}
(-) CRÉDITO IMPOSTOS:  ${formatCurrency(totalCreditos).padStart(15)}
CUSTO FINAL LÍQUIDO:   ${formatCurrency(results.custoFinal).padStart(15)}

2. ESTRUTURA OPERACIONAL & FISCAL
------------------------------------------------------------
CUSTO FIXO:            ${formatCurrency(valorCustoFixo).padStart(15)} (${inputs.custosFixos}%)
COMISSÃO:              ${formatCurrency(valorComissao).padStart(15)} (${inputs.comissaoVenda}%)
IMPOSTOS (MÉDIA):      ${formatCurrency(results.impostosTotais).padStart(15)}

3. RESULTADO DESEJADO
------------------------------------------------------------
MARGEM ALVO (%):       ${inputs.resultadoDesejado.toFixed(2).padStart(15)}%
LUCRO NOMINAL:         ${formatCurrency(results.margemAbsoluta).padStart(15)}

4. PREÇO DE VENDA SUGERIDO
------------------------------------------------------------
VALOR FINAL:           ${formatCurrency(results.precoVendaAlvo).padStart(30)}
`;
    }

    report += `
============================================================
      TAGWAY TECHNOLOGY - BI SYSTEM | INTELIGÊNCIA FISCAL
============================================================`;
    return report.trim();
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");
      const { error } = await supabase.from('saved_simulations').insert({
        user_id: user.id,
        nome_produto: inputs.nomeProduto || 'Simulação Sem Nome',
        inputs: inputs,
        results: results
      });
      if (error) throw error;
      alert('✅ Simulação arquivada!');
    } catch (err: any) {
      alert('Erro ao salvar: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleShare = async () => {
    const shareMessage = generateReportText();
    if (navigator.share) {
      try { await navigator.share({ title: 'Simulação Tagway', text: shareMessage }); } catch (e) {}
    } else {
      window.open(`https://wa.me/?text=${encodeURIComponent(shareMessage)}`, '_blank');
    }
  };

  const handleExportTxt = () => {
    const element = document.createElement("a");
    const file = new Blob([generateReportText()], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    const fileName = isReverse ? `REVERSO_${inputs.nomeProduto.replace(/\s/g, '_')}` : `NORMAL_${inputs.nomeProduto.replace(/\s/g, '_')}`;
    element.download = `${fileName}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="space-y-6 lg:space-y-10 pb-6">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div className="space-y-1">
          <h3 className={`text-[10px] font-black uppercase tracking-widest leading-none ${isReverse ? 'text-indigo-500' : 'text-slate-400'}`}>
            {isReverse ? 'Análise de Viabilidade Reversa' : 'Cálculo de Margem Alvo'}
          </h3>
          <p className="text-sm font-black text-slate-900 tracking-tight truncate max-w-[200px] lg:max-w-none">{inputs.nomeProduto || 'Novo Produto'}</p>
        </div>
        <div className="flex items-center gap-1 lg:gap-2">
          <ActionButton onClick={onReset} label="Limpar" icon="M4 4v5h.582" color="slate" compact />
          <ActionButton onClick={handleSave} disabled={isSaving} label={isSaving ? "..." : "Arquivar"} icon="M8 7H5" color="emerald" compact />
          
          <div className="hidden lg:block">
            <ActionButton onClick={handleExportTxt} label=".TXT" icon="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" color="slate" compact />
          </div>
          
          <ActionButton onClick={handleShare} label="Enviar" icon="M8.684 13.342" color="indigo" compact />
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-6">
        <KPIBox label="Custo Final" value={results.custoFinal} sub="Líquido por Item" />
        <KPIBox label="Créditos" value={totalCreditos} sub="Recuperável" color="text-blue-600" />
        <KPIBox label="Impostos Saída" value={results.impostosTotais} sub="Carga Nominal" color="text-rose-500" />
        <KPIBox 
          label={isReverse ? "Lucro Resultante" : "Venda Sugerida"} 
          value={isReverse ? results.margemAbsoluta : results.precoVendaAlvo} 
          sub={isReverse ? `${pLucro.toFixed(2)}% de Margem` : `${inputs.resultadoDesejado}% Net`} 
          color={isReverse ? (results.margemAbsoluta > 0 ? "text-emerald-500" : "text-rose-600") : "text-indigo-600"} 
        />
      </div>

      <section className={`${isReverse ? 'bg-indigo-950' : 'bg-slate-900'} rounded-[2rem] lg:rounded-[2.5rem] p-6 lg:p-12 text-white shadow-2xl relative overflow-hidden transition-colors duration-500`}>
        <div className="absolute top-0 right-0 w-64 lg:w-96 h-64 lg:h-96 bg-white/5 blur-[80px] lg:blur-[120px] rounded-full -mr-20 -mt-20"></div>
        <div className="relative z-10 flex flex-col lg:flex-row gap-8 lg:gap-12 items-center text-center lg:text-left">
          <div className="flex-1 space-y-6 lg:space-y-10 w-full">
            <div className="space-y-1 lg:space-y-2">
              <h4 className="text-[9px] lg:text-[10px] font-black text-white/40 uppercase tracking-[0.4em]">
                {isReverse ? 'Valor Bruto em Análise' : 'Preço de Venda Sugerido'}
              </h4>
              <p className="text-4xl lg:text-6xl font-black italic tracking-tighter leading-none">{formatCurrency(results.precoVendaAlvo)}</p>
            </div>
            
            <div className="space-y-4 lg:space-y-6 w-full">
              <div className="flex justify-between items-end">
                <div className="space-y-1">
                  <span className="text-[8px] lg:text-[9px] font-black uppercase tracking-widest text-white/50">Fluxo Rentabilidade</span>
                  <div className="flex items-center gap-2 justify-center lg:justify-start">
                    <span className={`text-[9px] lg:text-[10px] font-black uppercase ${results.margemAbsoluta > 0 ? 'text-emerald-400' : 'text-rose-500'}`}>
                      {results.margemAbsoluta > 0 ? 'Operação Saudável' : 'Operação Crítica'}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[7px] lg:text-[8px] font-black text-white/30 uppercase block">Break-even</span>
                  <span className="text-[10px] lg:text-xs font-black font-mono text-rose-400">{formatCurrency(results.precoEquilibrio)}</span>
                </div>
              </div>
              
              <div className="relative pt-4 w-full">
                <div className="absolute top-0 w-px h-8 lg:h-12 bg-white/30 z-20" style={{ left: `${pEquilibrio}%` }}></div>
                <div className="w-full h-3 lg:h-4 bg-white/10 rounded-full flex overflow-hidden ring-4 lg:ring-8 ring-white/5">
                  <div style={{ width: `${pCusto}%` }} className="h-full bg-indigo-500"></div>
                  <div style={{ width: `${pFisco}%` }} className="h-full bg-rose-500"></div>
                  <div style={{ width: `${pLucro > 0 ? pLucro : 0}%` }} className="h-full bg-emerald-400"></div>
                </div>
              </div>

              <div className="flex flex-wrap justify-center lg:justify-start gap-4 lg:gap-10 pt-2 lg:pt-4">
                <CompositionItem label="Custo" perc={pCusto} color="bg-indigo-500" />
                <CompositionItem label="Fisco" perc={pFisco} color="bg-rose-500" />
                <CompositionItem label="Net" perc={pLucro} color="bg-emerald-400" />
              </div>
            </div>
          </div>
          
          <div className={`w-full lg:w-72 rounded-[2rem] p-6 lg:p-10 border border-white/10 space-y-4 lg:space-y-8 text-center shrink-0 ${isReverse ? 'bg-indigo-900/40 backdrop-blur-md' : 'bg-white/5 backdrop-blur-md'}`}>
             <div>
               <span className="text-[8px] lg:text-[9px] font-black uppercase tracking-widest text-white/40 block mb-1">Lucro Unitário</span>
               <p className={`text-2xl lg:text-4xl font-black font-mono tracking-tighter ${results.margemAbsoluta > 0 ? 'text-emerald-400' : 'text-rose-500'}`}>
                 {formatCurrency(results.margemAbsoluta)}
               </p>
             </div>
             <div className="h-px bg-white/10 hidden lg:block"></div>
             <div className="space-y-1">
               <span className="text-[7px] lg:text-[8px] font-black uppercase tracking-widest text-white/20 block">Deduções Variáveis</span>
               <p className="text-lg lg:text-xl font-black text-white/60 font-mono">
                 {(results.totalDeducoesVendaPerc - (isReverse ? pLucro : inputs.resultadoDesejado)).toFixed(2)}%
               </p>
             </div>
          </div>
        </div>
      </section>

      {!isReverse && (
        <section className="space-y-4">
          <div className="flex items-center justify-between ml-2">
            <h3 className="text-[9px] lg:text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Matriz Estratégica</h3>
          </div>
          <div className="flex overflow-x-auto no-scrollbar lg:grid lg:grid-cols-5 gap-4 pb-2">
            {priceMatrix.map((cat: any, idx: number) => (
              <div key={idx} className="bg-white rounded-[1.5rem] lg:rounded-[2rem] border border-slate-200 p-4 lg:p-6 min-w-[240px] lg:min-w-0 shrink-0">
                 <div className="flex justify-between items-center mb-4 lg:mb-6">
                   <span className="bg-slate-900 text-white text-[7px] lg:text-[8px] font-black px-2 py-1 rounded uppercase">{cat.label}</span>
                   <span className="text-[9px] lg:text-[10px] font-black text-slate-300">{cat.margin}%</span>
                 </div>
                 <div className="space-y-3 lg:space-y-4">
                   <PriceLevel label="Ideal (I)" value={cat.levels['I']} color="text-emerald-500" />
                   <PriceLevel label="Desconto (D)" value={cat.levels['D']} color="text-amber-500" />
                   <PriceLevel label="P6 (+11.1%)" value={cat.levels['P6']} color="text-blue-500" />
                   <PriceLevel label="P6+ (+17.6%)" value={cat.levels['P6+']} color="text-indigo-600" />
                 </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

const ActionButton = ({ onClick, label, icon, color, disabled, compact }: any) => {
  const styles: any = {
    slate: 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200',
    indigo: 'bg-indigo-50 text-indigo-600 border-indigo-100 hover:bg-indigo-100',
    emerald: 'bg-emerald-500 text-white border-emerald-500 hover:bg-emerald-600'
  };
  return (
    <button onClick={onClick} disabled={disabled} className={`flex items-center gap-1 lg:gap-2 ${compact ? 'px-3 py-2' : 'px-5 py-2.5'} rounded-lg lg:rounded-xl border font-black uppercase text-[8px] lg:text-[9px] tracking-widest btn-touch transition-all disabled:opacity-50 ${styles[color]}`}>
      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d={icon}/></svg>
      {label}
    </button>
  );
};

const KPIBox = ({ label, value, sub, color }: any) => (
  <div className="bg-white p-4 lg:p-6 rounded-[1.5rem] lg:rounded-[2rem] border border-slate-100 shadow-sm">
    <span className="text-[8px] lg:text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 block truncate">{label}</span>
    <p className={`text-base lg:text-2xl font-black font-mono tracking-tighter truncate ${color || 'text-slate-900'}`}>{formatCurrency(value)}</p>
    <p className="text-[7px] lg:text-[8px] font-bold text-slate-300 uppercase mt-1 truncate">{sub}</p>
  </div>
);

const CompositionItem = ({ label, perc, color }: any) => (
  <div className="flex items-center gap-2">
    <div className={`w-2 h-2 rounded-full ${color}`}></div>
    <div className="flex flex-col text-left">
      <span className="text-[7px] font-black uppercase text-white/30 tracking-widest leading-none mb-0.5">{label}</span>
      <span className="text-[10px] font-black font-mono">{perc.toFixed(0)}%</span>
    </div>
  </div>
);

const PriceLevel = ({ label, value, color }: any) => (
  <div className="flex justify-between items-center">
    <span className="text-[7px] lg:text-[8px] font-black text-slate-400 uppercase tracking-widest">{label}</span>
    <span className={`text-[10px] lg:text-[11px] font-black font-mono ${color}`}>{formatCurrency(value)}</span>
  </div>
);

export default ResultsTable;
