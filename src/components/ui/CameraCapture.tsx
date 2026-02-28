import { useState, useRef, useEffect, useCallback } from 'react';
import {
  X, Zap, ZapOff, QrCode, RotateCcw, Check,
  Crop, Circle, Square, ArrowUpRight, Eraser,
  Upload, Camera,
} from 'lucide-react';
import jsQR from 'jsqr';

type AnnotationTool = 'crop' | 'circle' | 'rect' | 'arrow' | 'eraser';
type Permission = 'idle' | 'loading' | 'granted' | 'denied';

interface CameraCaptureProps {
  onCapture: (dataUrl: string) => void;
  onClose: () => void;
}

const STROKE_COLOR = '#ef4444';
const STROKE_WIDTH = 3;
const ERASER_RADIUS = 26;
const ARROW_HEAD = 22;

function drawArrow(
  ctx: CanvasRenderingContext2D,
  x1: number, y1: number,
  x2: number, y2: number,
) {
  const angle = Math.atan2(y2 - y1, x2 - x1);
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x2, y2);
  ctx.lineTo(
    x2 - ARROW_HEAD * Math.cos(angle - Math.PI / 6),
    y2 - ARROW_HEAD * Math.sin(angle - Math.PI / 6),
  );
  ctx.moveTo(x2, y2);
  ctx.lineTo(
    x2 - ARROW_HEAD * Math.cos(angle + Math.PI / 6),
    y2 - ARROW_HEAD * Math.sin(angle + Math.PI / 6),
  );
  ctx.stroke();
}

