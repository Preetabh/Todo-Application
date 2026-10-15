import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Clock,
  Calendar,
  Send,
  XCircle,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Users,
} from 'lucide-react';
import { adminApi } from '../api/adminApi';
import { ConfirmModal } from '../components/ConfirmModal';

export const ScheduledNotificationsPage = () => {
  const [scheduledCampaigns, setScheduledCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancelTargetId, setCancelTargetId] = useState(null);
  const [isCancelling, setIsCancelling] = useState(false);

  const fetchScheduled = async () => {
    setLoading(true);
    try {
      const res = await adminApi.getCampaigns({
        page: 1,
        limit: 50,
        status: 'scheduled',
      });
      if (res.success) {
        setScheduledCampaigns(res.campaigns || []);
      }
    } catch (err) {
      console.error('Failed fetching scheduled campaigns:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchScheduled();
  }, []);

  const handleCancel = async () => {
    if (!cancelTargetId) return;
    setIsCancelling(true);
    try {
      const res = await adminApi.cancelCampaign(cancelTargetId);
      if (res.success) {
        fetchScheduled();
      }
    } catch (err) {
      console.error('Failed cancelling campaign:', err);
    } finally {
      setIsCancelling(false);
      setCancelTargetId(null);
    }
  };

  const formatCountdown = (dateString) => {
    if (!dateString) return 'Pending execution';
    const target = new Date(dateString).getTime();
    const now = Date.now();
    const diffMs = target - now;

    if (diffMs <= 0) return 'Executing shortly by scheduler...';

    const diffMins = Math.floor(diffMs / (1000 * 60));
    const hours = Math.floor(diffMins / 60);
    const mins = diffMins % 60;

    if (hours > 24) {
      const days = Math.floor(hours / 24);
      return `In ${days} day(s) (${new Date(dateString).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })})`;
    }

    return `In ${hours}h ${mins}m (${new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})`;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Scheduled Campaigns Queue
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Persisted notifications stored in MongoDB awaiting background scheduler execution.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={fetchScheduled}
            className="inline-flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh Queue</span>
          </button>

          <Link
            to="/send"
            className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold bg-brand-600 hover:bg-brand-500 text-white transition-colors"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Schedule New Alert</span>
          </Link>
        </div>
      </div>

      {/* Scheduler Architecture Callout */}
      <div className="p-4 rounded-2xl bg-purple-500/5 border border-purple-500/20 text-xs text-purple-900 dark:text-purple-300 flex items-start space-x-3">
        <Clock className="w-5 h-5 text-purple-600 dark:text-purple-400 shrink-0 mt-0.5" />
        <div>
          <p className="font-bold">Persistent Background Execution Guarantee:</p>
          <p className="mt-0.5 text-purple-800/80 dark:text-purple-300/80 leading-relaxed">
            Unlike in-memory timers, scheduled campaigns are persisted directly in MongoDB with atomic locking. If the backend server restarts, crashes, or scales, pending jobs are safely recovered and dispatched without missing deliveries or double firing.
          </p>
        </div>
      </div>

      {/* Scheduled List / Empty State */}
      {loading ? (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-12 text-center text-xs text-slate-500">
          Loading scheduled queue...
        </div>
      ) : scheduledCampaigns.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-12 text-center">
          <Clock className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            No Scheduled Notifications Pending
          </h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            All previous campaigns have executed or been delivered. You can compose a notification and choose "Schedule for Later".
          </p>
          <Link
            to="/send"
            className="mt-4 inline-flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold bg-brand-600 text-white hover:bg-brand-500 transition-colors"
          >
            <Calendar className="w-4 h-4" />
            <span>Schedule a Notification</span>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {scheduledCampaigns.map((camp) => (
            <div
              key={camp._id}
              className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm space-y-3 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between text-xs mb-2">
                  <span className="font-bold px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                    Scheduled
                  </span>
                  <span className="font-semibold text-slate-500 text-[11px]">
                    {formatCountdown(camp.scheduledAt)}
                  </span>
                </div>

                <h4 className="font-bold text-base text-slate-900 dark:text-white">
                  {camp.title}
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 line-clamp-2">
                  {camp.message}
                </p>

                <div className="flex items-center space-x-4 text-xs text-slate-500 mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <span className="flex items-center space-x-1">
                    <Users className="w-3.5 h-3.5" />
                    <span className="capitalize">{camp.recipientType}</span>
                  </span>
                  <span>Target: {camp.totalRecipients} tokens</span>
                  {camp.deepLink && (
                    <span className="font-mono text-[10px] text-brand-500 truncate max-w-[120px]">
                      {camp.deepLink}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
                <span className="text-[11px] text-slate-400">
                  Set for: {new Date(camp.scheduledAt).toLocaleString()}
                </span>
                <button
                  type="button"
                  onClick={() => setCancelTargetId(camp._id)}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                >
                  Cancel Campaign
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Cancel Confirmation Modal */}
      <ConfirmModal
        isOpen={!!cancelTargetId}
        title="Cancel Scheduled Push"
        message="Are you sure you want to remove this campaign from the scheduled queue? It will be marked cancelled and will not dispatch."
        confirmText="Confirm Cancellation"
        variant="danger"
        isLoading={isCancelling}
        onConfirm={handleCancel}
        onCancel={() => setCancelTargetId(null)}
      />
    </div>
  );
};
