import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaEye,
  FaDownload,
  FaPlus,
  FaCar,
  FaShieldAlt,
  FaFileAlt,
  FaTools,
  FaCloud,
  FaPaperclip,
} from "react-icons/fa";
import type { Document, Truck } from "./types/docs";
import { UploadDocumentModal } from "./components/upload-document-modal";
import { getDocuments, getTrucks } from "../../api";
import { PageHeader } from "../../components/ui/PageHeader";
import { Button } from "../../components/ui/Button";
import { FilterBar } from "../../components/ui/FilterBar";
import { TableCard } from "../../components/ui/TableCard";
import { TablePagination } from "../../components/ui/TablePagination";
import { EmptyState } from "../../components/ui/EmptyState";
import { LoadingState } from "../../components/ui/LoadingState";
import { InlineMessage } from "../../components/ui/InlineMessage";
import { StatusBadge } from "../../components/ui/StatusBadge";
import { SegmentedControl, type Segment } from "../../components/ui/SegmentedControl";
import { inputClasses } from "../../components/ui/inputStyles";
import { RevealGroup, RevealItem } from "../../motion/Reveal";

const typeIcons: Record<string, React.ReactNode> = {
  RC: <FaCar />,
  Insurance: <FaShieldAlt />,
  Permit: <FaFileAlt />,
  Fitness: <FaTools />,
  Pollution: <FaCloud />,
  Other: <FaPaperclip />,
};

const DOC_TYPES = ["Insurance", "RC", "Permit", "Fitness", "Pollution", "Other"];

const ITEMS_PER_PAGE = 6;
const DAY = 86_400_000;

type Tab = "All" | "Permits" | "Expiring" | "Missing";

/**
 * "Expiring soon" means the next 30 days and NOT already expired.
 *
 * The old test was `expiryDate < now + 7 days`, which is also true of a
 * document that expired two years ago — so the count conflated "renew this
 * week" with "long dead", and the number was never actionable.
 */
const isExpiringSoon = (doc: Document) => {
  if (!doc.expiryDate) return false;
  const expiry = new Date(doc.expiryDate).getTime();
  if (Number.isNaN(expiry)) return false;
  const now = Date.now();
  return expiry >= now && expiry <= now + 30 * DAY;
};

const isExpired = (doc: Document) => {
  if (!doc.expiryDate) return false;
  const expiry = new Date(doc.expiryDate).getTime();
  return !Number.isNaN(expiry) && expiry < Date.now();
};

