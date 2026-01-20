
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

  const totalWeight = results.custoFinal + results.impostosTotais + results.margemAbsoluta;
  const pCusto = (results.custoFinal / totalWeight) * 100;
  const pFisco = (results.impostosTotais / totalWeight) * 100;
  const pLucro = (results.margemAbsoluta / totalWeight) * 100;
  const pEquilibrio = (results.precoEquilibrio / results.precoVendaAlvo) * 100;

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
      alert('✅ Simulação arquivada em "Meus Produtos"!');
    } catch (err: any) {
      alert('Erro ao salvar: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleShare = async () => {
    const shareMessage = `*📊 TAGWAY FISCAL: ${inputs.nomeProduto || 'Produto'}*\n` +
      `*💰 VENDA:* ${formatCurrency(results.precoVendaAlvo)}\n` +
      `*📉 CUSTO:* ${formatCurrency(results.custoFinal)}\n` +
      `*🛡️ MARGEM:* ${inputs.resultadoDesejado}%\n` +
      `_Rota: ${inputs.ufOrigem} ➔ ${inputs.ufDestino}_`;

    if (navigator.share) {
      try { await navigator.share({ title: 'Simulação Tagway', text: shareMessage }); } catch (e) {}
    } else {
      window.open(`https://wa.me/?text=${encodeURIComponent(shareMessage)}`, '_blank');
    }
  };

  return (
    <div className="space-y-8 lg:space-y-10 pb-12">
      {/* Barra de Ações Superior */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div className="space-y-1">
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Análise de Viabilidade</h3>
          <p className="text-sm font-black text-slate-900 tracking-tight">{inputs.nomeProduto || 'Novo Produto'}</p>
        </div>
        <div className="flex items-center gap-2">
          <ActionButton onClick={onReset} label="Limpar" icon="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" color="slate" />
          <ActionButton onClick={handleSave} disabled={isSaving} label={isSaving ? "Gravando..." : "Arquivar"} icon="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" color="emerald" />
          <ActionButton onClick={handleShare} label="WhatsApp" icon="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" color="indigo" />
        </div>
      </div>

      {/* KPIs Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        <KPIBox label="Custo Final" value={results.custoFinal} sub="Líquido por Item" icon="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
        <KPIBox label="Créditos" value={results.creditoIcmsEntrada + results.creditoPisCofinsValor} sub="Total Recuperável" color="text-blue-600" icon="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        <KPIBox label="Impostos Saída" value={results.impostosTotais} sub="Carga Nominal" color="text-rose-500" icon="M19 14l-7 7m0 0l-7-7m7 7V3" />
        <KPIBox label="Preço de Venda" value={results.precoVendaAlvo} sub={`${inputs.resultadoDesejado}% Net`} color="text-indigo-600" icon="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2" />
      </div>

      {/* Análise de Composição DYNAMIC */}
      <section className="bg-slate-900 rounded-[2.5rem] p-8 lg:p-12 text-white shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 blur-[120px] rounded-full -mr-20 -mt-20"></div>
        <div className="relative z-10 flex flex-col lg:flex-row gap-12 items-center">
          <div className="flex-1 space-y-10">
            <div className="space-y-2">
              <h4 className="text-[10px] font-black text-white/40 uppercase tracking-[0.4em]">Estrutura de Formação do Preço</h4>
              <p className="text-6xl font-black italic tracking-tighter leading-none">{formatCurrency(results.precoVendaAlvo)}</p>
            </div>
            
            <div className="space-y-6">
              <div className="flex justify-between items-end">
                <div className="space-y-1">
                  <span className="text-[9px] font-black uppercase tracking-widest text-white/50">Fluxo de Rentabilidade</span>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black text-emerald-400 uppercase">Zona de Lucro</span>
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></div>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[8px] font-black text-white/30 uppercase block">Break-even</span>
                  <span className="text-xs font-black font-mono text-rose-400">{formatCurrency(results.precoEquilibrio)}</span>
                </div>
              </div>
              
              <div className="relative pt-4">
                {/* Indicador de Break-even */}
                <div 
                  className="absolute top-0 w-px h-12 bg-white/30 z-20 transition-all duration-1000 group"
                  style={{ left: `${pEquilibrio}%` }}
                >
                  <div className="absolute -top-6 left-1/2 -translate-x-1/2 whitespace-nowrap text-[7px] font-black bg-white/10 px-2 py-0.5 rounded border border-white/5">EQUILÍBRIO</div>
                </div>

                <div className="w-full h-4 bg-white/10 rounded-full flex overflow-hidden ring-8 ring-white/5">
                  <div style={{ width: `${pCusto}%` }} className="h-full bg-indigo-500 transition-all duration-1000 shadow-[0_0_15px_rgba(99,102,241,0.5)]"></div>
                  <div style={{ width: `${pFisco}%` }} className="h-full bg-rose-500 transition-all duration-1000 shadow-[0_0_15px_rgba(244,63,94,0.5)]"></div>
                  <div style={{ width: `${pLucro}%` }} className="h-full bg-emerald-400 transition-all duration-1000 shadow-[0_0_15px_rgba(52,211,153,0.5)]"></div>
                </div>
              </div>

              <div className="flex flex-wrap gap-10 pt-4">
                <CompositionItem label="Custo Aquisição" perc={pCusto} color="bg-indigo-500" />
                <CompositionItem label="Impostos Totais" perc={pFisco} color="bg-rose-500" />
                <CompositionItem label="Margem Líquida" perc={pLucro} color="bg-emerald-400" />
              </div>
            </div>
          </div>
          
          <div className="w-full lg:w-72 bg-white/5 backdrop-blur-md rounded-[2.5rem] p-10 border border-white/10 space-y-8 flex flex-col justify-center text-center">
             <div>
               <span className="text-[9px] font-black uppercase tracking-widest text-white/40 block mb-2">Lucro Real por Venda</span>
               <p className="text-4xl font-black text-emerald-400 font-mono tracking-tighter">{formatCurrency(results.margemAbsoluta)}</p>
             </div>
             <div className="h-px bg-white/10"></div>
             <div className="space-y-1">
               <span className="text-[8px] font-black uppercase tracking-widest text-white/20 block">Deduções Variáveis</span>
               <p className="text-xl font-black text-white/60 font-mono">{results.totalDeducoesVendaPerc}%</p>
             </div>
          </div>
        </div>
      </section>

      {/* Matriz de Preços Estratégica com 4 Níveis */}
      <section className="space-y-6">
        <div className="flex items-center justify-between ml-2">
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Matriz de Precificação Estratégica</h3>
          <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest">Modelo: Transição Direta</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {priceMatrix.map((cat: any, idx: number) => (
            <div key={idx} className="bg-white rounded-[2rem] border border-slate-200 p-6 hover:border-black transition-all hover:shadow-xl group">
               <div className="flex justify-between items-center mb-6">
                 <span className="bg-slate-900 text-white text-[8px] font-black px-2 py-1 rounded uppercase tracking-widest">{cat.label}</span>
                 <span className="text-[10px] font-black text-slate-300 group-hover:text-black transition-colors">{cat.margin}%</span>
               </div>
               <div className="space-y-4">
                 <PriceLevel label="Ideal (I)" value={cat.levels['I']} color="text-emerald-500" />
                 <PriceLevel label="Desconto (D)" value={cat.levels['D']} color="text-amber-500" />
                 <PriceLevel label="P6 (+11.1%)" value={cat.levels['P6']} color="text-blue-500" />
                 <PriceLevel label="P6+ (+17.6%)" value={cat.levels['P6+']} color="text-indigo-600" />
               </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

const ActionButton = ({ onClick, label, icon, color, disabled }: any) => {
  const styles: any = {
    slate: 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200',
    indigo: 'bg-indigo-50 text-indigo-600 border-indigo-100 hover:bg-indigo-100',
    emerald: 'bg-emerald-500 text-white border-emerald-500 hover:bg-emerald-600 shadow-lg shadow-emerald-500/20'
  };
  return (
    <button 
      onClick={onClick}
      disabled={disabled}
      className={`flex items-center gap-2 px-5 py-2.5 rounded-xl border font-black uppercase text-[9px] tracking-widest transition-all active:scale-95 disabled:opacity-50 ${styles[color]}`}
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d={icon}/></svg>
      {label}
    </button>
  );
};

const KPIBox = ({ label, value, sub, color, icon }: any) => (
  <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all">
    <div className="flex items-center justify-between mb-3">
      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{label}</span>
      <svg className="w-4 h-4 text-slate-200" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d={icon}/></svg>
    </div>
    <p className={`text-2xl font-black font-mono tracking-tighter ${color || 'text-slate-900'}`}>{formatCurrency(value)}</p>
    <p className="text-[8px] font-bold text-slate-300 uppercase mt-1 tracking-widest">{sub}</p>
  </div>
);

const CompositionItem = ({ label, perc, color }: any) => (
  <div className="flex items-center gap-3">
    <div className={`w-2.5 h-2.5 rounded-full ${color}`}></div>
    <div className="flex flex-col">
      <span className="text-[8px] font-black uppercase text-white/30 tracking-widest leading-none mb-1">{label}</span>
      <span className="text-[11px] font-black font-mono">{perc.toFixed(1)}%</span>
    </div>
  </div>
);

const PriceLevel = ({ label, value, color }: any) => (
  <div className="flex justify-between items-center group/lvl">
    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest group-hover/lvl:text-black transition-colors">{label}</span>
    <span className={`text-[11px] font-black font-mono ${color}`}>{formatCurrency(value)}</span>
  </div>
);

export default ResultsTable;
