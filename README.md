# تأكّد | TAAKKAD

**التحقق من الهوية الرقمية والكشف المساعد بالذكاء الاصطناعي عن انتحال الجهات**
**Digital identity verification and AI-assisted organization impersonation detection**

**Hackathon prototype / نموذج أولي للهاكاثون** — not an official UAE government service, operational police platform, or production-ready system.
ليس خدمة حكومية إماراتية رسمية ولا منصة شرطية تشغيلية ولا نظاماً جاهزاً للإنتاج.

- Live demo / العرض المنشور: https://taakkad.lovable.app
- Source repository / المستودع: https://github.com/MaiAliAleissaee/taakkad
- Submission branch / فرع التسليم: **master** (default branch / الفرع الافتراضي)
- Documentation / الوثائق: [ARCHITECTURE.md](ARCHITECTURE.md) · [AI_IMPLEMENTATION_REPORT.md](AI_IMPLEMENTATION_REPORT.md) · [TEST_REPORT.md](TEST_REPORT.md) · [DEMO_GUIDE.md](DEMO_GUIDE.md) · [PRESENTATION_OUTLINE.md](PRESENTATION_OUTLINE.md) · [docs/](docs/)

The deployed website is a demonstration, not proof of production readiness or external verification. All seeded examples are fictional.
الموقع المنشور لأغراض العرض التجريبي، ولا يُعد إثباتاُ للجاهزية التشغيلية أو التحقق المستقل من الجهات. جميع الأمثلة المُعدّة للعرض خيالية.

---

## Judges' Demo Access | بيانات الدخول التجريبية للجنة التحكيم

These are **temporary hackathon demonstration accounts** for judging only; they will be disabled or have their passwords changed after the evaluation.
هذان **حسابان تجريبيان مؤقتان لأغراض الهاكاثون** مخصّصان للتحكيم فقط، وسيتم تعطيلهما أو تغيير كلمتي المرور بعد انتهاء التقييم.

Live website / الموقع المنشور: https://taakkad.lovable.app

### Organization Approval Officer | موظف اعتماد الجهات

- Username / اسم المستخدم: `HAM123`
- Password / كلمة المرور: `tryham123456789`
- Sign-in page / صفحة الدخول: https://taakkad.lovable.app/organizations (staff sign-in section / قسم دخول الموظفين)
- Lands on / يوصل إلى: https://taakkad.lovable.app/officer
- What to test / ما يمكن اختباره: review submitted organization applications, view declared corporate relationships and advisory similarity warnings, then Approve, Reject or Request Additional Information; approved organizations appear automatically in the public registry with a green "Approved / معتمد" badge; review channel management and audit history.
  مراجعة طلبات الجهات، والاطلاع على العلاقات المؤسسية المُصرّح بها وتحذيرات التشابه الاستشارية، ثم الاعتماد أو الرفض أو طلب معلومات إضافية؛ تظهر الجهات المعتمدة تلقائياً في السجل العام بشارة "معتمد" خضراء؛ ومراجعة إدارة القنوات وسجل التدقيق.

### Security Analyst | المحلل الأمني

- Username / اسم المستخدم: `ham1234`
- Password / كلمة المرور: `tryham2123456789`
- Sign-in page / صفحة الدخول: https://taakkad.lovable.app/auth
- Lands on / يوصل إلى: https://taakkad.lovable.app/security
- What to test / ما يمكن اختباره: the Security Dashboard — private cases and reports, correlation graph of shared indicators, proactive lookalike-domain intelligence and imports, evidence timelines with SHA-256 attachments, PDF/JSON evidence exports, and human-approved recommended actions.
  لوحة الأمن — القضايا والبلاغات الخاصة، ومخطط كشف الارتباط للمؤشرات المشتركة، والرصد الاستباقي للنطاقات المشابهة والاستيراد، والخطوط الزمنية للأدلة مع بصمات SHA-256، وتصدير الأدلة PDF/JSON، والإجراءات الموصى بها بموافقة بشرية.

