import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion, useReducedMotion } from "motion/react";
import {
  FaDownload,
  FaExternalLinkAlt,
  FaFileAlt,
  FaHistory,
  FaPen,
  FaPlus,
  FaTrash,
  FaWhatsapp,
} from "react-icons/fa";
import type { DocumentTruck, FleetDocument } from "../../../types/docs";
import {
  deleteDocument,
  getDocumentById,
  getDocumentHistory,
  getDocumentTrucks,
} from "../../../api";
import {
  BackButton,
  DetailField,
  DetailGrid,
  DetailHeader,
  DetailPage,
  DetailSection,
} from "../../../components/ui/DetailPage";
import { Button } from "../../../components/ui/Button";
import { InlineMessage } from "../../../components/ui/InlineMessage";
import { StatusBadge } from "../../../components/ui/StatusBadge";
import { ConfirmDialog } from "../../../components/ui/ConfirmDialog";
import { spring } from "../../../motion/springs";
import { toast } from "../../../store/notifications/toastStore";
import { cn } from "../../../utils/cn";
import { DocumentFormSheet } from "./DocumentFormSheet";
import { useDocsPaths } from "../lib/routes";
import {
  downloadUrlFor,
  formatDate,
  formatDateTime,
  formatFileSize,
  iconForType,
  isPdf,
  shareText,
  statusLabel,
  statusTone,
} from "../lib/documents";

/**
 * One document, in full.
 *
 * The page is built from the shared detail primitives now, so it reads as the
 * same product as the truck, trip and driver pages. The previous version
 * hand-rolled six icon-in-a-coloured-circle cards, recomputed the expiry rule
 * inline three times with a different threshold from the list, and surfaced
 * the owner's raw Mongo id under the label "Uploader ID" — a value no person
 * has ever needed.
 *
 * What replaces it is ordered by what the reader came for: is this valid, can
 * I show it to someone right now, and what came before it.
 */

const HISTORY_PAGE = 10;

