import { useEffect, useState } from "react";
import Tesseract from "tesseract.js";
import { FaCloudUploadAlt, FaCheck } from "react-icons/fa";
import { motion, useReducedMotion } from "motion/react";
import type { Truck } from "../types/docs";
import { addDocument, getTrucks } from "../../../api";
import { Sheet } from "../../../motion/Sheet";
import { Button } from "../../../components/ui/Button";
import { FormField } from "../../../components/ui/FormField";
import { inputClasses } from "../../../components/ui/inputStyles";
import { InlineMessage } from "../../../components/ui/InlineMessage";
import { spring } from "../../../motion/springs";

const DOC_TYPES = ["Insurance", "RC", "Permit", "Fitness", "Pollution", "Other"];

const EMPTY = {
  name: "",
  truckId: "",
  viewUrl: "",
  downloadUrl: "",
  type: "",
  expiryDate: "",
  notes: "",
};

export const UploadDocumentModal = ({
  isOpen,
  onClose,
  onUpload,
}: {
  isOpen: boolean;
  onClose: () => void;
  onUpload: () => void;
}) => {
  const reduced = useReducedMotion();
  const [trucks, setTrucks] = useState<Truck[]>([]);
  const [formData, setFormData] = useState(EMPTY);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [ocrStatus, setOcrStatus] = useState<string>("");

  useEffect(() => {
    if (!isOpen) return;
    const fetchTrucks = async () => {
      try {
        const data = (await getTrucks()) as unknown as { trucks?: Truck[] };
        setTrucks(data?.trucks ?? []);
      } catch (err) {
        console.error("Failed to fetch trucks:", err);
        setError("Could not load your trucks.");
      }
    };
    fetchTrucks();
  }, [isOpen]);

  const set = <K extends keyof typeof EMPTY>(key: K, value: string) =>
    setFormData((prev) => ({ ...prev, [key]: value }));

  /* --- OCR extraction (unchanged logic) ------------------------------- */
  const extractDataFromText = (text: string) => {
    const result: Record<string, string> = { notes: text.substring(0, 200) };
    const lower = text.toLowerCase();

    if (lower.includes("insurance")) result.type = "Insurance";
    else if (lower.includes("rc")) result.type = "RC";
    else if (lower.includes("permit")) result.type = "Permit";
    else if (lower.includes("fitness")) result.type = "Fitness";
    else if (lower.includes("pollution")) result.type = "Pollution";
    else result.type = "Other";

    const nameMatch = text.match(/(Permit|Insurance|RC|Fitness|Pollution)[^\n]{0,30}/i);
    if (nameMatch) result.name = nameMatch[0].trim();

    const expiryMatch = text.match(
      /(expire|expiry|valid.*?(till| up to|upto|on|date))\s*(?:\w+\s*)*[:\s-]*([0-9]{1,2}(?:[/\s-][A-Za-z]{3,9}|[/-][0-9]{1,2})[/\s-][0-9]{2,4})/i
    );

    if (expiryMatch && expiryMatch[3]) {
      const dateStr = expiryMatch[3].trim();
      const wordDateMatch = dateStr.match(/([0-9]{1,2})[\s\-/]?([a-zA-Z]{3,9})[\s\-/]?([0-9]{2,4})/);

      if (wordDateMatch) {
        const [, dayStr, monthStr, yearStr] = wordDateMatch;
        const monthMap: Record<string, number> = {
          january: 0, february: 1, march: 2, april: 3, may: 4, june: 5,
          july: 6, august: 7, september: 8, october: 9, november: 10, december: 11,
          jan: 0, feb: 1, mar: 2, apr: 3, jun: 5,
          jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11,
        };
        const month = monthMap[monthStr.toLowerCase()];
        const year = parseInt(yearStr.length === 2 ? `20${yearStr}` : yearStr);
        const date = new Date(Date.UTC(year, month, parseInt(dayStr)));
        if (!isNaN(date.getTime())) result.expiryDate = date.toISOString().split("T")[0];
      } else {
        const parts = dateStr.split(/[/-]/);
        if (parts.length === 3) {
          const [day, month, year] = parts.map(Number);
          const fullYear = year < 100 ? 2000 + year : year;
          const date = new Date(Date.UTC(fullYear, month - 1, day));
          if (!isNaN(date.getTime())) result.expiryDate = date.toISOString().split("T")[0];
        }
      }
    }

    const cleanedText = text.replace(/[\n\r]+/g, " ").replace(/\s+/g, " ").toUpperCase();
    const rawMatch = cleanedText.match(/([A-Z]{2})[\s-]*([0-9]{2})[\s-]*([A-Z]{2})[\s-]*([A-Z0-9]{4})/);

    if (rawMatch) {
      const [, state, district, series, numberRaw] = rawMatch;
      const fixNumber = (numStr: string) =>
        numStr.replace(/S/g, "5").replace(/O/g, "0").replace(/I/g, "1")
          .replace(/L/g, "1").replace(/Z/g, "2").replace(/B/g, "8");
      result.truckId = `${state}${district}${series}${fixNumber(numberRaw)}`;
    }

    return result;
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError("");
    setOcrStatus("Uploading…");

    const formDataUpload = new FormData();
    formDataUpload.append("file", file);
    formDataUpload.append("upload_preset", "testing");

    try {
      const res = await fetch("https://api.cloudinary.com/v1_1/dewedem6y/auto/upload", {
        method: "POST",
        body: formDataUpload,
      });
      const data = await res.json();

      if (data.secure_url) {
        setOcrStatus("Reading the document…");
        const imageText = await Tesseract.recognize(data.secure_url, "eng");
        const extracted = extractDataFromText(imageText.data.text);
        const matchedTruck = trucks.find((t) => t.registrationNumber === extracted.truckId);

        setFormData((prev) => ({
          ...prev,
          viewUrl: data.secure_url,
          downloadUrl: data.secure_url,
          ...extracted,
          truckId: matchedTruck?.registrationNumber || prev.truckId,
        }));
        setOcrStatus("done");
      } else {
        setError("The file uploaded but no URL came back. Please try again.");
        setOcrStatus("");
      }
    } catch (err) {
      console.error("Cloudinary upload failed:", err);
      setError("That file could not be uploaded. Please try again.");
      setOcrStatus("");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { name, truckId, viewUrl, downloadUrl, type } = formData;

    /* Both of these were `alert()` calls — a browser dialog stacked on top of
       the app's own dialog, which cannot be styled and drops the user out of
       the product's voice. */
    if (!viewUrl || !downloadUrl) {
      setError("Attach a file before saving.");
      return;
    }
    if (!name || !truckId || !type) {
      setError("Fill in the document name, truck and type.");
      return;
    }

    try {
      setLoading(true);
      setError("");
      await addDocument(formData);
      setFormData(EMPTY);
      setOcrStatus("");
      onClose();
      onUpload();
    } catch (err) {
      console.error("Upload error:", err);
      setError("Could not save that document. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setError("");
    onClose();
  };

  return (
    <Sheet
      open={isOpen}
      onClose={handleClose}
      title="Upload document"
      description="Attach a file and we'll try to read the details off it."
      size="lg"
      footer={
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button variant="secondary" onClick={handleClose} disabled={loading}>
            Cancel
          </Button>
          <Button form="upload-doc-form" type="submit" loading={loading} disabled={uploading}>
            Save document
          </Button>
        </div>
      }
    >
      <form id="upload-doc-form" onSubmit={handleSubmit} className="space-y-5">
        <InlineMessage tone="error">{error}</InlineMessage>

        {/* Drop zone. The state change on upload is the feedback — a file
            picker that looks identical before and after picking is the most
            common way an upload form loses people. */}
        <div>
          <input
            type="file"
            id="file-upload"
            accept="application/pdf,image/*"
            onChange={handleFileUpload}
            className="hidden"
          />
          <label
            htmlFor="file-upload"
            className={`flex cursor-pointer flex-col items-center gap-2 rounded-card border-2 border-dashed p-7 text-center transition-colors duration-200 ${
              formData.viewUrl
                ? "border-positive/40 bg-positive-soft"
                : "border-hairline-strong bg-canvas-sunken hover:border-accent hover:bg-accent-soft"
            }`}
          >
            {uploading ? (
              <>
                <motion.span
                  className="h-7 w-7 rounded-full border-[3px] border-accent/25 border-t-accent"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 0.7, ease: "linear", repeat: Infinity }}
                />
                <span className="text-sm font-semibold text-accent-ink">{ocrStatus}</span>
              </>
            ) : formData.viewUrl ? (
              <>
                <motion.span
                  className="grid h-9 w-9 place-items-center rounded-full bg-positive text-white"
                  /* A small overshoot here is earned: something completed. */
                  initial={reduced ? false : { scale: 0.6, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={spring.sheet}
                >
                  <FaCheck className="h-3.5 w-3.5" />
                </motion.span>
                <span className="text-sm font-semibold text-positive-ink">File attached</span>
                <span className="text-xs text-ink-tertiary">Click to replace it</span>
              </>
            ) : (
              <>
                <FaCloudUploadAlt className="h-8 w-8 text-ink-quaternary" />
                <span className="text-sm font-semibold text-ink">Click to upload a file</span>
                <span className="text-xs text-ink-tertiary">
                  PDF, JPG or PNG — we'll try to fill the fields for you
                </span>
              </>
            )}
          </label>

          {ocrStatus === "done" && (
            <p className="mt-2 text-center text-xs font-medium text-positive-ink">
              We filled in what we could read. Please check it before saving.
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <FormField label="Document name" htmlFor="doc-name" required>
            <input
              id="doc-name"
              className={inputClasses}
              placeholder="National permit"
              value={formData.name}
              onChange={(e) => set("name", e.target.value)}
            />
          </FormField>

          <FormField label="Document type" htmlFor="doc-type" required>
            <select
              id="doc-type"
              className={inputClasses}
              value={formData.type}
              onChange={(e) => set("type", e.target.value)}
            >
              <option value="">Select a type</option>
              {DOC_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </FormField>

          <FormField label="Truck" htmlFor="doc-truck" required>
            <select
              id="doc-truck"
              className={inputClasses}
              value={formData.truckId}
              onChange={(e) => set("truckId", e.target.value)}
            >
              <option value="">Choose a truck</option>
              {trucks.map((truck) => (
                <option key={truck.id} value={truck.registrationNumber}>
                  {truck.registrationNumber}
                </option>
              ))}
            </select>
          </FormField>

          <FormField
            label="Expiry date"
            htmlFor="doc-expiry"
            hint={ocrStatus === "done" ? "Auto-filled — check this carefully" : undefined}
          >
            <input
              id="doc-expiry"
              type="date"
              className={inputClasses}
              value={formData.expiryDate}
              onChange={(e) => set("expiryDate", e.target.value)}
            />
          </FormField>
        </div>

        <FormField label="Notes" htmlFor="doc-notes" hint="Extracted text appears here">
          <textarea
            id="doc-notes"
            placeholder="Any additional details"
            value={formData.notes}
            onChange={(e) => set("notes", e.target.value)}
            className={`${inputClasses} h-24 resize-none py-2.5`}
          />
        </FormField>
      </form>
    </Sheet>
  );
};
