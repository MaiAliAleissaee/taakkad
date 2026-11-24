/** Fixed-origin callers only. Does not implement an arbitrary URL proxy. */
export async function boundedJson(response: Response, maxBytes = 65536): Promise<unknown> {
  if (!response.ok || !response.body || !/application\/(?:[\w.-]+\+)?json/i.test(response.headers.get("content-type") ?? "")) { await response.body?.cancel(); throw new Error("Response unavailable"); }
  if (Number(response.headers.get("content-length") ?? 0) > maxBytes) { await response.body.cancel(); throw new Error("Response oversized"); }
  const reader = response.body.getReader(); const decoder = new TextDecoder(); let bytes = 0, text = "";
  try {
    while (true) { const chunk = await reader.read(); if (chunk.done) break; bytes += chunk.value.byteLength; if (bytes > maxBytes) { await reader.cancel(); throw new Error("Response oversized"); } text += decoder.decode(chunk.value, { stream: true }); }
    return JSON.parse(text + decoder.decode());
  } finally { reader.releaseLock(); }
}