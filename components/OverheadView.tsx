
import React, { useState, useMemo, useEffect } from 'react';
import { CostItem, VariableCostItem } from '../types';
import { formatCurrency } from '../utils/calculations';
import { supabase } from '../lib/supabase';

interface OverheadViewProps {
  faturamento: number;
  setFaturamento: (val: number) => void;
  fixedCosts: CostItem[];
  setFixedCosts: (costs: CostItem[]) => void;
  variableCosts: VariableCostItem[];
  setVariableCosts: (costs: VariableCostItem[]) => void;
  userId?: string;
  isAutoSync: boolean;
  setIsAutoSync: (val: boolean) => void;
}

const DEFAULT_FIXED_LIST = [
  { id: '1', categoria: 'PESSOAL / RH', descricao: 'Salários e Encargos', percentual_target: 12 },
  { id: '2', categoria: 'ESTRUTURA / OCUPAÇÃO', descricao: 'Aluguel, IPTU, Seguro', percentual_target: 5 },
  { id: '3', categoria: 'SOLUÇÃO DE MARKETING', descricao: 'Ferramentas e Assinaturas', percentual_target: 3 },
  { id: '4', categoria: 'TECNOLOGIA / TI', descricao: 'Software e Cloud', percentual_target: 2 },
  { id: '5', categoria: 'DESPESAS ADMINISTRATIVAS', descricao: 'Contabilidade e Consultoria', percentual_target: 2 },
  { id: '6', categoria: 'FINANCEIRO', descricao: 'Taxas Bancárias e Juros Fixos', percentual_target: 2 },
];

