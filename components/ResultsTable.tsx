
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
  const [expandedSections, setExpandedSections] = useState<string[]>(['credits', 'purchase']);
  const [isSaving, setIsSaving] = useState(false);

  const totalWeight = results.custoFinal + results.impostosTotais + results.margemAbsoluta;
  const pCusto = (results.custoFinal / totalWeight) * 100;
  const pFisco = (results.impostosTotais / totalWeight) * 100;
  const pLucro = (results.margemAbsoluta / totalWeight) * 100;

  const toggleSection = (id: string) => {
    setExpandedSections(prev => 
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  };

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

  const handlePrint = () => window.print();
  
  const handleShare = async () => {
    const shareMessage = `*📊 SIMULAÇÃO FISCAL TAGWAY*\n` +
      `----------------------------------\n` +
      `*Item:* ${inputs.nomeProduto || 'Produto não identificado'}\n` +
      `*Rota:* ${inputs.ufOrigem} ➔ ${inputs.ufDestino}\n\n` +
      `*💰 PREÇO DE VENDA:* ${formatCurrency(results.precoVendaAlvo)}\n` +
      `*📉 Custo Líquido:* ${formatCurrency(results.custoFinal)}\n` +
      `*🛡️ Margem Net:* ${inputs.resultadoDesejado}%\n` +
      `*⚖️ Impostos Totais:* ${formatCurrency(results.impostosTotais)}\n\n` +
      `_Gerado por Tagway Intelligence_`;

    const copyToClipboard = () => {
      navigator.clipboard.writeText(shareMessage);
      alert('Resumo formatado para WhatsApp copiado!');
    };

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Simulação Tagway',
          text: shareMessage,
        });
      } catch (err) {
        if (err instanceof Error && err.name !== 'AbortError') {
          copyToClipboard();
        }
      }
    } else {
      const encodedMsg = encodeURIComponent(shareMessage);
      const whatsappUrl = `https://wa.me/?text=${encodedMsg}`;
      window.open(whatsappUrl, '_blank');
      copyToClipboard();
    }
  };

  return (
    <div className="space-y-8 lg:space-y-10 pb-12">
      {/* Barra de Ações */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div className="space-y-1">
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Análise de Viabilidade</h3>
          <p className="text-sm font-black text-slate-900 tracking-tight">{inputs.nomeProduto || 'Novo Produto'}</p>
        </div>
        <div className="flex items-center gap-2">
          <ActionButton onClick={onReset} label="Novo" icon="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" color="slate" />
          <ActionButton onClick={handleSave} disabled={isSaving} label={isSaving ? "Salvando..." : "Salvar"} icon="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" color="emerald" />
          <ActionButton onClick={handleShare} label="WhatsApp" icon="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" color="indigo" />
          <ActionButton onClick={handlePrint} label="PDF" icon="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" color="black" />
        </div>
      </div>

      {/* KPIs Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-6">
        <KPIBox label="Total NF-e" value={results.valorTotalNota} sub="Bruto Compra" icon="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        <KPIBox label="Créditos Fiscais" value={results.creditoIcmsEntrada + results.creditoPisCofinsValor} sub="Recuperável" color="text-blue-600" icon="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        <KPIBox label="Impostos Saída" value={results.impostosTotais} sub="Carga Total" color="text-rose-500" icon="M19 14l-7 7m0 0l-7-7m7 7V3" />
        <KPIBox label="Custo Líquido" value={results.custoFinal} sub="Unitário" color="text-slate-900" icon="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
        <section className="bg-white rounded-[1.5rem] lg:rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden transition-all">
           <button 
             onClick={() => toggleSection('credits')}
             className="w-full flex items-center justify-between p-6 lg:p-8 hover:bg-slate-50 transition-colors border-b border-slate-100 group"
           >
             <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
               <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
               Créditos
             </h5>
             <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${expandedSections.includes('credits') ? 'bg-black text-white' : 'bg-slate-100 text-slate-400'}`}>
               <svg className={`w-4 h-4 transition-transform ${expandedSections.includes('credits') ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"/></svg>
             </div>
           </button>
           
           {expandedSections.includes('credits') && (
             <div className="p-6 lg:p-8 pt-0 space-y-4 animate-slide-up">
               <div className="h-4"></div>
               <DetailRow label="ICMS Mercadoria" value={results.creditoIcmsMercadoria} />
               <DetailRow label="ICMS Frete" value={results.creditoIcmsFrete} />
               <DetailRow label="PIS e COFINS" value={results.creditoPisCofinsValor} />
               <div className="h-px bg-slate-100 my-2"></div>
               <div className="flex justify-between items-center">
                  <span className="text-[10px] font-black text-blue-600 uppercase">Total Créditos</span>
                  <span className="text-sm font-black text-blue-600 font-mono">{formatCurrency(results.creditoIcmsEntrada + results.creditoPisCofinsValor)}</span>
               </div>
             </div>
           )}
        </section>

        <section className="bg-white rounded-[1.5rem] lg:rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden transition-all">
           <button 
             onClick={() => toggleSection('purchase')}
             className="w-full flex items-center justify-between p-6 lg:p-8 hover:bg-slate-50 transition-colors border-b border-slate-100 group"
           >
             <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">NF-e Compra</h5>
             <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${expandedSections.includes('purchase') ? 'bg-black text-white' : 'bg-slate-100 text-slate-400'}`}>
               <svg className={`w-4 h-4 transition-transform ${expandedSections.includes('purchase') ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"/></svg>
             </div>
           </button>
           
           {expandedSections.includes('purchase') && (
             <div className="p-6 lg:p-8 pt-0 space-y-4 animate-slide-up">
               <div className="h-4"></div>
               <DetailRow label="Valor Líquido" value={inputs.valorCompra} />
               <DetailRow label="IPI" value={results.valorIpi} />
               <DetailRow label="Frete" value={inputs.freteValor} />
               <div className="h-px bg-slate-100 my-2"></div>
               <div className="flex justify-between items-center">
                  <span className="text-[10px] font-black text-slate-900 uppercase">Valor Total</span>
                  <span className="text-sm font-black text-slate-900 font-mono">{formatCurrency(results.valorTotalNota)}</span>
               </div>
             </div>
           )}
        </section>

        <section className="bg-slate-900 rounded-[1.5rem] lg:rounded-[2rem] p-6 lg:p-8 space-y-6 shadow-2xl text-white">
           <h5 className="text-[10px] font-black text-white/30 uppercase tracking-widest pb-4 border-b border-white/5">Sugestão Final</h5>
           <div className="space-y-6">
             <div>
               <span className="text-[9px] font-black text-white/40 uppercase tracking-widest block mb-2">Custo Líquido</span>
               <div className="text-3xl font-black font-mono tracking-tighter text-emerald-400">{formatCurrency(results.custoFinal)}</div>
             </div>
             <div className="h-px bg-white/5"></div>
             <div>
               <span className="text-[9px] font-black text-white/40 uppercase tracking-widest block mb-2">Venda Sugerida</span>
               <div className="text-4xl font-black font-mono tracking-tighter text-white">{formatCurrency(results.precoVendaAlvo)}</div>
             </div>
           </div>
        </section>
      </div>

      <section className="bg-white rounded-[1.5rem] lg:rounded-[2rem] border border-slate-200 overflow-hidden shadow-2xl shadow-black/5">
        <div className="flex flex-col lg:flex-row divide-y lg:divide-y-0 lg:divide-x divide-slate-100">
          <div className="flex-1 p-6 lg:p-10 space-y-6 lg:space-y-8">
            <header className="flex justify-between items-start">
              <div className="space-y-1">
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Composição</h3>
                <h4 className="text-lg lg:text-2xl font-black text-slate-800 tracking-tighter">Markup Divisor {inputs.resultadoDesejado}% Net</h4>
              </div>
            </header>
            <div className="space-y-4">
              <div className="w-full h-4 bg-slate-100 rounded-full flex overflow-hidden ring-1 ring-slate-200/50">
                <div style={{ width: `${pCusto}%` }} className="h-full bg-slate-900 transition-all duration-500"></div>
                <div style={{ width: `${pFisco}%` }} className="h-full bg-rose-500 transition-all duration-500"></div>
                <div style={{ width: `${pLucro}%` }} className="h-full bg-emerald-500 transition-all duration-500"></div>
              </div>
              <div className="flex flex-wrap gap-x-6 gap-y-3 pt-1">
                <CompositionLabel dot="bg-slate-900" label="Estoque" perc={pCusto} />
                <CompositionLabel dot="bg-rose-500" label="Fisco" perc={pFisco} />
                <CompositionLabel dot="bg-emerald-500" label="Lucro" perc={pLucro} />
              </div>
            </div>
          </div>
          <div className="bg-slate-50 p-6 lg:p-10 lg:w-[350px] space-y-4 lg:space-y-5">
            <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest pb-4 border-b border-slate-200">Deduções de Saída</h5>
            <DetailRow label="ICMS Efetivo" value={results.precoVendaAlvo * (results.icmsVendaEfetivo / 100)} />
            <DetailRow label="PIS e COFINS" value={results.precoVendaAlvo * (inputs.pisCofinsVenda / 100)} />
            <DetailRow label="Comissão" value={results.precoVendaAlvo * (inputs.comissaoVenda / 100)} />
            <DetailRow label="Overhead" value={results.precoVendaAlvo * (inputs.custosFixos / 100)} />
            <div className="h-px bg-slate-200 my-2"></div>
            <DetailRow label="Lucro Net (R$)" value={results.margemAbsoluta} color="text-emerald-600 font-black" />
          </div>
        </div>
      </section>

      {/* Cenários de Mercado */}
      <section className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Cenários de Mercado</h3>
          <div className="flex flex-wrap gap-3 md:gap-4 bg-slate-50 p-3 rounded-2xl border border-slate-100">
            <LegendItem label="D: Desconto (-5%)" dot="bg-amber-400" />
            <LegendItem label="I: Ideal (Base)" dot="bg-emerald-500" />
            <LegendItem label="P6: Parcelado 6x (+11.11%)" dot="bg-blue-500" />
            <LegendItem label="P6+: Parcelado 12x (+17.65%)" dot="bg-rose-500" />
          </div>
        </div>
        <div className="flex lg:grid lg:grid-cols-5 gap-4 overflow-x-auto lg:overflow-x-visible no-scrollbar pb-4 -mx-4 px-4 lg:mx-0 lg:px-0">
          {priceMatrix.map((cat: any, idx: number) => (
            <div key={idx} className="min-w-[200px] lg:min-w-0 bg-white rounded-2xl border border-slate-200 p-5 space-y-4 hover:border-black transition-all hover:shadow-xl group shrink-0">
               <header className="flex justify-between items-center">
                 <span className="text-[9px] font-black text-black uppercase bg-slate-100 px-2 py-1 rounded-md">{cat.label}</span>
                 <span className="text-xs font-bold text-slate-400 group-hover:text-black">{cat.margin}%</span>
               </header>
               <div className="space-y-2.5">
                 {['D', 'I', 'P6', 'P6+'].map(level => (
                   <div key={level} className="flex justify-between items-center text-[11px]">
                     <span className={`w-8 h-5 rounded flex items-center justify-center font-black text-[7px] text-white shadow-sm ${
                        level === 'D' ? 'bg-amber-400' : level === 'I' ? 'bg-emerald-500' : level === 'P6' ? 'bg-blue-500' : 'bg-rose-500'
                     }`}>{level}</span>
                     <span className="font-mono font-black text-slate-700">{formatCurrency(cat.levels[level])}</span>
                   </div>
                 ))}
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
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100 hover:bg-emerald-600 hover:text-white',
    black: 'bg-black text-white border-black hover:bg-slate-800 shadow-lg shadow-black/10'
  };
  return (
    <button 
      onClick={onClick}
      disabled={disabled}
      className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border font-black uppercase text-[9px] tracking-widest transition-all btn-touch disabled:opacity-50 ${styles[color]}`}
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d={icon}/></svg>
      {label}
    </button>
  );
};

const KPIBox = ({ label, value, sub, color, icon }: any) => (
  <div className="bg-white p-4 lg:p-6 rounded-[1.2rem] lg:rounded-[2rem] border border-slate-200 shadow-sm transition-all btn-touch relative overflow-hidden">
    <div className="relative z-10">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[8px] lg:text-[9px] font-black text-slate-400 uppercase tracking-widest block truncate">{label}</span>
        {icon && <svg className={`w-3.5 h-3.5 lg:w-4 lg:h-4 text-slate-200`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d={icon}/></svg>}
      </div>
      <span className={`text-lg lg:text-2xl font-black font-mono ${color || 'text-slate-800'} tracking-tighter block truncate leading-none mb-2`}>{formatCurrency(value)}</span>
      <span className="text-[8px] font-black text-slate-400 uppercase tracking-tighter opacity-60 truncate">{sub}</span>
    </div>
    <div className="absolute -bottom-4 -right-4 w-12 h-12 bg-slate-50 rounded-full opacity-50"></div>
  </div>
);

const CompositionLabel = ({ dot, label, perc }: any) => (
  <div className="flex items-center gap-2">
    <div className={`w-1.5 h-1.5 rounded-full ${dot}`}></div>
    <span className="text-[8px] lg:text-[9px] font-black text-slate-400 uppercase tracking-tight">{label}</span>
    <span className="text-[8px] lg:text-[9px] font-black text-slate-800">{perc.toFixed(1)}%</span>
  </div>
);

const DetailRow = ({ label, value, color }: any) => (
  <div className="flex justify-between items-center text-[10px] lg:text-[11px]">
    <span className="font-bold text-slate-500 uppercase tracking-tighter truncate pr-2">{label}</span>
    <span className={`font-black font-mono ${color || 'text-slate-800'} shrink-0`}>{formatCurrency(value)}</span>
  </div>
);

const LegendItem = ({ label, dot }: { label: string, dot: string }) => (
  <div className="flex items-center gap-1.5">
    <div className={`w-2.5 h-2.5 rounded-[0.25rem] ${dot}`}></div>
    <span className="text-[8px] font-black text-slate-500 uppercase tracking-tighter">{label}</span>
  </div>
);

export default ResultsTable;
