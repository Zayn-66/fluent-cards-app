
import React, { useState } from 'react';
import { Volume2, X, Star, AlertCircle, Edit2, Check, RotateCcw } from 'lucide-react';
import { WordCard } from '../types';
import { speakWord } from '../services/geminiService';

interface WordPreviewCardProps {
  card: WordCard;
  isFavorited?: boolean;
  onToggleFavorite?: () => void;
  onDelete?: () => void;
  onUpdate?: (id: string, newEnglish: string, newChinese: string) => void;
  errorCount?: number;
}

export const WordPreviewCard: React.FC<WordPreviewCardProps> = ({ 
  card, 
  isFavorited, 
  onToggleFavorite, 
  onDelete,
  onUpdate,
  errorCount
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editEnglish, setEditEnglish] = useState(card.english);
  const [editChinese, setEditChinese] = useState(card.chinese);

  // 错误次数颜色逻辑
  const getErrorBadgeStyle = (count: number) => {
    if (count >= 3) return "bg-rose-100 text-rose-600 border-rose-200"; // 红色
    if (count === 2) return "bg-orange-100 text-orange-600 border-orange-200"; // 橙色
    return "bg-amber-100 text-amber-600 border-amber-200"; // 黄色
  };

  const handleSave = () => {
    if (editEnglish.trim() && editChinese.trim()) {
      onUpdate?.(card.id, editEnglish.trim(), editChinese.trim());
      setIsEditing(false);
    }
  };

  const handleCancel = () => {
    setEditEnglish(card.english);
    setEditChinese(card.chinese);
    setIsEditing(false);
  };

  return (
    <div className="group relative bg-white border border-slate-200 p-6 rounded-[24px] shadow-sm hover:shadow-xl hover:border-indigo-100 transition-all duration-300 h-full flex flex-col justify-between">
      {/* 错误次数角标 - Moved to Top Right */}
      {errorCount !== undefined && errorCount > 0 && !isEditing && (
        <div className={`absolute -top-2 -right-2 px-3 py-1 rounded-full text-xs font-bold border flex items-center gap-1 shadow-sm z-10 ${getErrorBadgeStyle(errorCount)}`}>
          <AlertCircle size={12} />
          错误 {errorCount} 次
        </div>
      )}

      <div className="space-y-2 flex-1">
        {isEditing ? (
          <div className="space-y-3 animate-in fade-in">
             <div>
               <label className="text-xs text-slate-400 font-bold uppercase">英文</label>
               <input 
                 type="text" 
                 value={editEnglish} 
                 onChange={(e) => setEditEnglish(e.target.value)} 
                 className="w-full text-xl font-medium text-slate-900 border-b-2 border-indigo-200 focus:border-indigo-600 outline-none bg-transparent"
               />
             </div>
             <div>
               <label className="text-xs text-slate-400 font-bold uppercase">中文</label>
               <input 
                 type="text" 
                 value={editChinese} 
                 onChange={(e) => setEditChinese(e.target.value)} 
                 className="w-full text-base text-slate-600 border-b-2 border-slate-200 focus:border-indigo-600 outline-none bg-transparent"
               />
             </div>
          </div>
        ) : (
          <>
            <h3 className="text-2xl font-medium text-slate-900 tracking-tight break-words pr-6">{card.english}</h3>
            <p className="text-slate-500 font-medium leading-relaxed line-clamp-3">{card.chinese}</p>
          </>
        )}
      </div>

      <div className="mt-6 flex items-center justify-between">
        {isEditing ? (
          <div className="flex gap-2 w-full">
            <button onClick={handleSave} className="flex-1 py-2 bg-indigo-600 text-white rounded-lg font-bold text-sm hover:bg-indigo-700 flex items-center justify-center gap-1"><Check size={16}/> 保存</button>
            <button onClick={handleCancel} className="flex-1 py-2 bg-slate-100 text-slate-600 rounded-lg font-bold text-sm hover:bg-slate-200 flex items-center justify-center gap-1"><RotateCcw size={16}/> 取消</button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <button 
              onClick={(e) => {
                e.stopPropagation();
                speakWord(card.english);
              }}
              className="w-10 h-10 flex items-center justify-center bg-indigo-50 text-indigo-600 rounded-full hover:bg-indigo-600 hover:text-white transition-all duration-200 shadow-sm"
              title="听发音"
            >
              <Volume2 size={20} />
            </button>
            
            <button 
              onClick={(e) => {
                e.stopPropagation();
                onToggleFavorite?.();
              }}
              className={`w-10 h-10 flex items-center justify-center rounded-full transition-all duration-200 shadow-sm ${
                isFavorited 
                  ? 'bg-amber-100 text-amber-500 hover:bg-amber-200' 
                  : 'bg-slate-50 text-slate-400 hover:bg-slate-100'
              }`}
              title={isFavorited ? "取消收藏" : "收藏单词"}
            >
              <Star size={20} fill={isFavorited ? "currentColor" : "none"} />
            </button>
          </div>
        )}
      </div>

      {/* Edit and Delete Buttons (Top Right) */}
      <div className="absolute top-2 right-2 flex gap-1">
         {onUpdate && !isEditing && (
           <button
             onClick={(e) => {
               e.stopPropagation();
               setIsEditing(true);
               setEditEnglish(card.english);
               setEditChinese(card.chinese);
             }}
             className="p-1.5 text-slate-300 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
             title="编辑卡片"
           >
             <Edit2 size={16} />
           </button>
         )}
         {onDelete && !isEditing && (
          <button 
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="p-1.5 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
            title="删除卡片"
          >
            <X size={16} />
          </button>
        )}
      </div>
    </div>
  );
};
