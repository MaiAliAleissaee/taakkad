-- Additive, idempotent fictional demo augmentation. No existing record is replaced.
-- Execute via authorized Cloud data tools, never on page load.
WITH definitions(id,en,ar,domain,status,risk) AS (VALUES
 ('demo-report-social','Fictional social support impersonation','انتحال دعم عبر التواصل — خيالي','falcon-help-social.example','investigating',72),
 ('demo-report-shopping','Fictional shopping payment redirection','تحويل دفع تسوق — خيالي','dune-shop-payment.example','new',68),
 ('demo-report-identity','Fictional identity renewal lure','استدراج تجديد هوية — خيالي','alnoor-gov-renew.example','confirmed',86),
 ('demo-report-benign','Fictional community reminder review','مراجعة تذكير مجتمعي — خيالي','community-events.example','false_positive',12)
), items AS (
 SELECT jsonb_build_object('id',id,'caseId',id,'title',jsonb_build_object('en',en,'ar',ar),'summary',jsonb_build_object('en','Fictional hackathon report. Human review required; no live observation.','ar','بلاغ خيالي للهاكاثون. يتطلب مراجعة بشرية؛ ليس رصداً حياً.'),'severity',CASE WHEN risk>=85 THEN 'critical' WHEN risk>=65 THEN 'high' ELSE 'low' END,'riskScore',risk,'status',status,'source','simulated_detection','detectedAt','2026-11-22T08:00:00Z','indicators',jsonb_build_array(jsonb_build_object('type','domain','value',domain)),'evidence',jsonb_build_array(jsonb_build_object('id',id||'-evidence','kind','report','capturedAt','2026-11-22T08:00:00Z','description',jsonb_build_object('en','Fictional submitted example; no website was accessed and no person is accused.','ar','مثال مقدّم خيالي؛ لم يُفتح أي موقع ولا يُتهم أي شخص.'))),'notes','[]'::jsonb) AS item FROM definitions
)
UPDATE public.security_templates t SET payload=jsonb_set(payload,'{alerts}',(payload->'alerts')||coalesce((SELECT jsonb_agg(item) FROM items WHERE NOT EXISTS(SELECT 1 FROM jsonb_array_elements(t.payload->'alerts') old WHERE old->>'id'=item->>'id')),'[]'::jsonb)) WHERE t.id='original';
WITH definitions(id,domain,target,technique,similarity) AS (VALUES
 ('demo-domain-social','falcon-help-social.example','falconbank.example','keyword',62),
 ('demo-domain-shopping','dune-shop-payment.example','dunepay.example','combo',58)
), items AS (
 SELECT jsonb_build_object('id',id,'domain',domain,'targetDomain',target,'targetOrgId',CASE WHEN id='demo-domain-social' THEN 'org-falcon' ELSE 'org-dunepay' END,'technique',technique,'similarity',similarity,'firstSeen','2026-11-22T08:00:00Z','registrar','Fictional registrar — demo only','status','monitoring','source','seed') item FROM definitions
)
UPDATE public.security_templates t SET payload=jsonb_set(payload,'{lookalikes}',(payload->'lookalikes')||coalesce((SELECT jsonb_agg(item) FROM items WHERE NOT EXISTS(SELECT 1 FROM jsonb_array_elements(t.payload->'lookalikes') old WHERE old->>'domain'=item->>'domain')),'[]'::jsonb)) WHERE t.id='original';
UPDATE public.security_workspaces w SET payload=jsonb_set(jsonb_set(w.payload,'{alerts}',(w.payload->'alerts')||coalesce((SELECT jsonb_agg(item) FROM public.security_templates t CROSS JOIN LATERAL jsonb_array_elements(t.payload->'alerts') item WHERE t.id='original' AND item->>'id' LIKE 'demo-report-%' AND NOT EXISTS(SELECT 1 FROM jsonb_array_elements(w.payload->'alerts') old WHERE old->>'id'=item->>'id')),'[]'::jsonb)),'{lookalikes}',(w.payload->'lookalikes')||coalesce((SELECT jsonb_agg(item) FROM public.security_templates t CROSS JOIN LATERAL jsonb_array_elements(t.payload->'lookalikes') item WHERE t.id='original' AND item->>'id' LIKE 'demo-domain-%' AND NOT EXISTS(SELECT 1 FROM jsonb_array_elements(w.payload->'lookalikes') old WHERE old->>'domain'=item->>'domain')),'[]'::jsonb)),revision=revision+1;
WITH definitions(id,org,en,ar,domain,status) AS (VALUES
 ('a0f01001-1111-4111-8111-111111111111'::uuid,'org-demo-lighthouse','Lighthouse Library — Fictional','مكتبة المنارة — خيالية','lighthouse-library.example','pending'),
 ('a0f01002-1111-4111-8111-111111111111'::uuid,'org-demo-harbor','Harbor Learning — Fictional','تعليم المرفأ — خيالي','harbor-learning.example','needs_information')
)
INSERT INTO public.organization_applications(id,owner_id,organization_id,payload,documents,status,correction_note,audit)
SELECT id,'00000000-0000-4000-8000-000000000001'::uuid,org,jsonb_build_object('id',org,'name',jsonb_build_object('en',en,'ar',ar),'type','business','domains',jsonb_build_array(domain),'contactEmail','security@'||domain,'status','pending','registeredAt',now(),'keyFingerprint','DEMO-FICTIONAL','channels',jsonb_build_array(jsonb_build_object('id',org||'-website','type','website','value',domain,'status','pending'))),jsonb_build_array(jsonb_build_object('id',id,'name','fictional-registration.txt','type','text/plain','content','RmljdGlvbmFsIGhhY2thdGhvbiBkb2N1bWVudC4=')),status,CASE WHEN status='needs_information' THEN 'Fictional demo correction: provide a clearer registration document. طلب تصحيح خيالي: قدم مستند تسجيل أوضح.' ELSE '' END,jsonb_build_array(jsonb_build_object('at',now(),'operation','legacy_fictional_record','note','Fictional demo seed, not a real submitted registration or officer decision.')) FROM definitions ON CONFLICT DO NOTHING;
WITH definitions(id,en,ar,category) AS (VALUES
 ('b0f01001-1111-4111-8111-111111111111'::uuid,'Fictional social account impersonation','انتحال حساب اجتماعي — خيالي','social'),
 ('b0f01002-1111-4111-8111-111111111111'::uuid,'Fictional shopping payment redirection','تحويل دفع تسوق — خيالي','shopping'),
 ('b0f01003-1111-4111-8111-111111111111'::uuid,'Fictional identity renewal requests','طلبات تجديد هوية — خيالية','government'),
 ('b0f01004-1111-4111-8111-111111111111'::uuid,'Fictional bank support messages','رسائل دعم مصرفي — خيالية','bank'),
 ('b0f01005-1111-4111-8111-111111111111'::uuid,'Fictional parcel collection notices','إشعارات استلام طرد — خيالية','delivery'),
 ('b0f01006-1111-4111-8111-111111111111'::uuid,'Fictional urgent traffic payments','دفعات مرور عاجلة — خيالية','traffic'),
 ('b0f01007-1111-4111-8111-111111111111'::uuid,'Fictional verification code requests','طلبات رمز تحقق — خيالية','bank')
), inserted AS (
 INSERT INTO public.security_bulletins(id,content,status,author_id)
 SELECT id,jsonb_build_object('title',jsonb_build_object('en',en,'ar',ar),'category',category,'severity','medium','explanation',jsonb_build_object('en','Fictional draft for a hackathon. Unexpected requests can imitate familiar services. This is not an official warning.','ar','مسودة خيالية للهاكاثون. قد تنتحل الطلبات غير المتوقعة خدمات مألوفة. ليس تحذيراً رسمياً.'),'safety',jsonb_build_object('en','Contact the organization independently. Do not share passwords or verification codes.','ar','تواصل مع الجهة بشكل مستقل. لا تشارك كلمات المرور أو رموز التحقق.')),'draft',(SELECT user_id FROM public.staff_login_identifiers WHERE staff_id='HAM1234') FROM definitions ON CONFLICT DO NOTHING RETURNING id
)
INSERT INTO public.security_bulletin_audit(bulletin_id,actor_id,action,note) SELECT id,(SELECT user_id FROM public.staff_login_identifiers WHERE staff_id='HAM1234'),'save','Fictional demo draft seeded for review; not approved or published.' FROM inserted;
