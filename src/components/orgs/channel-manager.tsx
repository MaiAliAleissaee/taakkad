import { Check, History, Pencil, Plus, Send, ShieldCheck, Trash2, X, Ban } from "lucide-react";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Mono } from "@/components/common/bits";
import { NativeSelect } from "@/components/common/native-select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Bi, Channel, ChannelAction, ChannelAuditEvent, ChannelStatus, ChannelType, DemoActor, Organization } from "@/lib/domain/types";
import { repository, uid, useDemoState } from "@/lib/data/local-store";
import { useI18n } from "@/lib/i18n/i18n";
import { channelLabel } from "@/lib/i18n/labels";
import { canManageChannels, CHANNEL_TYPES, ChannelWorkflowError, type ChannelCommand, type ChannelError } from "@/lib/services/channels";

const statuses: Record<ChannelStatus, Bi> = {
  pending: { en: "Pending Verification", ar: "بانتظار التوثيق" },
  verified: { en: "Verified · active", ar: "موثّقة · نشطة" },
  rejected: { en: "Rejected", ar: "مرفوضة" },
  inactive: { en: "Inactive", ar: "غير نشطة" },
  revoked: { en: "Revoked", ar: "ملغاة" },
};
const actions: Record<ChannelAction | "seed" | "organization_verified" | "organization_suspended" | "organization_removed", Bi> = {
  add: { en: "Channel requested", ar: "طلب إضافة قناة" }, edit: { en: "Channel modified", ar: "تعديل القناة" },
  submit: { en: "Administrator submitted for review", ar: "إرسال المسؤول للمراجعة" },
  approve: { en: "Verifier approved (simulated)", ar: "اعتماد المراجع (محاكاة)" },
  reject: { en: "Verifier rejected", ar: "رفض المراجع" },
  deactivate: { en: "Deactivated", ar: "تعطيل" }, revoke: { en: "Verification revoked", ar: "إلغاء التوثيق" },
  remove: { en: "Channel removed", ar: "حذف القناة" }, seed: { en: "Fictional demo record", ar: "سجل تجريبي خيالي" },
  organization_verified: { en: "Organization approved (simulated)", ar: "اعتماد الجهة (محاكاة)" },
  organization_suspended: { en: "Organization suspended", ar: "إيقاف الجهة" }, organization_removed: { en: "Organization removed", ar: "حذف الجهة" },
};
const errors: Record<ChannelError, Bi> = {
  forbidden: { en: "This simulated role is not permitted to make this change.", ar: "هذا الدور الافتراضي غير مخوّل لإجراء هذا التغيير." },
  not_found: { en: "This record no longer exists.", ar: "هذا السجل لم يعد موجوداً." },
  invalid: { en: "Enter a valid channel value (maximum 200 characters).", ar: "أدخل قيمة قناة صحيحة (200 حرف كحد أقصى)." },
  duplicate: { en: "This channel is already registered. Review the existing record.", ar: "هذه القناة مسجّلة بالفعل. راجع السجل الموجود." },
  not_submitted: { en: "The organization administrator must submit this pending channel first.", ar: "يجب على مسؤول الجهة إرسال القناة المعلّقة أولاً." },
  invalid_transition: { en: "This action is not available for the current channel status.", ar: "هذا الإجراء غير متاح لحالة القناة الحالية." },
  review_note_required: { en: "Add a simulated review decision note.", ar: "أضف ملاحظة لقرار المراجعة الافتراضي." },
};

