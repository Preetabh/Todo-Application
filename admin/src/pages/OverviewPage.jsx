import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  Smartphone,
  Send,
  CheckCircle2,
  XCircle,
  Clock,
  RefreshCw,
  ArrowUpRight,
  Info,
  Calendar,
  Layers,
  Sparkles,
} from 'lucide-react';
import { adminApi } from '../api/adminApi';
import { StatCard } from '../components/StatCard';

export const OverviewPage = () => {
  const [stats, setStats] = useState(null);
  const [recentCampaigns, setRecentCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timeFilter, setTimeFilter] = useState('all');

  const fetchStats = async () => {
    setLoading(true);
    let startDate = null;
    const now = new Date();

    if (timeFilter === 'today') {
      startDate = new Date(now.setHours(0, 0, 0, 0)).toISOString();
    } else if (timeFilter === 'week') {
      startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    } else if (timeFilter === 'month') {
      startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    }

    try {
      const res = await adminApi.getStats(startDate);
      if (res.success) {
        setStats(res.stats);
        setRecentCampaigns(res.recentCampaigns || []);
      }
    } catch (err) {
      console.error('Failed fetching overview stats:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [timeFilter]);

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
    <div className="space-y-8 animate-fade-in">
      {/* Top Banner & Date Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Operational Dashboard
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Real-time telemetry and database queries across active mobile users and push campaigns.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <div className="flex items-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-1 text-xs font-semibold">
            <button
              onClick={() => setTimeFilter('all')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                timeFilter === 'all'
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
              }`}
            >
              All Time
            </button>
            <button
              onClick={() => setTimeFilter('month')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                timeFilter === 'month'
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
              }`}
            >
              Last 30 Days
            </button>
            <button
              onClick={() => setTimeFilter('today')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                timeFilter === 'today'
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
              }`}
            >
              Today
            </button>
          </div>

          <button
            onClick={fetchStats}
            title="Refresh statistics"
            className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* KPI Stat Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          title="Total Registered Users"
          value={stats?.totalUsers || 0}
          subtitle="User accounts in MongoDB"
          icon={Users}
          color="brand"
          loading={loading}
        />
        <StatCard
          title="Active Push Devices"
          value={stats?.activeTokens || 0}
          subtitle={`${stats?.usersWithActiveTokens || 0} unique users with tokens`}
          icon={Smartphone}
          color="indigo"
          loading={loading}
        />
        <StatCard
          title="Notifications Submitted"
          value={stats?.notificationsSubmitted || 0}
          subtitle={`${stats?.notificationsAccepted || 0} accepted by Expo Push Service`}
          icon={Send}
          color="purple"
          loading={loading}
        />
        <StatCard
          title="Confirmed Deliveries"
          value={stats?.successfulDeliveries || 0}
          subtitle={`${stats?.failedDeliveries || 0} receipt failures recorded`}
          icon={CheckCircle2}
          color="emerald"
          loading={loading}
        />
      </div>

      {/* Second Row: Secondary Stats & Platform Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Campaign Metrics Overview Card */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800/80">
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                Campaign Delivery Pipeline Breakdown
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Detailed distinction between push submission tickets and confirmed receipt delivery
              </p>
            </div>
            <Link
              to="/history"
              className="inline-flex items-center space-x-1 text-xs font-semibold text-brand-600 dark:text-brand-400 hover:underline"
            >
              <span>Full History</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-6">
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
              <p className="text-xs text-slate-500 dark:text-slate-400">Total Campaigns</p>
              <p className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">
                {stats?.totalCampaigns || 0}
              </p>
            </div>
            <div className="p-4 rounded-xl bg-purple-500/5 border border-purple-500/10">
              <p className="text-xs text-purple-600 dark:text-purple-400">Scheduled</p>
              <p className="text-2xl font-extrabold text-purple-700 dark:text-purple-300 mt-1">
                {stats?.scheduledCampaigns || 0}
              </p>
            </div>
            <div className="p-4 rounded-xl bg-sky-500/5 border border-sky-500/10">
              <p className="text-xs text-sky-600 dark:text-sky-400">Expo Accepted</p>
              <p className="text-2xl font-extrabold text-sky-700 dark:text-sky-300 mt-1">
                {stats?.notificationsAccepted || 0}
              </p>
            </div>
            <div className="p-4 rounded-xl bg-rose-500/5 border border-rose-500/10">
              <p className="text-xs text-rose-600 dark:text-rose-400">Failed / Invalid</p>
              <p className="text-2xl font-extrabold text-rose-700 dark:text-rose-300 mt-1">
                {stats?.failedDeliveries || 0}
              </p>
            </div>
          </div>

          {/* Educational Note on Push Receipt Verification */}
          <div className="p-3.5 rounded-xl bg-brand-500/5 border border-brand-500/15 flex items-start space-x-3 text-xs text-slate-600 dark:text-slate-300">
            <Info className="w-4 h-4 text-brand-500 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-brand-700 dark:text-brand-300">
                Understanding Push Service Verification
              </p>
              <p className="mt-0.5 text-slate-500 dark:text-slate-400 leading-relaxed">
                When a notification is dispatched, Expo assigns push tickets indicating the payload was accepted. Confirmed delivery counts are later reconciled via Expo Push Receipts when Apple APNs or Google FCM successfully hands the message to the device.
              </p>
            </div>
          </div>
        </div>

        {/* Platform Breakdown Card */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800/80">
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                Platform Distribution
              </h3>
              <Layers className="w-4 h-4 text-slate-400" />
            </div>

            <div className="mt-6 space-y-4">
              {/* Android */}
              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="text-slate-700 dark:text-slate-300">Android Devices</span>
                  <span className="text-slate-900 dark:text-white">
                    {stats?.platformBreakdown?.android || 0}
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full"
                    style={{
                      width: `${
                        stats?.activeTokens
                          ? Math.round(((stats.platformBreakdown.android || 0) / stats.activeTokens) * 100)
                          : 0
                      }%`,
                    }}
                  />
                </div>
              </div>

              {/* iOS */}
              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="text-slate-700 dark:text-slate-300">iOS Devices</span>
                  <span className="text-slate-900 dark:text-white">
                    {stats?.platformBreakdown?.ios || 0}
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div
                    className="h-full bg-sky-500 rounded-full"
                    style={{
                      width: `${
                        stats?.activeTokens
                          ? Math.round(((stats.platformBreakdown.ios || 0) / stats.activeTokens) * 100)
                          : 0
                      }%`,
                    }}
                  />
                </div>
              </div>

              {/* Web / Other */}
              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="text-slate-700 dark:text-slate-300">Web / Other</span>
                  <span className="text-slate-900 dark:text-white">
                    {(stats?.platformBreakdown?.web || 0) + (stats?.platformBreakdown?.other || 0)}
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div
                    className="h-full bg-purple-500 rounded-full"
                    style={{
                      width: `${
                        stats?.activeTokens
                          ? Math.round(
                              (((stats.platformBreakdown.web || 0) + (stats.platformBreakdown.other || 0)) /
                                stats.activeTokens) *
                                100
                            )
                          : 0
                      }%`,
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          <Link
            to="/devices"
            className="mt-6 w-full py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-center text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            Manage Registered Devices
          </Link>
        </div>
      </div>

      {/* Recent Notification Campaigns Table */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
        <div className="p-6 flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80">
          <div>
            <h3 className="font-bold text-base text-slate-900 dark:text-white">
              Recent Notification Campaigns
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Latest broadcast and targeted campaigns executed through the system
            </p>
          </div>
          <Link
            to="/send"
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-brand-600 hover:bg-brand-500 text-white shadow-sm transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Create Campaign</span>
          </Link>
        </div>

        <div className="overflow-x-auto">
          {recentCampaigns.length === 0 ? (
            <div className="p-12 text-center">
              <Clock className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                No notification campaigns recorded yet
              </p>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                Ready to send your first alert? Click below to compose and dispatch a push notification to all users.
              </p>
              <Link
                to="/send"
                className="mt-4 inline-flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold bg-brand-600 text-white shadow-md hover:bg-brand-500 transition-colors"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Send First Notification</span>
              </Link>
            </div>
          ) : (
            <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800">
                <tr>
                  <th className="px-6 py-3.5">Title & Message</th>
                  <th className="px-6 py-3.5">Target</th>
                  <th className="px-6 py-3.5">Submitted</th>
                  <th className="px-6 py-3.5">Delivered</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5">Date</th>
                  <th className="px-6 py-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                {recentCampaigns.map((camp) => (
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
                      <span className="px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold">
                        {camp.recipientType}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs font-semibold">
                      {camp.submittedCount}
                    </td>
                    <td className="px-6 py-4 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                      {camp.deliveredCount}
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
                    <td className="px-6 py-4 text-xs text-slate-500 dark:text-slate-400">
                      {new Date(camp.createdAt).toLocaleDateString([], {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        to={`/history?id=${camp._id}`}
                        className="text-xs font-bold text-brand-600 dark:text-brand-400 hover:underline"
                      >
                        Details
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};
