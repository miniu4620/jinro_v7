import React, { useState } from 'react';
import { Sparkles, Trophy, BookOpen, ArrowRight, Star } from 'lucide-react';
import { AppScreen } from '../types';

interface StartScreenProps {
  nickname: string;
  onSetNickname: (nick: string) => void;
  onStartQuiz: () => void;
  onNavigate: (screen: AppScreen) => void;
}

export const StartScreen: React.FC<StartScreenProps> = ({
  nickname,
  onSetNickname,
  onStartQuiz,
  onNavigate,
}) => {
  const [localNick, setLocalNick] = useState(nickname);
  const [errorMsg, setErrorMsg] = useState('');

  const validateAndProceed = (targetAction: 'quiz' | 'game' | 'guestbook') => {
    const trimmed = localNick.trim();
    if (!trimmed) {
      setErrorMsg('닉네임을 입력해주세요! (최대 8자)');
      return;
    }
    if (trimmed.length > 8) {
      setErrorMsg('닉네임은 한글/영문 8자 이내로 입력해주세요.');
      return;
    }
    setErrorMsg('');
    onSetNickname(trimmed);

    if (targetAction === 'quiz') {
      onStartQuiz();
    } else {
      onNavigate(targetAction);
    }
  };

  return (
    <div className="max-w-xl mx-auto px-4 py-8 sm:py-12">
      {/* Hero Badge */}
      <div className="text-center mb-6">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold shadow-xs">
          <Star className="w-3.5 h-3.5 fill-blue-600 text-blue-600" />
          <span>2026 수원청소년진로박람회 &lt;AI와 함께 미래를 JOB다!&gt;</span>
        </div>
      </div>

      {/* Main Title Box */}
      <div className="text-center space-y-3 mb-8">
        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 tracking-tight leading-snug">
          청소년 진로 성향 진단<br />
          <span className="text-blue-600 font-extrabold">
            with 미니유공방
          </span>
        </h2>
        <p className="text-sm sm:text-base text-slate-600 font-medium max-w-md mx-auto leading-relaxed">
          재미있는 10가지 일상 진로 상황극으로 나의 성향을 찾고,<br className="hidden sm:inline" />
          미니유공방 미니어처 작가님들과 함께 나만의 맞춤 미니어처 키트를 직접 제작해보세요!
        </p>
      </div>

      {/* 10 Fruit Personality Types Preview Grid */}
      <div className="mb-8">
        <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
          {[
            { emoji: '🍏', name: '사과형', color: 'text-emerald-700 bg-emerald-50/70 border-emerald-100' },
            { emoji: '🐉', name: '용과형', color: 'text-fuchsia-700 bg-fuchsia-50/70 border-fuchsia-100' },
            { emoji: '🫐', name: '블루베리', color: 'text-indigo-700 bg-indigo-50/70 border-indigo-100' },
            { emoji: '🍊', name: '자몽형', color: 'text-orange-700 bg-orange-50/70 border-orange-100' },
            { emoji: '🍌', name: '바나나형', color: 'text-amber-700 bg-amber-50/70 border-amber-100' },
            { emoji: '🍓', name: '딸기형', color: 'text-rose-700 bg-rose-50/70 border-rose-100' },
            { emoji: '🍉', name: '수박형', color: 'text-red-700 bg-red-50/70 border-red-100' },
            { emoji: '🍋', name: '라임형', color: 'text-lime-800 bg-lime-50/70 border-lime-100' },
            { emoji: '🥕', name: '당근형', color: 'text-amber-800 bg-amber-50/70 border-amber-100' },
            { emoji: '🥑', name: '아보카도', color: 'text-emerald-800 bg-emerald-50/70 border-emerald-100' },
          ].map((item, idx) => (
            <div
              key={idx}
              className={`border rounded-xl p-2 text-center transition-all hover:-translate-y-0.5 shadow-2xs ${item.color}`}
            >
              <div className="text-xl sm:text-2xl mb-0.5">{item.emoji}</div>
              <div className="text-[10px] sm:text-xs font-bold leading-tight truncate">{item.name}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Nickname & Action Card */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xl p-6 sm:p-8 space-y-6">
        <div>
          <label htmlFor="nickname-input" className="block text-sm font-bold text-slate-800 mb-2 flex items-center justify-between">
            <span>참가자 닉네임 입력</span>
            <span className="text-xs text-slate-400 font-normal">
              {localNick.length}/8자
            </span>
          </label>
          <div className="relative">
            <input
              id="nickname-input"
              type="text"
              maxLength={8}
              value={localNick}
              onChange={(e) => {
                setLocalNick(e.target.value);
                if (errorMsg) setErrorMsg('');
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  validateAndProceed('quiz');
                }
              }}
              placeholder="예: 꿈꾸는별, 히어로"
              className="w-full px-4 py-3.5 rounded-xl border border-slate-300 text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-600 focus:border-blue-600 text-base font-medium shadow-2xs"
            />
            {localNick && (
              <button
                type="button"
                onClick={() => setLocalNick('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 hover:text-slate-600 px-2 py-1 cursor-pointer"
              >
                지우기
              </button>
            )}
          </div>
          {errorMsg ? (
            <p className="mt-2 text-xs font-bold text-rose-500 flex items-center gap-1">
              ⚠️ {errorMsg}
            </p>
          ) : (
            <p className="mt-2 text-xs text-slate-400">
              * 결과 카드 발급 및 카드맞추기 랭킹 등재에 사용됩니다.
            </p>
          )}
        </div>

        {/* Primary Action Button: 진단 시작하기 */}
        <button
          type="button"
          id="btn-start-quiz"
          onClick={() => validateAndProceed('quiz')}
          className="w-full py-4 px-6 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-base sm:text-lg shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98]"
        >
          <Sparkles className="w-5 h-5" />
          <span>성향 진단 시작하기 (10문항)</span>
          <ArrowRight className="w-5 h-5 ml-1" />
        </button>

        {/* Secondary Quick Access Options */}
        <div className="pt-4 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            type="button"
            id="btn-go-game"
            onClick={() => validateAndProceed('game')}
            className="w-full py-3 px-4 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <Trophy className="w-4 h-4 text-amber-500" />
            <span>카드맞추기 랭킹 도전</span>
          </button>

          <button
            type="button"
            id="btn-go-guestbook"
            onClick={() => validateAndProceed('guestbook')}
            className="w-full py-3 px-4 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <BookOpen className="w-4 h-4 text-blue-600" />
            <span>방명록 남기기</span>
          </button>
        </div>
      </div>
    </div>
  );
};
