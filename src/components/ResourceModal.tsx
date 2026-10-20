import React from 'react';
import {
  X,
  Heart,
  Eye,
  FileText,
  Video,
  Globe,
  Presentation,
  Download,
  ExternalLink,
  Flag,
  Share2,
  Calendar,
  User,
  GraduationCap,
  Tag,
  ShieldAlert,
} from 'lucide-react';
import { ResourceItem, MediaType } from '../types';
import { useAuth } from '../context/AuthContext';

interface ResourceModalProps {
  resource: ResourceItem | null;
  isOpen: boolean;
  onClose: () => void;
  isFavorited: boolean;
  onToggleFavorite: (resource: ResourceItem) => void;
  onReport: (resource: ResourceItem) => void;
  onEdit: (resource: ResourceItem) => void;
  onDelete: (resourceId: string, title: string) => void;
}

export const ResourceModal: React.FC<ResourceModalProps> = ({
  resource,
  isOpen,
  onClose,
  isFavorited,
  onToggleFavorite,
  onReport,
  onEdit,
  onDelete,
}) => {
  const { currentUser, isAdmin, isModerator } = useAuth();

  if (!isOpen || !resource) return null;

  const isOwner = currentUser?.uid === resource.authorId;
  const canManage = isOwner || isAdmin || isModerator;

  // Extract YouTube ID if valid
  const getYouTubeEmbedUrl = (url?: string) => {
    if (!url) return null;
    const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
    return match ? `https://www.youtube.com/embed/${match[1]}` : null;
  };

  const youtubeEmbedUrl = resource.mediaType === 'video' ? getYouTubeEmbedUrl(resource.linkUrl) : null;

  const formattedDate = resource.createdAt
    ? new Date(resource.createdAt).toLocaleDateString('th-TH', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : '';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="relative bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
        role="dialog"
      >
        {/* Header Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 text-xs font-bold rounded-lg bg-blue-100 text-blue-800">
              {resource.category}
            </span>
            <span className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-200/80 text-slate-700">
              {resource.gradeLevel}
            </span>
            {resource.status === 'hidden' && (
              <span className="px-2.5 py-1 text-xs font-bold rounded-lg bg-amber-100 text-amber-800">
                ซ่อนอยู่
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onToggleFavorite(resource)}
              className={`p-2 rounded-xl border transition cursor-pointer ${
                isFavorited
                  ? 'bg-rose-50 border-rose-200 text-rose-600'
                  : 'bg-white border-slate-200 text-slate-400 hover:text-rose-500'
              }`}
              title={isFavorited ? 'ลบออกจากรายการโปรด' : 'เพิ่มในรายการโปรด'}
            >
              <Heart className={`w-4 h-4 ${isFavorited ? 'fill-rose-500' : ''}`} />
            </button>

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-200/60 transition"
              aria-label="ปิดหน้าต่าง"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Title */}
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 font-['Prompt'] leading-snug">
              {resource.title}
            </h2>
            <div className="flex items-center gap-4 text-xs text-slate-400 mt-2 flex-wrap">
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                เผยแพร่เมื่อ: {formattedDate}
              </span>
              <span className="flex items-center gap-1">
                <Eye className="w-3.5 h-3.5" />
                เข้าชม {resource.viewCount || 0} ครั้ง
              </span>
              <span className="flex items-center gap-1">
                <Heart className="w-3.5 h-3.5 text-rose-400" />
                ถูกใจ {resource.favoriteCount || 0} คน
              </span>
            </div>
          </div>

          {/* Embedded Video Viewer if YouTube */}
          {youtubeEmbedUrl && (
            <div className="rounded-2xl overflow-hidden border border-slate-200 aspect-video bg-black shadow-md">
              <iframe
                src={youtubeEmbedUrl}
                title={resource.title}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          )}

          {/* External Link or File Download Banner */}
          {(resource.linkUrl || resource.fileUrl) && (
            <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-50 to-sky-50 border border-blue-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                  {resource.mediaType === 'pdf' ? (
                    <FileText className="w-5 h-5" />
                  ) : resource.mediaType === 'video' ? (
                    <Video className="w-5 h-5" />
                  ) : resource.mediaType === 'slide' ? (
                    <Presentation className="w-5 h-5" />
                  ) : (
                    <Globe className="w-5 h-5" />
                  )}
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900">
                    {resource.fileName || 'สื่อการเรียนรู้ต้นฉบับ'}
                  </p>
                  <p className="text-xs text-slate-500">
                    {resource.fileSize
                      ? `ขนาดไฟล์ ${(resource.fileSize / (1024 * 1024)).toFixed(2)} MB`
                      : 'คลิกเพื่อเปิดดูหรือดาวน์โหลดสื่อ'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                {resource.linkUrl && (
                  <a
                    href={resource.linkUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-xs transition cursor-pointer"
                  >
                    <span>เปิดลิงก์สื่อการสอน</span>
                    <ExternalLink className="w-4 h-4" />
                  </a>
                )}
                {resource.fileUrl && (
                  <a
                    href={resource.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    download={resource.fileName || true}
                    className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-xs transition cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    <span>ดาวน์โหลดไฟล์</span>
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Description Content */}
          <div className="space-y-2">
            <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wide">
              รายละเอียดเนื้อหา
            </h4>
            <div className="text-sm text-slate-700 leading-relaxed whitespace-pre-line bg-slate-50 p-4 rounded-2xl border border-slate-100">
              {resource.description}
            </div>
          </div>

          {/* Tags */}
          {resource.tags && resource.tags.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                ป้ายกำกับ (Tags)
              </h4>
              <div className="flex items-center gap-1.5 flex-wrap">
                {resource.tags.map((tag, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1 text-xs text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200"
                  >
                    <Tag className="w-3 h-3 text-blue-500" />
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Author Card */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-blue-600 to-sky-400 text-white font-bold flex items-center justify-center text-sm shadow-xs overflow-hidden">
                {resource.authorPhoto ? (
                  <img src={resource.authorPhoto} alt="Author" className="w-full h-full object-cover" />
                ) : (
                  resource.authorName?.[0]?.toUpperCase() || <User className="w-5 h-5" />
                )}
              </div>
              <div>
                <p className="text-xs text-slate-400">ผู้แบ่งปันเนื้อหา</p>
                <p className="text-sm font-bold text-slate-900">{resource.authorName}</p>
                <p className="text-xs text-slate-500">{resource.authorEmail}</p>
              </div>
            </div>

            {/* Report Button */}
            {currentUser && !isOwner && (
              <button
                onClick={() => onReport(resource)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-500 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 rounded-xl transition cursor-pointer"
              >
                <Flag className="w-3.5 h-3.5" />
                <span>รายงานสื่อนี้</span>
              </button>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            {canManage && (
              <>
                <button
                  onClick={() => {
                    onClose();
                    onEdit(resource);
                  }}
                  className="px-3.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold rounded-xl transition cursor-pointer"
                >
                  แก้ไขข้อมูล
                </button>
                <button
                  onClick={() => {
                    onClose();
                    onDelete(resource.id, resource.title);
                  }}
                  className="px-3.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold rounded-xl transition cursor-pointer"
                >
                  ลบสื่อนี้
                </button>
              </>
            )}
          </div>

          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white font-semibold rounded-xl transition cursor-pointer"
          >
            ปิด
          </button>
        </div>
      </div>
    </div>
  );
};
