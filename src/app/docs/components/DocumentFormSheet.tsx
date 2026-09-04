import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { FaCheck, FaCloudUploadAlt, FaFilePdf, FaRedo } from "react-icons/fa";
import {
  DOCUMENT_TYPES,
  type DocumentTruck,
  type DocumentType,
  type FleetDocument,
} from "../../../types/docs";
import { addDocument, updateDocument } from "../../../api";
import { Sheet } from "../../../motion/Sheet";
import { spring, ease } from "../../../motion/springs";
import { Button } from "../../../components/ui/Button";
import { FormField } from "../../../components/ui/FormField";
import { InlineMessage } from "../../../components/ui/InlineMessage";
import { inputClasses } from "../../../components/ui/inputStyles";
import { toast } from "../../../store/notifications/toastStore";
import { extractDocumentFields, isOcrCandidate } from "../lib/ocr";
import { ACCEPTED_TYPES, uploadFile, validateFile, type UploadedFile } from "../lib/upload";
import { formatFileSize, toDateInput } from "../lib/documents";

/**
 * One sheet for uploading a document and for correcting one.
 *
 * Editing used to be impossible: a mistyped expiry date could only be fixed
 * by uploading the file again, which spent a version number on a typo. The
 * two modes share a form because they are the same form — creating simply
 * adds the file step in front of it.
 *
 * The file itself is never editable here. Replacing a file is an upload,
 * because the old one has to stay on the record.
 */

type Mode = "create" | "edit";

interface Fields {
  name: string;
  truckId: string;
  type: DocumentType | "";
  documentNumber: string;
  issueDate: string;
  expiryDate: string;
  notes: string;
}

const EMPTY: Fields = {
  name: "",
  truckId: "",
  type: "",
  documentNumber: "",
  issueDate: "",
  expiryDate: "",
  notes: "",
};

type UploadStage = "idle" | "uploading" | "reading" | "ready";

interface Props {
  open: boolean;
  mode: Mode;
  trucks: DocumentTruck[];
  /** The document being corrected, in edit mode. */
  document?: FleetDocument | null;
  /** Pre-selects the truck when uploading a replacement for a known slot. */
  presetTruckId?: string;
  /** Pre-selects the type, so "upload a new version" lands on the right slot. */
  presetType?: DocumentType | "";
  onClose: () => void;
  onSaved: (document: FleetDocument) => void;
}

