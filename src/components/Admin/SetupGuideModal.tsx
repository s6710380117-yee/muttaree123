import React from 'react';
import {
  X,
  FileQuestion,
  Key,
  ShieldCheck,
  CheckCircle,
  Database,
  HardDrive,
  Users,
  ExternalLink,
  BookOpen,
} from 'lucide-react';
import firebaseConfig from '../../../firebase-applet-config.json';
import { BOOTSTRAP_ADMIN_EMAIL } from '../../firebase';

interface SetupGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SetupGuideModal: React.FC<SetupGuideModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const currentHost = window.location.hostname;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="relative bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-blue-700 via-sky-600 to-indigo-700 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center">
              <FileQuestion className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold font-['Prompt']">
                คู่มือการตั้งค่า Firebase Console และการทดสอบระบบจริง
              </h2>
              <p className="text-xs text-blue-100">
                Project ID: <span className="font-mono bg-blue-900/50 px-1.5 py-0.5 rounded-sm">{firebaseConfig.projectId}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-white/80 hover:text-white rounded-xl hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-sm text-slate-700">
          {/* Section 1: Auth Setup */}
          <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-200 space-y-3">
            <div className="flex items-center gap-2 text-blue-900 font-bold text-base">
              <Key className="w-5 h-5 text-blue-600" />
              <h3>1. เปิดใช้งานระบบ Authentication ใน Firebase Console</h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              ไปที่{' '}
              <a
                href={`https://console.firebase.google.com/project/${firebaseConfig.projectId}/authentication/providers`}
                target="_blank"
                rel="noreferrer"
                className="text-blue-600 font-bold hover:underline inline-flex items-center gap-1"
              >
                Firebase Console &gt; Authentication &gt; Sign-in method <ExternalLink className="w-3 h-3" />
              </a>{' '}
              และเปิดใช้งานผู้ให้บริการดังนี้:
            </p>
            <ul className="text-xs space-y-2 pl-4 list-disc text-slate-700">
              <li>
                <strong>Email/Password (อีเมล/รหัสผ่าน):</strong> กดเปิดใช้งาน (Enable) เพื่อให้ผู้ใช้สามารถสมัครสมาชิกและเข้าสู่ระบบด้วยอีเมล พร้อมรับอีเมลยืนยันตัวตนจริง
              </li>
              <li>
                <strong>Google Sign-In:</strong> กดเปิดใช้งาน (Enable) และบันทึก
              </li>
              <li>
                <strong>Authorized Domains:</strong> ไปที่แท็บ <em>Settings &gt; Authorized domains</em> และตรวจสอบว่ามีโดเมน <code className="bg-white px-2 py-0.5 rounded-sm border border-blue-200 font-mono text-blue-700">{currentHost}</code> อยู่ในรายการแล้วหรือไม่ หากยังไม่มีให้กด Add domain
              </li>
            </ul>
          </div>

          {/* Section 2: Firebase Storage Setup */}
          <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-200 space-y-3">
            <div className="flex items-center gap-2 text-indigo-900 font-bold text-base">
              <HardDrive className="w-5 h-5 text-indigo-600" />
              <h3>2. เปิดใช้งาน Firebase Storage (สำหรับอัปโหลดไฟล์จริง)</h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              ไปที่{' '}
              <a
                href={`https://console.firebase.google.com/project/${firebaseConfig.projectId}/storage`}
                target="_blank"
                rel="noreferrer"
                className="text-indigo-600 font-bold hover:underline inline-flex items-center gap-1"
              >
                Firebase Console &gt; Storage <ExternalLink className="w-3 h-3" />
              </a>{' '}
              หากยังไม่เคยกด Get Started ให้กดเปิดใช้งาน แล้วตั้งกฎ Security Rules สำหรับ Storage ดังนี้:
            </p>
            <div className="p-3 bg-slate-900 text-sky-300 font-mono text-xs rounded-xl overflow-x-auto">
              <code>{`rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}`}</code>
            </div>
          </div>

          {/* Section 3: Bootstrap Admin Info */}
          <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 space-y-3">
            <div className="flex items-center gap-2 text-emerald-900 font-bold text-base">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
              <h3>3. บัญชีผู้ดูแลระบบสูงสุด (Super Admin Bootstrap)</h3>
            </div>
            <p className="text-xs text-slate-700 leading-relaxed">
              ระบบได้กำหนดให้อีเมลต่อไปนี้ได้รับสิทธิ์ <strong>Admin อัตโนมัติ</strong>:
            </p>
            <div className="bg-white p-3 rounded-xl border border-emerald-300 flex items-center justify-between">
              <span className="font-mono text-xs font-bold text-emerald-800">
                {BOOTSTRAP_ADMIN_EMAIL}
              </span>
              <span className="text-[11px] bg-emerald-100 text-emerald-800 font-semibold px-2 py-0.5 rounded-md">
                Admin ผู้สร้างโปรเจกต์
              </span>
            </div>
            <p className="text-xs text-slate-500">
              เมื่อคุณสมัครสมาชิกหรือเข้าสู่ระบบด้วยอีเมลนี้ ระบบจะให้สิทธิ์ Admin ทันที สามารถเข้าถึงแผงควบคุม จัดการรายงานเนื้อหา สมาชิก และตั้งค่าหมวดหมู่ได้ทั้งหมด
            </p>
          </div>

          {/* Section 4: Testing Procedure */}
          <div className="p-4 rounded-2xl bg-slate-100 border border-slate-200 space-y-3">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-base">
              <CheckCircle className="w-5 h-5 text-blue-600" />
              <h3>4. ขั้นตอนการทดสอบระบบจริง (Testing Guide)</h3>
            </div>
            <ol className="text-xs space-y-2 pl-4 list-decimal text-slate-700">
              <li>
                <strong>ทดสอบการค้นหาและเปิดดูสื่อ:</strong> บุคคลทั่วไปสามารถพิมพ์ค้นหา กรองหมวดหมู่ ระดับชั้น และเปิดดูสื่อการสอนหรือคลิป YouTube ได้ทันที
              </li>
              <li>
                <strong>ทดสอบการสมัครสมาชิกและเข้าสู่ระบบ:</strong> กดปุ่ม "สมัครสมาชิก" กรอกชื่อ อีเมล รหัสผ่าน (มีปุ่มซ่อน/แสดงรหัสผ่าน) ระบบจะส่งอีเมลยืนยันตัวตนจริง
              </li>
              <li>
                <strong>ทดสอบการแบ่งปันสื่อความรู้:</strong> กดปุ่ม "+ แบ่งปันความรู้" กรอกชื่อ คำอธิบาย เลือกหมวดหมู่ ระดับชั้น แนบลิงก์หรืออัปโหลดไฟล์ แล้วกดบันทึก ข้อมูลจะซิงค์ไปยัง Cloud Firestore จริงทันที
              </li>
              <li>
                <strong>ทดสอบระบบรายการโปรด (Favorites):</strong> กดไอคอนหัวใจที่การ์ดสื่อความรู้ ข้อมูลจะถูกบันทึกแยกตาม UID ในคอลเลกชัน <code>favorites</code> และแสดงจำนวนตัวเลขตรงกันทุกอุปกรณ์
              </li>
              <li>
                <strong>ทดสอบการรายงานเนื้อหา (Reports):</strong> สมาชิกสามารถกดปุ่ม "รายงานเนื้อหา" เพื่อแจ้งลิงก์เสียหรือเนื้อหาไม่เหมาะสม
              </li>
              <li>
                <strong>ทดสอบ Admin Dashboard:</strong> สมาชิกที่มีสิทธิ์ Admin สามารถเปิดแผงควบคุมเพื่อตรวจสอบรายงาน, ระงับ/ปลดระงับสมาชิก, หรือเพิ่มหมวดหมู่ใหม่ผ่านหน้าเว็บได้ทันที
              </li>
            </ol>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs sm:text-sm transition cursor-pointer shadow-xs"
          >
            เข้าใจแล้ว เริ่มใช้งานระบบ
          </button>
        </div>
      </div>
    </div>
  );
};
