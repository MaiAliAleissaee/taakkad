# Taakkad — five-minute demo guide

## Preparation
Use the preview. Keep staff passwords private and never show setup-link secrets on a projector. Sign out before changing institution accounts. All domains/records below are fictional and non-operational. No example link is opened by the application.

- Officer: **HAM123**, entry under **Accreditation Authority Staff Login** in `/organizations`; expected destination `/officer`.
- Analyst: **HAM1234**, username/password at `/auth`; expected destination `/security`.
- Neither may access the other protected workspace. Neither may approve/publish public warnings as a Supervisor.
- Personally confirm both passwords before presenting; the final audit did not use them.

## Suggested transitions
1. **0:00–0:40 — Overview:** prototype disclaimer and three previously published fictional security warnings; open the full alerts list.
2. **0:40–1:40 — Trust Portal:** expand the ten fictional examples; copy sender/link/message independently. Check an approved sender without AI, then a suspicious Arabic message with optional real AI enabled. Explain channel matching does not authenticate the message.
3. **1:40–2:50 — Analyst:** sign in as HAM1234. Reports use permanent `1/2026` numbers. Open evidence, add a fictional note, view Fraud Connections summary and Show connection network. Reports 1/2026 and 2/2026 share documentation IP 203.0.113.45; relationships require human review. No real location is claimed.
4. **2:50–4:10 — Officer:** logout, sign in as HAM123 from the Organization Portal. Review a fictional application, documents, correction note and audit. Organization approval and each channel approval are separate. Use Lighthouse Library / Harbor Learning examples or submit a new fictional application; do not modify real applicant records.
5. **4:10–5:00 — Boundaries and governance:** show denied access to the other dashboard and the return button. Analysts prepare alert drafts; publication requires an independently authorized Supervisor. End with limitations and future integrations, not a production-readiness claim.

## Public examples
Expectations are guidance only. AI responses are real and can vary. Active channel approval can change after officer review. Unknown does not mean fraud. Full bilingual copy controls are also available in the Trust Portal.

### 1. Approved bank sender / مرسل بنك معتمد
- Channel: `sms`
- Sender: `FALCONBANK`
- Link: `(leave empty)`
- English text: Your monthly statement is available. No reply is needed.
- Arabic text: كشف حسابك الشهري متاح. لا حاجة للرد.
- Expected explanation: Registered sender match; low visible content risk is expected, not guaranteed. This is not message authentication.

### 2. Approved civil registry website / موقع السجل المدني المعتمد
- Channel: `website`
- Sender: `services.alnoor.gov.example`
- Link: `https://services.alnoor.gov.example/appointments`
- English text: Appointment opening hours.
- Arabic text: ساعات حجز المواعيد.
- Expected explanation: Exact approved website match; the registry does not verify an individual page's content.

### 3. Approved logistics email / بريد الخدمات اللوجستية المعتمد
- Channel: `email`
- Sender: `tracking@saqrexpress.example`
- Link: `(leave empty)`
- English text: Your parcel will arrive tomorrow. No payment or reply is requested.
- Arabic text: سيصل طردك غداً. لا يُطلب دفع أو رد.
- Expected explanation: Exact approved email match; not proof the email was genuinely sent by the company.

### 4. Bank impersonation / shared IP / انتحال بنك / عنوان IP مشترك
- Channel: `sms`
- Sender: `FALC0NBANK`
- Link: `https://falconbank-secure-login.example/verify`
- English text: Your account will be suspended today. Enter your card PIN now. Fictional server: 203.0.113.45.
- Arabic text: سيُعلّق حسابك اليوم. أدخل الرقم السري للبطاقة الآن. خادم خيالي: 203.0.113.45.
- Expected explanation: Suspicious lookalike and sensitive-data request; domain matches a fictional report. AI may extract the shared documentation IP for staff-only correlation.

### 5. Fake delivery fee / رسوم توصيل مزيّفة
- Channel: `email`
- Sender: `support@saqrexpress-delivery.example`
- Link: `https://saqrexpress-delivery.example/pay`
- English text: Pay a small customs fee immediately or your parcel will be destroyed. Fictional server 203.0.113.45.
- Arabic text: ادفع رسوماً جمركية صغيرة فوراً وإلا سيتلف طردك. خادم خيالي 203.0.113.45.
- Expected explanation: Suspicious delivery lookalike and urgency; shares a fictional domain and IP with existing reports. Human review required.

