import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { reportService } from '../../services/reportService';
import { propertyService } from '../../services/propertyService';
import { paymentService } from '../../services/paymentService';
import { expenseService } from '../../services/maintenanceService';
import {
  BarChart3,
  Download,
  TrendingUp,
  TrendingDown,
  Building2,
  PieChart,
  Calendar,
  FileSpreadsheet,
  CheckCircle2
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Card } from '../../components/ui/Card';
import { formatINR } from '../../lib/utils';
import { useToast } from '../../components/feedback/Toast';

export const ReportsPage: React.FC = () => {
  const [selectedYear, setSelectedYear] = useState('2026');
  const toast = useToast();

  const { data: summary } = useQuery({ queryKey: ['financialSummary'], queryFn: () => reportService.getFinancialSummary() });
  const { data: properties = [] } = useQuery({ queryKey: ['properties'], queryFn: () => propertyService.getProperties() });
  const { data: payments = [] } = useQuery({ queryKey: ['payments'], queryFn: () => paymentService.getPayments() });
  const { data: expenses = [] } = useQuery({ queryKey: ['expenses'], queryFn: () => expenseService.getExpenses() });

  const handleExportCSV = () => {
    // Generate simple CSV of payments & expenses
    let csvContent = 'data:text/csv;charset=utf-8,';
    csvContent += 'Transaction Type,Date,Entity/Tenant,Category/Unit,Amount (INR)\n';

    payments.forEach((p) => {
      csvContent += `Rent Income,${p.payment_date},"${p.tenant_name}","${p.unit_number || 'Unit'}",${p.amount}\n`;
    });

    expenses.forEach((e) => {
      csvContent += `Expense,${e.expense_date},"${e.vendor_name || 'Vendor'}","${e.category}",-${e.amount}\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Bhadekaru_Financial_Report_${selectedYear}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success('CSV Downloaded', 'Financial report exported successfully.');
  };

  // Monthly breakdown mockup from real data
  const monthlyData = [
    { month: 'Apr 26', income: 108000, expense: 8500 },
    { month: 'May 26', income: 112000, expense: 6200 },
    { month: 'Jun 26', income: 110000, expense: 12000 },
    { month: 'Jul 26', income: 115000, expense: 4500 },
    { month: 'Aug 26', income: 118000, expense: 9100 },
    { month: 'Sep 26', income: summary?.collectedRent || 44500, expense: summary?.currentMonthExpenses || 3500 },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-extrabold text-slate-900 tracking-tight">
            Financial Reports & Analytics
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Rent collection yields, expense breakdowns, property profitability & tax reports.
          </p>
        </div>
        <Button
          variant="primary"
          leftIcon={<Download className="w-4 h-4" />}
          onClick={handleExportCSV}
        >
          Export CSV / Excel
        </Button>
      </div>

      {/* KPI Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-emerald-50/60 border-emerald-100">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-emerald-800">Total Income (YTD)</span>
            <TrendingUp className="w-5 h-5 text-emerald-600" />
          </div>
          <p className="text-2xl font-black text-emerald-950 mt-1">{formatINR(607500)}</p>
          <span className="text-[11px] text-emerald-700 font-medium">+14% vs last FY</span>
        </Card>

        <Card className="bg-rose-50/60 border-rose-100">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-rose-800">Total Expenses (YTD)</span>
            <TrendingDown className="w-5 h-5 text-rose-600" />
          </div>
          <p className="text-2xl font-black text-rose-950 mt-1">{formatINR(43800)}</p>
          <span className="text-[11px] text-rose-700 font-medium">Repairs, Taxes & Society</span>
        </Card>

        <Card className="bg-sky-50/60 border-sky-100">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-sky-800">Net Profit (YTD)</span>
            <BarChart3 className="w-5 h-5 text-sky-600" />
          </div>
          <p className="text-2xl font-black text-sky-950 mt-1">{formatINR(563700)}</p>
          <span className="text-[11px] text-sky-700 font-medium">92.8% Net Operational Yield</span>
        </Card>
      </div>

      {/* Monthly Bar Visualizer */}
      <Card>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Monthly Cashflow (FY 2026-27)</h3>
            <p className="text-xs text-slate-500">Collected Rental Revenue vs Maintenance Outflows</p>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1.5 font-bold text-slate-700">
              <span className="w-3 h-3 rounded-sm bg-sky-600 inline-block" /> Rental Income
            </span>
            <span className="flex items-center gap-1.5 font-bold text-slate-700">
              <span className="w-3 h-3 rounded-sm bg-rose-400 inline-block" /> Expense
            </span>
          </div>
        </div>

        <div className="grid grid-cols-6 gap-2 sm:gap-4 items-end h-56 pt-6 border-b border-slate-100">
          {monthlyData.map((d) => {
            const incomeHeight = Math.round((d.income / 130000) * 100);
            const expenseHeight = Math.max(8, Math.round((d.expense / 130000) * 100));

            return (
              <div key={d.month} className="flex flex-col items-center gap-2 h-full justify-end">
                <div className="w-full max-w-[48px] flex items-end justify-center gap-1 h-full">
                  <div
                    className="w-1/2 bg-sky-600 rounded-t-md hover:bg-sky-500 transition-all relative group"
                    style={{ height: `${incomeHeight}%` }}
                  >
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] py-1 px-1.5 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                      {formatINR(d.income)}
                    </div>
                  </div>
                  <div
                    className="w-1/2 bg-rose-400 rounded-t-md hover:bg-rose-300 transition-all relative group"
                    style={{ height: `${expenseHeight}%` }}
                  >
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] py-1 px-1.5 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                      {formatINR(d.expense)}
                    </div>
                  </div>
                </div>
                <span className="text-[11px] font-bold text-slate-600">{d.month}</span>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Property Profitability Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs">
        <div className="p-4 border-b border-slate-100">
          <h3 className="text-sm font-bold text-slate-900">Property Profitability Breakdown</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-bold text-[10px]">
              <tr>
                <th className="px-4 py-3">Property</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3 text-center">Occupancy</th>
                <th className="px-4 py-3 text-right">Gross Rent</th>
                <th className="px-4 py-3 text-right">Maintenance Cost</th>
                <th className="px-4 py-3 text-right">Net Margin</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {properties.map((prop) => {
                const units = prop.units || [];
                const occupied = units.filter((u) => u.status === 'occupied').length;
                const grossRent = units.reduce((acc, u) => acc + (u.status === 'occupied' ? Number(u.monthly_rent) : 0), 0);
                const propExp = expenses.filter((e) => e.property_id === prop.id).reduce((acc, e) => acc + Number(e.amount), 0);
                const net = grossRent - propExp;

                return (
                  <tr key={prop.id} className="hover:bg-slate-50/70">
                    <td className="px-4 py-3 font-bold text-slate-900">{prop.name}</td>
                    <td className="px-4 py-3 uppercase font-bold text-slate-500 text-[10px]">{prop.type}</td>
                    <td className="px-4 py-3 text-center font-bold">
                      {occupied} / {units.length} units
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-emerald-700">{formatINR(grossRent)}/mo</td>
                    <td className="px-4 py-3 text-right font-bold text-rose-600">{formatINR(propExp)}</td>
                    <td className="px-4 py-3 text-right font-black text-sky-800">{formatINR(net)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
