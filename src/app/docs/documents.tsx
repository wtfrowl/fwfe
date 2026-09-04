import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, useReducedMotion } from "motion/react";
import {
  FaDownload,
  FaEye,
  FaFileAlt,
  FaPen,
  FaPlus,
  FaTrash,
} from "react-icons/fa";
import {
  DOCUMENT_TYPES,
  type DocumentQuery,
  type DocumentStatus,
  type DocumentSummary,
  type DocumentTruck,
  type DocumentType,
  type FleetDocument,
} from "../../types/docs";
import {
  deleteDocument,
  getDocumentSummary,
  getDocumentTrucks,
  getDocuments,
} from "../../api";
import { PageHeader } from "../../components/ui/PageHeader";
import { Button } from "../../components/ui/Button";
import { FilterBar } from "../../components/ui/FilterBar";
import { SearchField } from "../../components/ui/SearchField";
import { TableCard } from "../../components/ui/TableCard";
import { TablePagination } from "../../components/ui/TablePagination";
import { EmptyState } from "../../components/ui/EmptyState";
import { LoadingState } from "../../components/ui/LoadingState";
import { InlineMessage } from "../../components/ui/InlineMessage";
import { StatusBadge } from "../../components/ui/StatusBadge";
import { ConfirmDialog } from "../../components/ui/ConfirmDialog";
import { SegmentedControl, type Segment } from "../../components/ui/SegmentedControl";
import { inputClasses } from "../../components/ui/inputStyles";
import { RevealGroup, RevealItem } from "../../motion/Reveal";
import { spring } from "../../motion/springs";
import { toast } from "../../store/notifications/toastStore";
import { cn } from "../../utils/cn";
import { DocumentFormSheet } from "./components/DocumentFormSheet";
import { useDocsPaths } from "./lib/routes";
import {
  downloadUrlFor,
  formatDate,
  iconForType,
  statusLabel,
  statusTone,
} from "./lib/documents";

/**
 * The Documents screen.
 *
 * Rewritten around one question: which of my trucks is about to be stopped
 * for paperwork? Everything else is secondary to that, so expiry drives the
 * summary, the default sort and the tone of every row.
 *
 * Filtering, searching and paging now happen on the server. The previous
 * version fetched the first 100 documents once and filtered them in the
 * browser, so a fleet past that number silently lost rows — including,
 * possibly, the expired permit this page exists to surface.
 */

const PAGE_SIZE = 10;

type Tab = "all" | DocumentStatus;

const TAB_TO_STATUS: Record<Tab, DocumentStatus | ""> = {
  all: "",
  expiring: "expiring",
  expired: "expired",
  valid: "valid",
  "no-expiry": "no-expiry",
};

