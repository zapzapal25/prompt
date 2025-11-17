
import React, { useState, useCallback, useRef } from 'react';
import { generatePromptFromVideo, AiPrompts } from './services/geminiService';
import { UploadIcon, CopyIcon, CheckIcon, FilmIcon, WandIcon, TiktokIcon } from './components/icons';

type ModelType = 'veo' | 'sora' | 'kling';

const App: React.FC = () => {
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreviewUrl, setVideoPreviewUrl] = useState<string | null>(null);
  const [generatedPrompt, setGeneratedPrompt] = useState<AiPrompts | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<ModelType>('veo');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('video/')) {
      setVideoFile(file);
      const url = URL.createObjectURL(file);
      setVideoPreviewUrl(url);
      setGeneratedPrompt(null);
      setError(null);
    } else {
      setError('Silakan pilih file video yang valid.');
      setVideoFile(null);
      setVideoPreviewUrl(null);
    }
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    const file = event.dataTransfer.files?.[0];
    if (file && file.type.startsWith('video/')) {
        setVideoFile(file);
        const url = URL.createObjectURL(file);
        setVideoPreviewUrl(url);
        setGeneratedPrompt(null);
        setError(null);
    } else {
        setError('Silakan pilih file video yang valid.');
        setVideoFile(null);
        setVideoPreviewUrl(null);
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      event.stopPropagation();
  };

  const handleGeneratePrompt = useCallback(async () => {
    if (!videoFile) return;

    setIsLoading(true);
    setError(null);
    setGeneratedPrompt(null);

    try {
      const prompts = await generatePromptFromVideo(videoFile);
      setGeneratedPrompt(prompts);
      setActiveTab('veo');
    } catch (err: any) {
      setError(`Gagal menghasilkan prompt: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  }, [videoFile]);
  
  const handleCopyPrompt = () => {
    if (generatedPrompt && generatedPrompt[activeTab]) {
        navigator.clipboard.writeText(generatedPrompt[activeTab]).then(() => {
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2000);
        });
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const getTabClassName = (tabName: ModelType) => {
    const baseClasses = "px-4 py-2 text-sm font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-indigo-500";
    if (activeTab === tabName) {
        return `${baseClasses} bg-indigo-600 text-white`;
    }
    return `${baseClasses} text-gray-300 bg-gray-700 hover:bg-gray-600`;
  };
  
  const modelNames: Record<ModelType, string> = {
      veo: "Veo 3.1",
      sora: "Sora",
      kling: "Kling AI"
  };

  return (
    <div className="min-h-screen bg-transparent text-gray-200 flex flex-col items-center p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-4xl mx-auto flex flex-col flex-grow">
        <header className="text-center mb-8 sm:mb-12">
            <div className="flex items-center justify-center gap-3 sm:gap-4 mb-3">
                <WandIcon className="w-8 h-8 sm:w-10 sm:h-10 text-indigo-400"/>
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-500">
                    Clone Prompt by Imernow
                </h1>
            </div>
          <p className="text-gray-400 mt-2 max-w-2xl mx-auto text-sm sm:text-base">
            Unggah video untuk secara instan menghasilkan prompt yang disesuaikan untuk Veo, Sora, & Kling AI.
          </p>
        </header>

        <main className="space-y-8 flex-grow">
          <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4 sm:p-6 shadow-lg backdrop-blur-sm">
            <h2 className="text-xl sm:text-2xl font-semibold mb-4 text-white flex items-center gap-2"><span className="text-indigo-400 font-bold">1.</span> Unggah Video Anda</h2>
            <div 
              className="border-2 border-dashed border-gray-600 rounded-lg p-8 text-center cursor-pointer hover:border-indigo-500 hover:bg-gray-800/50 transition-colors"
              onClick={triggerFileInput}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="video/*"
                className="hidden"
              />
              <div className="flex flex-col items-center text-gray-400">
                  <UploadIcon className="w-10 h-10 sm:w-12 sm:h-12 mb-4"/>
                  <p className="font-semibold text-gray-300 text-sm sm:text-base">Seret & letakkan video di sini</p>
                  <p className="text-sm sm:text-base">atau klik untuk memilih file</p>
                  <p className="text-xs mt-2">(Maks. 50MB)</p>
              </div>
            </div>

            {videoPreviewUrl && (
              <div className="mt-6">
                <h3 className="font-semibold mb-2 text-lg">Pratinjau Video:</h3>
                <video
                  src={videoPreviewUrl}
                  controls
                  className="w-full max-h-80 rounded-lg bg-black"
                />
              </div>
            )}
          </div>
          
          <div className="flex justify-center">
            <button
                onClick={handleGeneratePrompt}
                disabled={!videoFile || isLoading}
                className="flex items-center justify-center gap-3 px-6 py-3 sm:px-8 sm:py-4 text-base sm:text-lg bg-indigo-600 text-white font-bold rounded-lg shadow-lg hover:bg-indigo-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-all transform hover:scale-105 disabled:scale-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-indigo-500"
            >
                {isLoading ? (
                    <>
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Menghasilkan...
                    </>
                ) : (
                    <>
                        <FilmIcon className="w-6 h-6" />
                        Hasilkan Prompt
                    </>
                )}
            </button>
          </div>

          {error && <div className="bg-red-900/50 border border-red-700 text-red-300 px-4 py-3 rounded-lg text-center">{error}</div>}

          {generatedPrompt && (
            <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4 sm:p-6 shadow-lg animate-fade-in backdrop-blur-sm">
              <h2 className="text-xl sm:text-2xl font-semibold mb-4 text-white flex items-center gap-2">
                <span className="text-indigo-400 font-bold">2.</span> Prompt yang Dihasilkan
              </h2>
              
              <div className="mb-4 flex space-x-2">
                {(Object.keys(generatedPrompt) as ModelType[]).map((model) => (
                    <button
                        key={model}
                        onClick={() => {
                            setActiveTab(model);
                            setIsCopied(false);
                        }}
                        className={getTabClassName(model)}
                    >
                        {modelNames[model]}
                    </button>
                ))}
              </div>

              <div className="relative bg-gray-900/70 p-4 rounded-md min-h-[150px]">
                <p className="text-gray-300 whitespace-pre-wrap font-mono text-sm leading-relaxed">
                  {generatedPrompt[activeTab]}
                </p>
                <button
                    onClick={handleCopyPrompt}
                    className="absolute top-2 right-2 p-2 bg-gray-700 rounded-md hover:bg-gray-600 transition-colors"
                    title={`Salin Prompt untuk ${modelNames[activeTab]}`}
                >
                    {isCopied ? <CheckIcon className="w-5 h-5 text-green-400"/> : <CopyIcon className="w-5 h-5 text-gray-400"/>}
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-2">Catatan: Setiap prompt disesuaikan untuk model AI yang berbeda. Pilih salah satu yang paling sesuai dengan kebutuhan Anda.</p>
            </div>
          )}

        </main>

        <footer className="text-center mt-8 sm:mt-12 py-4">
            <a 
                href="https://www.tiktok.com/@imamazharz" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-gray-400 hover:text-indigo-400 transition-colors"
            >
                <TiktokIcon className="w-5 h-5"/>
                <span className="font-medium text-sm">Follow Tiktok: imamazharz</span>
            </a>
        </footer>
      </div>
    </div>
  );
};

export default App;