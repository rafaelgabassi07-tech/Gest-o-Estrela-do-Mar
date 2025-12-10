
import React, { useEffect, useState } from 'react';

interface BarcodeScannerProps {
  onScan: (decodedText: string) => void;
  onClose: () => void;
}

const BarcodeScanner: React.FC<BarcodeScannerProps> = ({ onScan, onClose }) => {
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Dynamically access the library from window since it's loaded via script tag
    const html5QrcodeScanner = new (window as any).Html5Qrcode("reader");

    const qrCodeSuccessCallback = (decodedText: string, decodedResult: any) => {
      // Play a beep sound
      const audio = new Audio('https://actions.google.com/sounds/v1/alarms/beep_short.ogg');
      audio.play().catch(e => console.log('Audio play failed', e));
      
      onScan(decodedText);
      
      // Stop scanning after success to prevent multiple triggers
      html5QrcodeScanner.stop().catch((err: any) => console.error("Failed to stop", err));
    };

    const config = { 
        fps: 10, 
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0
    };

    // Start scanning - Prefer back camera
    html5QrcodeScanner.start(
        { facingMode: "environment" }, 
        config, 
        qrCodeSuccessCallback,
        (errorMessage: string) => {
            // parse error, ignore it.
        }
    ).catch((err: any) => {
        setError("Erro ao iniciar câmera. Verifique permissões.");
        console.error(err);
    });

    return () => {
        if(html5QrcodeScanner.isScanning) {
            html5QrcodeScanner.stop().catch((err: any) => console.error("Failed to stop on unmount", err));
        }
    };
  }, [onScan]);

  return (
    <div className="fixed inset-0 z-[70] bg-black flex flex-col items-center justify-center">
        <div className="absolute top-4 right-4 z-50">
            <button onClick={onClose} className="bg-white/20 text-white p-3 rounded-full hover:bg-white/30 backdrop-blur-sm">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>
        </div>
        
        <div className="w-full max-w-md px-4">
             <h3 className="text-white text-center font-bold mb-4 text-lg">Aponte para o código de barras</h3>
             <div id="reader" className="w-full rounded-2xl overflow-hidden border-2 border-white/20 bg-black"></div>
             {error && <p className="text-red-400 text-center mt-4 font-bold bg-red-900/20 p-2 rounded-lg">{error}</p>}
             <p className="text-gray-400 text-xs text-center mt-6">Posicione o código dentro do quadrado.</p>
        </div>
    </div>
  );
};

export default BarcodeScanner;