export default function DocumentsDashboard() {
  const navigate = useNavigate();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [trucks, setTrucks] = useState<Truck[]>([]);
  const [selectedTruckId, setSelectedTruckId] = useState("");
  const [selectedType, setSelectedType] = useState("");
  const [selectedTab, setSelectedTab] = useState<Tab>("All");
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [docResponse, truckResponse] = await Promise.all([getDocuments(1, 100), getTrucks()]);
      /* The API layer declares its own `Document`/`Truck` shapes that do not
         line up with this feature's types, so the hop through `unknown` is
         deliberate — same as the `any` this replaced, but narrowed at one
         point instead of leaking through the file. */
      setDocuments(
        ((docResponse as unknown as { documents?: Document[] })?.documents ?? []) as Document[]
      );
      setTrucks(((truckResponse as unknown as { trucks?: Truck[] })?.trucks ?? []) as Truck[]);
    } catch (err) {
      console.error("Error fetching documents:", err);
      setError("Could not load your documents. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  /* Documents carry a truck id; people recognise a registration number. */
  const truckLabel = useMemo(() => {
    const map = new Map<string, string>();
    trucks.forEach((t) => map.set(String(t.id), t.registrationNumber));
    return (id: string) => map.get(String(id)) ?? "—";
  }, [trucks]);

  const expiringCount = useMemo(() => documents.filter(isExpiringSoon).length, [documents]);
  const missingCount = useMemo(() => documents.filter((d) => !d.viewUrl).length, [documents]);
  const permitCount = useMemo(() => documents.filter((d) => d.type === "Permit").length, [documents]);

  const tabs: Segment<Tab>[] = [
    { label: "All", value: "All", count: documents.length },
    { label: "Permits", value: "Permits", count: permitCount },
    { label: "Expiring", value: "Expiring", count: expiringCount },
    { label: "Missing file", value: "Missing", count: missingCount },
  ];

  const filteredDocs = useMemo(
    () =>
      documents.filter((doc) => {
        if (selectedTruckId && doc.truckId !== selectedTruckId) return false;
        if (selectedType && doc.type !== selectedType) return false;
        if (selectedTab === "Permits") return doc.type === "Permit";
        if (selectedTab === "Expiring") return isExpiringSoon(doc);
        if (selectedTab === "Missing") return !doc.viewUrl;
        return true;
      }),
    [documents, selectedTruckId, selectedType, selectedTab]
  );

  const totalPages = Math.max(1, Math.ceil(filteredDocs.length / ITEMS_PER_PAGE));

  /* The page number used to survive a filter change, so narrowing a filter
     while on page 3 showed an empty table. */
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedTruckId, selectedType, selectedTab]);

  const paginatedDocs = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredDocs.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredDocs, currentPage]);

  const lastUploaded = documents.length
    ? new Date(
        Math.max(...documents.map((d) => new Date(d.uploadedAt).getTime()).filter(Number.isFinite))
      )
    : null;

  const Stat = ({ label, value }: { label: string; value: string | number }) => (
    <div className="rounded-card border border-hairline bg-surface p-4 shadow-[var(--shadow-raised)]">
      <p className="text-caption text-sm text-ink-secondary">{label}</p>
      <p className="mt-0.5 text-xl font-semibold tabular-nums tracking-[-0.02em] text-ink">
        {value}
      </p>
    </div>
  );

  return (
    <div className="mx-auto max-w-7xl space-y-5">
      <PageHeader
        title="Documents"
        description="Registration, insurance, permits and fitness papers for every truck."
        actions={
          <Button onClick={() => setIsUploadModalOpen(true)}>
            <FaPlus className="h-3.5 w-3.5" />
            Upload document
          </Button>
        }
      />

      <InlineMessage tone="error">{error}</InlineMessage>

      <RevealGroup className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <RevealItem>
          <Stat label="Total documents" value={documents.length} />
        </RevealItem>
        <RevealItem>
          <Stat label="Expiring in 30 days" value={expiringCount} />
        </RevealItem>
        <RevealItem>
          <Stat
            label="Last uploaded"
            value={
              lastUploaded
                ? lastUploaded.toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })
                : "—"
            }
          />
        </RevealItem>
      </RevealGroup>

      <FilterBar className="flex-col items-stretch md:flex-col md:items-stretch">
        <SegmentedControl segments={tabs} value={selectedTab} onChange={setSelectedTab} />
        <div className="flex flex-col gap-3 md:flex-row">
          <select
            value={selectedTruckId}
            onChange={(e) => setSelectedTruckId(e.target.value)}
            className={`${inputClasses} md:w-1/2`}
            aria-label="Filter by truck"
          >
            <option value="">All trucks</option>
            {trucks.map((truck) => (
              <option key={truck.id} value={truck.id}>
                {truck.registrationNumber}
              </option>
            ))}
          </select>
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className={`${inputClasses} md:w-1/2`}
            aria-label="Filter by document type"
          >
            <option value="">All types</option>
            {DOC_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>
      </FilterBar>

      {loading ? (
        <LoadingState label="Loading documents" />
      ) : paginatedDocs.length === 0 ? (
        <EmptyState
          icon={<FaFileAlt />}
          title={documents.length ? "No documents match those filters" : "No documents yet"}
          description={
            documents.length
              ? "Try a different tab, truck or type."
              : "Upload registration, insurance and permit papers so they're never missing at a checkpoint."
          }
          action={
            documents.length ? (
              <Button
                variant="secondary"
                onClick={() => {
                  setSelectedTab("All");
                  setSelectedTruckId("");
                  setSelectedType("");
                }}
              >
                Clear filters
              </Button>
            ) : (
              <Button onClick={() => setIsUploadModalOpen(true)}>
                <FaPlus className="h-3.5 w-3.5" />
                Upload document
              </Button>
            )
          }
        />
      ) : (
        <TableCard>
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full">
              <thead>
                <tr className="border-b border-hairline">
                  {["Name", "Truck", "Type", "Uploaded", ""].map((h, i) => (
                    <th
                      key={h || i}
                      className="text-caption px-5 py-3 text-left text-xs font-semibold uppercase text-ink-tertiary"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paginatedDocs.map((doc) => (
                  <tr
                    key={doc._id}
                    className="cursor-pointer border-b border-hairline/70 transition-colors duration-150 last:border-0 hover:bg-ink/3"
                    onClick={() => navigate(`documents/${doc._id}`)}
                  >
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-chip bg-ink/6 text-ink-secondary">
                          {typeIcons[doc.type ?? "Other"] ?? <FaPaperclip />}
                        </span>
                        <span className="font-medium text-ink">{doc.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-sm text-ink-secondary">
                      {truckLabel(doc.truckId)}
                    </td>
                    <td className="px-5 py-3.5">
                      {isExpired(doc) ? (
                        <StatusBadge tone="danger">{doc.type} · expired</StatusBadge>
                      ) : isExpiringSoon(doc) ? (
                        <StatusBadge tone="warning">{doc.type} · expiring</StatusBadge>
                      ) : (
                        <StatusBadge tone="neutral">{doc.type}</StatusBadge>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-sm text-ink-secondary">
                      {new Date(doc.uploadedAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td className="px-5 py-3.5">
                      <div
                        className="flex items-center justify-end gap-1"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <a
                          href={doc.viewUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="rounded-control p-2 text-ink-tertiary transition-colors duration-150 hover:bg-ink/6 hover:text-ink"
                          title={`View ${doc.name}`}
                          aria-label={`View ${doc.name}`}
                        >
                          <FaEye className="h-4 w-4" />
                        </a>
                        <a
                          href={doc.downloadUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="rounded-control p-2 text-ink-tertiary transition-colors duration-150 hover:bg-ink/6 hover:text-ink"
                          title={`Download ${doc.name}`}
                          aria-label={`Download ${doc.name}`}
                        >
                          <FaDownload className="h-4 w-4" />
                        </a>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* --- Mobile --- */}
          <div className="space-y-3 p-3 md:hidden">
            {paginatedDocs.map((doc) => (
              <div
                key={doc._id}
                className="rounded-card border border-hairline bg-surface p-4 shadow-[var(--shadow-hairline)]"
              >
                <button
                  type="button"
                  onClick={() => navigate(`documents/${doc._id}`)}
                  className="flex w-full items-start gap-3 text-left"
                >
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-chip bg-ink/6 text-ink-secondary">
                    {typeIcons[doc.type ?? "Other"] ?? <FaPaperclip />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-ink">{doc.name}</p>
                    <p className="text-sm text-ink-secondary">
                      {truckLabel(doc.truckId)} ·{" "}
                      {new Date(doc.uploadedAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                      })}
                    </p>
                  </div>
                </button>

                <div className="mt-3 flex items-center justify-between border-t border-hairline pt-3">
                  {isExpired(doc) ? (
                    <StatusBadge tone="danger">Expired</StatusBadge>
                  ) : isExpiringSoon(doc) ? (
                    <StatusBadge tone="warning">Expiring</StatusBadge>
                  ) : (
                    <StatusBadge tone="neutral">{doc.type}</StatusBadge>
                  )}
                  <div className="flex gap-1">
                    <a
                      href={doc.viewUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-control p-2 text-ink-tertiary hover:bg-ink/6 hover:text-ink"
                      aria-label={`View ${doc.name}`}
                    >
                      <FaEye className="h-4 w-4" />
                    </a>
                    <a
                      href={doc.downloadUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-control p-2 text-ink-tertiary hover:bg-ink/6 hover:text-ink"
                      aria-label={`Download ${doc.name}`}
                    >
                      <FaDownload className="h-4 w-4" />
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <TablePagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={filteredDocs.length}
            pageSize={ITEMS_PER_PAGE}
            onPageChange={setCurrentPage}
          />
        </TableCard>
      )}

      <UploadDocumentModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onUpload={fetchAll}
      />
    </div>
  );
}
