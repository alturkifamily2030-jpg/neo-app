import { useRef, useEffect, useState } from 'react';
import { X, QrCode } from 'lucide-react';
import jsQR from 'jsqr';

interface QRScannerProps {
  onScan: (data: string) => void;
  onClose: () => void;
}

export default function QRScanner({ onScan, onClose }: QRScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [scanning, setScanning] = useState(true);

  useEffect(() => {
    startCamera();
    return () => {
      streamRef.current?.getTracks().forEach(t => t.stop());
      cancelAnimationFrame(rafRef.current);
    };
  }, []);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadeddata = () => tick();
      }
    } catch {
      setError('Camera access denied. Please grant camera permission to scan QR codes.');
    }
  };

  const tick = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.readyState !== video.HAVE_ENOUGH_DATA) {
      rafRef.current = requestAnimationFrame(tick);
      return;
    }
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const code = jsQR(imageData.data, imageData.width, imageData.height, {
      inversionAttempts: 'dontInvert',
    });
    if (code) {
      setScanning(false);
      streamRef.current?.getTracks().forEach(t => t.stop());
      cancelAnimationFrame(rafRef.current);
      onScan(code.data);
      onClose();
      return;
    }
    rafRef.current = requestAnimationFrame(tick);
  };

  const handleClose = () => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    cancelAnimationFrame(rafRef.current);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-black/80 flex-shrink-0">
        <button
          onClick={handleClose}
          className="p-2 rounded-full bg-white/20 text-white hover:bg-white/30"
        >
          <X size={20} />
        </button>
        <span className="text-white text-sm font-medium">Scan QR Code</span>
        <div className="w-10" />
      </div>

      {/* Camera area */}
      <div className="flex-1 flex items-center justify-center relative overflow-hidden">
        {error ? (
          <div className="text-center p-8">
            <QrCode size={48} className="text-white/30 mx-auto mb-4" />
            <p className="text-white/70 text-sm max-w-xs">{error}</p>
          </div>
        ) : (
          <>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
            {/* Viewfinder overlay */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              {/* Darken outside scanner box */}
              <div className="absolute inset-0 bg-black/50" style={{ clipPath: 'polygon(0 0, 100% 0, 100% 100%, 0 100%, 0 calc(50% - 112px), calc(50% - 112px) calc(50% - 112px), calc(50% - 112px) calc(50% + 112px), calc(50% + 112px) calc(50% + 112px), calc(50% + 112px) calc(50% - 112px), 0 calc(50% - 112px))' }} />
              <div className="w-56 h-56 relative">
                {/* Corner marks */}
                <span className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-white rounded-tl-lg" />
                <span className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-white rounded-tr-lg" />
                <span className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-white rounded-bl-lg" />
                <span className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-white rounded-br-lg" />
                {/* Scan line animation */}
                {scanning && (
                  <div className="absolute left-2 right-2 h-0.5 bg-blue-400 opacity-80 animate-bounce" style={{ top: '50%' }} />
                )}
              </div>
            </div>
          </>
        )}
      </div>

      <canvas ref={canvasRef} className="hidden" />

      <div className="py-6 text-center flex-shrink-0 bg-black">
        <p className="text-white/50 text-xs">Point camera at a QR code to scan automatically</p>
      </div>
    </div>
  );
}