Login instructions / تعليمات الدخول:
1. Open the sign-in page for the required role and enter the username and password above / افتح صفحة الدخول الخاصة بالدور وأدخل اسم المستخدم وكلمة المرور أعلاه.
2. After sign-in the application routes automatically by role: officers to `/officer`, analysts to `/security` / يُوجَّه المستخدم آلياً حسب الدور.
3. Each account holds exactly one role. An officer who opens `/security`, or an analyst who opens `/officer`, sees a bilingual access-denied dialog / كل حساب يملك دوراً واحداً فقط، ومحاولة فتح مساحة الدور الآخر تُظهر رسالة رفض ثنائية اللغة.
4. Use **Sign out / تسجيل الخروج** after the demonstration / سجّل الخروج بعد العرض.

No API keys or environment secrets are committed to this repository / لا تُنشر مفاتيح API أو أسرار البيئة في هذا المستودع.

---

## 1. Overview: problem and proposed solution | نظرة عامة: المشكلة والحل

**English:** People receive messages, calls and links that imitate familiar organizations, and often have no clear way to check whether a channel is official or to report suspicious indicators. Taakkad demonstrates three connected surfaces: a public checker for channels, links, messages and screenshots; a registration and review workflow for organizations; and an analyst dashboard for reports, evidence and cross-report leads. AI output is advisory evidence for a human reviewer — it never establishes that a person or organization is fraudulent, and simulated approvals in this prototype are not real-world verification.

**العربية:** يتلقى الأفراد رسائل واتصالات وروابط تنتحل صفة جهات معروفة، وغالباً لا تتوافر لهم طريقة واضحة للتحقق من القناة الرسمية أو الإبلاغ عن مؤشرات الاشتباه. يعرض «تأكّد» ثلاث مساحات مترابطة: بوابة عامة لفحص القنوات والروابط والرسائل ولقطات الشاشة، ومسار تسجيل ومراجعة للجهات، ولوحة أمنية للبلاغات والأدلة وروابط التحقيق. مخرجات الذكاء الاصطناعي أدلة استشارية للمراجع البشري، ولا تثبت أن شخصاً أو جهة احتيالية، والاعتمادات التجريبية في هذا النموذج ليست توثيقاً حقيقياً.

## 2. The three portals and their functionality | البوابات الثلاث ووظائفها

### A. Public Trust Portal / بوابة الثقة العامة — `/trust`
- Visit-private channel and message checks: results stay in the component during the visit and are not stored automatically / الفحص خاص بالزيارة ولا يُحفظ تلقائياً.
- Official-channel registry search over individually approved, active channels / البحث في سجل القنوات المعتمدة النشطة.
- Local URL analysis: host and registrable-domain extraction, Punycode/IDN handling, brand lookalikes, misleading subdomains, userinfo, shorteners and sensitive paths / تحليل محلي للروابط.
- Local supervised machine-learning classifier beside the deterministic rules / نموذج تعلّم آلي محلي بجانب القواعد.
- Screenshot analysis: Arabic/English OCR and QR extraction, fully in the browser / تحليل لقطة الشاشة محلياً.
- Optional paid semantic AI analysis (requires an active signed-in session) / تحليل دلائي اختياري يتطلب جلسة دخول.
- Five-digit reference-only organization status tracking / متابعة الطلبات بالرقم المرجعي فقط.
- Explicit, write-only suspicious-indicator reporting / بلاغ صريح للإرسال فقط.
- Bilingual public prevention guidance linked to detected UAE scenario cues / إرشادات وقائية ثنائية اللغة.

### B. Organization Portal / بوابة الجهات — `/organizations`
- Six-field bilingual demonstration registration: organization name, website, contact email, social account, phone number, SMS Sender ID / تسجيل بستة حقول.
- Optional corporate relationship declaration (independent, parent, subsidiary, sister, corporate group/common ownership, shared channels, shared provider, other) / إقرار اختياري بالعلاقة المؤسسية.
- Communication channels are created automatically from the submitted values with pending status / تُنشأ القنوات تلقائياً بوضع «معلّق».
- Staff sign-in for the verification officer, plus status tracking and registry access / دخول الموظفين للموظف المختص.
- Public registry of staff-approved prototype organizations under **Approved Organizations / الجهات المعتمدة** with a green **Approved / معتمد** badge / السجل العام للجهات المعتمدة.

