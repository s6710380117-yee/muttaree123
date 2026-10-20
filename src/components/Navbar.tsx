import React, { useState } from 'react';
import {
  GraduationCap,
  PlusCircle,
  Bookmark,
  Shield,
  LogOut,
  User,
  Menu,
  X,
  Compass,
  FileQuestion,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';

interface NavbarProps {
  onOpenAuth: (initialTab?: 'login' | 'register') => void;
  onOpenPost: () => void;
  onOpenFavorites: () => void;
  onOpenAdmin: () => void;
  onOpenSetupGuide: () => void;
  onGoHome: () => void;
  favoritesCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenAuth,
  onOpenPost,
  onOpenFavorites,
  onOpenAdmin,
  onOpenSetupGuide,
  onGoHome,
  favoritesCount,
}) => {
  const { currentUser, userProfile, isAdmin, isModerator, isSuspended, logout } = useAuth();
  const { settings } = useSettings();
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  const getRoleBadge = () => {
    if (isAdmin) {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full">
          <Shield className="w-3 h-3" />
          ผู้ดูแลระบบ (Admin)
        </span>
      );
    }
    if (isModerator) {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
          <Shield className="w-3 h-3" />
          ผู้ตรวจสอบ (Moderator)
        </span>
      );
    }
    return (
      <span className="text-[11px] font-semibold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full">
        สมาชิก (Member)
      </span>
    );
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
      {/* Announcement Banner */}
      {settings.bannerActive && settings.announcementBanner && (
        <div className="bg-gradient-to-r from-blue-700 via-sky-600 to-indigo-700 text-white text-xs sm:text-sm py-1.5 px-4 text-center font-medium shadow-inner flex items-center justify-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-yellow-300 animate-pulse shrink-0" />
          <span className="truncate">{settings.announcementBanner}</span>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={onGoHome}>
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-sky-500 flex items-center justify-center text-white shadow-md shadow-blue-500/25 ring-2 ring-blue-100">
              <GraduationCap className="w-6 h-6 sm:w-7 sm:h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg sm:text-xl font-bold tracking-tight text-slate-900 font-['Prompt']">
                  {settings.siteName || 'คลังปัญญา'}
                </span>
                <span className="hidden md:inline-flex px-2 py-0.5 text-[10px] font-bold bg-blue-100 text-blue-800 rounded-md">
                  HUB
                </span>
              </div>
              <p className="text-xs text-slate-500 hidden sm:block truncate max-w-xs md:max-w-md">
                {settings.siteDescription || 'ศูนย์รวมและแบ่งปันสื่อการเรียนรู้'}
              </p>
            </div>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-1">
            <button
              onClick={onGoHome}
              className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-slate-700 hover:text-blue-600 rounded-lg hover:bg-slate-50 transition-colors"
            >
              <Compass className="w-4 h-4 text-slate-400" />
              สำรวจความรู้
            </button>

            {currentUser && (
              <button
                onClick={onOpenFavorites}
                className="relative flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-slate-700 hover:text-blue-600 rounded-lg hover:bg-slate-50 transition-colors"
              >
                <Bookmark className="w-4 h-4 text-slate-400" />
                รายการโปรด
                {favoritesCount > 0 && (
                  <span className="ml-1 px-1.5 py-0.2 text-[10px] font-bold bg-amber-500 text-white rounded-full">
                    {favoritesCount}
                  </span>
                )}
              </button>
            )}

            {(isAdmin || isModerator) && (
              <button
                onClick={onOpenAdmin}
                className="flex items-center gap-1.5 px-3 py-2 text-sm font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200/80 rounded-lg transition-colors"
              >
                <Shield className="w-4 h-4" />
                แผงควบคุม (Admin)
              </button>
            )}

            <button
              onClick={onOpenSetupGuide}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-500 hover:text-blue-600 rounded-lg hover:bg-slate-50 transition-colors"
              title="คู่มือการตั้งค่า Firebase Console"
            >
              <FileQuestion className="w-3.5 h-3.5 text-slate-400" />
              คู่มือตั้งค่า
            </button>
          </div>

          {/* Action & User Section */}
          <div className="hidden sm:flex items-center gap-3">
            <button
              onClick={() => {
                if (!currentUser) {
                  onOpenAuth('login');
                } else if (isSuspended) {
                  alert('บัญชีของคุณถูกระงับการใช้งานชั่วคราว ไม่สามารถโพสต์สื่อได้');
                } else {
                  onOpenPost();
                }
              }}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-sky-600 hover:from-blue-700 hover:to-sky-700 text-white text-sm font-semibold rounded-xl shadow-md shadow-blue-500/20 transition-all hover:scale-[1.02] cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>แบ่งปันความรู้</span>
            </button>

            {currentUser ? (
              <div className="relative">
                <button
                  onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                  className="flex items-center gap-2 p-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 transition cursor-pointer"
                >
                  <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm overflow-hidden">
                    {currentUser.photoURL ? (
                      <img src={currentUser.photoURL} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      currentUser.displayName?.[0]?.toUpperCase() || <User className="w-4 h-4" />
                    )}
                  </div>
                  <div className="text-left hidden md:block pr-1">
                    <p className="text-xs font-bold text-slate-800 leading-tight truncate max-w-[120px]">
                      {currentUser.displayName || 'ผู้ใช้งาน'}
                    </p>
                    <p className="text-[10px] text-slate-400 truncate max-w-[120px]">
                      {currentUser.email}
                    </p>
                  </div>
                </button>

                {/* Profile Dropdown */}
                {profileDropdownOpen && (
                  <div
                    className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-slate-100 py-3 z-50 animate-in fade-in slide-in-from-top-2"
                    onMouseLeave={() => setProfileDropdownOpen(false)}
                  >
                    <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/60 rounded-t-xl -mt-3">
                      <p className="text-xs text-slate-500">เข้าสู่ระบบด้วย</p>
                      <p className="text-sm font-bold text-slate-900 truncate">
                        {currentUser.displayName || 'ผู้ใช้งาน'}
                      </p>
                      <p className="text-xs text-slate-500 truncate mb-2">{currentUser.email}</p>
                      <div className="flex items-center gap-2">
                        {getRoleBadge()}
                        {currentUser.emailVerified ? (
                          <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full font-medium">
                            ยืนยันอีเมลแล้ว
                          </span>
                        ) : (
                          <span className="text-[10px] bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full font-medium">
                            ยังไม่ยืนยันอีเมล
                          </span>
                        )}
                      </div>
                      {isSuspended && (
                        <div className="mt-2 text-[11px] bg-rose-100 text-rose-800 p-1.5 rounded-lg font-medium">
                          สถานะบัญชี: ถูกระงับการใช้งาน
                        </div>
                      )}
                    </div>

                    <div className="py-2 px-2 text-sm">
                      <button
                        onClick={() => {
                          setProfileDropdownOpen(false);
                          onOpenFavorites();
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-slate-700 hover:bg-slate-100 rounded-lg text-left"
                      >
                        <Bookmark className="w-4 h-4 text-amber-500" />
                        <span>รายการโปรดของฉัน</span>
                        {favoritesCount > 0 && (
                          <span className="ml-auto text-xs bg-slate-200 px-1.5 py-0.5 rounded-full text-slate-700">
                            {favoritesCount}
                          </span>
                        )}
                      </button>

                      {(isAdmin || isModerator) && (
                        <button
                          onClick={() => {
                            setProfileDropdownOpen(false);
                            onOpenAdmin();
                          }}
                          className="w-full flex items-center gap-2 px-3 py-2 text-rose-700 hover:bg-rose-50 rounded-lg text-left font-medium"
                        >
                          <Shield className="w-4 h-4" />
                          <span>แผงควบคุมระบบ (Admin Panel)</span>
                        </button>
                      )}
                    </div>

                    <div className="border-t border-slate-100 pt-2 px-2">
                      <button
                        onClick={async () => {
                          setProfileDropdownOpen(false);
                          await logout();
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg text-left text-sm font-medium"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>ออกจากระบบ</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onOpenAuth('login')}
                  className="px-3.5 py-2 text-sm font-semibold text-slate-700 hover:text-blue-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                >
                  เข้าสู่ระบบ
                </button>
                <button
                  onClick={() => onOpenAuth('register')}
                  className="px-4 py-2 bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 text-sm font-semibold rounded-xl transition cursor-pointer"
                >
                  สมัครสมาชิก
                </button>
              </div>
            )}
          </div>

          {/* Mobile hamburger button */}
          <div className="flex sm:hidden items-center gap-2">
            <button
              onClick={() => {
                if (!currentUser) onOpenAuth('login');
                else onOpenPost();
              }}
              className="p-2 bg-blue-600 text-white rounded-xl shadow-xs"
              title="แบ่งปันความรู้"
            >
              <PlusCircle className="w-5 h-5" />
            </button>
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="p-2 text-slate-600 hover:text-slate-900 rounded-xl hover:bg-slate-100"
              aria-label="เมนู"
            >
              {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {menuOpen && (
        <div className="sm:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-6 space-y-3 animate-in slide-in-from-top-2">
          {currentUser ? (
            <div className="p-3 bg-slate-50 rounded-xl mb-2">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-9 h-9 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-sm">
                  {currentUser.displayName?.[0]?.toUpperCase() || 'U'}
                </div>
                <div>
                  <div className="text-sm font-bold text-slate-900">{currentUser.displayName}</div>
                  <div className="text-xs text-slate-500">{currentUser.email}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {getRoleBadge()}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2 mb-3">
              <button
                onClick={() => {
                  setMenuOpen(false);
                  onOpenAuth('login');
                }}
                className="w-full py-2 bg-slate-100 text-slate-700 font-semibold rounded-xl text-center text-sm"
              >
                เข้าสู่ระบบ
              </button>
              <button
                onClick={() => {
                  setMenuOpen(false);
                  onOpenAuth('register');
                }}
                className="w-full py-2 bg-blue-600 text-white font-semibold rounded-xl text-center text-sm"
              >
                สมัครสมาชิก
              </button>
            </div>
          )}

          <div className="space-y-1">
            <button
              onClick={() => {
                setMenuOpen(false);
                onGoHome();
              }}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 rounded-lg text-left"
            >
              <Compass className="w-4 h-4 text-blue-600" />
              <span>สำรวจคลังความรู้</span>
            </button>

            {currentUser && (
              <button
                onClick={() => {
                  setMenuOpen(false);
                  onOpenFavorites();
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 rounded-lg text-left"
              >
                <Bookmark className="w-4 h-4 text-amber-500" />
                <span>รายการโปรด ({favoritesCount})</span>
              </button>
            )}

            {(isAdmin || isModerator) && (
              <button
                onClick={() => {
                  setMenuOpen(false);
                  onOpenAdmin();
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-rose-700 font-semibold bg-rose-50 rounded-lg text-left"
              >
                <Shield className="w-4 h-4" />
                <span>แผงควบคุมผู้ดูแลระบบ (Admin)</span>
              </button>
            )}

            <button
              onClick={() => {
                setMenuOpen(false);
                onOpenSetupGuide();
              }}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 rounded-lg text-left"
            >
              <FileQuestion className="w-4 h-4 text-slate-400" />
              <span>คู่มือการตั้งค่า Firebase Console</span>
            </button>
          </div>

          {currentUser && (
            <div className="pt-2 border-t border-slate-200">
              <button
                onClick={async () => {
                  setMenuOpen(false);
                  await logout();
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 font-medium rounded-lg text-left"
              >
                <LogOut className="w-4 h-4" />
                <span>ออกจากระบบ</span>
              </button>
            </div>
          )}
        </div>
      )}
    </header>
  );
};
