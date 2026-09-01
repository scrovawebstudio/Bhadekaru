import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { rentService, paymentService } from '../../services/paymentService';
import { agreementService } from '../../services/agreementService';
import { reminderService } from '../../services/documentService';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Clock, CreditCard, FileText, Bell } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { formatINR, formatDate } from '../../lib/utils';

export const CalendarPage: React.FC = () => {
  const [currentMonth, setCurrentMonth] = useState(new Date(2026, 8, 1)); // September 2026

  const { data: rentCharges = [] } = useQuery({ queryKey: ['rentCharges'], queryFn: () => rentService.getRentCharges() });
  const { data: agreements = [] } = useQuery({ queryKey: ['agreements'], queryFn: () => agreementService.getAgreements() });
  const { data: reminders = [] } = useQuery({ queryKey: ['reminders'], queryFn: () => reminderService.getReminders() });

  const monthName = currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' });

  // Generate calendar days for month
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const firstDayIndex = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const calendarDays = [];
  for (let i = 0; i < firstDayIndex; i++) {
    calendarDays.push({ day: null, isCurrentMonth: false });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    calendarDays.push({ day: d, isCurrentMonth: true });
  }

  // Filter events for day
  const getEventsForDay = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const dueCharges = rentCharges.filter((c) => c.due_date === dateStr);
    const expiringAgreements = agreements.filter((a) => a.end_date === dateStr);
    const dayReminders = reminders.filter((r) => r.remind_date === dateStr);
    return { dueCharges, expiringAgreements, dayReminders };
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-extrabold text-slate-900 tracking-tight">
            Rental Management Calendar
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Unified view of monthly rent collection days, lease expiries, and scheduled tasks.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-xs">
          <button
            onClick={() => setCurrentMonth(new Date(year, month - 1, 1))}
            className="p-1 rounded-lg hover:bg-slate-100 text-slate-600"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-sm font-extrabold text-slate-800 min-w-[140px] text-center">{monthName}</span>
          <button
            onClick={() => setCurrentMonth(new Date(year, month + 1, 1))}
            className="p-1 rounded-lg hover:bg-slate-100 text-slate-600"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Calendar Grid Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 md:p-6 shadow-xs overflow-x-auto">
        <div className="grid grid-cols-7 gap-1 text-center font-bold text-xs text-slate-400 uppercase py-2 border-b border-slate-100 min-w-[600px]">
          <div>Sun</div>
          <div>Mon</div>
          <div>Tue</div>
          <div>Wed</div>
          <div>Thu</div>
          <div>Fri</div>
          <div>Sat</div>
        </div>

        <div className="grid grid-cols-7 gap-1.5 pt-2 min-w-[600px]">
          {calendarDays.map((cd, index) => {
            if (!cd.day) {
              return <div key={`empty-${index}`} className="h-24 bg-slate-50/50 rounded-xl" />;
            }

            const { dueCharges, expiringAgreements, dayReminders } = getEventsForDay(cd.day);
            const hasEvents = dueCharges.length > 0 || expiringAgreements.length > 0 || dayReminders.length > 0;
            const isToday = cd.day === 1;

            return (
              <div
                key={`day-${cd.day}`}
                className={`h-24 p-2 rounded-xl border text-left flex flex-col justify-between transition-colors overflow-hidden ${
                  isToday
                    ? 'border-sky-500 bg-sky-50/30'
                    : hasEvents
                    ? 'border-slate-200 bg-white hover:bg-slate-50'
                    : 'border-slate-100 bg-white'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-bold ${isToday ? 'text-sky-600 font-black' : 'text-slate-700'}`}>
                    {cd.day}
                  </span>
                </div>

                <div className="space-y-1 overflow-y-auto no-scrollbar">
                  {dueCharges.map((c) => (
                    <div key={c.id} className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 truncate">
                      Rent: {(c.tenant_name || 'Tenant').split(' ')[0]} ({formatINR(c.total_amount)})
                    </div>
                  ))}
                  {expiringAgreements.map((a) => (
                    <div key={a.id} className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-100 text-rose-800 truncate">
                      Expiry: {(a.tenant_name || 'Tenant').split(' ')[0]}
                    </div>
                  ))}
                  {dayReminders.map((r) => (
                    <div key={r.id} className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 truncate">
                      Task: {r.title}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