### C. Police Security Dashboard / اللوحة الأمنية — `/security`
- Report review, fraud connections, shared-indicator correlation and investigation graph / مراجعة البلاغات وشبكة الارتباط.
- Analyst-only proactive intelligence: candidate generation, DNS/RDAP observations, attributed imports, private early warnings / الرصد الاستباقي للمحلل.
- Public security bulletins (published-only projection) separate from private cases / نشرات أمنية عامة منفصلة عن القضايا الخاصة.
- Private evidence attachments, timelines, JSON packages and printable bilingual PDF reports / الأدلة الخاصة والتقارير.
- Bilingual statistics and reports with colored values / إحصائيات وتقارير ثنائية اللغة.
- Officer review lives in the separate role-gated workspace `/officer` / مراجعة الموظف في مساحة مخصصة.

## 3. AI-assisted detection, machine learning, OCR and QR | الذكاء الاصطناعي والتعلّم الآلي وOCR وQR

| Layer / الطبقة | Implementation / التنفيذ | Boundary / الحد |
|---|---|---|
| Semantic AI | Lovable AI Gateway, model `openai/gpt-6.1-sol`, server-side only / استدلال دلالي على الخادم | Requires an active signed-in session; browser- and server-side redaction before inference; validated structured output; indicators must be grounded in supplied text / يتطلب جلسة نشطة وحجباً للبيانات |
| Local rules | Deterministic channel, URL, UAE phone and language heuristics / قواعد حتمية | Explainable, offline, anonymous / تفسيري ومحلي ومجهول |
| Local ML | Compact offline-trained 40-tree URL classifier, bundled and run in the app / نموذج محلي | Advisory only; never grants verification / استشاري فقط |
| OCR | Tesseract.js 7.0.0, Arabic + English, lazy-loaded browser worker, same-origin assets / قراءة نصية محلية | Images and extracted text are not uploaded by the OCR path / لا تُرفع الصور |
| QR | jsQR 1.4.0, up to five payloads, bounded crops / فك تشفير QR محلي | Decoded payloads are inert text; destinations are never visited / لا تُفتح الوجهات |
| Hybrid assessment | Rules + ML + optional semantic findings combined with registry facts / دمج المؤشرات | Registry facts stay separate from AI interpretation / حقائق السجل مستقلة |

Usage limits / حدود الاستخدام: **five paid semantic requests per authenticated user per rolling ten minutes; 200 globally per UTC day.** Basic local rules/ML, registry search and write-only reporting remain anonymous. Resetting browser cookies does not reset the authenticated budget.
خمسة طلبات تحليل دلالي للمستخدم المسجل كل عشر دقائق و200 يومياً إجمالياً؛ تبقى الفحوص الأساسية والبحث في السجل والإبلاغ متاحين دون دخول.

## 4. Actual ML evaluation results | نتائج التقييم الفعلية

**Methodology / المنهجية:** domain-disjoint train/validation splits with an unseen final holdout; fixed seeded-hash ranking for external sampling; original development domains excluded before prediction; no tuning on held-out mistakes; labels never altered; fraudulent URLs stored defanged and never visited. Frozen hashes and manifests: [docs/evaluation/](docs/evaluation/). Reproduce: `bun scripts/evaluate-urls.ts`, `bun scripts/evaluate-phase1b.ts`, `bun scripts/evaluate-phase1b-resume.ts --final`, `bunx vitest run`.

