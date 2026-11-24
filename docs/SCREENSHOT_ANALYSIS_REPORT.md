# Focused public screenshot analysis — not Phase 5

## Implementation

The existing bilingual Trust Check now accepts manual-only, screenshot-only and combined inputs. There is no new public account requirement. Arabic/English Tesseract.js 7.0.0 OCR is lazy-loaded in a browser worker with same-origin runtime/language assets and no OCR cache. jsQR 1.4.0 decodes up to five QR payloads locally using bounded overlapping crops; destinations are never visited. The existing design, trained URL model, channel approval policy, staff roles and server security boundaries are unchanged.

PNG/JPEG/WebP are validated by declared MIME, raster signatures/header dimensions, actual browser decode/dimensions, an 8 MiB byte limit, 8192-pixel side limit and 16-million-pixel limit. Validation precedes preview. OCR is bounded to 2400 pixels on the longest side, 10,000 characters and ten extracted URLs/emails/phones per category. Mobile file selection and a camera capture request are available; actual camera availability depends on the device/browser.

Extracted text, QR data, link and optional visible sender are editable. Known UAE scenario/organization mentions are labeled as mentions, not verified identities. Body contact details are never automatically assumed to be the sender. Manual and screenshot link/sender disagreements are flagged and retained; normalized phone/URL equivalents are deduplicated. All retained screenshot URLs reuse the existing local URL rules/ML, registry and restricted-indicator matching. Additional URL results are shown individually. Local analysis never grants trust because OCR failed or found nothing; unreadable/conflicting extraction cannot produce a verified screenshot claim. Empty extraction yields no completed result. Numeric local scores cover readable values only; OCR confidence is displayed separately and is not a risk probability.

## Privacy and evidence

- Original screenshots stay in the owning component/browser worker, without automatic upload, server storage, query-cache or browser persistence. Removal/unmount cancels work, closes bitmaps, terminates workers and revokes preview URLs.
- Only indicator candidates are sent for existing registry/security matching when the visitor explicitly checks. Optional metadata remains separately opt-in; paid semantic inference retains existing login, redaction and budget checks. It receives reviewed/redacted text, never the image.
- Existing public reporting remains explicit and write-only: it shares reviewed text/indicators, not screenshot bytes. QR scripts, URLs and OCR text are untrusted strings, rendered as text and never executed or opened.
- An explicit consent checkbox enables saving the exact original locally for attachment using the existing authorized private evidence workflow. Actual local download byte equality was checked. No anonymous attachment endpoint, private case-ID exposure, role bypass or automatic staff attachment was introduced.
- **Attachment limitation:** public anonymous reports cannot automatically carry an image. Authorized staff must open the saved report and explicitly use its existing private evidence upload, with its unchanged PNG/JPEG and 512 KiB restrictions, source/time and authorization. WebP requires conversion; oversized originals require an appropriately labeled smaller derivative. Authentic staff attachment persistence remains NOT VERIFIED. Local downloads are not represented as completed Cloud attachments or server SHA-256 verification.

## Actual OCR and detection observations

Fictional synthetic fixtures only; no real personal information, official partnership, benchmark accuracy or visual-authentication claim. These are functional observations, not a representative OCR accuracy study.

| Fixture | Actual OCR / QR | Actual existing local detection |
|---|---|---|
| English JPEG: delivery payment/code request | 91% OCR confidence; URL, email and +971 phone read | Unverified channel; payment and credential-request warnings. No confirmed sender inferred. |
| Arabic PNG: UAE PASS request | 89% confidence; `طرشلي الكود الحين` and lookalike URL read; Arabic amount 5 was misread as 0; the phone was absent from the captured/cropped region | Suspicious indicators: official-reference lookalike plus credential/payment/urgency cues. OCR errors were not corrected silently. |
| Mixed Arabic/English WebP: TAMM fee | 92% confidence; URL/email and mixed wording read, word order changed | Unverified channel; payment and urgency warnings. |
| Fictional legitimate prevention reminder | 93% confidence; message read | Unverified, not suspicious; preserved keyword heuristic still warns on `password` in a preventive sentence. This pre-existing false-warning limitation was not hidden or refactored. |
| Heavily blurred Arabic image | 36% confidence; mostly gibberish, no reliable contacts | Unverified with incomplete-extraction warning; no complete-risk or safety claim. |
| Blank image | Empty text, 0% confidence, no QR | No completed detection result; manual entry/retry remains possible. |
| Adjacent synthetic URL and script QR codes | Initial whole-frame decode failed; bounded crop correction reads both `https://qr-pay.example` and `javascript:alert(1)`. OCR on QR patterns is gibberish, about 37% confidence | Payloads remain inert; URL is locally checked, script is not executed, extraction remains uncertain. |

## Verification

- **74 distinct targeted tests PASS** across screenshot validation/review/policy (20), actual QR decoding (4), worker privacy/cancellation/failure fallback (4), preserved private checking (7) and UAE relevance (39). Initial incorrect seed import was corrected and only its five failed tests rerun; a large typed-array assertion timed out and was replaced with a bounded equality check, then only that test rerun. Worker cleanup tests were rechecked after adding test teardown. No full-suite or benchmark repeat, model retraining or paid inference.
- Actual browser OCR used PNG, JPEG and WebP fixtures. Screenshot-only checks, combined conflicting URL, empty/blurred handling, manual-only fallback, Arabic/English controls, mobile 390px without horizontal overflow, invalid disguised SVG, oversized dimensions, retry and remove-during-reading were exercised. Screenshot screenshots were inspected.
- Isolated actual OCR network observation: **zero outbound POST or external requests while reading**. The longer language-switch/retry sequence also had zero POSTs; nine existing font loads and one Cloud background GET are separate from OCR. Its initially overstrict network assertion was corrected after categorizing those requests, not by changing app behavior. No automatic extracted-destination visit or page exception observed. No screenshot/OCR keys were created in local storage. Consent-only original download matched original bytes.
- Worker tests additionally verify same-origin model/runtime paths, disabled OCR cache, no preview/worker for invalid input, cancellation before processing, and QR retention after OCR failure.
- Managed preview compilation: latest **build OK**. Existing content routes retain their app-specific metadata; the pathless authenticated layout is not a content page.
- Production dependency audit: **no vulnerabilities found in 343 packages**; platform production dependency scan also reports no known vulnerabilities in 61 production dependencies. Fresh quick application scan at 12:18 UTC returns only the unchanged informational public-registry finding, with no critical/warning findings; no finding is fixed/ignored by this request.

## Remaining limitations / missing advanced capabilities

No logo/image authenticity comparison, visual deepfake/tamper detection, hidden hyperlink inspection, complete conversation reconstruction or externally verified capture time. OCR confidence can be high despite digit errors/cropping and script order errors. Tiny, rotated, blurred or complex QR codes may fail; no QR result is not proof of absence. Large mobile images may be slow; native HEIC is unsupported (select/convert to PNG/JPEG/WebP). Camera hardware, Safari/iOS behavior, offline cold-start without downloaded assets, genuine private evidence persistence and authentic staff login were not verified. No paid visual service or Phase 5 started.

## Release status

Code, actual local OCR/QR checks, targeted tests, compilation, dependency audits and quick security checks completed. A deep scan is being requested after saving the implementation; its coverage of the latest saved code must be confirmed before release. Screenshot publication is withheld pending that clearance. Existing published Phases 3/4 remain unchanged until release. No unrelated finding or registry policy has been modified.