
import React, { useState, useMemo } from 'react';
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
}

const OverheadView: React.FC<OverheadViewProps> = ({
  faturamento, setFaturamento,
  fixedCosts, setFixedCosts,
  variableCosts, setVariableCosts,
  userId
}) => {
  const [expandedFixed, setExpandedFixed] = useState<string[]>(['PESSOAL / RH']);
  const [expandedVar, setExpandedVar] = useState<string[]>(['IMPOSTOS SOBRE VENDAS']);
  const [isSaving, setIsSaving] = useState(false);

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

  // Cálculos Financeiros
  const totalFixed = useMemo(() => fixedCosts.reduce((acc, curr) => acc + curr.valor, 0), [fixedCosts]);
  const totalVarPerc = useMemo(() => variableCosts.reduce((acc, curr) => acc + curr.percentual, 0), [variableCosts]);
  
  const totalVarValue = (faturamento * totalVarPerc) / 100;
  const fixedPercOnFat = faturamento > 0 ? (totalFixed / faturamento) * 100 : 0;
  const totalCostPerc = fixedPercOnFat + totalVarPerc;
  
  const margemContribuicaoValue = faturamento - totalVarValue;
  const margemContribuicaoPerc = faturamento > 0 ? (margemContribuicaoValue / faturamento) * 100 : 0;
  const lucroLiquido = margemContribuicaoValue - totalFixed;
  const pontoEquilibrio = margemContribuicaoPerc > 0 ? totalFixed / (margemContribuicaoPerc / 100) : 0;

  // Handler para Salvar no Supabase
  const handleSaveConfig = async () => {
    if (!userId) return;
    setIsSaving(true);
    try {
      const { error } = await supabase.from('overhead_configs').upsert({
        user_id: userId,
        faturamento,
        fixed_costs: fixedCosts,
        variable_costs: variableCosts,
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id' });

      if (error) throw error;
      alert('Configuração de Overhead salva com sucesso!');
    } catch (err: any) {
      alert('Erro ao salvar: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const toggleFixed = (cat: string) => setExpandedFixed(prev => prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]);
  const toggleVar = (cat: string) => setExpandedVar(prev => prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]);

  const addFixed = (cat: string) => setFixedCosts([...fixedCosts, { id: Math.random().toString(), categoria: cat, descricao: 'Nova Despesa', valor: 0 }]);
  const addVar = (cat: string) => setVariableCosts([...variableCosts, { id: Math.random().toString(), categoria: cat, descricao: 'Novo Custo', percentual: 0 }]);

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-32 animate-slide-up">
      <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 border-b border-slate-200 pb-10">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
             <div className="w-12 h-12 bg-black rounded-2xl flex items-center justify-center text-white shadow-xl shrink-0">
               <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
             </div>
             <div>
               <h2 className="text-4xl font-black text-slate-900 tracking-tighter uppercase italic">Controlador de Overhead</h2>
               <button 
                onClick={handleSaveConfig}
                disabled={isSaving}
                className="mt-2 bg-emerald-500 hover:bg-emerald-600 text-white text-[9px] font-black uppercase px-4 py-2 rounded-lg transition-all shadow-lg active:scale-95 disabled:opacity-50"
               >
                 {isSaving ? 'Gravando...' : 'Salvar Configuração'}
               </button>
             </div>
          </div>
          <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px] ml-1">Análise Determinística de Custo Total & Break-even</p>
        </div>
        
        <div className="flex flex-col md:flex-row gap-4">
          <div className="w-full md:w-64 bg-white p-5 rounded-[2rem] shadow-xl border border-slate-200 group focus-within:border-black transition-all">
            <label className="block text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1 group-focus-within:text-black transition-colors">Faturamento Estimado</label>
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-black text-slate-300 italic">R$</span>
              <input 
                type="number" 
                value={faturamento} 
                onChange={(e) => setFaturamento(parseFloat(e.target.value) || 0)}
                className="w-full bg-transparent text-3xl font-black font-mono outline-none text-slate-900 tracking-tighter"
              />
            </div>
          </div>

          <div className="w-full md:w-64 bg-black p-5 rounded-[2rem] shadow-2xl shadow-black/20 border border-white/5 text-white">
            <label className="block text-[8px] font-black text-white/40 uppercase tracking-widest mb-1">Custo Total %</label>
            <div className="flex items-baseline gap-2">
              <span className={`text-4xl font-black font-mono tracking-tighter ${totalCostPerc > 100 ? 'text-rose-500' : 'text-emerald-400'}`}>
                {totalCostPerc.toFixed(1)}%
              </span>
              <span className="text-[10px] font-black text-white/20 uppercase">Peso Total</span>
            </div>
          </div>
        </div>
      </header>

      {/* Financial Health Dashboard */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard label="Custos Fixos ($)" value={totalFixed} sub={`${fixedPercOnFat.toFixed(1)}% do Fat.`} color="text-slate-900" />
        <KPICard label="Margem de Contribuição" value={margemContribuicaoValue} sub={`${margemContribuicaoPerc.toFixed(1)}% de Sobra`} color="text-blue-600" />
        <KPICard label="Resultado Operacional" value={lucroLiquido} sub={`${((lucroLiquido/faturamento)*100).toFixed(1)}% Margem Líquida`} color={lucroLiquido >= 0 ? 'text-emerald-500' : 'text-rose-500'} />
        <KPICard label="Ponto de Equilíbrio" value={pontoEquilibrio} sub="Meta de Faturamento" color="text-amber-500" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 items-start">
        {/* COLUNA: DESPESAS FIXAS */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-4 mb-2">
            <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em]">Estrutura Fixa</h3>
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
                      <button onClick={() => setFixedCosts(fixedCosts.filter(c => c.id !== item.id))} className="text-slate-300 hover:text-rose-500 transition-colors"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg></button>
                    </div>
                  ))}
                  <button onClick={() => addFixed(cat)} className="w-full py-2 border-2 border-dashed border-slate-200 rounded-xl text-[9px] font-black uppercase text-slate-400 hover:border-black hover:text-black transition-all">+ Adicionar Item</button>
                </div>
              </AccordionItem>
            ))}
          </div>
        </div>

        {/* COLUNA: DESPESAS VARIÁVEIS */}
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
                      <div className="w-32 bg-slate-100/50 rounded-xl px-4 py-2.5 flex items-center justify-end shrink-0 border border-transparent"><span className="text-[10px] font-black font-mono text-slate-400">{formatCurrency((faturamento * item.percentual) / 100)}</span></div>
                      <button onClick={() => setVariableCosts(variableCosts.filter(c => c.id !== item.id))} className="text-slate-300 hover:text-rose-500 transition-colors"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg></button>
                    </div>
                  ))}
                  <button onClick={() => addVar(cat)} className="w-full py-2 border-2 border-dashed border-blue-100 rounded-xl text-[9px] font-black uppercase text-blue-300 hover:border-blue-500 hover:text-blue-500 transition-all">+ Adicionar Item</button>
                </div>
              </AccordionItem>
            ))}
          </div>
        </div>
      </div>

      <section className="bg-black rounded-[3rem] p-10 md:p-16 text-white shadow-2xl relative overflow-hidden ring-1 ring-white/10">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[120px] -mr-64 -mt-64"></div>
        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6"><h3 className="text-3xl md:text-5xl font-black italic tracking-tighter uppercase leading-none">Análise de<br/>Sobrevivência</h3><p className="text-white/40 text-lg font-medium leading-relaxed max-w-md">Sua estrutura fixa de <span className="text-white font-bold">{formatCurrency(totalFixed)}</span> consome <span className="text-amber-400 font-bold">{fixedPercOnFat.toFixed(1)}%</span> do seu faturamento atual. O ponto crítico de equilíbrio é:</p></div>
          <div className="bg-white/5 border border-white/10 p-10 rounded-[2.5rem] backdrop-blur-xl text-center lg:text-right"><span className="text-[11px] font-black uppercase tracking-[0.4em] text-white/30">Volume Mínimo Mensal</span><div className="text-5xl md:text-7xl font-black font-mono tracking-tighter mt-4 text-amber-400">{formatCurrency(pontoEquilibrio)}</div><div className="mt-6 flex justify-center lg:justify-end gap-2"><div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${lucroLiquido >= 0 ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border-rose-500/20'}`}>{lucroLiquido >= 0 ? 'Operação Rentável' : 'Operação Deficitária'}</div></div></div>
        </div>
      </section>
    </div>
  );
};