export default function DocumentDetailPage() {
  const { id } = useParams() as { id: string };
  const navigate = useNavigate();
  const paths = useDocsPaths();
  const reduced = useReducedMotion();

  const [doc, setDoc] = useState<FleetDocument | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [history, setHistory] = useState<FleetDocument[]>([]);
  const [historyPage, setHistoryPage] = useState(1);
  const [historyTotal, setHistoryTotal] = useState(0);
  const [historyLoading, setHistoryLoading] = useState(false);

  const [trucks, setTrucks] = useState<DocumentTruck[]>([]);
  const [editOpen, setEditOpen] = useState(false);
  const [newVersionOpen, setNewVersionOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const loadDocument = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setDoc(await getDocumentById(id));
    } catch (err) {
      console.error("Failed to load document:", err);
      setError(
        (err as { message?: string })?.message ??
          "We couldn't load that document. It may have been deleted."
      );
    } finally {
      setLoading(false);
    }
  }, [id]);

  const loadHistory = useCallback(
    async (page: number) => {
      setHistoryLoading(true);
      try {
        const res = await getDocumentHistory(id, page, HISTORY_PAGE);
        setHistory((prev) => (page === 1 ? res.documents : [...prev, ...res.documents]));
        setHistoryTotal(res.totalDocs);
        setHistoryPage(page);
      } catch (err) {
        console.error("Failed to load document history:", err);
      } finally {
        setHistoryLoading(false);
      }
    },
    [id]
  );

  useEffect(() => {
    setHistory([]);
    setHistoryPage(1);
    setHistoryTotal(0);
    loadDocument();
  }, [loadDocument]);

  useEffect(() => {
    if (!doc) return;
    loadHistory(1);
  }, [doc, loadHistory]);

  useEffect(() => {
    getDocumentTrucks()
      .then(setTrucks)
      .catch((err) => console.error("Failed to load trucks:", err));
  }, []);

  const handleDelete = async () => {
    if (!doc) return;
    setDeleting(true);
    try {
      const res = await deleteDocument(doc._id);
      toast.success("Document deleted", `${doc.name} has been removed.`);
      setConfirmDelete(false);
      /* Land somewhere real: the version that took its place if there is one,
         otherwise the list. A detail page for a deleted thing is a dead end. */
      if (res.promotedTo) navigate(paths.document(res.promotedTo._id), { replace: true });
      else navigate(paths.root, { replace: true });
    } catch (err) {
      toast.critical("Could not delete", (err as { message?: string })?.message ?? "Please try again.");
      setDeleting(false);
    }
  };

  if (loading) return <DetailSkeleton />;

  if (error || !doc) {
    return (
      <DetailPage>
        <div className="flex items-center gap-3">
          <BackButton />
          <h1 className="text-2xl font-semibold text-ink">Document</h1>
        </div>
        <InlineMessage tone="error">{error ?? "We couldn't find that document."}</InlineMessage>
        <div>
          <Button variant="secondary" onClick={() => navigate(paths.root)}>
            Back to documents
          </Button>
        </div>
      </DetailPage>
    );
  }

  const shareUrl = `https://wa.me/?text=${encodeURIComponent(shareText(doc))}`;
  const remaining = historyTotal - history.length;

  return (
    <DetailPage>
      <DetailHeader
        title={doc.name}
        subtitle={
          <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span>{doc.type}</span>
            <span aria-hidden className="text-ink-quaternary">
              ·
            </span>
            <span className="font-medium tabular-nums text-ink-secondary">{doc.truckId}</span>
            {doc.documentNumber ? (
              <>
                <span aria-hidden className="text-ink-quaternary">
                  ·
                </span>
                <span>{doc.documentNumber}</span>
              </>
            ) : null}
          </span>
        }
        badge={<StatusBadge tone={statusTone[doc.status]}>{statusLabel(doc)}</StatusBadge>}
        actions={
          <>
            <Button
              variant="ghost"
              onClick={() => setConfirmDelete(true)}
              aria-label="Delete document"
            >
              <FaTrash className="h-3 w-3" />
              Delete
            </Button>
            <Button variant="secondary" onClick={() => setEditOpen(true)}>
              <FaPen className="h-3 w-3" />
              Edit
            </Button>
            <Button
              variant="secondary"
              onClick={() => window.open(shareUrl, "_blank", "noopener,noreferrer")}
            >
              <FaWhatsapp className="h-3.5 w-3.5" />
              Share
            </Button>
            <Button
              onClick={() => window.open(downloadUrlFor(doc), "_blank", "noopener,noreferrer")}
            >
              <FaDownload className="h-3.5 w-3.5" />
              Download
            </Button>
          </>
        }
      />

      {/* The one sentence the page exists to say, before anything else. */}
      <ExpiryBanner doc={doc} onRenew={() => setNewVersionOpen(true)} />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          <DetailSection
            title="Preview"
            icon={iconForType(doc.type)}
            padded={false}
            action={
              <a
                href={doc.viewUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-control px-2 py-1 text-sm font-medium text-ink-secondary transition-colors duration-150 hover:bg-ink/6 hover:text-ink"
              >
                Open full size
                <FaExternalLinkAlt className="h-2.5 w-2.5" aria-hidden />
              </a>
            }
          >
            <div className="h-[62vh] min-h-80 bg-canvas-sunken">
              {!doc.viewUrl ? (
                <div className="grid h-full place-items-center px-6 text-center text-sm text-ink-tertiary">
                  This document has no file attached.
                </div>
              ) : isPdf(doc) ? (
                <iframe src={doc.viewUrl} title={`${doc.name} preview`} className="h-full w-full" />
              ) : (
                <img
                  src={doc.viewUrl}
                  alt={`${doc.type} for ${doc.truckId}`}
                  className="h-full w-full object-contain"
                />
              )}
            </div>
          </DetailSection>

          {doc.notes ? (
            <DetailSection title="Notes">
              <p className="text-sm leading-relaxed whitespace-pre-wrap text-ink-secondary">
                {doc.notes}
              </p>
            </DetailSection>
          ) : null}
        </div>

        <div className="space-y-5">
          <DetailSection title="Details">
            <DetailGrid className="sm:grid-cols-2">
              <DetailField label="Truck" value={<span className="tabular-nums">{doc.truckId}</span>} />
              <DetailField label="Type" value={doc.type} />
              <DetailField label="Document number" value={doc.documentNumber || "—"} />
              <DetailField label="Version" value={`v${doc.version}`} />
              <DetailField label="Issued on" value={formatDate(doc.issueDate)} />
              <DetailField label="Expires on" value={formatDate(doc.expiryDate)} />
              <DetailField label="Uploaded" value={formatDateTime(doc.uploadedAt)} />
              <DetailField
                label="Uploaded by"
                value={doc.uploadedBy === "owner" ? "Fleet owner" : "Driver"}
              />
              {doc.fileSize ? (
                <DetailField label="File size" value={formatFileSize(doc.fileSize)} />
              ) : null}
            </DetailGrid>
          </DetailSection>

          <DetailSection
            title="Version history"
            icon={<FaHistory />}
            padded={false}
            action={
              <Button size="sm" variant="secondary" onClick={() => setNewVersionOpen(true)}>
                <FaPlus className="h-3 w-3" />
                New version
              </Button>
            }
          >
            {history.length === 0 && !historyLoading ? (
              <div className="flex flex-col items-center gap-2 px-5 py-10 text-center">
                <FaFileAlt className="h-6 w-6 text-ink-quaternary" aria-hidden />
                <p className="text-sm text-ink-tertiary">
                  This is the only version of this document.
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-hairline">
                {history.map((version) => {
                  const current = version._id === doc._id;

                  return (
                    <li key={version._id}>
                      <motion.button
                        type="button"
                        disabled={current}
                        onClick={() => navigate(paths.document(version._id))}
                        className={cn(
                          "flex w-full items-center gap-3 px-4 py-3 text-left",
                          "transition-colors duration-150",
                          current ? "cursor-default bg-accent-soft/50" : "hover:bg-ink/3"
                        )}
                        whileTap={current || reduced ? undefined : { scale: 0.99 }}
                        transition={spring.snappy}
                      >
                        <span
                          className={cn(
                            "grid h-10 w-10 shrink-0 place-items-center rounded-control text-sm font-semibold tabular-nums",
                            version.isLatest
                              ? "bg-accent text-white"
                              : "bg-ink/6 text-ink-secondary"
                          )}
                        >
                          v{version.version}
                        </span>

                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-sm font-medium tabular-nums text-ink">
                              {formatDate(version.uploadedAt)}
                            </p>
                            {version.isLatest ? (
                              <span className="text-caption rounded-chip bg-accent-soft px-1.5 py-0.5 text-[0.6875rem] font-semibold uppercase text-accent-ink">
                                Current
                              </span>
                            ) : null}
                            {current ? (
                              <span className="text-xs text-ink-tertiary">viewing</span>
                            ) : null}
                          </div>
                          <p className="mt-0.5 text-xs text-ink-tertiary">
                            {version.expiryDate
                              ? `Expires ${formatDate(version.expiryDate)}`
                              : "No expiry date"}
                          </p>
                        </div>

                        {!current ? (
                          <FaExternalLinkAlt
                            className="h-3 w-3 shrink-0 text-ink-quaternary"
                            aria-hidden
                          />
                        ) : null}
                      </motion.button>
                    </li>
                  );
                })}
              </ul>
            )}

            {remaining > 0 ? (
              <div className="border-t border-hairline p-3">
                <Button
                  variant="secondary"
                  fullWidth
                  size="sm"
                  loading={historyLoading}
                  onClick={() => loadHistory(historyPage + 1)}
                >
                  Show {Math.min(remaining, HISTORY_PAGE)} older
                </Button>
              </div>
            ) : null}
          </DetailSection>
        </div>
      </div>

      <DocumentFormSheet
        open={editOpen}
        mode="edit"
        document={doc}
        trucks={trucks}
        onClose={() => setEditOpen(false)}
        onSaved={(updated) => setDoc(updated)}
      />

      <DocumentFormSheet
        open={newVersionOpen}
        mode="create"
        trucks={trucks}
        presetTruckId={doc.truckId}
        presetType={doc.type}
        onClose={() => setNewVersionOpen(false)}
        onSaved={(created) => navigate(paths.document(created._id))}
      />

      <ConfirmDialog
        open={confirmDelete}
        title="Delete this document?"
        description={`${doc.name} (v${doc.version}) for ${doc.truckId} will be removed. ${
          (doc.versionCount ?? 1) > 1
            ? "The previous version becomes current again."
            : "This cannot be undone."
        }`}
        confirmLabel="Delete"
        tone="danger"
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(false)}
      />
    </DetailPage>
  );
}

