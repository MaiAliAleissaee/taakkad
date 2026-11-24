import jsQR from "jsqr";

/** Bounded overlapping crops avoid mixing finder patterns from adjacent QR codes. No destination is visited. */
export function decodeQrPixels(source: Uint8ClampedArray, width: number, height: number): string[] {
  const pixels = new Uint8ClampedArray(source);
  const regions = [[0,0,1,1],[0,0,.6,1],[.4,0,1,1],[0,0,1,.6],[0,.4,1,1],[0,0,.6,.6],[.4,0,1,.6],[0,.4,.6,1],[.4,.4,1,1]];
  const values: string[] = [];
  for (const region of regions) {
    const left=Math.floor((region[0] ?? 0)*width),top=Math.floor((region[1] ?? 0)*height),right=Math.floor((region[2] ?? 1)*width),bottom=Math.floor((region[3] ?? 1)*height);
    const w=right-left,h=bottom-top;
    const cropped=new Uint8ClampedArray(w*h*4);
    for(let y=0;y<h;y++) cropped.set(pixels.subarray(((y+top)*width+left)*4,((y+top)*width+right)*4),y*w*4);
    for(let n=0;n<5;n++) {
      const qr=jsQR(cropped,w,h,{inversionAttempts:"attemptBoth"});
      if(!qr) break;
      if(qr.data && qr.data.length<=2000 && !values.includes(qr.data)) values.push(qr.data);
      const corners=[qr.location.topLeftCorner,qr.location.topRightCorner,qr.location.bottomLeftCorner,qr.location.bottomRightCorner];
      const x0=Math.max(0,Math.floor(Math.min(...corners.map(p=>p.x)))-5),x1=Math.min(w,Math.ceil(Math.max(...corners.map(p=>p.x)))+5);
      const y0=Math.max(0,Math.floor(Math.min(...corners.map(p=>p.y)))-5),y1=Math.min(h,Math.ceil(Math.max(...corners.map(p=>p.y)))+5);
      for(let y=y0;y<y1;y++) for(let x=x0;x<x1;x++) {cropped.fill(255,(y*w+x)*4,(y*w+x)*4+4);pixels.fill(255,((y+top)*width+x+left)*4,((y+top)*width+x+left)*4+4);}
      if(values.length>=5) return values;
    }
  }
  return values;
}