### 6. Fake traffic fine / مخالفة مرور مزيّفة
- Channel: `sms`
- Sender: `UNKNOWN-FINES`
- Link: `https://oasis-traffic-fines.example/pay`
- English text: Pay your unpaid fine within one hour to avoid arrest.
- Arabic text: ادفع المخالفة خلال ساعة لتجنب الاعتقال.
- Expected explanation: Suspicious traffic lookalike linked to a fictional report; intimidation is a content warning, not proof of a crime.

### 7. Phishing link / رابط تصيّد
- Channel: `website`
- Sender: `fa1conbank.example`
- Link: `https://fa1conbank.example/login`
- English text: Verify your account now by entering your password.
- Arabic text: تحقق من حسابك الآن بإدخال كلمة المرور.
- Expected explanation: Character substitution and credential request suggest risk; the link is never opened.

### 8. Unknown sender / مرسل غير معروف
- Channel: `email`
- Sender: `hello@unlisted-club.example`
- Link: `(leave empty)`
- English text: Our community meeting is on Tuesday.
- Arabic text: اجتماع المجتمع يوم الثلاثاء.
- Expected explanation: Unverified channel; lack of registry membership alone is not fraud. AI can be benign or inconclusive.

### 9. Benign personal message / رسالة شخصية عادية
- Channel: `other`
- Sender: `(leave empty)`
- Link: `(leave empty)`
- English text: See you at the library tomorrow afternoon.
- Arabic text: نلتقي في المكتبة غداً بعد الظهر.
- Expected explanation: No registered sender; unverified is expected. Few visible warning signs, not guaranteed safety.

### 10. Fake bank support on social media / دعم بنكي مزيّف عبر التواصل
- Channel: `social`
- Sender: `@FalconBankHelpFake`
- Link: `(leave empty)`
- English text: We are bank support. Send your password and verification code privately to unlock your account.
- Arabic text: نحن دعم البنك. أرسل كلمة المرور ورمز التحقق خاصاً لفتح حسابك.
- Expected explanation: Unapproved handle and sensitive-data request; AI should explain risk without asserting a verified offender.

## Sample records
- Reports **1/2026** (legacy TZ-1042) and **2/2026** (legacy TZ-1043): banking/delivery leads share IP 203.0.113.45. This is RFC 5737 documentation space, not real geolocation or offender attribution.
- **3/2026** / **4/2026**: traffic/identity leads share fictional infrastructure. Other reports include social/shopping examples and a reviewed benign false positive.
- **Lighthouse Library — Fictional:** pending registration with private sample document and a pending website channel.
- **Harbor Learning — Fictional:** additional-information sample with a visible fictional correction note. Seeded applications are not publicly claimable tracking records.
- **New application inputs:** bilingual fictional name, `new-judge-demo.example`, `security@new-judge-demo.example`, website `new-judge-demo.example`, text-only fictional document. Choose a unique reserved domain and a mailbox you can actually receive codes at; no password account is required by the registration form.
- Approved legacy channel examples: `FALCONBANK`, `services.alnoor.gov.example`, `tracking@saqrexpress.example`.

## Recovery steps
- **AI unavailable/limited:** leave AI off and show the honest rule-based result. Limits are five per visitor per ten minutes and 200 daily globally; do not clear cookies to evade the global cost ceiling.
- **Wrong institutional account:** use the return button, logout and use the correct username. Do not request additional privileges.
- **Password not accepted:** use the existing private setup/recovery flow outside the demonstration. Do not display passwords, reset owner accounts automatically or assume tester credentials apply to HAM accounts.
- **Tracking email delayed:** show the receipt/status and Officer-side review, but explicitly mark positive OTP retrieval unverified. Never bypass the code.
- **Draft publication unavailable:** show the existing three published fictional warnings and explain independent Supervisor authorization. Do not add Supervisor to either institutional demo account.
- **Workspace edit conflict:** reload and retry the requested action; do not reset the workspace or delete saved work.

## Handoff
README, ARCHITECTURE, TEST_REPORT and PRESENTATION_OUTLINE accompany the source. The project was not published in the supplied status; use the preview until publication is separately authorized. No source archive was requested or generated.
