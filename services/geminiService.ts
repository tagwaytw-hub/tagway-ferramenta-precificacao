
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { SimulationInputs, SearchResult } from "../types";

// Helper to get AI instance with fresh key if needed
const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

// --- 1. Document Analysis (Receipt/Invoice Extraction) ---
// Now supports both Images and PDFs
export const analyzeInvoiceDocument = async (base64Data: string, mimeType: string): Promise<Partial<SimulationInputs> | null> => {
  const ai = getAI();
  
  // Prompt optimized for Brazilian invoices (NF-e, NFC-e, etc.)
  const prompt = `
    Analyze this Brazilian invoice/receipt (Nota Fiscal) and extract the following values. 
    Return a JSON object with these keys:
    - valorCompra (Total value of products / Valor Total Produtos)
    - ipiFrete (Sum of IPI + Freight / IPI + Frete, if listed, otherwise 0)
    - icmsInterestadual (ICMS rate on the invoice origin / Alíquota ICMS, usually 4, 7, or 12)
    - mva (MVA / IVA adjusted or original if listed, otherwise null)
    
    Notes:
    - If you cannot find a specific value, return null for that key. 
    - Focus strictly on numeric values.
    - For PDF files, read all pages to find the summary totals.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: {
        parts: [
          { inlineData: { mimeType, data: base64Data } },
          { text: prompt }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            valorCompra: { type: Type.NUMBER, nullable: true },
            ipiFrete: { type: Type.NUMBER, nullable: true },
            icmsInterestadual: { type: Type.NUMBER, nullable: true },
            mva: { type: Type.NUMBER, nullable: true }
          }
        }
      }
    });

    const text = response.text;
    if (!text) return null;
    return JSON.parse(text) as Partial<SimulationInputs>;
  } catch (error) {
    console.error("Error analyzing document:", error);
    throw error;
  }
};

// --- 2. Google Search Grounding (Tax Consultant) ---
export const searchTaxInfo = async (query: string): Promise<SearchResult> => {
  const ai = getAI();
  
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: query,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });

    const text = response.text || "";
    const sources = (response.candidates?.[0]?.groundingMetadata?.groundingChunks as any[]) || [];

    return { text, sources };
  } catch (error) {
    console.error("Error searching tax info:", error);
    throw error;
  }
};

// --- 3. Text-to-Speech (Audio Summary) ---
export const generateAudioSummary = async (text: string): Promise<AudioBuffer | null> => {
  const ai = getAI();

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: text }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Puck' },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    
    if (!base64Audio) {
      throw new Error("No audio data returned");
    }

    const outputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    
    const binaryString = atob(base64Audio);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    
    const audioBuffer = await decodeAudioData(bytes, outputAudioContext, 24000, 1);
    return audioBuffer;

  } catch (error) {
    console.error("Error generating speech:", error);
    throw error;
  }
};

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}
