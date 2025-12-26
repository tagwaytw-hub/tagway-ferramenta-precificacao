
import React, { useState } from 'react';
import { SimulationInputs, SearchResult } from '../types';
import { analyzeInvoiceDocument, searchTaxInfo, generateAudioSummary } from '../services/geminiService';
import { formatCurrency } from '../utils/calculations';

interface GeminiAssistantProps {
  setInputs: React.Dispatch<React.SetStateAction<SimulationInputs>>;
  currentResults: { custoFinal: number; stAPagar: number; valorTotalNota: number };
}

type Tab = 'scan' | 'consult' | 'audio';

const GeminiAssistant: React.FC<GeminiAssistantProps> = ({ setInputs, currentResults }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('scan');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // State for Search
  const [query, setQuery] = useState('');
  const [searchResult, setSearchResult] = useState<SearchResult | null>(null);

  // State for Audio
  const [isPlaying, setIsPlaying] = useState(false);

  // --- Handlers ---

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setError(null);
    try {
      const mimeType = file.type;
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64String = (reader.result as string).split(',')[1];
        try {
          const extractedData = await analyzeInvoiceDocument(base64String, mimeType);
          if (extractedData) {
            setInputs(prev => ({ ...prev, ...extractedData }));
            alert(`Documento (${file.name}) analisado com sucesso!`);
          } else {
            setError("Não foi possível extrair dados deste arquivo.");
          }
        } catch (err) {
          setError("Falha ao analisar o documento com a IA.");
        } finally {
          setLoading(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (err) {
      setError("Erro ao ler o arquivo localmente.");
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const result = await searchTaxInfo(query);
      setSearchResult(result);
    } catch (err) {
      setError("Falha ao buscar informações fiscais.");
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateAudio = async () => {
    if (isPlaying) return;
    setLoading(true);
    setError(null);

    const summaryText = `
      Resumo de Precificação. 
      O valor base da nota é ${formatCurrency(currentResults.valorTotalNota)}.
      O ICMS-ST a pagar é ${formatCurrency(currentResults.stAPagar)}.
      O custo final calculado é ${formatCurrency(currentResults.custoFinal)}.
    `;

    try {
      const audioBuffer = await generateAudioSummary(summaryText);
      if (audioBuffer) {
        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const source = ctx.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(ctx.destination);
        source.onended = () => setIsPlaying(false);
        source.start(0);
        setIsPlaying(true);
      }
    } catch (err) {
      setError("Falha ao gerar o resumo em áudio.");
    } finally {
      setLoading(false);
    }
  };

  // --- Render ---

  return (
    <>
      {/* Floating Action Button */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-indigo-600 text-white rounded-full shadow-2xl flex items-center justify-center hover:bg-indigo-700 transition-all z-50 group hover:scale-110 active:scale-95"
        title="Assistente Gêmeos"
      >
        {isOpen ? (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
        ) : (
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
        )}
        {!isOpen && (
          <span className="absolute right-16 bg-white text-indigo-900 text-xs font-bold px-3 py-1.5 rounded-lg shadow-sm border border-indigo-100 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
            Dúvida Fiscal? Fale com a IA
          </span>
        )}
      </button>

      {/* Pop-up Window */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 w-96 max-h-[600px] bg-white border border-indigo-100 rounded-2xl shadow-2xl z-40 flex flex-col overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
          <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 p-4 text-white flex items-center justify-between">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
              <h2 className="font-bold text-sm uppercase tracking-wider">Assistente Gemini</h2>
            </div>
            <button onClick={() => setIsOpen(false)} className="hover:bg-white/10 p-1 rounded transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>
          </div>

          <div className="flex gap-1 p-2 bg-indigo-50/50 border-b border-indigo-100">
            {['scan', 'consult', 'audio'].map((t) => (
              <button 
                key={t}
                onClick={() => setActiveTab(t as Tab)} 
                className={`flex-1 py-1.5 text-[10px] font-bold uppercase rounded-md transition-all ${activeTab === t ? 'bg-indigo-600 text-white shadow-sm' : 'text-indigo-400 hover:text-indigo-600'}`}
              >
                {t === 'scan' ? 'Nota' : t === 'consult' ? 'Consultor' : 'Áudio'}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto p-5 custom-scrollbar">
            {error && (
              <div className="mb-4 p-3 bg-red-50 text-red-600 text-[11px] rounded-lg border border-red-100 flex items-center gap-2">
                 {error}
              </div>
            )}

            {loading && (
              <div className="flex flex-col items-center justify-center py-10 gap-3">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                <p className="text-[10px] text-indigo-600 font-bold uppercase">Processando com IA...</p>
              </div>
            )}

            {!loading && activeTab === 'scan' && (
              <div className="space-y-4">
                <p className="text-xs text-slate-500 leading-relaxed">Arraste aqui ou clique para extrair dados de <strong>PDF</strong> ou imagens da sua Nota Fiscal.</p>
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-indigo-200 border-dashed rounded-xl cursor-pointer bg-indigo-50/30 hover:bg-indigo-50 transition-colors">
                  <div className="flex flex-col items-center justify-center">
                    <svg className="w-8 h-8 text-indigo-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path></svg>
                    <span className="text-[10px] font-black text-indigo-600 uppercase">Importar Arquivo</span>
                  </div>
                  <input type="file" className="hidden" accept="image/*,application/pdf" onChange={handleFileUpload} />
                </label>
              </div>
            )}

            {!loading && activeTab === 'consult' && (
              <div className="space-y-4">
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    value={query} 
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Ex: Qual o MVA de cimento em SP?"
                    className="flex-1 px-3 py-2 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                  <button onClick={handleSearch} className="bg-indigo-600 text-white px-3 py-2 rounded-lg hover:bg-indigo-700 transition-colors">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                  </button>
                </div>
                
                {searchResult && (
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 text-[11px] text-slate-700 max-h-[300px] overflow-y-auto">
                    <div dangerouslySetInnerHTML={{ __html: searchResult.text.replace(/\n/g, '<br />') }}></div>
                    {searchResult.sources.length > 0 && (
                      <div className="mt-3 pt-2 border-t border-slate-200">
                        <p className="text-[9px] font-bold text-slate-400 uppercase mb-1">Fontes:</p>
                        {searchResult.sources.map((src, i) => (
                          <a key={i} href={src.web?.uri} target="_blank" className="block text-indigo-600 hover:underline truncate mb-1">
                            {src.web?.title || src.web?.uri}
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {!loading && activeTab === 'audio' && (
              <div className="bg-indigo-900 rounded-xl p-6 text-white text-center">
                 <div className={`w-12 h-12 mx-auto mb-4 rounded-full bg-indigo-800 flex items-center justify-center ${isPlaying ? 'animate-pulse' : ''}`}>
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"></path></svg>
                 </div>
                 <h3 className="font-bold text-xs uppercase mb-1">Resumo Narrado</h3>
                 <p className="text-[10px] text-indigo-300 mb-4 italic">Gemini explica seu custo e margem atual.</p>
                 <button 
                  onClick={handleGenerateAudio}
                  disabled={isPlaying}
                  className={`w-full py-2.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all ${isPlaying ? 'bg-slate-700' : 'bg-white text-indigo-900 hover:bg-indigo-50 shadow-lg'}`}
                 >
                   {isPlaying ? 'Narrando...' : 'Ouvir Agora'}
                 </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default GeminiAssistant;
