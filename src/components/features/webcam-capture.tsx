import { useState, useRef, useEffect } from 'react';

interface WebcamCaptureProps {
  width?: number;
  height?: number;
  facingMode?: 'user' | 'environment';
  onStreamStart?: (stream: MediaStream) => void;
  onStreamStop?: () => void;
  onError?: (error: string) => void;
}

const WebcamCapture: React.FC<WebcamCaptureProps> = ({
  width = 640,
  height = 480,
  facingMode = 'environment',
  onStreamStart,
  onStreamStop,
  onError,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

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
        onStreamStart?.(stream);
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to access camera';
      setError(errorMessage);
      onError?.(errorMessage);
      console.error('Camera access error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setIsStreaming(false);
    onStreamStop?.();
  };

  const switchCamera = async () => {
    if (!isStreaming) return;

    const newFacingMode = facingMode === 'user' ? 'environment' : 'user';

    // Stop current stream
    stopCamera();

    // Start new stream with different facing mode
    setTimeout(() => {
      startCamera();
    }, 100);
  };

  const capturePhoto = (): string | null => {
    if (!videoRef.current || !isStreaming) return null;

    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;

    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    ctx.drawImage(videoRef.current, 0, 0);
    return canvas.toDataURL('image/jpeg');
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

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
              <div className="text-red-400 mb-2">Camera Error</div>
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
            {isLoading ? 'Starting...' : 'Start Camera'}
          </button>
        ) : (
          <>
            <button
              onClick={stopCamera}
              className="bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded-lg font-medium transition-colors"
            >
              Stop Camera
            </button>
            <button
              onClick={switchCamera}
              className="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-lg font-medium transition-colors"
            >
              Switch Camera
            </button>
            <button
              onClick={() => {
                const photo = capturePhoto();
                if (photo) {
                  // You can handle the captured photo here
                  console.log('Photo captured:', photo);
                  // Example: download the photo
                  const link = document.createElement('a');
                  link.download = `webcam-capture-${Date.now()}.jpg`;
                  link.href = photo;
                  link.click();
                }
              }}
              className="bg-purple-500 hover:bg-purple-600 text-white px-6 py-2 rounded-lg font-medium transition-colors"
            >
              Capture Photo
            </button>
          </>
        )}
      </div>

      {/* Status */}
      <div className="text-sm text-gray-600">
        Status: {isStreaming ? 'Streaming' : 'Stopped'}
        {facingMode && ` | Camera: ${facingMode === 'user' ? 'Front' : 'Back'}`}
      </div>
    </div>
  );
};

export default WebcamCapture;
