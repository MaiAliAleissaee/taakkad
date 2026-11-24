import { reportLines, type EvidencePackage } from "./model";
export function downloadEvidence(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = name; document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url),30000);
}
export function attachmentBlob(content: string, mime: string) { return new Blob([Uint8Array.from(atob(content), c => c.charCodeAt(0))],{type:mime}); }
export function printEvidence(pack: EvidencePackage) {
  // Synchronous user gesture; textContent only, never interprets evidence as HTML.
  const win = window.open("", "_blank"); if (!win) return false;
  win.opener = null;
  win.document.title = `Taakkad evidence ${pack.reference}`;
  const style = win.document.createElement("style"); style.textContent = "@page{size:A4;margin:15mm}body{font:12px Arial,sans-serif;line-height:1.6}p{white-space:pre-wrap;overflow-wrap:anywhere;break-inside:avoid}h1{font-size:20px}img{max-width:100%;max-height:180mm;object-fit:contain;break-inside:avoid}";
  win.document.head.append(style);
  for (const [i,line] of reportLines(pack).entries()) { const el = win.document.createElement(i===0 ? "h1" : "p"); el.dir = "auto"; el.textContent = line; win.document.body.append(el); }
  const images = pack.attachments.filter(a => a.metadata.mime.startsWith("image/"));
  Promise.all(images.map(a => new Promise<void>(resolve => { const img = win.document.createElement("img"); img.alt = a.metadata.name; const url = URL.createObjectURL(attachmentBlob(a.content,a.metadata.mime)); img.onload = () => resolve(); img.onerror = () => resolve(); img.src = url; win.document.body.append(img); win.addEventListener("afterprint",() => URL.revokeObjectURL(url),{once:true}); }))).then(() => { win.focus(); win.print(); });
  return true;
}
