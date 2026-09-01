import React, { useState } from 'react';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { Input, Select } from '../../components/ui/Input';
import { Property, PropertyType, UnitFurnishing, UnitStatus } from '../../types/database.types';

export interface AddPropertyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
}

export const AddPropertyModal: React.FC<AddPropertyModalProps> = ({ isOpen, onClose, onSubmit }) => {
  const [name, setName] = useState('');
  const [type, setType] = useState<PropertyType>('apartment');
  const [addressLine1, setAddressLine1] = useState('');
  const [addressLine2, setAddressLine2] = useState('');
  const [city, setCity] = useState('Pune');
  const [state, setState] = useState('Maharashtra');
  const [pincode, setPincode] = useState('411045');
  const [purchasePrice, setPurchasePrice] = useState('');
  const [currentValuation, setCurrentValuation] = useState('');
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !addressLine1 || !city) return;

    setIsLoading(true);
    try {
      await onSubmit({
        name,
        type,
        status: 'active',
        address_line1: addressLine1,
        address_line2: addressLine2 || undefined,
        city,
        state,
        pincode,
        country: 'IN',
        purchase_price: purchasePrice ? Number(purchasePrice) : undefined,
        current_valuation: currentValuation ? Number(currentValuation) : undefined,
        notes: notes || undefined,
      });
      onClose();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add New Property" subtitle="Enter property details and location" maxWidth="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Property Name *"
          placeholder="e.g. Shree Residency Apartments"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />

        <div className="grid grid-cols-2 gap-3">
          <Select label="Property Type" value={type} onChange={(e) => setType(e.target.value as PropertyType)}>
            <option value="apartment">Apartment</option>
            <option value="house">House / Villa</option>
            <option value="shop">Commercial Shop</option>
            <option value="office">Office Building</option>
            <option value="pg">Paying Guest / Hostel</option>
            <option value="room">Single Room</option>
            <option value="warehouse">Warehouse</option>
          </Select>

          <Input
            label="City *"
            placeholder="e.g. Pune"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            required
          />
        </div>

        <Input
          label="Address Line 1 *"
          placeholder="Building name, Street, Landmark"
          value={addressLine1}
          onChange={(e) => setAddressLine1(e.target.value)}
          required
        />

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="State"
            placeholder="e.g. Maharashtra"
            value={state}
            onChange={(e) => setState(e.target.value)}
          />
          <Input
            label="PIN Code"
            placeholder="e.g. 411045"
            value={pincode}
            onChange={(e) => setPincode(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Purchase Price (₹)"
            type="number"
            placeholder="e.g. 18500000"
            value={purchasePrice}
            onChange={(e) => setPurchasePrice(e.target.value)}
          />
          <Input
            label="Current Valuation (₹)"
            type="number"
            placeholder="e.g. 22000000"
            value={currentValuation}
            onChange={(e) => setCurrentValuation(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
            Internal Notes
          </label>
          <textarea
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Any specific instructions, parking rules, or amenities..."
            className="w-full rounded-xl border border-slate-200 bg-white p-3 text-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
          />
        </div>

        <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
          <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" isLoading={isLoading}>
            Save Property
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export interface AddUnitModalProps {
  isOpen: boolean;
  propertyId: string;
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
}

export const AddUnitModal: React.FC<AddUnitModalProps> = ({ isOpen, propertyId, onClose, onSubmit }) => {
  const [unitNumber, setUnitNumber] = useState('');
  const [floorNumber, setFloorNumber] = useState('1');
  const [areaSqft, setAreaSqft] = useState('');
  const [bedrooms, setBedrooms] = useState('2');
  const [bathrooms, setBathrooms] = useState('2');
  const [furnishing, setFurnishing] = useState<UnitFurnishing>('semi_furnished');
  const [monthlyRent, setMonthlyRent] = useState('');
  const [securityDeposit, setSecurityDeposit] = useState('');
  const [maintenanceCharge, setMaintenanceCharge] = useState('');
  const [parkingIncluded, setParkingIncluded] = useState(true);
  const [status, setStatus] = useState<UnitStatus>('vacant');
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!unitNumber || !monthlyRent) return;

    setIsLoading(true);
    try {
      await onSubmit({
        property_id: propertyId,
        unit_number: unitNumber,
        floor_number: floorNumber ? Number(floorNumber) : undefined,
        area_sqft: areaSqft ? Number(areaSqft) : undefined,
        bedrooms: bedrooms ? Number(bedrooms) : undefined,
        bathrooms: bathrooms ? Number(bathrooms) : undefined,
        furnishing,
        monthly_rent: Number(monthlyRent),
        security_deposit: securityDeposit ? Number(securityDeposit) : Number(monthlyRent) * 3,
        maintenance_charge: maintenanceCharge ? Number(maintenanceCharge) : 0,
        parking_included: parkingIncluded,
        status,
        notes: notes || undefined,
      });
      onClose();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add Rental Unit" subtitle="Configure unit number, rent, and amenities" maxWidth="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Unit / Flat Number *"
            placeholder="e.g. Flat A-203"
            value={unitNumber}
            onChange={(e) => setUnitNumber(e.target.value)}
            required
          />
          <Input
            label="Floor Number"
            type="number"
            placeholder="e.g. 2"
            value={floorNumber}
            onChange={(e) => setFloorNumber(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-3 gap-3">
          <Input
            label="Bedrooms (BHK)"
            type="number"
            step="0.5"
            value={bedrooms}
            onChange={(e) => setBedrooms(e.target.value)}
          />
          <Input
            label="Bathrooms"
            type="number"
            value={bathrooms}
            onChange={(e) => setBathrooms(e.target.value)}
          />
          <Input
            label="Area (Sq. Ft)"
            type="number"
            placeholder="e.g. 950"
            value={areaSqft}
            onChange={(e) => setAreaSqft(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Select label="Furnishing" value={furnishing} onChange={(e) => setFurnishing(e.target.value as UnitFurnishing)}>
            <option value="unfurnished">Unfurnished</option>
            <option value="semi_furnished">Semi-Furnished</option>
            <option value="fully_furnished">Fully-Furnished</option>
          </Select>

          <Select label="Initial Status" value={status} onChange={(e) => setStatus(e.target.value as UnitStatus)}>
            <option value="vacant">Vacant (Available)</option>
            <option value="occupied">Occupied</option>
            <option value="reserved">Reserved</option>
            <option value="maintenance">Under Maintenance</option>
          </Select>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <Input
            label="Monthly Rent (₹) *"
            type="number"
            placeholder="e.g. 20000"
            value={monthlyRent}
            onChange={(e) => setMonthlyRent(e.target.value)}
            required
          />
          <Input
            label="Security Deposit (₹)"
            type="number"
            placeholder="e.g. 60000"
            value={securityDeposit}
            onChange={(e) => setSecurityDeposit(e.target.value)}
          />
          <Input
            label="Maintenance (₹)"
            type="number"
            placeholder="e.g. 1500"
            value={maintenanceCharge}
            onChange={(e) => setMaintenanceCharge(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-2 pt-1">
          <input
            type="checkbox"
            id="parking"
            checked={parkingIncluded}
            onChange={(e) => setParkingIncluded(e.target.checked)}
            className="w-4 h-4 rounded text-sky-600 focus:ring-sky-500"
          />
          <label htmlFor="parking" className="text-xs font-semibold text-slate-700">
            Dedicated Parking Space Included
          </label>
        </div>

        <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
          <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" isLoading={isLoading}>
            Add Unit
          </Button>
        </div>
      </form>
    </Modal>
  );
};
