تأكّد | TAAKKAD
التحقق من الهوية الرقمية والكشف المساعد بالذكاء الاصطناعي عن انتحال الجهات
Digital identity verification and AI-assisted organization impersonation detection

Hackathon prototype / نموذج أولي للهاكاثون — not an official UAE government service, operational police platform, or production-ready system.
- Live demo / العرض المنشور: https://taakkad.lovable.app
- Source repository / المستودع: https://github.com/MaiAliAleissaee/taakkad
- Documentation / الوثائق: [ARCHITECTURE.md](ARCHITECTURE.md) · [AI_IMPLEMENTATION_REPORT.md](AI_IMPLEMENTATION_REPORT.md) · [TEST_REPORT.md](TEST_REPORT.md) · [DEMO_GUIDE.md](DEMO_GUIDE.md) · [PRESENTATION_OUTLINE.md](PRESENTATION_OUTLINE.md)
The deployed website is a demonstration, not proof of production readiness or external verification. All seeded examples are fictional.
الموقع المنشور لأغراض العرض التجريبي، ولا يُعد إثباتاً للجاهزية التشغيلية أو التحقق المستقل من الجهات. جميع الأمثلة المُعدّة للعرض خيالية.

1. المشكلة والحل | Problem and proposed solution
العربية: قد يتلقى الأفراد رسائل أو اتصالات تنتحل صفة جهة معروفة، ولا تتوافر لهم دائماً طريقة واضحة للتحقق من القناة الرسمية أو الإبلاغ عن مؤشرات الاشتباه. يقترح «تأكّد» بوابة عامة لفحص قنوات التواصل والرسائل، وسجلاً للقنوات المعتمدة في بيئة تجريبية، ومساراً منظماً لتسجيل الجهات ومراجعتها، ولوحة أمنية لمراجعة البلاغات والروابط بين المؤشرات. نتائج الذكاء الاصطناعي مؤشرات مساعدة وليست حكماً قاطعاً بوجود احتيال.

English: People may receive messages or calls impersonating familiar organizations without an easy way to check official channels or report suspicious indicators. Taakkad demonstrates a public channel/message checker, a fictional approved-channel registry, an organization registration and review workflow, and a security dashboard for reports and shared-indicator leads. AI results support review; they do not establish that a person or organization is fraudulent.
2. الوظائف الأساسية | Key features
- فحص عام وخاص بالزيارة | Visit-private public checks: channel/message checks with optional AI-assisted content analysis, explanations and explicit restricted reporting.
- طلبات الجهات | Organization applications: private registration, one-time tracking secret, email-code verification, original 24-hour edit deadline and officer-requested corrections.
- مراجعة مستقلة | Independent review: organization and channel review; private documents and audit trail; only approved, active channels appear publicly.
- لوحة أمنية | Security dashboard: reports, fraud connections, public security alerts, analytics and reports; display identifiers such as 1/2026 retain underlying legacy/internal IDs.
- تحليل الروابط | Investigation leads: type-aware graph, shared indicators, deduplicated domain views and correctly labeled documentation IP addresses.
- صلاحيات منفصلة | Separated staff roles: HAM123 Officer only; HAM1234 Analyst only. Staff passwords are not documented here. Officer entry is in the Organization Portal.
- بيانات تجريبية | Fictional demo data: ten reports, ten domain examples, ten existing application records, ten managed bulletins (three published and seven drafts), and ten copyable public examples, as described in the supplied project documentation.
3. البنية التقنية والذكاء الاصطناعي | Architecture and AI
Component / المكوّن	Current implementation / التنفيذ الحالي	Purpose / الغرض
Web application	TanStack Start, React 19, TypeScript	Typed interactive application and server functions / واجهة تفاعلية ووظائف خادم
Interface	Tailwind CSS v4	Responsive bilingual UI / واجهة متجاوبة ثنائية اللغة
Data fetching	TanStack Query	Query state and data synchronization / إدارة الاستعلامات
Hosting and managed services	Lovable Cloud	Prototype infrastructure and publishing / استضافة النموذج ونشره
Access control	App-internal server authorization plus Cloud row-level policies	Defense in depth for restricted records / طبقات حماية للبيانات المقيدة
AI	Managed AI Gateway; model identifier documented in the original project: openai/gpt-6.1-sol	Optional message analysis / تحليل اختياري للرسائل
AI safeguards	Browser- and server-side redaction, validated structured output, deterministic checks and rule-based fallback	Reduce exposure and avoid treating model output as verified fact / تقليل كشف البيانات وتجنب اعتبار النتائج حقائق مثبتة