| Evaluation / التقييم | Data source / المصدر | Set / العينة | TP/TN/FP/FN | Precision | Recall | F1 | Accuracy | FPR |
|---|---|---|---|---|---|---|---|---|
| Phase 1 deterministic URL rules | Synthetic labelled fixtures [src/test/fixtures/url-evaluation.ts](src/test/fixtures/url-evaluation.ts) | 48 held-out | 21/23/1/3 | **95.45%** | **87.50%** | **91.30%** | **91.67%** | **4.17%** |
| Phase 1B controlled reviewer cases | 39 new reviewer-labeled cases | 39 | 16/17/2/4 | — | **80%** | — | **84.62%** | — |
| Phase 1B external historical set | UCI ML Repository dataset 967 (PhiUSIIL URL phishing) | 1,000 | 5/500/0/495 | — | **1%** | — | **50.50%** | 0% |
| Phase 1B resumed final holdout | UCI 967, domain-disjoint final holdout | 1,000 | 0/500/0/500 | undefined (no predicted positives) | **0%** | **0%** | **50%** | **0%** |
| Phase 1C trained classifier | Same-source balanced historical data, unseen holdout | 4,000 | 1182/1914/86/818 | **93.22%** | **59.10%** | **72.34%** | **77.40%** | **4.30%** |

**What these numbers do and do not mean / ما تعنيه ولا تعنيه:** the Phase 1C classifier is the model actually shipped in the public checker; its 77.40% accuracy is a balanced historical same-source result, **not production accuracy** and not a benchmark of the paid semantic AI. Independent external generalization remained poor (50% accuracy, 0% recall on the final PhiUSIIL holdout), which is reported rather than hidden. URL-only inspection cannot recover page-content or cloaking deception. A legitimate ADCB homepage scored 20 (Low) while a legitimate sensitive path `www.adcb.com/login/payment` scored **65** from local ML — a disclosed false-warning limitation that was kept and documented, not selected away. Risk scores are ordinal evidence, **not calibrated fraud probabilities**.

## 5. Proactive threat intelligence | الرصد الاستباقي

- Lookalike domain candidate generation from curated brand/organization references / توليد نطاقات مشابهة مرشّحة.
- Real, explicit free DNS observations (A/AAAA/CNAME, MX, NS, CAA, RIPE routing) sent as hostname only / فحوص DNS فعلية باسم المضيف فقط.
- RDAP registration metadata where available (`.com`, `.net`, `.org`); `.ae` has no IANA RDAP service and reports unavailable / بيانات RDAP عند توفرها.
- Attributed manual and batch suspicious-source imports with bilingual field-level validation / استيراد يدوي ودفعي منسوب المصدر.
- Cross-report shared-indicator correlation (domain, phone, email, social, SMS sender ID, hosting IP, DNS/ASN) / ربط المؤشرات المشتركة.
- Private analyst-only early warnings with provenance; generated, confirmed and synthetic records stay distinctly labelled / تحذيرات خاصة بالمحلل مع توثيق المصدر.
- **No suspicious website is ever visited, and nothing is published as an accusation.** DNS or RDAP data is not ownership proof or fraud proof.
لا تُفتح أي مواقع مشبوهة ولا يُنشر أي اتهام؛ بيانات DNS/RDAP ليست إثبات ملكية ولا دليلاً على الاحتيال.

## 6. Organization registration, relationships, similarity warnings and approval | التسجيل والعلاقات والتحذيرات والاعتماد

- **Six fields only** / ستة حقول فقط: name, website, contact email, social account, phone, SMS Sender ID. No applicant account, OTP or secret is required to register.
- **Relationship declaration** / إقرار العلاقة: independent organization, parent company, subsidiary, sister company, corporate group/common ownership, shared communication channels, shared service/hosting provider, other — with related organization and explanation.
- **Similarity warnings are officer-only advice** / تحذيرات التشبه استشارية للموظف فقط: only channel/domain or technical indicator matches produce a notice; a matching name alone does not. The notice shows the matching organization, the matching indicator and the declared corporate relationship.
- **Shared IP addresses, nameservers and ASN are contextual indicators, never proof of fraud** / العناوين والبُنى المشتركة قرينة سياق لا دليل احتيال.
- **No approval blockers were added because of similarity** / لا عوائق اعتماد إضافية: no mandatory conflict-resolution form, no extra confirmation checkbox, no separate resolution step.
- **The three original staff actions are preserved** / الإجراءات الثلاثة الأصلية: Approve / اعتماد, Reject / رفض, Request Additional Information / طلب معلومات إضافية — each with a required note, a confirmation step, role authorization and audit logging.
- Approved organizations appear automatically in the public registry with the green **Approved / معتمد** badge; pending, rejected and unapproved organizations never appear / الجهات المعتمدة تظهر تلقائياً في السجل.
- The global prototype disclaimer stays in force: simulated approval is not genuine identity verification / الاعتماد التجريبي ليس توثيقاً حقيقياً.

