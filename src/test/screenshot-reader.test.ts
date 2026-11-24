import { beforeEach,afterEach,it,expect,vi } from "vitest";
import { readScreenshot } from "@/lib/screenshot/reader";
const mocks=vi.hoisted(()=>({worker:vi.fn(),recognize:vi.fn(),terminate:vi.fn(),qr:vi.fn()}));
vi.mock("@tanstack/react-start",()=>({createClientOnlyFn:<T>(fn:T)=>fn}));
vi.mock("tesseract.js",()=>({OEM:{LSTM_ONLY:1},createWorker:mocks.worker}));
vi.mock("@/lib/screenshot/qr",()=>({decodeQrPixels:mocks.qr}));
const png=()=>{const b=new Uint8Array(33);b.set([137,80,78,71,13,10,26,10]);b.set([73,72,68,82],12);const view=new DataView(b.buffer);view.setUint32(16,200);view.setUint32(20,100);return b;};
const file=()=>({type:"image/png",arrayBuffer:async()=>png().buffer}) as File;
let closed: ReturnType<typeof vi.fn>;
afterEach(()=>{vi.restoreAllMocks();vi.unstubAllGlobals();});
beforeEach(()=>{
  vi.clearAllMocks();closed=vi.fn();
  vi.stubGlobal("createImageBitmap",vi.fn().mockResolvedValue({width:200,height:100,close:closed}));
  vi.spyOn(HTMLCanvasElement.prototype,"getContext").mockReturnValue({drawImage:vi.fn(),getImageData:()=>({data:new Uint8ClampedArray(200*100*4),width:200,height:100})} as unknown as CanvasRenderingContext2D);
  mocks.terminate.mockResolvedValue(undefined);mocks.qr.mockReturnValue([]);
  mocks.recognize.mockResolvedValue({data:{text:"hello",confidence:90,blocks:[]}});
  mocks.worker.mockResolvedValue({recognize:mocks.recognize,terminate:mocks.terminate});
});
it("uses same-origin language/runtime assets and disables OCR persistence",async()=>{
  const result=await readScreenshot(file(),new AbortController().signal,vi.fn(),vi.fn());
  expect(result.text).toBe("hello");
  expect(mocks.worker).toHaveBeenCalledWith(["ara","eng"],1,expect.objectContaining({cacheMethod:"none",workerBlobURL:false,workerPath:new URL("/ocr/worker.min.js",window.location.origin).href,langPath:new URL("/ocr",window.location.origin).href}));
  expect(mocks.terminate).toHaveBeenCalledOnce();expect(closed).toHaveBeenCalledOnce();
});
it("rejects invalid raster before decoding, worker use or preview",async()=>{
  const invalid={type:"image/png",arrayBuffer:async()=>new TextEncoder().encode("<svg/>").buffer} as File;
  const preview=vi.fn();await expect(readScreenshot(invalid,new AbortController().signal,vi.fn(),preview)).rejects.toThrow("type");
  expect(preview).not.toHaveBeenCalled();expect(createImageBitmap).not.toHaveBeenCalled();expect(mocks.worker).not.toHaveBeenCalled();
});
it("honors cancellation before worker/pixels are processed",async()=>{
  const controller=new AbortController();controller.abort();await expect(readScreenshot(file(),controller.signal,vi.fn(),vi.fn())).rejects.toThrow("cancelled");expect(mocks.worker).not.toHaveBeenCalled();
});
it("retains independently decoded QR when OCR fails, without a safety claim",async()=>{
  mocks.qr.mockReturnValue(["https://qr-pay.example"]);mocks.recognize.mockRejectedValue(new Error("OCR failed"));
  const result=await readScreenshot(file(),new AbortController().signal,vi.fn(),vi.fn());expect(result).toEqual({text:"",confidence:0,qr:["https://qr-pay.example"],uncertainWords:[],incomplete:true});expect(mocks.terminate).toHaveBeenCalledOnce();
});