العربية: تُحجب المعلومات الحساسة في المتصفح ومرة أخرى على الخادم قبل طلب الاستدلال. تُتحقق بنية المخرجات، وتُربط المؤشرات بالنص المقدم، وتُدمج مؤشرات المخاطر مع قواعد محددة دون تغيير حقائق السجل. تصنيفات المخاطر تفسيرية وليست احتمالات إحصائية معايرة. في حال تعطل خدمة الذكاء الاصطناعي، يظهر بديل قائم على القواعد مع توضيح محدوديته.

English: Sensitive information is redacted in the browser and again server-side before inference. Structured output is validated, indicators must be grounded in supplied text, and risk interpretation is combined with deterministic checks without altering registry facts. Categories are interpretations, not calibrated probabilities. AI failures use an explicitly labeled rule-based fallback.

Usage limits / حدود الاستخدام: five requests per visitor per rolling ten minutes; 200 daily globally. Resettable visitor cookies do not replace the global ceiling.
4. مبررات الاختيارات والمفاضلات | Technical choices and trade-offs
These are design rationales, not claims that every alternative was benchmarked or experimentally evaluated.
هذه مبررات تصميمية، وليست ادعاءً بإجراء اختبارات مقارنة فعلية لجميع البدائل.
Chosen approach / الاختيار	Rationale / المبرر	Alternative and trade-off / البديل والمفاضلة
TypeScript + React + TanStack Start	Shared typed web stack and app-integrated server functions / تطوير متكامل مع أنواع بيانات واضحة	Separate frontend/backend services can allow independent scaling, but add deployment and integration work / فصل الواجهة والخادم يمنح مرونة تشغيلية مقابل تعقيد أكبر
Managed Lovable Cloud	Faster prototype delivery and integrated publishing / تسريع تنفيذ النموذج	Self-managed infrastructure offers more operational control but requires greater setup, maintenance and security operations / استضافة مستقلة تمنح تحكماً أكبر مقابل عبء تشغيل أعلى
Managed AI Gateway with structured output	Flexible interpretation of varied suspicious messages / تحليل مرن لصيغ الرسائل المتنوعة	Rules-only checks are cheaper and more predictable but may miss linguistic nuance; AI adds cost and error risk / القواعد أوضح وأقل تكلفة لكنها أقل مرونة لغوياً
Deterministic checks + AI fallback	Preserve auditable signals when AI is unavailable / استمرار الفحص الأساسي عند تعطل الذكاء الاصطناعي	AI-only decisions would be less explainable and more dependent on service availability / الاعتماد على الذكاء الاصطناعي وحده يقلل قابلية التفسير
Server role checks + row-level policies	Two enforcement boundaries for restricted data / مستويان للتحكم في الوصول	Client-side visibility alone is insufficient because browser logic cannot secure backend records / إخفاء العناصر في الواجهة وحده لا يحمي البيانات
Fictional registry and demo approvals	Demonstrate workflow without claiming real authority / عرض سير العمل دون ادعاء اعتماد حقيقي	Real authoritative verification needs independent domain ownership evidence and authorized institutional approval / التحقق الحقيقي يتطلب إثبات ملكية وموافقة مخوّلة


