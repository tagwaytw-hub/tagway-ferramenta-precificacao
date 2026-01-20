
import React, { useState, useMemo, useEffect } from 'react';
import { CostItem, VariableCostItem } from '../types';
import { formatCurrency } from '../utils/calculations';
import { supabase } from '../lib/supabase';

interface OverheadViewProps {
  faturamento: number;
  setFaturamento: (val: number) => void;
  fixedCosts: CostItem[];
  setFixedCosts: React.Dispatch<React.SetStateAction<CostItem[]>>;
  variableCosts: VariableCostItem[];
  setVariableCosts: React.Dispatch<React.SetStateAction<VariableCostItem[]>>;
  userId?: string;
  isAutoSync: boolean;
  setIsAutoSync: (val: boolean) => void;
}

const INITIAL_FIXED_LIST = [
  { cat: '1. PESSOAL / RH', items: ['Salários administrativos', 'Pró-labore dos sócios', 'Encargos trabalhistas (INSS, FGTS)', 'Férias (provisão mensal)', '13º salário (provisão mensal)', 'Benefícios seguros', 'Vale-transporte', 'Vale-refeição / alimentação', 'Plano de saúde', 'Seguro de vida'] },
  { cat: '2. ESTRUTURA / OCUPAÇÃO', items: ['Aluguel do imóvel', 'Condomínio', 'IPTU (taxa mensal)', 'Seguro predial', 'Limpeza', 'Manutenção predial', 'Portaria / vigilância'] },
  { cat: '3. UTILIDADES', items: ['Energia elétrica', 'Água e esgoto', 'Internet', 'Telefonia fixa', 'Telefonia móvel'] },
  { cat: '4. TECNOLOGIA / TI', items: ['Sistema ERP', 'Sistema contábil', 'CRM', 'Softwares de precificação', 'Licenças de software', 'Hospedagem de site', 'Manutenção de TI'] },
  { cat: '5. SERVIÇOS TERCEIRIZADOS', items: ['Contabilidade', 'Assessoria Jurídica', 'Consultoria financeira', 'Marketing (contrato mensal)'] },
  { cat: '6. DESPESAS ADMINISTRATIVAS', items: ['Material de escritório', 'Correios', 'Assinaturas empresariais', 'Despesas gerais fixas'] },
  { cat: '7. IMPOSTOS E TAXAS FIXAS', items: ['DAS mínimo', 'Alvará de funcionamento', 'Taxas ambientais', 'Conselhos de classe'] },
  { cat: '8. FINANCEIRO', items: ['Parcelas de empréstimos', 'Juros bancários fixos', 'Locação de equipamentos'] },
  { cat: '9. DEPRECIAÇÃO/AMORTIZAÇÃO', items: ['Depreciação de máquinas', 'Depreciação de veículos', 'Depreciação de computadores'] },
  { cat: '10. SOLUÇÃO DE MARKETING', items: ['Ferramentas de marketing', 'Produção de conteúdo', 'Assinaturas de image'] }
];

const INITIAL_VARIABLE_LIST = [
  { cat: '11. IMPOSTOS SOBRE VENDAS', items: ['Simples Nacional (% faturamento)', 'ICMS', 'ISS', 'PIS', 'COFINS'] },
  { cat: '12. CUSTO DO PRODUTO / SERVIÇO', items: ['CMV (Custo Mercadoria)', 'Matéria-prima', 'Insumos de produção'] },
  { cat: '13. LOGÍSTICA', items: ['Frete sobre vendas', 'Correios/Envio', 'Embalagens'] },
  { cat: '14. COMERCIAL / VENDAS', items: ['Comissão de vendedores', 'Bonificações', 'Premiações'] },
  { cat: '15. MEIOS DE PAGAMENTO', items: ['Taxa de Cartão Crédito', 'Taxa de Débito', 'Gateway de Pagamento'] },
  { cat: '16. VARIÁVEL DE MARKETING', items: ['Tráfego pago (Google/Meta)', 'Campanhas sazonais', 'Influenciadores'] },
  { cat: '17. FINANCEIRO VARIÁVEL', items: ['Multas e Juros atraso', 'Descontos concedidos', 'Estornos'] },
  { cat: '18. OUTROS CUSTOS VARIÁVEIS', items: ['Royalties', 'Comissões de marketplaces', 'Custos por projeto'] }
];

