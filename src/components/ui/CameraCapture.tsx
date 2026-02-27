import { useState, useRef, useEffect } from 'react';
import { X, RotateCcw, Upload, Check } from 'lucide-react';

interface CameraCaptureProps {
  onCapture: (dataUrl: string) => void;
  onClose: () => void;
}

export default function CameraCapture({ onCapture, onClose }: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [hasCamera, setHasCamera] = useState(true);
  const [captured, setCaptured] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, []);

  const startCamera = async () => {
    setLoading(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadeddata = () => setLoading(false);
      }
    } catch {
      setHasCamera(false);
      setLoading(false);
    }
  };

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
  };

  const capture = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const canvas = canvasRef.current;
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    canvas.getContext('2d')!.drawImage(videoRef.current, 0, 0);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
    setCaptured(dataUrl);
    stopCamera();
  };

  const retake = () => {
    setCaptured(null);
    startCamera();
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      onCapture(ev.target!.result as string);
      onClose();
    };
    reader.readAsDataURL(file);
  };

  const handleUse = () => {
    if (captured) {
      onCapture(captured);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-black/80 flex-shrink-0">
        <button
          onClick={() => { stopCamera(); onClose(); }}
          className="p-2 rounded-full bg-white/20 text-white hover:bg-white/30"
        >
          <X size={20} />
        </button>
        <span className="text-white text-sm font-medium">
          {captured ? 'Review Photo' : 'Take Photo'}
        </span>
        <div className="w-10" />
      </div>

      {/* Camera / Preview area */}
      <div className="flex-1 flex items-center justify-center relative overflow-hidden">
        {!hasCamera ? (
          <div className="text-center p-8">
            <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center mx-auto mb-4">
              <Upload size={28} className="text-white/60" />
            </div>
            <p className="text-white/70 text-sm mb-6">Camera not available on this device</p>
            <label className="flex items-center gap-2 bg-white text-gray-900 px-5 py-2.5 rounded-xl text-sm font-medium cursor-pointer hover:bg-gray-100">
              <Upload size={16} /> Choose from library
              <input type="file" accept="image/*" className="hidden" onChange={handleFileInput} />
            </label>
          </div>
        ) : captured ? (
          <img src={captured} alt="Captured" className="max-w-full max-h-full object-contain" />
        ) : (
          <>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
            {loading && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              </div>
            )}
          </>
        )}
        <canvas ref={canvasRef} className="hidden" />
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-8 px-6 py-8 bg-black flex-shrink-0">
        {!hasCamera ? null : captured ? (
          <>
            <button
              onClick={retake}
              className="flex flex-col items-center gap-1.5 text-white/70 hover:text-white transition-colors"
            >
              <div className="w-12 h-12 rounded-full border-2 border-white/40 flex items-center justify-center">
                <RotateCcw size={20} />
              </div>
              <span className="text-xs">Retake</span>
            </button>
            <button
              onClick={handleUse}
              className="flex flex-col items-center gap-1.5 text-white transition-colors"
            >
              <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center shadow-lg">
                <Check size={28} className="text-gray-900" />
              </div>
              <span className="text-xs">Use Photo</span>
            </button>
          </>
        ) : (
          <>
            <label className="flex flex-col items-center gap-1.5 text-white/70 hover:text-white cursor-pointer transition-colors">
              <div className="w-12 h-12 rounded-full border-2 border-white/40 flex items-center justify-center">
                <Upload size={20} />
              </div>
              <span className="text-xs">Library</span>
              <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFileInput} />
            </label>
            <button
              onClick={capture}
              disabled={loading}
              className="flex flex-col items-center gap-1.5 text-white transition-colors disabled:opacity-40"
            >
              <div className="w-16 h-16 rounded-full border-4 border-white flex items-center justify-center">
                <div className="w-12 h-12 rounded-full bg-white" />
              </div>
              <span className="text-xs">Capture</span>
            </button>
          </>
        )}
      </div>
    </div>
  );
}
