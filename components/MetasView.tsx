
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { MetaMensal } from '../types';

interface MetasViewProps {
  userId: string;
}

const MetasView: React.FC<MetasViewProps> = ({ userId }) => {
  const [metas, setMetas] = useState<MetaMensal[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  
  // Exemplo de meta atual (simulada para o mês vigente se não houver no banco)
  const [currentMeta, setCurrentMeta] = useState<Partial<MetaMensal>>({
    mes: new Date().getMonth() + 1,
    ano: new Date().getFullYear(),
    faturamento_alvo: 0,
    margem_alvo_perc: 0,
    lucro_alvo: 0
  });

  useEffect(() => {
    fetchMetas();
  }, [userId]);

  const fetchMetas = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('metas_financeiras')
        .select('*')
        .eq('user_id', userId)
        .order('ano', { ascending: false })
        .order('mes', { ascending: false });
      
      if (data) setMetas(data);
    } catch (e) {
      console.error("Erro ao carregar metas", e);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      const { error } = await supabase
        .from('metas_financeiras')
        .upsert({
          ...currentMeta,
          user_id: userId,
          id: metas.find(m => m.mes === currentMeta.mes && m.ano === currentMeta.ano)?.id || undefined
        });
      
      if (!error) {
        setIsEditing(false);
        fetchMetas();
      }
    } catch (e) {
      console.error("Erro ao salvar meta", e);
    }
  };

  return (
    <div className="space-y-8 animate-slide-up">
      <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h2 className="text-4xl font-black text-slate-900 tracking-tighter uppercase">KPIs & Metas</h2>
          <p className="text-slate-400 text-sm font-medium">Defina onde quer chegar e acompanhe sua performance.</p>
        </div>
        <button 
          onClick={() => setIsEditing(!isEditing)}
          className="bg-black text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-[11px] hover:bg-slate-800 transition-all shadow-xl shadow-black/10"
        >
          {isEditing ? 'Cancelar' : 'Definir Novas Metas'}
        </button>
      </header>

      {isEditing && (
        <section className="bg-white border border-slate-200 rounded-[2.5rem] p-8 lg:p-12 shadow-sm space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Faturamento Alvo</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">R$</span>
                <input 
                  type="number"
                  className="w-full bg-slate-50 border-none rounded-2xl p-4 pl-12 text-xl font-black outline-none focus:ring-2 focus:ring-black transition-all"
                  value={currentMeta.faturamento_alvo}
                  onChange={e => setCurrentMeta({...currentMeta, faturamento_alvo: Number(e.target.value)})}
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Margem Média (%)</label>
              <div className="relative">
                <input 
                  type="number"
                  className="w-full bg-slate-50 border-none rounded-2xl p-4 text-xl font-black outline-none focus:ring-2 focus:ring-black transition-all"
                  value={currentMeta.margem_alvo_perc}
                  onChange={e => setCurrentMeta({...currentMeta, margem_alvo_perc: Number(e.target.value)})}
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">%</span>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Lucro Desejado</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">R$</span>
                <input 
                  type="number"
                  className="w-full bg-slate-50 border-none rounded-2xl p-4 pl-12 text-xl font-black outline-none focus:ring-2 focus:ring-black transition-all"
                  value={currentMeta.lucro_alvo}
                  onChange={e => setCurrentMeta({...currentMeta, lucro_alvo: Number(e.target.value)})}
                />
              </div>
            </div>
            <div className="flex items-end">
              <button 
                onClick={handleSave}
                className="w-full bg-emerald-500 text-white p-4 rounded-2xl font-black uppercase tracking-widest text-[11px] hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/20"
              >
                Salvar Metas
              </button>
            </div>
          </div>
        </section>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Card de Progresso de Faturamento */}
        <div className="bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 blur-3xl rounded-full -mr-16 -mt-16"></div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Faturamento</p>
          <div className="flex items-baseline gap-2 mb-6">
             <h3 className="text-3xl font-black text-slate-900">R$ 0</h3>
             <span className="text-slate-400 font-bold text-sm">/ R$ {metas[0]?.faturamento_alvo.toLocaleString('pt-BR') || '0'}</span>
          </div>
          <div className="w-full h-4 bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full bg-indigo-600 rounded-full transition-all duration-1000" style={{ width: '0%' }}></div>
          </div>
          <p className="text-[10px] font-bold text-slate-400 mt-4 uppercase">0% Alcançado</p>
        </div>

        {/* Card de Margem */}
        <div className="bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 blur-3xl rounded-full -mr-16 -mt-16"></div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Margem Média</p>
          <div className="flex items-baseline gap-2 mb-6">
             <h3 className="text-3xl font-black text-slate-900">0%</h3>
             <span className="text-slate-400 font-bold text-sm">Alvo: {metas[0]?.margem_alvo_perc || '0'}%</span>
          </div>
          <div className="w-full h-4 bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full bg-emerald-500 rounded-full transition-all duration-1000" style={{ width: '0%' }}></div>
          </div>
          <p className="text-[10px] font-bold text-slate-400 mt-4 uppercase">Performance de Margem</p>
        </div>

        {/* Card de Lucro */}
        <div className="bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/5 blur-3xl rounded-full -mr-16 -mt-16"></div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Lucro Líquido</p>
          <div className="flex items-baseline gap-2 mb-6">
             <h3 className="text-3xl font-black text-slate-900">R$ 0</h3>
             <span className="text-slate-400 font-bold text-sm">Alvo: R$ {metas[0]?.lucro_alvo.toLocaleString('pt-BR') || '0'}</span>
          </div>
          <div className="w-full h-4 bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full bg-rose-500 rounded-full transition-all duration-1000" style={{ width: '0%' }}></div>
          </div>
          <p className="text-[10px] font-bold text-slate-400 mt-4 uppercase">Projeção de Lucro</p>
        </div>
      </div>

      <section className="bg-white border border-slate-200 rounded-[2.5rem] overflow-hidden shadow-sm">
        <div className="p-8 border-b border-slate-100 flex justify-between items-center">
          <h3 className="text-[12px] font-black text-slate-900 uppercase tracking-widest">Histórico de Metas</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50">
                <th className="px-8 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Mês/Ano</th>
                <th className="px-8 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">Faturamento Alvo</th>
                <th className="px-8 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">Margem Alvo</th>
                <th className="px-8 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">Lucro Alvo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {metas.map((meta) => (
                <tr key={meta.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-8 py-4 font-bold text-slate-700">{meta.mes}/{meta.ano}</td>
                  <td className="px-8 py-4 text-right font-mono font-bold">R$ {meta.faturamento_alvo.toLocaleString('pt-BR')}</td>
                  <td className="px-8 py-4 text-right font-mono font-bold text-emerald-600">{meta.margem_alvo_perc}%</td>
                  <td className="px-8 py-4 text-right font-mono font-bold text-indigo-600">R$ {meta.lucro_alvo.toLocaleString('pt-BR')}</td>
                </tr>
              ))}
              {metas.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-8 py-12 text-center text-slate-400 font-bold uppercase text-[10px] tracking-widest">Nenhuma meta definida ainda</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

export default MetasView;
