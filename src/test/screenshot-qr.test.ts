import { it,expect } from "vitest";
import { decodeQrPixels } from "@/lib/screenshot/qr";
import { qrMatrices } from "./fixtures/screenshot-qr";

function image(pair:boolean) {
  const width=700,height=340,scale=8,data=new Uint8ClampedArray(width*height*4).fill(255);
  for(let index=0;index<(pair ? 2 : 1);index++) {
    const rows=qrMatrices[index];if(!rows)throw new Error("missing fixture");
    rows.forEach((row,y)=>[...row].forEach((bit,x)=>{
      if(bit!=="1")return;
      for(let dy=0;dy<scale;dy++) for(let dx=0;dx<scale;dx++) {
        const offset=((y*scale+dy+20)*width+x*scale+dx+20+index*350)*4;
        data[offset]=0;data[offset+1]=0;data[offset+2]=0;
      }
    }));
  }
  return {data,width,height};
}
it("decodes a real synthetic URL QR without visiting it",()=>{const i=image(false);expect(decodeQrPixels(i.data,i.width,i.height)).toEqual(["https://qr-pay.example"]);});
it("decodes adjacent URL and javascript QR codes only as inert strings",()=>{const i=image(true);expect(decodeQrPixels(i.data,i.width,i.height).sort()).toEqual(["https://qr-pay.example","javascript:alert(1)"].sort());});
it("does not mutate source image pixels",()=>{const i=image(true),original=i.data.slice();decodeQrPixels(i.data,i.width,i.height);expect(i.data.every((value,index)=>value===original[index])).toBe(true);});
it("does not fabricate a QR in a blank image",()=>expect(decodeQrPixels(new Uint8ClampedArray(100*100*4).fill(255),100,100)).toEqual([]));