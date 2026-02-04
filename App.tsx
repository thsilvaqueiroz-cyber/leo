import React, { useState, useEffect, useCallback, useRef } from 'react';
import { AppState, GeneratedImage, AspectRatio } from './types';
import { generateImage } from './services/geminiService';
import { ImageCard } from './components/ImageCard';

const App: React.FC = () => {
  const [state, setState] = useState<AppState>({
    mainPrompt: '',
    selectedRatio: '1:1',
    images: [],
    isGeneratingAll: false,
    apiKeySelected: false,
    referenceImage: null
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  const checkApiKey = useCallback(async () => {
    try {
      const hasKey = await (window as any).aistudio.hasSelectedApiKey();
      setState(prev => ({ ...prev, apiKeySelected: hasKey }));
    } catch (e) {
      console.error("Erro ao verificar chave:", e);
    }
  }, []);

  useEffect(() => {
    checkApiKey();
  }, [checkApiKey]);

  const handleOpenSelectKey = async () => {
    try {
      await (window as any).aistudio.openSelectKey();
      setState(prev => ({ ...prev, apiKeySelected: true }));
    } catch (e) {
      console.error("Erro ao abrir seletor:", e);
    }
  };

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
        // Passamos a imagem de referência aqui
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
        if (error.message === "AUTH_REQUIRED") {
          setState(p => ({ ...p, apiKeySelected: false }));
        }
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

  if (!state.apiKeySelected) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-[2rem] shadow-2xl p-10 text-center border border-slate-100 transform transition-all">
          <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-inner">
            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
            </svg>
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 mb-3 tracking-tight">Ative o Gemini Pro</h1>
          <p className="text-slate-500 mb-10 leading-relaxed font-medium">
            O modelo <strong>Nano Banana Pro</strong> exige uma chave de API paga do Google Cloud. Selecione o seu projeto para começar.
          </p>
          <button
            onClick={handleOpenSelectKey}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-8 rounded-2xl transition-all shadow-xl shadow-blue-200 hover:shadow-blue-300 active:scale-95 text-lg"
          >
            Selecionar Chave de API
          </button>
          <div className="mt-8 flex flex-col gap-2">
            <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noreferrer" className="text-sm font-bold text-blue-600 hover:text-blue-800 transition-colors">
              Como configurar o faturamento?
            </a>
          </div>
        </div>
      </div>
    );
  }

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
        <section className="bg-white rounded-[2.5rem] shadow-2xl shadow-slate-200/50 p-8 md:p-12 border border-slate-50 mb-16 relative overflow-hidden">
          <div className="max-w-4xl mx-auto text-center relative z-10">
            <h2 className="text-4xl md:text-5xl font-black text-slate-900 mb-6 tracking-tight">O que vamos criar hoje?</h2>
            <p className="text-slate-500 text-lg mb-12 font-medium">
              Descreva sua ideia para uma capa e gere 3 versões únicas. <br/>Use uma referência para melhores resultados.
            </p>

            <div className="space-y-8">
              {/* Aspect Ratio Selector */}
              <div className="flex flex-wrap justify-center gap-4">
                {(['1:1', '16:9', '9:16'] as AspectRatio[]).map((ratio) => (
                  <button
                    key={ratio}
                    onClick={() => setState(prev => ({ ...prev, selectedRatio: ratio }))}
                    className={`px-6 py-3 rounded-2xl font-bold text-sm transition-all border-2 ${
                      state.selectedRatio === ratio 
                      ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-200' 
                      : 'bg-white border-slate-100 text-slate-500 hover:border-slate-200'
                    }`}
                  >
                    {ratio === '1:1' ? 'Quadrado (1:1)' : ratio === '16:9' ? 'Horizontal (16:9)' : 'Vertical (9:16)'}
                  </button>
                ))}
              </div>

              {/* Prompt Input Container */}
              <div className="relative group">
                 <div className="absolute top-4 right-4 z-20 flex gap-2">
                    <input 
                      type="file" 
                      ref={fileInputRef}
                      onChange={handleImageUpload}
                      accept="image/*"
                      className="hidden"
                    />
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur hover:bg-white text-slate-600 hover:text-blue-600 rounded-xl text-sm font-bold shadow-sm border border-slate-200 transition-all"
                      title="Anexar imagem de referência"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                      </svg>
                      {state.referenceImage ? 'Trocar Referência' : 'Anexar Referência'}
                    </button>
                 </div>

                <textarea
                  value={state.mainPrompt}
                  onChange={(e) => setState(prev => ({ ...prev, mainPrompt: e.target.value }))}
                  placeholder="Ex: Uma capa vibrante para um canal de tecnologia sobre IA, fundo com neon azul e cérebro digital 3D..."
                  className="w-full bg-slate-50 border-2 border-slate-100 rounded-[2rem] p-8 pt-16 text-lg md:text-xl font-medium focus:bg-white focus:border-blue-500 outline-none transition-all h-56 resize-none shadow-inner placeholder-slate-300"
                />

                {/* Reference Image Preview */}
                {state.referenceImage && (
                  <div className="absolute top-16 right-8 w-24 h-24 rounded-xl overflow-hidden border-2 border-white shadow-lg group-hover:scale-105 transition-transform">
                     <img src={state.referenceImage} alt="Reference" className="w-full h-full object-cover" />
                     <button 
                        onClick={removeReferenceImage}
                        className="absolute top-1 right-1 bg-black/50 hover:bg-red-500 text-white p-1 rounded-full transition-colors"
                     >
                       <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12"></path></svg>
                     </button>
                  </div>
                )}

                <button
                  onClick={handleGenerateAll}
                  disabled={state.isGeneratingAll || !state.mainPrompt.trim()}
                  className={`absolute bottom-6 right-6 py-4 px-10 rounded-2xl font-black text-white transition-all transform active:scale-95 shadow-xl ${
                    state.isGeneratingAll || !state.mainPrompt.trim() 
                    ? 'bg-slate-300 cursor-not-allowed shadow-none' 
                    : 'bg-blue-600 hover:bg-blue-700 shadow-blue-200 hover:-translate-y-1'
                  }`}
                >
                  {state.isGeneratingAll ? (
                    <div className="flex items-center gap-3">
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
                  onResetKey={() => setState(p => ({ ...p, apiKeySelected: false }))}
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