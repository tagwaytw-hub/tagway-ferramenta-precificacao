import React from 'react';
import { SimulationResults, SimulationInputs } from '../types';
import { formatCurrency, formatPercent } from '../utils/calculations';

interface ResultsTableProps {
  results: SimulationResults;
  priceMatrix: any[];
  inputs: SimulationInputs;
}

const MetricCard: React.FC<{ label: string; value: string; subValue?: string; delta?: string; color?: string }> = ({ label, value, subValue, delta, color = "blue" }) => (
  <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between transition-transform active:scale-[0.98]">
    <p className="text-[9px] md:text-sm text-slate-500 font-black uppercase tracking-widest mb-1">{label}</p>
    <div>
      <h3 className={`text-lg md:text-2xl font-black text-slate-800 tracking-tight`}>{value}</h3>
      {subValue && <p className="text-[8px] md:text-xs text-slate-400 font-bold uppercase mt-0.5 tracking-tighter">{subValue}</p>}
    </div>
    {delta && (
      <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-lg mt-2 w-fit tracking-widest ${
        color === 'red' ? 'bg-red-50 text-red-600' : 
        color === 'green' ? 'bg-green-50 text-green-600' : 
        'bg-blue-50 text-blue-600'
      }`}>
        {delta}
      </span>
    )}
  </div>
);

const PriceBreakdown: React.FC<{ results: SimulationResults; inputs: SimulationInputs }> = ({ results, inputs }) => {
  const total = results.precoVendaAlvo;
  if (!total) return null;

  const custoPerc = (results.custoFinal / total) * 100;
  const impostoPerc = (results.impostosTotais / total) * 100;
  const margemPerc = (results.margemAbsoluta / total) * 100;

  return (
    <div className="bg-white p-5 md:p-6 rounded-3xl border border-slate-200 shadow-sm mt-6 md:mt-8">
      <h3 className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-4">Composição Analítica</h3>
      <div className="flex h-10 md:h-12 w-full rounded-2xl overflow-hidden shadow-inner bg-slate-100">
        <div style={{ width: `${custoPerc}%` }} className="bg-slate-800 h-full transition-all duration-500"></div>
        <div style={{ width: `${impostoPerc}%` }} className="bg-red-500 h-full transition-all duration-500"></div>
        <div style={{ width: `${margemPerc}%` }} className="bg-green-500 h-full transition-all duration-500"></div>
      </div>
      <div className="grid grid-cols-3 gap-2 mt-4 md:mt-6">
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5 mb-0.5">
            <div className="w-1.5 h-1.5 rounded-full bg-slate-800"></div>
            <span className="text-[8px] font-black text-slate-500 uppercase">Custo</span>
          </div>
          <span className="text-xs md:text-sm font-black text-slate-800">{custoPerc.toFixed(1)}%</span>
        </div>
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5 mb-0.5">
            <div className="w-1.5 h-1.5 rounded-full bg-red-500"></div>
            <span className="text-[8px] font-black text-slate-500 uppercase">Fisco</span>
          </div>
          <span className="text-xs md:text-sm font-black text-red-600">{impostoPerc.toFixed(1)}%</span>
        </div>
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5 mb-0.5">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
            <span className="text-[8px] font-black text-slate-500 uppercase">Lucro</span>
          </div>
          <span className="text-xs md:text-sm font-black text-green-600">{margemPerc.toFixed(1)}%</span>
        </div>
      </div>
    </div>
  );
};

const ResultsTable: React.FC<ResultsTableProps> = ({ results, priceMatrix, inputs }) => {
  const pisCofinsValor = results.precoVendaAlvo * (inputs.pisCofinsVenda / 100);
  const comissaoValor = results.precoVendaAlvo * (inputs.comissaoVenda / 100);
  const icmsVendaValor = results.precoVendaAlvo * (results.icmsVendaEfetivo / 100);
  const outrosVariaveisValor = results.precoVendaAlvo * (inputs.outrosCustosVariaveis / 100);
  const custosFixosValor = results.precoVendaAlvo * (inputs.custosFixos / 100);
  const margemValor = results.precoVendaAlvo * (inputs.resultadoDesejado / 100);

  const totalCustoVenda = pisCofinsValor + comissaoValor + icmsVendaValor + outrosVariaveisValor + custosFixosValor + margemValor;

  const exportToWhatsApp = () => {
    const nomeExibicao = inputs.nomeProduto.trim() || `Item NCM ${inputs.ncmCodigo}`;
    const text = `*SIMULAÇÃO FISCAL - TAGWAY*%0A%0A` +
      `*Item:* ${nomeExibicao}%0A` +
      `*NCM:* ${inputs.ncmCodigo}%0A` +
      `*Rota:* ${inputs.ufOrigem} ➔ ${inputs.ufDestino}%0A%0A` +
      `*Custo Líquido:* ${formatCurrency(results.custoFinal)}%0A` +
      `*Margem Alvo:* ${inputs.resultadoDesejado}%%0A` +
      `----------------------------%0A` +
      `*PREÇO DE VENDA:* ${formatCurrency(results.precoVendaAlvo)}%0A` +
      `----------------------------%0A%0A` +
      `_Gerado por Tagway Technology 2025_`;
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Grid de Métricas (Agora visível no Mobile 2x2) */}
      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <MetricCard label="Total NF" value={formatCurrency(results.valorTotalNota)} subValue="Base NF-e" />
        {inputs.mode === 'substituido' ? (
          <MetricCard label="ICMS-ST" value={formatCurrency(results.stAPagar)} delta="Débito ST" color="red" />
        ) : (
          <MetricCard label="Crédito ICMS" value={formatCurrency(results.creditoIcmsEntrada)} delta="Ativo" color="green" />
        )}
        <MetricCard label="Créd. PIS/COF" value={formatCurrency(results.creditoPisCofinsValor)} delta="Ativo" color="green" />
        <MetricCard label="CUSTO LÍQ." value={formatCurrency(results.custoFinal)} delta="Referência" color="blue" />
      </div>

      <div className="bg-white rounded-3xl shadow-lg border border-slate-200 overflow-hidden">
        <div className="bg-slate-100 p-4 flex justify-between items-center px-5">
          <span className="font-black text-slate-800 uppercase tracking-widest text-[9px] md:text-[10px]">Detalhamento de Saída</span>
          <button 
            onClick={exportToWhatsApp}
            className="bg-green-500 text-white px-3 py-1.5 rounded-xl text-[8px] font-black uppercase tracking-widest hover:bg-green-600 transition-colors flex items-center gap-2 shadow-lg shadow-green-500/20"
          >
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.417-.003 6.557-5.338 11.892-11.893 11.892-1.997-.001-3.951-.5-5.688-1.448l-6.305 1.652zm6.599-3.835c1.544.917 3.51 1.403 5.316 1.404h.002c5.451 0 9.886-4.435 9.889-9.886.002-2.642-1.029-5.126-2.902-7c-1.874-1.874-4.359-2.905-7.002-2.907h-.002c-5.451 0-9.886 4.436-9.889 9.888 0 1.875.522 3.706 1.512 5.31l-.994 3.635 3.725-.977z"/></svg>
            <span className="hidden sm:inline">Compartilhar</span>
          </button>
        </div>
        <div className="p-4 md:p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 md:gap-x-10">
            {[
              { label: 'PIS / COF (Saída)', val: pisCofinsValor, red: false },
              { label: `ICMS Venda ${inputs.mode === 'reduzido' ? '(Efetivo)' : ''}`, val: icmsVendaValor, red: inputs.mode === 'reduzido' },
              { label: 'Comissão de Venda', val: comissaoValor, red: false },
              { label: 'Custos Fixos Op.', val: custosFixosValor, red: false },
              { label: 'Resultado Líquido Alvo', val: margemValor, red: false, indigo: true },
              { label: 'Total Deduções', val: totalCustoVenda, red: true, bold: true },
            ].map((item, i) => (
              <div key={i} className="flex justify-between items-center border-b border-slate-100 py-3.5 last:md:border-b last:border-0">
                <span className={`text-[10px] font-bold uppercase tracking-tight ${item.red && !item.indigo ? 'text-red-500' : item.indigo ? 'text-indigo-600' : 'text-slate-500'}`}>
                  {item.label}
                </span>
                <span className={`font-mono text-xs font-black ${item.red && !item.indigo ? 'text-red-600' : item.indigo ? 'text-indigo-700' : 'text-slate-900'}`}>
                  {formatCurrency(item.val)}
                </span>
              </div>
            ))}
          </div>

          <div className="bg-indigo-600 p-5 text-white flex flex-col justify-center items-center rounded-2xl shadow-xl shadow-indigo-500/20 gap-1 mt-4">
            <span className="font-black text-[9px] uppercase tracking-[0.2em] text-indigo-200">Preço de Venda Sugerido</span>
            <span className="text-2xl md:text-3xl font-black tracking-tight">{formatCurrency(results.precoVendaAlvo)}</span>
          </div>
        </div>
      </div>

      <PriceBreakdown results={results} inputs={inputs} />

      <div className="space-y-4">
        <div className="flex items-center gap-3 px-1">
          <h3 className="text-[10px] font-black text-slate-800 uppercase tracking-widest">Matriz Dinâmica</h3>
          <div className="h-px flex-1 bg-slate-200"></div>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4 overflow-x-hidden pb-10">
          {priceMatrix.map((cat: any, idx: number) => (
            <div key={idx} className="flex flex-col border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-sm hover:shadow-md transition-shadow">
              <div className="bg-slate-100 text-slate-600 text-center py-2 font-black text-[9px] uppercase tracking-tighter border-b border-slate-200">
                {cat.label}
              </div>
              {[
                { l: 'A', bg: 'bg-[#C0504D]', cell: 'bg-[#F2DCDB]' },
                { l: 'B', bg: 'bg-[#EBC11F]', cell: 'bg-[#FFF9E5]' },
                { l: 'C', bg: 'bg-[#00B0F0]', cell: 'bg-[#EBF7FF]' },
                { l: 'D', bg: 'bg-[#92D050]', cell: 'bg-[#F4F9EB]' },
              ].map(row => (
                <div key={row.l} className="flex border-b border-slate-100 last:border-0">
                  <div className={`w-8 ${row.bg} flex items-center justify-center font-black text-white text-[10px]`}>{row.l}</div>
                  <div className={`flex-1 ${row.cell} py-2.5 px-2 text-right font-black text-slate-800 text-[10px]`}>{formatCurrency(cat.levels[row.l]).replace('R$', '')}</div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ResultsTable;