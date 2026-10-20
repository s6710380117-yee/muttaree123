import React from 'react';
import { Filter, RotateCcw, FileText, Video, Globe, Presentation, File, ChevronDown } from 'lucide-react';
import { useSettings } from '../context/SettingsContext';
import { MediaType } from '../types';

interface SidebarFilterProps {
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
  selectedGrade: string;
  onSelectGrade: (grade: string) => void;
  selectedMediaType: MediaType | '';
  onSelectMediaType: (type: MediaType | '') => void;
  sortBy: 'latest' | 'views' | 'favorites';
  onSortChange: (sort: 'latest' | 'views' | 'favorites') => void;
  onResetFilters: () => void;
  totalFiltered: number;
}

export const SidebarFilter: React.FC<SidebarFilterProps> = ({
  selectedCategory,
  onSelectCategory,
  selectedGrade,
  onSelectGrade,
  selectedMediaType,
  onSelectMediaType,
  sortBy,
  onSortChange,
  onResetFilters,
  totalFiltered,
}) => {
  const { settings } = useSettings();

  const getMediaIcon = (type: MediaType) => {
    switch (type) {
      case 'pdf':
        return <FileText className="w-4 h-4 text-rose-500" />;
      case 'video':
        return <Video className="w-4 h-4 text-red-500" />;
      case 'article':
        return <FileText className="w-4 h-4 text-emerald-500" />;
      case 'slide':
        return <Presentation className="w-4 h-4 text-amber-500" />;
      case 'link':
        return <Globe className="w-4 h-4 text-sky-500" />;
      default:
        return <File className="w-4 h-4 text-slate-500" />;
    }
  };

  const hasActiveFilters = selectedCategory !== '' || selectedGrade !== '' || selectedMediaType !== '' || sortBy !== 'latest';

  return (
    <aside className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs sticky top-24">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-blue-600" />
          <h2 className="text-sm font-bold text-slate-900">ตัวกรองเนื้อหา</h2>
          <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full font-semibold">
            {totalFiltered}
          </span>
        </div>
        {hasActiveFilters && (
          <button
            onClick={onResetFilters}
            className="flex items-center gap-1 text-xs text-slate-500 hover:text-rose-600 transition cursor-pointer"
            title="ล้างตัวกรองทั้งหมด"
          >
            <RotateCcw className="w-3 h-3" />
            <span>รีเซ็ต</span>
          </button>
        )}
      </div>

      <div className="space-y-6 pt-4 text-sm">
        {/* Sort Order */}
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
            เรียงลำดับตาม
          </label>
          <div className="grid grid-cols-3 gap-1 p-1 bg-slate-100 rounded-xl">
            <button
              onClick={() => onSortChange('latest')}
              className={`py-1.5 text-xs font-semibold rounded-lg transition ${
                sortBy === 'latest' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              ล่าสุด
            </button>
            <button
              onClick={() => onSortChange('views')}
              className={`py-1.5 text-xs font-semibold rounded-lg transition ${
                sortBy === 'views' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              ยอดดู
            </button>
            <button
              onClick={() => onSortChange('favorites')}
              className={`py-1.5 text-xs font-semibold rounded-lg transition ${
                sortBy === 'favorites' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              ยอดนิยม
            </button>
          </div>
        </div>

        {/* Media Type */}
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
            ประเภทสื่อ
          </label>
          <div className="space-y-1">
            <button
              onClick={() => onSelectMediaType('')}
              className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
                selectedMediaType === ''
                  ? 'bg-blue-50 text-blue-700 font-bold'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <span>ทุกประเภทสื่อ</span>
            </button>
            {settings.mediaTypes.map((m) => (
              <button
                key={m.id}
                onClick={() => onSelectMediaType(selectedMediaType === m.id ? '' : m.id)}
                className={`w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
                  selectedMediaType === m.id
                    ? 'bg-blue-50 text-blue-700 font-bold'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                {getMediaIcon(m.id)}
                <span className="truncate">{m.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Categories */}
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
            หมวดหมู่วิชา
          </label>
          <div className="space-y-1 max-h-52 overflow-y-auto pr-1">
            <button
              onClick={() => onSelectCategory('')}
              className={`w-full text-left px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
                selectedCategory === ''
                  ? 'bg-blue-600 text-white font-bold'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              ทุกหมวดหมู่
            </button>
            {settings.categories.map((cat) => (
              <button
                key={cat}
                onClick={() => onSelectCategory(selectedCategory === cat ? '' : cat)}
                className={`w-full text-left px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer truncate ${
                  selectedCategory === cat
                    ? 'bg-blue-600 text-white font-bold'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Grade / Level */}
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
            ระดับชั้นการศึกษา
          </label>
          <div className="space-y-1">
            <button
              onClick={() => onSelectGrade('')}
              className={`w-full text-left px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
                selectedGrade === ''
                  ? 'bg-sky-50 text-sky-800 font-bold border border-sky-200'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              ทุกระดับชั้น
            </button>
            {settings.gradeLevels.map((grade) => (
              <button
                key={grade}
                onClick={() => onSelectGrade(selectedGrade === grade ? '' : grade)}
                className={`w-full text-left px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer truncate ${
                  selectedGrade === grade
                    ? 'bg-sky-50 text-sky-800 font-bold border border-sky-200'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                {grade}
              </button>
            ))}
          </div>
        </div>
      </div>
    </aside>
  );
};