5. ما لم يُنفذ وحدود النموذج | Exclusions and limitations
- لا يوجد تحقق مستقل فعلي من ملكية النطاقات أو تفويض ممثلي الجهات. Optional RDAP registration metadata is now available for `.com`, `.net` and `.org`; it is not ownership verification or independently validated organization authorization.
- لا توجد مصادقة تشفيرية حقيقية للرسائل. No cryptographic message authentication is integrated.
- لا توجد مراقبة حية أو إزالة محتوى أو خدمة تحديد جغرافي لعناوين IP. No live monitoring, takedown, or IP geolocation service is connected.
- بيانات السجل المنشورة خيالية. Existing published samples are fictional; reserved .example domains are not opened.
- النشر يتطلب موافقة مشرف أمني مستقل. Publication requires independent Security Supervisor approval; neither demo staff account is a Supervisor.
- تتبع الطلبات يتطلب بريداً قابلاً للوصول ورمزاً مستلماً. End-to-end email delivery and OTP retrieval were not verified in the documented test pass. Decision notes are available through tracking, but decisions do not send email notifications.
- دخول الموظفين يحتاج تأكيد المالك. HAM123/`HAM1234` password login must be personally confirmed by the account owner; isolated tester login does not establish their credentials work.
- الفحص العام لا يحفظ محتوى الرسائل تلقائياً. Public checks remain component-local; only explicit reports share content and extracted indicators with authorized staff. Full private AI explanations are not retained in reports.
- التخزين المحلي محدود. Browser storage holds public preferences and legacy organization samples only; legacy private snapshots are archived before migration.
- النشر ليس اعتماداً تشغيلياً. The website has been published for demonstration, but production security, performance, legal compliance and external integrations have not been validated merely by publishing it.
6. الخصوصية والأمان | Security and privacy
العربية: تعتمد الحماية على تقليل جمع البيانات، وحجب المعلومات الحساسة قبل التحليل، وفصل الصلاحيات، والتحقق من الأذونات في الخادم وسياسات الصفوف في Cloud، وإبقاء المستندات والسجلات المقيدة خارج حزمة المتصفح. لا تُنشر بيانات البلاغات الخاصة ضمن السجل العام. يجب عدم إضافة كلمات المرور أو مفاتيح API أو أسرار البيئة إلى GitHub.

English: The prototype uses data minimization, redaction before AI inference, separated roles, server-side authorization, Cloud row-level access policies, and restricted records outside the client bundle. Private report data is not made part of the public registry. Do not commit passwords, API keys, or environment secrets to GitHub.

Repository hygiene / سلامة المستودع: review .env handling and Git history before any change to public visibility. Repository privacy alone is not a substitute for secret management.
7. التثبيت والتشغيل والاختبارات | Installation, running and tests
Prerequisites / المتطلبات: Bun and a current Node-compatible development environment. Access to the project's configured Lovable Cloud services is needed for cloud-backed workflows.
bun install
bun run dev
bun run test
bun run build
العربية: ثبّت الاعتماديات، وشغّل بيئة التطوير، ثم الاختبارات، وبعدها بناء نسخة الإنتاج. تعتمد الوظائف المتصلة بالخادم على إعدادات Cloud والتكامل المُدار للذكاء الاصطناعي داخل المشروع. لا تُعدّل ملفات Cloud المُولّدة يدوياً، ولا ترفع بيانات الاعتماد الخاصة إلى المستودع.

English: Install dependencies, start the development server, run tests and build the application. Cloud-backed functionality depends on the project's configured Cloud and managed AI integration. Do not manually edit generated Cloud clients/configuration or commit private credentials.

