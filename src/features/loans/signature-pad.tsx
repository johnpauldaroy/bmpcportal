"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";

// Captures a hand-drawn signature on a canvas and hands the parent a PNG File,
// so it plugs straight into the same applicant_signature upload slot a photo
// upload would. Calls onChange(null) whenever the pad is empty/cleared.
export function SignaturePad({
  onChange,
  fileName
}: {
  onChange: (file: File | null) => void;
  fileName?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const drawingRef = useRef(false);
  const dirtyRef = useRef(false);
  const [hasDrawing, setHasDrawing] = useState(false);

  // Size the canvas backing store to its rendered size (accounting for DPR) so
  // strokes stay crisp and aligned with the pointer.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ratio = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * ratio;
    canvas.height = rect.height * ratio;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.scale(ratio, ratio);
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "#17263a";
  }, []);

  function pointerPos(event: React.PointerEvent<HTMLCanvasElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  }

  function startStroke(event: React.PointerEvent<HTMLCanvasElement>) {
    event.currentTarget.setPointerCapture(event.pointerId);
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    const { x, y } = pointerPos(event);
    drawingRef.current = true;
    ctx.beginPath();
    ctx.moveTo(x, y);
  }

  function moveStroke(event: React.PointerEvent<HTMLCanvasElement>) {
    if (!drawingRef.current) return;
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    const { x, y } = pointerPos(event);
    ctx.lineTo(x, y);
    ctx.stroke();
    if (!dirtyRef.current) {
      dirtyRef.current = true;
      setHasDrawing(true);
    }
  }

  function endStroke() {
    if (!drawingRef.current) return;
    drawingRef.current = false;
    exportFile();
  }

  function exportFile() {
    const canvas = canvasRef.current;
    if (!canvas || !dirtyRef.current) return;
    canvas.toBlob((blob) => {
      if (!blob) return;
      onChange(
        new File([blob], "signature.png", {
          type: "image/png",
          lastModified: Date.now()
        })
      );
    }, "image/png");
  }

  function clear() {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (canvas && ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    dirtyRef.current = false;
    setHasDrawing(false);
    onChange(null);
  }

  return (
    <div className="grid gap-2">
      <canvas
        ref={canvasRef}
        className="h-40 w-full touch-none rounded-md border border-dashed border-[#cbd7e3] bg-white"
        onPointerDown={startStroke}
        onPointerMove={moveStroke}
        onPointerUp={endStroke}
        onPointerLeave={endStroke}
      />
      <div className="flex items-center justify-between">
        <span className="text-xs font-normal text-[#5f6c7b]">
          {hasDrawing
            ? fileName
              ? `Signed: ${fileName}`
              : "Signed"
            : "Sign above using your mouse or finger."}
        </span>
        <Button
          intent="secondary"
          type="button"
          className="px-3 py-1 text-xs"
          onClick={clear}
        >
          Clear
        </Button>
      </div>
    </div>
  );
}
