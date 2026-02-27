import { useEffect, useRef } from 'react';
import QRCode from 'qrcode';

interface QRCodeCanvasProps {
  value: string;
  size?: number;
  /** Exposed via ref-callback so parent can call canvas.toDataURL() */
  onReady?: (canvas: HTMLCanvasElement) => void;
}

export default function QRCodeCanvas({ value, size = 180, onReady }: QRCodeCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    QRCode.toCanvas(canvasRef.current, value || ' ', {
      width: size,
      margin: 2,
      color: { dark: '#1f2937', light: '#ffffff' },
    }).then(() => {
      if (onReady && canvasRef.current) onReady(canvasRef.current);
    });
  }, [value, size, onReady]);

  return <canvas ref={canvasRef} style={{ width: size, height: size }} className="rounded-lg" />;
}

/** Utility: download a canvas as a PNG file */
export function downloadCanvasAsPng(canvas: HTMLCanvasElement, filename: string) {
  const url = canvas.toDataURL('image/png');
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
}

/** Utility: open print window with QR canvas embedded */
export function printQRCode(canvas: HTMLCanvasElement, label: string) {
  const url = canvas.toDataURL('image/png');
  const win = window.open('', '_blank', 'width=400,height=500');
  if (!win) return;
  win.document.write(`<!DOCTYPE html><html><head><title>QR Code — ${label}</title>
<style>body{margin:0;display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100vh;font-family:sans-serif;background:#fff}
img{width:220px;height:220px;border:3px solid #111;border-radius:12px;padding:8px}
h2{margin:16px 0 4px;font-size:16px;color:#111}p{margin:0;font-size:11px;color:#555}
@media print{button{display:none}}</style></head>
<body><img src="${url}" alt="QR Code"/><h2>${label}</h2>
<p>Scan to access</p><br/>
<button onclick="window.print()" style="margin-top:12px;padding:8px 20px;background:#1d4ed8;color:#fff;border:none;border-radius:8px;cursor:pointer;font-size:14px">Print</button>
</body></html>`);
  win.document.close();
}
