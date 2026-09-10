import React, { useEffect, useState, useRef } from 'react';
import confetti from 'canvas-confetti';
import {
  Trophy,
  BookOpen,
  RotateCcw,
  CheckCircle,
  Copy,
  GraduationCap,
  Bot,
  RefreshCw,
  Sparkles
} from 'lucide-react';
import { PERSONALITY_TYPES } from '../data/quizData';
import { PersonalityTypeId, AppScreen } from '../types';

interface ResultCardProps {
  nickname: string;
  personalityType: PersonalityTypeId;
  scores?: { extraversion: number; feeling: number };
  onNavigate: (screen: AppScreen) => void;
  onRestartQuiz: () => void;
}

export const ResultCard: React.FC<ResultCardProps> = ({
  nickname,
  personalityType,
  scores,
  onNavigate,
  onRestartQuiz,
}) => {
  const data = PERSONALITY_TYPES[personalityType] || PERSONALITY_TYPES.strawberry;

  // Helper to get a random mentor quote from the pool
  const getRandomMentorQuote = (excludeQuote?: string): string => {
    const quotes = data.mentorQuotes || [];
    if (quotes.length === 0) return `${nickname || '참가자'}님은 ${data.nameKo}!`;
    const available = excludeQuote ? quotes.filter((q) => q !== excludeQuote) : quotes;
    const pool = available.length > 0 ? available : quotes;
    return pool[Math.floor(Math.random() * pool.length)];
  };

  const [aiQuote, setAiQuote] = useState<string>(() => {
    const quotes = (PERSONALITY_TYPES[personalityType] || PERSONALITY_TYPES.strawberry).mentorQuotes || [];
    return quotes.length > 0 ? quotes[Math.floor(Math.random() * quotes.length)] : '';
  });
  const [isLoadingQuote, setIsLoadingQuote] = useState(false);
  const [isRerolling, setIsRerolling] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  // Trigger celebration confetti once on mount
  useEffect(() => {
    try {
      confetti({
        particleCount: 55,
        spread: 65,
        origin: { y: 0.6 },
        colors: ['#f43f5e', '#10b981', '#f59e0b', '#3b82f6', '#ec4899', '#8b5cf6'],
      });
    } catch {
      // ignore
    }
  }, []);

  // Fetch or enhance personalized quote from server if available
  useEffect(() => {
    let isMounted = true;
    if (!aiQuote) {
      setAiQuote(getRandomMentorQuote());
    }

    fetch('/api/generate-description', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nickname: nickname || '참가자',
        type: personalityType,
      }),
    })
      .then((res) => res.json())
      .then((resData) => {
        if (isMounted && resData?.description) {
          setAiQuote(resData.description);
        }
      })
      .catch((err) => {
        console.error('Failed to fetch AI quote:', err);
      });

    return () => {
      isMounted = false;
    };
  }, [nickname, personalityType]);

  const handleRerollQuote = () => {
    setIsRerolling(true);
    const nextQuote = getRandomMentorQuote(aiQuote);
    setAiQuote(nextQuote);
    setTimeout(() => setIsRerolling(false), 300);
  };

  const handleCopyText = async () => {
    const textToCopy = `[2026 수원청소년진로박람회 <AI와 함께 미래를 JOB다!> with 미니유공방]\n${nickname || '참가자'}님의 성향 진단 결과는 ${data.emoji} ${data.nameKo}!\n\n✨ 성향 키워드: ${data.keywords.join(' ')}\n🎓 추천 진로/전공: ${data.recommendedMajors.slice(0, 3).join(', ')}\n\n나만의 진로 성향을 찾고 미니어처 키트를 체험해보세요!`;
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(textToCopy);
      }
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  // Render character illustration SVG for all 10 fruit types
  const renderCharacterSvg = () => {
    switch (personalityType) {
      case 'apple':
        return (
          <svg viewBox="0 0 160 160" className="w-28 h-28 mx-auto drop-shadow-md">
            {/* Cone */}
            <polygon points="50,105 110,105 80,155" fill="#fcd34d" stroke="#d97706" strokeWidth="2.5" />
            <line x1="60" y1="115" x2="100" y2="115" stroke="#d97706" strokeWidth="1.5" />
            <line x1="68" y1="130" x2="92" y2="130" stroke="#d97706" strokeWidth="1.5" />
            {/* Green Apple Scoop */}
            <circle cx="80" cy="75" r="42" fill="#86efac" stroke="#16a34a" strokeWidth="3" />
            <circle cx="68" cy="74" r="4" fill="#14532d" />
            <circle cx="92" cy="74" r="4" fill="#14532d" />
            <path d="M76,82 Q80,86 84,82" stroke="#14532d" strokeWidth="2.5" fill="none" strokeLinecap="round" />
            <ellipse cx="61" cy="79" rx="4" ry="2.5" fill="#4ade80" />
            <ellipse cx="99" cy="79" rx="4" ry="2.5" fill="#4ade80" />
            {/* Apple Stem and Leaf */}
            <path d="M80,34 Q82,22 86,18" stroke="#78350f" strokeWidth="3" fill="none" strokeLinecap="round" />
            <ellipse cx="89" cy="24" rx="7" ry="4" fill="#22c55e" transform="rotate(-20 89 24)" />
            <circle cx="56" cy="60" r="2" fill="#dcfce7" />
            <circle cx="102" cy="62" r="2.5" fill="#dcfce7" />
          </svg>
        );

      case 'dragonfruit':
        return (
          <svg viewBox="0 0 160 160" className="w-28 h-28 mx-auto drop-shadow-md">
            {/* Cone */}
            <polygon points="50,105 110,105 80,155" fill="#fcd34d" stroke="#d97706" strokeWidth="2.5" />
            <line x1="60" y1="115" x2="100" y2="115" stroke="#d97706" strokeWidth="1.5" />
            <line x1="68" y1="130" x2="92" y2="130" stroke="#d97706" strokeWidth="1.5" />
            {/* Dragon Fruit Magenta Scoop */}
            <circle cx="80" cy="75" r="42" fill="#ec4899" stroke="#be185d" strokeWidth="3" />
            {/* Green Leafy Horns */}
            <path d="M60,40 Q55,24 68,32" fill="#22c55e" stroke="#15803d" strokeWidth="1.5" />
            <path d="M100,40 Q105,24 92,32" fill="#22c55e" stroke="#15803d" strokeWidth="1.5" />
            <path d="M80,35 Q80,20 86,28" fill="#4ade80" stroke="#15803d" strokeWidth="1.5" />
            {/* Sesame Seed Dots */}
            <circle cx="62" cy="60" r="1.5" fill="#1e293b" />
            <circle cx="98" cy="62" r="1.5" fill="#1e293b" />
            <circle cx="72" cy="50" r="1.5" fill="#1e293b" />
            <circle cx="88" cy="52" r="1.5" fill="#1e293b" />
            {/* Face */}
            <circle cx="68" cy="74" r="4" fill="#500724" />
            <circle cx="92" cy="74" r="4" fill="#500724" />
            <path d="M76,82 Q80,87 84,82" stroke="#500724" strokeWidth="2.5" fill="none" strokeLinecap="round" />
            <ellipse cx="61" cy="80" rx="4" ry="2.5" fill="#f472b6" />
            <ellipse cx="99" cy="80" rx="4" ry="2.5" fill="#f472b6" />
          </svg>
        );

      case 'blueberry':
        return (
          <svg viewBox="0 0 160 160" className="w-28 h-28 mx-auto drop-shadow-md">
            {/* Cone */}
            <polygon points="50,105 110,105 80,155" fill="#fcd34d" stroke="#d97706" strokeWidth="2.5" />
            <line x1="60" y1="115" x2="100" y2="115" stroke="#d97706" strokeWidth="1.5" />
            <line x1="68" y1="130" x2="92" y2="130" stroke="#d97706" strokeWidth="1.5" />
            {/* Indigo Blueberry Scoop */}
            <circle cx="80" cy="75" r="42" fill="#6366f1" stroke="#3730a3" strokeWidth="3" />
            {/* Blueberry Toppings */}
            <circle cx="73" cy="35" r="7" fill="#312e81" stroke="#4338ca" strokeWidth="1.5" />
            <circle cx="87" cy="34" r="7" fill="#312e81" stroke="#4338ca" strokeWidth="1.5" />
            <circle cx="80" cy="27" r="6" fill="#1e1b4b" stroke="#3730a3" strokeWidth="1.5" />
            {/* Face */}
            <circle cx="68" cy="74" r="4" fill="#1e1b4b" />
            <circle cx="92" cy="74" r="4" fill="#1e1b4b" />
            <path d="M76,82 Q80,86 84,82" stroke="#1e1b4b" strokeWidth="2.5" fill="none" strokeLinecap="round" />
            <ellipse cx="61" cy="79" rx="4" ry="2.5" fill="#a5b4fc" />
            <ellipse cx="99" cy="79" rx="4" ry="2.5" fill="#a5b4fc" />
            <circle cx="56" cy="62" r="1.5" fill="#e0e7ff" />
            <circle cx="104" cy="60" r="1.5" fill="#e0e7ff" />
          </svg>
        );

      case 'grapefruit':
        return (
          <svg viewBox="0 0 160 160" className="w-28 h-28 mx-auto drop-shadow-md">
            {/* Cone */}
            <polygon points="50,105 110,105 80,155" fill="#fcd34d" stroke="#d97706" strokeWidth="2.5" />
            <line x1="60" y1="115" x2="100" y2="115" stroke="#d97706" strokeWidth="1.5" />
            <line x1="68" y1="130" x2="92" y2="130" stroke="#d97706" strokeWidth="1.5" />
            {/* Coral Grapefruit Scoop */}
            <circle cx="80" cy="75" r="42" fill="#fb923c" stroke="#ea580c" strokeWidth="3" />
            {/* Grapefruit Slice Topper */}
            <path d="M72,36 A12,12 0 0,1 94,28 L83,36 Z" fill="#f43f5e" stroke="#fed7aa" strokeWidth="1.5" />
            <circle cx="83" cy="33" r="1" fill="#fff" />
            {/* Face */}
            <circle cx="68" cy="74" r="4" fill="#7c2d12" />
            <circle cx="92" cy="74" r="4" fill="#7c2d12" />
            <path d="M76,82 Q80,87 84,82" stroke="#7c2d12" strokeWidth="2.5" fill="none" strokeLinecap="round" />
            <ellipse cx="61" cy="80" rx="4" ry="2.5" fill="#fdba74" />
            <ellipse cx="99" cy="80" rx="4" ry="2.5" fill="#fdba74" />
          </svg>
        );

      case 'banana':
        return (
          <svg viewBox="0 0 160 160" className="w-28 h-28 mx-auto drop-shadow-md">
            {/* Cone */}
            <polygon points="50,105 110,105 80,155" fill="#fcd34d" stroke="#d97706" strokeWidth="2.5" />
            <line x1="60" y1="115" x2="100" y2="115" stroke="#d97706" strokeWidth="1.5" />
            <line x1="68" y1="130" x2="92" y2="130" stroke="#d97706" strokeWidth="1.5" />
            {/* Banana Scoop */}
            <circle cx="80" cy="75" r="42" fill="#fde047" stroke="#ca8a04" strokeWidth="3" />
            <path d="M48,82 Q60,96 74,84 Q86,98 98,84 Q108,94 112,80" fill="#d97706" />
            {/* Banana Slice Topping */}
            <circle cx="80" cy="36" r="10" fill="#fef08a" stroke="#ca8a04" strokeWidth="2" />
            <circle cx="80" cy="36" r="3" fill="#eab308" />
            {/* Face */}
            <circle cx="68" cy="74" r="4" fill="#713f12" />
            <circle cx="92" cy="74" r="4" fill="#713f12" />
            <path d="M75,81 Q80,87 85,81" stroke="#713f12" strokeWidth="2.5" fill="none" strokeLinecap="round" />
            <ellipse cx="60" cy="79" rx="4" ry="2.5" fill="#f59e0b" />
            <ellipse cx="100" cy="79" rx="4" ry="2.5" fill="#f59e0b" />
          </svg>
        );

      case 'strawberry':
        return (
          <svg viewBox="0 0 160 160" className="w-28 h-28 mx-auto drop-shadow-md">
            {/* Cone */}
            <polygon points="50,105 110,105 80,155" fill="#fcd34d" stroke="#d97706" strokeWidth="2.5" />
            <line x1="60" y1="115" x2="100" y2="115" stroke="#d97706" strokeWidth="1.5" />
            <line x1="68" y1="130" x2="92" y2="130" stroke="#d97706" strokeWidth="1.5" />
            {/* Strawberry Scoop */}
            <circle cx="80" cy="75" r="42" fill="#fda4af" stroke="#f43f5e" strokeWidth="3" />
            <path d="M50,90 Q65,102 75,92 Q85,104 95,92 Q105,102 110,88" fill="#fda4af" />
            {/* Face */}
            <circle cx="68" cy="74" r="4" fill="#881337" />
            <circle cx="92" cy="74" r="4" fill="#881337" />
            <path d="M76,82 Q80,87 84,82" stroke="#881337" strokeWidth="2.5" fill="none" strokeLinecap="round" />
            <ellipse cx="61" cy="80" rx="4" ry="2.5" fill="#fb7185" />
            <ellipse cx="99" cy="80" rx="4" ry="2.5" fill="#fb7185" />
            {/* Strawberry Topping */}
            <polygon points="76,34 84,34 80,44" fill="#e11d48" />
            <polygon points="73,34 80,24 87,34" fill="#15803d" />
            <circle cx="78" cy="38" r="0.8" fill="#fef08a" />
            <circle cx="82" cy="38" r="0.8" fill="#fef08a" />
          </svg>
        );

      case 'watermelon':
        return (
          <svg viewBox="0 0 160 160" className="w-28 h-28 mx-auto drop-shadow-md">
            {/* Cone */}
            <polygon points="50,105 110,105 80,155" fill="#fcd34d" stroke="#d97706" strokeWidth="2.5" />
            <line x1="60" y1="115" x2="100" y2="115" stroke="#d97706" strokeWidth="1.5" />
            <line x1="68" y1="130" x2="92" y2="130" stroke="#d97706" strokeWidth="1.5" />
            {/* Watermelon Red Scoop with Green Rind Base */}
            <circle cx="80" cy="75" r="42" fill="#f87171" stroke="#dc2626" strokeWidth="3" />
            <path d="M48,88 Q64,104 80,94 Q96,104 112,88" fill="#16a34a" stroke="#15803d" strokeWidth="1.5" />
            {/* Watermelon seeds */}
            <ellipse cx="62" cy="62" rx="2" ry="3" fill="#1e293b" />
            <ellipse cx="98" cy="62" rx="2" ry="3" fill="#1e293b" />
            <ellipse cx="80" cy="50" rx="2" ry="3" fill="#1e293b" />
            {/* Face */}
            <circle cx="68" cy="74" r="4" fill="#450a0a" />
            <circle cx="92" cy="74" r="4" fill="#450a0a" />
            <path d="M76,82 Q80,87 84,82" stroke="#450a0a" strokeWidth="2.5" fill="none" strokeLinecap="round" />
            <ellipse cx="61" cy="80" rx="4" ry="2.5" fill="#fca5a5" />
            <ellipse cx="99" cy="80" rx="4" ry="2.5" fill="#fca5a5" />
          </svg>
        );

      case 'lime':
        return (
          <svg viewBox="0 0 160 160" className="w-28 h-28 mx-auto drop-shadow-md">
            {/* Cone */}
            <polygon points="50,105 110,105 80,155" fill="#fcd34d" stroke="#d97706" strokeWidth="2.5" />
            <line x1="60" y1="115" x2="100" y2="115" stroke="#d97706" strokeWidth="1.5" />
            <line x1="68" y1="130" x2="92" y2="130" stroke="#d97706" strokeWidth="1.5" />
            {/* Neon Lime Scoop */}
            <circle cx="80" cy="75" r="42" fill="#bef264" stroke="#65a30d" strokeWidth="3" />
            {/* Lime Wedge Topper */}
            <path d="M72,34 A12,12 0 0,1 94,26 L83,34 Z" fill="#84cc16" stroke="#4d7c0f" strokeWidth="1.5" />
            <ellipse cx="94" cy="24" rx="4" ry="2" fill="#15803d" />
            {/* Face */}
            <circle cx="68" cy="74" r="4" fill="#365314" />
            <circle cx="92" cy="74" r="4" fill="#365314" />
            <path d="M76,82 Q80,87 84,82" stroke="#365314" strokeWidth="2.5" fill="none" strokeLinecap="round" />
            <ellipse cx="61" cy="80" rx="4" ry="2.5" fill="#d9f99d" />
            <ellipse cx="99" cy="80" rx="4" ry="2.5" fill="#d9f99d" />
          </svg>
        );

      case 'carrot':
        return (
          <svg viewBox="0 0 160 160" className="w-28 h-28 mx-auto drop-shadow-md">
            {/* Cone */}
            <polygon points="50,105 110,105 80,155" fill="#fcd34d" stroke="#d97706" strokeWidth="2.5" />
            <line x1="60" y1="115" x2="100" y2="115" stroke="#d97706" strokeWidth="1.5" />
            <line x1="68" y1="130" x2="92" y2="130" stroke="#d97706" strokeWidth="1.5" />
            {/* Carrot Terracotta Scoop */}
            <circle cx="80" cy="75" r="42" fill="#ea580c" stroke="#9a3412" strokeWidth="3" />
            {/* Cute Mini Carrot Topper */}
            <polygon points="76,34 84,34 80,20" fill="#f97316" stroke="#c2410c" strokeWidth="1.5" />
            <path d="M80,20 Q75,10 70,12" stroke="#22c55e" strokeWidth="2" fill="none" />
            <path d="M80,20 Q85,8 90,10" stroke="#22c55e" strokeWidth="2" fill="none" />
            {/* Face */}
            <circle cx="68" cy="74" r="4" fill="#ffedd5" />
            <circle cx="92" cy="74" r="4" fill="#ffedd5" />
            <path d="M76,82 Q80,87 84,82" stroke="#ffedd5" strokeWidth="2.5" fill="none" strokeLinecap="round" />
            <ellipse cx="61" cy="80" rx="4" ry="2.5" fill="#c2410c" />
            <ellipse cx="99" cy="80" rx="4" ry="2.5" fill="#c2410c" />
          </svg>
        );

      case 'avocado':
      default:
        return (
          <svg viewBox="0 0 160 160" className="w-28 h-28 mx-auto drop-shadow-md">
            {/* Cone */}
            <polygon points="50,105 110,105 80,155" fill="#fcd34d" stroke="#d97706" strokeWidth="2.5" />
            <line x1="60" y1="115" x2="100" y2="115" stroke="#d97706" strokeWidth="1.5" />
            <line x1="68" y1="130" x2="92" y2="130" stroke="#d97706" strokeWidth="1.5" />
            {/* Soft Creamy Avocado Scoop */}
            <circle cx="80" cy="75" r="42" fill="#a7f3d0" stroke="#059669" strokeWidth="3" />
            {/* Brown Seed Center / Topper */}
            <circle cx="80" cy="38" r="9" fill="#78350f" stroke="#451a03" strokeWidth="2" />
            <circle cx="78" cy="36" r="2.5" fill="#a16207" />
            {/* Face */}
            <circle cx="68" cy="74" r="4" fill="#064e3b" />
            <circle cx="92" cy="74" r="4" fill="#064e3b" />
            <path d="M76,82 Q80,87 84,82" stroke="#064e3b" strokeWidth="2.5" fill="none" strokeLinecap="round" />
            <ellipse cx="61" cy="80" rx="4" ry="2.5" fill="#6ee7b7" />
            <ellipse cx="99" cy="80" rx="4" ry="2.5" fill="#6ee7b7" />
          </svg>
        );
    }
  };

  const getThemeStyling = () => {
    switch (personalityType) {
      case 'apple':
        return {
          gradientBar: 'from-emerald-400 via-teal-400 to-lime-400',
          badge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
          highlight: 'text-emerald-600',
          circleBg: 'bg-emerald-50 border-emerald-100',
          bannerBg: 'bg-emerald-600',
          bannerText: 'text-emerald-700',
        };
      case 'dragonfruit':
        return {
          gradientBar: 'from-fuchsia-500 via-pink-500 to-rose-400',
          badge: 'bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200',
          highlight: 'text-fuchsia-600',
          circleBg: 'bg-fuchsia-50 border-fuchsia-100',
          bannerBg: 'bg-fuchsia-600',
          bannerText: 'text-fuchsia-700',
        };
      case 'blueberry':
        return {
          gradientBar: 'from-indigo-500 via-purple-500 to-sky-400',
          badge: 'bg-indigo-50 text-indigo-700 border-indigo-200',
          highlight: 'text-indigo-600',
          circleBg: 'bg-indigo-50 border-indigo-100',
          bannerBg: 'bg-indigo-600',
          bannerText: 'text-indigo-700',
        };
      case 'grapefruit':
        return {
          gradientBar: 'from-rose-500 via-orange-400 to-amber-300',
          badge: 'bg-orange-50 text-orange-700 border-orange-200',
          highlight: 'text-orange-600',
          circleBg: 'bg-orange-50 border-orange-100',
          bannerBg: 'bg-orange-500',
          bannerText: 'text-orange-700',
        };
      case 'banana':
        return {
          gradientBar: 'from-yellow-400 via-amber-400 to-yellow-500',
          badge: 'bg-yellow-50 text-yellow-800 border-yellow-200',
          highlight: 'text-yellow-600',
          circleBg: 'bg-yellow-50 border-yellow-100',
          bannerBg: 'bg-amber-500',
          bannerText: 'text-amber-800',
        };
      case 'strawberry':
        return {
          gradientBar: 'from-rose-400 via-pink-400 to-rose-500',
          badge: 'bg-rose-50 text-rose-700 border-rose-200',
          highlight: 'text-rose-500',
          circleBg: 'bg-rose-50 border-rose-100',
          bannerBg: 'bg-rose-500',
          bannerText: 'text-rose-700',
        };
      case 'watermelon':
        return {
          gradientBar: 'from-red-500 via-rose-400 to-emerald-400',
          badge: 'bg-red-50 text-red-700 border-red-200',
          highlight: 'text-red-600',
          circleBg: 'bg-red-50 border-red-100',
          bannerBg: 'bg-red-500',
          bannerText: 'text-red-700',
        };
      case 'lime':
        return {
          gradientBar: 'from-lime-400 via-emerald-400 to-cyan-400',
          badge: 'bg-lime-50 text-lime-900 border-lime-200',
          highlight: 'text-lime-700',
          circleBg: 'bg-lime-50 border-lime-100',
          bannerBg: 'bg-lime-600',
          bannerText: 'text-lime-800',
        };
      case 'carrot':
        return {
          gradientBar: 'from-amber-600 via-orange-500 to-yellow-500',
          badge: 'bg-amber-50 text-amber-900 border-amber-200',
          highlight: 'text-amber-700',
          circleBg: 'bg-amber-50 border-amber-100',
          bannerBg: 'bg-amber-600',
          bannerText: 'text-amber-900',
        };
      case 'avocado':
      default:
        return {
          gradientBar: 'from-emerald-500 via-teal-400 to-lime-300',
          badge: 'bg-emerald-50 text-emerald-800 border-emerald-200',
          highlight: 'text-emerald-700',
          circleBg: 'bg-emerald-50 border-emerald-100',
          bannerBg: 'bg-emerald-600',
          bannerText: 'text-emerald-800',
        };
    }
  };
  const theme = getThemeStyling();

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 sm:py-10 space-y-6">
      {/* 캡쳐용 핵심 화면 (Vertical Fixed Card Container in Professional Polish Theme) */}
      <div
        ref={cardRef}
        id="result-capture-card"
        className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden flex flex-col relative"
      >
        {/* Top 10px Gradient Bar */}
        <div className={`absolute top-0 left-0 w-full h-2.5 bg-gradient-to-r ${theme.gradientBar}`}></div>

        <div className="flex-1 flex flex-col p-6 sm:p-8 items-center text-center">
          {/* Badge: Event & MINIU WORKSHOP */}
          <div className={`mt-2 mb-3 px-4 py-1.5 rounded-full text-xs sm:text-sm font-extrabold tracking-wider border ${theme.badge} flex items-center gap-1.5`}>
            <span>2026 수원청소년진로박람회</span>
            <span className="opacity-50">·</span>
            <span>미니유공방</span>
          </div>

          {/* Heading */}
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 mb-6 tracking-tight">
            당신의 성향은 <span className={theme.highlight}>{data.nameKo}! {data.emoji}</span>
          </h2>

          {/* Pedestal Circle for Character Illustration */}
          <div className={`w-44 h-44 sm:w-52 sm:h-52 rounded-full flex items-center justify-center mb-6 shadow-inner border ${theme.circleBg} relative`}>
            {renderCharacterSvg()}
          </div>

          {/* Keyword Tags */}
          <div className="flex flex-wrap justify-center gap-2 mb-6">
            {data.keywords.map((tag, idx) => (
              <span
                key={idx}
                className="px-3 py-1 bg-slate-100 rounded-lg text-xs sm:text-sm font-medium text-slate-600 border border-slate-200"
              >
                {tag}
              </span>
            ))}
          </div>

          {/* AI Mentor Encouraging Quote */}
          <div className="w-full max-w-lg mx-auto mb-8 bg-gradient-to-br from-slate-50 via-white to-blue-50/40 rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs relative text-left">
            <div className="flex items-center justify-between gap-2 mb-2.5 pb-2 border-b border-slate-100">
              <div className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-700">
                <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                  <Bot className="w-3.5 h-3.5" />
                </span>
                <span>AI 멘토의 응원 한마디</span>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-blue-50 text-blue-600 border border-blue-100">
                  {data.nameKo}
                </span>
              </div>
              <button
                type="button"
                onClick={handleRerollQuote}
                className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 hover:text-blue-600 bg-white hover:bg-blue-50/80 px-2.5 py-1 rounded-full border border-slate-200 hover:border-blue-200 transition-colors shadow-2xs cursor-pointer active:scale-95"
                title="다른 응원 문구 보기"
              >
                <RefreshCw className={`w-3 h-3 text-blue-500 transition-transform ${isRerolling ? 'rotate-180 duration-300' : ''}`} />
                <span>다른 응원 보기</span>
              </button>
            </div>

            <div className="relative pl-3 border-l-2 border-blue-400 my-1">
              <p className="text-sm sm:text-base leading-relaxed text-slate-800 font-medium break-keep">
                "{aiQuote}"
              </p>
            </div>

            <div className="mt-2.5 flex items-center justify-between text-[11px] text-slate-400">
              <span className="inline-flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-400" />
                <span>미니유공방 청소년 진로 응원 메시지</span>
              </span>
              <span className="text-slate-400">랜덤 응원</span>
            </div>
          </div>

          {/* 2-Column Recommendations Grid */}
          <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-4 text-left mb-6">
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <h4 className="text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">추천 진로 계열</h4>
              <p className="text-base sm:text-lg font-bold text-slate-800 leading-snug">
                {data.recommendedFields[0]}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                {data.recommendedFields.slice(1).join(' · ')}
              </p>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <h4 className="text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider flex items-center gap-1.5">
                <GraduationCap className="w-4 h-4 text-blue-600" />
                <span>추천 학과 예시</span>
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {data.recommendedMajors.map((major, i) => (
                  <span
                    key={i}
                    className="px-2 py-0.5 bg-white rounded-md text-xs font-semibold text-slate-700 border border-slate-200 shadow-2xs"
                  >
                    {major}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Next Step Bottom Ribbon */}
        <div className={`${theme.bannerBg} p-5 sm:p-6 flex flex-col sm:flex-row items-center justify-between text-white gap-3`}>
          <div className="text-center sm:text-left">
            <p className="text-xs opacity-90 uppercase tracking-wider font-bold mb-1">
              MINIU WORKSHOP · 순발력 챌린지
            </p>
            <p className="text-base sm:text-lg font-bold">미니유공방 카드맞추기 랭킹 도전</p>
            <p className="text-xs text-white/90 mt-0.5">과일 카드를 빠르게 맞춰 명예의 전당에 이름을 올려보세요!</p>
          </div>
          <button
            type="button"
            id="btn-go-game-from-ribbon"
            onClick={() => onNavigate('game')}
            className={`bg-white ${theme.bannerText} px-5 py-2.5 rounded-xl font-bold shadow-lg hover:scale-105 active:scale-95 transition-transform cursor-pointer flex items-center gap-1.5 text-xs sm:text-sm`}
          >
            <Trophy className="w-4 h-4" />
            <span>카드 랭킹전 도전</span>
          </button>
        </div>
      </div>

      {/* Action Buttons Group */}
      <div className="space-y-3">
        {/* Step Navigation Links */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            type="button"
            id="btn-card-ranking-from-result"
            onClick={() => onNavigate('game')}
            className="w-full py-3.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
          >
            <Trophy className="w-4 h-4 text-amber-300" />
            <span>카드맞추기 랭킹 도전</span>
          </button>

          <button
            type="button"
            id="btn-guestbook-from-result"
            onClick={() => onNavigate('guestbook')}
            className="w-full py-3.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
          >
            <BookOpen className="w-4 h-4" />
            <span>방명록 남기기</span>
          </button>
        </div>

        {/* Secondary Tool Buttons */}
        <div className="flex items-center justify-center gap-3 pt-1">
          <button
            type="button"
            onClick={handleCopyText}
            id="btn-copy-card"
            className="px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 font-semibold text-xs flex items-center gap-1.5 hover:bg-slate-50 cursor-pointer shadow-xs"
          >
            {isCopied ? (
              <>
                <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-600 font-bold">복사 완료!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-slate-400" />
                <span>결과 텍스트 복사</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={onRestartQuiz}
            id="btn-restart-quiz"
            className="px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 font-semibold text-xs flex items-center gap-1.5 hover:bg-slate-50 cursor-pointer shadow-xs"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
            <span>다시 진단하기</span>
          </button>
        </div>
      </div>
    </div>
  );
};
