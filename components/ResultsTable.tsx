
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
      alert('✅ Simulação arquivada!');
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
    <div className="space-y-6 lg:space-y-10 pb-6">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div className="space-y-1">
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Análise de Viabilidade</h3>
          <p className="text-sm font-black text-slate-900 tracking-tight truncate max-w-[200px] lg:max-w-none">{inputs.nomeProduto || 'Novo Produto'}</p>
        </div>
        <div className="flex items-center gap-1 lg:gap-2">
          <ActionButton onClick={onReset} label="Limpar" icon="M4 4v5h.582" color="slate" compact />
          <ActionButton onClick={handleSave} disabled={isSaving} label={isSaving ? "..." : "Arquivar"} icon="M8 7H5" color="emerald" compact />
          <ActionButton onClick={handleShare} label="WhatsApp" icon="M8.684 13.342" color="indigo" compact />
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-6">
        <KPIBox label="Custo Final" value={results.custoFinal} sub="Líquido por Item" />
        <KPIBox label="Créditos" value={results.creditoIcmsEntrada + results.creditoPisCofinsValor} sub="Recuperável" color="text-blue-600" />
        <KPIBox label="Impostos Saída" value={results.impostosTotais} sub="Carga Nominal" color="text-rose-500" />
        <KPIBox label="Venda Sugerida" value={results.precoVendaAlvo} sub={`${inputs.resultadoDesejado}% Net`} color="text-indigo-600" />
      </div>

      <section className="bg-slate-900 rounded-[2rem] lg:rounded-[2.5rem] p-6 lg:p-12 text-white shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 lg:w-96 h-64 lg:h-96 bg-white/5 blur-[80px] lg:blur-[120px] rounded-full -mr-20 -mt-20"></div>
        <div className="relative z-10 flex flex-col lg:flex-row gap-8 lg:gap-12 items-center text-center lg:text-left">
          <div className="flex-1 space-y-6 lg:space-y-10 w-full">
            <div className="space-y-1 lg:space-y-2">
              <h4 className="text-[9px] lg:text-[10px] font-black text-white/40 uppercase tracking-[0.4em]">Preço de Venda</h4>
              <p className="text-4xl lg:text-6xl font-black italic tracking-tighter leading-none">{formatCurrency(results.precoVendaAlvo)}</p>
            </div>
            
            <div className="space-y-4 lg:space-y-6 w-full">
              <div className="flex justify-between items-end">
                <div className="space-y-1">
                  <span className="text-[8px] lg:text-[9px] font-black uppercase tracking-widest text-white/50">Fluxo Rentabilidade</span>
                  <div className="flex items-center gap-2 justify-center lg:justify-start">
                    <span className="text-[9px] lg:text-[10px] font-black text-emerald-400 uppercase">Zona Lucro</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[7px] lg:text-[8px] font-black text-white/30 uppercase block">Break-even</span>
                  <span className="text-[10px] lg:text-xs font-black font-mono text-rose-400">{formatCurrency(results.precoEquilibrio)}</span>
                </div>
              </div>
              
              <div className="relative pt-4 w-full">
                <div className="absolute top-0 w-px h-8 lg:h-12 bg-white/30 z-20" style={{ left: `${pEquilibrio}%` }}></div>
                <div className="w-full h-3 lg:h-4 bg-white/10 rounded-full flex overflow-hidden ring-4 lg:ring-8 ring-white/5">
                  <div style={{ width: `${pCusto}%` }} className="h-full bg-indigo-500"></div>
                  <div style={{ width: `${pFisco}%` }} className="h-full bg-rose-500"></div>
                  <div style={{ width: `${pLucro}%` }} className="h-full bg-emerald-400"></div>
                </div>
              </div>

              <div className="flex flex-wrap justify-center lg:justify-start gap-4 lg:gap-10 pt-2 lg:pt-4">
                <CompositionItem label="Custo" perc={pCusto} color="bg-indigo-500" />
                <CompositionItem label="Fisco" perc={pFisco} color="bg-rose-500" />
                <CompositionItem label="Net" perc={pLucro} color="bg-emerald-400" />
              </div>
            </div>
          </div>
          
          <div className="w-full lg:w-72 bg-white/5 backdrop-blur-md rounded-[2rem] p-6 lg:p-10 border border-white/10 space-y-4 lg:space-y-8 text-center shrink-0">
             <div>
               <span className="text-[8px] lg:text-[9px] font-black uppercase tracking-widest text-white/40 block mb-1">Lucro Unitário</span>
               <p className="text-2xl lg:text-4xl font-black text-emerald-400 font-mono tracking-tighter">{formatCurrency(results.margemAbsoluta)}</p>
             </div>
             <div className="h-px bg-white/10 hidden lg:block"></div>
             <div className="space-y-1">
               <span className="text-[7px] lg:text-[8px] font-black uppercase tracking-widest text-white/20 block">Deduções Variáveis</span>
               <p className="text-lg lg:text-xl font-black text-white/60 font-mono">{results.totalDeducoesVendaPerc}%</p>
             </div>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between ml-2">
          <h3 className="text-[9px] lg:text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Matriz Estratégica</h3>
        </div>
        <div className="flex overflow-x-auto no-scrollbar lg:grid lg:grid-cols-5 gap-4 pb-2">
          {priceMatrix.map((cat: any, idx: number) => (
            <div key={idx} className="bg-white rounded-[1.5rem] lg:rounded-[2rem] border border-slate-200 p-4 lg:p-6 min-w-[240px] lg:min-w-0 shrink-0">
               <div className="flex justify-between items-center mb-4 lg:mb-6">
                 <span className="bg-slate-900 text-white text-[7px] lg:text-[8px] font-black px-2 py-1 rounded uppercase">{cat.label}</span>
                 <span className="text-[9px] lg:text-[10px] font-black text-slate-300">{cat.margin}%</span>
               </div>
               <div className="space-y-3 lg:space-y-4">
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

const ActionButton = ({ onClick, label, icon, color, disabled, compact }: any) => {
  const styles: any = {
    slate: 'bg-slate-100 text-slate-600 border-slate-200',
    indigo: 'bg-indigo-50 text-indigo-600 border-indigo-100',
    emerald: 'bg-emerald-500 text-white border-emerald-500'
  };
  return (
    <button onClick={onClick} disabled={disabled} className={`flex items-center gap-1 lg:gap-2 ${compact ? 'px-3 py-2' : 'px-5 py-2.5'} rounded-lg lg:rounded-xl border font-black uppercase text-[8px] lg:text-[9px] tracking-widest btn-touch transition-all disabled:opacity-50 ${styles[color]}`}>
      {label}
    </button>
  );
};

const KPIBox = ({ label, value, sub, color }: any) => (
  <div className="bg-white p-4 lg:p-6 rounded-[1.5rem] lg:rounded-[2rem] border border-slate-100 shadow-sm">
    <span className="text-[8px] lg:text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 block truncate">{label}</span>
    <p className={`text-base lg:text-2xl font-black font-mono tracking-tighter truncate ${color || 'text-slate-900'}`}>{formatCurrency(value)}</p>
    <p className="text-[7px] lg:text-[8px] font-bold text-slate-300 uppercase mt-1 truncate">{sub}</p>
  </div>
);

const CompositionItem = ({ label, perc, color }: any) => (
  <div className="flex items-center gap-2">
    <div className={`w-2 h-2 rounded-full ${color}`}></div>
    <div className="flex flex-col text-left">
      <span className="text-[7px] font-black uppercase text-white/30 tracking-widest leading-none mb-0.5">{label}</span>
      <span className="text-[10px] font-black font-mono">{perc.toFixed(0)}%</span>
    </div>
  </div>
);

const PriceLevel = ({ label, value, color }: any) => (
  <div className="flex justify-between items-center">
    <span className="text-[7px] lg:text-[8px] font-black text-slate-400 uppercase tracking-widest">{label}</span>
    <span className={`text-[10px] lg:text-[11px] font-black font-mono ${color}`}>{formatCurrency(value)}</span>
  </div>
);

export default ResultsTable;
