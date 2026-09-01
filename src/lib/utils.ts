import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format currency in Indian standard format (₹XX,XX,XXX)
 */
export function formatINR(amount: number | null | undefined): string {
  if (amount === null || amount === undefined || isNaN(amount)) return '₹0';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Format standard readable Indian dates e.g. 15 Sep 2026
 */
export function formatDate(dateString: string | Date | null | undefined): string {
  if (!dateString) return '—';
  try {
    const d = typeof dateString === 'string' ? new Date(dateString) : dateString;
    return new Intl.DateTimeFormat('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(d);
  } catch {
    return String(dateString);
  }
}

/**
 * Format relative day difference (e.g. "Due in 3 days", "Overdue by 5 days")
 */
export function getRelativeDueDate(dueDateString: string): { text: string; isOverdue: boolean; days: number } {
  const target = new Date(dueDateString);
  target.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const diffTime = target.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays < 0) {
    return { text: `Overdue by ${Math.abs(diffDays)} day${Math.abs(diffDays) === 1 ? '' : 's'}`, isOverdue: true, days: diffDays };
  } else if (diffDays === 0) {
    return { text: 'Due today', isOverdue: false, days: 0 };
  } else if (diffDays === 1) {
    return { text: 'Due tomorrow', isOverdue: false, days: 1 };
  } else {
    return { text: `Due in ${diffDays} days`, isOverdue: false, days: diffDays };
  }
}

export function generateReceiptNumber(): string {
  const year = new Date().getFullYear();
  const random = Math.floor(1000 + Math.random() * 9000);
  return `RCP-${year}-${random}`;
}

export function generateAgreementNumber(): string {
  const year = new Date().getFullYear();
  const random = Math.floor(100 + Math.random() * 900);
  return `AGR-${year}-${random}`;
}

export function getStatusBadgeClass(status: string): string {
  switch (status) {
    case 'paid':
    case 'completed':
    case 'active':
    case 'occupied':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    case 'due':
    case 'in_progress':
    case 'assigned':
    case 'trialing':
      return 'bg-amber-50 text-amber-700 border-amber-200';
    case 'overdue':
    case 'past_due':
    case 'urgent':
    case 'high':
      return 'bg-rose-50 text-rose-700 border-rose-200';
    case 'partially_paid':
    case 'notice_period':
    case 'reserved':
      return 'bg-sky-50 text-sky-700 border-sky-200';
    case 'vacant':
    case 'upcoming':
    case 'new':
      return 'bg-slate-100 text-slate-700 border-slate-200';
    case 'waived':
    case 'cancelled':
    case 'archived':
      return 'bg-gray-100 text-gray-500 border-gray-200';
    default:
      return 'bg-slate-50 text-slate-600 border-slate-200';
  }
}
