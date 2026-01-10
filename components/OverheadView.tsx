
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

const INITIAL_FIXED_LIST = [
  { cat: '1. PESSOAL / RH', items: ['Salários administrativos', 'Pró-labore dos sócios', 'Encargos trabalhistas (INSS, FGTS)', 'Férias (provisão mensal)', '13º salário (provisão mensal)', 'Benefícios seguros', 'Vale-transporte', 'Vale-refeição / alimentação', 'Plano de acompanhamento', 'Seguro de vida'] },
  { cat: '2. ESTRUTURA / OCUPAÇÃO', items: ['Aluguel do objeto', 'Condomínio', 'IPTU (taxa mensal)', 'Seguro predial', 'Limpeza talada', 'Manutenção predial', 'Portaria / vigilância', 'Impostos importantes'] },
  { cat: '3. UTILIDADES', items: ['Energia elétrica (custo mínimo)', 'Água e esgoto', 'Internet', 'Telefonia fixa', 'Telefonia móvel', 'Link dedicado'] },
  { cat: '4. TECNOLOGIA / TI', items: ['Sistema ERP', 'Sistema contabil', 'CRM', 'Softwares de precificação', 'Licenças de software (Microsoft, Adobe, etc.)', 'Hospedagem de site', 'Domínio', 'Manutenção de TI', 'ré técnico'] },
  { cat: '5. SERVIÇOS TERCEIRIZADOS', items: ['Contabilidade', 'Assessoria Jurídica (mensalidade)', 'Consultoria financeira', 'RH pertencente', 'Marketing (contrato mensal)', 'Agência decus', 'Auditório recorrente'] },
  { cat: '6. DESPESAS ADMINISTRATIVAS', items: ['Material de escritório', 'Papelaria', 'Correios', 'Mensageiro', 'digital', 'Despesas guilhotinas fixas', 'Assinaturas empresariais'] },
  { cat: '7. IMPOSTOS E TAXAS FIXAS', items: ['DAS mínimo (Simples Nacional)', 'Álvará de funcionamento', 'Licenças municipais e estaduais', 'Taxas ambientais', 'Conselhos de classe (CRC, CREA, etc.)'] },
  { cat: '8. FINANCEIRO', items: ['Parcelas de empréstimos', 'Juross', 'Locação de equipamentos', 'Aluguel de máquinas', 'Consórcios empresariais'] },
  { cat: '9. DEPRECIAÇÃO/AMORTIZAÇÃO', items: ['Depreciação de máquinas', 'Depreciação de veículos', 'Depreciação de computadores', 'Depreciação de móveis', 'Amortização de softwares', 'Amortização de marcas e patentes'] },
  { cat: '10. SOLUÇÃO DE MARKETING', items: ['Mensalidade de seis', 'Ferramentas de marketing', 'Plataformas de guerrilha', 'Produção recorrente de conteúdo', 'Assinaturas de bancos de imagem'] }
];

const INITIAL_VARIABLE_LIST = [
  { cat: '11. IMPOSTOS SOBRE VENDAS', items: ['Simples Nacional (% sobre faturamento)', 'ICMS', 'ISS', 'PIS', 'COFINS'] },
  { cat: '12. CUSTO DO PRODUTO / SERVIÇO', items: ['Custo da Mercadoria Vendida (CMV)', 'Matéria-prima', 'Insumos de produção', 'Terceirização por demanda'] },
  { cat: '13. LOGÍSTICA', items: ['Frete sobre vendas', 'Correios', 'Transportadora', 'Embalagens', 'Armazenagem por volume'] },
  { cat: '14. COMERCIAL / VENDAS', items: ['Comissão de tí', 'Bonfe por meta', 'Premiações por desempenho'] },
  { cat: '15. MEIOS DE PAGAMENTO', items: ['Taxa de recrutamento de crédito', 'Taxa de concepção de débito', 'Taxa de gateway de pagamento', 'Taxa de mercado'] },
  { cat: '16. VARIÁVEL DE MARKETING', items: ['Tráfego pago (Google Ads, Meta Ads)', 'Campanhas promocionais', 'Influenciadores'] },
  { cat: '17. FINANCEIRO VARIÁVEL', items: ['Juros por atraso', 'Multas bibliotecas', 'Descontos concedidos', 'Estorno'] },
  { cat: '18. OUTROS CUSTOS VARIÁVEIS', items: ['Royalties', 'Impostos por transação', 'Comissões de parceiros', 'Custos por projeto'] }
];

