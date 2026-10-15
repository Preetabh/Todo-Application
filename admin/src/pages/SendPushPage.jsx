import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Send,
  Smartphone,
  Calendar,
  Image,
  Link as LinkIcon,
  Users,
  UserCheck,
  Filter,
  Eye,
  CheckCircle2,
  AlertTriangle,
  X,
  HelpCircle,
  Bell,
  Search,
  Sparkles,
} from 'lucide-react';
import { adminApi } from '../api/adminApi';
import { ConfirmModal } from '../components/ConfirmModal';

export const SendPushPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Form Fields
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [deepLink, setDeepLink] = useState('myfirstapp://home');
  const [recipientType, setRecipientType] = useState('all');
  const [platformFilter, setPlatformFilter] = useState('all');
  const [selectedUserIds, setSelectedUserIds] = useState([]);
  const [deliverySchedule, setDeliverySchedule] = useState('now');
  const [scheduledAt, setScheduledAt] = useState('');

  // UI State
  const [previewDevice, setPreviewDevice] = useState('android'); // 'android' | 'ios'
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [showUserSelectModal, setShowUserSelectModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [eligibleCount, setEligibleCount] = useState(0);
  const [loadingEligible, setLoadingEligible] = useState(false);

  // Testing Push State
  const [testPushToken, setTestPushToken] = useState('');
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [testResult, setTestResult] = useState(null);

  // Submission State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitOutcome, setSubmitOutcome] = useState(null);
  const [errorBanner, setErrorBanner] = useState('');

  // User Picker State
  const [userList, setUserList] = useState([]);
  const [userSearch, setUserSearch] = useState('');
  const [loadingUsers, setLoadingUsers] = useState(false);

  // Check if a specific target user was passed via URL query param
  useEffect(() => {
    const targetUserId = searchParams.get('userId');
    if (targetUserId) {
      setRecipientType('specific');
      setSelectedUserIds([targetUserId]);
    }
  }, [searchParams]);

  // Recalculate eligible recipients when targets change
  useEffect(() => {
    const checkEligible = async () => {
      setLoadingEligible(true);
      try {
        const res = await adminApi.getDevices({
          isActive: 'true',
          platform: platformFilter,
          limit: 1000,
        });

        if (res.success && Array.isArray(res.devices)) {
          let count = res.devices.length;
          if (['selected', 'specific'].includes(recipientType)) {
            const set = new Set(selectedUserIds);
            count = res.devices.filter((d) => set.has(d.userId?._id || d.userId)).length;
          }
          setEligibleCount(count);
        }
      } catch {
        // Fallback
      } finally {
        setLoadingEligible(false);
      }
    };

    checkEligible();
  }, [recipientType, platformFilter, selectedUserIds]);

  // Fetch users for selection modal
  const fetchUsersForPicker = async () => {
    setLoadingUsers(true);
    try {
      const res = await adminApi.getUsers({
        page: 1,
        limit: 50,
        search: userSearch,
        hasToken: 'true',
      });
      if (res.success) {
        setUserList(res.users || []);
      }
    } catch {
      // Ignored
    } finally {
      setLoadingUsers(false);
    }
  };

  useEffect(() => {
    if (showUserSelectModal) {
      fetchUsersForPicker();
    }
  }, [showUserSelectModal, userSearch]);

  const handleSendTest = async () => {
    setIsSendingTest(true);
    setTestResult(null);
    setErrorBanner('');

    try {
      const res = await adminApi.sendTest({
        pushToken: testPushToken ? testPushToken.trim() : undefined,
        title: title || 'DIGENT TECH Test Push',
        message: message || 'This is a test notification verifying push connectivity.',
        deepLink,
        imageUrl: imageUrl.trim() || undefined,
      });

      if (res.success) {
        setTestResult({
          type: 'success',
          text: 'Test notification submitted to Expo Push Service successfully! Verify on the device.',
        });
      } else {
        setTestResult({
          type: 'error',
          text: res.message || 'Push test rejected by Expo service.',
        });
      }
    } catch (err) {
      setTestResult({
        type: 'error',
        text: err.message || 'Network error sending test.',
      });
    } finally {
      setIsSendingTest(false);
    }
  };

  const handleValidateAndPromptConfirm = (e) => {
    e.preventDefault();
    setErrorBanner('');

    if (!title.trim()) {
      setErrorBanner('Please enter a notification title.');
      return;
    }
    if (!message.trim()) {
      setErrorBanner('Please enter a notification message.');
      return;
    }
    if (['selected', 'specific'].includes(recipientType) && selectedUserIds.length === 0) {
      setErrorBanner('Please select at least one recipient user.');
      return;
    }
    if (deliverySchedule === 'later') {
      if (!scheduledAt) {
        setErrorBanner('Please choose a valid date and time for scheduled delivery.');
        return;
      }
      if (new Date(scheduledAt) <= new Date()) {
        setErrorBanner('Scheduled date must be set in the future.');
        return;
      }
    }

    setShowConfirmModal(true);
  };

  const handleExecuteSend = async () => {
    setShowConfirmModal(false);
    setIsSubmitting(true);
    setErrorBanner('');

    try {
      const payload = {
        title: title.trim(),
        message: message.trim(),
        imageUrl: imageUrl.trim() || null,
        deepLink: deepLink.trim() || '',
        recipientType,
        recipientFilters: { platform: platformFilter },
        selectedUserIds,
        deliverySchedule,
        scheduledAt: deliverySchedule === 'later' ? new Date(scheduledAt).toISOString() : null,
      };

      const res = await adminApi.sendCampaign(payload);
      if (res.success) {
        setSubmitOutcome({
          success: true,
          message: res.message,
          campaign: res.campaign,
        });
      } else {
        setErrorBanner(res.message || 'Failed to submit notification campaign.');
      }
    } catch (err) {
      setErrorBanner(err.message || 'Unexpected error dispatching campaign.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleUserSelection = (userId) => {
    if (recipientType === 'specific') {
      setSelectedUserIds([userId]);
      setShowUserSelectModal(false);
    } else {
      setSelectedUserIds((prev) =>
        prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
      );
    }
  };

  return (
    <div className="space-y-8 animate-fade-in max-w-5xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Send Push Notification
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Compose rich notifications, select targeted cohorts, test live on mobile, or schedule delivery.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowPreviewModal(true)}
          className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 transition-colors"
        >
          <Eye className="w-4 h-4 text-brand-500" />
          <span>Interactive Mobile Preview</span>
        </button>
      </div>

      {errorBanner && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-sm flex items-start space-x-3">
          <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Validation Issue</p>
            <p className="mt-0.5 text-xs text-rose-600 dark:text-rose-400">{errorBanner}</p>
          </div>
        </div>
      )}

      {/* Main Composition Form Card */}
      <form onSubmit={handleValidateAndPromptConfirm} className="space-y-6">
        <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8 shadow-sm space-y-6">
          {/* Section 1: Message Content */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400 flex items-center space-x-2">
              <Bell className="w-4 h-4" />
              <span>1. Notification Payload</span>
            </h3>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                Notification Title <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                maxLength={200}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. DigentTech v1.1.1 Update Released!"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all placeholder:text-slate-400"
              />
              <div className="flex justify-between text-[11px] text-slate-400 mt-1">
                <span>Keep titles clear, concise, and engaging</span>
                <span>{title.length}/200</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                Notification Message Body <span className="text-rose-500">*</span>
              </label>
              <textarea
                required
                rows={3}
                maxLength={1000}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="e.g. Check out the latest document locker features and enhanced security updates available now."
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all placeholder:text-slate-400"
              />
              <div className="flex justify-between text-[11px] text-slate-400 mt-1">
                <span>Plain text push message delivered to lock screen & notification center</span>
                <span>{message.length}/1000</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                  Optional Image URL
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Image className="w-4 h-4" />
                  </div>
                  <input
                    type="url"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="https://example.com/banner.png"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all placeholder:text-slate-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                  Deep Link Screen Destination
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <LinkIcon className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value={deepLink}
                    onChange={(e) => setDeepLink(e.target.value)}
                    placeholder="myfirstapp://home"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all placeholder:text-slate-400"
                  />
                </div>
                {/* Deep Link Quick Preset Buttons */}
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {[
                    { label: 'Home', uri: 'myfirstapp://home' },
                    { label: 'Todos', uri: 'myfirstapp://todo' },
                    { label: 'Passwords', uri: 'myfirstapp://passwords' },
                    { label: 'Documents', uri: 'myfirstapp://documents' },
                    { label: 'Profile', uri: 'myfirstapp://profile' },
                  ].map((preset) => (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => setDeepLink(preset.uri)}
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-md transition-colors ${
                        deepLink === preset.uri
                          ? 'bg-brand-600 text-white'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <hr className="border-slate-100 dark:border-slate-800" />

          {/* Section 2: Recipient Audience */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400 flex items-center space-x-2">
                <Users className="w-4 h-4" />
                <span>2. Target Audience Cohort</span>
              </h3>

              <div className="text-xs font-semibold px-3 py-1 rounded-full bg-brand-500/10 text-brand-600 dark:text-brand-400 border border-brand-500/20">
                {loadingEligible ? 'Calculating...' : `${eligibleCount} Eligible Recipients`}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              {[
                {
                  id: 'all',
                  label: 'All Eligible Users',
                  desc: 'Every registered active device',
                  icon: Users,
                },
                {
                  id: 'selected',
                  label: 'Selected Users',
                  desc: 'Handpicked cohort list',
                  icon: UserCheck,
                },
                {
                  id: 'specific',
                  label: 'Specific User',
                  desc: 'Single user target',
                  icon: UserCheck,
                },
                {
                  id: 'filtered',
                  label: 'Platform Filter',
                  desc: 'Target Android or iOS only',
                  icon: Filter,
                },
              ].map((opt) => {
                const Icon = opt.icon;
                const isSelected = recipientType === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setRecipientType(opt.id)}
                    className={`p-4 rounded-2xl border text-left transition-all ${
                      isSelected
                        ? 'border-brand-600 bg-brand-500/5 dark:bg-brand-500/10 ring-2 ring-brand-500/20'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <Icon
                      className={`w-5 h-5 mb-2 ${
                        isSelected ? 'text-brand-600 dark:text-brand-400' : 'text-slate-400'
                      }`}
                    />
                    <p className="text-xs font-bold text-slate-900 dark:text-white">
                      {opt.label}
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      {opt.desc}
                    </p>
                  </button>
                );
              })}
            </div>

            {/* Target Cohort Configuration Sub-panels */}
            {['selected', 'specific'].includes(recipientType) && (
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    Selected Target Users: {selectedUserIds.length}
                  </p>
                  <p className="text-[11px] text-slate-500">
                    {selectedUserIds.length === 0
                      ? 'No users currently selected'
                      : `Targeting ${selectedUserIds.length} user account(s)`}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowUserSelectModal(true)}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-brand-600 hover:bg-brand-500 text-white transition-colors"
                >
                  {selectedUserIds.length === 0 ? 'Pick Users' : 'Change Selection'}
                </button>
              </div>
            )}

            {recipientType === 'filtered' && (
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 space-y-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Select Target Mobile Platform
                </label>
                <div className="flex space-x-3">
                  {['all', 'android', 'ios'].map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPlatformFilter(p)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold capitalize transition-colors ${
                        platformFilter === p
                          ? 'bg-brand-600 text-white'
                          : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {p} Devices
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <hr className="border-slate-100 dark:border-slate-800" />

          {/* Section 3: Delivery Scheduling */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400 flex items-center space-x-2">
              <Calendar className="w-4 h-4" />
              <span>3. Dispatch Schedule</span>
            </h3>

            <div className="flex space-x-4">
              <label className="flex items-center space-x-2 cursor-pointer text-xs font-bold text-slate-700 dark:text-slate-300">
                <input
                  type="radio"
                  name="schedule"
                  value="now"
                  checked={deliverySchedule === 'now'}
                  onChange={() => setDeliverySchedule('now')}
                  className="text-brand-600 focus:ring-brand-500 h-4 w-4"
                />
                <span>Send Immediately (Now)</span>
              </label>

              <label className="flex items-center space-x-2 cursor-pointer text-xs font-bold text-slate-700 dark:text-slate-300">
                <input
                  type="radio"
                  name="schedule"
                  value="later"
                  checked={deliverySchedule === 'later'}
                  onChange={() => setDeliverySchedule('later')}
                  className="text-brand-600 focus:ring-brand-500 h-4 w-4"
                />
                <span>Schedule for Future Date & Time</span>
              </label>
            </div>

            {deliverySchedule === 'later' && (
              <div className="max-w-md p-4 rounded-2xl bg-purple-500/5 border border-purple-500/20 space-y-2">
                <label className="block text-xs font-bold text-purple-900 dark:text-purple-300">
                  Select Execution Time (Server Time)
                </label>
                <input
                  type="datetime-local"
                  required
                  value={scheduledAt}
                  onChange={(e) => setScheduledAt(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Campaign will be stored in database and dispatched by persistent background worker.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Live Device Test Bar */}
        <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center space-x-2">
                <Smartphone className="w-4 h-4 text-emerald-500" />
                <span>Device Direct Test</span>
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Dispatch an instant test push without creating a permanent campaign.
              </p>
            </div>

            <div className="flex items-center space-x-2 w-full sm:w-auto">
              <input
                type="text"
                value={testPushToken}
                onChange={(e) => setTestPushToken(e.target.value)}
                placeholder="Optional token (or uses your registered phone)"
                className="flex-1 sm:w-72 px-3.5 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
              />
              <button
                type="button"
                onClick={handleSendTest}
                disabled={isSendingTest}
                className="shrink-0 px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm transition-all disabled:opacity-50 flex items-center space-x-1.5"
              >
                {isSendingTest && (
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                )}
                <span>Send Test</span>
              </button>
            </div>
          </div>

          {testResult && (
            <div
              className={`mt-4 p-3 rounded-xl text-xs flex items-center space-x-2 ${
                testResult.type === 'success'
                  ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                  : 'bg-rose-500/10 border border-rose-500/20 text-rose-500'
              }`}
            >
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{testResult.text}</span>
            </div>
          )}
        </div>

        {/* Action Buttons Row */}
        <div className="flex items-center justify-end space-x-4 pt-2">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="px-5 py-2.5 rounded-xl text-xs font-bold border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-2.5 rounded-xl text-xs font-bold bg-brand-600 hover:bg-brand-500 text-white shadow-lg shadow-brand-500/25 flex items-center space-x-2 transition-all disabled:opacity-50"
          >
            {isSubmitting ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
            <span>
              {deliverySchedule === 'later'
                ? 'Schedule Notification Campaign'
                : 'Send Push Notification Now'}
            </span>
          </button>
        </div>
      </form>

      {/* Confirmation Dialog Before Sending */}
      <ConfirmModal
        isOpen={showConfirmModal}
        title="Confirm Notification Dispatch"
        message={
          <div>
            <p>
              Are you sure you want to broadcast this notification campaign?
            </p>
            <div className="mt-3 p-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs space-y-1">
              <p>
                <strong>Title:</strong> {title}
              </p>
              <p>
                <strong>Eligible Target Count:</strong> {eligibleCount} push tokens
              </p>
              <p>
                <strong>Mode:</strong> {deliverySchedule === 'later' ? `Scheduled for ${scheduledAt}` : 'Immediate Dispatch'}
              </p>
            </div>
          </div>
        }
        confirmText={deliverySchedule === 'later' ? 'Confirm Schedule' : 'Dispatch Now'}
        onConfirm={handleExecuteSend}
        onCancel={() => setShowConfirmModal(false)}
        isLoading={isSubmitting}
        variant="brand"
      />

      {/* After-Sending Outcome Modal */}
      {submitOutcome && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-lg rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-2xl">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  Campaign Dispatched Successfully
                </h3>
                <p className="text-xs text-slate-500">
                  {submitOutcome.message}
                </p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 text-xs space-y-2 mb-6">
              <div className="flex justify-between">
                <span className="text-slate-500">Campaign ID:</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white">
                  {submitOutcome.campaign?.id || submitOutcome.campaign?._id}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Campaign Status:</span>
                <span className="capitalize font-bold text-emerald-600 dark:text-emerald-400">
                  {submitOutcome.campaign?.status}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Eligible Recipients:</span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {submitOutcome.campaign?.totalRecipients}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Submitted to Expo:</span>
                <span className="font-bold text-sky-600 dark:text-sky-400">
                  {submitOutcome.campaign?.totalRecipients}
                </span>
              </div>
            </div>

            <p className="text-[11px] text-slate-500 leading-relaxed mb-6">
              * Note: Expo Push Service tickets have been logged. Delivery receipts will be reconciled asynchronously by the persistent worker engine.
            </p>

            <div className="flex space-x-3 justify-end">
              <button
                type="button"
                onClick={() => {
                  setSubmitOutcome(null);
                  navigate('/history');
                }}
                className="px-5 py-2.5 rounded-xl text-xs font-bold bg-brand-600 text-white hover:bg-brand-500 transition-colors"
              >
                View Campaign History
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Interactive Mobile Mockup Preview Modal */}
      {showPreviewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-sm rounded-[40px] bg-slate-950 border-[6px] border-slate-800 p-6 shadow-2xl text-white">
            <button
              onClick={() => setShowPreviewModal(false)}
              className="absolute top-5 right-5 p-1.5 rounded-full bg-slate-800 text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Device Switcher Tabs */}
            <div className="flex justify-center mb-6">
              <div className="flex bg-slate-900 p-1 rounded-xl text-[11px] font-bold">
                <button
                  type="button"
                  onClick={() => setPreviewDevice('android')}
                  className={`px-3 py-1 rounded-lg ${
                    previewDevice === 'android' ? 'bg-brand-600 text-white' : 'text-slate-400'
                  }`}
                >
                  Android Notification
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewDevice('ios')}
                  className={`px-3 py-1 rounded-lg ${
                    previewDevice === 'ios' ? 'bg-brand-600 text-white' : 'text-slate-400'
                  }`}
                >
                  iOS Lock Screen
                </button>
              </div>
            </div>

            {/* Mobile Notification Mockup Screen */}
            <div className="rounded-3xl bg-slate-900/90 border border-slate-800 p-4 space-y-3 shadow-lg">
              <div className="flex items-center justify-between text-xs text-slate-400 border-b border-slate-800 pb-2">
                <div className="flex items-center space-x-2">
                  <div className="w-5 h-5 rounded-md bg-brand-600 flex items-center justify-center text-white text-[10px] font-black">
                    D
                  </div>
                  <span className="font-bold text-white text-xs">DIGENT TECH</span>
                </div>
                <span className="text-[10px]">now</span>
              </div>

              <div>
                <p className="font-bold text-sm text-white">
                  {title || 'Sample Notification Title'}
                </p>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                  {message || 'This is how your message will appear on the user’s mobile device screen.'}
                </p>
              </div>

              {imageUrl && (
                <div className="rounded-xl overflow-hidden mt-2 max-h-36 border border-slate-800">
                  <img
                    src={imageUrl}
                    alt="Notification media"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                </div>
              )}

              {deepLink && (
                <div className="pt-2 text-[10px] text-brand-400 font-mono">
                  Deep link: {deepLink}
                </div>
              )}
            </div>

            <p className="text-center text-[11px] text-slate-500 mt-6">
              Rendered matching standard mobile system UI
            </p>
          </div>
        </div>
      )}

      {/* User Selection Modal */}
      {showUserSelectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-xl rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-2xl flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  Select Notification Recipients
                </h3>
                <p className="text-xs text-slate-500">
                  Choose specific registered users with active device tokens
                </p>
              </div>
              <button
                onClick={() => setShowUserSelectModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-4">
              <div className="relative">
                <Search className="absolute inset-y-0 left-3 my-auto w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  placeholder="Search user by name or email..."
                  className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {loadingUsers ? (
                <div className="p-8 text-center text-xs text-slate-500">
                  Loading users...
                </div>
              ) : userList.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-500">
                  No users found with active push tokens.
                </div>
              ) : (
                userList.map((u) => {
                  const isChecked = selectedUserIds.includes(u._id);
                  return (
                    <div
                      key={u._id}
                      onClick={() => toggleUserSelection(u._id)}
                      className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-colors ${
                        isChecked
                          ? 'border-brand-600 bg-brand-500/10'
                          : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                      }`}
                    >
                      <div>
                        <p className="text-xs font-bold text-slate-900 dark:text-white">
                          {u.name}
                        </p>
                        <p className="text-[11px] text-slate-500">{u.email}</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 font-semibold">
                          {u.tokenCount || 1} active device(s)
                        </span>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {}}
                          className="h-4 w-4 text-brand-600 rounded"
                        />
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
              <span className="text-xs font-bold text-slate-600 dark:text-slate-400">
                {selectedUserIds.length} user(s) selected
              </span>
              <button
                type="button"
                onClick={() => setShowUserSelectModal(false)}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-brand-600 text-white hover:bg-brand-500"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