export default function CameraCapture({ onCapture, onClose }: CameraCaptureProps) {
  // ── Refs ────────────────────────────────────────────────────────────────
  const videoRef        = useRef<HTMLVideoElement>(null);
  const captureCanvas   = useRef<HTMLCanvasElement>(null); // hidden — used for capture & QR
  const photoCanvas     = useRef<HTMLCanvasElement>(null); // visible photo layer
  const drawCanvas      = useRef<HTMLCanvasElement>(null); // visible annotation layer
  const streamRef       = useRef<MediaStream | null>(null);
  const rafRef          = useRef<number>(0);
  const isDrawing       = useRef(false);
  const startPos        = useRef({ x: 0, y: 0 });
  const lastPos         = useRef({ x: 0, y: 0 });
  const snapshot        = useRef<ImageData | null>(null);

  // ── State ───────────────────────────────────────────────────────────────
  const [permission, setPermission] = useState<Permission>('idle');
  const [camLoading, setCamLoading] = useState(false);
  const [captured, setCaptured] = useState(false);
  const [flashOn, setFlashOn] = useState(false);
  const [flashSupported, setFlashSupported] = useState(false);
  const [qrMode, setQrMode] = useState(false);
  const [tool, setTool] = useState<AnnotationTool | null>(null);
  const [cropRect, setCropRect] = useState<{ x: number; y: number; w: number; h: number } | null>(null);

  // ── Camera lifecycle ────────────────────────────────────────────────────
  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    cancelAnimationFrame(rafRef.current);
  }, []);

  useEffect(() => () => stopCamera(), [stopCamera]);

  const startCamera = async () => {
    setPermission('loading');
    setCamLoading(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } },
        audio: false,
      });
      streamRef.current = stream;
      setPermission('granted');

      // Check torch support
      const track = stream.getVideoTracks()[0];
      const caps = track.getCapabilities?.() as Record<string, unknown> | undefined;
      setFlashSupported(!!(caps?.torch));

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadeddata = () => setCamLoading(false);
      }
    } catch (err) {
      const e = err as DOMException;
      setPermission(
        e.name === 'NotAllowedError' || e.name === 'PermissionDeniedError' ? 'denied' : 'denied',
      );
      setCamLoading(false);
    }
  };

  // ── Flash ────────────────────────────────────────────────────────────────
  const toggleFlash = async () => {
    const track = streamRef.current?.getVideoTracks()[0];
    if (!track) return;
    const next = !flashOn;
    try {
      await (track as MediaStreamTrack & { applyConstraints: (c: unknown) => Promise<void> })
        .applyConstraints({ advanced: [{ torch: next }] });
      setFlashOn(next);
    } catch { /* unsupported */ }
  };

  // ── QR scan loop ─────────────────────────────────────────────────────────
  const tickQR = useCallback(() => {
    const video  = videoRef.current;
    const canvas = captureCanvas.current;
    if (!video || !canvas || video.readyState !== video.HAVE_ENOUGH_DATA) {
      rafRef.current = requestAnimationFrame(tickQR);
      return;
    }
    const ctx = canvas.getContext('2d')!;
    canvas.width  = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0);
    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const code = jsQR(imgData.data, imgData.width, imgData.height, { inversionAttempts: 'dontInvert' });
    if (code) {
      stopCamera();
      onCapture(code.data);
      onClose();
      return;
    }
    rafRef.current = requestAnimationFrame(tickQR);
  }, [stopCamera, onCapture, onClose]);

  const handleQrToggle = () => {
    setQrMode(prev => {
      if (prev) {
        cancelAnimationFrame(rafRef.current);
        return false;
      }
      tickQR();
      return true;
    });
  };

  // ── Capture ───────────────────────────────────────────────────────────────
  const handleCapture = () => {
    const video = videoRef.current;
    const cc    = captureCanvas.current;
    const pc    = photoCanvas.current;
    const dc    = drawCanvas.current;
    if (!video || !cc || !pc || !dc) return;

    cc.width  = video.videoWidth;
    cc.height = video.videoHeight;
    cc.getContext('2d')!.drawImage(video, 0, 0);
    const dataUrl = cc.toDataURL('image/jpeg', 0.9);

    const img = new Image();
    img.onload = () => {
      const container = pc.parentElement;
      const maxW = container?.clientWidth  ?? window.innerWidth;
      const maxH = container?.clientHeight ?? window.innerHeight - 180;
      const scale = Math.min(maxW / img.width, maxH / img.height, 1);
      const w = Math.round(img.width  * scale);
      const h = Math.round(img.height * scale);
      pc.width = w; pc.height = h;
      dc.width = w; dc.height = h;
      pc.getContext('2d')!.drawImage(img, 0, 0, w, h);
    };
    img.src = dataUrl;
    stopCamera();
    setCaptured(true);
  };

  const handleRetake = () => {
    setCaptured(false);
    setTool(null);
    setCropRect(null);
    const ctx = drawCanvas.current?.getContext('2d');
    if (ctx && drawCanvas.current) ctx.clearRect(0, 0, drawCanvas.current.width, drawCanvas.current.height);
    startCamera();
  };

  const handleUsePhoto = () => {
    const pc = photoCanvas.current;
    const dc = drawCanvas.current;
    if (!pc) return;
    const merged = document.createElement('canvas');
    merged.width  = pc.width;
    merged.height = pc.height;
    const ctx = merged.getContext('2d')!;
    ctx.drawImage(pc, 0, 0);
    if (dc) ctx.drawImage(dc, 0, 0);
    onCapture(merged.toDataURL('image/jpeg', 0.9));
    onClose();
  };

  // ── File fallback ─────────────────────────────────────────────────────────
  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => { onCapture(ev.target!.result as string); onClose(); };
    reader.readAsDataURL(file);
  };

  // ── Canvas position helper ───────────────────────────────────────────────
  const getPos = (e: React.MouseEvent | React.TouchEvent, canvas: HTMLCanvasElement) => {
    const rect   = canvas.getBoundingClientRect();
    const scaleX = canvas.width  / rect.width;
    const scaleY = canvas.height / rect.height;
    if ('touches' in e) {
      const t = e.touches[0] ?? e.changedTouches[0];
      return { x: (t.clientX - rect.left) * scaleX, y: (t.clientY - rect.top) * scaleY };
    }
    return { x: (e.clientX - rect.left) * scaleX, y: (e.clientY - rect.top) * scaleY };
  };

  // ── Drawing handlers ──────────────────────────────────────────────────────
  const onPointerDown = (e: React.MouseEvent | React.TouchEvent) => {
    if (!tool || !drawCanvas.current) return;
    e.preventDefault();
    const pos = getPos(e, drawCanvas.current);
    isDrawing.current = true;
    startPos.current  = pos;
    lastPos.current   = pos;

    if (tool === 'crop') {
      setCropRect({ x: pos.x, y: pos.y, w: 0, h: 0 });
      return;
    }
    snapshot.current = drawCanvas.current.getContext('2d')!
      .getImageData(0, 0, drawCanvas.current.width, drawCanvas.current.height);
    if (tool === 'eraser') {
      const ctx = drawCanvas.current.getContext('2d')!;
      ctx.globalCompositeOperation = 'destination-out';
      ctx.beginPath(); ctx.arc(pos.x, pos.y, ERASER_RADIUS, 0, 2 * Math.PI); ctx.fill();
      ctx.globalCompositeOperation = 'source-over';
    }
  };

  const onPointerMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing.current || !tool || !drawCanvas.current) return;
    e.preventDefault();
    const pos = getPos(e, drawCanvas.current);
    const ctx = drawCanvas.current.getContext('2d')!;
    const { x: sx, y: sy } = startPos.current;

    if (tool === 'crop') {
      setCropRect({ x: sx, y: sy, w: pos.x - sx, h: pos.y - sy });
      lastPos.current = pos;
      return;
    }

    if (tool === 'eraser') {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.lineWidth = ERASER_RADIUS * 2;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(lastPos.current.x, lastPos.current.y);
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();
      ctx.globalCompositeOperation = 'source-over';
      lastPos.current = pos;
      return;
    }

    // Restore snapshot for live shape preview
    if (snapshot.current) ctx.putImageData(snapshot.current, 0, 0);
    ctx.strokeStyle = STROKE_COLOR;
    ctx.lineWidth   = STROKE_WIDTH;
    ctx.lineCap     = 'round';
    ctx.lineJoin    = 'round';

    if (tool === 'circle') {
      const rx = Math.abs(pos.x - sx) / 2;
      const ry = Math.abs(pos.y - sy) / 2;
      ctx.beginPath();
      ctx.ellipse((sx + pos.x) / 2, (sy + pos.y) / 2, Math.max(rx, 1), Math.max(ry, 1), 0, 0, 2 * Math.PI);
      ctx.stroke();
    } else if (tool === 'rect') {
      ctx.strokeRect(sx, sy, pos.x - sx, pos.y - sy);
    } else if (tool === 'arrow') {
      drawArrow(ctx, sx, sy, pos.x, pos.y);
    }
    lastPos.current = pos;
  };

  const onPointerUp = () => { isDrawing.current = false; };

  // ── Apply crop ────────────────────────────────────────────────────────────
  const applyCrop = () => {
    const pc = photoCanvas.current;
    const dc = drawCanvas.current;
    if (!cropRect || !pc || !dc) return;
    const cx = Math.round(Math.min(cropRect.x, cropRect.x + cropRect.w));
    const cy = Math.round(Math.min(cropRect.y, cropRect.y + cropRect.h));
    const cw = Math.round(Math.abs(cropRect.w));
    const ch = Math.round(Math.abs(cropRect.h));
    if (cw < 10 || ch < 10) return;

    const tmpP = document.createElement('canvas');
    const tmpD = document.createElement('canvas');
    tmpP.width = cw; tmpP.height = ch;
    tmpD.width = cw; tmpD.height = ch;
    tmpP.getContext('2d')!.drawImage(pc, -cx, -cy);
    tmpD.getContext('2d')!.drawImage(dc, -cx, -cy);
    pc.width = cw; pc.height = ch;
    dc.width = cw; dc.height = ch;
    pc.getContext('2d')!.drawImage(tmpP, 0, 0);
    dc.getContext('2d')!.drawImage(tmpD, 0, 0);
    setCropRect(null);
    setTool(null);
  };

  // ── Tool config ───────────────────────────────────────────────────────────
  const TOOLS: { key: AnnotationTool; icon: React.ReactNode; label: string }[] = [
    { key: 'crop',   icon: <Crop        size={18} />, label: 'Crop'   },
    { key: 'circle', icon: <Circle      size={18} />, label: 'Circle' },
    { key: 'rect',   icon: <Square      size={18} />, label: 'Rect'   },
    { key: 'arrow',  icon: <ArrowUpRight size={18} />, label: 'Arrow'  },
    { key: 'eraser', icon: <Eraser      size={18} />, label: 'Erase'  },
  ];

  // ══════════════════════════════════════════════════════════════════════════
  // Render — Permission screens
  // ══════════════════════════════════════════════════════════════════════════

  if (permission === 'idle') {
    return (
      <div className="fixed inset-0 bg-black z-50 flex flex-col items-center justify-center p-8">
        <div className="bg-white/10 rounded-3xl p-8 max-w-sm w-full text-center backdrop-blur-sm">
          <div className="w-20 h-20 rounded-full bg-blue-600/30 border border-blue-500/40 flex items-center justify-center mx-auto mb-6">
            <Camera size={36} className="text-blue-400" />
          </div>
          <h2 className="text-white text-xl font-semibold mb-2">Camera Access</h2>
          <p className="text-white/60 text-sm mb-8 leading-relaxed">
            To attach a photo to this task, we need access to your camera.
            You'll be asked to confirm in your browser or device settings.
          </p>
          <button
            onClick={startCamera}
            className="w-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold py-4 rounded-2xl text-base transition-colors mb-3"
          >
            Allow Camera Access
          </button>
          <label className="flex items-center justify-center gap-2 w-full border border-white/20 text-white/70 font-medium py-3.5 rounded-2xl text-sm cursor-pointer hover:bg-white/10 mb-3">
            <Upload size={16} /> Choose from Library
            <input type="file" accept="image/*" className="hidden" onChange={handleFile} />
          </label>
          <button onClick={onClose} className="w-full text-white/40 text-sm py-2 hover:text-white/60">
            Cancel
          </button>
        </div>
      </div>
    );
  }

  if (permission === 'denied') {
    return (
      <div className="fixed inset-0 bg-black z-50 flex flex-col items-center justify-center p-8">
        <div className="bg-white/10 rounded-3xl p-8 max-w-sm w-full text-center backdrop-blur-sm">
          <div className="w-20 h-20 rounded-full bg-red-500/20 border border-red-500/30 flex items-center justify-center mx-auto mb-6">
            <X size={32} className="text-red-400" />
          </div>
          <h2 className="text-white text-xl font-semibold mb-2">Camera Access Denied</h2>
          <p className="text-white/60 text-sm mb-3 leading-relaxed">
            Please enable camera access in your browser or device settings, then try again.
          </p>
          <p className="text-white/30 text-xs mb-8">
            iOS: Settings → Safari → Camera<br />
            Android: Settings → Apps → Browser → Permissions
          </p>
          <button
            onClick={() => setPermission('idle')}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 rounded-2xl text-base transition-colors mb-3"
          >
            Try Again
          </button>
          <label className="flex items-center justify-center gap-2 w-full border border-white/20 text-white/70 font-medium py-3.5 rounded-2xl text-sm cursor-pointer hover:bg-white/10 mb-3">
            <Upload size={16} /> Choose from Library
            <input type="file" accept="image/*" className="hidden" onChange={handleFile} />
          </label>
          <button onClick={onClose} className="w-full text-white/40 text-sm py-2 hover:text-white/60">Cancel</button>
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // Render — Camera / Editor
  // ══════════════════════════════════════════════════════════════════════════

  const cropApplyReady = tool === 'crop' && cropRect && Math.abs(cropRect.w) > 10 && Math.abs(cropRect.h) > 10;

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col" style={{ touchAction: captured ? 'none' : 'auto' }}>

      {/* ── Top bar ── */}
      <div className="flex items-center justify-between px-4 py-3 bg-black/80 flex-shrink-0 backdrop-blur-sm">
        <button
          onClick={() => { stopCamera(); onClose(); }}
          className="p-2.5 rounded-full bg-white/15 text-white hover:bg-white/25 active:scale-95 transition-all"
        >
          <X size={20} />
        </button>

        <span className="text-white text-sm font-semibold tracking-wide">
          {captured ? 'Edit Photo' : qrMode ? 'Scan QR Code' : 'Take Photo'}
        </span>

        {/* Camera mode controls */}
        {!captured ? (
          <div className="flex items-center gap-2">
            {flashSupported && (
              <button
                onClick={toggleFlash}
                title={flashOn ? 'Turn off flash' : 'Turn on flash'}
                className={`p-2.5 rounded-full text-white active:scale-95 transition-all ${
                  flashOn ? 'bg-yellow-500 shadow-lg shadow-yellow-500/30' : 'bg-white/15 hover:bg-white/25'
                }`}
              >
                {flashOn ? <Zap size={20} /> : <ZapOff size={20} />}
              </button>
            )}
            <button
              onClick={handleQrToggle}
              title={qrMode ? 'Stop QR scan' : 'Scan QR code'}
              className={`p-2.5 rounded-full text-white active:scale-95 transition-all ${
                qrMode ? 'bg-blue-600 shadow-lg shadow-blue-600/40' : 'bg-white/15 hover:bg-white/25'
              }`}
            >
              <QrCode size={20} />
            </button>
          </div>
        ) : (
          <div className="w-[88px]" />
        )}
      </div>

      {/* ── Main area ── */}
      <div className="flex-1 flex items-center justify-center relative overflow-hidden bg-black">

        {/* Camera feed */}
        {!captured && (
          <>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
            {camLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/70">
                <div className="w-10 h-10 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              </div>
            )}
            {/* QR viewfinder */}
            {qrMode && !camLoading && (
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <div
                  className="absolute inset-0 bg-black/55"
                  style={{
                    clipPath:
                      'polygon(0 0,100% 0,100% 100%,0 100%,0 calc(50% - 110px),calc(50% - 110px) calc(50% - 110px),calc(50% - 110px) calc(50% + 110px),calc(50% + 110px) calc(50% + 110px),calc(50% + 110px) calc(50% - 110px),0 calc(50% - 110px))',
                  }}
                />
                <div className="relative" style={{ width: 220, height: 220 }}>
                  <span className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-white rounded-tl-xl" />
                  <span className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-white rounded-tr-xl" />
                  <span className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-white rounded-bl-xl" />
                  <span className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-white rounded-br-xl" />
                  <div className="absolute left-3 right-3 h-0.5 bg-blue-400/80" style={{ top: '50%', boxShadow: '0 0 6px 1px rgba(96,165,250,0.6)', animation: 'bounce 1.5s infinite' }} />
                </div>
                <p className="absolute bottom-20 text-white/50 text-xs px-4 text-center">
                  Point camera at a QR code to scan automatically
                </p>
              </div>
            )}
          </>
        )}

        {/* Captured photo + annotation editor */}
        {captured && (
          <div className="relative w-full h-full flex items-center justify-center">
            {/* Canvas wrapper — sized to photo */}
            <div className="relative inline-block" style={{ maxWidth: '100%', maxHeight: '100%' }}>
              {/* Photo layer */}
              <canvas
                ref={photoCanvas}
                className="block"
                style={{ maxWidth: '100%', maxHeight: 'calc(100vh - 200px)', userSelect: 'none' }}
              />
              {/* Annotation layer */}
              <canvas
                ref={drawCanvas}
                className="absolute inset-0"
                style={{
                  width: '100%',
                  height: '100%',
                  touchAction: 'none',
                  cursor: tool === 'eraser' ? 'cell' : tool ? 'crosshair' : 'default',
                }}
                onMouseDown={onPointerDown}
                onMouseMove={onPointerMove}
                onMouseUp={onPointerUp}
                onMouseLeave={onPointerUp}
                onTouchStart={onPointerDown}
                onTouchMove={onPointerMove}
                onTouchEnd={onPointerUp}
              />
              {/* Crop selection overlay */}
              {tool === 'crop' && cropRect && (
                <div
                  className="absolute border-2 border-white pointer-events-none"
                  style={{
                    borderStyle: 'dashed',
                    left:   `${(Math.min(cropRect.x, cropRect.x + cropRect.w) / (photoCanvas.current?.width  || 1)) * 100}%`,
                    top:    `${(Math.min(cropRect.y, cropRect.y + cropRect.h) / (photoCanvas.current?.height || 1)) * 100}%`,
                    width:  `${(Math.abs(cropRect.w) / (photoCanvas.current?.width  || 1)) * 100}%`,
                    height: `${(Math.abs(cropRect.h) / (photoCanvas.current?.height || 1)) * 100}%`,
                  }}
                >
                  {/* Dim outside */}
                  <div className="absolute inset-0 bg-black/20" />
                  {/* Corner handles */}
                  {[{t:'-1.5px',l:'-1.5px'},{t:'-1.5px',r:'-1.5px'},{b:'-1.5px',l:'-1.5px'},{b:'-1.5px',r:'-1.5px'}]
                    .map((pos, i) => (
                      <div key={i} className="absolute w-3 h-3 bg-white rounded-sm" style={pos as React.CSSProperties} />
                    ))
                  }
                </div>
              )}
            </div>

            {/* Right-side annotation toolbar */}
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex flex-col gap-2 z-10">
              {TOOLS.map(({ key, icon, label }) => (
                <button
                  key={key}
                  onClick={() => { setTool(prev => prev === key ? null : key as AnnotationTool); setCropRect(null); }}
                  title={label}
                  className={`w-12 h-12 rounded-2xl flex flex-col items-center justify-center gap-0.5 shadow-lg active:scale-90 transition-all ${
                    tool === key
                      ? 'bg-blue-600 text-white ring-2 ring-blue-400/50'
                      : 'bg-black/70 text-white/80 hover:bg-white/20 border border-white/10'
                  }`}
                >
                  {icon}
                  <span className="text-[9px] leading-none font-medium">{label}</span>
                </button>
              ))}

              {/* Apply crop */}
              {cropApplyReady && (
                <button
                  onClick={applyCrop}
                  className="w-12 h-12 rounded-2xl flex flex-col items-center justify-center gap-0.5 bg-green-600 text-white shadow-lg active:scale-90 ring-2 ring-green-400/50"
                  title="Apply crop"
                >
                  <Check size={18} />
                  <span className="text-[9px] leading-none font-medium">Apply</span>
                </button>
              )}
            </div>

            {/* Active tool hint */}
            {tool && tool !== 'crop' && (
              <div className="absolute top-3 left-1/2 -translate-x-1/2 bg-black/60 text-white/80 text-xs px-3 py-1.5 rounded-full backdrop-blur-sm pointer-events-none">
                {tool === 'eraser' ? 'Draw over annotations to erase' :
                 tool === 'circle' ? 'Drag to draw a circle highlight' :
                 tool === 'rect'   ? 'Drag to draw a rectangle' :
                 tool === 'arrow'  ? 'Drag to draw an arrow' : ''}
              </div>
            )}
            {tool === 'crop' && (
              <div className="absolute top-3 left-1/2 -translate-x-1/2 bg-black/60 text-white/80 text-xs px-3 py-1.5 rounded-full backdrop-blur-sm pointer-events-none">
                Drag to select crop area, then press Apply
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Bottom controls ── */}
      <div
        className="flex items-center justify-center gap-10 px-6 py-5 bg-black flex-shrink-0"
        style={{ paddingBottom: 'max(20px, env(safe-area-inset-bottom, 20px))' }}
      >
        {!captured ? (
          <>
            <label className="flex flex-col items-center gap-1.5 text-white/60 hover:text-white cursor-pointer transition-colors active:scale-95">
              <div className="w-12 h-12 rounded-full border-2 border-white/30 flex items-center justify-center">
                <Upload size={20} />
              </div>
              <span className="text-xs">Library</span>
              <input type="file" accept="image/*" className="hidden" onChange={handleFile} />
            </label>

            {/* Shutter button */}
            <button
              onClick={handleCapture}
              disabled={camLoading || qrMode}
              className="flex flex-col items-center gap-1.5 text-white transition-all active:scale-95 disabled:opacity-40"
            >
              <div className="rounded-full border-4 border-white flex items-center justify-center p-1.5" style={{ width: 76, height: 76 }}>
                <div className="w-full h-full rounded-full bg-white" />
              </div>
              <span className="text-xs font-medium">Capture</span>
            </button>

            <div className="w-12" /> {/* spacer to centre shutter */}
          </>
        ) : (
          <>
            <button
              onClick={handleRetake}
              className="flex flex-col items-center gap-1.5 text-white/60 hover:text-white transition-colors active:scale-95"
            >
              <div className="w-12 h-12 rounded-full border-2 border-white/30 flex items-center justify-center">
                <RotateCcw size={20} />
              </div>
              <span className="text-xs">Retake</span>
            </button>

            <button
              onClick={handleUsePhoto}
              className="flex flex-col items-center gap-1.5 text-white transition-all active:scale-90"
            >
              <div
                className="rounded-full bg-white flex items-center justify-center shadow-xl"
                style={{ width: 76, height: 76 }}
              >
                <Check size={30} className="text-gray-900" />
              </div>
              <span className="text-xs font-semibold">Use Photo</span>
            </button>

            <div className="w-12" />
          </>
        )}
      </div>

      {/* Hidden capture/QR canvas */}
      <canvas ref={captureCanvas} className="hidden" />
    </div>
  );
}
