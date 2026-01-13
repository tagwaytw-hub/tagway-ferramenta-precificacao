
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { formatCurrency } from '../utils/calculations';

interface SavedSimulation {
  id: string;
  nome_produto: string;
  inputs: any;
  results: any;
  created_at: string;
}

const MyProductsView: React.FC<{ onSelect: (sim: SavedSimulation) => void }> = ({ onSelect }) => {
  const [simulations, setSimulations] = useState<SavedSimulation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSimulations();
  }, []);

  const fetchSimulations = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado.");

      const { data, error: dbError } = await supabase
        .from('saved_simulations')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (dbError) throw dbError;
      if (data) setSimulations(data);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Erro ao carregar itens arquivados.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Excluir simulação permanentemente?')) return;
    try {
      const { error: delError } = await supabase.from('saved_simulations').delete().eq('id', id);
      if (delError) throw delError;
      setSimulations(prev => prev.filter(s => s.id !== id));
    } catch (err: any) {
      alert("Erro ao deletar item: " + err.message);
    }
  };

  if (isLoading) return <div className="text-center py-20 animate-pulse text-slate-400 font-black uppercase text-xs tracking-widest">Sincronizando arquivos...</div>;

  if (error) return (
    <div className="py-20 text-center bg-rose-50 rounded-3xl border border-rose-100">
      <p className="text-rose-600 font-black uppercase text-xs tracking-widest">{error}</p>
      <button onClick={fetchSimulations} className="mt-4 text-[10px] font-black uppercase text-rose-500 underline">Tentar novamente</button>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-slide-up">
      <div className="border-b border-slate-200 pb-8 flex justify-between items-end">
        <div>
          <h2 className="text-4xl font-black text-slate-900 tracking-tighter uppercase italic">Meus Itens</h2>
          <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px] mt-2">Simulações Arquivadas em Nuvem</p>
        </div>
        <button onClick={fetchSimulations} className="p-3 text-slate-400 hover:text-black transition-all">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
        </button>
      </div>

      {simulations.length === 0 ? (
        <div className="py-20 text-center bg-white rounded-[3rem] border-2 border-dashed border-slate-200 shadow-inner">
          <div className="text-5xl mb-4 opacity-10">📁</div>
          <p className="text-slate-400 font-black uppercase text-xs tracking-[0.2em]">Seu arquivo está vazio.</p>
          <p className="text-slate-300 text-[10px] font-medium uppercase mt-2 tracking-widest">Salve itens na calculadora para vê-los aqui.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {simulations.map(sim => (
            <div 
              key={sim.id}
              onClick={() => onSelect(sim)}
              className="bg-white border border-slate-200 rounded-[2rem] p-6 hover:border-black transition-all group cursor-pointer shadow-sm hover:shadow-2xl relative overflow-hidden"
            >
              <div className="flex justify-between items-start mb-4">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 px-2 py-1 rounded">
                  {new Date(sim.created_at).toLocaleDateString('pt-BR')}
                </span>
                <button onClick={(e) => handleDelete(sim.id, e)} className="p-2 text-slate-200 hover:text-rose-500 transition-colors z-10">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                </button>
              </div>
              
              <h3 className="text-lg font-black text-slate-900 tracking-tight leading-tight line-clamp-2 mb-4 group-hover:text-black transition-colors">
                {sim.nome_produto}
              </h3>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 group-hover:bg-white transition-all">
                  <span className="text-[8px] font-black text-slate-400 uppercase block tracking-tighter">Venda Alvo</span>
                  <span className="text-sm font-black text-slate-900 font-mono tracking-tighter">{formatCurrency(sim.results.precoVendaAlvo)}</span>
                </div>
                <div className="bg-emerald-50 p-3 rounded-2xl border border-emerald-100 group-hover:bg-emerald-500 group-hover:border-emerald-500 transition-all">
                  <span className="text-[8px] font-black text-emerald-600 uppercase block tracking-tighter group-hover:text-white">Lucro Net</span>
                  <span className="text-sm font-black text-emerald-600 font-mono tracking-tighter group-hover:text-white">{sim.inputs.resultadoDesejado}%</span>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest">Rota: {sim.inputs.ufOrigem} → {sim.inputs.ufDestino}</span>
                <div className="flex items-center gap-1 text-[9px] font-black text-black uppercase opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                  Carregar <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M13 7l5 5-5 5M18 12H6"/></svg>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyProductsView;