export default function DocumentsDashboard() {
  const navigate = useNavigate();
  const paths = useDocsPaths();
  const reduced = useReducedMotion();

  const [documents, setDocuments] = useState<FleetDocument[]>([]);
  const [summary, setSummary] = useState<DocumentSummary | null>(null);
  const [trucks, setTrucks] = useState<DocumentTruck[]>([]);

  const [tab, setTab] = useState<Tab>("all");
  const [truckId, setTruckId] = useState("");
  const [type, setType] = useState<DocumentType | "">("");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalDocs, setTotalDocs] = useState(0);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState<FleetDocument | null>(null);
  const [pendingDelete, setPendingDelete] = useState<FleetDocument | null>(null);
  const [deleting, setDeleting] = useState(false);

  /* Typing is not a request. Waiting a beat turns a nine-keystroke
     registration number into one query instead of nine. */
  useEffect(() => {
    const timer = setTimeout(() => setSearch(searchInput.trim()), 250);
    return () => clearTimeout(timer);
  }, [searchInput]);

  /* Narrowing a filter while on page 3 used to leave the table empty, since
     the page number outlived the result set it referred to. */
  useEffect(() => {
    setPage(1);
  }, [tab, truckId, type, search]);

  const query = useMemo<DocumentQuery>(
    () => ({
      page,
      limit: PAGE_SIZE,
      status: TAB_TO_STATUS[tab],
      truckId,
      type,
      search,
    }),
    [page, tab, truckId, type, search]
  );

  /* Only the newest response may write to state: a slow request for "RJ" must
     not land after the faster one for "RJ45" and put stale rows on screen. */
  const requestId = useRef(0);

  const loadDocuments = useCallback(async () => {
    const id = ++requestId.current;
    setLoading(true);
    setError(null);

    try {
      const res = await getDocuments(query);
      if (id !== requestId.current) return;

      setDocuments(res.documents);
      setTotalPages(res.totalPages);
      setTotalDocs(res.totalDocs);
    } catch (err) {
      if (id !== requestId.current) return;
      console.error("Failed to load documents:", err);
      setError("We couldn't load your documents. Check your connection and try again.");
    } finally {
      if (id === requestId.current) setLoading(false);
    }
  }, [query]);

  const loadSummary = useCallback(async () => {
    try {
      setSummary(await getDocumentSummary());
    } catch (err) {
      /* The counts are context, not content. If they fail the table still
         works, so this stays quiet rather than blocking the page. */
      console.error("Failed to load document summary:", err);
    }
  }, []);

  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  useEffect(() => {
    loadSummary();
    getDocumentTrucks()
      .then(setTrucks)
      .catch((err) => console.error("Failed to load trucks:", err));
  }, [loadSummary]);

  const refresh = useCallback(() => {
    loadDocuments();
    loadSummary();
  }, [loadDocuments, loadSummary]);

  const handleDelete = async () => {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      const res = await deleteDocument(pendingDelete._id);
      toast.success(
        "Document deleted",
        res.promotedTo
          ? `Version ${res.promotedTo.version} is now the current ${pendingDelete.type}.`
          : `${pendingDelete.name} has been removed.`
      );
      setPendingDelete(null);
      refresh();
    } catch (err) {
      toast.critical(
        "Could not delete",
        (err as { message?: string })?.message ?? "Please try again."
      );
    } finally {
      setDeleting(false);
    }
  };

  const tabs: Segment<Tab>[] = [
    { label: "All", value: "all", count: summary?.total },
    { label: "Expiring", value: "expiring", count: summary?.expiring },
    { label: "Expired", value: "expired", count: summary?.expired },
    { label: "Valid", value: "valid", count: summary?.valid },
    { label: "No expiry", value: "no-expiry", count: summary?.noExpiry },
  ];

  const filtersActive = tab !== "all" || Boolean(truckId || type || search);

  const clearFilters = () => {
    setTab("all");
    setTruckId("");
    setType("");
    setSearchInput("");
  };

  const openUpload = () => {
    setEditing(null);
    setSheetOpen(true);
  };

  return (
    <div className="mx-auto max-w-7xl space-y-5">
      <PageHeader
        title="Documents"
        description="Registration, insurance, permits and fitness papers for every truck — and how long each one has left."
        actions={
          <Button onClick={openUpload}>
            <FaPlus className="h-3.5 w-3.5" />
            Upload document
          </Button>
        }
      />

      <InlineMessage tone="error">{error}</InlineMessage>

      <RevealGroup className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <RevealItem>
          <Stat
            label="Documents"
            value={summary?.total ?? "—"}
            caption="Current versions"
            active={tab === "all"}
            onClick={() => setTab("all")}
            reduced={Boolean(reduced)}
          />
        </RevealItem>
        <RevealItem>
          <Stat
            label="Expiring soon"
            value={summary?.expiring ?? "—"}
            caption="Within 30 days"
            tone={summary?.expiring ? "warning" : undefined}
            active={tab === "expiring"}
            onClick={() => setTab("expiring")}
            reduced={Boolean(reduced)}
          />
        </RevealItem>
        <RevealItem>
          <Stat
            label="Expired"
            value={summary?.expired ?? "—"}
            caption="Renew these first"
            tone={summary?.expired ? "critical" : undefined}
            active={tab === "expired"}
            onClick={() => setTab("expired")}
            reduced={Boolean(reduced)}
          />
        </RevealItem>
        <RevealItem>
          <Stat
            label="Last upload"
            value={summary?.lastUploadedAt ? formatDate(summary.lastUploadedAt) : "—"}
            caption="Most recent paperwork"
            reduced={Boolean(reduced)}
          />
        </RevealItem>
      </RevealGroup>

      <FilterBar className="flex-col items-stretch md:flex-col md:items-stretch">
        <SegmentedControl segments={tabs} value={tab} onChange={setTab} />
        <div className="flex flex-col gap-3 lg:flex-row">
          <SearchField
            className="max-w-none lg:max-w-sm"
            placeholder="Search name, truck or number"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            aria-label="Search documents"
          />
          <select
            value={truckId}
            onChange={(e) => setTruckId(e.target.value)}
            className={cn(inputClasses, "lg:w-56")}
            aria-label="Filter by truck"
          >
            <option value="">All trucks</option>
            {trucks.map((truck) => (
              <option key={truck._id} value={truck.registrationNumber}>
                {truck.registrationNumber}
              </option>
            ))}
          </select>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as DocumentType | "")}
            className={cn(inputClasses, "lg:w-48")}
            aria-label="Filter by document type"
          >
            <option value="">All types</option>
            {DOCUMENT_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
          {filtersActive ? (
            <Button variant="ghost" onClick={clearFilters} className="lg:shrink-0">
              Clear
            </Button>
          ) : null}
        </div>
      </FilterBar>

      {loading && documents.length === 0 ? (
        <LoadingState label="Loading documents" />
      ) : error && documents.length === 0 ? (
        /* An empty table under an error message reads as "you have no
           documents", which is a different and much worse claim than "we
           could not reach the server". */
        <EmptyState
          icon={<FaFileAlt />}
          title="We couldn't load your documents"
          description="The server didn't answer. Your documents are safe — this is only the list."
          action={
            <Button variant="secondary" onClick={refresh}>
              Try again
            </Button>
          }
        />
      ) : documents.length === 0 ? (
        <EmptyState
          icon={<FaFileAlt />}
          title={filtersActive ? "No documents match those filters" : "No documents yet"}
          description={
            filtersActive
              ? "Try a different tab, truck or type — or clear the filters to see everything."
              : "Upload registration, insurance and permit papers so they're never missing at a checkpoint."
          }
          action={
            filtersActive ? (
              <Button variant="secondary" onClick={clearFilters}>
                Clear filters
              </Button>
            ) : (
              <Button onClick={openUpload}>
                <FaPlus className="h-3.5 w-3.5" />
                Upload document
              </Button>
            )
          }
        />
      ) : (
        /* The table dims rather than unmounting while a filter reloads. A
           spinner replacing the rows makes every keystroke flash the page. */
        <TableCard
          className={cn(
            "transition-opacity duration-200 ease-[var(--ease-out-quart)]",
            loading && "opacity-60"
          )}
        >
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full">
              <thead>
                <tr className="border-b border-hairline">
                  {["Document", "Truck", "Status", "Expires", "Updated", ""].map((heading, i) => (
                    <th
                      key={heading || i}
                      scope="col"
                      className="text-caption px-5 py-3 text-left text-xs font-semibold uppercase text-ink-tertiary"
                    >
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {documents.map((doc) => (
                  <tr
                    key={doc._id}
                    tabIndex={0}
                    role="link"
                    onClick={() => navigate(paths.document(doc._id))}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") navigate(paths.document(doc._id));
                    }}
                    className="cursor-pointer border-b border-hairline/70 transition-colors duration-150 last:border-0 hover:bg-ink/3 focus-visible:bg-ink/3"
                  >
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-chip bg-ink/6 text-ink-secondary">
                          {iconForType(doc.type)}
                        </span>
                        <div className="min-w-0">
                          <p className="truncate font-medium text-ink">{doc.name}</p>
                          <p className="truncate text-xs text-ink-tertiary">
                            {doc.type}
                            {doc.documentNumber ? ` · ${doc.documentNumber}` : ""}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-sm font-medium tabular-nums text-ink-secondary">
                      {doc.truckId}
                    </td>
                    <td className="px-5 py-3.5">
                      <StatusBadge tone={statusTone[doc.status]}>{statusLabel(doc)}</StatusBadge>
                    </td>
                    <td className="px-5 py-3.5 text-sm tabular-nums text-ink-secondary">
                      {formatDate(doc.expiryDate)}
                    </td>
                    <td className="px-5 py-3.5">
                      <p className="text-sm tabular-nums text-ink-secondary">
                        {formatDate(doc.uploadedAt)}
                      </p>
                      {doc.versionCount && doc.versionCount > 1 ? (
                        <p className="text-xs text-ink-tertiary">
                          v{doc.version} of {doc.versionCount}
                        </p>
                      ) : null}
                    </td>
                    <td className="px-5 py-3.5">
                      <RowActions
                        doc={doc}
                        onEdit={() => {
                          setEditing(doc);
                          setSheetOpen(true);
                        }}
                        onDelete={() => setPendingDelete(doc)}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* --- Mobile --------------------------------------------------- */}
          <div className="space-y-3 p-3 md:hidden">
            {documents.map((doc) => (
              <div
                key={doc._id}
                className="rounded-card border border-hairline bg-surface p-4 shadow-[var(--shadow-hairline)]"
              >
                <button
                  type="button"
                  onClick={() => navigate(paths.document(doc._id))}
                  className="flex w-full items-start gap-3 text-left"
                >
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-chip bg-ink/6 text-ink-secondary">
                    {iconForType(doc.type)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-ink">{doc.name}</p>
                    <p className="truncate text-sm text-ink-secondary">
                      {doc.truckId} · {doc.type}
                    </p>
                  </div>
                </button>

                <div className="mt-3 flex items-center justify-between gap-3 border-t border-hairline pt-3">
                  <div className="min-w-0">
                    <StatusBadge tone={statusTone[doc.status]}>{statusLabel(doc)}</StatusBadge>
                    {doc.expiryDate ? (
                      <p className="mt-1 text-xs tabular-nums text-ink-tertiary">
                        {formatDate(doc.expiryDate)}
                      </p>
                    ) : null}
                  </div>
                  <RowActions
                    doc={doc}
                    onEdit={() => {
                      setEditing(doc);
                      setSheetOpen(true);
                    }}
                    onDelete={() => setPendingDelete(doc)}
                  />
                </div>
              </div>
            ))}
          </div>

          <TablePagination
            currentPage={page}
            totalPages={totalPages}
            totalItems={totalDocs}
            pageSize={PAGE_SIZE}
            onPageChange={setPage}
          />
        </TableCard>
      )}

      <DocumentFormSheet
        open={sheetOpen}
        mode={editing ? "edit" : "create"}
        document={editing}
        trucks={trucks}
        presetTruckId={truckId}
        onClose={() => setSheetOpen(false)}
        onSaved={refresh}
      />

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title="Delete this document?"
        description={
          pendingDelete
            ? `${pendingDelete.name} (v${pendingDelete.version}) for ${pendingDelete.truckId} will be removed. ${
                (pendingDelete.versionCount ?? 1) > 1
                  ? "The previous version becomes current again."
                  : "This cannot be undone."
              }`
            : ""
        }
        confirmLabel="Delete"
        tone="danger"
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
}

/**
 * A summary tile that is also a filter.
 *
 * "3 expiring" is only useful if the next thought — show me which three —
 * costs one click. Tiles that merely report a number make the reader hunt for
 * the matching filter themselves.
 */
function Stat({
  label,
  value,
  caption,
  tone,
  active,
  onClick,
  reduced,
}: {
  label: string;
  value: string | number;
  caption?: string;
  tone?: "warning" | "critical";
  active?: boolean;
  onClick?: () => void;
  reduced: boolean;
}) {
  const body = (
    <>
      <p className="text-caption text-sm text-ink-secondary">{label}</p>
      <p
        className={cn(
          "mt-0.5 text-xl font-semibold tabular-nums tracking-[-0.02em]",
          tone === "critical" ? "text-critical-ink" : tone === "warning" ? "text-caution-ink" : "text-ink"
        )}
      >
        {value}
      </p>
      {caption ? <p className="mt-0.5 text-xs text-ink-tertiary">{caption}</p> : null}
    </>
  );

  const shell = cn(
    "w-full rounded-card border bg-surface p-4 text-left shadow-[var(--shadow-raised)]",
    "transition-colors duration-150 ease-[var(--ease-out-quart)]",
    active ? "border-accent/40 ring-1 ring-inset ring-accent/20" : "border-hairline"
  );

  if (!onClick) return <div className={shell}>{body}</div>;

  return (
    <motion.button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(shell, "hover:border-hairline-strong")}
      whileTap={reduced ? { opacity: 0.7 } : { scale: 0.98 }}
      transition={spring.snappy}
    >
      {body}
    </motion.button>
  );
}

/**
 * View, download, edit, delete.
 *
 * Icon buttons rather than a menu: four actions is under the threshold where
 * a menu saves anything, and hiding "download" behind a click is the wrong
 * trade on the one page where downloading is the point.
 */
function RowActions({
  doc,
  onEdit,
  onDelete,
}: {
  doc: FleetDocument;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const iconClass =
    "grid h-8 w-8 place-items-center rounded-control text-ink-tertiary transition-colors duration-150 hover:bg-ink/6 hover:text-ink";

  return (
    <div
      className="flex items-center justify-end gap-0.5"
      /* The row navigates; these do their own thing. */
      onClick={(e) => e.stopPropagation()}
    >
      <a
        href={doc.viewUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={iconClass}
        title={`Open ${doc.name}`}
        aria-label={`Open ${doc.name}`}
      >
        <FaEye className="h-3.5 w-3.5" />
      </a>
      <a
        href={downloadUrlFor(doc)}
        target="_blank"
        rel="noopener noreferrer"
        className={iconClass}
        title={`Download ${doc.name}`}
        aria-label={`Download ${doc.name}`}
      >
        <FaDownload className="h-3.5 w-3.5" />
      </a>
      <button type="button" onClick={onEdit} className={iconClass} aria-label={`Edit ${doc.name}`}>
        <FaPen className="h-3 w-3" />
      </button>
      <button
        type="button"
        onClick={onDelete}
        className={cn(iconClass, "hover:bg-critical-soft hover:text-critical-ink")}
        aria-label={`Delete ${doc.name}`}
      >
        <FaTrash className="h-3 w-3" />
      </button>
    </div>
  );
}
