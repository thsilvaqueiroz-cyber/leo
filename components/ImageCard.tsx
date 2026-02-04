
import React, { useState } from 'react';
import { GeneratedImage } from '../types';
import { editImage } from '../services/geminiService';

interface ImageCardProps {
  image: GeneratedImage;
  onUpdate: (updatedImage: GeneratedImage) => void;
  onResetKey: () => void;
}

export const ImageCard: React.FC<ImageCardProps> = ({ image, onUpdate, onResetKey }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [refinePrompt, setRefinePrompt] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRefine = async () => {
    if (!refinePrompt.trim()) return;
    
    setLoading(true);
    try {
      const result = await editImage(image.base64, refinePrompt, image.aspectRatio);
      onUpdate({
        ...image,
        url: result.url,
        base64: result.base64,
        prompt: `${image.prompt} (Ajustado: ${refinePrompt})`
      });
      setIsEditing(false);
      setRefinePrompt('');
    } catch (error: any) {
      if (error.message === "AUTH_REQUIRED") {
        onResetKey();
      }
      console.error("Erro ao refinar:", error);
    } finally {
      setLoading(false);
    }
  };

  if (image.status === 'loading') {
    return (
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden flex flex-col h-[480px] border border-slate-100">
        <div className="w-full h-3/4 animate-shimmer" />
        <div className="p-5 flex-1 space-y-3">
          <div className="h-4 w-3/4 bg-slate-100 rounded animate-shimmer" />
          <div className="h-4 w-1/2 bg-slate-100 rounded animate-shimmer" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden flex flex-col border border-slate-100 transition-all hover:shadow-2xl group">
      <div className={`relative overflow-hidden bg-slate-900 flex items-center justify-center ${image.aspectRatio === '16:9' ? 'aspect-video' : image.aspectRatio === '9:16' ? 'aspect-[9/16]' : 'aspect-square'}`}>
        <img 
          src={image.url} 
          alt={image.prompt} 
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
        />
        {loading && (
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md flex flex-col items-center justify-center">
            <div className="w-12 h-12 border-4 border-blue-400 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-white font-bold tracking-tight">Recriando...</p>
          </div>
        )}
      </div>

      <div className="p-5 flex flex-col flex-1 gap-4">
        {isEditing ? (
          <div className="space-y-4">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">O que você quer mudar?</label>
            <textarea
              value={refinePrompt}
              onChange={(e) => setRefinePrompt(e.target.value)}
              placeholder="Ex: 'Mude as flores para rosas vermelhas' ou 'Fundo mais escuro'"
              className="w-full text-sm border-2 border-slate-50 bg-slate-50 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none h-24 resize-none transition-all"
            />
            <div className="flex gap-2">
              <button
                onClick={handleRefine}
                disabled={loading}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-xl text-sm transition-all active:scale-95"
              >
                Aplicar Ajuste
              </button>
              <button
                onClick={() => setIsEditing(false)}
                className="px-4 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold py-2.5 rounded-xl text-sm transition-all"
              >
                Voltar
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="space-y-1">
               <p className="text-slate-800 text-sm font-medium line-clamp-2 leading-relaxed">
                {image.prompt}
              </p>
            </div>
            <div className="flex gap-2 mt-auto pt-4">
              <button
                onClick={() => setIsEditing(true)}
                className="flex-1 bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 rounded-xl text-xs flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg shadow-slate-200"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Personalizar
              </button>
              <a
                href={image.url}
                download={`cover-${image.id}.png`}
                className="p-3 bg-slate-100 hover:bg-blue-100 text-slate-600 hover:text-blue-600 rounded-xl transition-all"
                title="Download"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
              </a>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
