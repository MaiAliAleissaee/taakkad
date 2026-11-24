import artifact from "./ml-model.json";
import { urlFeatures } from "./ml-features";
import { isBlockedHost } from "./analyze";

interface Tree { left: number[]; right: number[]; feature: number[]; threshold: number[]; value: number[] }
interface Model { version: string; kind: string; threshold: number; trees?: Tree[]; intercept?: number; learningRate?: number; mean?: number[]; scale?: number[]; weights?: number[] }
const model: Model = artifact;
export interface UrlMlResult { version: string; score: number; flagged: boolean; riskScore: number }
function treeValue(t: Tree, x: number[]): number {
  let node = 0;
  for (let guard = 0; guard < t.left.length; guard++) {
    const left = t.left[node], right = t.right[node], feature = t.feature[node], threshold = t.threshold[node];
    if (left === -1) return t.value[node] ?? 0;
    if (left === undefined || right === undefined || feature === undefined || threshold === undefined) return 0;
    node = (x[feature] ?? 0) <= threshold ? left : right;
  }
  return 0;
}
const sigmoid = (v: number) => 1 / (1 + Math.exp(-Math.max(-40, Math.min(40, v))));
/** Actual fixed learned inference, never requests a URL or persists a visitor's input.
 * Score is an uncalibrated dataset model output, not a real-world probability.
 */
export function classifyUrlMl(raw: string): UrlMlResult | null {
  const features = urlFeatures(raw);
  if (!features) return null;
  let u: URL;
  try { u = new URL(/^[a-z][a-z\d+.-]*:/i.test(raw.trim()) ? raw.trim() : `https://${raw.trim()}`); } catch { return null; }
  if (isBlockedHost(u.hostname)) return null;
  let score: number;
  if (model.kind === "logistic") score = sigmoid((model.intercept ?? 0) + features.reduce((sum, x, i) => sum + ((x - (model.mean?.[i] ?? 0)) / (model.scale?.[i] ?? 1)) * (model.weights?.[i] ?? 0), 0));
  else if (model.kind === "tree") { const t = model.trees?.[0]; if (!t) return null; score = treeValue(t,features); }
  else if (model.kind === "gradient_boosting" && model.trees) score = sigmoid((model.intercept ?? 0) + (model.learningRate ?? 0) * model.trees.reduce((sum,t) => sum + treeValue(t,features),0));
  else return null;
  if (!Number.isFinite(score)) return null;
  const flagged = score >= model.threshold;
  return {version: model.version, score, flagged, riskScore: flagged ? 65 : 0};
}