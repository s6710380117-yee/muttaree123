import React, { useState, useEffect } from 'react';
import {
  X,
  Shield,
  FileText,
  Users,
  Settings,
  AlertTriangle,
  CheckCircle2,
  Trash2,
  EyeOff,
  Eye,
  Plus,
  Search,
  UserCheck,
  UserX,
  RefreshCw,
  Bell,
  Sliders,
  Sparkles,
  History,
} from 'lucide-react';
import {
  collection,
  query,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  setDoc,
  orderBy,
  limit,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../../firebase';
import { useAuth } from '../../context/AuthContext';
import { useSettings } from '../../context/SettingsContext';
import {
  ResourceItem,
  ReportItem,
  UserProfile,
  UserRole,
  UserStatus,
  ModerationLogItem,
} from '../../types';

interface AdminDashboardProps {
  isOpen: boolean;
  onClose: () => void;
  onRefreshResources: () => void;
  onToast: (type: 'success' | 'error' | 'info', msg: string) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  isOpen,
  onClose,
  onRefreshResources,
  onToast,
}) => {
  const { currentUser, isAdmin, isModerator } = useAuth();
  const { settings, updateSettings, addCategory, removeCategory } = useSettings();

  const [activeTab, setActiveTab] = useState<'reports' | 'members' | 'settings' | 'logs'>('reports');
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [usersList, setUsersList] = useState<UserProfile[]>([]);
  const [logs, setLogs] = useState<ModerationLogItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [userSearchQuery, setUserSearchQuery] = useState('');

  // Site settings state in admin
  const [siteName, setSiteName] = useState(settings.siteName);
  const [siteDesc, setSiteDesc] = useState(settings.siteDescription);
  const [bannerText, setBannerText] = useState(settings.announcementBanner || '');
  const [bannerActive, setBannerActive] = useState(settings.bannerActive);
  const [newCatName, setNewCatName] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Sync settings when opened
  useEffect(() => {
    setSiteName(settings.siteName);
    setSiteDesc(settings.siteDescription);
    setBannerText(settings.announcementBanner || '');
    setBannerActive(settings.bannerActive);
  }, [settings]);

  // Load admin data
  const loadReports = async () => {
    try {
      setIsLoading(true);
      const q = query(collection(db, 'reports'));
      const snap = await getDocs(q);
      const items: ReportItem[] = [];
      snap.forEach((d) => items.push(d.data() as ReportItem));
      // Sort pending first
      items.sort((a, b) => (a.status === 'pending' ? -1 : 1));
      setReports(items);
    } catch (err) {
      console.error('Error fetching reports:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      setIsLoading(true);
      const snap = await getDocs(collection(db, 'users'));
      const items: UserProfile[] = [];
      snap.forEach((d) => items.push(d.data() as UserProfile));
      setUsersList(items);
    } catch (err) {
      console.error('Error loading users:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const loadLogs = async () => {
    try {
      const snap = await getDocs(collection(db, 'moderationLogs'));
      const items: ModerationLogItem[] = [];
      snap.forEach((d) => items.push(d.data() as ModerationLogItem));
      items.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      setLogs(items.slice(0, 50));
    } catch (err) {
      console.error('Error loading logs:', err);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadReports();
      loadUsers();
      loadLogs();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Log action helper
  const recordModeration = async (
    action: string,
    targetType: 'resource' | 'user' | 'settings' | 'report',
    targetId: string,
    targetName: string,
    details: string
  ) => {
    if (!currentUser) return;
    try {
      const logId = `log_${Date.now()}_${Math.random().toString(36).substring(7)}`;
      const logItem: ModerationLogItem = {
        id: logId,
        action,
        targetType,
        targetId,
        targetName,
        performedBy: currentUser.uid,
        performedByEmail: currentUser.email || 'Admin',
        details,
        timestamp: new Date().toISOString(),
      };
      await setDoc(doc(db, 'moderationLogs', logId), logItem);
      setLogs((prev) => [logItem, ...prev]);
    } catch (e) {
      console.error('Could not record audit log:', e);
    }
  };

  // Actions for reports
  const handleResolveReport = async (report: ReportItem, action: 'dismiss' | 'hide_resource' | 'delete_resource') => {
    try {
      if (action === 'dismiss') {
        await updateDoc(doc(db, 'reports', report.id), {
          status: 'dismissed',
          resolvedAt: new Date().toISOString(),
          resolvedBy: currentUser?.uid,
        });
        await recordModeration('dismiss_report', 'report', report.id, report.resourceTitle, 'ยกเลิกรายงานเนื่องจากไม่มีความผิดปกติ');
        onToast('info', 'ยกเลิกรายงานนี้แล้ว');
      } else if (action === 'hide_resource') {
        await updateDoc(doc(db, 'resources', report.resourceId), {
          status: 'hidden',
          updatedAt: new Date().toISOString(),
        });
        await updateDoc(doc(db, 'reports', report.id), {
          status: 'resolved',
          resolvedAt: new Date().toISOString(),
          resolvedBy: currentUser?.uid,
        });
        await recordModeration('hide_resource', 'resource', report.resourceId, report.resourceTitle, `ซ่อนสื่อตามรายงาน: ${report.reason}`);
        onToast('success', 'ซ่อนสื่อความรู้นี้จากคลังสาธารณะเรียบร้อยแล้ว');
      } else if (action === 'delete_resource') {
        await deleteDoc(doc(db, 'resources', report.resourceId));
        await updateDoc(doc(db, 'reports', report.id), {
          status: 'resolved',
          resolvedAt: new Date().toISOString(),
          resolvedBy: currentUser?.uid,
        });
        await recordModeration('delete_resource', 'resource', report.resourceId, report.resourceTitle, `ลบสื่อถาวรตามรายงาน: ${report.reason}`);
        onToast('success', 'ลบสื่อการเรียนรู้นี้ออกจากระบบถาวรเรียบร้อยแล้ว');
      }
      loadReports();
      onRefreshResources();
    } catch (err) {
      console.error('Handle report error:', err);
      onToast('error', 'เกิดข้อผิดพลาดในการจัดการรายงาน');
    }
  };

  // User management actions
  const handleToggleUserStatus = async (user: UserProfile) => {
    const nextStatus: UserStatus = user.status === 'active' ? 'suspended' : 'active';
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        status: nextStatus,
        updatedAt: new Date().toISOString(),
      });
      await recordModeration(
        nextStatus === 'suspended' ? 'suspend_user' : 'activate_user',
        'user',
        user.uid,
        user.displayName,
        `เปลี่ยนสถานะเป็น ${nextStatus}`
      );
      setUsersList((prev) =>
        prev.map((u) => (u.uid === user.uid ? { ...u, status: nextStatus } : u))
      );
      onToast('success', `อัปเดตสถานะบัญชีของ ${user.displayName} เป็น ${nextStatus === 'active' ? 'ปกติ' : 'ระงับการใช้งาน'} แล้ว`);
    } catch (err) {
      console.error('Error toggling user status:', err);
      onToast('error', 'ไม่สามารถเปลี่ยนสถานะผู้ใช้ได้');
    }
  };

  const handleChangeUserRole = async (user: UserProfile, newRole: UserRole) => {
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        role: newRole,
        updatedAt: new Date().toISOString(),
      });

      if (newRole === 'admin' || newRole === 'moderator') {
        await setDoc(doc(db, 'admins', user.uid), {
          uid: user.uid,
          email: user.email,
          role: newRole,
          addedAt: new Date().toISOString(),
        });
      }

      await recordModeration('change_role', 'user', user.uid, user.displayName, `เปลี่ยนบทบาทเป็น ${newRole}`);
      setUsersList((prev) =>
        prev.map((u) => (u.uid === user.uid ? { ...u, role: newRole } : u))
      );
      onToast('success', `ปรับเปลี่ยนระดับสิทธิ์ของ ${user.displayName} เป็น ${newRole} สำเร็จ`);
    } catch (err) {
      console.error('Role update error:', err);
      onToast('error', 'ไม่สามารถอัปเดตสิทธิ์ได้');
    }
  };

  // Site settings save
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateSettings(
        {
          siteName: siteName.trim(),
          siteDescription: siteDesc.trim(),
          announcementBanner: bannerText.trim(),
          bannerActive,
        },
        currentUser?.email || 'admin'
      );
      await recordModeration('update_settings', 'settings', 'general', 'การตั้งค่าเว็บไซต์', 'แก้ไขข้อมูลทั่วไปและแบนเนอร์');
      onToast('success', 'บันทึกการตั้งค่าเว็บไซต์เรียบร้อยแล้ว!');
    } catch (err) {
      console.error('Settings save error:', err);
      onToast('error', 'เกิดข้อผิดพลาดในการบันทึกการตั้งค่า');
    }
  };

  // Add new category
  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    try {
      await addCategory(newCatName.trim(), currentUser?.email || 'admin');
      await recordModeration('add_category', 'settings', 'categories', newCatName.trim(), 'เพิ่มหมวดหมู่ใหม่');
      setNewCatName('');
      onToast('success', `เพิ่มหมวดหมู่ "${newCatName.trim()}" สำเร็จ`);
    } catch (err) {
      onToast('error', 'ไม่สามารถเพิ่มหมวดหมู่ได้');
    }
  };

  // Remove category
  const handleRemoveCategory = async (cat: string) => {
    if (confirm(`คุณต้องการลบหมวดหมู่ "${cat}" ออกจากระบบใช่หรือไม่?`)) {
      try {
        await removeCategory(cat, currentUser?.email || 'admin');
        await recordModeration('remove_category', 'settings', 'categories', cat, 'ลบหมวดหมู่');
        onToast('success', `ลบหมวดหมู่ "${cat}" เรียบร้อยแล้ว`);
      } catch (err) {
        onToast('error', 'เกิดข้อผิดพลาดในการลบหมวดหมู่');
      }
    }
  };

  const filteredUsers = usersList.filter(
    (u) =>
      u.displayName?.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
      u.email?.toLowerCase().includes(userSearchQuery.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/70 backdrop-blur-xs animate-in fade-in">
      <div className="relative bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden animate-in zoom-in-95">
        {/* Top Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-950 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-300">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold font-['Prompt']">แผงควบคุมผู้ดูแลระบบ (Admin Dashboard)</h2>
              <p className="text-xs text-blue-200/80">
                จัดการรายงานเนื้อหา สมาชิก และการตั้งค่าเว็บไซต์แบบ Real-Time
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-white/70 hover:text-white rounded-xl hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 px-6 bg-slate-100 border-b border-slate-200 overflow-x-auto text-xs sm:text-sm font-semibold">
          <button
            onClick={() => setActiveTab('reports')}
            className={`flex items-center gap-2 py-3 px-4 border-b-2 transition cursor-pointer ${
              activeTab === 'reports'
                ? 'border-blue-600 text-blue-600 bg-white font-bold'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            <span>รายงานเนื้อหา</span>
            {reports.filter((r) => r.status === 'pending').length > 0 && (
              <span className="bg-rose-500 text-white text-[10px] px-2 py-0.5 rounded-full font-bold">
                {reports.filter((r) => r.status === 'pending').length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('members')}
            className={`flex items-center gap-2 py-3 px-4 border-b-2 transition cursor-pointer ${
              activeTab === 'members'
                ? 'border-blue-600 text-blue-600 bg-white font-bold'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Users className="w-4 h-4 text-sky-500" />
            <span>จัดการสมาชิก ({usersList.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`flex items-center gap-2 py-3 px-4 border-b-2 transition cursor-pointer ${
              activeTab === 'settings'
                ? 'border-blue-600 text-blue-600 bg-white font-bold'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Settings className="w-4 h-4 text-indigo-500" />
            <span>ตั้งค่าเว็บไซต์ & หมวดหมู่</span>
          </button>

          <button
            onClick={() => setActiveTab('logs')}
            className={`flex items-center gap-2 py-3 px-4 border-b-2 transition cursor-pointer ${
              activeTab === 'logs'
                ? 'border-blue-600 text-blue-600 bg-white font-bold'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <History className="w-4 h-4 text-slate-500" />
            <span>ประวัติการดูแลระบบ</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6 overflow-y-auto flex-1 text-sm bg-slate-50/50">
          {/* TAB 1: REPORTS */}
          {activeTab === 'reports' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    รายการรายงานเนื้อหาที่รอตรวจสอบ
                  </h3>
                  <p className="text-xs text-slate-500">
                    ตรวจสอบสื่อที่มีสมาชิกแจ้งลิงก์เสีย ละเมิดลิขสิทธิ์ หรือเนื้อหาไม่เหมาะสม
                  </p>
                </div>
                <button
                  onClick={loadReports}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-700 hover:bg-slate-50"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>รีเฟรช</span>
                </button>
              </div>

              {reports.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-2xl border border-slate-200">
                  <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
                  <p className="text-slate-700 font-bold">ไม่มีรายการรายงานเนื้อหาที่ค้างอยู่</p>
                  <p className="text-xs text-slate-400 mt-1">
                    คลังความรู้สะอาดและเป็นระเบียบเรียบร้อยดี
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {reports.map((report) => (
                    <div
                      key={report.id}
                      className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4"
                    >
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className={`px-2 py-0.5 text-[10px] font-bold rounded-md ${
                              report.status === 'pending'
                                ? 'bg-amber-100 text-amber-800'
                                : report.status === 'resolved'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {report.status === 'pending'
                              ? 'รอตรวจสอบ'
                              : report.status === 'resolved'
                              ? 'จัดการแล้ว'
                              : 'ยกเลิก'}
                          </span>
                          <span className="text-xs font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md">
                            สาเหตุ: {report.reason}
                          </span>
                          <span className="text-xs text-slate-400">
                            แจ้งเมื่อ: {new Date(report.createdAt).toLocaleString('th-TH')}
                          </span>
                        </div>
                        <h4 className="font-bold text-slate-900 text-sm">
                          สื่อที่รายงาน: {report.resourceTitle}
                        </h4>
                        {report.details && (
                          <p className="text-xs text-slate-600 bg-slate-50 p-2 rounded-lg">
                            "{report.details}"
                          </p>
                        )}
                        <p className="text-[11px] text-slate-400">
                          ผู้รายงาน: {report.reporterEmail}
                        </p>
                      </div>

                      {/* Action buttons */}
                      {report.status === 'pending' && (
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            onClick={() => handleResolveReport(report, 'hide_resource')}
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 font-semibold text-xs rounded-xl transition cursor-pointer"
                            title="ซ่อนสื่อนี้จากคลังสาธารณะ"
                          >
                            <EyeOff className="w-3.5 h-3.5" />
                            <span>ซ่อนสื่อ</span>
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`คุณต้องการลบสื่อ "${report.resourceTitle}" ออกจากระบบถาวรใช่หรือไม่?`)) {
                                handleResolveReport(report, 'delete_resource');
                              }
                            }}
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold text-xs rounded-xl transition cursor-pointer"
                            title="ลบสื่อนี้ถาวร"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>ลบสื่อ</span>
                          </button>
                          <button
                            onClick={() => handleResolveReport(report, 'dismiss')}
                            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition cursor-pointer"
                          >
                            ยกเลิกรายงาน
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: MEMBERS */}
          {activeTab === 'members' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-base font-bold text-slate-900">รายชื่อสมาชิกในระบบ</h3>
                  <p className="text-xs text-slate-500">
                    จัดการสิทธิ์และควบคุมสถานะการใช้งานของสมาชิก
                  </p>
                </div>

                <div className="relative max-w-xs w-full">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={userSearchQuery}
                    onChange={(e) => setUserSearchQuery(e.target.value)}
                    placeholder="ค้นหาชื่อ หรืออีเมล..."
                    className="w-full pl-9 pr-3 py-1.5 bg-white rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
                      <tr>
                        <th className="px-4 py-3">สมาชิก</th>
                        <th className="px-4 py-3">อีเมล</th>
                        <th className="px-4 py-3">ระดับสิทธิ์ (Role)</th>
                        <th className="px-4 py-3">สถานะบัญชี</th>
                        <th className="px-4 py-3 text-right">การจัดการ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredUsers.map((user) => (
                        <tr key={user.uid} className="hover:bg-slate-50/80 transition">
                          <td className="px-4 py-3 font-semibold text-slate-900 flex items-center gap-2">
                            <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs shrink-0">
                              {user.displayName?.[0]?.toUpperCase() || 'U'}
                            </div>
                            <span className="truncate max-w-[140px]">{user.displayName}</span>
                          </td>
                          <td className="px-4 py-3 text-slate-600 truncate max-w-[180px]">
                            {user.email}
                          </td>
                          <td className="px-4 py-3">
                            <select
                              value={user.role}
                              onChange={(e) => handleChangeUserRole(user, e.target.value as UserRole)}
                              disabled={!isAdmin && user.role === 'admin'}
                              className="px-2 py-1 rounded-lg border border-slate-200 text-xs bg-white font-medium"
                            >
                              <option value="member">สมาชิกทั่วไป</option>
                              <option value="moderator">ผู้ตรวจสอบ (Mod)</option>
                              <option value="admin">ผู้ดูแลระบบ (Admin)</option>
                            </select>
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                user.status === 'active'
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : 'bg-rose-50 text-rose-700 border border-rose-200'
                              }`}
                            >
                              {user.status === 'active' ? 'ปกติ (Active)' : 'ถูกระงับ (Suspended)'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <button
                              onClick={() => handleToggleUserStatus(user)}
                              className={`px-3 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                                user.status === 'active'
                                  ? 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                                  : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                              }`}
                            >
                              {user.status === 'active' ? 'ระงับบัญชี' : 'ปลดระงับ'}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: SITE SETTINGS & CATEGORIES */}
          {activeTab === 'settings' && (
            <div className="space-y-6">
              {/* Site General Info Form */}
              <form onSubmit={handleSaveSettings} className="bg-white p-5 rounded-2xl border border-slate-200 space-y-4 shadow-xs">
                <h4 className="font-bold text-slate-900 text-base flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-blue-600" />
                  <span>ข้อมูลทั่วไปของเว็บไซต์</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      ชื่อเว็บไซต์ (Site Name)
                    </label>
                    <input
                      type="text"
                      required
                      value={siteName}
                      onChange={(e) => setSiteName(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      คำอธิบายเว็บไซต์ (Description)
                    </label>
                    <input
                      type="text"
                      value={siteDesc}
                      onChange={(e) => setSiteDesc(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm"
                    />
                  </div>
                </div>

                {/* Announcement Banner */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-slate-700">
                      ข้อความแถบประกาศด้านบน (Announcement Banner)
                    </label>
                    <label className="flex items-center gap-2 text-xs cursor-pointer">
                      <input
                        type="checkbox"
                        checked={bannerActive}
                        onChange={(e) => setBannerActive(e.target.checked)}
                        className="rounded-sm text-blue-600"
                      />
                      <span>เปิดแสดงแถบประกาศ</span>
                    </label>
                  </div>
                  <input
                    type="text"
                    value={bannerText}
                    onChange={(e) => setBannerText(e.target.value)}
                    placeholder="ข้อความประชาสัมพันธ์กิจกรรม หรือข่าวสารสำคัญ..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm"
                  />
                </div>

                <div className="text-right">
                  <button
                    type="submit"
                    className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs sm:text-sm transition shadow-xs cursor-pointer"
                  >
                    บันทึกการตั้งค่าทั่วไป
                  </button>
                </div>
              </form>

              {/* Dynamic Category Management */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-4 shadow-xs">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-slate-900 text-base flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-sky-500" />
                      <span>จัดการหมวดหมู่ความรู้ (Dynamic Categories)</span>
                    </h4>
                    <p className="text-xs text-slate-500">
                      เพิ่มหรือลบหมวดหมู่วิชาได้ทันทีโดยไม่ต้องแก้ไขโค้ดโปรเจกต์
                    </p>
                  </div>
                </div>

                {/* Add Category Input */}
                <form onSubmit={handleAddCategory} className="flex gap-2">
                  <input
                    type="text"
                    value={newCatName}
                    onChange={(e) => setNewCatName(e.target.value)}
                    placeholder="พิมพ์ชื่อหมวดหมู่วิชาใหม่ เช่น ภาษาจีน, หุ่นยนต์และ AI..."
                    className="flex-1 px-3.5 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs sm:text-sm transition flex items-center gap-1.5 shrink-0 cursor-pointer shadow-xs"
                  >
                    <Plus className="w-4 h-4" />
                    <span>เพิ่มหมวดหมู่</span>
                  </button>
                </form>

                {/* Categories List Chips */}
                <div className="flex flex-wrap gap-2 pt-2">
                  {settings.categories.map((cat) => (
                    <div
                      key={cat}
                      className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200/80 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-800 transition"
                    >
                      <span>{cat}</span>
                      <button
                        onClick={() => handleRemoveCategory(cat)}
                        className="text-slate-400 hover:text-rose-600 transition p-0.5 rounded-sm"
                        title="ลบหมวดหมู่นี้"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: AUDIT LOGS */}
          {activeTab === 'logs' && (
            <div className="space-y-4">
              <h3 className="text-base font-bold text-slate-900">
                ประวัติการดำเนินการของผู้ดูแลระบบ (Audit Logs)
              </h3>
              {logs.length === 0 ? (
                <p className="text-xs text-slate-400 bg-white p-6 rounded-2xl border text-center">
                  ยังไม่มีประวัติการดูแลระบบที่บันทึกไว้
                </p>
              ) : (
                <div className="space-y-2">
                  {logs.map((log) => (
                    <div
                      key={log.id}
                      className="p-3 bg-white rounded-xl border border-slate-200 flex items-center justify-between text-xs"
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md text-[10px]">
                            {log.action}
                          </span>
                          <span className="font-semibold text-slate-800">{log.targetName}</span>
                        </div>
                        <p className="text-slate-500">{log.details}</p>
                      </div>
                      <div className="text-right text-[11px] text-slate-400 shrink-0">
                        <div>โดย: {log.performedByEmail}</div>
                        <div>{new Date(log.timestamp).toLocaleString('th-TH')}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-100 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span>สิทธิ์เข้าถึง: {isAdmin ? 'ผู้ดูแลระบบสูงสุด (Super Admin)' : 'ผู้ตรวจสอบ (Moderator)'}</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-900 text-white font-semibold rounded-xl transition cursor-pointer"
          >
            ปิดหน้าต่าง
          </button>
        </div>
      </div>
    </div>
  );
};
