
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
    text: `Olá! Sou o Tagway AI. Analisei sua simulação para o produto **${inputs.nomeProduto || 'não nomeado'}**. Atualmente sua margem líquida é de **${inputs.resultadoDesejado}%**. Como posso ajudar a otimizar sua rentabilidade?` 
  };

  const [messages, setMessages] = useState<{ role: 'user' | 'ai', text: string }[]>([initialMessage]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const powerUps = [
    { label: "Otimizar MVA", text: "Analise se minha MVA está correta para esta NCM e como posso reduzi-la.", icon: "⚡" },
    { label: "Check Fiscal", text: "Verifique se há algum risco tributário na rota " + inputs.ufOrigem + " para " + inputs.ufDestino + ".", icon: "🛡️" },
    { label: "Aumento de 5%", text: "Qual o impacto no meu lucro se eu aumentar o preço de venda em exatamente 5%?", icon: "📈" },
    { label: "Análise 2027", text: "Projete este cenário com as regras da Reforma Tributária de 2027.", icon: "🔮" },
    { label: "Reduzir Frete", text: "Como o frete está impactando meu preço final e qual a margem de manobra aqui?", icon: "🚚" }
  ];

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [messages, isLoading]);

  const handleSend = async (customMsg?: string) => {
    const msgToSend = customMsg || input;
    if (!msgToSend.trim() || isLoading) return;
    
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: msgToSend }]);
    setIsLoading(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      const context = `
        VOCÊ É: Consultor Sênior em Tributação e Estratégia de Preços.
        CENÁRIO: ${inputs.nomeProduto || 'Produto N/A'} | ${inputs.ufOrigem} -> ${inputs.ufDestino}
        REGIME: ${inputs.mode}
        COMPRA: ${formatCurrency(inputs.valorCompra)} | MVA: ${inputs.mva}%
        VENDA ATUAL: ${formatCurrency(results.precoVendaAlvo)}
        LUCRO: ${inputs.resultadoDesejado}%
        
        OBJETIVO: Respostas curtas, incisivas e focadas em AUMENTAR O LUCRO. Use negrito para valores importantes.
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `${context}\n\nUsuário pergunta: ${msgToSend}`
      });

      setMessages(prev => [...prev, { role: 'ai', text: response.text || "Tive um erro no processamento neural. Tente novamente." }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'ai', text: "Erro de conexão com o Jarvis Cloud." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#f8fafc] animate-slide-up">
      <header className="p-8 border-b border-slate-200 bg-white flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-black rounded-2xl flex items-center justify-center text-white shadow-xl animate-pulse">
             <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tighter uppercase italic leading-none">Jarvis AI Expert</h2>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Sessão Ativa • Inteligência Fiscal</p>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar" ref={scrollRef}>
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} animate-slide-up`}>
            <div className={`max-w-[80%] p-6 rounded-[2.5rem] text-sm leading-relaxed shadow-sm ${
              m.role === 'user' ? 'bg-black text-white rounded-tr-none' : 'bg-white text-slate-800 border border-slate-100 rounded-tl-none'
            }`}>
              <div dangerouslySetInnerHTML={{ __html: m.text.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>').replace(/\n/g, '<br/>') }} />
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white p-6 rounded-[2.5rem] rounded-tl-none border border-slate-100 flex gap-2">
               <div className="w-2 h-2 bg-slate-900 rounded-full animate-bounce"></div>
               <div className="w-2 h-2 bg-slate-900 rounded-full animate-bounce [animation-delay:0.2s]"></div>
               <div className="w-2 h-2 bg-slate-900 rounded-full animate-bounce [animation-delay:0.4s]"></div>
            </div>
          </div>
        )}
      </div>

      <div className="p-8 bg-white border-t border-slate-200 space-y-6">
        <div className="flex flex-col gap-2">
          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Power-Ups Estratégicos</span>
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
            {powerUps.map((p, idx) => (
              <button 
                key={idx}
                onClick={() => handleSend(p.text)}
                className="whitespace-nowrap bg-white border border-slate-200 px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-700 hover:border-indigo-600 hover:text-indigo-600 transition-all flex items-center gap-2 shadow-sm group"
              >
                <span className="text-lg group-hover:scale-125 transition-transform">{p.icon}</span>
                {p.label}
              </button>
            ))}
          </div>
        </div>
        
        <div className="max-w-4xl mx-auto relative">
          <input 
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Pergunte qualquer coisa sobre este produto..."
            className="w-full bg-slate-50 border border-slate-200 rounded-[2rem] px-8 py-5 pr-20 text-sm font-medium outline-none focus:border-black transition-all shadow-inner"
          />
          <button 
            onClick={() => handleSend()}
            disabled={isLoading}
            className="absolute right-3 top-3 bottom-3 bg-black text-white px-8 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-indigo-600 transition-all disabled:opacity-50"
          >
            Analisar
          </button>
        </div>
      </div>
    </div>
  );
};

export default AIView;
