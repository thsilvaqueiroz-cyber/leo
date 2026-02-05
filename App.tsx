import React, { useState, useRef } from 'react';
import { AppState, GeneratedImage, AspectRatio } from './types';
import { generateImage } from './services/geminiService';
import { ImageCard } from './components/ImageCard';

const App: React.FC = () => {
  const [state, setState] = useState<AppState>({
    mainPrompt: '',
    selectedRatio: '1:1',
    images: [],
    isGeneratingAll: false,
    referenceImage: null
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setState(prev => ({ ...prev, referenceImage: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const removeReferenceImage = () => {
    setState(prev => ({ ...prev, referenceImage: null }));
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleGenerateAll = async () => {
    if (!state.mainPrompt.trim()) return;

    setState(prev => ({
      ...prev,
      isGeneratingAll: true,
      images: Array(3).fill(null).map((_, i) => ({
        id: `loading-${i}`,
        url: '',
        base64: '',
        prompt: state.mainPrompt,
        status: 'loading',
        aspectRatio: state.selectedRatio
      }))
    }));

    const generationTasks = [0, 1, 2].map(async (i) => {
      try {
        const result = await generateImage(state.mainPrompt, state.selectedRatio, state.referenceImage);
        return {
          id: `img-${Date.now()}-${i}`,
          url: result.url,
          base64: result.base64,
          prompt: state.mainPrompt,
          status: 'success',
          aspectRatio: state.selectedRatio
        } as GeneratedImage;
      } catch (error: any) {
        console.error("Erro na geração:", error);
        return {
          id: `error-${i}`,
          url: '',
          base64: '',
          prompt: state.mainPrompt,
          status: 'error',
          errorMessage: 'Erro na geração',
          aspectRatio: state.selectedRatio
        } as GeneratedImage;
      }
    });

    const results = await Promise.all(generationTasks);
    setState(prev => ({
      ...prev,
      images: results,
      isGeneratingAll: false
    }));
  };

  const handleUpdateImage = (updated: GeneratedImage) => {
    setState(prev => ({
      ...prev,
      images: prev.images.map(img => img.id === updated.id ? updated : img)
    }));
  };

  return (
    <div className="min-h-screen bg-[#fcfdfe] pb-24 font-['Inter']">
      {/* Navbar */}
      <nav className="bg-white/80 backdrop-blur-xl border-b border-slate-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-200">
              <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24">
                <path d="M4 5a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V7a2 2 0 00-2-2H4zm0 2h12v3.172l-1.414-1.414a2 2 0 00-2.828 0L9 11.586l-1.293-1.293a2 2 0 00-2.828 0L4 11.172V7zm0 6.828l2.293-2.293a2 2 0 012.828 0l1.293 1.293a2 2 0 010 2.828l-2.293 2.293H4v-4.128zm12 4.128h-3.172l2.293-2.293a2 2 0 012.828 0l.293.293v2zm-2-12a1 1 0 100-2 1 1 0 000 2z" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-900 leading-none">CoverGen</h1>
              <span className="text-[10px] font-bold text-blue-500 uppercase tracking-[0.2em]">Studio Nano Pro</span>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-3">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Motorizado por</span>
            <span className="bg-blue-50 text-blue-600 px-3 py-1 rounded-full text-xs font-black">GEMINI 3 PRO IMAGE</span>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 mt-12">
        {/* Editor Section */}
        <section className="bg-white rounded-[2.5rem] shadow-2xl shadow-slate-200/50 p-6 md:p-12 border border-slate-50 mb-16 relative overflow-hidden">
          <div className="max-w-4xl mx-auto relative z-10">
            <div className="text-center mb-8">
              <h2 className="text-3xl md:text-5xl font-black text-slate-900 mb-4 tracking-tight">O que vamos criar hoje?</h2>
              <p className="text-slate-500 text-base md:text-lg font-medium">
                Descreva sua ideia para uma capa e gere 3 versões únicas.
              </p>
            </div>

            <div className="space-y-6">
              {/* Aspect Ratio Selector */}
              <div className="flex flex-wrap justify-center gap-3 md:gap-4">
                {(['1:1', '16:9', '9:16'] as AspectRatio[]).map((ratio) => (
                  <button
                    key={ratio}
                    onClick={() => setState(prev => ({ ...prev, selectedRatio: ratio }))}
                    className={`px-4 py-2 md:px-6 md:py-3 rounded-2xl font-bold text-xs md:text-sm transition-all border-2 ${
                      state.selectedRatio === ratio 
                      ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-200' 
                      : 'bg-white border-slate-100 text-slate-500 hover:border-slate-200'
                    }`}
                  >
                    {ratio === '1:1' ? 'Quadrado (1:1)' : ratio === '16:9' ? 'Horizontal (16:9)' : 'Vertical (9:16)'}
                  </button>
                ))}
              </div>

              {/* Prompt Input Container - New Layout */}
              <div className="bg-slate-50 border-2 border-slate-100 rounded-[2rem] overflow-hidden focus-within:border-blue-500 focus-within:bg-white transition-all shadow-inner flex flex-col">
                
                {/* 1. Text Area */}
                <textarea
                  value={state.mainPrompt}
                  onChange={(e) => setState(prev => ({ ...prev, mainPrompt: e.target.value }))}
                  placeholder="Ex: Uma capa vibrante para um canal de tecnologia sobre IA, fundo com neon azul e cérebro digital 3D..."
                  className="w-full bg-transparent border-none p-6 md:p-8 text-lg md:text-xl font-medium outline-none h-40 md:h-48 resize-none placeholder-slate-300"
                />

                {/* 2. Toolbar / Actions Area */}
                <div className="bg-slate-100/50 p-4 border-t border-slate-100 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
                  
                  {/* Reference Image Controls */}
                  <div className="flex-shrink-0">
                    <input 
                      type="file" 
                      ref={fileInputRef}
                      onChange={handleImageUpload}
                      accept="image/*"
                      className="hidden"
                    />
                    
                    {state.referenceImage ? (
                      <div className="flex items-center gap-3 bg-white p-2 pr-4 rounded-xl border border-slate-200 shadow-sm w-full md:w-auto">
                        <div className="relative group w-12 h-12 flex-shrink-0">
                          <img 
                            src={state.referenceImage} 
                            alt="Reference" 
                            className="w-full h-full object-cover rounded-lg" 
                          />
                        </div>
                        <div className="flex flex-col flex-1 min-w-0">
                          <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Referência Ativa</span>
                          <span className="text-[10px] text-slate-400 truncate">Imagem carregada</span>
                        </div>
                        <button
                          onClick={removeReferenceImage}
                          className="text-slate-400 hover:text-red-500 p-2 transition-colors"
                          title="Remover referência"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="flex items-center justify-center gap-2 px-6 py-3 bg-white hover:bg-blue-50 text-slate-600 hover:text-blue-600 rounded-xl text-sm font-bold shadow-sm border border-slate-200 transition-all w-full md:w-auto"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        Anexar Referência
                      </button>
                    )}
                  </div>

                  {/* Generate Button */}
                  <button
                    onClick={handleGenerateAll}
                    disabled={state.isGeneratingAll || !state.mainPrompt.trim()}
                    className={`py-3 md:py-4 px-8 md:px-10 rounded-xl font-black text-white text-sm md:text-base transition-all transform active:scale-95 shadow-lg w-full md:w-auto ${
                      state.isGeneratingAll || !state.mainPrompt.trim() 
                      ? 'bg-slate-300 cursor-not-allowed shadow-none' 
                      : 'bg-blue-600 hover:bg-blue-700 shadow-blue-200 hover:-translate-y-1'
                    }`}
                  >
                    {state.isGeneratingAll ? (
                      <div className="flex items-center justify-center gap-3">
                        <div className="w-5 h-5 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
                        Processando...
                      </div>
                    ) : (
                      'Gerar 3 Opções'
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Display Grid */}
        {state.images.length > 0 && (
          <section className="animate-in fade-in slide-in-from-bottom-10 duration-1000">
            <div className="flex items-center justify-between mb-10">
              <h3 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-3">
                <div className="w-2 h-8 bg-blue-600 rounded-full"></div>
                Galeria de Opções
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
              {state.images.map((image) => (
                <ImageCard 
                  key={image.id} 
                  image={image} 
                  onUpdate={handleUpdateImage}
                  onResetKey={() => {}}
                />
              ))}
            </div>
          </section>
        )}

        {/* Empty State */}
        {state.images.length === 0 && !state.isGeneratingAll && (
          <div className="text-center py-20 bg-slate-50/50 rounded-[3rem] border-4 border-dashed border-slate-100">
            <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
              <svg className="w-12 h-12 text-slate-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <p className="text-xl font-bold text-slate-300">Descreva sua capa (e anexe uma referência) para começar.</p>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-32 py-12 border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <p className="text-slate-400 text-sm font-bold tracking-widest uppercase">
            Criado com Gemini 3 Pro &bull; {new Date().getFullYear()} CoverGen
          </p>
        </div>
      </footer>
    </div>
  );
};

export default App;