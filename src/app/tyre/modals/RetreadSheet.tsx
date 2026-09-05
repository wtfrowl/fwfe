import { useEffect, useState } from "react";
import { Sheet } from "../../../motion/Sheet";
import { Button } from "../../../components/ui/Button";
import { FormField } from "../../../components/ui/FormField";
import { InlineMessage } from "../../../components/ui/InlineMessage";
import { inputClasses } from "../../../components/ui/inputStyles";
import { returnFromRetread, sendForRetread } from "../../../api";
import type { ITyre } from "../../../types/tyre";

/**
 * Sending a casing away, and taking it back.
 *
 * `SentForRetreading` existed as a status with nothing behind it: a casing
 * that left the yard was gone from the system, with no record of which vendor
 * had it or when it was due back. A retread costs roughly a third of a new
 * tyre and casings genuinely do get lost at the retreader, so the record of
 * who is holding it is most of the value here.
 */
export function RetreadSheet({
  open,
  mode,
  tyre,
  onClose,
  onDone,
}: {
  open: boolean;
  mode: "send" | "return";
  tyre: ITyre | null;
  onClose: () => void;
  onDone: (tyre: ITyre) => void;
}) {
  const [vendorName, setVendorName] = useState("");
  const [expectedBackAt, setExpectedBackAt] = useState("");
  const [cost, setCost] = useState("");
  const [newTreadDepth, setNewTreadDepth] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !tyre) return;
    setVendorName(tyre.retread?.vendorName ?? tyre.vendorName ?? "");
    setExpectedBackAt("");
    setCost("");
    /* Seeded with the tyre's original depth: a fresh cap is usually close to
       new, and it is easier to correct a plausible number than to type one. */
    setNewTreadDepth(String(tyre.initialTreadDepth ?? ""));
    setNotes("");
    setError(null);
  }, [open, tyre]);

  if (!tyre) return null;

  const sending = mode === "send";

  const submit = async () => {
    setSaving(true);
    setError(null);
    try {
      const result = sending
        ? await sendForRetread(tyre._id, {
            vendorName: vendorName.trim() || undefined,
            expectedBackAt: expectedBackAt || undefined,
            notes: notes.trim() || undefined,
          })
        : await returnFromRetread(tyre._id, {
            cost: cost === "" ? 0 : Number(cost),
            newTreadDepth: Number(newTreadDepth),
            notes: notes.trim() || undefined,
          });

      onDone(result.tyre);
    } catch (err: any) {
      setError(err?.message ?? "That did not work.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={sending ? "Send for retreading" : "Back from retreading"}
      description={
        sending
          ? `${tyre.tyreNumber} leaves stock until it comes back.`
          : `${tyre.tyreNumber} returns to stock, ready to fit.`
      }
      size="md"
      footer={
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button
            onClick={submit}
            loading={saving}
            disabled={!sending && !(Number(newTreadDepth) > 0)}
          >
            {sending ? "Send" : "Take back into stock"}
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        {error && <InlineMessage tone="error">{error}</InlineMessage>}

        {sending ? (
          <>
            <FormField label="Retreader" htmlFor="retread-vendor" hint="Who is taking it">
              <input
                id="retread-vendor"
                value={vendorName}
                onChange={(e) => setVendorName(e.target.value)}
                className={inputClasses}
                placeholder="Elgi Retreads, Jaipur"
              />
            </FormField>

            <FormField label="Expected back" htmlFor="retread-eta" hint="Optional">
              <input
                id="retread-eta"
                type="date"
                value={expectedBackAt}
                onChange={(e) => setExpectedBackAt(e.target.value)}
                className={inputClasses}
              />
            </FormField>
          </>
        ) : (
          <>
            {tyre.retread?.vendorName && (
              <p className="text-sm text-ink-secondary">
                Sent to {tyre.retread.vendorName}
                {tyre.retread.sentAt
                  ? ` on ${new Date(tyre.retread.sentAt).toLocaleDateString()}`
                  : ""}
                .
              </p>
            )}

            {/* The new cap's depth becomes this tyre's initial depth for its
                second life. Keeping the original figure would show a freshly
                retreaded tyre as having already lost most of its tread, and
                every wear rate after it would be wrong. */}
            <FormField
              label="New tread depth"
              htmlFor="retread-depth"
              hint="mm — measured on the new cap"
            >
              <input
                id="retread-depth"
                type="number"
                min="0"
                step="0.5"
                value={newTreadDepth}
                onChange={(e) => setNewTreadDepth(e.target.value)}
                className={inputClasses}
              />
            </FormField>

            <FormField label="Cost" htmlFor="retread-cost" hint="₹, what the retread was billed at">
              <input
                id="retread-cost"
                type="number"
                min="0"
                value={cost}
                onChange={(e) => setCost(e.target.value)}
                className={inputClasses}
                placeholder="0"
              />
            </FormField>

            <InlineMessage tone="info">
              This will be retread #{(tyre.retreadCount ?? 0) + 1}. Lifetime distance is kept, so
              cost per kilometre stays true across both lives.
            </InlineMessage>
          </>
        )}

        <FormField label="Note" htmlFor="retread-notes" hint="Optional">
          <input
            id="retread-notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className={inputClasses}
          />
        </FormField>
      </div>
    </Sheet>
  );
}
