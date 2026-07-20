import { useCallback, useRef, useState } from "react";
import { Camera, RefreshCw, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

async function compressImage(blob, maxWidth = 1280, quality = 0.8) {
  const bitmap = await createImageBitmap(blob);
  const scale = Math.min(1, maxWidth / bitmap.width);
  const canvas = document.createElement("canvas");
  canvas.width = bitmap.width * scale;
  canvas.height = bitmap.height * scale;
  const ctx = canvas.getContext("2d");
  ctx?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  return new Promise((resolve) => {
    canvas.toBlob((b) => resolve(b), "image/jpeg", quality);
  });
}

export function CameraCapture({
  onCapture,
  onUpload,
  className,
  uploadEndpoint,
  getAuthHeaders,
}) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [active, setActive] = useState(false);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  const startCamera = useCallback(async () => {
    setError(null);
    setActive(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Camera unavailable");
      setActive(false);
    }
  }, []);

  const capture = async () => {
    if (!videoRef.current) return;
    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    canvas.getContext("2d")?.drawImage(videoRef.current, 0, 0);
    canvas.toBlob(async (blob) => {
      if (!blob) return;
      const compressed = await compressImage(blob);
      const url = URL.createObjectURL(compressed);
      setPreview(url);
      onCapture?.(compressed);
      stopCamera();
    }, "image/jpeg", 0.92);
  };

  const upload = async () => {
    if (!preview) return;
    setUploading(true);
    setError(null);
    try {
      const res = await fetch(preview);
      const blob = await res.blob();
      const compressed = await compressImage(blob);

      if (uploadEndpoint) {
        const form = new FormData();
        form.append("file", compressed, "capture.jpg");
        const headers = getAuthHeaders?.() ?? {};
        const response = await fetch(uploadEndpoint, { method: "POST", body: form, headers });
        if (!response.ok) throw new Error("Upload failed");
        const json = await response.json();
        onUpload?.(json);
      } else {
        onUpload?.({ blob: compressed });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const reset = async () => {
    setPreview(null);
    setError(null);
    await startCamera();
  };

  return (
    <div className={cn("space-y-3", className)}>
      {error && <p className="text-sm text-destructive">{error}</p>}
      {!active ? (
        <Button type="button" onClick={startCamera}>
          <Camera className="h-4 w-4 mr-2" /> Start camera
        </Button>
      ) : (
        <>
          {preview ? (
            <img src={preview} alt="Preview" className="w-full rounded-lg border object-cover max-h-80" />
          ) : (
            <video ref={videoRef} className="w-full rounded-lg border bg-black max-h-80" playsInline muted />
          )}
          <div className="flex flex-wrap gap-2">
            {!preview ? (
              <Button type="button" onClick={capture}>
                <Camera className="h-4 w-4 mr-2" /> Capture
              </Button>
            ) : (
              <>
                <Button type="button" onClick={upload} disabled={uploading}>
                  <Upload className="h-4 w-4 mr-2" /> {uploading ? "Uploading…" : "Upload"}
                </Button>
                <Button type="button" variant="outline" onClick={reset}>
                  <RefreshCw className="h-4 w-4 mr-2" /> Retry
                </Button>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}
