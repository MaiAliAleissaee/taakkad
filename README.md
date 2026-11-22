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
- لا يوجد تحقق مستقل فعلي من ملكية النطاقات أو تفويض ممثلي الجهات. No real domain-ownership lookup or independently validated organization authorization is connected.
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
9. وثائق التسليم | Handoff documents
- [ARCHITECTURE.md](ARCHITECTURE.md) — technical architecture / البنية التقنية
- [AI_IMPLEMENTATION_REPORT.md](AI_IMPLEMENTATION_REPORT.md) — AI implementation / تنفيذ الذكاء الاصطناعي
- [TEST_REPORT.md](TEST_REPORT.md) — testing evidence / توثيق الاختبارات
- [DEMO_GUIDE.md](DEMO_GUIDE.md) — demonstration guide / دليل العرض
- [PRESENTATION_OUTLINE.md](PRESENTATION_OUTLINE.md) — presentation outline / مخطط العرض
Submission note / ملاحظة تسليم: The current GitHub default branch observed in the project is main. The hackathon instructions refer to “Master Branch”; confirm whether this means the default branch generically or requires the literal branch name master before changing branch settings or disrupting Lovable synchronization.
الفرع الافتراضي الحالي هو main، بينما تذكر التعليمات «Master Branch». ينبغي تأكيد ما إذا كان المقصود الفرع الرئيسي عموماً أو الاسم الحرفي master قبل تغيير إعدادات الفروع.
