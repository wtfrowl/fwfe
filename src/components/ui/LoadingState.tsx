export function LoadingState({ label = "Loading..." }: { label?: string }) {
  return (
    <div className="flex min-h-64 flex-col items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white px-6 py-12 text-center">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-slate-900" />
      <p className="text-sm font-medium text-slate-600">{label}</p>
    </div>
  );
}
