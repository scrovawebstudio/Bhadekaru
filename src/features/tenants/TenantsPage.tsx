import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { tenantService } from '../../services/tenantService';
import { Users, Plus, Search, Phone, Mail, Building2, ChevronRight, Eye } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Card } from '../../components/ui/Card';
import { EmptyState } from '../../components/ui/EmptyState';
import { AddTenantModal } from './AddTenantModal';
import { useToast } from '../../components/feedback/Toast';

export const TenantsPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [addModalOpen, setAddModalOpen] = useState(false);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const toast = useToast();

  const { data: tenants = [], isLoading } = useQuery({
    queryKey: ['tenants'],
    queryFn: () => tenantService.getTenants(),
  });

  const createTenantMutation = useMutation({
    mutationFn: (data: any) => tenantService.createTenant(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenants'] });
      toast.success('Tenant Profile Created', 'New tenant has been added to your directory.');
    },
  });

  const filteredTenants = tenants.filter((t) => {
    const matches =
      t.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.phone.includes(searchTerm) ||
      (t.email && t.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (t.current_property_name && t.current_property_name.toLowerCase().includes(searchTerm.toLowerCase()));
    return matches;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-extrabold text-slate-900 tracking-tight">
            Tenant Directory
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Profiles, emergency contacts, KYC documents, and payment histories.
          </p>
        </div>
        <Button
          variant="primary"
          leftIcon={<Plus className="w-4 h-4" />}
          onClick={() => setAddModalOpen(true)}
        >
          Add Tenant
        </Button>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search by tenant name, phone, email, or building..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-sky-500 focus:bg-white transition-colors"
          />
        </div>
      </div>

      {/* Tenants Grid */}
      {filteredTenants.length === 0 ? (
        <EmptyState
          icon={<Users className="w-7 h-7" />}
          title="No tenants found"
          description={searchTerm ? "Try searching with a different name or number." : "You haven't added any tenants yet. Click below to add your first tenant."}
          actionLabel={searchTerm ? undefined : "Add Tenant"}
          onAction={() => setAddModalOpen(true)}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTenants.map((t) => (
            <Card
              key={t.id}
              hoverable
              onClick={() => navigate(`/tenants/${t.id}`)}
              className="cursor-pointer group flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-sky-50 text-sky-600 font-extrabold text-sm flex items-center justify-center border border-sky-100 shrink-0">
                      {t.full_name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="text-sm font-extrabold text-slate-900 group-hover:text-sky-600 transition-colors">
                        {t.full_name}
                      </h3>
                      <p className="text-xs text-slate-500">{t.occupation || 'Tenant'}</p>
                    </div>
                  </div>
                  <Badge variant={t.is_active ? 'success' : 'neutral'} className="text-[10px]">
                    {t.is_active ? 'Active' : 'Past'}
                  </Badge>
                </div>

                <div className="space-y-1.5 text-xs text-slate-600 mb-4 bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <p className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{t.phone}</span>
                  </p>
                  {t.email && (
                    <p className="flex items-center gap-2 truncate">
                      <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{t.email}</span>
                    </p>
                  )}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 text-slate-700">
                  <Building2 className="w-4 h-4 text-sky-600 shrink-0" />
                  <span className="font-semibold truncate">
                    {t.current_unit_number ? `${t.current_property_name} (${t.current_unit_number})` : 'Unassigned Unit'}
                  </span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-sky-600 group-hover:translate-x-0.5 transition-all" />
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Add Tenant Modal */}
      <AddTenantModal
        isOpen={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        onSubmit={async (data) => {
          await createTenantMutation.mutateAsync(data);
        }}
      />
    </div>
  );
};