## 7. Five-digit reference-only status tracking | المتابعة بالرقم المرجعي فقط

Public tracking needs **only the existing five-digit reference number** — no password, no secret.
المتابعة العامة تحتاج الرقم المرجعي من خمسة أرقام فقط، دون كلمة مرور أو سر.

- The response contains exactly four fields / الاستجابة أربعة حقول فقط: reference number, submission date, application status, and one fixed generic bilingual message / الرقم، تاريخ التقديم، الحالة، ورسالة عامة ثابتة.
- Never returned / لا تُعرض أبداً: applicant names, organization private details, contact information, documents, internal notes, rejection reasons or any other sensitive record.
- Server-side enforcement / إنفاذ على الخادم: privileged read of deliberately public projection columns only; payloads and receipt hashes are never fetched in this path.
- Rate limiting and enumeration protection / حدّ المعدّل والحماية من التخمين: 20 lookup per caller per hour and 1,000 global lookups per hour; misses are charged exactly like hits.
- Private receipt protections remain separate / حماية الإيصال الخاص مستقلة: the optional private receipt (reference + 256-bit secret, SHA-256 stored) still protects the private status path and the legacy email-code flow; the obsolete officer receipt-recovery screen has been removed.
- The five-digit space is small by design; the remaining privacy risk is stated in section 11 / المخاطر المتبقية موضحة في القسم 11.

## 8. Security dashboards, evidence, exports and correlation | اللوحات الأمنية والأدلة والتقارير

- Role-gated `/security` analyst workspace and `/officer` review workspace with separate authorization / مساحتان مفصولتان بالصلاحيات.
- Investigation graph: type-aware, deduplicated indicator nodes and case links; leads are human-review hints, never offender attribution / شبكة تحقيق خيوطها للتحقق البشري.
- Private evidence: bounded PNG/JPEG attachments (512 KiB), server-computed SHA-256 hashes, owner-private rows under row-level policies, append-only events and bounded rates / أدلة خاصة محدودة ببصمات خادم.
- Timelines with UTC and UAE (Asia/Dubai) timestamps, typed source attribution and available DNS/RDAP/hosting observations / تسلسل زمني UTC/الإمارات مع نسب المصدر.
- Exports: JSON evidence packages with manifest, and printable bilingual PDF reports rendered with escaped text through the browser print dialog / حزم JSON وتقارير PDF ثنائية اللغة.
- Recommended police actions are evidence-based suggestions that require explicit human confirmation; nothing is transmitted externally and no takedown is automated / الإجراءات المقترحة تعتمد على أدلة وتتطلب موافقة بشرية.
- Public security bulletins are a published-only projection maintained by an atomic role-authorized command with private audit / النشرات العامة إسقاط منشور فقط.

## 9. Technical architecture, tools, APIs and data sources | البنية التقنية والأدوات والمصادر

| Component / المكوّن | Implementation / التنفيذ |
|---|---|
| Framework | TanStack Start v1, React 19, TypeScript, Vite 7 |
| Styling | Tailwind CSS v4, bilingual RTL/LTR layout / واجهة ثنائية اللغة مع دعم RTL |
| Data | TanStack Query, route loaders and server functions / TanStack Query ووظائف خادم |
| Backend | Lovable Cloud (managed Postgres, auth, row-level policies, storage) / خدمات مُدارة |
| AI | Lovable AI Gateway, `openai/gpt-6.1-sol` / بوابة الذكاء الاصطناعي |
| Local ML | Offline-trained compact tree classifier bundled with the app / نموذج محلي |
| OCR / QR | Tesseract.js 7.0.0, jsQR 1.4.0 (self-hosted, pinned assets) |
| URL parsing | `tldts` public suffix data, Punycode/IDN handling |
| Network signals | Google DNS / RIPE routing (hostname only), RDAP for `.com`/`.net`/`.org` |
| Testing | Vitest; SQL and Python contracts outside Vitest |
| Reference data | Curated UAE official references; fictional `.example` domains for all demo records |

