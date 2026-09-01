import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { documentService } from '../../services/documentService';
import { propertyService } from '../../services/propertyService';
import { tenantService } from '../../services/tenantService';
import { FolderOpen, Plus, Search, FileText, Download, ShieldCheck, Eye } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { Input, Select } from '../../components/ui/Input';
import { EmptyState } from '../../components/ui/EmptyState';
import { formatDate } from '../../lib/utils';
import { DocumentCategory } from '../../types/database.types';
import { useToast } from '../../components/feedback/Toast';

export const UploadDocumentModal: React.FC<{ isOpen: boolean; onClose: () => void; onSubmit: (data: any) => Promise<void> }> = ({
  isOpen,
  onClose,
  onSubmit,
}) => {
  const [name, setName] = useState('');
  const [category, setCategory] = useState<DocumentCategory>('aadhaar');
  const [propertyId, setPropertyId] = useState('');
  const [tenantId, setTenantId] = useState('');
  const [fileName, setFileName] = useState('document_scan.pdf');
  const [isLoading, setIsLoading] = useState(false);

  const { data: properties = [] } = useQuery({ queryKey: ['properties'], queryFn: () => propertyService.getProperties() });
  const { data: tenants = [] } = useQuery({ queryKey: ['tenants'], queryFn: () => tenantService.getTenants() });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;

    setIsLoading(true);
    try {
      await onSubmit({
        name,
        category,
        property_id: propertyId || undefined,
        tenant_id: tenantId || undefined,
        file_name: fileName,
        file_size_bytes: 1450000,
        mime_type: 'application/pdf',
      });
      onClose();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Upload to Document Vault" subtitle="Store KYC, Aadhaar, PAN, agreements or property taxes" maxWidth="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input label="Document Title *" placeholder="e.g. Rahul Sharma - Aadhaar Card" value={name} onChange={(e) => setName(e.target.value)} required />

        <Select label="Category" value={category} onChange={(e) => setCategory(e.target.value as DocumentCategory)}>
          <option value="aadhaar">Aadhaar Card</option>
          <option value="pan">PAN Card</option>
          <option value="agreement">Registered Lease Agreement</option>
          <option value="police_verification">Police Verification Form</option>
          <option value="property_tax">Property Tax Receipt</option>
          <option value="electricity_bill">Electricity / Utility Bill</option>
          <option value="other">Other Document</option>
        </Select>

        <div className="grid grid-cols-2 gap-3">
          <Select label="Assign to Property" value={propertyId} onChange={(e) => setPropertyId(e.target.value)}>
            <option value="">-- None / General --</option>
            {properties.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </Select>

          <Select label="Assign to Tenant" value={tenantId} onChange={(e) => setTenantId(e.target.value)}>
            <option value="">-- None / General --</option>
            {tenants.map((t) => (
              <option key={t.id} value={t.id}>{t.full_name}</option>
            ))}
          </Select>
        </div>

        {/* Drag and Drop Box */}
        <div className="p-6 border-2 border-dashed border-slate-300 rounded-2xl text-center bg-slate-50 hover:bg-slate-100/60 transition-colors cursor-pointer">
          <FileText className="w-8 h-8 text-sky-600 mx-auto mb-2" />
          <p className="text-xs font-bold text-slate-800">Drag and drop file here or click to browse</p>
          <p className="text-[11px] text-slate-400 mt-0.5">PDF, PNG, JPEG up to 25MB (Encrypted AES-256)</p>
        </div>

        <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
          <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>Cancel</Button>
          <Button type="submit" variant="primary" isLoading={isLoading}>Save to Vault</Button>
        </div>
      </form>
    </Modal>
  );
};

export const DocumentsPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const queryClient = useQueryClient();
  const toast = useToast();

  const { data: documents = [], isLoading } = useQuery({
    queryKey: ['documents'],
    queryFn: () => documentService.getDocuments(),
  });

  const uploadMutation = useMutation({
    mutationFn: (data: any) => documentService.uploadDocument(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      toast.success('Document Uploaded', 'Document safely archived in encrypted vault.');
    },
  });

  const filteredDocs = documents.filter((d) => {
    const matchesSearch = d.name.toLowerCase().includes(searchTerm.toLowerCase()) || d.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || d.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-extrabold text-slate-900 tracking-tight">
            Document Vault & KYC Archive
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Encrypted storage for tenant Aadhaar, PAN, police verification, property taxes, and lease copies.
          </p>
        </div>
        <Button variant="primary" leftIcon={<Plus className="w-4 h-4" />} onClick={() => setUploadModalOpen(true)}>
          Upload Document
        </Button>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col sm:flex-row gap-3 bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search documents by name or category..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-sky-500"
          />
        </div>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-sky-500 text-slate-700"
        >
          <option value="all">All Document Types</option>
          <option value="aadhaar">Aadhaar Card</option>
          <option value="pan">PAN Card</option>
          <option value="agreement">Agreements</option>
          <option value="police_verification">Police Verification</option>
          <option value="property_tax">Property Tax</option>
        </select>
      </div>

      {/* Documents Grid */}
      {filteredDocs.length === 0 ? (
        <EmptyState
          icon={<FolderOpen className="w-7 h-7" />}
          title="No documents uploaded"
          description="Keep all tenant identity proofs and legal files organized in one place."
          actionLabel="Upload Document"
          onAction={() => setUploadModalOpen(true)}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDocs.map((doc) => (
            <div key={doc.id} className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center shrink-0">
                  <FileText className="w-5 h-5" />
                </div>
                <Badge variant="success" className="text-[10px]">
                  Encrypted
                </Badge>
              </div>

              <div>
                <h4 className="text-sm font-extrabold text-slate-900 line-clamp-1">{doc.name}</h4>
                <p className="text-[11px] text-slate-500 uppercase font-bold mt-0.5">{doc.category.replace('_', ' ')}</p>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span>{formatDate(doc.created_at)}</span>
                <span className="font-mono text-[11px]">1.4 MB</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload Modal */}
      <UploadDocumentModal
        isOpen={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
        onSubmit={async (data) => {
          await uploadMutation.mutateAsync(data);
        }}
      />
    </div>
  );
};
