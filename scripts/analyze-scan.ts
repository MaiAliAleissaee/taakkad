/** Analyze explicitly operator-acquired static HTML; never fetches URLs. */
import { readFileSync } from "node:fs";
import { z } from "zod";
import { inspectPageFixture, comparePageFixtures } from "../src/lib/services/url/controlled-scan";
import { analyzeUrl } from "../src/lib/services/url/analyze";
const schema = z.object({ scope: z.literal("operator_authorized_static_scan"), finalUrl: z.string().max(2000), html: z.string().max(131072).nullable(), hops: z.array(z.object({ url: z.string().max(2000) })).max(6), scriptsExecuted: z.literal(false) });
const path = process.argv[2];
if (!path) throw new Error("Supply an authorized scanner JSON capture");
const scan = schema.parse(JSON.parse(readFileSync(path, "utf8")));
const page = scan.html === null ? null : inspectPageFixture(scan.finalUrl, scan.html);
const first = scan.hops[0];
const initial = first ? analyzeUrl(first.url) : null;
const final = analyzeUrl(scan.finalUrl);
const secondPath = process.argv[3];
const second = secondPath ? schema.parse(JSON.parse(readFileSync(secondPath, "utf8"))) : null;
const differential = second && scan.html !== null && second.html !== null && scan.finalUrl === second.finalUrl ? comparePageFixtures(scan.finalUrl, scan.html, second.html) : null;
console.log(JSON.stringify({ scope: "operator_authorized_static_capture_analysis", finalUrl: scan.finalUrl, checkedHops: scan.hops.length, crossRegistrableDomain: initial?.domain !== final.domain, urlSuspicion: scan.hops.some(h => analyzeUrl(h.url).classification === "suspicious"), page: page ? { titleMismatch: page.titleMismatch, externalCredentialForm: page.externalCredentialForm, credentialFormCount: page.credentialFormCount, suspicious: page.suspicious } : null, differential: differential ? { partialCloakingIndicator: differential.partialCloakingIndicator, confirmedCloaking: false } : null, scriptsExecuted: false, confirmedCloaking: false }, null, 2));