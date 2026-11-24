import { validateRaster, validateDimensions, type ScreenshotData } from "./model";
import { createClientOnlyFn } from "@tanstack/react-start";

export const readScreenshot = createClientOnlyFn(async (file: File, signal: AbortSignal, progress: (n: number) => void, validated: () => void): Promise<ScreenshotData> => {
  validateRaster(new Uint8Array(await file.arrayBuffer()),file.type);
  if (signal.aborted) throw new Error("cancelled");
  let bitmap: ImageBitmap;
  try { bitmap = await createImageBitmap(file); } catch { throw new Error("decode"); }
  let worker: Awaited<ReturnType<typeof import("tesseract.js").createWorker>> | null = null;
  const stop = () => { if (worker) void worker.terminate(); };
  signal.addEventListener("abort",stop,{once:true});
  try {
    validateDimensions(bitmap.width,bitmap.height);
    if (signal.aborted) throw new Error("cancelled");
    validated();
    const canvas = document.createElement("canvas");
    const scale = Math.min(1,2400/Math.max(bitmap.width,bitmap.height));
    canvas.width = Math.max(1,Math.round(bitmap.width*scale)); canvas.height = Math.max(1,Math.round(bitmap.height*scale));
    const context = canvas.getContext("2d",{willReadFrequently:true});
    if (!context) throw new Error("decode");
    context.drawImage(bitmap,0,0,canvas.width,canvas.height);
    const { decodeQrPixels } = await import("./qr");
    const pixels = context.getImageData(0,0,canvas.width,canvas.height);
    const qr = decodeQrPixels(pixels.data,pixels.width,pixels.height);
    if (signal.aborted) throw new Error("cancelled");
    try {
      const { createWorker, OEM } = await import("tesseract.js");
      worker = await createWorker(["ara","eng"],OEM.LSTM_ONLY,{
      workerPath: new URL("/ocr/worker.min.js",window.location.origin).href,
      corePath: new URL("/ocr/tesseract-core-lstm.wasm.js",window.location.origin).href,
      langPath: new URL("/ocr",window.location.origin).href,
      cacheMethod:"none", workerBlobURL:false,
      logger: m => { if (!signal.aborted) progress(m.status === "recognizing text" ? Math.round(30+m.progress*70) : Math.round(m.progress*25)); },
      });
    if (signal.aborted) throw new Error("cancelled");
    const { data } = await worker.recognize(canvas,{}, { text:true, blocks:true });
    const words = data.blocks?.flatMap(b=>b.paragraphs.flatMap(p=>p.lines.flatMap(l=>l.words))) ?? [];
    const text = data.text.slice(0,10000);
    return { text, confidence:data.confidence, qr, uncertainWords:words.filter(w=>w.confidence<60).map(w=>w.text).slice(0,30), incomplete:data.text.length>10000 || words.some(w=>w.bbox.x0<3 || w.bbox.y0<3 || w.bbox.x1>canvas.width-3 || w.bbox.y1>canvas.height-3) };
    } catch(e) {
      if(!signal.aborted && qr.length) return {text:"",confidence:0,qr,uncertainWords:[],incomplete:true};
      throw e;
    }
  } finally {
    signal.removeEventListener("abort",stop); bitmap.close(); if(worker) await worker.terminate();
  }
});