/**
 * The expiry state, said in words.
 *
 * A badge tells you the state; this tells you what to do about it. It only
 * takes the reader's attention when there is something to act on — a valid
 * document gets a quiet line, not a green celebration.
 */
function ExpiryBanner({ doc, onRenew }: { doc: FleetDocument; onRenew: () => void }) {
  const days = doc.daysToExpiry;

  const copy: Record<FleetDocument["status"], { title: string; body: string }> = {
    expired: {
      title:
        days === null
          ? "This document has expired"
          : `Expired ${Math.abs(days)} day${Math.abs(days) === 1 ? "" : "s"} ago`,
      body: `Running ${doc.truckId} on this is a checkpoint fine waiting to happen. Upload the renewal as a new version.`,
    },
    expiring: {
      title:
        days !== null && days <= 0
          ? "Expires today"
          : `Expires in ${days} day${days === 1 ? "" : "s"}`,
      body: `Renew it before ${formatDate(doc.expiryDate)} so ${doc.truckId} keeps running.`,
    },
    valid: {
      title: `Valid until ${formatDate(doc.expiryDate)}`,
      body: "We'll warn you 30, 7 and 1 days before it lapses.",
    },
    "no-expiry": {
      title: "No expiry date on record",
      body: "Add one and this document joins the renewal reminders.",
    },
  };

  const tone = {
    expired: "border-critical/30 bg-critical-soft text-critical-ink",
    expiring: "border-caution/30 bg-caution-soft text-caution-ink",
    valid: "border-hairline bg-surface text-ink-secondary",
    "no-expiry": "border-hairline bg-surface text-ink-secondary",
  }[doc.status];

  const actionable = doc.status === "expired" || doc.status === "expiring";
  const { title, body } = copy[doc.status];

  return (
    <div
      className={cn(
        "flex flex-col gap-3 rounded-card border px-5 py-4 sm:flex-row sm:items-center sm:justify-between",
        tone
      )}
    >
      <div className="min-w-0">
        <p className="font-semibold">{title}</p>
        <p className="mt-0.5 text-sm opacity-90">{body}</p>
      </div>
      {actionable ? (
        <Button variant="secondary" onClick={onRenew} className="shrink-0">
          <FaPlus className="h-3 w-3" />
          Upload renewal
        </Button>
      ) : null}
    </div>
  );
}

/**
 * The skeleton mirrors the real layout's proportions, so the page does not
 * visibly rearrange itself the moment the data lands.
 */
function DetailSkeleton() {
  return (
    <DetailPage>
      <header className="flex items-start gap-3">
        <div className="h-9 w-9 shrink-0 animate-pulse rounded-full bg-ink/8" />
        <div className="space-y-2">
          <div className="h-8 w-56 animate-pulse rounded-chip bg-ink/8" />
          <div className="h-4 w-40 animate-pulse rounded-chip bg-ink/8" />
        </div>
      </header>
      <div className="h-20 animate-pulse rounded-card bg-ink/6" />
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div className="h-[62vh] min-h-80 animate-pulse rounded-card bg-ink/6 lg:col-span-2" />
        <div className="space-y-5">
          <div className="h-56 animate-pulse rounded-card bg-ink/6" />
          <div className="h-48 animate-pulse rounded-card bg-ink/6" />
        </div>
      </div>
    </DetailPage>
  );
}
