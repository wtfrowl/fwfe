export function MoneyCell({ value }: { value: number }) {
  return (
    <span className="font-medium">
      ₹{value.toLocaleString()}
    </span>
  );
}

export function ProfitBadge({ value }: { value: number }) {
  return (
    <span
      className={`inline-flex px-3 py-1 rounded-full text-xs font-medium
        ${
          value < 0
            ? "bg-red-100 text-red-700"
            : "bg-green-100 text-green-700"
        }`}
    >
      ₹{value.toLocaleString()}
    </span>
  );
}
