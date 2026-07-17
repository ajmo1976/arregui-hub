import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { X, Loader2 } from 'lucide-react';

interface BarcodeScannerModalProps {
    onScan: (decodedText: string) => void;
    onClose: () => void;
}

const BarcodeScannerModal: React.FC<BarcodeScannerModalProps> = ({ onScan, onClose }) => {
    const [isStarting, setIsStarting] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const onScanRef = useRef(onScan);
    
    useEffect(() => {
        onScanRef.current = onScan;
    }, [onScan]);


    useEffect(() => {
        const html5QrCode = new Html5Qrcode("reader");
        let isComponentMounted = true;
        let isStartPending = true;

        const startScanner = async () => {
            try {
                if (!isComponentMounted) return;

                const config = {
                    fps: 10,
                    qrbox: { width: 250, height: 150 },
                    aspectRatio: 1.0,
                };

                const onScanSuccess = (decodedText: string) => {
                    if (isComponentMounted) onScanRef.current(decodedText);
                };
                
                const onScanError = () => {};

                let started = false;
                let lastError = null;

                // Attempt 1: Environment (Best for mobile)
                try {
                    await new Promise(r => setTimeout(r, 100)); // Debounce for StrictMode
                    if (!isComponentMounted) return;
                    await html5QrCode.start({ facingMode: "environment" }, config, onScanSuccess, onScanError);
                    started = true;
                } catch (e1) {
                    console.warn("Failed facingMode environment", e1);
                    lastError = e1;
                    
                    // Attempt 2: User (Best for desktop webcams)
                    try {
                        if (!isComponentMounted) return;
                        await html5QrCode.start({ facingMode: "user" }, config, onScanSuccess, onScanError);
                        started = true;
                    } catch (e2) {
                        console.warn("Failed facingMode user", e2);
                        lastError = e2;
                        
                        // Attempt 3: Explicit devices
                        try {
                            const devices = await Html5Qrcode.getCameras();
                            if (devices && devices.length > 0) {
                                for (const device of devices) {
                                    try {
                                        if (!isComponentMounted) return;
                                        await html5QrCode.start(device.id, config, onScanSuccess, onScanError);
                                        started = true;
                                        break;
                                    } catch (e3) {
                                        console.warn(`Failed camera ${device.id}`, e3);
                                        lastError = e3;
                                    }
                                }
                            }
                        } catch (e4) {
                            console.warn("Failed getCameras", e4);
                        }
                    }
                }

                if (!started) {
                    throw lastError || new Error("No se pudo iniciar la cámara en este dispositivo.");
                }

                isStartPending = false;
                if (!isComponentMounted) {
                    if (html5QrCode.isScanning) {
                        html5QrCode.stop().then(() => html5QrCode.clear()).catch(console.error);
                    }
                } else {
                    setIsStarting(false);
                }
            } catch (err: any) {
                isStartPending = false;
                console.error("Error starting scanner", err);
                if (isComponentMounted) {
                    setIsStarting(false);
                    setError(err?.message || "No se pudo acceder a la cámara. Verifique los permisos.");
                }
            }
        };

        startScanner();

        return () => {
            isComponentMounted = false;
            if (html5QrCode.isScanning) {
                html5QrCode.stop().then(() => {
                    html5QrCode.clear();
                }).catch(console.error);
            } else if (!isStartPending) {
                try {
                    html5QrCode.clear();
                } catch (e) {}
            }
            // If isStartPending is true, the .then() block will handle the cleanup.
        };
    }, []);

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[999] flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 w-full max-w-md rounded-[2rem] shadow-2xl overflow-hidden flex flex-col relative">
                
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
                    <h3 className="text-lg font-black text-gray-900 dark:text-white">
                        Escanear Código
                    </h3>
                    <button 
                        onClick={onClose} 
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors text-gray-500"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Scanner Container */}
                <div className="p-4 bg-gray-50 dark:bg-gray-900">
                    {error ? (
                        <div className="text-center p-4 bg-red-50 text-red-600 rounded-xl text-sm font-medium">
                            {error}
                        </div>
                    ) : (
                        <>
                            <p className="text-xs text-center text-gray-500 mb-4 font-medium">
                                Apunta la cámara al código de barras o QR
                            </p>
                            <div className="rounded-xl overflow-hidden shadow-inner bg-black relative min-h-[250px] flex items-center justify-center">
                                {isStarting && (
                                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 text-white z-10">
                                        <Loader2 className="animate-spin mb-2" size={24} />
                                        <span className="text-xs">Iniciando cámara...</span>
                                    </div>
                                )}
                                <div id="reader" className="w-full"></div>
                            </div>
                        </>
                    )}
                </div>

                {/* Footer instructions */}
                <div className="px-6 py-4 text-center text-xs text-gray-400 bg-gray-50 dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700">
                    El escaneo se realizará automáticamente.
                </div>
            </div>
        </div>
    );
};

export default BarcodeScannerModal;
