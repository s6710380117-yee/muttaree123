export type UserRole = 'member' | 'moderator' | 'admin';
export type UserStatus = 'active' | 'suspended';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  role: UserRole;
  status: UserStatus;
  bio?: string;
  createdAt: string;
  updatedAt?: string;
}

export type MediaType = 'pdf' | 'video' | 'article' | 'slide' | 'link' | 'other';
export type ResourceStatus = 'published' | 'hidden' | 'deleted';

export interface ResourceItem {
  id: string;
  title: string;
  description: string;
  category: string;
  gradeLevel: string;
  mediaType: MediaType;
  linkUrl?: string;
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  authorId: string;
  authorName: string;
  authorEmail: string;
  authorPhoto?: string;
  status: ResourceStatus;
  viewCount: number;
  favoriteCount: number;
  tags?: string[];
  createdAt: string;
  updatedAt?: string;
}

export interface FavoriteItem {
  id: string;
  userId: string;
  resourceId: string;
  resourceTitle: string;
  category?: string;
  createdAt: string;
}

export type ReportReason = 'broken_link' | 'copyright' | 'inappropriate' | 'incorrect_info' | 'other';
export type ReportStatus = 'pending' | 'resolved' | 'dismissed';

export interface ReportItem {
  id: string;
  resourceId: string;
  resourceTitle: string;
  reporterId: string;
  reporterEmail: string;
  reason: ReportReason;
  details: string;
  status: ReportStatus;
  createdAt: string;
  resolvedAt?: string;
  resolvedBy?: string;
}

export interface ModerationLogItem {
  id: string;
  action: string;
  targetType: 'resource' | 'user' | 'settings' | 'report';
  targetId: string;
  targetName: string;
  performedBy: string;
  performedByEmail: string;
  details: string;
  timestamp: string;
}

export interface SiteSettings {
  siteName: string;
  siteDescription: string;
  logoUrl?: string;
  announcementBanner?: string;
  bannerActive: boolean;
  categories: string[];
  gradeLevels: string[];
  mediaTypes: { id: MediaType; label: string }[];
  updatedAt?: string;
  updatedBy?: string;
}

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}
