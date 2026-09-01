import React from 'react';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { Payment } from '../../types/database.types';
import { formatINR, formatDate } from '../../lib/utils';
import { Printer, Share2, CheckCircle2, Download, Building2 } from 'lucide-react';
import { useToast } from '../../components/feedback/Toast';

export interface ReceiptModalProps {
  isOpen: boolean;
  payment: Payment;
  onClose: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({ isOpen, payment, onClose }) => {
  const toast = useToast();

  const handlePrint = () => {
    window.print();
  };

  const handleWhatsAppShare = () => {
    const text = `*BHADEKARU RENT RECEIPT*\n` +
      `Receipt No: ${payment.receipt_number}\n` +
      `Tenant: ${payment.tenant_name}\n` +
      `Unit: ${payment.unit_number || 'Apartment'}\n` +
      `Amount Paid: ${formatINR(payment.amount)}\n` +
      `Date: ${formatDate(payment.payment_date)}\n` +
      `Payment Mode: ${payment.payment_method.toUpperCase()}\n` +
      `Reference / UTR: ${payment.reference_number || 'N/A'}\n` +
      `Status: SUCCESSFUL (PAID)\n\n` +
      `Thank you for your timely payment!`;
    const encoded = encodeURIComponent(text);
    window.open(`https://api.whatsapp.com/send?text=${encoded}`, '_blank');
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Rent Payment Receipt" subtitle="Official tax & payment confirmation" maxWidth="lg">
      <div className="space-y-5">
        {/* Printable Receipt Card */}
        <div id="printable-receipt" className="p-6 md:p-8 bg-white rounded-2xl border border-slate-300 shadow-xs space-y-6 print:border-none print:p-0">
          {/* Header */}
          <div className="flex items-start justify-between border-b border-slate-200 pb-5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-sky-600 text-white flex items-center justify-center font-black text-2xl shadow-sm">
                भा
              </div>
              <div>
                <h2 className="text-xl font-black text-slate-900 tracking-tight">Bhadekaru</h2>
                <p className="text-xs text-slate-500 font-medium">Property & Rental Management</p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Receipt No</span>
              <p className="text-sm font-mono font-extrabold text-slate-900">{payment.receipt_number}</p>
              <p className="text-xs text-slate-500 mt-0.5">{formatDate(payment.payment_date)}</p>
            </div>
          </div>

          {/* Landlord & Tenant Info */}
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <span className="text-[10px] font-bold uppercase text-slate-400">Received From (Tenant)</span>
              <p className="text-sm font-bold text-slate-900 mt-0.5">{payment.tenant_name}</p>
              <p className="text-slate-600 mt-0.5">Unit: {payment.unit_number || 'Residential Unit'}</p>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-bold uppercase text-slate-400">Payment Status</span>
              <div className="mt-1 flex items-center justify-end gap-1.5 text-emerald-700 font-extrabold text-sm">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>PAID IN FULL</span>
              </div>
            </div>
          </div>

          {/* Payment Breakdown Table */}
          <div className="rounded-xl border border-slate-200 overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase font-bold text-[10px]">
                <tr>
                  <th className="px-4 py-2.5">Description</th>
                  <th className="px-4 py-2.5">Mode</th>
                  <th className="px-4 py-2.5">Reference / UTR</th>
                  <th className="px-4 py-2.5 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr>
                  <td className="px-4 py-3 font-semibold text-slate-900">
                    Monthly Rent & Maintenance
                    {payment.notes && <p className="text-[11px] text-slate-500 font-normal mt-0.5">{payment.notes}</p>}
                  </td>
                  <td className="px-4 py-3 uppercase font-bold text-slate-600">{payment.payment_method}</td>
                  <td className="px-4 py-3 font-mono text-slate-600">{payment.reference_number || 'Direct Payment'}</td>
                  <td className="px-4 py-3 text-right font-extrabold text-slate-900 text-sm">{formatINR(payment.amount)}</td>
                </tr>
              </tbody>
              <tfoot className="bg-slate-50 border-t border-slate-200">
                <tr>
                  <td colSpan={3} className="px-4 py-2.5 font-bold text-slate-700 uppercase text-[11px]">Total Paid</td>
                  <td className="px-4 py-2.5 text-right font-black text-emerald-700 text-base">{formatINR(payment.amount)}</td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Footer Note */}
          <div className="pt-2 text-[11px] text-slate-500 border-t border-slate-100 flex items-center justify-between">
            <p>This is a computer generated receipt. Valid for tax & rent allowance purposes.</p>
            <span className="font-bold text-slate-700">Bhadekaru SaaS</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-end gap-2.5 pt-2 border-t border-slate-100 print:hidden">
          <Button
            variant="outline"
            size="sm"
            leftIcon={<Share2 className="w-4 h-4 text-emerald-600" />}
            onClick={handleWhatsAppShare}
          >
            Share on WhatsApp
          </Button>
          <Button
            variant="primary"
            size="sm"
            leftIcon={<Printer className="w-4 h-4" />}
            onClick={handlePrint}
          >
            Print / Save PDF
          </Button>
        </div>
      </div>
    </Modal>
  );
};
