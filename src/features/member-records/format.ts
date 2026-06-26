type BadgeTone = "neutral" | "success" | "warning" | "danger";

export function formatDate(value: string | null) {
  if (!value) return "Not set";

  return new Intl.DateTimeFormat("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC"
  }).format(new Date(value.includes("T") ? value : `${value}T00:00:00.000Z`));
}

export function formatDateTime(value: string | null) {
  if (!value) return "Not set";

  return new Intl.DateTimeFormat("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit"
  }).format(new Date(value));
}

export function formatPeso(value: number | string | null) {
  if (value === null) return "Not set";

  const amount = Number(value);
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP"
  }).format(Number.isFinite(amount) ? amount : 0);
}

export function statusTone(status: string): BadgeTone {
  if (["active", "issued", "synced", "approved", "released", "verified", "rewarded", "sent", "read"].includes(status)) {
    return "success";
  }

  if (["pending", "submitted", "under_review", "needs_more_info", "requested", "queued", "uploading", "expiring"].includes(status)) {
    return "warning";
  }

  if (["inactive", "expired", "cancelled", "rejected", "revoked", "failed", "suspended", "closed"].includes(status)) {
    return "danger";
  }

  return "neutral";
}
