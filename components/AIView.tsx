
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
    { 
      role: 'ai', 
      text: `Análise pronta para **${inputs.nomeProduto || 'este item'}**. Percebi que sua margem bruta está em **${inputs.resultadoDesejado}%**. Quer que eu analise como reduzir o impacto do ICMS ou simular um cenário com frete maior?` 
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [messages, isLoading]);

  const handleSend = async (customMsg?: string) => {
    const userMsg = customMsg || input;
    if (!userMsg.trim() || isLoading) return;
    
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setIsLoading(true);

    try {
      // 1. Inicialização correta
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      // 2. Definição do Contexto Dinâmico
      const contextData = `
        PRODUTO: ${inputs.nomeProduto}
        ROTA: ${inputs.ufOrigem} para ${inputs.ufDestino}
        VALOR COMPRA: ${formatCurrency(inputs.valorCompra)}
        PREÇO VENDA ALVO: ${formatCurrency(results.precoVendaAlvo)}
        ICMS VENDA: ${results.icmsVendaEfetivo}%
        CUSTOS FIXOS (OVERHEAD): ${inputs.custosFixos}%
        MARGEM LÍQUIDA ATUAL: ${inputs.resultadoDesejado}%
        STATUS ST: ${inputs.mode === 'substituido' ? 'Sim (Substituição Tributária)' : 'Não'}
      `;

      // 3. Chamada da API com System Instruction
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Analise o seguinte prompt baseado nos dados fornecidos: ${userMsg}`,
        config: {
          systemInstruction: `Você é o Jarvis AI, um CFO Senior e Especialista em Tributação Brasileira (ICMS, ST, IPI, PIS/COFINS). 
          SEU OBJETIVO: Ajudar o empresário a encontrar onde ele está perdendo dinheiro.
          REGRAS:
          - Seja ultra-objetivo e incisivo.
          - Use Markdown para destacar valores financeiros importantes.
          - Se detectar margem baixa (abaixo de 10%), avise sobre o risco operacional.
          - Baseie-se nestes dados reais da simulação: ${contextData}`,
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
        },
      });

      // 4. Extração correta do texto (Propriedade .text)
      const aiResponse = response.text || "Desculpe, tive um problema ao processar essa análise fiscal agora.";
      
      setMessages(prev => [...prev, { role: 'ai', text: aiResponse }]);
    } catch (error) {
      console.error("Gemini Error:", error);
      setMessages(prev => [...prev, { role: 'ai', text: "Erro na conexão neural com o servidor da Google. Verifique se os dados de entrada são válidos." }]);
    } finally {
      setIsLoading(false);
    }
  };

  const chips = [
    { label: "Análise de Lucro", text: "Minha margem está saudável para este produto?" },
    { label: "Otimizar ICMS", text: "Como reduzir o impacto do ICMS nesta rota?" },
    { label: "Aumento de Custo", text: "E se o custo de compra subir 10%, qual o novo preço de venda?" }
  ];

  return (
    <div className="flex-1 flex flex-col h-full bg-[#f8fafc] animate-slide-up">
      <header className="p-8 border-b border-slate-200 bg-white flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-black rounded-2xl flex items-center justify-center text-white shadow-xl">
             <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tighter uppercase italic">Jarvis AI Expert</h2>
            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1 italic">Consultoria Estratégica Ativa</p>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar" ref={scrollRef}>
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} animate-slide-up`}>
            <div className={`max-w-[85%] p-6 rounded-[2rem] text-sm leading-relaxed shadow-sm ${
              m.role === 'user' ? 'bg-black text-white rounded-tr-none' : 'bg-white text-slate-800 border border-slate-100 rounded-tl-none'
            }`}>
              <div dangerouslySetInnerHTML={{ __html: m.text.replace(/\*\*(.*?)\*\*/g, '<b class="text-indigo-600">$1</b>').replace(/\n/g, '<br/>') }} />
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white p-6 rounded-[2rem] rounded-tl-none border border-slate-100 flex gap-2">
               <div className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce"></div>
               <div className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce [animation-delay:0.2s]"></div>
               <div className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce [animation-delay:0.4s]"></div>
            </div>
          </div>
        )}
      </div>

      <div className="p-8 bg-white border-t border-slate-200 space-y-6">
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
          {chips.map((c, i) => (
            <button 
              key={i}
              onClick={() => handleSend(c.text)}
              className="whitespace-nowrap bg-slate-50 border border-slate-200 px-5 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest text-slate-600 hover:border-black hover:text-black transition-all"
            >
              {c.label}
            </button>
          ))}
        </div>
        
        <div className="max-w-4xl mx-auto relative">
          <input 
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Digite sua dúvida estratégica..."
            className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 pr-32 text-sm font-bold outline-none focus:border-black transition-all"
          />
          <button 
            onClick={() => handleSend()}
            disabled={isLoading}
            className="absolute right-2 top-2 bottom-2 bg-black text-white px-6 rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-indigo-600 transition-all disabled:opacity-50"
          >
            Analisar
          </button>
        </div>
      </div>
    </div>
  );
};

export default AIView;
