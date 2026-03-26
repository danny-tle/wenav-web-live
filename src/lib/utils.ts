import { COLORS } from "./constants";

export function getStatusColor(
  status: "approved" | "not_confirmed" | "under_review"
): string {
  switch (status) {
    case "approved":
      return COLORS.approved;
    case "not_confirmed":
      return COLORS.notConfirmed;
    case "under_review":
      return COLORS.underReview;
  }
}

export function getStatusLabel(
  status: "approved" | "not_confirmed" | "under_review"
): string {
  switch (status) {
    case "approved":
      return "Approved";
    case "not_confirmed":
      return "Not Confirmed";
    case "under_review":
      return "Under Review";
  }
}

export function getIncidentTypeLabel(
  type: string
): string {
  return type
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export function formatDate(isoDate: string): string {
  return new Date(isoDate).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}
