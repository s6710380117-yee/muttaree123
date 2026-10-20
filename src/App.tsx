/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  setDoc,
  deleteDoc,
  updateDoc,
  increment,
  getDocs,
} from 'firebase/firestore';
import { db, testConnection, handleFirestoreError, OperationType } from './firebase';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SettingsProvider, useSettings } from './context/SettingsContext';
import { ResourceItem, FavoriteItem, MediaType, ToastMessage } from './types';
import { Navbar } from './components/Navbar';
import { HeroSearch } from './components/HeroSearch';
import { SidebarFilter } from './components/SidebarFilter';
import { ResourceCard } from './components/ResourceCard';
import { ResourceModal } from './components/ResourceModal';
import { PostResourceModal } from './components/PostResourceModal';
import { AuthModal } from './components/AuthModal';
import { ReportModal } from './components/ReportModal';
import { AdminDashboard } from './components/Admin/AdminDashboard';
import { SetupGuideModal } from './components/Admin/SetupGuideModal';
import { Breadcrumb, BreadcrumbItem } from './components/Breadcrumb';
import { EmptyState } from './components/EmptyState';
import { Toast } from './components/Toast';
import { Loader2, Plus, Sparkles, BookOpen } from 'lucide-react';

function MainApp() {
  const { currentUser, isAdmin, isModerator, isSuspended } = useAuth();
  const { settings } = useSettings();

  // Resources state
  const [resources, setResources] = useState<ResourceItem[]>([]);
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [isLoadingResources, setIsLoadingResources] = useState(true);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedGrade, setSelectedGrade] = useState('');
  const [selectedMediaType, setSelectedMediaType] = useState<MediaType | ''>('');
  const [sortBy, setSortBy] = useState<'latest' | 'views' | 'favorites'>('latest');
  const [viewMode, setViewMode] = useState<'all' | 'favorites'>('all');

  // Modals state
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authInitialTab, setAuthInitialTab] = useState<'login' | 'register'>('login');
  const [isPostOpen, setIsPostOpen] = useState(false);
  const [editingResource, setEditingResource] = useState<ResourceItem | null>(null);
  const [detailResource, setDetailResource] = useState<ResourceItem | null>(null);
  const [reportingResource, setReportingResource] = useState<ResourceItem | null>(null);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isSetupGuideOpen, setIsSetupGuideOpen] = useState(false);

  // Toast notifications
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = (type: 'success' | 'error' | 'info', message: string) => {
    const id = `toast_${Date.now()}_${Math.random()}`;
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Test connection on boot per Firebase skill
  useEffect(() => {
    testConnection();
  }, []);

  // Real-time subscription to Resources
  useEffect(() => {
    setIsLoadingResources(true);
    const resourcesRef = collection(db, 'resources');

    const unsubscribe = onSnapshot(
      resourcesRef,
      (snapshot) => {
        const items: ResourceItem[] = [];
        snapshot.forEach((docSnap) => {
          items.push(docSnap.data() as ResourceItem);
        });
        setResources(items);
        setIsLoadingResources(false);
      },
      (error) => {
        console.error('Error listening to resources:', error);
        setIsLoadingResources(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // Real-time subscription to user Favorites
  useEffect(() => {
    if (!currentUser) {
      setFavorites([]);
      return;
    }

    const favoritesQuery = query(
      collection(db, 'favorites'),
      where('userId', '==', currentUser.uid)
    );

    const unsubscribe = onSnapshot(
      favoritesQuery,
      (snapshot) => {
        const items: FavoriteItem[] = [];
        snapshot.forEach((docSnap) => {
          items.push(docSnap.data() as FavoriteItem);
        });
        setFavorites(items);
      },
      (error) => {
        console.warn('Favorites listener error:', error);
      }
    );

    return () => unsubscribe();
  }, [currentUser]);

  // Seed initial sample educational resources if collection is completely empty
  useEffect(() => {
    const seedInitialContent = async () => {
      if (isLoadingResources) return;
      if (resources.length === 0 && currentUser && (isAdmin || isModerator)) {
        try {
          const sample1: ResourceItem = {
            id: 'res_sample_cs_01',
            title: 'สรุปพื้นฐานวิทยาการคำนวณและวิทยาศาสตร์ข้อมูล (Python & Algorithm)',
            description: 'เอกสารสรุปเนื้อหาโครงสร้างข้อมูล ลูป ฟังก์ชัน และตัวอย่างโจทย์ฝึกคิดเชิงคำนวณ เหมาะสำหรับนักเรียนระดับมัธยมศึกษาตอนปลายและผู้เริ่มต้น',
            category: 'คอมพิวเตอร์และเทคโนโลยี',
            gradeLevel: 'มัธยมศึกษาตอนปลาย (ม.4 - ม.6)',
            mediaType: 'pdf',
            linkUrl: 'https://docs.python.org/3/tutorial/',
            authorId: currentUser.uid,
            authorName: currentUser.displayName || 'ครูผู้สอนคอมพิวเตอร์',
            authorEmail: currentUser.email || 'teacher@school.ac.th',
            status: 'published',
            viewCount: 124,
            favoriteCount: 15,
            tags: ['Python', 'วิทยาการคำนวณ', 'ม.ปลาย'],
            createdAt: new Date().toISOString(),
          };

          const sample2: ResourceItem = {
            id: 'res_sample_math_02',
            title: 'คลิปสอนเรื่องฟังก์ชันเอกซ์โพเนนเชียลและลอการิทึม เข้าใจง่ายใน 30 นาที',
            description: 'วิดีโอแนะนำแนวคิดสำคัญ เทคนิคการแก้สมการลอการิทึม และการประยุกต์ใช้ในชีวิตประจำวัน พร้อมเฉลยข้อสอบเตรียมสอบเข้ามหาวิทยาลัย',
            category: 'คณิตศาสตร์',
            gradeLevel: 'มัธยมศึกษาตอนปลาย (ม.4 - ม.6)',
            mediaType: 'video',
            linkUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
            authorId: currentUser.uid,
            authorName: currentUser.displayName || 'ครูคณิตศาสตร์',
            authorEmail: currentUser.email || 'teacher@school.ac.th',
            status: 'published',
            viewCount: 280,
            favoriteCount: 32,
            tags: ['คณิตศาสตร์', 'ลอการิทึม', 'ม.ปลาย'],
            createdAt: new Date().toISOString(),
          };

          await setDoc(doc(db, 'resources', sample1.id), sample1);
          await setDoc(doc(db, 'resources', sample2.id), sample2);
        } catch (e) {
          console.warn('Initial seeding fallback:', e);
        }
      }
    };

    seedInitialContent();
  }, [isLoadingResources, resources.length, currentUser, isAdmin, isModerator]);

  // Favorite toggle handler
  const handleToggleFavorite = async (resource: ResourceItem) => {
    if (!currentUser) {
      setAuthInitialTab('login');
      setIsAuthOpen(true);
      addToast('info', 'กรุณาเข้าสู่ระบบก่อนบันทึกรายการโปรด');
      return;
    }

    const favDocId = `fav_${currentUser.uid}_${resource.id}`;
    const existingIndex = favorites.findIndex((f) => f.resourceId === resource.id);
    const isCurrentlyFavorited = existingIndex >= 0;

    try {
      if (isCurrentlyFavorited) {
        await deleteDoc(doc(db, 'favorites', favDocId));
        await updateDoc(doc(db, 'resources', resource.id), {
          favoriteCount: increment(-1),
        });
        addToast('info', 'นำออกจากรายการโปรดแล้ว');
      } else {
        const newFav: FavoriteItem = {
          id: favDocId,
          userId: currentUser.uid,
          resourceId: resource.id,
          resourceTitle: resource.title,
          category: resource.category,
          createdAt: new Date().toISOString(),
        };
        await setDoc(doc(db, 'favorites', favDocId), newFav);
        await updateDoc(doc(db, 'resources', resource.id), {
          favoriteCount: increment(1),
        });
        addToast('success', 'บันทึกลงในรายการโปรดแล้ว');
      }
    } catch (err) {
      console.error('Error toggling favorite:', err);
      handleFirestoreError(err, isCurrentlyFavorited ? OperationType.DELETE : OperationType.CREATE, 'favorites');
    }
  };

  // Open resource detail and increment view count
  const handleOpenDetail = async (resource: ResourceItem) => {
    setDetailResource(resource);
    try {
      await updateDoc(doc(db, 'resources', resource.id), {
        viewCount: increment(1),
      });
    } catch (e) {
      // Non-critical
    }
  };

  // Delete resource
  const handleDeleteResource = async (resourceId: string, resourceTitle: string) => {
    if (!confirm(`คุณต้องการลบสื่อความรู้ "${resourceTitle}" ออกจากระบบใช่หรือไม่? การกระทำนี้ไม่สามารถย้อนกลับได้`)) {
      return;
    }

    try {
      await deleteDoc(doc(db, 'resources', resourceId));
      addToast('success', 'ลบสื่อความรู้เรียบร้อยแล้ว');
      if (detailResource?.id === resourceId) {
        setDetailResource(null);
      }
    } catch (err) {
      console.error('Error deleting resource:', err);
      handleFirestoreError(err, OperationType.DELETE, `resources/${resourceId}`);
      addToast('error', 'ไม่สามารถลบสื่อความรู้ได้');
    }
  };

  // Filtered & Sorted Resources List
  const filteredResources = useMemo(() => {
    let list = [...resources];

    // Status filtering: normal members only see published; authors/admins can see hidden
    list = list.filter((item) => {
      if (item.status === 'deleted') return false;
      if (item.status === 'published') return true;
      if (currentUser && (item.authorId === currentUser.uid || isAdmin || isModerator)) {
        return true;
      }
      return false;
    });

    // View mode: favorites only
    if (viewMode === 'favorites') {
      const favIds = new Set(favorites.map((f) => f.resourceId));
      list = list.filter((item) => favIds.has(item.id));
    }

    // Keyword Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (item) =>
          item.title.toLowerCase().includes(q) ||
          item.description.toLowerCase().includes(q) ||
          item.authorName.toLowerCase().includes(q) ||
          item.tags?.some((t) => t.toLowerCase().includes(q))
      );
    }

    // Category filter
    if (selectedCategory) {
      list = list.filter((item) => item.category === selectedCategory);
    }

    // Grade level filter
    if (selectedGrade) {
      list = list.filter((item) => item.gradeLevel === selectedGrade);
    }

    // Media type filter
    if (selectedMediaType) {
      list = list.filter((item) => item.mediaType === selectedMediaType);
    }

    // Sort
    if (sortBy === 'views') {
      list.sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0));
    } else if (sortBy === 'favorites') {
      list.sort((a, b) => (b.favoriteCount || 0) - (a.favoriteCount || 0));
    } else {
      // Latest
      list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    return list;
  }, [
    resources,
    favorites,
    viewMode,
    searchQuery,
    selectedCategory,
    selectedGrade,
    selectedMediaType,
    sortBy,
    currentUser,
    isAdmin,
    isModerator,
  ]);

  const totalViews = useMemo(() => {
    return resources.reduce((acc, curr) => acc + (curr.viewCount || 0), 0);
  }, [resources]);

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedCategory('');
    setSelectedGrade('');
    setSelectedMediaType('');
    setSortBy('latest');
    setViewMode('all');
  };

  // Breadcrumbs items
  const breadcrumbItems: BreadcrumbItem[] = useMemo(() => {
    const items: BreadcrumbItem[] = [
      {
        label: 'หน้าแรก',
        onClick: resetFilters,
      },
    ];

    if (viewMode === 'favorites') {
      items.push({
        label: 'รายการโปรดของฉัน',
        active: true,
      });
    } else if (selectedCategory) {
      items.push({
        label: selectedCategory,
        active: !selectedGrade && !searchQuery,
        onClick: () => {
          setSelectedGrade('');
          setSearchQuery('');
        },
      });
      if (selectedGrade) {
        items.push({
          label: selectedGrade,
          active: true,
        });
      }
    } else if (searchQuery) {
      items.push({
        label: `ค้นหา: "${searchQuery}"`,
        active: true,
      });
    } else {
      items.push({
        label: 'คลังความรู้ทั้งหมด',
        active: true,
      });
    }

    return items;
  }, [viewMode, selectedCategory, selectedGrade, searchQuery]);

  const favoritedIdsSet = useMemo(() => {
    return new Set(favorites.map((f) => f.resourceId));
  }, [favorites]);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 font-['Prompt'] text-slate-900 selection:bg-blue-200">
      {/* Toast Notifications Container */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 pointer-events-none">
        {toasts.map((toast) => (
          <div key={toast.id} className="pointer-events-auto">
            <Toast
              id={toast.id}
              type={toast.type}
              message={toast.message}
              onClose={removeToast}
            />
          </div>
        ))}
      </div>

      {/* Main Navbar */}
      <Navbar
        onOpenAuth={(tab) => {
          setAuthInitialTab(tab || 'login');
          setIsAuthOpen(true);
        }}
        onOpenPost={() => {
          setEditingResource(null);
          setIsPostOpen(true);
        }}
        onOpenFavorites={() => {
          setViewMode('favorites');
          setSelectedCategory('');
        }}
        onOpenAdmin={() => setIsAdminOpen(true)}
        onOpenSetupGuide={() => setIsSetupGuideOpen(true)}
        onGoHome={resetFilters}
        favoritesCount={favorites.length}
      />

      {/* Hero Search Section (shown on home all mode) */}
      {viewMode === 'all' && (
        <HeroSearch
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          selectedCategory={selectedCategory}
          onSelectCategory={(cat) => {
            setSelectedCategory(cat);
            setViewMode('all');
          }}
          totalResources={resources.filter((r) => r.status === 'published').length}
          totalViews={totalViews}
        />
      )}

      {/* Favorites Banner (shown when viewing favorites) */}
      {viewMode === 'favorites' && (
        <div className="bg-gradient-to-r from-amber-600 via-amber-500 to-orange-500 text-white py-8 px-4 text-center">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-2xl sm:text-3xl font-bold font-['Prompt'] mb-1">
              รายการสื่อความรู้ที่คุณถูกใจ ({favorites.length})
            </h1>
            <p className="text-xs sm:text-sm text-amber-100">
              เข้าถึงสื่อการเรียนรู้ที่คุณบันทึกไว้ได้สะดวกและรวดเร็ว ซิงค์ตรงกันทุกอุปกรณ์
            </p>
            <button
              onClick={() => setViewMode('all')}
              className="mt-4 px-4 py-1.5 bg-white text-amber-700 font-bold rounded-xl text-xs hover:bg-amber-50 transition cursor-pointer shadow-xs"
            >
              ← กลับสู่คลังความรู้ทั้งหมด
            </button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1 w-full">
        {/* Breadcrumb Navigation */}
        <div className="mb-4">
          <Breadcrumb items={breadcrumbItems} />
        </div>

        {/* 2-Column Responsive Layout: Sidebar Filters + Cards Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <SidebarFilter
              selectedCategory={selectedCategory}
              onSelectCategory={setSelectedCategory}
              selectedGrade={selectedGrade}
              onSelectGrade={setSelectedGrade}
              selectedMediaType={selectedMediaType}
              onSelectMediaType={setSelectedMediaType}
              sortBy={sortBy}
              onSortChange={setSortBy}
              onResetFilters={resetFilters}
              totalFiltered={filteredResources.length}
            />
          </div>

          {/* Resources Grid & Content View */}
          <div className="lg:col-span-3">
            {/* View Header Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-blue-600" />
                <h2 className="text-base font-bold text-slate-800">
                  {viewMode === 'favorites'
                    ? 'รายการโปรดที่บันทึกไว้'
                    : selectedCategory
                    ? `หมวดหมู่: ${selectedCategory}`
                    : 'คลังสื่อความรู้ทั้งหมด'}
                </h2>
                <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-semibold">
                  {filteredResources.length} รายการ
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    if (!currentUser) {
                      setAuthInitialTab('login');
                      setIsAuthOpen(true);
                      addToast('info', 'กรุณาเข้าสู่ระบบก่อนทำการแบ่งปัน');
                    } else if (isSuspended) {
                      addToast('error', 'บัญชีของคุณถูกระงับ ไม่สามารถแบ่งปันสื่อได้');
                    } else {
                      setEditingResource(null);
                      setIsPostOpen(true);
                    }
                  }}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-xs transition cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>แบ่งปันสื่อใหม่</span>
                </button>
              </div>
            </div>

            {/* Loading Indicator */}
            {isLoadingResources ? (
              <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-slate-200">
                <Loader2 className="w-8 h-8 text-blue-600 animate-spin mb-3" />
                <p className="text-sm font-semibold text-slate-600">กำลังโหลดสื่อความรู้จาก Cloud Firestore...</p>
                <p className="text-xs text-slate-400 mt-1">กรุณารอสักครู่ ข้อมูลกำลังซิงค์แบบเรียลไทม์</p>
              </div>
            ) : filteredResources.length === 0 ? (
              /* Empty States */
              <EmptyState
                type={
                  viewMode === 'favorites'
                    ? 'favorites'
                    : searchQuery || selectedCategory || selectedGrade || selectedMediaType
                    ? 'search'
                    : 'general'
                }
                onAction={() => {
                  if (viewMode === 'favorites') {
                    setViewMode('all');
                  } else if (searchQuery || selectedCategory || selectedGrade) {
                    resetFilters();
                  } else if (!currentUser) {
                    setAuthInitialTab('register');
                    setIsAuthOpen(true);
                  } else {
                    setEditingResource(null);
                    setIsPostOpen(true);
                  }
                }}
                actionText={
                  viewMode === 'favorites'
                    ? 'ไปสำรวจคลังความรู้'
                    : searchQuery || selectedCategory || selectedGrade
                    ? 'ล้างตัวกรองทั้งหมด'
                    : 'เริ่มแบ่งปันสื่อแรกของคุณ'
                }
              />
            ) : (
              /* Resource Cards Grid */
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {filteredResources.map((resource) => (
                  <ResourceCard
                    key={resource.id}
                    resource={resource}
                    isFavorited={favoritedIdsSet.has(resource.id)}
                    onToggleFavorite={handleToggleFavorite}
                    onOpenDetail={handleOpenDetail}
                    onEdit={(res) => {
                      setEditingResource(res);
                      setIsPostOpen(true);
                    }}
                    onDelete={handleDeleteResource}
                    onReport={(res) => setReportingResource(res)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 text-white border-t border-slate-800 mt-16 py-10 px-4 sm:px-6 lg:px-8 text-xs">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="text-center md:text-left space-y-1">
            <p className="text-base font-bold text-white font-['Prompt']">
              {settings.siteName}
            </p>
            <p className="text-slate-400 max-w-md">
              {settings.siteDescription}
            </p>
            <p className="text-[11px] text-slate-500 pt-1">
              เชื่อมต่อ Cloud Firestore & Firebase Auth ปลอดภัยด้วย Firebase Security Rules
            </p>
          </div>

          <div className="flex items-center gap-4 text-slate-400">
            <button
              onClick={() => setIsSetupGuideOpen(true)}
              className="hover:text-sky-300 transition underline cursor-pointer"
            >
              คู่มือตั้งค่า Firebase Console
            </button>
            <span>•</span>
            <button
              onClick={resetFilters}
              className="hover:text-white transition cursor-pointer"
            >
              หน้าแรก
            </button>
            <span>•</span>
            {currentUser && (
              <button
                onClick={() => setViewMode('favorites')}
                className="hover:text-white transition cursor-pointer"
              >
                รายการโปรด
              </button>
            )}
          </div>
        </div>
      </footer>

      {/* Modals */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        initialTab={authInitialTab}
        onSuccess={(msg) => addToast('success', msg)}
      />

      <PostResourceModal
        isOpen={isPostOpen}
        onClose={() => {
          setIsPostOpen(false);
          setEditingResource(null);
        }}
        editResource={editingResource}
        onSuccess={(msg) => addToast('success', msg)}
      />

      <ResourceModal
        resource={detailResource}
        isOpen={Boolean(detailResource)}
        onClose={() => setDetailResource(null)}
        isFavorited={detailResource ? favoritedIdsSet.has(detailResource.id) : false}
        onToggleFavorite={handleToggleFavorite}
        onReport={(res) => setReportingResource(res)}
        onEdit={(res) => {
          setEditingResource(res);
          setIsPostOpen(true);
        }}
        onDelete={handleDeleteResource}
      />

      <ReportModal
        isOpen={Boolean(reportingResource)}
        onClose={() => setReportingResource(null)}
        resource={reportingResource}
        onSuccess={(msg) => addToast('success', msg)}
      />

      <AdminDashboard
        isOpen={isAdminOpen}
        onClose={() => setIsAdminOpen(false)}
        onRefreshResources={() => {}}
        onToast={addToast}
      />

      <SetupGuideModal
        isOpen={isSetupGuideOpen}
        onClose={() => setIsSetupGuideOpen(false)}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <SettingsProvider>
        <MainApp />
      </SettingsProvider>
    </AuthProvider>
  );
}
