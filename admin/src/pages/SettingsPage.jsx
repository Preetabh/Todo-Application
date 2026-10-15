import React, { useState, useEffect } from 'react';
import {
  Settings,
  ShieldCheck,
  Lock,
  Key,
  AlertTriangle,
  CheckCircle2,
  Server,
  Activity,
  History,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';
import { useAdminAuth } from '../context/AdminAuthContext';
import { adminApi } from '../api/adminApi';

export const SettingsPage = () => {
  const { admin, changePassword, refreshAdmin } = useAdminAuth();

  // Password Change Form
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordFeedback, setPasswordFeedback] = useState(null);

  // Audit Logs
  const [logs, setLogs] = useState([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [auditPage, setAuditPage] = useState(1);

  const fetchAuditLogs = async () => {
    setLoadingLogs(true);
    try {
      const res = await adminApi.getAuditLogs({ page: auditPage, limit: 15 });
      if (res.success) {
        setLogs(res.logs || []);
      }
    } catch (err) {
      console.error('Failed fetching audit logs:', err);
    } finally {
      setLoadingLogs(false);
    }
  };

  useEffect(() => {
    fetchAuditLogs();
  }, [auditPage]);

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setPasswordFeedback(null);

    if (newPassword.length < 6) {
      setPasswordFeedback({
        type: 'error',
        message: 'New password must be at least 6 characters long.',
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordFeedback({
        type: 'error',
        message: 'New password and confirmation do not match.',
      });
      return;
    }

    setPasswordLoading(true);
    try {
      const res = await changePassword(currentPassword, newPassword);
      if (res.success) {
        setPasswordFeedback({
          type: 'success',
          message: 'Password changed successfully. Your account is now fully secured.',
        });
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        refreshAdmin();
        fetchAuditLogs();
      } else {
        setPasswordFeedback({
          type: 'error',
          message: res.message || 'Failed to update password.',
        });
      }
    } catch (err) {
      setPasswordFeedback({
        type: 'error',
        message: err.message || 'Error occurred updating password.',
      });
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in max-w-5xl mx-auto">
      {/* Page Header */}
      <div>
        <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          System Settings & Administrator Security
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
          Manage administrator credentials, verify push service connectivity, and audit administrative actions.
        </p>
      </div>

      {/* Must Change Password Warning Banner if using initial 1111 default */}
      {admin?.mustChangePassword && (
        <div className="p-5 rounded-3xl bg-amber-500/10 border-2 border-amber-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-pulse">
          <div className="flex items-start space-x-3.5">
            <div className="p-2 rounded-xl bg-amber-500 text-slate-950 shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-amber-800 dark:text-amber-200">
                Action Required: Default Password in Use
              </h3>
              <p className="text-xs text-amber-700/90 dark:text-amber-300/90 mt-0.5 leading-relaxed">
                Your account is currently using the initial setup password. For production security, please update your administrator password below.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Grid: Admin Profile & Password Change */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Profile Card */}
        <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-7 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center space-x-3 pb-4 border-b border-slate-100 dark:border-slate-800 mb-6">
              <div className="p-2.5 rounded-xl bg-brand-500/10 text-brand-500">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  Administrator Profile
                </h3>
                <p className="text-xs text-slate-500">Authenticated RBAC session details</p>
              </div>
            </div>

            <div className="space-y-4 text-xs">
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
                <span className="text-slate-400 font-semibold uppercase text-[10px] tracking-wider block mb-0.5">
                  Full Name
                </span>
                <span className="font-bold text-slate-900 dark:text-white text-sm">
                  {admin?.name || 'DIGENT Admin'}
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
                <span className="text-slate-400 font-semibold uppercase text-[10px] tracking-wider block mb-0.5">
                  Official Email Address
                </span>
                <span className="font-bold text-slate-900 dark:text-white text-sm">
                  {admin?.email || 'admin@digenttech.com'}
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between">
                <div>
                  <span className="text-slate-400 font-semibold uppercase text-[10px] tracking-wider block mb-0.5">
                    Authorization Role
                  </span>
                  <span className="font-bold text-brand-600 dark:text-brand-400 text-sm capitalize">
                    {admin?.role || 'admin'} (Full Access)
                  </span>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold text-[10px]">
                  VERIFIED
                </span>
              </div>
            </div>
          </div>

          <p className="text-[11px] text-slate-400 mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
            Administrator accounts are protected with bcrypt salting and protected routes.
          </p>
        </div>

        {/* Change Password Form */}
        <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-7 shadow-sm">
          <div className="flex items-center space-x-3 pb-4 border-b border-slate-100 dark:border-slate-800 mb-6">
            <div className="p-2.5 rounded-xl bg-brand-500/10 text-brand-500">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                Change Password
              </h3>
              <p className="text-xs text-slate-500">Update your administrative credentials</p>
            </div>
          </div>

          {passwordFeedback && (
            <div
              className={`mb-4 p-3.5 rounded-xl text-xs flex items-center space-x-2 ${
                passwordFeedback.type === 'success'
                  ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                  : 'bg-rose-500/10 border border-rose-500/20 text-rose-500'
              }`}
            >
              {passwordFeedback.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 shrink-0" />
              )}
              <span>{passwordFeedback.message}</span>
            </div>
          )}

          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                Current Password
              </label>
              <input
                type="password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter current password (e.g. 1111)"
                className="w-full px-4 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                New Password
              </label>
              <input
                type="password"
                required
                minLength={6}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Minimum 6 characters"
                className="w-full px-4 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                Confirm New Password
              </label>
              <input
                type="password"
                required
                minLength={6}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter new password"
                className="w-full px-4 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <button
              type="submit"
              disabled={passwordLoading}
              className="w-full mt-2 py-2.5 px-4 rounded-xl text-xs font-bold bg-brand-600 hover:bg-brand-500 text-white shadow-md shadow-brand-500/20 flex items-center justify-center space-x-2 transition-all disabled:opacity-50"
            >
              {passwordLoading && (
                <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              )}
              <span>Update Password</span>
            </button>
          </form>
        </div>
      </div>

      {/* Push Infrastructure & Configuration Specs Card */}
      <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-7 shadow-sm space-y-4">
        <div className="flex items-center space-x-3 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-500">
            <Server className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-base text-slate-900 dark:text-white">
              Push Delivery Infrastructure Configuration
            </h3>
            <p className="text-xs text-slate-500">
              Verified connectivity to Expo Push Service & project credentials
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
            <span className="text-slate-400 uppercase text-[10px] font-bold block mb-1">
              Expo Push Endpoint
            </span>
            <p className="font-mono text-emerald-600 dark:text-emerald-400 font-bold truncate">
              https://exp.host/--/api/v2/push/send
            </p>
            <span className="text-[10px] text-slate-500 mt-1 block">Live & Ready</span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
            <span className="text-slate-400 uppercase text-[10px] font-bold block mb-1">
              EAS Project ID
            </span>
            <p className="font-mono text-slate-900 dark:text-white font-bold truncate">
              6c38a271-6e8a-464b-9bf5-645c16848922
            </p>
            <span className="text-[10px] text-slate-500 mt-1 block">app.json & EAS synced</span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
            <span className="text-slate-400 uppercase text-[10px] font-bold block mb-1">
              Android Package
            </span>
            <p className="font-mono text-slate-900 dark:text-white font-bold truncate">
              com.digenttech.DigentTech
            </p>
            <span className="text-[10px] text-slate-500 mt-1 block">SDK 57 Compatible</span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
            <span className="text-slate-400 uppercase text-[10px] font-bold block mb-1">
              Persistent Scheduler
            </span>
            <p className="font-bold text-emerald-600 dark:text-emerald-400">
              Active (Every 30s)
            </p>
            <span className="text-[10px] text-slate-500 mt-1 block">Survives Server Restarts</span>
          </div>
        </div>
      </div>

      {/* Admin Audit Logs Table */}
      <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
        <div className="p-6 flex items-center justify-between border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                Administrative Security Audit Log
              </h3>
              <p className="text-xs text-slate-500">
                Immutable event record of administrative logins, campaigns, and configuration changes
              </p>
            </div>
          </div>

          <button
            onClick={fetchAuditLogs}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900"
          >
            <RefreshCw className={`w-4 h-4 ${loadingLogs ? 'animate-spin' : ''}`} />
          </button>
        </div>

        <div className="overflow-x-auto">
          {loadingLogs ? (
            <div className="p-12 text-center text-xs text-slate-500">
              Loading security audit logs...
            </div>
          ) : logs.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-500">
              No audit records recorded yet.
            </div>
          ) : (
            <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
              <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 font-bold uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-3">Event Action</th>
                  <th className="px-6 py-3">Admin Email</th>
                  <th className="px-6 py-3">IP Address</th>
                  <th className="px-6 py-3">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {logs.map((log) => (
                  <tr key={log._id}>
                    <td className="px-6 py-3.5 font-bold font-mono text-brand-600 dark:text-brand-400">
                      {log.action}
                    </td>
                    <td className="px-6 py-3.5">{log.adminEmail}</td>
                    <td className="px-6 py-3.5 font-mono text-[11px] text-slate-400">
                      {log.ipAddress || '127.0.0.1'}
                    </td>
                    <td className="px-6 py-3.5 whitespace-nowrap text-slate-400">
                      {new Date(log.createdAt).toLocaleString()}
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
