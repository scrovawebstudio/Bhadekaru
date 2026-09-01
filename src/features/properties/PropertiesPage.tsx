import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { propertyService } from '../../services/propertyService';
import { Building2, Plus, Search, MapPin, Users, ChevronRight, Eye } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Card } from '../../components/ui/Card';
import { EmptyState } from '../../components/ui/EmptyState';
import { formatINR } from '../../lib/utils';
import { AddPropertyModal } from './AddPropertyModal';
import { useToast } from '../../components/feedback/Toast';

export const PropertiesPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [addModalOpen, setAddModalOpen] = useState(false);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const toast = useToast();

  const { data: properties = [], isLoading } = useQuery({
    queryKey: ['properties'],
    queryFn: () => propertyService.getProperties(),
  });

  const createPropertyMutation = useMutation({
    mutationFn: (data: any) => propertyService.createProperty(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['properties'] });
      queryClient.invalidateQueries({ queryKey: ['financialSummary'] });
      toast.success('Property Added', 'Your new property is ready for unit setup.');
    },
  });

  const filteredProperties = properties.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.address_line1.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'all' || p.type === typeFilter;
    return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-extrabold text-slate-900 tracking-tight">
            Properties & Real Estate Units
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Manage your buildings, commercial complexes, and rental units.
          </p>
        </div>
        <Button
          variant="primary"
          leftIcon={<Plus className="w-4 h-4" />}
          onClick={() => setAddModalOpen(true)}
        >
          Add Property
        </Button>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col sm:flex-row gap-3 bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search properties by name, city, address..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-sky-500 focus:bg-white transition-colors"
          />
        </div>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-sky-500 focus:bg-white text-slate-700"
        >
          <option value="all">All Property Types</option>
          <option value="apartment">Apartments</option>
          <option value="house">Houses / Villas</option>
          <option value="shop">Commercial Shops</option>
          <option value="office">Offices</option>
          <option value="pg">PG / Hostels</option>
        </select>
      </div>

      {/* Properties List Grid */}
      {filteredProperties.length === 0 ? (
        <EmptyState
          icon={<Building2 className="w-7 h-7" />}
          title="No properties found"
          description={searchTerm ? "Try searching with a different keyword." : "You haven't added any rental property yet. Start adding your first flat or commercial shop."}
          actionLabel={searchTerm ? undefined : "Add Property"}
          onAction={() => setAddModalOpen(true)}
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredProperties.map((prop) => {
            const units = prop.units || [];
            const occupied = units.filter((u) => u.status === 'occupied').length;
            const vacant = units.length - occupied;
            const totalRent = units.reduce((acc, u) => acc + (u.status === 'occupied' ? Number(u.monthly_rent || 0) : 0), 0);

            return (
              <Card
                key={prop.id}
                hoverable
                onClick={() => navigate(`/properties/${prop.id}`)}
                className="cursor-pointer group flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-extrabold text-slate-900 group-hover:text-sky-600 transition-colors">
                          {prop.name}
                        </h3>
                        <Badge variant="neutral" className="uppercase text-[10px]">
                          {prop.type}
                        </Badge>
                      </div>
                      <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        {prop.address_line1}, {prop.city} ({prop.pincode})
                      </p>
                    </div>
                    <div className="p-2 rounded-xl bg-slate-100 text-slate-600 group-hover:bg-sky-50 group-hover:text-sky-600 transition-colors">
                      <Eye className="w-4 h-4" />
                    </div>
                  </div>

                  {prop.notes && (
                    <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100 mb-4 line-clamp-2">
                      {prop.notes}
                    </p>
                  )}
                </div>

                <div className="pt-3 border-t border-slate-100 grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="bg-slate-50 p-2 rounded-xl">
                    <span className="text-[10px] text-slate-400 font-bold uppercase">Units</span>
                    <p className="text-sm font-extrabold text-slate-900 mt-0.5">{units.length} Units</p>
                  </div>
                  <div className="bg-emerald-50/60 p-2 rounded-xl">
                    <span className="text-[10px] text-emerald-600 font-bold uppercase">Occupied</span>
                    <p className="text-sm font-extrabold text-emerald-700 mt-0.5">{occupied} / {units.length}</p>
                  </div>
                  <div className="bg-sky-50/60 p-2 rounded-xl">
                    <span className="text-[10px] text-sky-600 font-bold uppercase">Monthly Rent</span>
                    <p className="text-sm font-extrabold text-sky-700 mt-0.5">{formatINR(totalRent)}</p>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Add Property Modal */}
      <AddPropertyModal
        isOpen={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        onSubmit={async (data) => {
          await createPropertyMutation.mutateAsync(data);
        }}
      />
    </div>
  );
};
