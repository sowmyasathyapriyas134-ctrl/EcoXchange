import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import { Html5Qrcode } from "html5-qrcode";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function QrGenerator({ value, title = "QR Code", size = 200, className }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!value || !canvasRef.current) return;
    QRCode.toCanvas(canvasRef.current, value, { width: size, margin: 2 });
  }, [value, size]);

  if (!value) return null;

  return (
    <Card className={cn(className)}>
      <CardHeader>
        <CardTitle className="text-sm">{title}</CardTitle>
      </CardHeader>
      <CardContent className="flex justify-center">
        <canvas ref={canvasRef} />
      </CardContent>
    </Card>
  );
}

export function QrScanner({ onScan, onError, className }) {
  const [scanning, setScanning] = useState(false);
  const scannerRef = useRef(null);
  const id = "qr-reader";

  const start = async () => {
    try {
      const scanner = new Html5Qrcode(id);
      scannerRef.current = scanner;
      await scanner.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decoded) => {
          onScan?.(decoded);
          stop();
        },
        (err) => onError?.(err),
      );
      setScanning(true);
    } catch (err) {
      onError?.(err instanceof Error ? err.message : "Camera access denied");
    }
  };

  const stop = async () => {
    if (scannerRef.current?.isScanning) {
      await scannerRef.current.stop();
      scannerRef.current.clear();
    }
    setScanning(false);
  };

  useEffect(() => () => {
    stop();
  }, []);

  return (
    <div className={cn("space-y-3", className)}>
      <div id={id} className="rounded-lg overflow-hidden border min-h-[200px]" />
      <Button type="button" onClick={scanning ? stop : start} variant={scanning ? "destructive" : "default"}>
        {scanning ? "Stop scanner" : "Start scanner"}
      </Button>
    </div>
  );
}

export function QrCard({ value, title, description, className }) {
  return (
    <Card className={cn(className)}>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </CardHeader>
      <CardContent>
        <QrGenerator value={value} title="" />
      </CardContent>
    </Card>
  );
}