const OverheadView: React.FC<OverheadViewProps> = ({
  faturamento, setFaturamento,
  fixedCosts, setFixedCosts,
  variableCosts, setVariableCosts,
  userId,
  isAutoSync, setIsAutoSync
}) => {
  const [expanded, setExpanded] = useState<string[]>(['1. PESSOAL / RH', '11. IMPOSTOS SOBRE VENDAS']);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (fixedCosts.length === 0 && variableCosts.length === 0) {
      setFaturamento(100000); 

      const allFixed: CostItem[] = [];
      INITIAL_FIXED_LIST.forEach(group => {
        group.items.forEach(desc => {
          let val = 0;
          if (desc === 'Salários administrativos') val = 8000;
          if (desc === 'Pró-labore dos sócios') val = 4500;
          if (desc === 'Aluguel do imóvel') val = 2000;
          if (desc === 'Sistema ERP') val = 500;
          
          allFixed.push({ id: Math.random().toString(36).substr(2, 9), categoria: group.cat, descricao: desc, valor: val });
        });
      });

      const allVar: VariableCostItem[] = [];
      INITIAL_VARIABLE_LIST.forEach(group => {
        group.items.forEach(desc => {
          let perc = 0;
          if (desc === 'Simples Nacional (% faturamento)') perc = 4.5;
          if (desc === 'Taxa de Cartão Crédito') perc = 2.0;
          if (desc === 'Frete sobre vendas') perc = 1.5;

          allVar.push({ id: Math.random().toString(36).substr(2, 9), categoria: group.cat, descricao: desc, percentual: perc });
        });
      });

      setFixedCosts(allFixed);
      setVariableCosts(allVar);
    }
  }, []);

  const totalFixed = useMemo(() => fixedCosts.reduce((acc, curr) => acc + curr.valor, 0), [fixedCosts]);
  const totalVar = useMemo(() => variableCosts.reduce((acc, curr) => acc + curr.percentual, 0), [variableCosts]);
  const fixedPercTotal = faturamento > 0 ? (totalFixed / faturamento) * 100 : 0;
  const markupTotal = fixedPercTotal + totalVar;

  const toggleSection = (cat: string) => setExpanded(prev => prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]);

  const handleSave = async () => {
    if (!userId) return;
    setIsSaving(true);
    try {
      await supabase.from('overhead_configs').upsert({
        user_id: userId, faturamento, fixed_costs: fixedCosts, variable_costs: variableCosts, is_auto_sync: isAutoSync
      }, { onConflict: 'user_id' });
      alert('Configuração salva com sucesso!');
    } catch (e) { alert('Erro ao salvar'); } finally { setIsSaving(false); }
  };

  const updateFixed = (id: string, updates: Partial<CostItem>) => {
    setFixedCosts(prev => prev.map(f => f.id === id ? { ...f, ...updates } : f));
  };

  const updateVariable = (id: string, updates: Partial<VariableCostItem>) => {
    setVariableCosts(prev => prev.map(v => v.id === id ? { ...v, ...updates } : v));
  };

  const valToPerc = (val: number) => faturamento > 0 ? (val / faturamento) * 100 : 0;
  const percToVal = (perc: number) => (faturamento * perc) / 100;

  const fixedCategories = useMemo(() => 
    Array.from(new Set(fixedCosts.map(f => f.categoria)))
      .sort((a: string, b: string) => a.localeCompare(b, undefined, { numeric: true })), 
    [fixedCosts]
  );

  const variableCategories = useMemo(() => 
    Array.from(new Set(variableCosts.map(v => v.categoria)))
      .sort((a: string, b: string) => a.localeCompare(b, undefined, { numeric: true })), 
    [variableCosts]
  );

  return (
    <div className="max-w-[1600px] mx-auto space-y-10 pb-40 animate-slide-up">
      <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 border-b border-slate-200 pb-10">
        <div className="space-y-4">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 bg-black rounded-[2rem] flex items-center justify-center text-white shadow-2xl">
              <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 17v-2m3 2v-4m3 2v-6m-8-2h8a2 2 0 012 2v9a2 2 0 01-2 2H7a2 2 0 01-2-2V5a2 2 0 012-2z"/></svg>
            </div>
            <div>
              <h2 className="text-5xl font-black text-slate-900 tracking-tighter uppercase italic leading-none">Estrutura de Custos</h2>
              <div className="flex items-center gap-4 mt-3">
                <button onClick={handleSave} disabled={isSaving} className="bg-emerald-600 text-white text-[10px] font-black uppercase px-6 py-2.5 rounded-xl shadow-lg active:scale-95 disabled:opacity-50 transition-all">
                  {isSaving ? 'Gravando...' : 'Backup na Nuvem'}
                </button>
                <div className="flex items-center gap-3 bg-slate-100 px-4 py-2 rounded-xl border border-slate-200">
                   <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Sincronizar Calculadora:</span>
                   <button onClick={() => setIsAutoSync(!isAutoSync)} className={`text-[9px] font-black uppercase px-3 py-1 rounded-lg transition-all ${isAutoSync ? 'bg-blue-600 text-white shadow-md' : 'bg-slate-300 text-slate-600'}`}>
                      {isAutoSync ? 'Ligado' : 'Desligado'}
                   </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-6">
          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-xl w-80">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Faturamento Base (100%)</label>
            <div className="flex items-baseline gap-3">
              <span className="text-2xl font-black text-slate-300 italic">R$</span>
              <input type="number" value={faturamento || ''} onChange={(e) => setFaturamento(parseFloat(e.target.value) || 0)} className="w-full bg-transparent text-4xl font-black font-mono outline-none text-slate-900 tracking-tighter" />
            </div>
          </div>
          <div className="bg-slate-900 p-8 rounded-[2.5rem] shadow-2xl w-80 text-white border-t-4 border-emerald-500">
            <label className="text-[10px] font-black text-white/40 uppercase tracking-widest block mb-2">Markup Total (Geral)</label>
            <div className="flex items-baseline gap-3">
              <span className="text-5xl font-black font-mono text-emerald-400 tracking-tighter">{markupTotal.toFixed(2)}%</span>
            </div>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-12">
        <div className="space-y-6">
          <div className="flex items-center justify-between px-6">
             <h3 className="text-[12px] font-black text-slate-900 uppercase tracking-[0.4em]">Despesas Fixas</h3>
             <span className="text-[10px] font-black text-slate-400 uppercase">Total: {formatCurrency(totalFixed)}</span>
          </div>
          <div className="space-y-4">
            {fixedCategories.map(catName => {
              const items = fixedCosts.filter(f => f.categoria === catName);
              const totalCat = items.reduce((a, b) => a + b.valor, 0);
              const isOpen = expanded.includes(catName);
              return (
                <AccordionSection key={catName} title={catName} isOpen={isOpen} onToggle={() => toggleSection(catName)} totalLabel={`${formatCurrency(totalCat)} (${valToPerc(totalCat).toFixed(2)}%)`} count={items.length}>
                  <div className="space-y-4 p-8 bg-slate-50/30">
                    <div className="hidden lg:grid grid-cols-12 gap-4 px-2 mb-2">
                      <div className="col-span-5 text-[9px] font-black text-slate-400 uppercase">Descrição</div>
                      <div className="col-span-4 text-[9px] font-black text-slate-400 uppercase">Valor Real (R$)</div>
                      <div className="col-span-3 text-[9px] font-black text-slate-400 uppercase text-right">Percentual (%)</div>
                    </div>
                    {items.map(item => (
                      <div key={item.id} className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center bg-white p-5 rounded-[1.5rem] shadow-sm border border-slate-100 group hover:border-black transition-all">
                        <div className="col-span-1 lg:col-span-5">
                           <input className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:border-black" value={item.descricao} onChange={(e) => updateFixed(item.id, { descricao: e.target.value })} />
                        </div>
                        <div className="col-span-1 lg:col-span-4 relative">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-300">R$</span>
                          <input 
                            type="number" 
                            step="0.01"
                            placeholder="0,00"
                            className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-3 text-lg font-black font-mono outline-none focus:border-black" 
                            value={item.valor === 0 ? '' : item.valor} 
                            onChange={(e) => {
                               const v = e.target.value === '' ? 0 : parseFloat(e.target.value);
                               updateFixed(item.id, { valor: v });
                            }} 
                          />
                        </div>
                        <div className="col-span-1 lg:col-span-2 relative text-right">
                          <input 
                            type="number" 
                            step="0.01"
                            className="w-full bg-slate-100 border border-slate-200 rounded-xl px-4 py-3 text-sm font-black font-mono outline-none text-right pr-8" 
                            value={valToPerc(item.valor).toFixed(2)} 
                            onChange={(e) => {
                               const p = e.target.value === '' ? 0 : parseFloat(e.target.value);
                               updateFixed(item.id, { valor: percToVal(p) });
                            }}
                          />
                          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[12px] font-black text-slate-300">%</span>
                        </div>
                        <div className="col-span-1 flex justify-end">
                          <button onClick={() => setFixedCosts(prev => prev.filter(f => f.id !== item.id))} className="text-slate-200 hover:text-rose-500 transition-colors p-2"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg></button>
                        </div>
                      </div>
                    ))}
                    <button onClick={() => setFixedCosts(prev => [...prev, { id: Math.random().toString(36).substr(2, 9), categoria: catName, descricao: 'Novo Item', valor: 0 }])} className="w-full py-4 border-2 border-dashed border-slate-200 rounded-2xl text-[10px] font-black text-slate-400 uppercase tracking-widest hover:border-slate-400 hover:text-slate-600 transition-all">+ Adicionar Item em {catName}</button>
                  </div>
                </AccordionSection>
              );
            })}
          </div>
        </div>

        <div className="space-y-6">
          <div className="flex items-center justify-between px-6">
             <h3 className="text-[12px] font-black text-blue-600 uppercase tracking-[0.4em]">Despesas Variáveis</h3>
             <span className="text-[10px] font-black text-slate-400 uppercase">Peso Total: {totalVar.toFixed(2)}%</span>
          </div>
          <div className="space-y-4">
            {variableCategories.map(catName => {
              const items = variableCosts.filter(v => v.categoria === catName);
              const totalPerc = items.reduce((a, b) => a + b.percentual, 0);
              const isOpen = expanded.includes(catName);
              return (
                <AccordionSection key={catName} title={catName} isOpen={isOpen} onToggle={() => toggleSection(catName)} totalLabel={`${totalPerc.toFixed(2)}% (${formatCurrency(percToVal(totalPerc))})`} count={items.length} variant="blue">
                  <div className="space-y-4 p-8 bg-blue-50/10">
                    <div className="hidden lg:grid grid-cols-12 gap-4 px-2 mb-2">
                      <div className="col-span-5 text-[9px] font-black text-blue-400 uppercase">Descrição</div>
                      <div className="col-span-4 text-[9px] font-black text-blue-400 uppercase">Peso (%)</div>
                      <div className="col-span-3 text-[9px] font-black text-blue-400 uppercase text-right">Valor Estimado (R$)</div>
                    </div>
                    {items.map(item => (
                      <div key={item.id} className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center bg-white p-5 rounded-[1.5rem] shadow-sm border border-blue-50 group hover:border-blue-500 transition-all">
                        <div className="col-span-1 lg:col-span-5">
                          <input className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:border-blue-500" value={item.descricao} onChange={(e) => updateVariable(item.id, { descricao: e.target.value })} />
                        </div>
                        <div className="col-span-1 lg:col-span-4 relative">
                          <input 
                            type="number" 
                            step="0.01"
                            placeholder="0,00"
                            className="w-full bg-blue-50/20 border border-slate-200 rounded-xl pl-4 pr-10 py-3 text-lg font-black font-mono outline-none focus:border-blue-500 text-right" 
                            value={item.percentual === 0 ? '' : item.percentual} 
                            onChange={(e) => {
                               const p = e.target.value === '' ? 0 : parseFloat(e.target.value);
                               updateVariable(item.id, { percentual: p });
                            }}
                          />
                          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[12px] font-black text-blue-300">%</span>
                        </div>
                        <div className="col-span-1 lg:col-span-2 relative">
                           <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-300">R$</span>
                           <input 
                             type="number" 
                             step="0.01"
                             placeholder="0,00"
                             className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-3 text-sm font-black font-mono outline-none focus:border-blue-500" 
                             value={percToVal(item.percentual).toFixed(2)} 
                             onChange={(e) => {
                               const v = e.target.value === '' ? 0 : parseFloat(e.target.value);
                               updateVariable(item.id, { percentual: valToPerc(v) });
                             }} 
                           />
                        </div>
                        <div className="col-span-1 flex justify-end">
                          <button onClick={() => setVariableCosts(prev => prev.filter(v => v.id !== item.id))} className="text-slate-200 hover:text-rose-500 transition-colors p-2"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg></button>
                        </div>
                      </div>
                    ))}
                    <button onClick={() => setVariableCosts(prev => [...prev, { id: Math.random().toString(36).substr(2, 9), categoria: catName, descricao: 'Novo Item', percentual: 0 }])} className="w-full py-4 border-2 border-dashed border-blue-100 rounded-2xl text-[10px] font-black text-blue-400 uppercase tracking-widest hover:border-blue-300 hover:text-blue-600 transition-all">+ Adicionar Item em {catName}</button>
                  </div>
                </AccordionSection>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

const AccordionSection = ({ title, isOpen, onToggle, children, totalLabel, count, variant = 'dark' }: any) => (
  <div className={`border rounded-[2.5rem] overflow-hidden transition-all duration-300 ${isOpen ? 'border-slate-300 shadow-2xl scale-[1.01]' : 'border-slate-100 shadow-sm'}`}>
    <button onClick={onToggle} className={`w-full flex items-center justify-between p-7 text-left transition-colors ${isOpen ? (variant === 'dark' ? 'bg-slate-900 text-white' : 'bg-blue-600 text-white') : 'bg-white text-slate-900 hover:bg-slate-50'}`}>
       <div className="flex items-center gap-6">
         <div className="space-y-1">
           <span className="text-[11px] font-black uppercase tracking-widest leading-none">{title}</span>
           <div className={`text-[8px] font-black px-2 py-0.5 rounded uppercase w-fit ${isOpen ? 'bg-white/10' : 'bg-slate-100 text-slate-400'}`}>{count} Itens Ativos</div>
         </div>
       </div>
       <div className="flex items-center gap-8">
         <span className={`text-[11px] font-black font-mono ${isOpen ? (variant === 'dark' ? 'text-emerald-400' : 'text-white') : 'text-slate-500'}`}>{totalLabel}</span>
         <svg className={`w-6 h-6 transition-transform duration-500 ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7"/></svg>
       </div>
    </button>
    <div className={`transition-all duration-500 overflow-hidden ${isOpen ? 'max-h-[5000px] opacity-100' : 'max-h-0 opacity-0'}`}>{children}</div>
  </div>
);

export default OverheadView;