The repository contains migration history. scripts/hackathon-demo-data.sql is additive and idempotent for authorized data tools; it is not a page-load seed or complete fresh-backend installer. Production packaging uses the existing bun run build script and Lovable publishing. A fresh clone alone may not reproduce the managed backend without the required configuration and permissions.
8. التطوير المستقبلي | Future development
العربية: عند توفر وقت وموارد إضافية، تشمل الأولويات: التحقق الحقيقي من ملكية النطاقات والتفويض المؤسسي؛ إدارة ذاتية مضبوطة الصلاحيات لقنوات الجهات الرسمية؛ مصادقة البريد والرسائل؛ تغذية مؤشرات تهديد بمصادر موثقة وموافقات مناسبة؛ معلومات IP تقريبية موثقة؛ اختبارات أمنية وتشغيلية مستقلة؛ وآليات حوكمة ومراجعة وإشعارات قابلة للتدقيق.

English: With additional time and resources, priorities include independently verified domain ownership and organization authorization; permission-controlled self-service management of official channels; email/message authentication; consented and sourced threat intelligence; sourced approximate IP intelligence; independent security and operational testing; and auditable governance, review and notification workflows.

These are proposals, not installed integrations, partnerships or confirmed capabilities.
هذه مقترحات مستقبلية وليست تكاملات أو شراكات أو وظائف مُفعّلة حالياً.
Phase 1: دقة تحليل الروابط | URL detection accuracy

العربية: يفحص «تأكّد» الروابط محلياً لاستخراج المضيف والنطاق القابل للتسجيل باستخدام بيانات اللواحق العامة، مع كشف التشابه بالأسماء والترميز الدولي والروابط المختصرة والعناوين المضللة. مراجع النطاقات الرسمية موثقة لكنها ليست اعتماداً لقنوات السجل أو إثباتاً لأصالة الرسالة. غياب النطاق من المراجع أو وجود كلمات تسجيل الدخول والدفع وحده لا يعني الاحتيال. الاستعلام الاختياري يرسل النطاق فقط لخدمة تسجيل فعلية، دون الرسالة أو المسار أو بيانات الدخول. وجهة التحويل ومحتوى المواقع وإخفاء الوجهة تظل غير متحقق منها؛ لا تُفتح الروابط المرسلة.

English: Local URL inspection uses maintained public/private suffix data (`tldts`), Punycode decoding and IP classification. It distinguishes the host/registrable domain and detects brand lookalikes, misleading subdomains, userinfo, encoded authorities, shorteners and sensitive patterns. Documented official references do not create approved channels, authenticate messages or promote simulated approvals into trust. Unlisted domains and login/payment words alone are not fraud verdicts.

Optional external registration lookup sends only the registrable domain, never message/path/query/credentials, to fixed RDAP providers. Actual registration date, age, registrar and status appear only when returned. `.ae`, `.abudhabi` and other unsupported suffixes report unavailable. Age alone adds no risk. Redirect expansion, cloaking, page content, DNS and hosting remain **unverified**; submitted URLs are never opened. Existing opt-in AI stays on OpenAI `openai/gpt-6.1-sol`; the combined 0–100 score is ordinal evidence, **not a calibrated fraud probability**. Unavailable services preserve local results and uncertainty.

Reproduce: `bun scripts/evaluate-urls.ts` and `bunx vitest run`. See [evaluation output](docs/url-evaluation-results.json), [labelled fixtures](src/test/fixtures/url-evaluation.ts), [architecture/sources](ARCHITECTURE.md) and [test report](TEST_REPORT.md). Held-out synthetic set: 48 examples; TP 21, TN 23, FP 1, FN 3; precision **95.45%**, recall **87.50%**, F1 **91.30%**, false-positive rate **4.17%**, accuracy **91.67%**. The separate 16-example development split scored 100%, a small sanity check rather than production evidence. No tuning used held-out mistakes. The benchmark measures local deterministic URL classification, excluding AI, registry and RDAP. Independent real-world evaluation is still required.

العربية: دقة العينة التجريبية المنفصلة 91.67%، وليست ادعاءً للدقة في الواقع؛ بقي خطأ إيجابي واحد وثلاث حالات اشتباه غير مكتشفة، موثقة في تقرير الاختبارات. لم تتغير حسابات الموظفين أو الصلاحيات أو البيانات أو إجراءات الجهات.

