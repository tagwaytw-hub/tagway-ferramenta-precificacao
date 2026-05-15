
import React from 'react';
import { formatCurrency } from '../utils/calculations';

interface MatrizEstrategicaViewProps {
  priceMatrix: any[];
}

const MatrizEstrategicaView: React.FC<MatrizEstrategicaViewProps> = ({ priceMatrix }) => {
  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header className="bg-white rounded-[2.5rem] p-10 shadow-sm border border-slate-100">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 shadow-[0_0_8px_#6366f1]"></div>
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Inteligência de Mercado</span>
            </div>
            <h1 className="text-3xl font-black text-slate-900 uppercase">Matriz Estratégica de Preços</h1>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-tight mt-1">
              Visualização de múltiplos cenários de margem para o produto atual.
            </p>
          </div>
        </div>
      </header>

      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        {priceMatrix.map((cat: any, idx: number) => (
          <div key={idx} className="bg-white rounded-[2rem] border border-slate-200 p-8 shadow-sm group hover:border-indigo-200 transition-all">
             <div className="flex justify-between items-center mb-8">
               <span className="bg-slate-900 text-white text-[8px] font-black px-3 py-1.5 rounded-full uppercase tracking-widest">{cat.label}</span>
               <span className="text-xs font-black text-indigo-600">{cat.margin}%</span>
             </div>
             <div className="space-y-5">
               <PriceLevel label="Ideal (I)" value={cat.levels['I']} color="text-emerald-500" />
               <PriceLevel label="Desconto (D)" value={cat.levels['D']} color="text-amber-500" />
               <PriceLevel label="P6 (+11.1%)" value={cat.levels['P6']} color="text-blue-500" />
               <PriceLevel label="P6+ (+17.6%)" value={cat.levels['P6+']} color="text-indigo-600" />
             </div>
             
             <div className="mt-8 pt-6 border-t border-slate-50 opacity-0 group-hover:opacity-100 transition-opacity">
                <p className="text-[8px] font-bold text-slate-300 uppercase leading-tight">Sugestão baseada em custos fixos de estrutura e carga tributária real.</p>
             </div>
          </div>
        ))}
      </section>

      <div className="bg-slate-900 rounded-[2.5rem] p-10 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 blur-[100px] rounded-full"></div>
        <div className="relative z-10 space-y-4">
          <h4 className="text-sm font-black uppercase tracking-widest">Guia de Aplicação</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            <p className="text-[11px] font-bold text-white/50 uppercase leading-relaxed">
              Use o nível <span className="text-white">Ideal</span> para operações padrão. O nível <span className="text-white">Desconto</span> representa a margem mínima aceitável sem comprometer a estrutura de custos.
            </p>
            <p className="text-[11px] font-bold text-white/50 uppercase leading-relaxed">
              Os níveis <span className="text-white">P6 e P6+</span> são aplicáveis para canais de venda com alto custo de aquisição ou impostos adicionais não previstos.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

const PriceLevel = ({ label, value, color }: any) => (
  <div className="flex justify-between items-center">
    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{label}</span>
    <span className={`text-xs font-black font-mono ${color}`}>{formatCurrency(value)}</span>
  </div>
);

export default MatrizEstrategicaView;
