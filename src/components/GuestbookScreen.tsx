import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  Send,
  Heart,
  Sparkles,
  RotateCcw,
  MessageSquare,
  Filter,
  CheckCircle2,
  Users
} from 'lucide-react';
import { GuestbookEntry, PersonalityTypeId, AppScreen } from '../types';
import { PERSONALITY_TYPES } from '../data/quizData';
import {
  subscribeGuestbook,
  addGuestbookEntry,
  likeGuestbookEntry
} from '../lib/firebase';

interface GuestbookScreenProps {
  nickname: string;
  personalityType?: PersonalityTypeId;
  onSetNickname: (nick: string) => void;
  onNavigate: (screen: AppScreen) => void;
}

const STICKERS = [
  '🍏', '🐉', '🫐', '🍊', '🍌', '🍓', '🍉', '🍋', '🥕', '🥑',
  '💖', '✨', '⭐', '🎓', '🎨'
];

export const GuestbookScreen: React.FC<GuestbookScreenProps> = ({
  nickname,
  personalityType,
  onSetNickname,
  onNavigate,
}) => {
  const [entries, setEntries] = useState<GuestbookEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [authorNick, setAuthorNick] = useState(nickname || '');
  const [authorType, setAuthorType] = useState<string>(personalityType || 'apple');
  const [selectedSticker, setSelectedSticker] = useState('💖');
  const [messageText, setMessageText] = useState('');
  const [formError, setFormError] = useState('');
  const [successToast, setSuccessToast] = useState(false);

  // Filter State
  const [activeFilter, setActiveFilter] = useState<string>('all');

  // Sync personalityType if provided from quiz
  useEffect(() => {
    if (personalityType) {
      setAuthorType(personalityType);
    }
  }, [personalityType]);

  // Sync nickname
  useEffect(() => {
    if (nickname && !authorNick) {
      setAuthorNick(nickname);
    }
  }, [nickname]);

  // Realtime Cloud Firestore Synchronization
  useEffect(() => {
    let isSubscribed = true;

    const unsubscribe = subscribeGuestbook(
      (items) => {
        if (isSubscribed) {
          setEntries(items);
          setIsLoading(false);
          try {
            localStorage.setItem('eunpyeong_guestbook_cache', JSON.stringify(items));
          } catch {
            // ignore
          }
        }
      },
      (err) => {
        console.warn('Firestore subscription notice, checking cache/server fallback:', err);
        // Fallback to local cache if network is interrupted
        try {
          const cached = localStorage.getItem('eunpyeong_guestbook_cache');
          if (cached) {
            setEntries(JSON.parse(cached));
          }
        } catch {
          // ignore
        }
        setIsLoading(false);
      }
    );

    return () => {
      isSubscribed = false;
      unsubscribe();
    };
  }, []);

  const handleRefresh = () => {
    try {
      const cached = localStorage.getItem('eunpyeong_guestbook_cache');
      if (cached) {
        setEntries(JSON.parse(cached));
      }
    } catch {
      // ignore
    }
  };

  // Submit new entry
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanNick = authorNick.trim();
    const cleanMsg = messageText.trim();

    if (!cleanNick) {
      setFormError('닉네임을 입력해주세요!');
      return;
    }
    if (!cleanMsg) {
      setFormError('소중한 방문 소감이나 응원의 한마디를 적어주세요!');
      return;
    }

    setFormError('');
    setIsSubmitting(true);
    onSetNickname(cleanNick);

    const payload = {
      nickname: cleanNick,
      personalityType: authorType,
      sticker: selectedSticker,
      message: cleanMsg,
      likes: 0,
      createdAt: new Date().toISOString(),
    };

    try {
      // 1. Direct Cloud Firestore write (Syncs across all participant phones)
      const createdItem = await addGuestbookEntry(payload);
      setMessageText('');
      setSuccessToast(true);
      setTimeout(() => setSuccessToast(false), 3000);

      // 2. Dual backup write to server API if accessible
      fetch('/api/guestbook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(payload),
      }).catch(() => {});
    } catch (err) {
      console.error('Failed to post guestbook entry to Firestore:', err);
      // Fallback: try server API
      try {
        const res = await fetch('/api/guestbook', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify(payload),
        });
        const resData = await res.json();
        if (res.ok && resData?.item) {
          setEntries((prev) => [resData.item, ...prev]);
        }
      } catch {
        // Local fallback
        const fallbackEntry: GuestbookEntry = {
          id: `guest-local-${Date.now()}`,
          ...payload,
        };
        setEntries((prev) => [fallbackEntry, ...prev]);
      }
      setMessageText('');
      setSuccessToast(true);
      setTimeout(() => setSuccessToast(false), 3000);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Like an entry
  const handleLike = async (id: string) => {
    // Optimistic UI update
    setEntries((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, likes: (item.likes || 0) + 1 } : item
      )
    );

    try {
      // Update in Firestore
      await likeGuestbookEntry(id);
      // Also notify server
      fetch(`/api/guestbook/${id}/like`, { method: 'POST' }).catch(() => {});
    } catch (err) {
      console.error('Failed to like entry in Firestore:', err);
      fetch(`/api/guestbook/${id}/like`, { method: 'POST' }).catch(() => {});
    }
  };

  // Helper time format
  const formatTimeAgo = (isoDate: string) => {
    try {
      const date = new Date(isoDate);
      const diffMs = Date.now() - date.getTime();
      const diffMins = Math.floor(diffMs / (1000 * 60));
      if (diffMins < 1) return '방금 전';
      if (diffMins < 60) return `${diffMins}분 전`;
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `${diffHours}시간 전`;
      return `${date.getMonth() + 1}월 ${date.getDate()}일`;
    } catch {
      return '';
    }
  };

  // Filter entries
  const filteredEntries =
    activeFilter === 'all'
      ? entries
      : entries.filter((e) => e.personalityType === activeFilter);

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 sm:py-10 space-y-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold shadow-2xs">
          <BookOpen className="w-3.5 h-3.5 text-blue-600" />
          <span>미니유공방 방명록</span>
          <span className="w-1 h-1 rounded-full bg-blue-500" />
          <span className="inline-flex items-center gap-1 text-emerald-600 font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            실시간 클라우드 DB 연동
          </span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
          미니유공방 방문록 & 체험 후기 📖
        </h2>
        <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
          오늘 미니유공방 부스를 다녀간 친구들의 소중한 한 줄 기록을 남겨보세요!
        </p>
      </div>

      {/* Guestbook Form Card */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xl p-6 sm:p-7 space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <span className="text-lg">✍️</span>
            <h3 className="text-base font-extrabold text-slate-900">
              새로운 방문록 남기기
            </h3>
          </div>
          {successToast && (
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full flex items-center gap-1.5 border border-emerald-200 animate-in fade-in">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>방명록이 등록되었습니다!</span>
            </span>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Nickname Input */}
            <div>
              <label htmlFor="gb-nick-input" className="block text-xs font-bold text-slate-700 mb-1">
                작성자 닉네임 (최대 12자)
              </label>
              <input
                id="gb-nick-input"
                type="text"
                maxLength={12}
                value={authorNick}
                onChange={(e) => setAuthorNick(e.target.value)}
                placeholder="예: 꿈꾸는별, 히어로"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
              />
            </div>

            {/* Personality Type Selector */}
            <div>
              <label htmlFor="gb-type-select" className="block text-xs font-bold text-slate-700 mb-1">
                나의 진로 성향 선택
              </label>
              <select
                id="gb-type-select"
                value={authorType}
                onChange={(e) => setAuthorType(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm bg-white focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
              >
                <option value="apple">🍏 사과형 (싱그러운 창의 탐험가)</option>
                <option value="dragonfruit">🐉 용과형 (화려한 파격 혁신가)</option>
                <option value="blueberry">🫐 블루베리형 (명석한 지적 분석가)</option>
                <option value="grapefruit">🍊 자몽형 (당찬 트렌디 직관러)</option>
                <option value="banana">🍌 바나나형 (유쾌발랄 비타민 행동파)</option>
                <option value="strawberry">🍓 딸기형 (달콤톡톡 공감 힐러)</option>
                <option value="watermelon">🍉 수박형 (시원통쾌 포용의 리더)</option>
                <option value="lime">🍋 라임형 (번뜩이는 재치 해결사)</option>
                <option value="carrot">🥕 당근형 (성실단단 신뢰의 장인)</option>
                <option value="avocado">🥑 아보카도형 (부드러운 포근 밸런서)</option>
              </select>
            </div>
          </div>

          {/* Sticker Selection */}
          <div>
            <span className="block text-xs font-bold text-slate-700 mb-1.5">
              스티커 고르기
            </span>
            <div className="flex flex-wrap gap-2">
              {STICKERS.map((stk) => (
                <button
                  key={stk}
                  type="button"
                  onClick={() => setSelectedSticker(stk)}
                  className={`w-9 h-9 rounded-xl text-lg flex items-center justify-center transition-all cursor-pointer ${
                    selectedSticker === stk
                      ? 'bg-blue-50 ring-2 ring-blue-600 scale-110 shadow-2xs'
                      : 'bg-slate-50 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  {stk}
                </button>
              ))}
            </div>
          </div>

          {/* Message Textarea */}
          <div>
            <label htmlFor="gb-message-input" className="block text-xs font-bold text-slate-700 mb-1">
              방문 소감 & 응원 메시지
            </label>
            <textarea
              id="gb-message-input"
              rows={3}
              maxLength={250}
              value={messageText}
              onChange={(e) => {
                setMessageText(e.target.value);
                if (formError) setFormError('');
              }}
              placeholder="체험 후기나 친구들에게 전하고 싶은 따뜻한 한마디를 남겨주세요! (예: 진로 성향 진단도 신기하고 미니어처 키트 완성해보니 뿌듯해요 ✨)"
              className="w-full px-4 py-3 rounded-2xl border border-slate-300 text-xs sm:text-sm placeholder:text-slate-400 focus:ring-2 focus:ring-blue-600 focus:outline-hidden resize-none"
            />
            <div className="flex justify-between items-center mt-1">
              {formError ? (
                <span className="text-xs font-bold text-rose-500">⚠️ {formError}</span>
              ) : (
                <span className="text-[11px] text-slate-400">최대 250자</span>
              )}
              <span className="text-[11px] text-slate-400 font-mono">
                {messageText.length}/250자
              </span>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            id="btn-submit-guestbook"
            disabled={isSubmitting}
            className="w-full py-3.5 px-6 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
            <span>{isSubmitting ? '기록 저장 중...' : '방명록 남기기'}</span>
          </button>
        </form>
      </div>

      {/* Filter Tabs & Refresh Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1">
          <button
            onClick={() => setActiveFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-all whitespace-nowrap ${
              activeFilter === 'all'
                ? 'bg-slate-900 text-white shadow-2xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            전체 ({entries.length})
          </button>
          {[
            { id: 'apple', label: '🍏 사과' },
            { id: 'dragonfruit', label: '🐉 용과' },
            { id: 'blueberry', label: '🫐 블루베리' },
            { id: 'grapefruit', label: '🍊 자몽' },
            { id: 'banana', label: '🍌 바나나' },
            { id: 'strawberry', label: '🍓 딸기' },
            { id: 'watermelon', label: '🍉 수박' },
            { id: 'lime', label: '🍋 라임' },
            { id: 'carrot', label: '🥕 당근' },
            { id: 'avocado', label: '🥑 아보카도' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveFilter(item.id)}
              className={`px-2.5 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-all whitespace-nowrap ${
                activeFilter === item.id
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={handleRefresh}
          className="self-end sm:self-center text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1 px-2.5 py-1 rounded-lg hover:bg-slate-100 cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>새로고침</span>
        </button>
      </div>

      {/* Guestbook List Display */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="py-16 text-center text-xs text-slate-400">
            방명록을 불러오는 중...
          </div>
        ) : filteredEntries.length === 0 ? (
          <div className="py-16 text-center bg-white rounded-3xl border border-slate-200 p-8 space-y-2">
            <span className="text-3xl">📝</span>
            <p className="text-sm font-bold text-slate-800">
              {activeFilter === 'all' ? '아직 등록된 방명록이 없습니다.' : '해당 성향의 방명록이 아직 없습니다.'}
            </p>
            <p className="text-xs text-slate-500">
              첫 번째 축하 메시지를 남겨보세요!
            </p>
          </div>
        ) : (
          filteredEntries.map((item) => {
            const pType =
              item.personalityType &&
              item.personalityType in PERSONALITY_TYPES
                ? PERSONALITY_TYPES[item.personalityType as PersonalityTypeId]
                : null;

            return (
              <div
                key={item.id}
                className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs hover:shadow-md transition-all space-y-2.5"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{item.sticker || '💖'}</span>
                    <div>
                      <span className="text-sm font-extrabold text-slate-900">
                        {item.nickname}
                      </span>
                      {pType && (
                        <span
                          className={`ml-2 text-[10px] font-bold px-2 py-0.5 rounded-full border ${pType.badgeColor}`}
                        >
                          {pType.name}
                        </span>
                      )}
                    </div>
                  </div>
                  <span className="text-[11px] text-slate-400">
                    {formatTimeAgo(item.createdAt)}
                  </span>
                </div>

                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed break-words whitespace-pre-wrap">
                  {item.message}
                </p>

                <div className="flex items-center justify-end pt-1">
                  <button
                    type="button"
                    onClick={() => handleLike(item.id)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold text-rose-500 bg-rose-50 hover:bg-rose-100 transition-colors cursor-pointer"
                  >
                    <Heart className="w-3.5 h-3.5 fill-rose-500" />
                    <span>{item.likes || 0}</span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