const AccordionItem = ({ title, isOpen, onToggle, children, count, summary, variant = 'dark' }: any) => (
  <div className={`border rounded-2xl overflow-hidden transition-all ${isOpen ? 'border-slate-300 shadow-xl' : 'border-slate-100 hover:border-slate-200 shadow-sm'}`}>
    <button onClick={onToggle} className={`w-full flex items-center justify-between p-5 transition-colors ${isOpen ? (variant === 'dark' ? 'bg-black text-white' : 'bg-blue-600 text-white') : 'bg-white text-slate-900'}`}><div className="flex items-center gap-4"><div className={`w-2 h-2 rounded-full ${isOpen ? 'bg-white animate-pulse' : (variant === 'dark' ? 'bg-black' : 'bg-blue-600')}`}></div><span className="text-[11px] font-black uppercase tracking-widest text-left">{title}</span><span className={`text-[8px] font-black px-2 py-0.5 rounded ${isOpen ? 'bg-white/20' : 'bg-slate-100'}`}>{count}</span></div><div className="flex items-center gap-3"><span className={`text-[10px] font-black font-mono ${isOpen ? 'text-white/60' : 'text-slate-400'}`}>{summary}</span><svg className={`w-5 h-5 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7"/></svg></div></button>
    <div className={`transition-all duration-300 overflow-hidden ${isOpen ? 'max-h-[2500px] opacity-100' : 'max-h-0 opacity-0'}`}>{children}</div>
  </div>
);

const KPICard = ({ label, value, sub, color }: any) => (
  <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm hover:shadow-2xl transition-all group overflow-hidden relative"><div className="relative z-10"><span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 block group-hover:text-black transition-colors">{label}</span><span className={`text-2xl font-black font-mono ${color || 'text-slate-800'} tracking-tighter block truncate`}>{formatCurrency(value)}</span><span className="text-[8px] font-black text-slate-400 uppercase tracking-tighter mt-4 block opacity-60 truncate">{sub}</span></div><div className="absolute -bottom-4 -right-4 w-16 h-16 bg-slate-50 rounded-full group-hover:scale-[3] transition-transform duration-700 pointer-events-none"></div></div>
);

export default OverheadView;