export function ChannelManager({ org, actor, onCommand, auditEvents }: { org: Organization; actor: DemoActor; onCommand?: (command: ChannelCommand) => Promise<void>; auditEvents?: ChannelAuditEvent[] }) {
  const { tr, pick, date, dir } = useI18n();
  const { channelAudit = [] } = useDemoState();
  const [tab, setTab] = useState("channels");
  const [historyId, setHistoryId] = useState<string | null>(null);
  const [editing, setEditing] = useState<Channel | "new" | null>(null);
  const [type, setType] = useState<ChannelType>("sms");
  const [value, setValue] = useState("");
  const [error, setError] = useState("");
  const [review, setReview] = useState<{ channel: Channel; action: "approve" | "reject" } | null>(null);
  const [note, setNote] = useState("");
  const [confirmation, setConfirmation] = useState<{ channel: Channel; action: "remove" | "revoke" | "deactivate" } | null>(null);
  const manage = canManageChannels(actor, org);
  const verifier = actor.role === "verifier";
  const events = (auditEvents ?? channelAudit).filter((e) => e.orgId === org.id && (!historyId || e.channelId === historyId)).slice().reverse();

  const execute = async (command: ChannelCommand) => {
    try {
      if (!onCommand) throw new ChannelWorkflowError("forbidden");
      await onCommand(command);
      setError("");
      toast.success(pick(actions[command.action]));
      return true;
    } catch (e) {
      const message = pick(errors[e instanceof ChannelWorkflowError ? e.code : "invalid"]);
      setError(message); toast.error(message); return false;
    }
  };
  const openEditor = (channel: Channel | "new") => {
    setEditing(channel); setError(""); setType(channel === "new" ? "sms" : channel.type); setValue(channel === "new" ? "" : channel.value);
  };
  const save = async (e: FormEvent) => {
    e.preventDefault(); if (!editing) return;
    if (await execute({ action: editing === "new" ? "add" : "edit", orgId: org.id, channelId: editing === "new" ? uid("ch") : editing.id, type, value })) setEditing(null);
  };
  const iconAction = (label: string, icon: React.ReactNode, onClick: () => void) =>
    <Button size="icon" variant="ghost" title={label} aria-label={label} onClick={onClick}>{icon}</Button>;

  return (
    <div className="min-w-0" dir={dir}>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold">{pick(org.name)}</h3>
          <p className="mt-1 text-sm text-muted-foreground">{tr("Official communication registry · simulated verification only", "سجل قنوات التواصل الرسمية · توثيق افتراضي فقط")}</p>
        </div>
        {manage && <Button variant="emerald" onClick={() => openEditor("new")}><Plus />{tr("Add channel", "إضافة قناة")}</Button>}
      </div>
      {!manage && !verifier && <p className="mb-4 text-sm text-muted-foreground">{tr("Public registry · read only", "السجل العام · قراءة فقط")}</p>}
      <Tabs value={tab} onValueChange={(next) => { setTab(next); if (next === "history") setHistoryId(null); }} dir={dir}>
        <TabsList><TabsTrigger value="channels">{tr("Registered channels", "القنوات المسجّلة")}</TabsTrigger><TabsTrigger value="history">{tr("Verification history & audit", "سجل التوثيق والتدقيق")}</TabsTrigger></TabsList>
        <TabsContent value="channels" className="mt-4">
          <Table className="min-w-[780px]">
            <TableHeader><TableRow>
              {[tr("Channel type", "نوع القناة"), tr("Value", "القيمة"), tr("Verification status", "حالة التوثيق"), tr("Date added", "تاريخ الإضافة"), tr("Actions", "الإجراءات")].map((label) => <TableHead className="text-start" key={label}>{label}</TableHead>)}
            </TableRow></TableHeader>
            <TableBody>{org.channels.map((c) => <TableRow key={c.id}>
              <TableCell className="whitespace-nowrap">{pick(channelLabel[c.type])}</TableCell>
              <TableCell className="max-w-64 break-all"><Mono>{c.value}</Mono></TableCell>
              <TableCell><Badge variant={c.status === "verified" ? "verified" : c.status === "pending" ? "unverified" : "secondary"}>{pick(statuses[c.status ?? "pending"])}</Badge>
                {c.status === "pending" && <p className="mt-1 text-xs text-muted-foreground">{c.submittedAt ? tr("Awaiting independent review", "بانتظار مراجعة مستقلة") : tr("Not submitted", "لم تُرسل للمراجعة")}</p>}
              </TableCell>
              <TableCell className="whitespace-nowrap text-muted-foreground">{date(c.addedAt ?? org.registeredAt)}</TableCell>
              <TableCell><div className="flex items-center gap-1">
                {manage && iconAction(tr("Edit channel", "تعديل القناة"), <Pencil />, () => openEditor(c))}
                {manage && c.status === "pending" && !c.submittedAt && iconAction(tr("Submit for verification", "إرسال للتوثيق"), <Send />, () => execute({ action: "submit", orgId: org.id, channelId: c.id }))}
                {verifier && org.status === "verified" && c.status === "pending" && c.submittedAt && <>
                  {iconAction(tr("Approve channel", "اعتماد القناة"), <Check className="text-verified" />, () => { setReview({ channel: c, action: "approve" }); setNote(""); setError(""); })}
                  {iconAction(tr("Reject channel", "رفض القناة"), <X className="text-suspicious" />, () => { setReview({ channel: c, action: "reject" }); setNote(""); setError(""); })}
                </>}
                {manage && c.status === "verified" && iconAction(tr("Deactivate channel", "تعطيل القناة"), <Ban />, () => setConfirmation({ channel: c, action: "deactivate" }))}
                {verifier && c.status === "verified" && iconAction(tr("Revoke channel", "إلغاء توثيق القناة"), <Ban className="text-suspicious" />, () => setConfirmation({ channel: c, action: "revoke" }))}
                {manage && iconAction(tr("Delete channel", "حذف القناة"), <Trash2 />, () => setConfirmation({ channel: c, action: "remove" }))}
                {iconAction(tr("Channel history", "سجل القناة"), <History />, () => { setHistoryId(c.id); setTab("history"); })}
              </div></TableCell>
            </TableRow>)}</TableBody>
          </Table>
          {!org.channels.length && <p className="py-8 text-sm text-muted-foreground">{tr("No registered channels.", "لا توجد قنوات مسجّلة.")}</p>}
        </TabsContent>
        <TabsContent value="history" className="mt-4">
          {historyId && <Button variant="outline" size="sm" className="mb-3" onClick={() => setHistoryId(null)}>{tr("All organization events", "جميع أحداث الجهة")}</Button>}
          <p className="mb-3 text-xs text-muted-foreground">{auditEvents ? tr("Authenticated changes are recorded with the application. Removed channels remain in its audit history.", "تُسجّل التغييرات المصرّح بها مع الطلب. وتبقى القنوات المحذوفة في سجل التدقيق.") : tr("Fictional registry history", "سجل تجريبي خيالي")}</p>
          <div className="max-h-96 overflow-y-auto"><Table className="min-w-[740px]">
            <TableHeader><TableRow>{[tr("Date", "التاريخ"), tr("Event / channel", "الحدث / القناة"), tr("Actor", "الدور"), tr("Decision / evidence note", "ملاحظة القرار / الدليل")].map((label) => <TableHead className="text-start" key={label}>{label}</TableHead>)}</TableRow></TableHeader>
            <TableBody>{events.map((e) => <TableRow key={e.id}>
              <TableCell className="whitespace-nowrap text-xs">{date(e.at, true)}</TableCell>
              <TableCell className="max-w-64"><p className="font-medium">{pick(actions[e.action])}</p><p className="break-all"><Mono>{e.value}</Mono></p>{e.previousValue && <p className="break-all text-xs text-muted-foreground">{tr("Previous:", "السابق:")} <Mono>{e.previousValue}</Mono></p>}<p className="text-xs text-muted-foreground">{pick(channelLabel[e.type])} · {pick(statuses[e.status])}</p></TableCell>
              <TableCell className="text-xs">{e.actor.startsWith("org_admin") ? tr("Organization administrator (simulated)", "مسؤول الجهة (افتراضي)") : e.actor === "demo_seed" ? tr("Demo seed", "بيانات تجريبية") : e.actor === "registration_request" ? tr("Public registration request", "طلب تسجيل عام") : tr("Independent verifier (simulated)", "مراجع مستقل (افتراضي)")}</TableCell>
              <TableCell className="max-w-72 break-words text-xs">{e.action === "seed" ? tr("Fictional sample; no external verification.", "عيّنة خيالية؛ لا يوجد توثيق خارجي.") : e.action.startsWith("organization_") ? tr("Simulated independent organization review. Channel approval is separate.", "مراجعة مستقلة افتراضية للجهة. اعتماد القنوات منفصل.") : e.note || "—"}</TableCell>
            </TableRow>)}</TableBody>
          </Table></div>
          {!events.length && <p className="py-6 text-sm text-muted-foreground">{tr("No recorded events.", "لا توجد أحداث مسجّلة.")}</p>}
        </TabsContent>
      </Tabs>

      <Dialog open={editing !== null} onOpenChange={(open) => { if (!open) setEditing(null); }}>
        <DialogContent dir={dir} className="max-w-[calc(100%-2rem)] sm:max-w-lg">
          <DialogHeader><DialogTitle>{editing === "new" ? tr("Add official channel", "إضافة قناة رسمية") : tr("Edit official channel", "تعديل قناة رسمية")}</DialogTitle><DialogDescription>{tr("New and edited channels remain Pending Verification until submitted by the organization administrator and approved by an independent simulated verifier. Editing an active channel immediately removes its positive registry match.", "تبقى القنوات الجديدة والمعدّلة بانتظار التوثيق حتى يرسلها مسؤول الجهة ويعتمدها مراجع مستقل افتراضي. تعديل قناة نشطة يزيل مطابقتها الإيجابية فوراً.")}</DialogDescription></DialogHeader>
          <form onSubmit={save} className="space-y-4">
            <div className="space-y-2"><Label htmlFor="manage-type">{tr("Channel type", "نوع القناة")}</Label><NativeSelect id="manage-type" value={type} onChange={(e) => setType(e.target.value as ChannelType)}>{CHANNEL_TYPES.map((t) => <option key={t} value={t}>{pick(channelLabel[t])}</option>)}</NativeSelect></div>
            <div className="space-y-2"><Label htmlFor="manage-value">{tr("Channel value", "قيمة القناة")}</Label><Input id="manage-value" dir="ltr" value={value} onChange={(e) => setValue(e.target.value)} maxLength={200} required /></div>
            {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
            <DialogFooter><Button type="button" variant="outline" onClick={() => setEditing(null)}>{tr("Cancel", "إلغاء")}</Button><Button type="submit"><Plus />{tr("Save pending channel", "حفظ قناة بانتظار التوثيق")}</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <Dialog open={review !== null} onOpenChange={(open) => { if (!open) setReview(null); }}>
        <DialogContent dir={dir} className="max-w-[calc(100%-2rem)] sm:max-w-lg">
          <DialogHeader><DialogTitle>{review?.action === "approve" ? tr("Independent channel approval (simulated)", "اعتماد مستقل للقناة (محاكاة)") : tr("Reject channel request", "رفض طلب القناة")}</DialogTitle><DialogDescription>{tr("No telecom, DNS, bank or government checks are performed. Record a fictional evidence review, not a real-world certification.", "لا تُجرى فحوصات اتصالات أو DNS أو بنوك أو جهات حكومية. سجّل مراجعة أدلة خيالية، وليس اعتماداً فعلياً.")}</DialogDescription></DialogHeader>
          <Mono className="break-all">{review?.channel.value}</Mono>
          <form className="space-y-4" onSubmit={async (e) => { e.preventDefault(); if (review && await execute({ action: review.action, orgId: org.id, channelId: review.channel.id, note })) setReview(null); }}>
            <Label htmlFor="review-note">{tr("Simulated evidence / decision note", "ملاحظة الدليل / القرار الافتراضي")}</Label><Textarea id="review-note" required value={note} onChange={(e) => setNote(e.target.value)} maxLength={1000} />
            {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
            <DialogFooter><Button type="button" variant="outline" onClick={() => setReview(null)}>{tr("Cancel", "إلغاء")}</Button><Button type="submit" disabled={!note.trim()}><ShieldCheck />{review?.action === "approve" ? tr("Approve (simulated)", "اعتماد (محاكاة)") : tr("Reject request", "رفض الطلب")}</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <AlertDialog open={confirmation !== null} onOpenChange={(open) => { if (!open) setConfirmation(null); }}>
        <AlertDialogContent dir={dir} className="max-w-[calc(100%-2rem)] sm:max-w-lg">
          <AlertDialogHeader><AlertDialogTitle>{confirmation?.action === "remove" ? tr("Delete this channel?", "حذف هذه القناة؟") : confirmation?.action === "revoke" ? tr("Revoke this channel?", "إلغاء توثيق هذه القناة؟") : tr("Deactivate this channel?", "تعطيل هذه القناة؟")}</AlertDialogTitle><AlertDialogDescription>{tr("This channel will immediately stop producing a Verified registry result. Its verification history and audit entries will be retained.", "ستتوقف هذه القناة فوراً عن إنتاج نتيجة موثّقة في السجل. سيُحتفظ بسجل التوثيق والتدقيق.")}</AlertDialogDescription></AlertDialogHeader>
          <Mono className="break-all">{confirmation?.channel.value}</Mono>
          <AlertDialogFooter><AlertDialogCancel>{tr("Cancel", "إلغاء")}</AlertDialogCancel><AlertDialogAction onClick={() => { if (confirmation) execute({ action: confirmation.action, orgId: org.id, channelId: confirmation.channel.id }); }}>{tr("Confirm change", "تأكيد التغيير")}</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}