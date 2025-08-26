import { useState, useRef, useEffect, useCallback } from 'react';
import { PDF417HealthcareParser } from '@/lib/pdf417-parser';
import { ParsedBarcodeData } from '@/types/healthcare';

interface RealTimeBarcodeScannerProps {
    width?: number;
    height?: number;
    facingMode?: 'user' | 'environment';
    onBarcodeDetected?: (parsedData: ParsedBarcodeData) => void;
    onError?: (error: string) => void;
    autoStopOnDetection?: boolean;
    scanInterval?: number; // milliseconds between scan attempts
}

const RealTimeBarcodeScanner: React.FC<RealTimeBarcodeScannerProps> = ({
    width = 640,
    height = 480,
    facingMode = 'environment',
    onBarcodeDetected,
    onError,
    autoStopOnDetection = true,
    scanInterval = 1000, // 1 second between scans
}) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const readerRef = useRef<any>(null);
    const parserRef = useRef<PDF417HealthcareParser | null>(null);
    const scanIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const isScanningRef = useRef(false);

    const [isStreaming, setIsStreaming] = useState(false);
    const [isScanning, setIsScanning] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [lastScannedData, setLastScannedData] = useState<ParsedBarcodeData | null>(null);
    const [scanCount, setScanCount] = useState(0);

    // Initialize ZXing reader and parser
    useEffect(() => {
        const initializeScanner = async () => {
            try {
                const { BrowserPDF417Reader } = await import('@zxing/library');
                readerRef.current = new BrowserPDF417Reader();
                parserRef.current = new PDF417HealthcareParser();
                console.log('[RealTimeBarcodeScanner] Initialized ZXing reader and PDF417 parser');
            } catch (err) {
                console.error('[RealTimeBarcodeScanner] Failed to initialize:', err);
                setError('Failed to initialize barcode scanner');
                onError?.('Failed to initialize barcode scanner');
            }
        };

        initializeScanner();

        return () => {
            if (scanIntervalRef.current) {
                clearInterval(scanIntervalRef.current);
            }
        };
    }, [onError]);

    const startCamera = async () => {
        if (isStreaming) return;

        setIsLoading(true);
        setError(null);

        try {
            const constraints: MediaStreamConstraints = {
                video: {
                    width: { ideal: width },
                    height: { ideal: height },
                    facingMode: facingMode,
                },
                audio: false,
            };

            const stream = await navigator.mediaDevices.getUserMedia(constraints);

            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                streamRef.current = stream;
                setIsStreaming(true);
                console.log('[RealTimeBarcodeScanner] Camera started successfully');
            }
        } catch (err) {
            const errorMessage =
                err instanceof Error ? err.message : 'Failed to access camera';
            setError(errorMessage);
            onError?.(errorMessage);
            console.error('[RealTimeBarcodeScanner] Camera access error:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const stopCamera = useCallback(() => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }

        if (videoRef.current) {
            videoRef.current.srcObject = null;
        }

        if (scanIntervalRef.current) {
            clearInterval(scanIntervalRef.current);
            scanIntervalRef.current = null;
        }

        setIsStreaming(false);
        setIsScanning(false);
        isScanningRef.current = false;
        console.log('[RealTimeBarcodeScanner] Camera stopped');
    }, []);

    const switchCamera = async () => {
        if (!isStreaming) return;

        const newFacingMode = facingMode === 'user' ? 'environment' : 'user';
        stopCamera();

        // Start new stream with different facing mode
        setTimeout(() => {
            startCamera();
        }, 100);
    };



    const scanFrame = useCallback(async () => {
        if (!readerRef.current || !parserRef.current || !isStreaming || isScanningRef.current) {
            return;
        }

        // Check if video is ready and has valid dimensions
        if (!videoRef.current || videoRef.current.videoWidth === 0 || videoRef.current.videoHeight === 0) {
            console.log('[RealTimeBarcodeScanner] Video not ready, skipping scan');
            return;
        }

        isScanningRef.current = true;
        setIsScanning(true);

        try {
            console.log(`[RealTimeBarcodeScanner] Scanning frame ${scanCount + 1}...`);
            setScanCount(prev => prev + 1);

            // Create a temporary image element from the video frame
            const canvas = canvasRef.current;
            if (!canvas || !videoRef.current) {
                isScanningRef.current = false;
                setIsScanning(false);
                return;
            }



            // Draw current video frame to canvas
            const ctx = canvas.getContext('2d');
            if (!ctx) {
                isScanningRef.current = false;
                setIsScanning(false);
                return;
            }

            canvas.width = videoRef.current!.videoWidth;
            canvas.height = videoRef.current!.videoHeight;
            ctx.drawImage(videoRef.current!, 0, 0);

            // Convert canvas to image element for ZXing
            const img = new Image();

            try {
                const dataUrl = canvas.toDataURL('image/jpeg', 0.8); // Lower quality for better performance
                img.src = dataUrl;

                await new Promise((resolve, reject) => {
                    img.onload = () => {
                        console.log('[RealTimeBarcodeScanner] Image loaded successfully:', img.width, 'x', img.height);
                        resolve(true);
                    };
                    img.onerror = (error) => {
                        console.error('[RealTimeBarcodeScanner] Image load failed:', error);
                        reject(new Error('Failed to create image from video frame'));
                    };
                });
            } catch (error) {
                console.error('[RealTimeBarcodeScanner] Canvas to image conversion failed:', error);
                isScanningRef.current = false;
                setIsScanning(false);
                return;
            }

            // Use ZXing to decode from image element
            const result = await readerRef.current.decodeFromImageElement(img);

            if (result) {
                const barcodeText = result.getText();
                console.log('[RealTimeBarcodeScanner] Barcode detected:', barcodeText);

                // Parse the barcode data
                const parsedData = parserRef.current!.parse(barcodeText);
                console.log('[RealTimeBarcodeScanner] Parsed data:', parsedData);

                setLastScannedData(parsedData);
                onBarcodeDetected?.(parsedData);

                if (autoStopOnDetection) {
                    stopCamera();
                }
            }
        } catch (error) {
            // Check if it's a "not found" error (no barcode detected)
            if (error instanceof Error && error.message && (
                error.message.includes('NotFoundException') ||
                error.message.includes('No barcode found') ||
                error.message.includes('not found') ||
                error.message.includes('No PDF417 barcode found')
            )) {
                // No barcode found, this is expected during scanning
                console.log('[RealTimeBarcodeScanner] No barcode found in frame');
            } else if (error instanceof Error && error.message && (
                error.message.includes('Failed to create image') ||
                error.message.includes('Video not ready')
            )) {
                // Video/image processing errors, don't show as user errors
                console.log('[RealTimeBarcodeScanner] Video processing issue:', error.message);
            } else {
                console.error('[RealTimeBarcodeScanner] Scan error:', error);
                // Only show actual scanning errors to the user
                if (error instanceof Error && error.message && !error.message.includes('Failed to create image')) {
                    setError(`Scan error: ${error.message}`);
                    onError?.(`Scan error: ${error.message}`);
                }
            }
        } finally {
            isScanningRef.current = false;
            setIsScanning(false);
        }
    }, [isStreaming, scanCount, autoStopOnDetection, onBarcodeDetected, onError, stopCamera]);

    const startScanning = useCallback(() => {
        if (!isStreaming || !readerRef.current) return;

        console.log('[RealTimeBarcodeScanner] Starting continuous scanning...');

        // Start periodic scanning
        scanIntervalRef.current = setInterval(scanFrame, scanInterval);
    }, [isStreaming, scanFrame, scanInterval]);

    const stopScanning = useCallback(() => {
        if (scanIntervalRef.current) {
            clearInterval(scanIntervalRef.current);
            scanIntervalRef.current = null;
            setIsScanning(false);
            isScanningRef.current = false;
            console.log('[RealTimeBarcodeScanner] Scanning stopped');
        }
    }, []);

    // Start scanning when camera is ready
    useEffect(() => {
        if (isStreaming && videoRef.current) {
            const video = videoRef.current;

            const handleVideoReady = () => {
                console.log('[RealTimeBarcodeScanner] Video ready, starting scanning...');
                // Add a small delay to ensure video is fully ready
                setTimeout(() => {
                    startScanning();
                }, 1000);
            };

            if (video.readyState >= 2) {
                handleVideoReady();
            } else {
                video.addEventListener('loadeddata', handleVideoReady);
                return () => video.removeEventListener('loadeddata', handleVideoReady);
            }
        }
    }, [isStreaming, startScanning]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            stopCamera();
        };
    }, [stopCamera]);

    return (
        <div className="flex flex-col items-center gap-4 p-4">
            {/* Camera Feed Container */}
            <div className="relative bg-gray-900 rounded-lg overflow-hidden">
                <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="block"
                    style={{ width, height }}
                />

                {/* Hidden canvas for frame capture */}
                <canvas
                    ref={canvasRef}
                    style={{ display: 'none' }}
                />

                {/* Scanning Overlay */}
                {isScanning && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30">
                        <div className="text-white text-lg font-semibold">
                            Scanning for PDF417 barcode...
                        </div>
                    </div>
                )}

                {/* Loading Overlay */}
                {isLoading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
                        <div className="text-white text-lg">Starting camera...</div>
                    </div>
                )}

                {/* Error Overlay */}
                {error && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-75">
                        <div className="text-white text-center p-4">
                            <div className="text-red-400 mb-2">Error</div>
                            <div className="text-sm">{error}</div>
                        </div>
                    </div>
                )}
            </div>

            {/* Controls */}
            <div className="flex gap-4">
                {!isStreaming ? (
                    <button
                        onClick={startCamera}
                        disabled={isLoading}
                        className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white px-6 py-2 rounded-lg font-medium transition-colors"
                    >
                        {isLoading ? 'Starting...' : 'Start Scanner'}
                    </button>
                ) : (
                    <>
                        <button
                            onClick={stopCamera}
                            className="bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded-lg font-medium transition-colors"
                        >
                            Stop Scanner
                        </button>
                        <button
                            onClick={switchCamera}
                            className="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-lg font-medium transition-colors"
                        >
                            Switch Camera
                        </button>
                        {isScanning ? (
                            <button
                                onClick={stopScanning}
                                className="bg-yellow-500 hover:bg-yellow-600 text-white px-6 py-2 rounded-lg font-medium transition-colors"
                            >
                                Pause Scanning
                            </button>
                        ) : (
                            <button
                                onClick={startScanning}
                                className="bg-purple-500 hover:bg-purple-600 text-white px-6 py-2 rounded-lg font-medium transition-colors"
                            >
                                Resume Scanning
                            </button>
                        )}
                    </>
                )}
            </div>

            {/* Status and Results */}
            <div className="text-sm text-gray-600 space-y-2">
                <div>
                    Status: {isStreaming ? 'Streaming' : 'Stopped'}
                    {facingMode && ` | Camera: ${facingMode === 'user' ? 'Front' : 'Back'}`}
                    {isScanning && ' | Scanning...'}
                </div>
                <div>Scans attempted: {scanCount}</div>
                {lastScannedData && (
                    <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                        <div className="font-semibold text-green-800 mb-2">Last Detected Barcode:</div>
                        <div className="text-sm text-green-700">
                            <div>Form Type: {lastScannedData.formType}</div>
                            <div>Valid: {lastScannedData.isValid ? 'Yes' : 'No'}</div>
                            {lastScannedData.errors.length > 0 && (
                                <div className="text-red-600">
                                    Errors: {lastScannedData.errors.join(', ')}
                                </div>
                            )}
                            {lastScannedData.data.nachname && (
                                <div>Name: {lastScannedData.data.nachname}, {lastScannedData.data.vorname}</div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default RealTimeBarcodeScanner;
