import api from "./axios";

/** Who you deal with, what you billed them, and what they still owe. */

export interface Party {
  _id: string;
  name: string;
  type: string;
  gstin?: string;
  contactName?: string;
  contactNumber?: string;
  email?: string;
  city?: string;
  state?: string;
  creditDays: number;
  openingBalance: number;
  active: boolean;
  /** Computed by the server: unpaid invoices plus any opening balance. */
  outstanding: number;
  openInvoices: number;
}

export interface InvoiceLine {
  description: string;
  trip?: string;
  quantity: number;
  rate: number;
  amount: number;
}

export interface Invoice {
  _id: string;
  number: string;
  party: Party | string;
  issueDate: string;
  dueDate: string;
  trips: string[];
  lineItems: InvoiceLine[];
  subtotal: number;
  commissionAmount: number;
  shortageAmount: number;
  advanceAdjusted: number;
  otherDeductions: number;
  reverseCharge: boolean;
  gstRate: number;
  interState: boolean;
  cgst: number;
  sgst: number;
  igst: number;
  tdsAmount: number;
  total: number;
  amountPaid: number;
  balance: number;
  status: "Draft" | "Sent" | "PartPaid" | "Paid" | "Cancelled";
  payments: {
    _id: string;
    date: string;
    amount: number;
    method: string;
    reference?: string;
  }[];
  notes?: string;
}

export interface UnbilledTrip {
  _id: string;
  departureLocation: string;
  arrivalLocation: string;
  registrationNumber: string;
  totalWeight: number;
  fare: number;
  totalFare: number;
  transporterName?: string;
  arrivalDateTime?: string;
  createdAt: string;
  commissionAmount?: number;
  shortageAmount?: number;
  cashAdvance?: number;
}

export interface Receivables {
  total: number;
  buckets: {
    current: number;
    d1_30: number;
    d31_60: number;
    d61_90: number;
    d90_plus: number;
  };
  parties: {
    partyId: string;
    name: string;
    contactNumber?: string;
    outstanding: number;
    oldestDueDate: string;
    invoiceCount: number;
    overdueCount: number;
  }[];
  invoices: {
    _id: string;
    number: string;
    party: string;
    partyId: string;
    issueDate: string;
    dueDate: string;
    total: number;
    amountPaid: number;
    balance: number;
    status: string;
    bucket: string;
    daysOverdue: number;
  }[];
}

export interface LedgerRow {
  date: string;
  type: string;
  description: string;
  amount: number;
  balance: number;
}

export const BillingAPI = {
  getParties: () => api.get("/api/billing/parties") as unknown as Promise<{ parties: Party[] }>,

  createParty: (data: Record<string, unknown>) =>
    api.post("/api/billing/parties", data) as unknown as Promise<Party>,

  updateParty: (id: string, data: Record<string, unknown>) =>
    api.patch(`/api/billing/parties/${id}`, data) as unknown as Promise<Party>,

  getPartyLedger: (id: string) =>
    api.get(`/api/billing/parties/${id}/ledger`) as unknown as Promise<{
      party: Party;
      openingBalance: number;
      closingBalance: number;
      entries: LedgerRow[];
    }>,

  /* Freight earned and never billed — the number this product could not show
     before, and the most common way a small fleet loses money. */
  getUnbilled: (partyId?: string) =>
    api.get("/api/billing/unbilled", {
      params: partyId ? { partyId } : undefined,
    }) as unknown as Promise<{ trips: UnbilledTrip[]; totalFreight: number }>,

  getReceivables: () =>
    api.get("/api/billing/receivables") as unknown as Promise<Receivables>,

  getInvoices: (params?: Record<string, unknown>) =>
    api.get("/api/billing/invoices", { params }) as unknown as Promise<{
      invoices: Invoice[];
      total: number;
      totalPages: number;
    }>,

  getInvoice: (id: string) =>
    api.get(`/api/billing/invoices/${id}`) as unknown as Promise<Invoice>,

  createInvoice: (data: Record<string, unknown>) =>
    api.post("/api/billing/invoices", data) as unknown as Promise<Invoice>,

  updateInvoice: (id: string, data: Record<string, unknown>) =>
    api.patch(`/api/billing/invoices/${id}`, data) as unknown as Promise<Invoice>,

  issueInvoice: (id: string) =>
    api.post(`/api/billing/invoices/${id}/issue`, {}) as unknown as Promise<Invoice>,

  recordPayment: (id: string, data: Record<string, unknown>) =>
    api.post(`/api/billing/invoices/${id}/payments`, data) as unknown as Promise<Invoice>,

  cancelInvoice: (id: string, reason?: string) =>
    api.post(`/api/billing/invoices/${id}/cancel`, { reason }) as unknown as Promise<Invoice>,

  getDriverLedger: (driverId: string) =>
    api.get(`/api/billing/drivers/${driverId}/ledger`) as unknown as Promise<{
      driver: { firstName: string; lastName: string };
      entries: LedgerRow[];
      balance: number;
      summary: string;
    }>,

  createDriverEntry: (data: Record<string, unknown>) =>
    api.post("/api/billing/driver-entries", data),
};