Phase 1B: تقييم مستقل وحدود فعلية | Independent accuracy evaluation — 24 November 2026

العربية: عولجت الأسباب العامة لأخطاء العينة القديمة عبر تحليل الأسماء المركبة، وسياق جمع بيانات الدخول، وروابط IP الحساسة، والوجهات المتداخلة والمشفرة. العينة القديمة أصبحت بيانات سبق الاطلاع عليها وليست اختباراً مستقلاً جديداً. أُضيف استعلام اختياري فعلي لـDNS والشبكات عبر Google DNS وRIPE، بإرسال اسم المضيف فقط دون الرسالة أو المسار. لا تُستخدم هذه البيانات كدليل ملكية أو ثقة أو احتمال احتيال.

English: The frozen Phase 1B engine improves compound identity/service names, contextual credential collection, IP account actions, misleading brand paths and bounded nested/percent/base64 URL analysis. Editorial brand mentions are not automatically impersonation. Exact official-reference boundaries remain separate from channel approval; references cannot suppress suspicious nested destinations. Optional registration consent now also covers **hostname-only Google DNS and RIPE routing observations**, with explicit sources and unavailable states. No submitted webpage is fetched.

**Independent targets NOT achieved.** On 39 new reviewer-labeled controlled cases (one of 40 supplied cases overlapped original data and is retained as seen), accuracy rose **66.67% → 84.62%**, recall **40% → 80%**, with TP/TN/FP/FN **16/17/2/4**. On 1,000 externally labeled historical PhiUSIIL URLs, accuracy rose **50% → 50.50%**, with **5/500/0/495**; recall is **1%**. The public dataset is older, not UAE-specific, and URL-only checks cannot recover unknown page/content deception. All failed cases remain in the evaluation output; no final-set tuning or label corrections were made. The old 48-example set improved **91.67% → 100%**, but it is now previously seen development evidence, not independent accuracy.

The deterministic engine and **hybrid fallback** were measured separately and returned the same confusion counts for URL-only inputs. Four actual bilingual AI-assisted UI checks returned two Low and two Critical results, all correctly classified on that tiny controlled set; this is **not** a 500-example full-hybrid benchmark. Existing OpenAI `openai/gpt-6.1-sol`, quotas, model settings and redaction remain unchanged. No new credentials, paid services, accounts, permissions, database schema or deployment settings were added.

**Unavailable:** verified redirect/shortener expansion, live cloaking/page scanning, live TLS certificate inspection and `.ae` registration dates. The hosting runtime has no established arbitrary-host DNS-pinned transport or authorized isolated scanner. Controlled HTML/redirect fixtures use a non-executing parser and explicitly return fixture-only/partial indicators, never successful live scanning. IANA currently lists no `.ae` RDAP service; `.ae` DNS/routing observations do work. Network metadata is not hosting-owner identification and contributes no risk alone.

**Publication:** the current published Trust Portal was checked and still returned Unverified/Low (20) for a compound lure detected in the updated preview; it lacks the new metadata option. Phase 1B is **not yet published**. Staff mappings/confirmed status/password presence were read without changing them; their owner-only password login remains unverified.

