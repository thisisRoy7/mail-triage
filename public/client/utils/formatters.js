export function getBadgeClass(urgency) {
  switch (urgency) {
    case 'HIGH':
      return 'text-rose-400 bg-rose-500/10 border-rose-500/25 ring-1 ring-rose-500/15';
    case 'MEDIUM':
      return 'text-amber-400 bg-amber-500/10 border-amber-500/25 ring-1 ring-amber-500/15';
    case 'LOW':
    default:
      return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/25 ring-1 ring-emerald-500/15';
  }
}

export function getBadgeLabel(urgency) {
  switch (urgency) {
    case 'HIGH':
      return 'Action Required';
    case 'MEDIUM':
      return 'Needs Review';
    case 'LOW':
      return 'Low Priority';
    default:
      return 'Unclassified';
  }
}

export function formatDate(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const now = new Date();
  if (date.toDateString() === now.toDateString()) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
}