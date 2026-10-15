import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  History,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Clock,
  Eye,
  RefreshCw,
  Ban,
  Info,
  ChevronLeft,
  ChevronRight,
  X,
  AlertTriangle,
  Smartphone,
} from 'lucide-react';
import { adminApi } from '../api/adminApi';
import { ConfirmModal } from '../components/ConfirmModal';

export const NotificationHistoryPage = () => {
  const [searchParams] = useSearchParams();
  const [campaigns, setCampaigns] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [recipientTypeFilter, setRecipientTypeFilter] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Details Modal
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [campaignDetails, setCampaignDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // Cancel Modal
  const [cancelTargetId, setCancelTargetId] = useState(null);
  const [isCancelling, setIsCancelling] = useState(false);

  // Check Receipts State
  const [isCheckingReceipts, setIsCheckingReceipts] = useState(false);

  const fetchCampaigns = async () => {
    setLoading(true);
    try {
      const res = await adminApi.getCampaigns({
        page,
        limit: 15,
        search,
        status: statusFilter,
        recipientType: recipientTypeFilter,
        startDate,
        endDate,
      });

      if (res.success) {
        setCampaigns(res.campaigns || []);
        setTotal(res.total || 0);
        setTotalPages(res.totalPages || 1);
      }
    } catch (err) {
      console.error('Error fetching campaigns:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCampaigns();
  }, [page, statusFilter, recipientTypeFilter, startDate, endDate]);

  // Handle URL pre-selection
  useEffect(() => {
    const campaignId = searchParams.get('id');
    if (campaignId) {
      viewDetails(campaignId);
    }
  }, [searchParams]);

  const viewDetails = async (id) => {
    setLoadingDetails(true);
    try {
      const res = await adminApi.getCampaignById(id);
      if (res.success) {
        setSelectedCampaign(res.campaign);
        setCampaignDetails(res);
      }
    } catch (err) {
      console.error('Failed fetching details:', err);
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleCancelCampaign = async () => {
    if (!cancelTargetId) return;
    setIsCancelling(true);
    try {
      const res = await adminApi.cancelCampaign(cancelTargetId);
      if (res.success) {
        fetchCampaigns();
        if (selectedCampaign?._id === cancelTargetId) {
          viewDetails(cancelTargetId);
        }
      }
    } catch (err) {
      console.error('Cancel failed:', err);
    } finally {
      setIsCancelling(false);
      setCancelTargetId(null);
    }
  };

  const handleCheckReceipts = async (id) => {
    setIsCheckingReceipts(true);
    try {
      const res = await adminApi.checkReceipts(id);
      if (res.success) {
        await viewDetails(id);
        fetchCampaigns();
      }
    } catch (err) {
      console.error('Receipt check failed:', err);
    } finally {
      setIsCheckingReceipts(false);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      completed: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
      processing: 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20 animate-pulse',
      scheduled: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
      failed: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
      cancelled: 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20',
      draft: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
    };
    return badges[status] || badges.draft;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Notification Campaign History
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Audit trail of all broadcast, targeted, and scheduled push notifications with delivery receipts.
          </p>
        </div>

        <button
          onClick={fetchCampaigns}
          className="inline-flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Push Verification Educational Disclaimer */}
      <div className="p-4 rounded-2xl bg-brand-500/5 border border-brand-500/15 text-xs text-slate-600 dark:text-slate-300 flex items-start space-x-3">
        <Info className="w-5 h-5 text-brand-500 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold text-brand-700 dark:text-brand-300">
            Important Information on Push Delivery Receipts:
          </span>
          <p className="mt-0.5 leading-relaxed text-slate-500 dark:text-slate-400">
            Push receipt confirmation verifies that the push message was accepted and delivered to the operating system's notification subsystem (APNs or FCM). It does not necessarily guarantee that the user actively unlocked their phone, saw, or tapped the banner.
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Search Input */}
          <div className="relative lg:col-span-2">
            <Search className="absolute inset-y-0 left-3 my-auto w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchCampaigns()}
              placeholder="Search by title or message..."
              className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
            />
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
            >
              <option value="all">All Statuses</option>
              <option value="completed">Completed</option>
              <option value="processing">Processing</option>
              <option value="scheduled">Scheduled</option>
              <option value="failed">Failed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          {/* Recipient Type Filter */}
          <div>
            <select
              value={recipientTypeFilter}
              onChange={(e) => {
                setRecipientTypeFilter(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
            >
              <option value="all">All Audiences</option>
              <option value="all">Broadcast (All)</option>
              <option value="selected">Selected Users</option>
              <option value="specific">Specific User</option>
              <option value="filtered">Platform Filtered</option>
            </select>
          </div>

          {/* Apply Filter Button */}
          <div>
            <button
              onClick={fetchCampaigns}
              className="w-full py-2 rounded-xl text-xs font-bold bg-brand-600 hover:bg-brand-500 text-white transition-colors"
            >
              Filter Campaigns
            </button>
          </div>
        </div>
      </div>

      {/* Campaigns Table */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-12 text-center text-xs text-slate-500">
              Loading campaign records...
            </div>
          ) : campaigns.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-500">
              No matching notification campaigns found.
            </div>
          ) : (
            <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800">
                <tr>
                  <th className="px-6 py-3.5">Notification Title</th>
                  <th className="px-6 py-3.5">Audience</th>
                  <th className="px-6 py-3.5">Recipients</th>
                  <th className="px-6 py-3.5">Submitted</th>
                  <th className="px-6 py-3.5">Delivered</th>
                  <th className="px-6 py-3.5">Failed</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5">Created</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                {campaigns.map((camp) => (
                  <tr key={camp._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="px-6 py-4 max-w-xs">
                      <p className="font-bold text-slate-900 dark:text-white truncate">
                        {camp.title}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                        {camp.message}
                      </p>
                    </td>
                    <td className="px-6 py-4 capitalize text-xs">
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold">
                        {camp.recipientType}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs font-semibold">
                      {camp.totalRecipients}
                    </td>
                    <td className="px-6 py-4 text-xs font-semibold text-sky-600 dark:text-sky-400">
                      {camp.submittedCount}
                    </td>
                    <td className="px-6 py-4 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                      {camp.deliveredCount}
                    </td>
                    <td className="px-6 py-4 text-xs font-semibold text-rose-600 dark:text-rose-400">
                      {camp.failedCount}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border capitalize ${getStatusBadge(
                          camp.status
                        )}`}
                      >
                        {camp.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">
                      {new Date(camp.createdAt).toLocaleDateString([], {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="px-6 py-4 text-right space-x-2 whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => viewDetails(camp._id)}
                        className="px-2.5 py-1 rounded-lg text-xs font-bold text-brand-600 dark:text-brand-400 hover:bg-brand-500/10 transition-colors"
                      >
                        Inspect
                      </button>

                      {['scheduled', 'draft'].includes(camp.status) && (
                        <button
                          type="button"
                          onClick={() => setCancelTargetId(camp._id)}
                          className="px-2.5 py-1 rounded-lg text-xs font-bold text-rose-600 hover:bg-rose-500/10 transition-colors"
                        >
                          Cancel
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination Bar */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <p className="text-xs text-slate-500">
            Showing Page {page} of {totalPages} ({total} total campaigns)
          </p>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 disabled:opacity-40"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 disabled:opacity-40"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Detailed Campaign Inspection Modal */}
      {selectedCampaign && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-3xl rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-2xl flex flex-col max-h-[90vh]">
            <button
              onClick={() => setSelectedCampaign(null)}
              className="absolute top-5 right-5 p-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-slate-200"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-3 mb-6 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="w-10 h-10 rounded-2xl bg-brand-500/10 text-brand-500 flex items-center justify-center">
                <History className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  Campaign Delivery Details
                </h3>
                <p className="text-xs text-slate-500">
                  ID: <span className="font-mono">{selectedCampaign._id}</span>
                </p>
              </div>
            </div>

            <div className="overflow-y-auto space-y-6 pr-2 flex-1">
              {/* Campaign Content Overview */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 space-y-2">
                <p className="text-sm font-bold text-slate-900 dark:text-white">
                  {selectedCampaign.title}
                </p>
                <p className="text-xs text-slate-600 dark:text-slate-300">
                  {selectedCampaign.message}
                </p>
                {selectedCampaign.deepLink && (
                  <p className="text-[11px] text-brand-500 font-mono">
                    Deep Link: {selectedCampaign.deepLink}
                  </p>
                )}
              </div>

              {/* Delivery Stats Matrix */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-center">
                  <span className="text-[11px] text-slate-500">Recipients</span>
                  <p className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">
                    {selectedCampaign.totalRecipients}
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-sky-500/10 text-center">
                  <span className="text-[11px] text-sky-600 dark:text-sky-400">Accepted</span>
                  <p className="text-lg font-bold text-sky-700 dark:text-sky-300 mt-0.5">
                    {selectedCampaign.acceptedCount}
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-emerald-500/10 text-center">
                  <span className="text-[11px] text-emerald-600 dark:text-emerald-400">Confirmed</span>
                  <p className="text-lg font-bold text-emerald-700 dark:text-emerald-300 mt-0.5">
                    {selectedCampaign.deliveredCount}
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-rose-500/10 text-center">
                  <span className="text-[11px] text-rose-600 dark:text-rose-400">Failed</span>
                  <p className="text-lg font-bold text-rose-700 dark:text-rose-300 mt-0.5">
                    {selectedCampaign.failedCount}
                  </p>
                </div>
              </div>

              {/* Error Details if any */}
              {selectedCampaign.errorDetails && selectedCampaign.errorDetails.length > 0 && (
                <div className="p-4 rounded-2xl bg-rose-500/5 border border-rose-500/20 space-y-1">
                  <p className="text-xs font-bold text-rose-600 dark:text-rose-400">
                    Recorded Submission & Delivery Errors:
                  </p>
                  <ul className="text-xs text-rose-500 space-y-1 list-disc pl-4">
                    {selectedCampaign.errorDetails.map((err, i) => (
                      <li key={i}>{err}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Individual Device Deliveries Log */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Per-Device Push Tickets & Receipt Outcomes
                  </h4>
                  <button
                    onClick={() => handleCheckReceipts(selectedCampaign._id)}
                    disabled={isCheckingReceipts}
                    className="inline-flex items-center space-x-1 text-xs font-bold text-brand-600 dark:text-brand-400 hover:underline"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isCheckingReceipts ? 'animate-spin' : ''}`} />
                    <span>Reconcile Receipts Now</span>
                  </button>
                </div>

                <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 font-bold uppercase">
                      <tr>
                        <th className="p-2.5">User</th>
                        <th className="p-2.5">Token</th>
                        <th className="p-2.5">Ticket</th>
                        <th className="p-2.5">Receipt</th>
                        <th className="p-2.5">Error</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {campaignDetails?.deliveries?.map((d) => (
                        <tr key={d._id}>
                          <td className="p-2.5 font-medium text-slate-900 dark:text-white">
                            {d.userId?.name || 'User'}
                          </td>
                          <td className="p-2.5 font-mono text-[11px] text-slate-400">
                            {d.expoPushToken ? `${d.expoPushToken.slice(0, 18)}...` : 'N/A'}
                          </td>
                          <td className="p-2.5">
                            <span
                              className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                d.ticketStatus === 'ok'
                                  ? 'bg-emerald-500/10 text-emerald-500'
                                  : 'bg-rose-500/10 text-rose-500'
                              }`}
                            >
                              {d.ticketStatus}
                            </span>
                          </td>
                          <td className="p-2.5">
                            <span
                              className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                d.receiptStatus === 'ok'
                                  ? 'bg-emerald-500/10 text-emerald-500'
                                  : d.receiptStatus === 'error'
                                  ? 'bg-rose-500/10 text-rose-500'
                                  : 'bg-amber-500/10 text-amber-500'
                              }`}
                            >
                              {d.receiptStatus}
                            </span>
                          </td>
                          <td className="p-2.5 text-rose-500">
                            {d.errorCode || d.errorMessage || '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedCampaign(null)}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-300"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Confirmation Modal */}
      <ConfirmModal
        isOpen={!!cancelTargetId}
        title="Cancel Scheduled Campaign"
        message="Are you sure you want to cancel this scheduled notification campaign? It will not be sent to recipients."
        confirmText="Cancel Campaign"
        variant="danger"
        isLoading={isCancelling}
        onConfirm={handleCancelCampaign}
        onCancel={() => setCancelTargetId(null)}
      />
    </div>
  );
};
