import React, { createContext, useContext, useEffect, useState } from 'react';
import { doc, onSnapshot, setDoc, updateDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { SiteSettings, MediaType } from '../types';

export const DEFAULT_CATEGORIES = [
  'คอมพิวเตอร์และเทคโนโลยี',
  'วิทยาศาสตร์',
  'คณิตศาสตร์',
  'ภาษาไทย',
  'ภาษาต่างประเทศ',
  'สังคมศึกษาและประวัติศาสตร์',
  'ศิลปะและดนตรี',
  'สุขศึกษาและพลศึกษา',
  'การงานอาชีพและธุรกิจ',
  'ทักษะชีวิตและการพัฒนาตนเอง'
];

export const DEFAULT_GRADES = [
  'ประถมศึกษา (ป.1 - ป.6)',
  'มัธยมศึกษาตอนต้น (ม.1 - ม.3)',
  'มัธยมศึกษาตอนปลาย (ม.4 - ม.6)',
  'อุดมศึกษา / อาชีวะ / ปริญญาตรี',
  'บุคคลทั่วไป / ครูผู้สอน'
];

export const DEFAULT_MEDIA_TYPES: { id: MediaType; label: string }[] = [
  { id: 'pdf', label: 'เอกสาร PDF' },
  { id: 'video', label: 'วิดีโอ (YouTube / MP4)' },
  { id: 'article', label: 'บทความ / สรุปเนื้อหา' },
  { id: 'slide', label: 'สไลด์นำเสนอ (PPT/Slides)' },
  { id: 'link', label: 'ลิงก์เว็บไซต์ / สื่อออนไลน์' },
  { id: 'other', label: 'สื่อการเรียนรู้อื่นๆ' },
];

const DEFAULT_SETTINGS: SiteSettings = {
  siteName: 'คลังปัญญา (Knowledge Hub)',
  siteDescription: 'ศูนย์รวมและแบ่งปันสื่อการเรียนรู้ แหล่งค้นคว้าสำหรับนักเรียน นักศึกษา และคุณครู',
  logoUrl: '',
  announcementBanner: 'ยินดีต้อนรับสู่แพลตฟอร์มแบ่งปันความรู้เพื่อการศึกษาไทย ร่วมแบ่งปันสื่อการสอนได้แล้ววันนี้!',
  bannerActive: true,
  categories: DEFAULT_CATEGORIES,
  gradeLevels: DEFAULT_GRADES,
  mediaTypes: DEFAULT_MEDIA_TYPES,
  updatedAt: new Date().toISOString(),
};

interface SettingsContextType {
  settings: SiteSettings;
  isLoading: boolean;
  updateSettings: (newSettings: Partial<SiteSettings>, adminEmail: string) => Promise<void>;
  addCategory: (categoryName: string, adminEmail: string) => Promise<void>;
  removeCategory: (categoryName: string, adminEmail: string) => Promise<void>;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<SiteSettings>(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const docRef = doc(db, 'settings', 'general');
    const unsubscribe = onSnapshot(
      docRef,
      async (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data() as SiteSettings;
          setSettings({
            ...DEFAULT_SETTINGS,
            ...data,
          });
        } else {
          // Attempt to bootstrap initial settings
          try {
            await setDoc(docRef, DEFAULT_SETTINGS);
          } catch (e) {
            // Unauthenticated guests won't be able to write, which is expected by rules
            console.log('Using local default settings');
          }
        }
        setIsLoading(false);
      },
      (error) => {
        console.warn('Settings listener fallback:', error.message);
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const updateSettings = async (newSettings: Partial<SiteSettings>, adminEmail: string) => {
    try {
      const docRef = doc(db, 'settings', 'general');
      const payload = {
        ...newSettings,
        updatedAt: new Date().toISOString(),
        updatedBy: adminEmail,
      };
      await updateDoc(docRef, payload);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, 'settings/general');
    }
  };

  const addCategory = async (categoryName: string, adminEmail: string) => {
    const trimmed = categoryName.trim();
    if (!trimmed || settings.categories.includes(trimmed)) return;
    const updated = [...settings.categories, trimmed];
    await updateSettings({ categories: updated }, adminEmail);
  };

  const removeCategory = async (categoryName: string, adminEmail: string) => {
    const updated = settings.categories.filter((c) => c !== categoryName);
    await updateSettings({ categories: updated }, adminEmail);
  };

  return (
    <SettingsContext.Provider
      value={{
        settings,
        isLoading,
        updateSettings,
        addCategory,
        removeCategory,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within SettingsProvider');
  }
  return context;
};
