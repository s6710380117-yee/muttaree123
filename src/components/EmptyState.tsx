import React from 'react';
import { BookOpen, SearchX, PlusCircle, Bookmark } from 'lucide-react';

interface EmptyStateProps {
  type?: 'search' | 'favorites' | 'general' | 'reports';
  title?: string;
  description?: string;
  actionText?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  type = 'general',
  title,
  description,
  actionText,
  onAction,
}) => {
  const getIcon = () => {
    switch (type) {
      case 'search':
        return <SearchX className="w-12 h-12 text-blue-400" />;
      case 'favorites':
        return <Bookmark className="w-12 h-12 text-amber-400" />;
      default:
        return <BookOpen className="w-12 h-12 text-blue-500" />;
    }
  };

  const defaultTitle =
    type === 'search'
      ? 'ไม่พบข้อมูลสื่อความรู้ที่ค้นหา'
      : type === 'favorites'
      ? 'ยังไม่มีรายการโปรดที่บันทึกไว้'
      : 'ยังไม่มีสื่อความรู้ในหมวดหมู่นี้';

  const defaultDesc =
    type === 'search'
      ? 'ลองเปลี่ยนคำค้นหา หรือปรับตัวกรองหมวดหมู่และระดับชั้นดูใหม่อีกครั้ง'
      : type === 'favorites'
      ? 'คุณสามารถกดรูปหัวใจที่การ์ดสื่อความรู้เพื่อบันทึกไว้กลับมาอ่านภายหลังได้'
      : 'ร่วมเป็นคนแรกที่แบ่งปันสื่อการสอนหรือเอกสารความรู้ในคลังนี้!';

  return (
    <div className="flex flex-col items-center justify-center p-8 sm:p-12 text-center bg-white rounded-2xl border border-slate-200 shadow-sm max-w-lg mx-auto my-8">
      <div className="w-20 h-20 bg-blue-50 rounded-2xl flex items-center justify-center mb-4 ring-8 ring-blue-50/50">
        {getIcon()}
      </div>
      <h3 className="text-lg font-bold text-slate-800 mb-2">
        {title || defaultTitle}
      </h3>
      <p className="text-sm text-slate-500 max-w-sm mb-6 leading-relaxed">
        {description || defaultDesc}
      </p>
      {actionText && onAction && (
        <button
          onClick={onAction}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl shadow-md shadow-blue-500/20 transition-all hover:scale-[1.02] cursor-pointer"
        >
          <PlusCircle className="w-4 h-4" />
          {actionText}
        </button>
      )}
    </div>
  );
};