const OverheadView: React.FC<OverheadViewProps> = ({
  faturamento, setFaturamento,
  fixedCosts, setFixedCosts,
  variableCosts, setVariableCosts,
  userId,
  isAutoSync, setIsAutoSync
}) => {
  const [expanded, setExpanded] = useState<string[]>(['1. PESSOAL / RH']);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (fixedCosts.length === 0) {
      const allFixed: CostItem[] = [];
      INITIAL_FIXED_LIST.forEach(group => group.items.forEach(desc => {
        allFixed.push({ id: Math.random().toString(36).substr(2, 9), categoria: group.cat, descricao: desc, valor: 0 });
      }));
      setFixedCosts(allFixed);
    }
    if (variableCosts.length === 0) {
      const allVar: VariableCostItem[] = [];
      INITIAL_VARIABLE_LIST.forEach(group => group.items.forEach(desc => {
        allVar.push({ id: Math.random().toString(36).substr(2, 9), categoria: group.cat, descricao: desc, percentual: 0 });
      }));
      setVariableCosts(allVar);
    }
  }, []);

  const totalFixed = useMemo(() => fixedCosts.reduce((acc, curr) => acc + curr.valor, 0), [fixedCosts]);
  const totalVar = useMemo(() => variableCosts.reduce((acc, curr) => acc + curr.percentual, 0), [variableCosts]);
  const fixedPerc = faturamento > 0 ? (totalFixed / faturamento) * 100 : 0;

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

  return (
    <div className="max-w-6xl mx-auto space-y-10 pb-40 animate-slide-up">
      <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 border-b border-slate-200 pb-10">
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-black rounded-[1.5rem] flex items-center justify-center text-white shadow-2xl">
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 17v-2m3 2v-4m3 2v-6m-8-2h8a2 2 0 012 2v9a2 2 0 01-2 2H7a2 2 0 01-2-2V5a2 2 0 012-2z"/></svg>
            </div>
            <div>
              <h2 className="text-4xl font-black text-slate-900 tracking-tighter uppercase italic leading-none">Estrutura de Custos</h2>
              <div className="flex items-center gap-3 mt-2">
                <button onClick={handleSave} disabled={isSaving} className="bg-emerald-500 text-white text-[9px] font-black uppercase px-4 py-2 rounded-lg shadow-lg active:scale-95 disabled:opacity-50 transition-all">
                  {isSaving ? 'Salvando...' : 'Backup na Nuvem'}
                </button>
                <div className="flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
                   <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Sincronizar Calculadora:</span>
                   <button onClick={() => setIsAutoSync(!isAutoSync)} className={`text-[8px] font-black uppercase px-2 py-0.5 rounded transition-all ${isAutoSync ? 'bg-blue-600 text-white shadow-md' : 'bg-slate-300 text-slate-600'}`}>
                      {isAutoSync ? 'Ligado' : 'Desligado'}
                   </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-4">
          <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-xl w-64">
            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Faturamento Ref.</label>
            <div className="flex items-baseline gap-2">
              <span className="text-lg font-black text-slate-300 italic">R$</span>
              <input type="number" value={faturamento} onChange={(e) => setFaturamento(parseFloat(e.target.value) || 0)} className="w-full bg-transparent text-3xl font-black font-mono outline-none text-slate-900 tracking-tighter" />
            </div>
          </div>
          <div className="bg-slate-900 p-6 rounded-[2rem] shadow-2xl w-64 text-white">
            <label className="text-[9px] font-black text-white/40 uppercase tracking-widest block mb-1">Peso Total (Markup)</label>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-black font-mono text-emerald-400">{(fixedPerc + totalVar).toFixed(2)}%</span>
            </div>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-10">
        <div className="space-y-4">
          <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] px-4">Despesas Fixas (R$)</h3>
          <div className="space-y-3">
            {INITIAL_FIXED_LIST.map(group => {
              const items = fixedCosts.filter(f => f.categoria === group.cat);
              const total = items.reduce((a, b) => a + b.valor, 0);
              const isOpen = expanded.includes(group.cat);
              return (
                <AccordionSection key={group.cat} title={group.cat} isOpen={isOpen} onToggle={() => toggleSection(group.cat)} totalLabel={formatCurrency(total)} count={items.length}>
                  <div className="space-y-3 p-6 bg-slate-50/50">
                    {items.map(item => (
                      <div key={item.id} className="flex gap-4 items-center animate-slide-up">
                        <input className="flex-1 bg-white border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold outline-none focus:border-black transition-all" value={item.descricao} onChange={(e) => setFixedCosts(fixedCosts.map(f => f.id === item.id ? {...f, descricao: e.target.value} : f))} />
                        <div className="w-36 relative">
                          <span className="absolute left-3 top-3.5 text-[9px] font-black text-slate-300">R$</span>
                          <input type="number" className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-4 py-3 text-xs font-black font-mono outline-none focus:border-black" value={item.valor} onChange={(e) => setFixedCosts(fixedCosts.map(f => f.id === item.id ? {...f, valor: parseFloat(e.target.value) || 0} : f))} />
                        </div>
                        <button onClick={() => setFixedCosts(fixedCosts.filter(f => f.id !== item.id))} className="p-3 text-slate-300 hover:text-rose-500 transition-colors"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg></button>
                      </div>
                    ))}
                    <button onClick={() => setFixedCosts([...fixedCosts, { id: Math.random().toString(36).substr(2, 9), categoria: group.cat, descricao: 'Novo Item', valor: 0 }])} className="w-full py-3 border-2 border-dashed border-slate-200 rounded-xl text-[9px] font-black text-slate-400 uppercase tracking-widest hover:border-slate-400 transition-all">+ Adicionar</button>
                  </div>
                </AccordionSection>
              );
            })}
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] px-4">Despesas Variáveis (%)</h3>
          <div className="space-y-3">
            {INITIAL_VARIABLE_LIST.map(group => {
              const items = variableCosts.filter(v => v.categoria === group.cat);
              const total = items.reduce((a, b) => a + b.percentual, 0);
              const isOpen = expanded.includes(group.cat);
              return (
                <AccordionSection key={group.cat} title={group.cat} isOpen={isOpen} onToggle={() => toggleSection(group.cat)} totalLabel={`${total.toFixed(2)}%`} count={items.length} variant="blue">
                  <div className="space-y-3 p-6 bg-blue-50/20">
                    {items.map(item => (
                      <div key={item.id} className="flex gap-4 items-center animate-slide-up">
                        <input className="flex-1 bg-white border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold outline-none focus:border-blue-500 transition-all" value={item.descricao} onChange={(e) => setVariableCosts(variableCosts.map(v => v.id === item.id ? {...v, descricao: e.target.value} : v))} />
                        <div className="w-24 relative">
                          <input type="number" className="w-full bg-white border border-slate-200 rounded-xl pr-7 pl-4 py-3 text-xs font-black font-mono outline-none focus:border-blue-500 text-right" value={item.percentual} onChange={(e) => setVariableCosts(variableCosts.map(v => v.id === item.id ? {...v, percentual: parseFloat(e.target.value) || 0} : v))} />
                          <span className="absolute right-3 top-3.5 text-[10px] font-black text-slate-300">%</span>
                        </div>
                        <button onClick={() => setVariableCosts(variableCosts.filter(v => v.id !== item.id))} className="p-3 text-slate-300 hover:text-rose-500 transition-colors"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg></button>
                      </div>
                    ))}
                    <button onClick={() => setVariableCosts([...variableCosts, { id: Math.random().toString(36).substr(2, 9), categoria: group.cat, descricao: 'Novo Item', percentual: 0 }])} className="w-full py-3 border-2 border-dashed border-blue-100 rounded-xl text-[9px] font-black text-blue-400 uppercase tracking-widest hover:border-blue-300 transition-all">+ Adicionar</button>
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
  <div className={`border rounded-[1.5rem] overflow-hidden transition-all duration-300 ${isOpen ? 'border-slate-300 shadow-2xl scale-[1.01]' : 'border-slate-100 shadow-sm'}`}>
    <button onClick={onToggle} className={`w-full flex items-center justify-between p-5 text-left transition-colors ${isOpen ? (variant === 'dark' ? 'bg-slate-900 text-white' : 'bg-blue-600 text-white') : 'bg-white text-slate-900 hover:bg-slate-50'}`}>
       <div className="flex items-center gap-4">
         <div className="space-y-0.5">
           <span className="text-[10px] font-black uppercase tracking-widest leading-none">{title}</span>
           <div className={`text-[7px] font-black px-1.5 py-0.5 rounded uppercase w-fit ${isOpen ? 'bg-white/10' : 'bg-slate-100 text-slate-400'}`}>{count} Itens</div>
         </div>
       </div>
       <div className="flex items-center gap-6">
         <span className={`text-[10px] font-black font-mono ${isOpen ? (variant === 'dark' ? 'text-emerald-400' : 'text-white') : 'text-slate-500'}`}>{totalLabel}</span>
         <svg className={`w-5 h-5 transition-transform duration-500 ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7"/></svg>
       </div>
    </button>
    <div className={`transition-all duration-500 overflow-hidden ${isOpen ? 'max-h-[3000px] opacity-100' : 'max-h-0 opacity-0'}`}>{children}</div>
  </div>
);

export default OverheadView;
