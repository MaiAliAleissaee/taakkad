import { analyzeUrl } from "./analyze";
export function evaluateUrls(rows: readonly { url: string; label: "legitimate" | "suspicious"; id: string }[]) {
  let tp = 0, tn = 0, fp = 0, fn = 0;
  const errors: { id: string; expected: string; actual: string }[] = [];
  for (const row of rows) {
    const positive = analyzeUrl(row.url).classification === "suspicious";
    if (row.label === "suspicious") positive ? tp++ : fn++;
    else positive ? fp++ : tn++;
    if (positive !== (row.label === "suspicious")) errors.push({ id: row.id, expected: row.label, actual: positive ? "suspicious" : "not_suspicious" });
  }
  const divide = (a: number, b: number) => b ? a / b : 0;
  const precision = divide(tp, tp+fp), recall = divide(tp,tp+fn);
  return { size: rows.length, tp, tn, fp, fn, precision, recall, f1: divide(2*precision*recall,precision+recall), falsePositiveRate: divide(fp,fp+tn), accuracy: divide(tp+tn,rows.length), errors };
}
