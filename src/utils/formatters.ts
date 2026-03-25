export function formatCurrency(amount: number, currency = 'INR'): string {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency }).format(amount);
}

export function formatDate(dateStr: string | any): string {
  if (!dateStr) return '—';
  const d = dateStr?.toDate ? dateStr.toDate() : new Date(dateStr);
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function formatTime(dateStr: string | any): string {
  if (!dateStr) return '—';
  const d = dateStr?.toDate ? dateStr.toDate() : new Date(dateStr);
  return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
}

export function formatDateTime(dateStr: string | any): string {
  return `${formatDate(dateStr)}, ${formatTime(dateStr)}`;
}

export function truncate(str: string, maxLen = 80): string {
  return str.length > maxLen ? str.slice(0, maxLen) + '…' : str;
}
