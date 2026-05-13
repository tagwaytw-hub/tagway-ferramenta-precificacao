
import React from 'react';
import { DREData, CostItem, VariableCostItem } from '../types';

interface DREViewProps {
  faturamento: number;
  fixedCosts: CostItem[];
  variableCosts: VariableCostItem[];
  margemContribuicaoSimulada?: number; // Vem da calculadora se disponível
}

const DREView: React.FC<DREViewProps> = ({ faturamento, fixedCosts, variableCosts, margemContribuicaoSimulada }) => {
  
  // Cálculos Básicos
  const totalFixos = fixedCosts.reduce((acc, c) => acc + c.valor, 0);
  const totalVariaveisPerc = variableCosts.reduce((acc, v) => acc + v.percentual, 0);
  
  // Se não houver margem simulada, usamos uma média baseada nos custos variáveis cadastrados
  // Mas o ideal é que a margem venha da calculadora de produtos
  const margemUtilizada = margemContribuicaoSimulada || (100 - totalVariaveisPerc);
  
  const receitaBruta = faturamento;
  const impostosVenda = receitaBruta * 0.18; // Estimativa média (ICMS/PIS/COFINS)
  const receitaLiquida = receitaBruta - impostosVenda;
  
  const margemContribuicaoValor = (receitaBruta * margemUtilizada) / 100;
  const cpv = receitaLiquida - margemContribuicaoValor;
  
  const ebitda = margemContribuicaoValor - totalFixos;
  const pontoEquilibrio = totalFixos / (margemUtilizada / 100);

  const dreRows = [
    { label: 'Receita Bruta de Vendas', value: receitaBruta, type: 'main', color: 'text-slate-900' },
    { label: '(-) Impostos sobre Vendas (Est. 18%)', value: -impostosVenda, type: 'deduction', color: 'text-rose-500' },
    { label: 'RECEITA LÍQUIDA', value: receitaLiquida, type: 'subtotal', color: 'text-slate-900' },
    { label: '(-) Custo dos Produtos Vendidos (CPV)', value: -cpv, type: 'deduction', color: 'text-rose-500' },
    { label: 'MARGEM DE CONTRIBUIÇÃO', value: margemContribuicaoValor, type: 'total', color: 'text-emerald-600', perc: margemUtilizada },
    { label: '(-) Despesas Fixas (Overhead)', value: -totalFixos, type: 'deduction', color: 'text-rose-500' },
    { label: 'LUCRO OPERACIONAL (EBITDA)', value: ebitda, type: 'final', color: 'text-indigo-600', perc: (ebitda/receitaBruta)*100 },
  ];

  return (
    <div className="space-y-8 animate-slide-up">
      <header>
        <h2 className="text-4xl font-black text-slate-900 tracking-tighter uppercase">DRE Gerencial</h2>
        <p className="text-slate-400 text-sm font-medium">Demonstrativo de Resultados do Exercício.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
           <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Ponto de Equilíbrio</p>
           <h4 className="text-2xl font-black text-slate-900">R$ {pontoEquilibrio.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h4>
           <p className="text-[8px] font-bold text-slate-400 mt-1 uppercase">Faturamento necessário para zerar</p>
        </div>
        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
           <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Margem de Segurança</p>
           <h4 className="text-2xl font-black text-emerald-600">{(((receitaBruta - pontoEquilibrio) / receitaBruta) * 100).toFixed(1)}%</h4>
           <p className="text-[8px] font-bold text-slate-400 mt-1 uppercase">Distância do ROI zero</p>
        </div>
        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
           <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Markup Médio</p>
           <h4 className="text-2xl font-black text-indigo-600">{(receitaBruta / (cpv || 1)).toFixed(2)}x</h4>
           <p className="text-[8px] font-bold text-slate-400 mt-1 uppercase">Fator sobre custo</p>
        </div>
        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
           <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Lucratividade</p>
           <h4 className="text-2xl font-black text-indigo-600">{((ebitda / receitaBruta) * 100).toFixed(1)}%</h4>
           <p className="text-[8px] font-bold text-slate-400 mt-1 uppercase">Eficiência final do negócio</p>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-[3rem] shadow-xl overflow-hidden">
        <div className="p-10 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
            <div className="flex flex-col">
                <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Relatório Financeiro</span>
                <h3 className="text-xl font-black text-slate-900">Demonstrativo Detalhado</h3>
            </div>
            <div className="text-right">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Mês Referência</span>
                <p className="font-bold text-slate-900">Maio / 2026</p>
            </div>
        </div>
        
        <div className="p-8 lg:p-12">
          <div className="space-y-4">
            {dreRows.map((row, idx) => (
              <div 
                key={idx} 
                className={`flex items-center justify-between p-4 rounded-2xl transition-all ${
                  row.type === 'total' || row.type === 'final' ? 'bg-slate-900 text-white shadow-lg scale-[1.02]' : 
                  row.type === 'subtotal' ? 'bg-slate-50 font-bold border border-slate-100' : 'hover:bg-slate-50'
                }`}
              >
                <div className="flex flex-col">
                  <span className={`text-[12px] font-black uppercase tracking-tight ${row.type === 'total' || row.type === 'final' ? 'text-white' : row.color}`}>
                    {row.label}
                  </span>
                  {row.perc !== undefined && (
                    <span className={`text-[9px] font-bold ${row.type === 'total' || row.type === 'final' ? 'text-white/50' : 'text-slate-400'}`}>
                      {row.perc.toFixed(2)}% da Receita Bruta
                    </span>
                  )}
                </div>
                <span className={`text-xl font-black font-mono ${
                    row.type === 'total' || row.type === 'final' ? 'text-white' : 
                    row.value < 0 ? 'text-rose-500' : row.color
                }`}>
                  R$ {Math.abs(row.value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-slate-900 p-8 text-center">
             <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em]">Tagway Financial Intelligence © 2026</p>
        </div>
      </div>
    </div>
  );
};

export default DREView;