const OverheadView: React.FC<OverheadViewProps> = ({
  faturamento, setFaturamento,
  fixedCosts, setFixedCosts,
  variableCosts, setVariableCosts,
  userId,
  isAutoSync, setIsAutoSync
}) => {
  const [expandedFixed, setExpandedFixed] = useState<string[]>(['PESSOAL / RH']);
  const [expandedVar, setExpandedVar] = useState<string[]>(['IMPOSTOS SOBRE VENDAS']);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<string | null>(null);

  // Inicializa a lista fixa de 26% se os dados estiverem vazios
  useEffect(() => {
    if (fixedCosts.length === 0 && faturamento > 0) {
      const initialFixed = DEFAULT_FIXED_LIST.map(item => ({
        id: item.id,
        categoria: item.categoria,
        descricao: item.descricao,
        valor: (faturamento * item.percentual_target) / 100
      }));
      setFixedCosts(initialFixed);
    }
  }, [faturamento, fixedCosts.length]);

  const fixedCategories = [
    'PESSOAL / RH', 'ESTRUTURA / OCUPAÇÃO', 'UTILIDADES', 'TECNOLOGIA / TI', 
    'SERVIÇOS TERCEIRIZADOS', 'DESPESAS ADMINISTRATIVAS', 'IMPOSTOS E TAXAS FIXAS', 
    'FINANCEIRO', 'DEPRECIAÇÃO/AMORTIZAÇÃO', 'SOLUÇÃO DE MARKETING'
  ];

  const variableCategories = [
    'IMPOSTOS SOBRE VENDAS', 'CUSTO DO PRODUTO / SERVIÇO', 'LOGÍSTICA', 
    'COMERCIAL / VENDAS', 'MEIOS DE PAGAMENTO', 'VARIÁVEL DE MARKETING', 
    'FINANCEIRO VARIÁVEL', 'OUTROS CUSTOS VARIÁVEIS'
  ];

  const totalFixed = useMemo(() => fixedCosts.reduce((acc, curr) => acc + curr.valor, 0), [fixedCosts]);
  const totalVarPerc = useMemo(() => variableCosts.reduce((acc, curr) => acc + curr.percentual, 0), [variableCosts]);
  
  const fixedPercOnFat = faturamento > 0 ? (totalFixed / faturamento) * 100 : 0;
  const totalCostPerc = fixedPercOnFat + totalVarPerc;
  
  const margemContribuicaoPerc = 100 - totalVarPerc;
  const lucroLiquidoValue = faturamento - totalFixed - ((faturamento * totalVarPerc) / 100);
  const pontoEquilibrio = (margemContribuicaoPerc > 0) ? (totalFixed / (margemContribuicaoPerc / 100)) : 0;

  const handleSaveConfig = async () => {
    if (!userId) return;
    setIsSaving(true);
    try {
      const { error } = await supabase.from('overhead_configs').upsert({
        user_id: userId,
        faturamento: Number(faturamento),
        fixed_costs: fixedCosts,
        variable_costs: variableCosts,
        is_auto_sync: !!isAutoSync
      }, { onConflict: 'user_id' });
      if (error) throw error;
      setLastSaved(new Date().toLocaleTimeString());
      alert('Sincronizado com sucesso!');
    } catch (e) { alert('Erro ao salvar'); } finally { setIsSaving(false); }
  };

  const toggleFixed = (cat: string) => setExpandedFixed(prev => prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]);
  const toggleVar = (cat: string) => setExpandedVar(prev => prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]);

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-32 animate-slide-up">
      <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 border-b border-slate-200 pb-10">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
             <div className="w-12 h-12 bg-black rounded-2xl flex items-center justify-center text-white shadow-xl shrink-0">
               <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1"/></svg>
             </div>
             <div>
               <h2 className="text-4xl font-black text-slate-900 tracking-tighter uppercase italic leading-none">Meu Overhead</h2>
               <div className="flex items-center gap-3 mt-2">
                 <button onClick={handleSaveConfig} disabled={isSaving} className="bg-emerald-500 text-white text-[9px] font-black uppercase px-4 py-2 rounded-lg transition-all shadow-lg active:scale-95 disabled:opacity-50">
                   {isSaving ? 'Gravando...' : 'Sincronizar Cloud'}
                 </button>
                 {lastSaved && <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Salvo às {lastSaved}</span>}
               </div>
             </div>
          </div>
          <div className="flex items-center gap-3 mt-4 ml-1">
             <span className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Auto Sync (Calculadora):</span>
             <button onClick={() => setIsAutoSync(!isAutoSync)} className={`px-3 py-1 rounded-full text-[8px] font-black uppercase transition-all border ${isAutoSync ? 'bg-blue-600 border-blue-600 text-white' : 'bg-slate-100 border-slate-200 text-slate-400'}`}>
                {isAutoSync ? 'ON - Inteligente' : 'OFF - Manual'}
             </button>
          </div>
        </div>
        
        <div className="flex flex-col md:flex-row gap-4">
          <div className="w-full md:w-64 bg-white p-5 rounded-[2rem] shadow-xl border border-slate-200">
            <label className="block text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Faturamento Mensal Estimado</label>
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-black text-slate-300 italic">R$</span>
              <input type="number" value={faturamento} onChange={(e) => setFaturamento(parseFloat(e.target.value) || 0)} className="w-full bg-transparent text-3xl font-black font-mono outline-none text-slate-900 tracking-tighter" />
            </div>
          </div>
          <div className="w-full md:w-64 bg-black p-5 rounded-[2rem] shadow-2xl border border-white/5 text-white">
            <label className="block text-[8px] font-black text-white/40 uppercase tracking-widest mb-1">Impacto Fixo (%)</label>
            <div className="flex items-baseline gap-2">
              <span className={`text-4xl font-black font-mono tracking-tighter ${fixedPercOnFat > 30 ? 'text-rose-500' : 'text-emerald-400'}`}>
                {fixedPercOnFat.toFixed(1)}%
              </span>
              <span className="text-[10px] font-black text-white/20 uppercase">Alvo</span>
            </div>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard label="Custos Fixos ($)" value={totalFixed} sub={`${fixedPercOnFat.toFixed(1)}% do Fat.`} color="text-slate-900" />
        <KPICard label="Margem Líquida ($)" value={lucroLiquidoValue} sub="Estimado Mensal" color={lucroLiquidoValue >= 0 ? 'text-emerald-500' : 'text-rose-500'} />
        <KPICard label="Break Even Point" value={pontoEquilibrio} sub="Meta Faturamento" color="text-amber-500" />
        <KPICard label="Custo Total Operacional" value={totalCostPerc} sub="% sobre Faturamento" color="text-blue-600" isPerc />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 items-start">
        <div className="space-y-4">
          <div className="flex items-center justify-between px-4 mb-2">
            <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em]">Estrutura Fixa (Comprometimento)</h3>
            <span className="text-[10px] font-black text-slate-900 bg-slate-100 px-3 py-1 rounded-full">{formatCurrency(totalFixed)}</span>
          </div>
          <div className="space-y-2">
            {fixedCategories.map(cat => (
              <AccordionItem key={cat} title={cat} isOpen={expandedFixed.includes(cat)} onToggle={() => toggleFixed(cat)} count={fixedCosts.filter(c => c.categoria === cat).length} summary={formatCurrency(fixedCosts.filter(c => c.categoria === cat).reduce((a, b) => a + b.valor, 0))}>
                <div className="space-y-3 p-4 bg-slate-50/50">
                  {fixedCosts.filter(c => c.categoria === cat).map(item => (
                    <div key={item.id} className="flex gap-4 items-center group">
                      <div className="flex-1"><input className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold outline-none focus:border-black transition-all" value={item.descricao} onChange={(e) => setFixedCosts(fixedCosts.map(c => c.id === item.id ? {...c, descricao: e.target.value} : c))}/></div>
                      <div className="w-32 relative"><span className="absolute left-3 top-2.5 text-[8px] font-black text-slate-300 uppercase">R$</span><input type="number" className="w-full bg-white border border-slate-200 rounded-xl pl-8 pr-4 py-2.5 text-xs font-black font-mono outline-none focus:border-black transition-all" value={item.valor} onChange={(e) => setFixedCosts(fixedCosts.map(c => c.id === item.id ? {...c, valor: parseFloat(e.target.value) || 0} : c))}/></div>
                    </div>
                  ))}
                </div>
              </AccordionItem>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between px-4 mb-2">
            <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em]">Incidência Variável</h3>
            <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-3 py-1 rounded-full">{totalVarPerc.toFixed(1)}% do Faturamento</span>
          </div>
          <div className="space-y-2">
            {variableCategories.map(cat => (
              <AccordionItem key={cat} title={cat} isOpen={expandedVar.includes(cat)} onToggle={() => toggleVar(cat)} count={variableCosts.filter(v => v.categoria === cat).length} variant="blue" summary={`${variableCosts.filter(v => v.categoria === cat).reduce((a, b) => a + b.percentual, 0).toFixed(1)}%`}>
                <div className="space-y-3 p-4 bg-blue-50/20">
                  {variableCosts.filter(v => v.categoria === cat).map(item => (
                    <div key={item.id} className="flex gap-4 items-center group">
                      <div className="flex-1"><input className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold outline-none focus:border-blue-500 transition-all" value={item.descricao} onChange={(e) => setVariableCosts(variableCosts.map(c => c.id === item.id ? {...c, descricao: e.target.value} : c))}/></div>
                      <div className="w-24 relative shrink-0"><input type="number" className="w-full bg-white border border-slate-200 rounded-xl pr-6 pl-4 py-2.5 text-xs font-black font-mono outline-none focus:border-blue-500 transition-all text-right" value={item.percentual} onChange={(e) => setVariableCosts(variableCosts.map(c => c.id === item.id ? {...c, percentual: parseFloat(e.target.value) || 0} : c))}/><span className="absolute right-3 top-2.5 text-[10px] font-black text-slate-300">%</span></div>
                    </div>
                  ))}
                </div>
              </AccordionItem>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const AccordionItem = ({ title, isOpen, onToggle, children, count, summary, variant = 'dark' }: any) => (
  <div className={`border rounded-2xl overflow-hidden transition-all ${isOpen ? 'border-slate-300 shadow-xl' : 'border-slate-100 shadow-sm'}`}>
    <button onClick={onToggle} className={`w-full flex items-center justify-between p-5 transition-colors ${isOpen ? (variant === 'dark' ? 'bg-black text-white' : 'bg-blue-600 text-white') : 'bg-white text-slate-900'}`}>
       <div className="flex items-center gap-4">
         <span className="text-[11px] font-black uppercase tracking-widest text-left">{title}</span>
         <span className={`text-[8px] font-black px-2 py-0.5 rounded ${isOpen ? 'bg-white/20' : 'bg-slate-100'}`}>{count}</span>
       </div>
       <div className="flex items-center gap-3">
         <span className={`text-[10px] font-black font-mono ${isOpen ? 'text-white/60' : 'text-slate-400'}`}>{summary}</span>
         <svg className={`w-5 h-5 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7"/></svg>
       </div>
    </button>
    <div className={`transition-all duration-300 overflow-hidden ${isOpen ? 'max-h-[2500px] opacity-100' : 'max-h-0 opacity-0'}`}>{children}</div>
  </div>
);

const KPICard = ({ label, value, sub, color, isPerc = false }: any) => (
  <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm hover:shadow-2xl transition-all overflow-hidden relative">
    <div className="relative z-10">
      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 block">{label}</span>
      <span className={`text-2xl font-black font-mono ${color || 'text-slate-800'} tracking-tighter block truncate`}>
        {isPerc ? `${value.toFixed(1)}%` : formatCurrency(value)}
      </span>
      <span className="text-[8px] font-black text-slate-400 uppercase tracking-tighter mt-4 block opacity-60 truncate">{sub}</span>
    </div>
  </div>
);

export default OverheadView;