Migrations live in `drizzle/`; `scripts/hackathon-demo-data.sql` is additive and idempotent for authorized data tools — it is not a page-load seed or a fresh-backend installer.
ملفات التهيئة في `drizzle/`؛ ملف البيانات التجريبية إضافي وقابل للتكرار ولا يُطبَّق عند تحميل الصفحة.

## 10. Installation, build, run and test | التثبيت والبناء والتشغيل والاختبار

```bash
bun install
bun run dev      # development server / خادم التطوير
bun run test     # test suite / مجموعة الاختبار
bun run build    # production build / بناء الإنتاج
```

- Prerequisites / المتطلبات: Bun and a current Node-compatible development environment; Cloud-backed workflows need the project's configured Lovable Cloud services.
- Targeted checks / فحوص موجهة: `bunx vitest run src/test/<file>.test.ts`.
- Evaluation reproduction / إعادة إنتاج التقييم: `bun scripts/evaluate-urls.ts`, `bun scripts/evaluate-phase1b.ts`, `bun scripts/evaluate-phase1b-resume.ts --final`, `python3 scripts/sample-phase1b-public.py <csv>`, `python3 scripts/test_scan_url.py`.
- Do not manually edit generated Cloud clients/configuration, and never commit private credentials / لا تعدّل ملفات Cloud المُولّدة ولا ترفع بيانات اعتماد.
- Full regression at the last published release: **424 tests across 37 files**. Latest focused workflow checks: **80 tests** covering declarations, advisory filtering, officer requirements, registry filtering, private access and public reference privacy.
- A fresh clone alone may not reproduce the managed backend without the required configuration and permissions.

## 11. Security, privacy, known limitations and remaining risk | الأمان والخصوصية والحدود والمخاطر المتبقية

**Security controls / ضوابط الأمان**
- Data minimization, redaction in the browser and again server-side before AI inference, validated structured output / تقليل الجمع والحجب قبل الاستدلال.
- Separated staff roles with server-side authorization plus Cloud row-level policies; client-side visibility is never the control / أدلة منفصلة وإنفاذ على الخادم.
- Paid semantic AI requires an active authenticated session with hashed per-user usage and a shared daily ceiling / التحليل المدفوع يتطلب جلسة.
- Applications, documents, staff notes, evidence and private reports stay out of the browser bundle and out of the public registry / الطلبات والمستندات والأدلة خاصة.
- Public reporting is write-only; public checks are visit-local and never auto-persist / الفحص العام محليّ بالزيارة، والبلاغ للإرسال فقط.
- Screenshots stay in the owning browser component; the OCR path performs no image or text upload / لقطات الشاشة لا تُرفع.
- No passwords, API keys or environment secrets are committed to this repository.

**Known limitations / حدود معروفة**
- No independent verification of domain ownership or organizational authorization; RDAP is registration metadata, not identity proof.
- No cryptographic message authentication; caller ID and SMS sender IDs can be spoofed.
- No live monitoring, takedown, content removal or IP geolocation service is connected.
- Visual impersonation assessment is limited to URL/Unicode cues and human-reviewed screenshot evidence; there is no logo/pixel similarity or screenshot classifier.
- Emirati dialect and mixed-language cues are deterministic heuristics, not a measured language model; they may miss paraphrase, Arabizi, audio and complex negation.
- `.ae` registration dates are unavailable; redirect expansion, cloaking, page content and live TLS inspection remain unverified because submitted links are never opened.
- Publication requires independent Security Supervisor approval; neither demo staff account is a Supervisor.
- Owner-verified username/password entry, genuine Cloud evidence attachment persistence and owner-authenticated exports remain **unverified** by the account owner; automated checks used restored sessions, not password entry.
- The published website demonstrates the prototype; publishing does not validate production security, performance, legal compliance or external integrations.

