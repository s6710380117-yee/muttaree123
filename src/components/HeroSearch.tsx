import React from 'react';
import { Search, X, BookOpen, Users, Sparkles, Filter } from 'lucide-react';
import { useSettings } from '../context/SettingsContext';

interface HeroSearchProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
  totalResources: number;
  totalViews: number;
}

export const HeroSearch: React.FC<HeroSearchProps> = ({
  searchQuery,
  onSearchChange,
  selectedCategory,
  onSelectCategory,
  totalResources,
  totalViews,
}) => {
  const { settings } = useSettings();

  return (
    <div className="relative overflow-hidden bg-gradient-to-b from-blue-900 via-blue-800 to-slate-900 text-white pt-10 pb-16 px-4 sm:px-6 lg:px-8 rounded-b-3xl sm:rounded-b-[2.5rem] shadow-xl">
      {/* Background Decorative Circles */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none -translate-y-1/2" />
      <div className="absolute bottom-0 right-10 w-80 h-80 bg-sky-400/10 rounded-full blur-2xl pointer-events-none" />

      <div className="relative max-w-4xl mx-auto text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/20 border border-blue-400/30 text-sky-200 text-xs sm:text-sm font-medium mb-4 backdrop-blur-xs">
          <Sparkles className="w-4 h-4 text-sky-300" />
          <span>ศูนย์กลางคลังความรู้เปิดเพื่อการศึกษาไทย</span>
        </div>

        {/* Heading */}
        <h1 className="text-2xl sm:text-4xl md:text-5xl font-black tracking-tight mb-4 leading-tight font-['Prompt']">
          ค้นหาและแบ่งปัน <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-300 via-blue-200 to-indigo-200">สื่อการเรียนรู้คุณภาพ</span>
        </h1>
        <p className="text-sm sm:text-base text-blue-100/90 max-w-2xl mx-auto mb-8 font-light leading-relaxed">
          รวบรวมเอกสาร PDF สรุปบทเรียน วิดีโอเพื่อการศึกษา และสไลด์การสอนสำหรับนักเรียน นักศึกษา และครูอาจารย์ เชื่อมโยงความรู้สู่ทุกคน
        </p>

        {/* Large Search Input */}
        <div className="relative max-w-2xl mx-auto mb-6">
          <div className="relative flex items-center">
            <div className="absolute left-4 text-slate-400 pointer-events-none">
              <Search className="w-5 h-5 sm:w-6 sm:h-6 text-blue-500" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="ค้นหาชื่อสื่อความรู้, ผู้เขียน, หรือเนื้อหาที่ต้องการ..."
              className="w-full pl-12 sm:pl-14 pr-12 py-3.5 sm:py-4 bg-white text-slate-900 rounded-2xl shadow-2xl focus:outline-hidden focus:ring-4 focus:ring-sky-400 text-sm sm:text-base placeholder:text-slate-400 font-normal border-0"
            />
            {searchQuery && (
              <button
                onClick={() => onSearchChange('')}
                className="absolute right-4 text-slate-400 hover:text-slate-600 transition p-1"
                aria-label="ล้างคำค้นหา"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* Quick Category Chips */}
        <div className="flex items-center justify-center gap-1.5 flex-wrap max-w-3xl mx-auto mb-6">
          <button
            onClick={() => onSelectCategory('')}
            className={`px-3 py-1.5 rounded-xl text-xs sm:text-sm font-medium transition cursor-pointer ${
              selectedCategory === ''
                ? 'bg-sky-400 text-slate-950 shadow-md font-bold'
                : 'bg-white/10 hover:bg-white/20 text-blue-100 border border-white/10'
            }`}
          >
            ทั้งหมด
          </button>
          {settings.categories.slice(0, 6).map((cat) => (
            <button
              key={cat}
              onClick={() => onSelectCategory(cat === selectedCategory ? '' : cat)}
              className={`px-3 py-1.5 rounded-xl text-xs sm:text-sm font-medium transition cursor-pointer truncate max-w-[180px] ${
                selectedCategory === cat
                  ? 'bg-sky-400 text-slate-950 shadow-md font-bold'
                  : 'bg-white/10 hover:bg-white/20 text-blue-100 border border-white/10'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Quick Stat Counters */}
        <div className="flex items-center justify-center gap-6 sm:gap-12 pt-4 border-t border-white/10 text-xs sm:text-sm text-blue-200">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-sky-400" />
            <span>
              สื่อความรู้ในระบบ: <strong className="text-white font-bold">{totalResources}</strong> รายการ
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-sky-400" />
            <span>
              เข้าชมทั้งหมด: <strong className="text-white font-bold">{totalViews}</strong> ครั้ง
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
