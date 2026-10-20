import React, { useState } from 'react';
import { X, Flag, AlertTriangle, Check, Loader2 } from 'lucide-react';
import { doc, setDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { ResourceItem, ReportReason, ReportItem } from '../types';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  resource: ResourceItem | null;
  onSuccess: (message: string) => void;
}

export const ReportModal: React.FC<ReportModalProps> = ({
  isOpen,
  onClose,
  resource,
  onSuccess,
}) => {
  const { currentUser } = useAuth();
  const [reason, setReason] = useState<ReportReason>('broken_link');
  const [details, setDetails] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen || !resource) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!currentUser) {
      setError('กรุณาเข้าสู่ระบบก่อนส่งรายงาน');
      return;
    }

    setIsSubmitting(true);
    try {
      const reportId = `rep_${Date.now()}_${Math.random().toString(36).substring(7)}`;
      const payload: ReportItem = {
        id: reportId,
        resourceId: resource.id,
        resourceTitle: resource.title,
        reporterId: currentUser.uid,
        reporterEmail: currentUser.email || '',
        reason,
        details: details.trim(),
        status: 'pending',
        createdAt: new Date().toISOString(),
      };

      await setDoc(doc(db, 'reports', reportId), payload);
      onSuccess('ส่งรายงานเนื้อหาเรียบร้อยแล้ว ทีมงานและผู้ดูแลจะตรวจสอบโดยเร็วที่สุด');
      onClose();
    } catch (err) {
      console.error('Report submission error:', err);
      handleFirestoreError(err, OperationType.CREATE, 'reports');
      setError('เกิดข้อผิดพลาดในการส่งรายงาน');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="relative bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in zoom-in-95">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-amber-50/70">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-500 text-white flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 font-['Prompt']">
                รายงานเนื้อหาที่ไม่เหมาะสม
              </h3>
              <p className="text-xs text-slate-500">ช่วยกันรักษามาตรฐานคลังปัญญา</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-200/60 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-sm">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs text-slate-500 mb-1">สื่อที่กำลังรายงาน</label>
            <p className="font-bold text-slate-800 text-sm bg-slate-50 p-2.5 rounded-xl border border-slate-100 line-clamp-1">
              {resource.title}
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              สาเหตุในการรายงาน <span className="text-rose-500">*</span>
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value as ReportReason)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-900 bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            >
              <option value="broken_link">ลิงก์เสีย / ไฟล์ดาวน์โหลดไม่ได้</option>
              <option value="copyright">ละเมิดลิขสิทธิ์ / เจ้าของไม่อนุญาต</option>
              <option value="inappropriate">เนื้อหาไม่เหมาะสม / ภาษาหยาบคาย</option>
              <option value="incorrect_info">ข้อมูลไม่ถูกต้อง / ผิดพลาดทางวิชาการ</option>
              <option value="other">สาเหตุอื่นๆ</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              รายละเอียดเพิ่มเติม
            </label>
            <textarea
              rows={3}
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="ระบุข้อบกพร่อง หรือข้อความเพื่อช่วยให้ผู้ดูแลตรวจสอบได้เร็วขึ้น..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-xs sm:text-sm"
              maxLength={1000}
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-slate-600 hover:bg-slate-100 font-semibold rounded-xl text-xs sm:text-sm transition"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 px-5 py-2 bg-amber-600 hover:bg-amber-700 disabled:bg-amber-300 text-white font-bold rounded-xl text-xs sm:text-sm transition cursor-pointer shadow-xs"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>กำลังส่ง...</span>
                </>
              ) : (
                <>
                  <Flag className="w-4 h-4" />
                  <span>ส่งรายงาน</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