export function DocumentFormSheet({
  open,
  mode,
  trucks,
  document,
  presetTruckId,
  presetType,
  onClose,
  onSaved,
}: Props) {
  const reduced = useReducedMotion();

  const [fields, setFields] = useState<Fields>(EMPTY);
  const [file, setFile] = useState<UploadedFile | null>(null);
  const [fileName, setFileName] = useState("");
  const [stage, setStage] = useState<UploadStage>("idle");
  const [autofilled, setAutofilled] = useState<string[]>([]);
  const [errors, setErrors] = useState<Partial<Record<keyof Fields | "file", string>>>({});
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  const abortRef = useRef<AbortController | null>(null);

  /* Reset on open rather than on close: resetting on close plays out under
     the exit animation, so the user watches the form they just filled empty
     itself on the way out. */
  useEffect(() => {
    if (!open) return;

    if (mode === "edit" && document) {
      setFields({
        name: document.name ?? "",
        truckId: document.truckId ?? "",
        type: document.type ?? "",
        documentNumber: document.documentNumber ?? "",
        issueDate: toDateInput(document.issueDate),
        expiryDate: toDateInput(document.expiryDate),
        notes: document.notes ?? "",
      });
    } else {
      setFields({ ...EMPTY, truckId: presetTruckId ?? "", type: presetType ?? "" });
    }

    setFile(null);
    setFileName("");
    setStage("idle");
    setAutofilled([]);
    setErrors({});
    setFormError("");
  }, [open, mode, document, presetTruckId, presetType]);

  /* An upload in flight when the sheet closes is an upload nobody is waiting
     for. Cancel it instead of letting it resolve into a dead component. */
  useEffect(() => {
    if (open) return;
    abortRef.current?.abort();
    abortRef.current = null;
  }, [open]);

  const set = useCallback(<K extends keyof Fields>(key: K, value: Fields[K]) => {
    setFields((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => (prev[key] ? { ...prev, [key]: undefined } : prev));
    setAutofilled((prev) => prev.filter((k) => k !== key));
  }, []);

  const handleFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const picked = event.target.files?.[0];
    /* Clear the input so picking the same file twice still fires a change. */
    event.target.value = "";
    if (!picked) return;

    const invalid = validateFile(picked);
    if (invalid) {
      setErrors((prev) => ({ ...prev, file: invalid }));
      return;
    }

    setErrors((prev) => ({ ...prev, file: undefined }));
    setFormError("");
    setFileName(picked.name);
    setStage("uploading");

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const uploaded = await uploadFile(picked, controller.signal);
      setFile(uploaded);

      /* Tesseract reads pixels, so a PDF is finished here — spending ten
         seconds proving that would be ten seconds of the user's time. */
      if (!isOcrCandidate(picked)) {
        setStage("ready");
        return;
      }

      setStage("reading");
      const { default: Tesseract } = await import("tesseract.js");
      const result = await Tesseract.recognize(uploaded.viewUrl, "eng");
      if (controller.signal.aborted) return;

      const extracted = extractDocumentFields(result.data.text);
      const matchedTruck = trucks.find((t) => t.registrationNumber === extracted.truckId);

      const filled: string[] = [];
      setFields((prev) => {
        const next = { ...prev };
        if (!prev.name && extracted.name) {
          next.name = extracted.name;
          filled.push("name");
        }
        if (!prev.type && extracted.type) {
          next.type = extracted.type;
          filled.push("type");
        }
        if (!prev.truckId && matchedTruck) {
          next.truckId = matchedTruck.registrationNumber;
          filled.push("truckId");
        }
        if (!prev.expiryDate && extracted.expiryDate) {
          next.expiryDate = extracted.expiryDate;
          filled.push("expiryDate");
        }
        if (!prev.notes && extracted.notes) next.notes = extracted.notes;
        return next;
      });
      setAutofilled(filled);
      setStage("ready");
    } catch (err) {
      if (controller.signal.aborted) return;
      console.error("Document upload failed:", err);
      /* A failed read is not a failed upload. If the file is on the CDN the
         user can still fill the form by hand, so don't throw it away. */
      setStage((prev) => (prev === "reading" ? "ready" : "idle"));
      setFormError(
        err instanceof Error ? err.message : "That file could not be uploaded. Please try again."
      );
    } finally {
      if (abortRef.current === controller) abortRef.current = null;
    }
  };

  const validate = (): boolean => {
    const next: Partial<Record<keyof Fields | "file", string>> = {};

    if (mode === "create" && !file) next.file = "Attach a file before saving.";
    if (!fields.name.trim()) next.name = "Give the document a name.";
    if (!fields.type) next.type = "Pick a type.";
    if (mode === "create" && !fields.truckId) next.truckId = "Pick a truck.";

    if (fields.issueDate && fields.expiryDate && fields.expiryDate < fields.issueDate) {
      next.expiryDate = "Expiry cannot be before the issue date.";
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setFormError("");
    if (!validate()) return;

    setSaving(true);
    try {
      if (mode === "edit" && document) {
        const { document: updated } = await updateDocument(document._id, {
          name: fields.name.trim(),
          type: fields.type as DocumentType,
          documentNumber: fields.documentNumber.trim(),
          issueDate: fields.issueDate,
          expiryDate: fields.expiryDate,
          notes: fields.notes.trim(),
        });
        toast.success("Document updated", `${updated.name} has been saved.`);
        onSaved(updated);
      } else {
        const res = await addDocument({
          name: fields.name.trim(),
          truckId: fields.truckId,
          type: fields.type as DocumentType,
          viewUrl: file!.viewUrl,
          downloadUrl: file!.downloadUrl,
          fileType: file!.fileType,
          fileSize: file!.fileSize,
          documentNumber: fields.documentNumber.trim(),
          issueDate: fields.issueDate,
          expiryDate: fields.expiryDate,
          notes: fields.notes.trim(),
        });

        toast.success(
          res.isNewVersion ? `Saved as version ${res.document.version}` : "Document uploaded",
          res.isNewVersion
            ? `The previous ${res.document.type} for ${res.document.truckId} is kept in history.`
            : `${res.document.name} is now on ${res.document.truckId}.`
        );
        onSaved(res.document);
      }
      onClose();
    } catch (err) {
      const message =
        (err as { message?: string })?.message ?? "Something went wrong. Please try again.";
      setFormError(message);
    } finally {
      setSaving(false);
    }
  };

  const busy = stage === "uploading" || stage === "reading";

  const stageLabel = useMemo(() => {
    if (stage === "uploading") return "Uploading…";
    if (stage === "reading") return "Reading the document…";
    return "";
  }, [stage]);

  const autofillHint = (key: keyof Fields) =>
    autofilled.includes(key) ? "Read from the file — check it" : undefined;

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={mode === "edit" ? "Edit document" : "Upload document"}
      description={
        mode === "edit"
          ? "Correct the details. The file itself stays as it is."
          : "Attach the paperwork and we'll try to read the details off it."
      }
      size="lg"
      footer={
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button form="document-form" type="submit" loading={saving} disabled={busy}>
            {mode === "edit" ? "Save changes" : "Save document"}
          </Button>
        </div>
      }
    >
      <form id="document-form" onSubmit={handleSubmit} className="space-y-5" noValidate>
        <InlineMessage tone="error">{formError}</InlineMessage>

        {mode === "create" ? (
          <div className="space-y-1.5">
            <input
              type="file"
              id="document-file"
              accept={ACCEPTED_TYPES}
              onChange={handleFile}
              className="hidden"
              disabled={busy}
            />
            <label
              htmlFor="document-file"
              /* The state change is the feedback. A picker that looks the same
                 before and after choosing is the most common way an upload
                 form loses people. */
              className={`flex min-h-[8.5rem] cursor-pointer flex-col items-center justify-center gap-2 rounded-card border-2 border-dashed px-6 py-7 text-center transition-colors duration-200 ease-[var(--ease-out-quart)] ${
                errors.file
                  ? "border-critical/50 bg-critical-soft"
                  : file
                    ? "border-positive/40 bg-positive-soft"
                    : "border-hairline-strong bg-canvas-sunken hover:border-accent hover:bg-accent-soft"
              } ${busy ? "pointer-events-none" : ""}`}
            >
              <AnimatePresence mode="wait" initial={false}>
                {busy ? (
                  <motion.div
                    key="busy"
                    className="flex flex-col items-center gap-2"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={ease.tint}
                  >
                    <motion.span
                      className="h-7 w-7 rounded-full border-[3px] border-accent/25 border-t-accent"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 0.7, ease: "linear", repeat: Infinity }}
                      aria-hidden
                    />
                    <span className="text-sm font-semibold text-accent-ink">{stageLabel}</span>
                    <span className="max-w-full truncate text-xs text-ink-tertiary">{fileName}</span>
                  </motion.div>
                ) : file ? (
                  <motion.div
                    key="done"
                    className="flex flex-col items-center gap-2"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={ease.tint}
                  >
                    <motion.span
                      className="grid h-9 w-9 place-items-center rounded-full bg-positive text-white"
                      /* A little overshoot is earned here: something finished. */
                      initial={reduced ? false : { scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={spring.sheet}
                      aria-hidden
                    >
                      <FaCheck className="h-3.5 w-3.5" />
                    </motion.span>
                    <span className="flex items-center gap-2 text-sm font-semibold text-positive-ink">
                      {file.fileType.includes("pdf") ? <FaFilePdf className="h-3.5 w-3.5" /> : null}
                      <span className="max-w-[16rem] truncate">{fileName}</span>
                    </span>
                    <span className="flex items-center gap-1.5 text-xs text-ink-tertiary">
                      {formatFileSize(file.fileSize)}
                      <span aria-hidden>·</span>
                      <FaRedo className="h-2.5 w-2.5" aria-hidden />
                      Click to replace
                    </span>
                  </motion.div>
                ) : (
                  <motion.div
                    key="empty"
                    className="flex flex-col items-center gap-2"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={ease.tint}
                  >
                    <FaCloudUploadAlt className="h-8 w-8 text-ink-quaternary" aria-hidden />
                    <span className="text-sm font-semibold text-ink">Click to attach a file</span>
                    <span className="text-xs text-ink-tertiary">
                      PDF, JPG, PNG or WebP up to 10 MB
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>
            </label>

            {errors.file ? (
              <p role="alert" className="text-xs font-medium text-critical-ink">
                {errors.file}
              </p>
            ) : autofilled.length > 0 ? (
              <p className="text-xs text-ink-tertiary">
                We filled in what we could read. Please check it before saving.
              </p>
            ) : null}
          </div>
        ) : null}

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <FormField
            label="Document name"
            htmlFor="doc-name"
            required
            error={errors.name}
            hint={autofillHint("name")}
          >
            <input
              id="doc-name"
              className={inputClasses}
              placeholder="National permit"
              value={fields.name}
              onChange={(e) => set("name", e.target.value)}
            />
          </FormField>

          <FormField
            label="Type"
            htmlFor="doc-type"
            required
            error={errors.type}
            hint={autofillHint("type")}
          >
            <select
              id="doc-type"
              className={inputClasses}
              value={fields.type}
              onChange={(e) => set("type", e.target.value as DocumentType)}
            >
              <option value="">Select a type</option>
              {DOCUMENT_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </FormField>

          <FormField
            label="Truck"
            htmlFor="doc-truck"
            required={mode === "create"}
            error={errors.truckId}
            hint={
              mode === "edit"
                ? "A document cannot move between trucks — upload it to the other truck instead."
                : autofillHint("truckId")
            }
          >
            <select
              id="doc-truck"
              className={inputClasses}
              value={fields.truckId}
              disabled={mode === "edit"}
              onChange={(e) => set("truckId", e.target.value)}
            >
              <option value="">Choose a truck</option>
              {trucks.map((truck) => (
                <option key={truck._id} value={truck.registrationNumber}>
                  {truck.registrationNumber}
                </option>
              ))}
            </select>
          </FormField>

          <FormField label="Document number" htmlFor="doc-number" hint="Policy or certificate no.">
            <input
              id="doc-number"
              className={inputClasses}
              placeholder="Optional"
              value={fields.documentNumber}
              onChange={(e) => set("documentNumber", e.target.value)}
            />
          </FormField>

          <FormField label="Issued on" htmlFor="doc-issued">
            <input
              id="doc-issued"
              type="date"
              className={inputClasses}
              value={fields.issueDate}
              onChange={(e) => set("issueDate", e.target.value)}
            />
          </FormField>

          <FormField
            label="Expires on"
            htmlFor="doc-expiry"
            error={errors.expiryDate}
            hint={autofillHint("expiryDate") ?? "We'll warn you 30, 7 and 1 days before"}
          >
            <input
              id="doc-expiry"
              type="date"
              className={inputClasses}
              value={fields.expiryDate}
              onChange={(e) => set("expiryDate", e.target.value)}
            />
          </FormField>
        </div>

        <FormField label="Notes" htmlFor="doc-notes" hint="Anything worth remembering later">
          <textarea
            id="doc-notes"
            className={`${inputClasses} h-24 resize-none py-2.5`}
            placeholder="Optional"
            value={fields.notes}
            onChange={(e) => set("notes", e.target.value)}
          />
        </FormField>
      </form>
    </Sheet>
  );
}
