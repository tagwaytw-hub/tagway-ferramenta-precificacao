
import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";
import { SimulationResults, SimulationInputs } from '../types';
import { formatCurrency } from '../utils/calculations';

interface AIViewProps {
  results: SimulationResults;
  inputs: SimulationInputs;
}

const AIView: React.FC<AIViewProps> = ({ results, inputs }) => {
  const initialMessage = { 
    role: 'ai' as const, 
    text: `Olá! Sou o Tagway AI. Analisei sua simulação para o produto "${inputs.nomeProduto || 'não nomeado'}". Como posso ajudar a otimizar sua lucratividade hoje?` 
  };

  const [messages, setMessages] = useState<{ role: 'user' | 'ai', text: string }[]>([initialMessage]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [messages, isLoading]);

  const clearChat = () => {
    if (confirm('Deseja limpar todo o histórico desta conversa?')) {
      setMessages([initialMessage]);
    }
  };

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
        PRODUTO ATUAL: ${inputs.nomeProduto || 'N/A'}
        ROTA: ${inputs.ufOrigem} -> ${inputs.ufDestino}
        VALOR COMPRA: ${formatCurrency(inputs.valorCompra)}
        MVA: ${inputs.mva}%
        CUSTO FINAL: ${formatCurrency(results.custoFinal)}
        VENDA ALVO: ${formatCurrency(results.precoVendaAlvo)}
        LUCRO: ${inputs.resultadoDesejado}% (${formatCurrency(results.margemAbsoluta)})
        
        REGRAS: Responda de forma executiva, curta e focada em lucro. Use negrito para valores.
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `${context}\n\nPergunta do Usuário: ${userMsg}`
      });

      setMessages(prev => [...prev, { role: 'ai', text: response.text || "Desculpe, tive um problema ao processar sua análise." }]);
    } catch (error) {
      console.error(error);
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
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Processamento Neural Ativo</p>
          </div>
        </div>

        <button 
          onClick={clearChat}
          className="p-3 text-slate-300 hover:text-rose-500 transition-colors flex items-center gap-2"
          title="Limpar Histórico"
        >
          <span className="text-[9px] font-black uppercase tracking-widest hidden md:block">Limpar Chat</span>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
        </button>
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
            placeholder="Pergunte sobre lucros, impostos ou MVA..."
            className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-8 py-5 pr-20 text-sm font-medium outline-none focus:border-black transition-all"
          />
          <button 
            onClick={handleSend}
            disabled={isLoading}
            className="absolute right-3 top-3 bottom-3 bg-black text-white px-6 rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-indigo-600 transition-all active:scale-95 disabled:opacity-50"
          >
            Enviar
          </button>
        </div>
      </div>
    </div>
  );
};

export default AIView;
