export function getBadgeClass(urgency) {
  switch (urgency) {
    case 'HIGH':
      return 'text-rose-400 bg-rose-500/10 border-rose-500/20';
    case 'MEDIUM':
      return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
    case 'LOW':
    default:
      return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
  }
}

export function getBadgeLabel(urgency) {
  switch (urgency) {
    case 'HIGH':
      return 'High';
    case 'MEDIUM':
      return 'Medium';
    case 'LOW':
    default:
      return 'Low';
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