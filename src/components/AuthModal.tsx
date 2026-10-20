import React, { useState } from 'react';
import {
  X,
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  Loader2,
  GraduationCap,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'login' | 'register';
  onSuccess: (message: string) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'login',
  onSuccess,
}) => {
  const { loginWithEmail, registerWithEmail, loginWithGoogle, resetPassword } = useAuth();

  const [activeTab, setActiveTab] = useState<'login' | 'register' | 'forgot'>(initialTab);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successInfo, setSuccessInfo] = useState('');

  if (!isOpen) return null;

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessInfo('');
    setIsLoading(true);

    try {
      if (activeTab === 'login') {
        await loginWithEmail(email.trim(), password);
        onSuccess('เข้าสู่ระบบสำเร็จ ยินดีต้อนรับ!');
        onClose();
      } else if (activeTab === 'register') {
        if (!name.trim()) {
          setErrorMessage('กรุณาระบุชื่อ-นามสกุล หรือชื่อที่ใช้แสดง');
          setIsLoading(false);
          return;
        }
        if (password.length < 6) {
          setErrorMessage('รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร');
          setIsLoading(false);
          return;
        }
        await registerWithEmail(email.trim(), password, name.trim());
        onSuccess('สมัครสมาชิกสำเร็จ ระบบได้ส่งอีเมลยืนยันตัวตนไปยังกล่องจดหมายของคุณแล้ว!');
        onClose();
      } else if (activeTab === 'forgot') {
        if (!email.trim()) {
          setErrorMessage('กรุณาระบุอีเมลที่ต้องการรีเซ็ตรหัสผ่าน');
          setIsLoading(false);
          return;
        }
        await resetPassword(email.trim());
        setSuccessInfo(`ระบบได้ส่งลิงก์ตั้งรหัสผ่านใหม่ไปยัง ${email} แล้ว กรุณาตรวจสอบกล่องข้อความหรืออีเมลขยะ`);
      }
    } catch (err: any) {
      console.error('Auth error:', err);
      let msg = 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง';
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        msg = 'อีเมลหรือรหัสผ่านไม่ถูกต้อง';
      } else if (err.code === 'auth/email-already-in-use') {
        msg = 'อีเมลนี้ถูกใช้งานแล้วในระบบ กรุณาเข้าสู่ระบบแทน';
      } else if (err.code === 'auth/weak-password') {
        msg = 'รหัสผ่านง่ายเกินไป ต้องมีอย่างน้อย 6 ตัวอักษร';
      } else if (err.code === 'auth/invalid-email') {
        msg = 'รูปแบบอีเมลไม่ถูกต้อง';
      } else if (err.code === 'auth/popup-closed-by-user') {
        msg = 'หน้าต่างเข้าสู่ระบบด้วย Google ถูกปิดก่อนทำรายการเสร็จสิ้น';
      }
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setErrorMessage('');
    setIsLoading(true);
    try {
      await loginWithGoogle();
      onSuccess('เข้าสู่ระบบด้วย Google สำเร็จ!');
      onClose();
    } catch (err: any) {
      console.error('Google sign in error:', err);
      if (err.code === 'auth/popup-closed-by-user') {
        setErrorMessage('การเข้าสู่ระบบด้วย Google ถูกยกเลิก');
      } else {
        setErrorMessage('ไม่สามารถเข้าสู่ระบบด้วย Google ได้ในขณะนี้');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="relative bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in zoom-in-95">
        {/* Top Header */}
        <div className="bg-gradient-to-r from-blue-700 via-blue-600 to-sky-600 text-white p-6 text-center relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 text-white/80 hover:text-white rounded-xl hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="w-12 h-12 bg-white/20 backdrop-blur-xs rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-inner">
            <GraduationCap className="w-7 h-7 text-white" />
          </div>
          <h3 className="text-xl font-bold font-['Prompt']">
            {activeTab === 'login'
              ? 'เข้าสู่ระบบคลังปัญญา'
              : activeTab === 'register'
              ? 'สมัครสมาชิกใหม่'
              : 'รีเซ็ตรหัสผ่าน'}
          </h3>
          <p className="text-xs text-blue-100 mt-1">
            {activeTab === 'login'
              ? 'ยินดีต้อนรับสู่พื้นที่แห่งการเรียนรู้ร่วมกัน'
              : activeTab === 'register'
              ? 'ร่วมเป็นส่วนหนึ่งในการแบ่งปันและเข้าถึงสื่อการสอน'
              : 'กรอกอีเมลเพื่อรับลิงก์สำหรับตั้งรหัสผ่านใหม่'}
          </p>
        </div>

        {/* Tab switchers if not forgot */}
        {activeTab !== 'forgot' && (
          <div className="grid grid-cols-2 border-b border-slate-100 bg-slate-50 text-xs font-bold text-center">
            <button
              onClick={() => {
                setActiveTab('login');
                setErrorMessage('');
                setSuccessInfo('');
              }}
              className={`py-3 transition cursor-pointer ${
                activeTab === 'login'
                  ? 'bg-white text-blue-600 border-b-2 border-blue-600'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              เข้าสู่ระบบ
            </button>
            <button
              onClick={() => {
                setActiveTab('register');
                setErrorMessage('');
                setSuccessInfo('');
              }}
              className={`py-3 transition cursor-pointer ${
                activeTab === 'register'
                  ? 'bg-white text-blue-600 border-b-2 border-blue-600'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              สมัครสมาชิก
            </button>
          </div>
        )}

        {/* Form Body */}
        <div className="p-6">
          {errorMessage && (
            <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-start gap-2 text-xs">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successInfo && (
            <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-start gap-2 text-xs">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>{successInfo}</span>
            </div>
          )}

          <form onSubmit={handleAuthSubmit} className="space-y-4 text-sm">
            {/* Display Name for Register */}
            {activeTab === 'register' && (
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  ชื่อ - นามสกุล หรือ นามแฝง <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="เช่น ดร.สมชาย ใจดี หรือ ครูวิทย์"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-slate-900 text-xs sm:text-sm"
                  />
                </div>
              </div>
            )}

            {/* Email */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                อีเมล (Email Address) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-slate-900 text-xs sm:text-sm"
                />
              </div>
            </div>

            {/* Password (if not forgot) */}
            {activeTab !== 'forgot' && (
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    รหัสผ่าน (Password) <span className="text-rose-500">*</span>
                  </label>
                  {activeTab === 'login' && (
                    <button
                      type="button"
                      onClick={() => {
                        setActiveTab('forgot');
                        setErrorMessage('');
                        setSuccessInfo('');
                      }}
                      className="text-xs text-blue-600 hover:underline cursor-pointer"
                    >
                      ลืมรหัสผ่าน?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="ความยาวอย่างน้อย 6 ตัวอักษร"
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-slate-900 text-xs sm:text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 p-0.5"
                    aria-label={showPassword ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-bold rounded-xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer mt-2"
            >
              {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>
                {activeTab === 'login'
                  ? 'เข้าสู่ระบบ'
                  : activeTab === 'register'
                  ? 'ยืนยันการสมัครสมาชิก'
                  : 'ส่งอีเมลรีเซ็ตรหัสผ่าน'}
              </span>
            </button>
          </form>

          {/* Back to login if forgot */}
          {activeTab === 'forgot' && (
            <div className="mt-4 text-center">
              <button
                type="button"
                onClick={() => {
                  setActiveTab('login');
                  setErrorMessage('');
                  setSuccessInfo('');
                }}
                className="text-xs text-blue-600 font-semibold hover:underline"
              >
                ← กลับสู่หน้าเข้าสู่ระบบ
              </button>
            </div>
          )}

          {/* Social login divider if not forgot */}
          {activeTab !== 'forgot' && (
            <>
              <div className="relative my-5">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-white px-3 text-slate-400">หรือเข้าสู่ระบบด้วย</span>
                </div>
              </div>

              {/* Google Sign-In */}
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={isLoading}
                className="w-full py-2.5 px-4 border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold rounded-xl text-xs sm:text-sm transition flex items-center justify-center gap-3 cursor-pointer shadow-xs"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>ดำเนินการต่อด้วยบัญชี Google</span>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
