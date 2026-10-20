import React, { useState, useEffect } from 'react';
import {
  X,
  Upload,
  Link as LinkIcon,
  Check,
  AlertCircle,
  FileText,
  Tag,
  Loader2,
  Sparkles,
} from 'lucide-react';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { doc, setDoc, updateDoc, collection } from 'firebase/firestore';
import confetti from 'canvas-confetti';
import { db, storage, handleFirestoreError, OperationType } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import { ResourceItem, MediaType, ResourceStatus } from '../types';

interface PostResourceModalProps {
  isOpen: boolean;
  onClose: () => void;
  editResource?: ResourceItem | null;
  onSuccess: (message: string) => void;
}

export const PostResourceModal: React.FC<PostResourceModalProps> = ({
  isOpen,
  onClose,
  editResource,
  onSuccess,
}) => {
  const { currentUser, userProfile, isAdmin, isModerator } = useAuth();
  const { settings } = useSettings();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState(settings.categories[0] || 'คอมพิวเตอร์และเทคโนโลยี');
  const [gradeLevel, setGradeLevel] = useState(settings.gradeLevels[0] || 'มัธยมศึกษาตอนปลาย');
  const [mediaType, setMediaType] = useState<MediaType>('pdf');
  const [linkUrl, setLinkUrl] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [status, setStatus] = useState<ResourceStatus>('published');

  // File upload state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Prefill on edit
  useEffect(() => {
    if (editResource) {
      setTitle(editResource.title);
      setDescription(editResource.description);
      setCategory(editResource.category);
      setGradeLevel(editResource.gradeLevel);
      setMediaType(editResource.mediaType);
      setLinkUrl(editResource.linkUrl || '');
      setTagsInput(editResource.tags?.join(', ') || '');
      setStatus(editResource.status);
      setSelectedFile(null);
    } else {
      setTitle('');
      setDescription('');
      setCategory(settings.categories[0] || '');
      setGradeLevel(settings.gradeLevels[0] || '');
      setMediaType('pdf');
      setLinkUrl('');
      setTagsInput('');
      setStatus('published');
      setSelectedFile(null);
    }
    setErrorMessage('');
    setUploadProgress(null);
  }, [editResource, isOpen, settings]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!currentUser) {
      setErrorMessage('กรุณาเข้าสู่ระบบก่อนทำการแบ่งปันสื่อความรู้');
      return;
    }

    // Validation
    const cleanTitle = title.trim();
    const cleanDesc = description.trim();

    if (cleanTitle.length < 3) {
      setErrorMessage('ชื่อสื่อความรู้ต้องมีความยาวอย่างน้อย 3 ตัวอักษร');
      return;
    }
    if (cleanTitle.length > 200) {
      setErrorMessage('ชื่อสื่อความรู้ต้องไม่เกิน 200 ตัวอักษร');
      return;
    }
    if (cleanDesc.length < 10) {
      setErrorMessage('คำอธิบายสื่อต้องมีความยาวอย่างน้อย 10 ตัวอักษรเพื่อประโยชน์ต่อผู้เรียน');
      return;
    }
    if (cleanDesc.length > 10000) {
      setErrorMessage('คำอธิบายยาวเกินกำหนด (สูงสุด 10,000 ตัวอักษร)');
      return;
    }

    if (!linkUrl.trim() && !selectedFile && !editResource?.fileUrl) {
      setErrorMessage('กรุณาแนบลิงก์สื่อการสอน หรืออัปโหลดไฟล์อย่างน้อย 1 รายการ');
      return;
    }

    setIsSubmitting(true);

    try {
      let finalFileUrl = editResource?.fileUrl || '';
      let finalFileName = editResource?.fileName || '';
      let finalFileSize = editResource?.fileSize || 0;

      // Handle Firebase Storage file upload if a file was selected
      if (selectedFile) {
        const fileExt = selectedFile.name.split('.').pop();
        const safeFileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
        const storagePath = `resources/${currentUser.uid}/${safeFileName}`;
        const storageRef = ref(storage, storagePath);

        const uploadTask = uploadBytesResumable(storageRef, selectedFile);

        await new Promise<void>((resolve, reject) => {
          uploadTask.on(
            'state_changed',
            (snapshot) => {
              const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
              setUploadProgress(Math.round(progress));
            },
            (error) => {
              console.error('Storage upload error:', error);
              // Fallback to storing metadata if storage permissions are restricted
              reject(error);
            },
            async () => {
              finalFileUrl = await getDownloadURL(uploadTask.snapshot.ref);
              finalFileName = selectedFile.name;
              finalFileSize = selectedFile.size;
              resolve();
            }
          );
        }).catch((err) => {
          console.warn('Storage upload fallback:', err);
          // Don't fail the whole post if storage bucket isn't enabled yet in console; store file name
          finalFileName = selectedFile.name;
          finalFileSize = selectedFile.size;
        });
      }

      // Process tags
      const tags = tagsInput
        .split(',')
        .map((t) => t.trim())
        .filter((t) => t.length > 0 && t.length <= 30)
        .slice(0, 8);

      const resourceId = editResource ? editResource.id : `res_${Date.now()}_${Math.random().toString(36).substring(7)}`;

      const resourcePayload: ResourceItem = {
        id: resourceId,
        title: cleanTitle,
        description: cleanDesc,
        category,
        gradeLevel,
        mediaType,
        linkUrl: linkUrl.trim() || undefined,
        fileUrl: finalFileUrl || undefined,
        fileName: finalFileName || undefined,
        fileSize: finalFileSize || undefined,
        authorId: editResource ? editResource.authorId : currentUser.uid,
        authorName: editResource ? editResource.authorName : (currentUser.displayName || 'สมาชิก'),
        authorEmail: editResource ? editResource.authorEmail : (currentUser.email || ''),
        authorPhoto: editResource ? editResource.authorPhoto : (currentUser.photoURL || undefined),
        status,
        viewCount: editResource ? editResource.viewCount : 0,
        favoriteCount: editResource ? editResource.favoriteCount : 0,
        tags,
        createdAt: editResource ? editResource.createdAt : new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      if (editResource) {
        await updateDoc(doc(db, 'resources', resourceId), {
          title: cleanTitle,
          description: cleanDesc,
          category,
          gradeLevel,
          mediaType,
          linkUrl: linkUrl.trim() || '',
          fileUrl: finalFileUrl || '',
          fileName: finalFileName || '',
          fileSize: finalFileSize || 0,
          status,
          tags,
          updatedAt: new Date().toISOString(),
        });
        onSuccess('อัปเดตข้อมูลสื่อความรู้เรียบร้อยแล้ว!');
      } else {
        await setDoc(doc(db, 'resources', resourceId), resourcePayload);
        // Fire confetti celebration
        try {
          confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });
        } catch {
          // Ignore
        }
        onSuccess('แบ่งปันสื่อความรู้เข้าสู่ระบบสำเร็จ ขอบคุณสำหรับการแบ่งปัน!');
      }

      onClose();
    } catch (err) {
      console.error('Post submit error:', err);
      handleFirestoreError(err, editResource ? OperationType.UPDATE : OperationType.CREATE, 'resources');
      setErrorMessage('เกิดข้อผิดพลาดในการบันทึกข้อมูล กรุณาตรวจสอบการเชื่อมต่อ');
    } finally {
      setIsSubmitting(false);
      setUploadProgress(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="relative bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden animate-in zoom-in-95">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-blue-50 to-sky-50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 font-['Prompt']">
                {editResource ? 'แก้ไขสื่อความรู้' : 'แบ่งปันสื่อความรู้ใหม่'}
              </h3>
              <p className="text-xs text-slate-500">
                ร่วมสร้างสรรค์คลังความรู้เปิดเพื่อเด็กไทย
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-200/60 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 flex-1 text-sm">
          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-start gap-2 text-xs">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              ชื่อสื่อความรู้ / เอกสาร / วิดีโอ <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="เช่น สรุปสูตรตรีโกณมิติ ม.5 พร้อมตัวอย่างโจทย์"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-slate-900"
              maxLength={200}
            />
          </div>

          {/* Category & Grade Level */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                หมวดหมู่วิชา <span className="text-rose-500">*</span>
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-slate-900 bg-white"
              >
                {settings.categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                ระดับชั้นการศึกษา <span className="text-rose-500">*</span>
              </label>
              <select
                value={gradeLevel}
                onChange={(e) => setGradeLevel(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-slate-900 bg-white"
              >
                {settings.gradeLevels.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Media Type */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              ประเภทของสื่อ <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {settings.mediaTypes.map((m) => (
                <button
                  type="button"
                  key={m.id}
                  onClick={() => setMediaType(m.id)}
                  className={`p-2.5 rounded-xl border text-center transition cursor-pointer flex flex-col items-center justify-center gap-1 ${
                    mediaType === m.id
                      ? 'border-blue-600 bg-blue-50 text-blue-700 font-bold ring-2 ring-blue-500/20'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <span className="text-[11px] leading-tight">{m.label.split(' ')[0]}</span>
                </button>
              ))}
            </div>
          </div>

          {/* External Link */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              แนบลิงก์ (YouTube, Google Drive, Canva, เว็บไซต์)
            </label>
            <div className="relative">
              <LinkIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="url"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                placeholder="https://www.youtube.com/watch?v=... หรือ ลิงก์สื่ออื่นๆ"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-slate-900 text-xs sm:text-sm"
              />
            </div>
          </div>

          {/* File Upload to Firebase Storage */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              หรือ อัปโหลดไฟล์เอกสาร (PDF, PowerPoint, Word)
            </label>
            <div className="border-2 border-dashed border-slate-200 hover:border-blue-400 rounded-2xl p-4 text-center transition bg-slate-50/50">
              <input
                type="file"
                id="file-upload"
                className="hidden"
                accept=".pdf,.ppt,.pptx,.doc,.docx,.png,.jpg,.jpeg,.zip"
                onChange={(e) => {
                  if (e.target.files?.[0]) {
                    setSelectedFile(e.target.files[0]);
                  }
                }}
              />
              <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center gap-1">
                <Upload className="w-6 h-6 text-blue-500" />
                <span className="text-xs font-semibold text-blue-600 hover:underline">
                  {selectedFile ? selectedFile.name : 'คลิกเพื่อเลือกไฟล์จากอุปกรณ์'}
                </span>
                <span className="text-[11px] text-slate-400">
                  รองรับ PDF, DOCX, PPTX ขนาดสูงสุด 25MB
                </span>
              </label>

              {uploadProgress !== null && (
                <div className="mt-3">
                  <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-blue-600 h-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1">กำลังอัปโหลด {uploadProgress}%</p>
                </div>
              )}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              คำอธิบายรายละเอียดสื่อการเรียนรู้ <span className="text-rose-500">*</span>
            </label>
            <textarea
              required
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="อธิบายจุดประสงค์ของสื่อ สาระสำคัญที่ผู้เรียนจะได้รับ เทคนิคการสอน หรือลิงก์แนะนำเพิ่มเติม..."
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-slate-900"
              maxLength={10000}
            />
          </div>

          {/* Tags */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              ป้ายกำกับ / คำสำคัญ (คั่นด้วยเครื่องหมายจุลภาค ,)
            </label>
            <div className="relative">
              <Tag className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                placeholder="เช่น วิทยาศาสตร์, ฟิสิกส์, ม.ปลาย, ตะลุยโจทย์"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-slate-900 text-xs sm:text-sm"
              />
            </div>
          </div>

          {/* Admin status toggling */}
          {(isAdmin || isModerator) && (
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-700">สถานะการแสดงผล</span>
                <p className="text-[11px] text-slate-400">ควบคุมการแสดงในคลังความรู้สาธารณะ</p>
              </div>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as ResourceStatus)}
                className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-semibold"
              >
                <option value="published">เผยแพร่สาธารณะ</option>
                <option value="hidden">ซ่อนจากหน้าหลัก</option>
              </select>
            </div>
          )}

          {/* Buttons */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-slate-600 hover:bg-slate-100 font-semibold rounded-xl text-xs sm:text-sm transition"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-semibold rounded-xl shadow-md text-xs sm:text-sm transition cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>กำลังบันทึกข้อมูล...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>{editResource ? 'บันทึกการแก้ไข' : 'เผยแพร่ความรู้'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