**Remaining reference-only tracking privacy risk / المخاطر المتبقية في المتابعة بالرقم المرجعي**
The five-digit reference space holds at most 90,000 values. Reference-only tracking therefore reveals, to anyone who can guess a live number, that *some* application exists with that status and submission date — a low-value but real existence signal. This is an accepted, deliberate trade-off for a judge-friendly demo and was reported by the security scan as a warning that was **not** dismissed. Mitigations in force: only four non-sensitive fields are returned, generic messages never expose reasons or private details, misses are rate-charged like hits, per-caller and global hourly ceilings apply, and the private receipt path remains required for anything beyond that projection. Reducing this risk further would require longer references or an issued secret, which would undo the reference-only simplicity the prototype was asked to provide.
الرقم من خمسة أرقام يحوي ما لا يزيد على 90,000 قيمة، لذا يمكن لمن يخمّن رقماً نشطاً أن يعرف أن طلباً ما موجود بحالته وتاريخه؛ وهذا مقصود للعرض ومُبلَّغ عنه في الفحص الأمني دون تجاهله.

## 12. UAE relevance and proposed police pilot roadmap | الصلة بالإمارات ومسار التجربة الشرطية المقترح

**UAE relevance / الصلة بالإمارات**
- Curated UAE government and banking references with visible provenance, kept separate from channel approval / مراجع حكومية ومصرفية موثقة.
- Fictional demonstration scenarios for UAE PASS, TAMM, traffic/fines, delivery and payment fraud, including unsolicited approval and mixed-language bank-support patterns, all using reserved `.example` links / سيناريوهات إماراتية خيالية.
- Emirati/Arabic/English/mixed request cues such as طرشلي الكود, عطنا OTP, الحين, and «حوّل … درهم», with Arabic diacritic/alef/digit normalization / مؤشرات لهجية حتمية.
- UAE phone normalization (+971, 00971, 05x/0x, Arabic/Persian digits) so equivalent formats share one comparison key / توحيد صيغ الأرقام الإماراتية.
- Official help-desk references (for example UAE PASS 600 561 111) are reference information only and never grant channel approval or message authentication / المراجع الرسمية معلومات مرجعية فقط.
- Bilingual public prevention guidance and private police-review recommendations tied to detected cues / إرشادات وقائية وتوصيات شرطية ثنائية اللغة.

**Proposed pilot roadmap / مسار التجربة المقترح** — a proposal, not an installed integration or partnership / مقترح وليس تكاملاً مفعّلاً:
1. **Pilot A — read-only triage / تجربة الفحص فقط:** a police or regulator unit reviews public reports and registry status without changing detection policy; measure false-warning and miss rates on real submissions.
2. **Pilot B — authorized channel registry / سجل قنوات مخوّل:** organizations manage their own channels through permission-controlled self-service with verified domain ownership; simulated approvals are replaced by authoritative evidence.
3. **Pilot C — sourced intelligence feed / تغذية مؤشرات موثقة:** consented and attributed intelligence sources with documented consent, retention and appeal workflows; no auto-publication of accusations.
4. **Pilot D — evidence handoff / تسليم الأدلة:** JSON/PDF evidence packages reviewed by a human officer before any external action, with full audit and independent security testing.
Each stage requires independent security and legal review, official authorization, and explicit human approval before any external action.

## 13. Live demo and repository links | روابط العرض والمستودع

- Live demo / العرض المنشور: https://taakkad.lovable.app
- Public Trust Portal / البوابة العامة: https://taakkad.lovable.app/trust
- Organization Portal / بوابة الجهات: https://taakkad.lovable.app/organizations
- Organization registry / سجل الجهات: https://taakkad.lovable.app/organizations (registry section)
- Application tracking / متابعة الطلب: https://taakkad.lovable.app/organizations (tracking form)
- Public alerts / التنبيهات العامة: https://taakkad.lovable.app/alerts
- Staff sign-in / دخول الموظفين: https://taakkad.lovable.app/auth
- Officer workspace / مساحة الموظف: https://taakkad.lovable.app/officer
- Analyst workspace / مساحة المحلل: https://taakkad.lovable.app/security
- Source repository / المستودع: https://github.com/MaiAliAleissaee/taakkad