Reproduce: download [UCI 967 CSV](https://archive.ics.uci.edu/static/public/967/data.csv), run `python3 scripts/sample-phase1b-public.py /path/to/data.csv`, then `bun scripts/evaluate-phase1b.ts` and `bunx vitest run`. The sampler uses fixed seeded hash ranking and original development-domain exclusions before predictions; listed fraud URLs are stored defanged and never visited. [Frozen hashes and all results](docs/evaluation/) · [full Phase 1B report](docs/PHASE_1B_REPORT.md). The original Phase 1 fixtures/output remain unchanged; historical replay is pinned to commit `d58af97`.

العربية: لم تتحقق أهداف الدقة المطلوبة. الدقة المستقلة التجريبية 84.62% ودقة بيانات البحث الخارجية 50.50% فقط؛ لا تُعرض هذه النتائج بوصفها دقة تشغيلية أو ضماناً لنقاط التحكيم. لم تُنشر التحسينات بعد، ولم تتغير كلمات المرور أو الصلاحيات، ولن ننتقل إلى المرحلة الثانية.

9. وثائق التسليم | Handoff documents
### Phase 1B resumed — 24 November 2026

An **operator-only POSIX scanner** now implements real manually authorized redirect resolution, fresh all-answer public-IP checks, IP-pinned connections, verified TLS/SNI, six-hop/128 KiB limits and a hard 20-second process deadline. Real `httpbin.org/redirect/2` → `/get` and `example.org` static HTML/TLS checks passed. The public application **does not call this scanner**: it still never opens submitted links. Arbitrary public shortener resolution and live cloaking remain unavailable without a separately deployed isolated scanner and explicit URL-disclosure authorization. No remote JavaScript or forms are executed. Controlled HTML checks now include base-element and submit-button action overrides.

The application adds actual hostname-only MX/NS/CAA observations beside A/AAAA/CNAME/RIPE; live `du.ae` returned `94.206.168.161`, NS/MX and ASN 15802. Whole-DNS-label brand matching prevents `u.ae` matching inside unrelated names; short brand substrings cannot convert the existing fictional DunePay channel into a telecom impersonation. Financial-return contexts and invalid IDN handling are improved. `.ae` registration dates remain unavailable in IANA RDAP.

**Final independent result: targets NOT achieved.** A new 1,000-case historical PhiUSIIL domain-disjoint final holdout scored TP/TN/FP/FN **0/500/0/500**, accuracy **50%**, precision **undefined (no predicted positives)**, recall/F1 **0%**, FPR **0%**. The prior engine scored the same on those labels. Independent first-pass controlled URL results were **19/29/1/11** (80% accuracy); after a separately required preserved-demo regression correction, the now-seen controlled replay is **18/29/1/12** (78.33%, not fresh independent evidence). The first external pass, all 80 reviewer scenarios, every failure and both freeze manifests are retained; no labels were altered or cases dropped. These failures show URL-only generalization remains poor, not maximum accuracy. Full-hybrid 500-case evaluation is not claimed; two fresh bilingual functional AI calls succeeded within unchanged limits.

Reproduce: `python3 scripts/test_scan_url.py`; `python3 scripts/scan-url.py https://httpbin.org/redirect/2 --allow-host httpbin.org`; `bun scripts/analyze-scan.ts /path/to/capture.json`; `bun scripts/evaluate-phase1b-resume.ts --final`; `bunx vitest run`. Scanner output is sensitive operator evidence: do not publish arbitrary captures. No scanner endpoint, credential, role, database, deployment setting or private data was changed. **Published verification FAIL:** the real published portal still uses the older engine; publishing awaits owner approval. [Complete audit, exact metrics, safety boundaries and blockers](docs/PHASE_1B_REPORT.md).

- [ARCHITECTURE.md](ARCHITECTURE.md) — technical architecture / البنية التقنية
- [AI_IMPLEMENTATION_REPORT.md](AI_IMPLEMENTATION_REPORT.md) — AI implementation / تنفيذ الذكاء الاصطناعي
- [TEST_REPORT.md](TEST_REPORT.md) — testing evidence / توثيق الاختبارات
- [DEMO_GUIDE.md](DEMO_GUIDE.md) — demonstration guide / دليل العرض
- [PRESENTATION_OUTLINE.md](PRESENTATION_OUTLINE.md) — presentation outline / مخطط العرض
Submission note / ملاحظة تسليم: The GitHub repository uses master as its default branch. The hackathon prototype, source code, and technical documentation are available in this branch.
يعتمد مستودع GitHub على الفرع master بوصفه الفرع الافتراضي، ويحتوي على النموذج الأولي للهاكاثون والكود المصدري والوثائق التقنية.
