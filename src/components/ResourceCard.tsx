import React, { useState } from 'react';
import {
  Heart,
  Eye,
  FileText,
  Video,
  Globe,
  Presentation,
  File,
  MoreVertical,
  Edit2,
  Trash2,
  Flag,
  Share2,
  ExternalLink,
  Lock,
} from 'lucide-react';
import { ResourceItem, MediaType } from '../types';
import { useAuth } from '../context/AuthContext';

interface ResourceCardProps {
  resource: ResourceItem;
  isFavorited: boolean;
  onToggleFavorite: (resource: ResourceItem) => void;
  onOpenDetail: (resource: ResourceItem) => void;
  onEdit: (resource: ResourceItem) => void;
  onDelete: (resourceId: string, resourceTitle: string) => void;
  onReport: (resource: ResourceItem) => void;
}

export const ResourceCard: React.FC<ResourceCardProps> = ({
  resource,
  isFavorited,
  onToggleFavorite,
  onOpenDetail,
  onEdit,
  onDelete,
  onReport,
}) => {
  const { currentUser, isAdmin, isModerator } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  const isOwner = currentUser?.uid === resource.authorId;
  const canManage = isOwner || isAdmin || isModerator;

  const getMediaMeta = (type: MediaType) => {
    switch (type) {
      case 'pdf':
        return {
          label: 'PDF',
          icon: <FileText className="w-3.5 h-3.5 text-rose-600" />,
          bg: 'bg-rose-50 text-rose-700 border-rose-200',
        };
      case 'video':
        return {
          label: 'วิดีโอ',
          icon: <Video className="w-3.5 h-3.5 text-red-600" />,
          bg: 'bg-red-50 text-red-700 border-red-200',
        };
      case 'article':
        return {
          label: 'บทความ',
          icon: <FileText className="w-3.5 h-3.5 text-emerald-600" />,
          bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        };
      case 'slide':
        return {
          label: 'สไลด์',
          icon: <Presentation className="w-3.5 h-3.5 text-amber-600" />,
          bg: 'bg-amber-50 text-amber-700 border-amber-200',
        };
      case 'link':
        return {
          label: 'ลิงก์เว็บ',
          icon: <Globe className="w-3.5 h-3.5 text-sky-600" />,
          bg: 'bg-sky-50 text-sky-700 border-sky-200',
        };
      default:
        return {
          label: 'สื่ออื่นๆ',
          icon: <File className="w-3.5 h-3.5 text-slate-600" />,
          bg: 'bg-slate-50 text-slate-700 border-slate-200',
        };
    }
  };

  const media = getMediaMeta(resource.mediaType);

  const formattedDate = resource.createdAt
    ? new Date(resource.createdAt).toLocaleDateString('th-TH', {
        day: 'numeric',
        month: 'short',
        year: '2-digit',
      })
    : '';

  return (
    <div className="group relative bg-white rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-md hover:border-blue-300 transition-all duration-200 flex flex-col justify-between overflow-hidden">
      {/* Top Banner Accent */}
      <div className="h-1.5 w-full bg-gradient-to-r from-blue-500 via-sky-400 to-indigo-500 group-hover:h-2 transition-all" />

      <div className="p-5 flex-1 flex flex-col">
        {/* Badges Bar */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="px-2.5 py-0.5 text-xs font-semibold rounded-md bg-blue-50 text-blue-800 border border-blue-100 max-w-[130px] truncate">
              {resource.category}
            </span>
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium rounded-md border ${media.bg}`}>
              {media.icon}
              {media.label}
            </span>
          </div>

          {/* Quick Menu */}
          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setMenuOpen(!menuOpen)}
              }
              className="p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition"
              aria-label="ตัวเลือกเพิ่มเติม"
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {menuOpen && (
              <div
                className="absolute right-0 mt-1 w-44 bg-white rounded-xl shadow-lg border border-slate-100 py-1.5 z-20 text-xs font-medium animate-in fade-in"
                onMouseLeave={() => setMenuOpen(false)}
              >
                {canManage && (
                  <>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setMenuOpen(false);
                        onEdit(resource);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-slate-700 hover:bg-slate-50 text-left"
                    >
                      <Edit2 className="w-3.5 h-3.5 text-blue-600" />
                      <span>แก้ไขข้อมูล</span>
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setMenuOpen(false);
                        onDelete(resource.id, resource.title);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-rose-600 hover:bg-rose-50 text-left"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>ลบสื่อนี้</span>
                    </button>
                  </>
                )}
                {currentUser && !isOwner && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setMenuOpen(false);
                      onReport(resource);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-amber-600 hover:bg-amber-50 text-left"
                  >
                    <Flag className="w-3.5 h-3.5" />
                    <span>รายงานเนื้อหา</span>
                  </button>
                )}
                <button
                  onClick={async (e) => {
                    e.stopPropagation();
                    setMenuOpen(false);
                    try {
                      await navigator.clipboard.writeText(window.location.href);
                      alert('คัดลอกลิงก์สื่อความรู้นี้เรียบร้อยแล้ว!');
                    } catch {
                      // Fallback
                    }
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-slate-600 hover:bg-slate-50 text-left"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>คัดลอกลิงก์แชร์</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Title */}
        <h3
          onClick={() => onOpenDetail(resource)}
          className="text-base font-bold text-slate-900 group-hover:text-blue-600 transition-colors cursor-pointer line-clamp-2 mb-2 font-['Prompt']"
        >
          {resource.title}
        </h3>

        {/* Grade badge */}
        <div className="mb-2">
          <span className="text-[11px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-sm">
            {resource.gradeLevel}
          </span>
          {resource.status === 'hidden' && (
            <span className="ml-2 inline-flex items-center gap-1 text-[11px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-sm">
              <Lock className="w-3 h-3" /> ถูกซ่อนไว้
            </span>
          )}
        </div>

        {/* Excerpt */}
        <p className="text-xs text-slate-500 line-clamp-3 mb-4 leading-relaxed flex-1">
          {resource.description}
        </p>

        {/* Tags */}
        {resource.tags && resource.tags.length > 0 && (
          <div className="flex items-center gap-1 flex-wrap mb-4">
            {resource.tags.slice(0, 3).map((tag, i) => (
              <span key={i} className="text-[10px] text-slate-500 bg-slate-50 px-1.5 py-0.5 rounded-sm border border-slate-200">
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Author details */}
        <div className="flex items-center gap-2 pt-3 border-t border-slate-100 text-xs text-slate-500">
          <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-[10px] shrink-0">
            {resource.authorPhoto ? (
              <img src={resource.authorPhoto} alt="Author" className="w-full h-full rounded-full object-cover" />
            ) : (
              resource.authorName?.[0]?.toUpperCase() || 'ครู'
            )}
          </div>
          <span className="font-medium text-slate-700 truncate max-w-[120px]">
            {resource.authorName}
          </span>
          <span className="text-slate-300">•</span>
          <span className="text-slate-400 text-[11px] shrink-0">{formattedDate}</span>
        </div>
      </div>

      {/* Bottom Bar: Stats & View Detail Button */}
      <div className="bg-slate-50/80 px-5 py-3 border-t border-slate-100 flex items-center justify-between text-xs">
        <div className="flex items-center gap-4 text-slate-500">
          <div className="flex items-center gap-1" title="ยอดเข้าชม">
            <Eye className="w-3.5 h-3.5 text-slate-400" />
            <span>{resource.viewCount || 0}</span>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite(resource);
            }}
            className={`flex items-center gap-1 transition-colors cursor-pointer p-0.5 rounded-sm ${
              isFavorited ? 'text-rose-600 font-bold' : 'text-slate-400 hover:text-rose-500'
            }`}
            title={isFavorited ? 'ยกเลิกรายการโปรด' : 'เพิ่มในรายการโปรด'}
          >
            <Heart className={`w-3.5 h-3.5 ${isFavorited ? 'fill-rose-500 text-rose-500' : ''}`} />
            <span>{resource.favoriteCount || 0}</span>
          </button>
        </div>

        <button
          onClick={() => onOpenDetail(resource)}
          className="inline-flex items-center gap-1 font-semibold text-blue-600 hover:text-blue-800 transition cursor-pointer"
        >
          <span>ดูเนื้อหา</span>
          <ExternalLink className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
};
