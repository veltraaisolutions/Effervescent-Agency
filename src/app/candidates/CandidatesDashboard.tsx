'use client';

import { useState, useTransition } from 'react';
import {
  X,
  CheckCircle2,
  XCircle,
  Eye,
  MapPin,
  Phone,
  Mail,
  Calendar,
  Car,
  GraduationCap,
  Briefcase,
  ShieldCheck,
  ShieldAlert,
  Clock,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { Candidate } from './types';
import { approveCandidate, rejectCandidate } from './actions';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
}

function StatusBadge({ status }: { status: Candidate['status'] }) {
  const map = {
    pending: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/25',
    approved: 'bg-green-500/15 text-green-400 border-green-500/25',
    rejected: 'bg-red-500/15 text-red-400 border-red-500/25',
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border capitalize ${map[status]}`}>
      {status}
    </span>
  );
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  if (!value && value !== false && value !== 0) return null;
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">{label}</span>
      <span className="text-sm text-gray-200">{value}</span>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <h4 className="text-xs font-bold text-pink-400 uppercase tracking-widest border-b border-[#1f1f1f] pb-2">
        {title}
      </h4>
      <div className="grid grid-cols-2 gap-x-6 gap-y-3">
        {children}
      </div>
    </div>
  );
}

// ─── Candidate Detail Modal ────────────────────────────────────────────────────

function CandidateModal({
  candidate,
  onClose,
  onStatusChange,
}: {
  candidate: Candidate;
  onClose: () => void;
  onStatusChange: (id: string, status: 'approved' | 'rejected') => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [actionError, setActionError] = useState('');
  const [activeAction, setActiveAction] = useState<'approve' | 'reject' | null>(null);

  function handleApprove() {
    setActionError('');
    setActiveAction('approve');
    startTransition(async () => {
      const result = await approveCandidate(candidate);
      if (result.error) {
        setActionError(result.error);
      } else {
        onStatusChange(candidate.id, 'approved');
      }
      setActiveAction(null);
    });
  }

  function handleReject() {
    setActionError('');
    setActiveAction('reject');
    startTransition(async () => {
      const result = await rejectCandidate(candidate.id);
      if (result.error) {
        setActionError(result.error);
      } else {
        onStatusChange(candidate.id, 'rejected');
      }
      setActiveAction(null);
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 sm:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="relative bg-[#111111] border border-[#1f1f1f] rounded-3xl w-full max-w-2xl my-4 shadow-2xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-pink-600 to-rose-500 px-6 py-5 rounded-t-3xl flex items-start justify-between">
          <div>
            <p className="text-xs font-semibold text-pink-100/70 uppercase tracking-widest mb-1">
              Candidate Profile
            </p>
            <h2 className="text-xl font-bold text-white">{candidate.full_name}</h2>
            <div className="flex items-center gap-3 mt-2">
              <StatusBadge status={candidate.status} />
              <span className="text-xs text-pink-100/60">
                Applied {formatDate(candidate.created_at)}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/60 hover:text-white transition-colors p-1 mt-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-6 space-y-7 max-h-[70vh] overflow-y-auto">

          {/* Action Buttons */}
          {candidate.status === 'pending' && (
            <div className="flex gap-3">
              <button
                onClick={handleApprove}
                disabled={isPending}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold
                  bg-green-500/15 text-green-400 border border-green-500/25
                  hover:bg-green-500/25 hover:border-green-500/40
                  disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {isPending && activeAction === 'approve' ? (
                  <div className="w-4 h-4 border-2 border-green-400/30 border-t-green-400 rounded-full animate-spin" />
                ) : (
                  <CheckCircle2 className="w-4 h-4" />
                )}
                Approve
              </button>
              <button
                onClick={handleReject}
                disabled={isPending}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold
                  bg-red-500/15 text-red-400 border border-red-500/25
                  hover:bg-red-500/25 hover:border-red-500/40
                  disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {isPending && activeAction === 'reject' ? (
                  <div className="w-4 h-4 border-2 border-red-400/30 border-t-red-400 rounded-full animate-spin" />
                ) : (
                  <XCircle className="w-4 h-4" />
                )}
                Reject
              </button>
            </div>
          )}

          {actionError && (
            <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2">
              {actionError}
            </p>
          )}

          {/* Personal Info */}
          <Section title="Personal Information">
            <InfoRow label="Email" value={candidate.email} />
            <InfoRow label="Phone" value={candidate.phone} />
            <InfoRow label="Instagram" value={candidate.instagram} />
            <InfoRow label="Date of Birth" value={candidate.available_from ? '' : ''} />
          </Section>

          {/* Location */}
          <Section title="Location & Availability">
            <InfoRow label="Primary Location" value={candidate.primary_location} />
            <InfoRow label="Second Choice" value={candidate.second_location} />
            <InfoRow label="Manual Location" value={candidate.manual_location} />
            <InfoRow label="Is Student" value={candidate.is_student ? 'Yes' : 'No'} />
            {candidate.is_student && <InfoRow label="Home City" value={candidate.home_city} />}
            <InfoRow label="Drives" value={candidate.does_drive ? 'Yes' : 'No'} />
            <InfoRow label="Interested In" value={candidate.role_interest} />
          </Section>

          {/* Photos */}
          {candidate.photo_urls && candidate.photo_urls.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-pink-400 uppercase tracking-widest border-b border-[#1f1f1f] pb-2">
                Photos ({candidate.photo_urls.length})
              </h4>
              <div className="grid grid-cols-3 gap-2">
                {candidate.photo_urls.map((url, i) => (
                  <a
                    key={i}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="aspect-square rounded-xl overflow-hidden bg-[#1a1a1a] block hover:opacity-90 transition-opacity"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={url} alt={`Photo ${i + 1}`} className="w-full h-full object-cover" />
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Passport / ID */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-pink-400 uppercase tracking-widest border-b border-[#1f1f1f] pb-2">
              Identity & Right to Work
            </h4>
            <div className="grid grid-cols-2 gap-x-6 gap-y-3">
              <InfoRow
                label="Passport Check"
                value={
                  candidate.passport_valid === null
                    ? <span className="text-gray-500">Not checked</span>
                    : candidate.passport_valid
                    ? <span className="flex items-center gap-1 text-green-400"><ShieldCheck className="w-3.5 h-3.5" /> Valid</span>
                    : <span className="flex items-center gap-1 text-red-400"><ShieldAlert className="w-3.5 h-3.5" /> Invalid</span>
                }
              />
              <InfoRow
                label="UK Passport"
                value={
                  candidate.is_uk_passport === null
                    ? <span className="text-gray-500">Unknown</span>
                    : candidate.is_uk_passport ? 'Yes' : 'No'
                }
              />
              <InfoRow label="Non-UK Passport" value={candidate.has_non_uk_passport ? 'Yes' : 'No'} />
              <InfoRow label="Share Code" value={candidate.share_code} />
            </div>
            {candidate.passport_url && (
              <a
                href={candidate.passport_url}
                target="_blank"
                rel="noopener noreferrer"
                className="block mt-2 rounded-xl overflow-hidden bg-[#1a1a1a] border border-[#2a2a2a] hover:border-pink-500/40 transition-colors"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={candidate.passport_url}
                  alt="Passport"
                  className="w-full max-h-48 object-contain p-2"
                />
                <p className="text-center text-xs text-gray-500 pb-2">Click to open full size</p>
              </a>
            )}
          </div>

          {/* Experience */}
          <Section title="Experience & Motivation">
            <InfoRow
              label="Prior Shot-Seller Experience"
              value={candidate.has_prior_experience ? 'Yes' : 'No'}
            />
            <InfoRow label="Previous Company" value={candidate.previous_company} />
            <InfoRow
              label="Years Experience"
              value={candidate.years_experience !== null ? String(candidate.years_experience) : undefined}
            />
            <InfoRow label="Available From" value={candidate.available_from ? formatDate(candidate.available_from) : undefined} />
          </Section>

          {/* Long-form answers */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-pink-400 uppercase tracking-widest border-b border-[#1f1f1f] pb-2">
              Written Answers
            </h4>
            {candidate.understand_role && (
              <div>
                <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1">
                  Understanding of the role
                </p>
                <p className="text-sm text-gray-300 leading-relaxed bg-[#141414] rounded-xl px-4 py-3 border border-[#1f1f1f]">
                  {candidate.understand_role}
                </p>
              </div>
            )}
            {candidate.why_good_fit && (
              <div>
                <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1">
                  Why a good fit
                </p>
                <p className="text-sm text-gray-300 leading-relaxed bg-[#141414] rounded-xl px-4 py-3 border border-[#1f1f1f]">
                  {candidate.why_good_fit}
                </p>
              </div>
            )}
            {candidate.sales_experience && (
              <div>
                <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1">
                  Sales & customer service experience
                </p>
                <p className="text-sm text-gray-300 leading-relaxed bg-[#141414] rounded-xl px-4 py-3 border border-[#1f1f1f]">
                  {candidate.sales_experience}
                </p>
              </div>
            )}
          </div>

          {/* Declarations */}
          <Section title="Declarations">
            <InfoRow label="Accepts self-employed terms" value={candidate.self_employed ? 'Yes ✓' : 'No'} />
            <InfoRow label="Accepts weekend/night work" value={candidate.weekend_work ? 'Yes ✓' : 'No'} />
            <InfoRow label="How they heard about us" value={candidate.heard_about} />
            <InfoRow
              label="WhatsApp Invite Sent"
              value={
                candidate.wa_sent_at
                  ? formatDate(candidate.wa_sent_at)
                  : <span className="text-gray-600">Not sent</span>
              }
            />
          </Section>
        </div>
      </div>
    </div>
  );
}

// ─── Row Actions (inline Approve/Reject in table) ─────────────────────────────

function RowActions({
  candidate,
  onStatusChange,
}: {
  candidate: Candidate;
  onStatusChange: (id: string, status: 'approved' | 'rejected') => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [activeAction, setActiveAction] = useState<'approve' | 'reject' | null>(null);

  if (candidate.status !== 'pending') return null;

  function handleApprove(e: React.MouseEvent) {
    e.stopPropagation();
    setActiveAction('approve');
    startTransition(async () => {
      const result = await approveCandidate(candidate);
      if (!result.error) onStatusChange(candidate.id, 'approved');
      setActiveAction(null);
    });
  }

  function handleReject(e: React.MouseEvent) {
    e.stopPropagation();
    setActiveAction('reject');
    startTransition(async () => {
      const result = await rejectCandidate(candidate.id);
      if (!result.error) onStatusChange(candidate.id, 'rejected');
      setActiveAction(null);
    });
  }

  return (
    <div className="flex items-center gap-1.5">
      <button
        onClick={handleApprove}
        disabled={isPending}
        title="Approve"
        className="p-1.5 rounded-lg bg-green-500/10 text-green-400 hover:bg-green-500/20 disabled:opacity-50 transition-colors"
      >
        {isPending && activeAction === 'approve'
          ? <div className="w-3.5 h-3.5 border-2 border-green-400/30 border-t-green-400 rounded-full animate-spin" />
          : <CheckCircle2 className="w-3.5 h-3.5" />
        }
      </button>
      <button
        onClick={handleReject}
        disabled={isPending}
        title="Reject"
        className="p-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 disabled:opacity-50 transition-colors"
      >
        {isPending && activeAction === 'reject'
          ? <div className="w-3.5 h-3.5 border-2 border-red-400/30 border-t-red-400 rounded-full animate-spin" />
          : <XCircle className="w-3.5 h-3.5" />
        }
      </button>
    </div>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────

type SortKey = 'created_at' | 'full_name' | 'status';

export function CandidatesDashboard({ initialCandidates }: { initialCandidates: Candidate[] }) {
  const [candidates, setCandidates] = useState<Candidate[]>(initialCandidates);
  const [selected, setSelected] = useState<Candidate | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | Candidate['status'] | 'invite_sent'>('all');
  const [sortKey, setSortKey] = useState<SortKey>('created_at');
  const [sortAsc, setSortAsc] = useState(false);

  function handleStatusChange(id: string, status: 'approved' | 'rejected') {
    setCandidates((prev) =>
      prev.map((c) => (c.id === id ? { ...c, status } : c))
    );
    if (selected?.id === id) {
      setSelected((prev) => prev ? { ...prev, status } : null);
    }
  }

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortAsc((v) => !v);
    else { setSortKey(key); setSortAsc(true); }
  }

  const filtered = candidates
    .filter((c) => {
      const q = search.toLowerCase();
      if (statusFilter === 'invite_sent') {
        if (!c.wa_sent_at) return false;
      } else if (statusFilter !== 'all' && c.status !== statusFilter) return false;
      if (!q) return true;
      return (
        c.full_name.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        c.primary_location.toLowerCase().includes(q) ||
        (c.phone && c.phone.includes(q))
      );
    })
    .sort((a, b) => {
      let av: string = '';
      let bv: string = '';
      if (sortKey === 'created_at') { av = a.created_at; bv = b.created_at; }
      if (sortKey === 'full_name') { av = a.full_name; bv = b.full_name; }
      if (sortKey === 'status') { av = a.status; bv = b.status; }
      return sortAsc ? av.localeCompare(bv) : bv.localeCompare(av);
    });

  const counts = {
    total: candidates.length,
    pending: candidates.filter((c) => c.status === 'pending').length,
    inviteSent: candidates.filter((c) => c.wa_sent_at !== null).length,
    approved: candidates.filter((c) => c.status === 'approved').length,
    rejected: candidates.filter((c) => c.status === 'rejected').length,
  };

  function SortIcon({ k }: { k: SortKey }) {
    if (sortKey !== k) return <ChevronDown className="w-3 h-3 text-gray-600" />;
    return sortAsc
      ? <ChevronUp className="w-3 h-3 text-pink-400" />
      : <ChevronDown className="w-3 h-3 text-pink-400" />;
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* Header */}
      <header className="bg-[#0d0d0d]/95 backdrop-blur-sm border-b border-[#1a1a1a] sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div>
            <p className="text-lg font-bold tracking-tight leading-none">
              <span className="text-pink-400">Effervescent</span>
              <span className="text-white"> Agency</span>
            </p>
            <p className="text-xs text-gray-600 mt-0.5">Candidates Dashboard</p>
          </div>
          <a
            href="/apply"
            className="text-xs text-gray-500 hover:text-pink-400 transition-colors"
          >
            → Apply Form
          </a>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {[
            { label: 'Total', value: counts.total, icon: Briefcase, color: 'text-pink-400', bg: 'bg-pink-500/10 border-pink-500/20' },
            { label: 'Pending', value: counts.pending, icon: Clock, color: 'text-yellow-400', bg: 'bg-yellow-500/10 border-yellow-500/20' },
            { label: 'Invite Sent', value: counts.inviteSent, icon: Mail, color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20' },
            { label: 'Approved', value: counts.approved, icon: CheckCircle2, color: 'text-green-400', bg: 'bg-green-500/10 border-green-500/20' },
            { label: 'Rejected', value: counts.rejected, icon: XCircle, color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20' },
          ].map(({ label, value, icon: Icon, color, bg }) => (
            <div key={label} className={`rounded-2xl border p-4 flex items-center gap-3 ${bg}`}>
              <Icon className={`w-5 h-5 flex-shrink-0 ${color}`} />
              <div>
                <p className={`text-2xl font-bold leading-none ${color}`}>{value}</p>
                <p className="text-xs text-gray-500 mt-0.5">{label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Search & Filter */}
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email, phone, location…"
            className="flex-1 px-4 py-2.5 bg-[#111111] border border-[#1f1f1f] rounded-xl text-sm text-white
              placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
          />
          <div className="flex gap-2">
            {([
              { value: 'all', label: 'All' },
              { value: 'pending', label: 'Pending' },
              { value: 'invite_sent', label: 'Invite Sent' },
              { value: 'approved', label: 'Approved' },
              { value: 'rejected', label: 'Rejected' },
            ] as const).map(({ value, label }) => (
              <button
                key={value}
                onClick={() => setStatusFilter(value)}
                className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${
                  statusFilter === value
                    ? 'bg-pink-500 text-white border-pink-500'
                    : 'bg-[#111111] text-gray-400 border-[#1f1f1f] hover:border-pink-500/50 hover:text-pink-400'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="bg-[#111111] border border-[#1f1f1f] rounded-2xl overflow-hidden">
          {filtered.length === 0 ? (
            <div className="py-16 text-center text-gray-600">
              <Briefcase className="w-8 h-8 mx-auto mb-3 opacity-30" />
              <p className="text-sm">No candidates found</p>
            </div>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[#1a1a1a]">
                      {[
                        { label: 'Name', key: 'full_name' as SortKey },
                        { label: 'Contact', key: null },
                        { label: 'Location', key: null },
                        { label: 'Role', key: null },
                        { label: 'Status', key: 'status' as SortKey },
                        { label: 'Applied', key: 'created_at' as SortKey },
                        { label: '', key: null },
                      ].map(({ label, key }) => (
                        <th
                          key={label}
                          onClick={key ? () => toggleSort(key) : undefined}
                          className={`px-4 py-3 text-left text-[11px] font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap ${
                            key ? 'cursor-pointer hover:text-gray-300 select-none' : ''
                          }`}
                        >
                          <span className="flex items-center gap-1">
                            {label}
                            {key && <SortIcon k={key} />}
                          </span>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#161616]">
                    {filtered.map((c) => (
                      <tr
                        key={c.id}
                        onClick={() => setSelected(c)}
                        className="hover:bg-[#161616] cursor-pointer transition-colors group"
                      >
                        <td className="px-4 py-3">
                          <p className="font-semibold text-white group-hover:text-pink-300 transition-colors">
                            {c.full_name}
                          </p>
                          {c.instagram && (
                            <p className="text-xs text-gray-600">{c.instagram}</p>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-gray-300 flex items-center gap-1.5">
                            <Mail className="w-3 h-3 text-gray-600 flex-shrink-0" />
                            {c.email}
                          </p>
                          <p className="text-gray-500 text-xs flex items-center gap-1.5 mt-0.5">
                            <Phone className="w-3 h-3 flex-shrink-0" />
                            {c.phone}
                          </p>
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-gray-300 flex items-center gap-1.5">
                            <MapPin className="w-3 h-3 text-gray-600 flex-shrink-0" />
                            {c.primary_location}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5 text-gray-600">
                            {c.does_drive && <span className="flex items-center gap-0.5 text-xs"><Car className="w-3 h-3" /> Drives</span>}
                            {c.is_student && <span className="flex items-center gap-0.5 text-xs"><GraduationCap className="w-3 h-3" /> Student</span>}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-gray-300 whitespace-nowrap">{c.role_interest}</td>
                        <td className="px-4 py-3">
                          <StatusBadge status={c.status} />
                        </td>
                        <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">
                          <Calendar className="w-3 h-3 inline mr-1" />
                          {formatDate(c.created_at)}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                            <RowActions candidate={c} onStatusChange={handleStatusChange} />
                            <button
                              onClick={(e) => { e.stopPropagation(); setSelected(c); }}
                              className="p-1.5 rounded-lg bg-[#1a1a1a] text-gray-500 hover:text-pink-400 hover:bg-pink-500/10 transition-colors"
                              title="View"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards */}
              <div className="sm:hidden divide-y divide-[#161616]">
                {filtered.map((c) => (
                  <div
                    key={c.id}
                    onClick={() => setSelected(c)}
                    className="px-4 py-4 cursor-pointer hover:bg-[#161616] transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <p className="font-semibold text-white">{c.full_name}</p>
                        <p className="text-xs text-gray-500">{c.email}</p>
                      </div>
                      <StatusBadge status={c.status} />
                    </div>
                    <div className="flex items-center gap-3 text-xs text-gray-500">
                      <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{c.primary_location}</span>
                      <span>{c.role_interest}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-3" onClick={(e) => e.stopPropagation()}>
                      <RowActions candidate={c} onStatusChange={handleStatusChange} />
                      <button
                        onClick={(e) => { e.stopPropagation(); setSelected(c); }}
                        className="ml-auto flex items-center gap-1 text-xs text-gray-500 hover:text-pink-400 transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" /> View
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        <p className="text-center text-xs text-gray-700 pb-2">
          Showing {filtered.length} of {candidates.length} candidates
        </p>
      </div>

      {/* Detail Modal */}
      {selected && (
        <CandidateModal
          candidate={selected}
          onClose={() => setSelected(null)}
          onStatusChange={handleStatusChange}
        />
      )}
    </div>
  );
}
