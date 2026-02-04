import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { AspectRatio } from "../types";

const MODEL_NAME = 'gemini-3-pro-image-preview';

// ============================================================================
// ONDE COLOCAR SUA CHAVE DE API (Billing API Key)
// ============================================================================
// Por padrão, o app tenta ler do ambiente (process.env.API_KEY).
//
// Para colocar sua chave MANUALMENTE, apague "process.env.API_KEY" e cole
// sua chave entre aspas abaixo.
//
// Exemplo: const API_KEY = "AIzaSyD-sua-chave-aqui...";
// ============================================================================
const API_KEY = "AIzaSyB6poZ_TKzt3USPIX48wICRv42e3XEJrp8";

// Função auxiliar para limpar o prefixo data:image/...;base64, se existir
function cleanBase64(data: string): string {
  if (data.includes('base64,')) {
    return data.split('base64,')[1];
  }
  return data;
}

// Função para extrair o MimeType correto da string base64
function getMimeType(data: string): string {
  const match = data.match(/^data:(.*);base64,/);
  if (match && match[1]) {
    return match[1];
  }
  return 'image/png'; // Fallback
}

export async function generateImage(prompt: string, aspectRatio: AspectRatio, referenceImage?: string | null): Promise<{url: string, base64: string}> {
  if (!API_KEY) {
    throw new Error("Chave de API não configurada. Verifique o arquivo services/geminiService.ts");
  }

  const ai = new GoogleGenAI({ apiKey: API_KEY });
  
  const parts: any[] = [];

  // Se houver imagem de referência, ela deve ser a primeira parte do conteúdo
  if (referenceImage) {
    parts.push({
      inlineData: {
        data: cleanBase64(referenceImage),
        mimeType: getMimeType(referenceImage) // Detecta o tipo correto (jpeg, png, webp)
      }
    });
  }

  // Adiciona o prompt de texto
  let textPrompt = `Professional high-quality cover design. Topic: ${prompt}. 
                    Style: High-end graphic design, professional photography, clean composition, vibrant colors, 4k resolution.`;
  
  if (referenceImage) {
    textPrompt += " Use the attached image as a visual reference for composition, style, or color palette, but adapt it to the requested topic.";
  }

  parts.push({ text: textPrompt });
  
  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: {
        parts: parts
      },
      config: {
        imageConfig: {
          aspectRatio: aspectRatio as any,
          imageSize: "1K"
        }
      }
    });

    const imagePart = response.candidates?.[0]?.content?.parts.find(p => p.inlineData);
    
    if (!imagePart || !imagePart.inlineData) {
      // Se não houver imagem, verificamos se há texto explicando o erro (ex: filtro de segurança)
      const textPart = response.candidates?.[0]?.content?.parts.find(p => p.text);
      if (textPart) {
         throw new Error(`A API retornou texto em vez de imagem: ${textPart.text}`);
      }
      throw new Error("Falha na geração: Nenhuma imagem retornada. A imagem pode ter sido bloqueada por filtros de segurança.");
    }

    const base64 = imagePart.inlineData.data;
    const url = `data:image/png;base64,${base64}`;
    
    return { url, base64 };
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    throw new Error(error.message || "Erro desconhecido na API do Gemini.");
  }
}

export async function editImage(originalBase64: string, editPrompt: string, aspectRatio: AspectRatio): Promise<{url: string, base64: string}> {
  if (!API_KEY) {
    throw new Error("Chave de API não configurada. Verifique o arquivo services/geminiService.ts");
  }

  // Usando a constante API_KEY
  const ai = new GoogleGenAI({ apiKey: API_KEY });
  
  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: {
        parts: [
          {
            inlineData: {
              data: cleanBase64(originalBase64),
              mimeType: 'image/png' // Aqui assumimos PNG pois a imagem gerada internamente é PNG
            }
          },
          {
            text: `Edit this image precisely based on this instruction: "${editPrompt}".
                   Maintain the exact same composition, lighting, and style of the original image. 
                   Only modify the specific elements mentioned in the instruction.`
          }
        ]
      },
      config: {
        imageConfig: {
          aspectRatio: aspectRatio as any,
          imageSize: "1K"
        }
      }
    });

    const imagePart = response.candidates?.[0]?.content?.parts.find(p => p.inlineData);
    
    if (!imagePart || !imagePart.inlineData) {
       const textPart = response.candidates?.[0]?.content?.parts.find(p => p.text);
       if (textPart) {
         throw new Error(`Erro na edição: ${textPart.text}`);
       }
      throw new Error("Falha na edição: Nenhuma imagem retornada.");
    }

    const base64 = imagePart.inlineData.data;
    const url = `data:image/png;base64,${base64}`;
    
    return { url, base64 };
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    throw new Error(error.message || "Erro desconhecido ao editar imagem.");
  }
}