
import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";
import { SimulationResults, SimulationInputs } from '../types';
import { formatCurrency } from '../utils/calculations';

interface AIViewProps {
  results: SimulationResults;
  inputs: SimulationInputs;
}

const AIView: React.FC<AIViewProps> = ({ results, inputs }) => {
  const [messages, setMessages] = useState<{ role: 'user' | 'ai', text: string }[]>([
    { role: 'ai', text: `Olá! Sou o Tagway AI. Analisei sua simulação para o produto "${inputs.nomeProduto}". Como posso ajudar a otimizar sua lucratividade hoje?` }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    
    const userMsg = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setIsLoading(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      const context = `
        VOCÊ É: Um Consultor Especialista em Tributação e Lucratividade da Tagway Technology.
        CONDIÇÕES ATUAIS DA SIMULAÇÃO:
        - Produto: ${inputs.nomeProduto}
        - Rota: ${inputs.ufOrigem} para ${inputs.ufDestino}
        - Valor Compra: ${formatCurrency(inputs.valorCompra)}
        - MVA: ${inputs.mva}%
        - Custo Final: ${formatCurrency(results.custoFinal)}
        - Preço de Venda Alvo: ${formatCurrency(results.precoVendaAlvo)}
        - Margem Líquida Alvo: ${inputs.resultadoDesejado}% (${formatCurrency(results.margemAbsoluta)})
        - ICMS ST Pago: ${formatCurrency(results.stAPagar)}
        
        REGRAS:
        1. Responda de forma executiva, curta e focada em lucro.
        2. Use negrito para valores importantes.
        3. Se o usuário perguntar sobre redução de impostos, sugira analisar o MVA ou a redução de base.
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: [
          { role: 'user', parts: [{ text: `${context}\n\nPergunta do Usuário: ${userMsg}` }] }
        ]
      });

      setMessages(prev => [...prev, { role: 'ai', text: response.text || "Desculpe, tive um problema ao processar sua análise." }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'ai', text: "Erro na conexão com o cérebro da Tagway AI. Verifique sua rede." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#f8fafc] animate-slide-up">
      <header className="p-8 border-b border-slate-200 bg-white flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-xl animate-pulse">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/></svg>
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tighter uppercase italic leading-none">Tagway AI Expert</h2>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1 flex items-center gap-2">
               <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
               Processamento Neural Ativo
            </p>
          </div>
        </div>
        <div className="hidden md:block bg-indigo-50 text-indigo-600 px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest border border-indigo-100">
           Contexto: {inputs.nomeProduto}
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar" ref={scrollRef}>
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} animate-slide-up`}>
            <div className={`max-w-[80%] p-6 rounded-[2rem] text-sm leading-relaxed shadow-sm ${
              m.role === 'user' 
              ? 'bg-black text-white rounded-tr-none' 
              : 'bg-white text-slate-800 border border-slate-100 rounded-tl-none'
            }`}>
              <div dangerouslySetInnerHTML={{ __html: m.text.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>').replace(/\n/g, '<br/>') }} />
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white p-6 rounded-[2rem] rounded-tl-none border border-slate-100 flex gap-2">
               <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce"></div>
               <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce [animation-delay:0.2s]"></div>
               <div className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce [animation-delay:0.4s]"></div>
            </div>
          </div>
        )}
      </div>

      <div className="p-8 bg-white border-t border-slate-200">
        <div className="max-w-4xl mx-auto relative">
          <input 
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ex: Como reduzir o ICMS ST nesta rota?"
            className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-8 py-5 pr-20 text-sm font-medium focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-600 outline-none transition-all"
          />
          <button 
            onClick={handleSend}
            disabled={isLoading}
            className="absolute right-3 top-3 bottom-3 bg-black text-white px-6 rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-indigo-600 transition-all shadow-lg active:scale-95 disabled:opacity-50"
          >
            Enviar
          </button>
        </div>
        <p className="text-center text-[8px] font-bold text-slate-300 uppercase tracking-widest mt-4">As análises da IA devem ser conferidas com o contador oficial da empresa.</p>
      </div>
    </div>
  );
};

export default AIView;
