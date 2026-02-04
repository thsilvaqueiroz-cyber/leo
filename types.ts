
export type AspectRatio = "1:1" | "16:9" | "9:16" | "4:3" | "3:4";

export interface GeneratedImage {
  id: string;
  url: string;
  base64: string;
  prompt: string;
  status: 'loading' | 'success' | 'error';
  errorMessage?: string;
  aspectRatio: AspectRatio;
}

export interface AppState {
  mainPrompt: string;
  selectedRatio: AspectRatio;
  images: GeneratedImage[];
  isGeneratingAll: boolean;
  apiKeySelected: boolean;
  referenceImage: string | null; // Data URL da imagem de referência
}
