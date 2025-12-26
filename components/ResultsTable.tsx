
import React from 'react';
import { SimulationResults, SimulationInputs } from '../types';
import { formatCurrency } from '../utils/calculations';

interface ResultsTableProps {
  results: SimulationResults;
  priceMatrix: any[];
  inputs: SimulationInputs;
}

const MetricCard: React.FC<{ label: string; value: string; subValue?: string; delta?: string; color?: string }> = ({ label, value, subValue, delta, color = "blue" }) => (
  <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100 flex flex-col justify-between">
    <p className="text-sm text-slate-500 font-medium mb-1">{label}</p>
    <div>
      <h3 className={`text-2xl font-bold text-slate-800`}>{value}</h3>
      {subValue && <p className="text-xs text-slate-400 mt-1">{subValue}</p>}
    </div>
    {delta && (
      <span className={`text-xs font-semibold px-2 py-1 rounded-full mt-3 w-fit ${
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
    <div className="space-y-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard label="Total NF" value={formatCurrency(results.valorTotalNota)} subValue="NF + IPI + Frete" />
        {inputs.mode === 'substituido' ? (
          <MetricCard label="ICMS-ST" value={formatCurrency(results.stAPagar)} delta="Custo de Entrada" color="red" />
        ) : (
          <MetricCard label="Crédito ICMS" value={formatCurrency(results.creditoIcmsEntrada)} delta="Recuperável" color="green" />
        )}
        <MetricCard label="Crédito PIS/COF" value={formatCurrency(results.creditoPisCofinsValor)} delta="Recuperável" color="green" />
        <MetricCard label="CUSTO LÍQUIDO" value={formatCurrency(results.custoFinal)} delta="Base p/ Venda" color="blue" />
      </div>

      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
        <div className="bg-slate-300 p-2 text-center font-bold text-slate-800 uppercase tracking-widest text-xs">
          Composição do Preço Alvo ({inputs.mode})
        </div>
        <div className="p-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-1 mb-4">
            <div className="flex justify-between border-b py-1.5 text-xs">
              <span className="font-semibold text-slate-600">PIS E COFINS SOBRE VENDA</span>
              <span className="font-mono text-slate-900">{formatCurrency(pisCofinsValor)}</span>
            </div>
            <div className="flex justify-between border-b py-1.5 text-xs">
              <span className="font-semibold text-slate-600">ICMS SOBRE VENDA {inputs.mode === 'reduzido' ? '(EFETIVO)' : ''}</span>
              <span className={`font-mono ${inputs.mode === 'reduzido' ? 'text-orange-600 font-bold' : 'text-slate-900'}`}>{formatCurrency(icmsVendaValor)}</span>
            </div>
            <div className="flex justify-between border-b py-1.5 text-xs">
              <span className="font-semibold text-slate-600">COMISSÕES</span>
              <span className="font-mono text-slate-900">{formatCurrency(comissaoValor)}</span>
            </div>
            <div className="flex justify-between border-b py-1.5 text-xs">
              <span className="font-semibold text-slate-600">CUSTOS FIXOS</span>
              <span className="font-mono text-slate-900">{formatCurrency(custosFixosValor)}</span>
            </div>
            <div className="flex justify-between border-b py-1.5 text-xs">
              <span className="font-semibold text-slate-600">RESULTADO LÍQUIDO</span>
              <span className="font-mono text-indigo-700 font-bold">{formatCurrency(margemValor)}</span>
            </div>
            <div className="flex justify-between border-b py-1.5 text-xs font-bold text-red-600">
              <span className="">TOTAL DEDUÇÕES VENDA</span>
              <span className="font-mono">{formatCurrency(totalCustoVenda)}</span>
            </div>
          </div>

          <div className="bg-indigo-600 p-3 text-white flex justify-between items-center rounded shadow-inner">
            <span className="font-black text-sm uppercase tracking-tighter">PREÇO DE VENDA SUGERIDO</span>
            <span className="text-2xl font-black">{formatCurrency(results.precoVendaAlvo)}</span>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-black text-slate-800 uppercase">Matriz de Condições</h3>
          <div className="h-px flex-1 bg-slate-200"></div>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {priceMatrix.map((cat, idx) => (
            <div key={idx} className="flex flex-col border border-slate-300 rounded overflow-hidden shadow-sm hover:shadow-md transition-shadow">
              <div className="bg-slate-400 text-slate-900 text-center py-1.5 font-bold text-xs uppercase border-b border-slate-300">
                {cat.label}
              </div>
              <div className="flex border-b border-slate-300">
                <div className="w-10 bg-[#C0504D] flex items-center justify-center font-bold text-slate-900 text-sm border-r border-slate-300">A</div>
                <div className="flex-1 bg-[#E6B8B7] py-2 px-2 text-right font-black text-slate-900 text-sm">{formatCurrency(cat.levels.A).replace('R$', '')}</div>
              </div>
              <div className="flex border-b border-slate-300">
                <div className="w-10 bg-[#FFFF00] flex items-center justify-center font-bold text-slate-900 text-sm border-r border-slate-300">B</div>
                <div className="flex-1 bg-[#FFFFCC] py-2 px-2 text-right font-black text-slate-900 text-sm">{formatCurrency(cat.levels.B).replace('R$', '')}</div>
              </div>
              <div className="flex border-b border-slate-300">
                <div className="w-10 bg-[#00B0F0] flex items-center justify-center font-bold text-slate-900 text-sm border-r border-slate-300">C</div>
                <div className="flex-1 bg-[#DBEEF3] py-2 px-2 text-right font-black text-slate-900 text-sm">{formatCurrency(cat.levels.C).replace('R$', '')}</div>
              </div>
              <div className="flex">
                <div className="w-10 bg-[#92D050] flex items-center justify-center font-bold text-slate-900 text-sm border-r border-slate-300">D</div>
                <div className="flex-1 bg-[#EBF1DE] py-2 px-2 text-right font-black text-slate-900 text-sm">{formatCurrency(cat.levels.D).replace('R$', '')}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ResultsTable;
