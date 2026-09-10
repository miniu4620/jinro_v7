import React, { useState } from 'react';
import {
  Sparkles,
  ArrowRight,
  Trophy,
  BookOpen,
  CheckCircle2,
  Layers,
  Palette,
  Scissors,
  Sun,
  ShieldCheck,
  IceCream
} from 'lucide-react';
import { PERSONALITY_TYPES } from '../data/quizData';
import { PersonalityTypeId, AppScreen } from '../types';

interface CraftGuideScreenProps {
  nickname: string;
  selectedType: PersonalityTypeId;
  onNavigate: (screen: AppScreen) => void;
}

export const CraftGuideScreen: React.FC<CraftGuideScreenProps> = ({
  nickname,
  selectedType: initialType,
  onNavigate,
}) => {
  const [activeType, setActiveType] = useState<PersonalityTypeId>(initialType);
  const data = PERSONALITY_TYPES[activeType];

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 sm:py-10 space-y-6">
      {/* Header Banner */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold">
          <IceCream className="w-3.5 h-3.5 text-blue-600" />
          <span>미니유공방 부스 실물 체험 안내</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
          미니어처 아이스크림 제작 가이드 🍦
        </h2>
        <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
          {nickname ? `${nickname}님의 ` : ''}성향 결과에 맞춰 준비된 <strong>전용 재료 키트</strong>와 함께 세상에 단 하나뿐인 미니어처를 만들어보세요!
        </p>
      </div>

      {/* 4 Flavor Switcher Tabs */}
      <div className="grid grid-cols-4 gap-1.5 sm:gap-2 bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
        {(Object.keys(PERSONALITY_TYPES) as PersonalityTypeId[]).map((typeKey) => {
          const item = PERSONALITY_TYPES[typeKey];
          const isSelected = activeType === typeKey;
          return (
            <button
              key={typeKey}
              onClick={() => setActiveType(typeKey)}
              id={`craft-tab-${typeKey}`}
              className={`py-2 px-1 sm:px-3 rounded-xl text-center transition-all cursor-pointer ${
                isSelected
                  ? 'bg-white shadow-xs font-bold text-slate-900 ring-2 ring-blue-600'
                  : 'text-slate-600 hover:text-slate-900 font-medium'
              }`}
            >
              <div className="text-xl sm:text-2xl">{item.emoji}</div>
              <div className="text-[11px] sm:text-xs truncate font-bold">{item.nameKo.split(' ')[1] || item.nameKo}</div>
            </button>
          );
        })}
      </div>

      {/* Selected Kit Showcase Card */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xl p-6 sm:p-7 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
          <div>
            <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200">
              {data.nameKo} 전용 키트
            </span>
            <h3 className="text-xl font-black text-slate-900 mt-1.5">
              {data.craftKit.title}
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <div
              className="w-8 h-8 rounded-full border-2 border-white shadow-xs"
              style={{ backgroundColor: data.craftKit.clayColor }}
              title="클레이 기본 컬러"
            />
            <span className="text-xs font-bold text-slate-600">{data.colorName}</span>
          </div>
        </div>

        {/* Kit Contents Breakdown */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="bg-slate-50 rounded-2xl p-3.5 border border-slate-200/80 space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
              <Palette className="w-3.5 h-3.5 text-blue-600" />
              <span>베이스 점토</span>
            </div>
            <p className="text-xs text-slate-600 font-medium leading-relaxed">
              최고급 천사점토 & 수지점토 (컬러 조색용)
            </p>
          </div>

          <div className="bg-slate-50 rounded-2xl p-3.5 border border-slate-200/80 space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
              <Layers className="w-3.5 h-3.5 text-blue-600" />
              <span>포인트 토핑</span>
            </div>
            <p className="text-xs text-slate-600 font-medium leading-relaxed">
              {data.craftKit.toppings.join(', ')}
            </p>
          </div>

          <div className="bg-slate-50 rounded-2xl p-3.5 border border-slate-200/80 space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              <span>글레이즈 시럽</span>
            </div>
            <p className="text-xs text-slate-600 font-medium leading-relaxed">
              {data.craftKit.sauce}
            </p>
          </div>
        </div>

        {/* 5-Step Booth Crafting Workflow */}
        <div className="space-y-3 pt-2">
          <h4 className="text-sm font-extrabold text-slate-800 flex items-center gap-1.5">
            <Scissors className="w-4 h-4 text-blue-600" />
            <span>부스 현장 5단계 제작 순서</span>
          </h4>

          <div className="space-y-2.5 text-xs sm:text-sm">
            <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200">
              <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center shrink-0">1</span>
              <div>
                <strong className="text-slate-900 block font-bold">스태프 확인 & 재료 세트 수령</strong>
                <span className="text-slate-600 text-xs">부스 스태프에게 성향 진단 카드를 보여주면 {data.nameKo} 전용 와플콘과 토핑 트레이를 전달해드려요.</span>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200">
              <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center shrink-0">2</span>
              <div>
                <strong className="text-slate-900 block font-bold">점토 조색 및 마블링</strong>
                <span className="text-slate-600 text-xs">화이트 베이스 클레이에 {data.colorName.split('&')[0]} 컬러를 섞어 은은한 그라데이션을 연출합니다.</span>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200">
              <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center shrink-0">3</span>
              <div>
                <strong className="text-slate-900 block font-bold">아이스크림 스쿱 질감 내기</strong>
                <span className="text-slate-600 text-xs">동그랗게 뭉친 뒤 전용 미니 칫솔과 세공봉으로 톡톡 두드려 리얼한 셔벗 질감을 표현해요.</span>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200">
              <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center shrink-0">4</span>
              <div>
                <strong className="text-slate-900 block font-bold">와플콘 결합 & 시럽·토핑 데코</strong>
                <span className="text-slate-600 text-xs">목공풀로 콘에 스쿱을 고정하고, 달콤한 레진 시럽을 쪼르륵 흘린 뒤 미니어처 과일 토핑을 콕콕 얹습니다.</span>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200">
              <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center shrink-0">5</span>
              <div>
                <strong className="text-slate-900 block font-bold">건조 포토존 & 키링 완성!</strong>
                <span className="text-slate-600 text-xs">미니유 포토존에서 완성작을 촬영하고, 원하는 부자재(키링, 냉장고 자석, 메모꽂이)를 결합하여 소장합니다.</span>
              </div>
            </div>
          </div>
        </div>

        {/* Staff Assistance Badge */}
        <div className="bg-blue-50/80 border border-blue-200 rounded-2xl p-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-blue-900 font-bold">
            <ShieldCheck className="w-4 h-4 text-blue-600" />
            <span>만들기 어려워도 걱정 마세요! 공방 스태프 선생님들이 1:1로 친절히 도와드립니다.</span>
          </div>
        </div>
      </div>

      {/* Next Flow Buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
        <button
          type="button"
          onClick={() => onNavigate('game')}
          id="btn-go-game-from-craft"
          className="w-full py-3.5 px-5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
        >
          <Trophy className="w-4 h-4 text-blue-100" />
          <span>카드맞추기 랭킹전 도전</span>
        </button>

        <button
          type="button"
          onClick={() => onNavigate('guestbook')}
          id="btn-go-guestbook-from-craft"
          className="w-full py-3.5 px-5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
        >
          <BookOpen className="w-4 h-4" />
          <span>방명록 남기기</span>
        </button>
      </div>
    </div>
  );
};
