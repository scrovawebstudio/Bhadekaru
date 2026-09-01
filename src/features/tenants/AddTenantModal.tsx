import React, { useState } from 'react';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Tenant } from '../../types/database.types';

export interface AddTenantModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
}

export const AddTenantModal: React.FC<AddTenantModalProps> = ({ isOpen, onClose, onSubmit }) => {
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [emergencyName, setEmergencyName] = useState('');
  const [emergencyPhone, setEmergencyPhone] = useState('');
  const [permanentAddress, setPermanentAddress] = useState('');
  const [occupation, setOccupation] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [occupantsCount, setOccupantsCount] = useState('1');
  const [vehicleDetails, setVehicleDetails] = useState('');
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !phone) return;

    setIsLoading(true);
    try {
      await onSubmit({
        full_name: fullName,
        phone,
        email: email || undefined,
        emergency_contact_name: emergencyName || undefined,
        emergency_contact_phone: emergencyPhone || undefined,
        permanent_address: permanentAddress || undefined,
        occupation: occupation || undefined,
        company_name: companyName || undefined,
        occupants_count: Number(occupantsCount) || 1,
        vehicle_details: vehicleDetails || undefined,
        notes: notes || undefined,
        is_active: true,
      });
      onClose();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add New Tenant" subtitle="Enter tenant profile, contact & emergency details" maxWidth="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Full Name *"
            placeholder="e.g. Rahul Sharma"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
          />
          <Input
            label="Mobile Phone *"
            placeholder="e.g. +91 98765 43210"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Email Address"
            type="email"
            placeholder="e.g. rahul.sharma@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Input
            label="No. of Occupants"
            type="number"
            value={occupantsCount}
            onChange={(e) => setOccupantsCount(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Occupation"
            placeholder="e.g. Software Engineer"
            value={occupation}
            onChange={(e) => setOccupation(e.target.value)}
          />
          <Input
            label="Company Name"
            placeholder="e.g. Infosys Ltd"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Emergency Contact Name"
            placeholder="e.g. Sunil Sharma (Father)"
            value={emergencyName}
            onChange={(e) => setEmergencyName(e.target.value)}
          />
          <Input
            label="Emergency Contact Phone"
            placeholder="e.g. +91 98111 22334"
            value={emergencyPhone}
            onChange={(e) => setEmergencyPhone(e.target.value)}
          />
        </div>

        <Input
          label="Permanent Address"
          placeholder="Native city / Permanent residential address"
          value={permanentAddress}
          onChange={(e) => setPermanentAddress(e.target.value)}
        />

        <Input
          label="Vehicle Details"
          placeholder="e.g. Honda City (MH 12 AB 1234)"
          value={vehicleDetails}
          onChange={(e) => setVehicleDetails(e.target.value)}
        />

        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
            Internal Notes
          </label>
          <textarea
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Special instructions or tenant background..."
            className="w-full rounded-xl border border-slate-200 bg-white p-3 text-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
          />
        </div>

        <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
          <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" isLoading={isLoading}>
            Save Tenant Profile
          </Button>
        </div>
      </form>
    </Modal>
  );
};