## 14. Submission branch | فرع التسليم

The GitHub repository uses **master** as its default branch. The hackathon prototype, source code, and technical documentation are available in this branch.
يعتمد مستودع GitHub على الفرع **master** بوصفه الفرع الافتراضي، ويحتوي على النموذج الأولي للهاكاثون والكود المصدري والوثائق التقنية.

---

## Handoff documents | وثائق التسليم

- [ARCHITECTURE.md](ARCHITECTURE.md) — technical architecture / البنية التقنية
- [AI_IMPLEMENTATION_REPORT.md](AI_IMPLEMENTATION_REPORT.md) — AI implementation / تنفيذ الذكاء الاصطناعي
- [TEST_REPORT.md](TEST_REPORT.md) — testing evidence / توثيق الاختبارات
- [DEMO_GUIDE.md](DEMO_GUIDE.md) — demonstration guide / دليل العرض
- [PRESENTATION_OUTLINE.md](PRESENTATION_OUTLINE.md) — presentation outline / مخطط العرض
- [docs/PHASE_1B_REPORT.md](docs/PHASE_1B_REPORT.md) · [docs/PHASE_1C_REPORT.md](docs/PHASE_1C_REPORT.md) · [docs/PHASE_1C_SECURITY_REPORT.md](docs/PHASE_1C_SECURITY_REPORT.md) — URL accuracy, trained model and security fixes
- [docs/PHASE_2_REPORT.md](docs/PHASE_2_REPORT.md) — proactive intelligence / الرصد الاستباقي
- [docs/PHASE_3_REPORT.md](docs/PHASE_3_REPORT.md) — evidence and exports / الأدلة والتقارير
- [docs/PHASE_4_REPORT.md](docs/PHASE_4_REPORT.md) — UAE relevance / الصلة بالإمارات
- [docs/PHASE_5_REPORT.md](docs/PHASE_5_REPORT.md) — feasibility, scalability and presentation readiness
- [docs/SCREENSHOT_ANALYSIS_REPORT.md](docs/SCREENSHOT_ANALYSIS_REPORT.md) — OCR and QR / قراءة لقطات الشاشة
- [docs/ADVISORY_APPROVAL_REPORT.md](docs/ADVISORY_APPROVAL_REPORT.md) — simplified approval workflow / سير الاعتماد المبسّط
- [docs/ORGANIZATION_IDENTITY_CONFLICT_REPORT.md](docs/ORGANIZATION_IDENTITY_CONFLICT_REPORT.md) — identity leads / مؤشرات الهوية
- [demo-kit/](demo-kit/) — demonstration fixtures, QR samples, screenshots and source catalog

**Status summary / ملخص الحالة:** screenshot OCR/QR, the trained local URL model, proactive intelligence, evidence tools, UAE relevance work, the simplified advisory-only approval workflow, the single-section registry and reference-only tracking are implemented and tested; the published release reflects the screenshot Phase 5 deployment. Owner-verified staff password entry, genuine Cloud evidence persistence/export and the remaining reference-only tracking risk are the open items above. No claim in this file should be read as an operational, legal or police-authorization guarantee.
ميزات لقطات الشاشة والنموذج المحلي والرصد والأدلة والعمل الإماراتي وسير الاعتماد المبسّط والسجل ذي القسم الواحد والمتابعة بالرقم المرجعي مُنفَّذة ومُختبرة، والإصدار المنشور يعكس نشر المرحلة الخامسة. دخول الموظفين بكلمة المرور والتحقق من الأدلة في السحابة وتصديرها والمخاطر المتبقية للمتابعة بالرقم المرجعي هي البنود المفتوحة أعلاه.
