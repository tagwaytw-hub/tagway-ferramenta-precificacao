import React from 'react';
import { SimulationResults, SimulationInputs } from '../types';
import { formatCurrency } from '../utils/calculations';

interface ResultsTableProps {
  results: SimulationResults;
  priceMatrix: any[];
  inputs: SimulationInputs;
}

const MetricCard: React.FC<{ label: string; value: string; subValue?: string; delta?: string; color?: string }> = ({ label, value, subValue, delta, color = "blue" }) => (
  <div className="bg-white p-4 md:p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between transition-transform active:scale-[0.98]">
    <p className="text-[10px] md:text-sm text-slate-500 font-black uppercase tracking-widest mb-1">{label}</p>
    <div>
      <h3 className={`text-xl md:text-2xl font-black text-slate-800 tracking-tight`}>{value}</h3>
      {subValue && <p className="text-[9px] md:text-xs text-slate-400 font-bold uppercase mt-1 tracking-tighter">{subValue}</p>}
    </div>
    {delta && (
      <span className={`text-[9px] font-black uppercase px-2 py-1 rounded-lg mt-3 w-fit tracking-widest ${
        color === 'red' ? 'bg-red-50 text-red-600' : 
        color === 'green' ? 'bg-green-50 text-green-600' : 
        'bg-blue-50 text-blue-600'
      }`}>
        {delta}
      </span>
    )}
  </div>
);

const ResultsTable: React.FC<ResultsTableProps> = ({ results, priceMatrix, inputs }) => {
  const pisCofinsValor = results.precoVendaAlvo * (inputs.pisCofinsVenda / 100);
  const comissaoValor = results.precoVendaAlvo * (inputs.comissaoVenda / 100);
  const icmsVendaValor = results.precoVendaAlvo * (results.icmsVendaEfetivo / 100);
  const outrosVariaveisValor = results.precoVendaAlvo * (inputs.outrosCustosVariaveis / 100);
  const custosFixosValor = results.precoVendaAlvo * (inputs.custosFixos / 100);
  const margemValor = results.precoVendaAlvo * (inputs.resultadoDesejado / 100);

  const totalCustoVenda = pisCofinsValor + comissaoValor + icmsVendaValor + outrosVariaveisValor + custosFixosValor + margemValor;

  return (
    <div className="space-y-6 md:space-y-8">
      {/* Cards de Métricas - Visíveis em Desktop, Ocultos em Mobile para focar em Composição e Matriz */}
      <div className="hidden md:grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard label="Total NF" value={formatCurrency(results.valorTotalNota)} subValue="Base NF-e" />
        {inputs.mode === 'substituido' ? (
          <MetricCard label="ICMS-ST" value={formatCurrency(results.stAPagar)} delta="Débito ST" color="red" />
        ) : (
          <MetricCard label="Crédito ICMS" value={formatCurrency(results.creditoIcmsEntrada)} delta="Ativo" color="green" />
        )}
        <MetricCard label="Créd. PIS/COF" value={formatCurrency(results.creditoPisCofinsValor)} delta="Ativo" color="green" />
        <MetricCard label="CUSTO LÍQ." value={formatCurrency(results.custoFinal)} delta="Base Venda" color="blue" />
      </div>

      <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden">
        <div className="bg-slate-100 p-2.5 text-center font-black text-slate-800 uppercase tracking-[0.2em] text-[10px]">
          Composição de Saída
        </div>
        <div className="p-4 md:p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 md:gap-x-10 mb-4">
            {[
              { label: 'PIS / COF (Saída)', val: pisCofinsValor, red: false },
              { label: `ICMS Venda ${inputs.mode === 'reduzido' ? '(Efetivo)' : ''}`, val: icmsVendaValor, red: inputs.mode === 'reduzido' },
              { label: 'Comissão de Venda', val: comissaoValor, red: false },
              { label: 'Custos Fixos Op.', val: custosFixosValor, red: false },
              { label: 'Resultado Líquido Alvo', val: margemValor, red: false, indigo: true },
              { label: 'Total Deduções', val: totalCustoVenda, red: true, bold: true },
            ].map((item, i) => (
              <div key={i} className="flex justify-between items-center border-b border-slate-100 py-3">
                <span className={`text-[10px] font-bold uppercase tracking-tight ${item.red && !item.indigo ? 'text-red-500' : item.indigo ? 'text-indigo-600' : 'text-slate-500'}`}>
                  {item.label}
                </span>
                <span className={`font-mono text-xs font-black ${item.red && !item.indigo ? 'text-red-600' : item.indigo ? 'text-indigo-700' : 'text-slate-900'}`}>
                  {formatCurrency(item.val)}
                </span>
              </div>
            ))}
          </div>

          <div className="bg-indigo-600 p-4 text-white flex flex-col sm:flex-row justify-between items-center rounded-2xl shadow-xl shadow-indigo-500/20 gap-2">
            <span className="font-black text-[10px] md:text-sm uppercase tracking-widest text-indigo-200">Preço de Venda Sugerido</span>
            <span className="text-2xl md:text-3xl font-black tracking-tight">{formatCurrency(results.precoVendaAlvo)}</span>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <h3 className="text-xs md:text-sm font-black text-slate-800 uppercase tracking-widest">Matriz de Condições 2025</h3>
          <div className="h-px flex-1 bg-slate-200"></div>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4">
          {priceMatrix.map((cat, idx) => (
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
                <div key={row.l} className="flex border-b border-slate-100 last:border-0 group">
                  <div className={`w-8 ${row.bg} flex items-center justify-center font-black text-white text-[10px] border-r border-slate-200/20`}>{row.l}</div>
                  <div className={`flex-1 ${row.cell} py-2.5 px-2 text-right font-black text-slate-800 text-[11px]`}>{formatCurrency(cat.levels[row.l]).replace('R$', '')}</div>
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