import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import {
  Trophy,
  Play,
  RotateCcw,
  Sparkles,
  Timer,
  Award,
  Medal,
  Flame,
  CheckCircle2,
  BookOpen,
  Users,
  Star
} from 'lucide-react';
import { RankingRecord, AppScreen } from '../types';
import { subscribeRankings, addRankingRecord } from '../lib/firebase';

interface CardGameScreenProps {
  nickname: string;
  onSetNickname: (nick: string) => void;
  onNavigate: (screen: AppScreen) => void;
}

interface CardItem {
  uid: number;
  pairId: number;
  emoji: string;
  name: string;
  colorBg: string;
}

const CARD_PAIRS = [
  { pairId: 1, emoji: '🍓', name: '딸기선데', colorBg: 'bg-rose-50 border-rose-300 text-rose-600' },
  { pairId: 2, emoji: '🍏', name: '청사과셔벗', colorBg: 'bg-emerald-50 border-emerald-300 text-emerald-600' },
  { pairId: 3, emoji: '🍫', name: '초코스쿱', colorBg: 'bg-amber-50 border-amber-400 text-amber-900' },
  { pairId: 4, emoji: '🍌', name: '바나나커스터드', colorBg: 'bg-yellow-50 border-yellow-300 text-yellow-700' },
  { pairId: 5, emoji: '🎨', name: '미니유팔레트', colorBg: 'bg-purple-50 border-purple-300 text-purple-600' },
  { pairId: 6, emoji: '🎪', name: '미니유부스', colorBg: 'bg-sky-50 border-sky-300 text-sky-600' },
];

export const CardGameScreen: React.FC<CardGameScreenProps> = ({
  nickname,
  onSetNickname,
  onNavigate,
}) => {
  const [cards, setCards] = useState<CardItem[]>([]);
  const [flippedIndexes, setFlippedIndexes] = useState<number[]>([]);
  const [matchedPairIds, setMatchedPairIds] = useState<number[]>([]);
  const [moves, setMoves] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isFinished, setIsFinished] = useState<boolean>(false);
  const [elapsedTime, setElapsedTime] = useState<number>(0);
  const [rankings, setRankings] = useState<RankingRecord[]>([]);
  const [isLoadingRankings, setIsLoadingRankings] = useState<boolean>(true);
  const [myRegisteredRank, setMyRegisteredRank] = useState<number | null>(null);
  const [latestRecordId, setLatestRecordId] = useState<string | null>(null);
  const [rankTab, setRankTab] = useState<'top10' | 'all'>('top10');

  // Nickname state inside game if not set yet
  const [playerNick, setPlayerNick] = useState<string>(nickname || '');
  const [nickError, setNickError] = useState<string>('');

  const timerRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);

  // Sync external nickname changes
  useEffect(() => {
    if (nickname && !playerNick) {
      setPlayerNick(nickname);
    }
  }, [nickname]);

  // Realtime Cloud Firestore Rankings Subscription
  useEffect(() => {
    let isSubscribed = true;

    const unsubscribe = subscribeRankings(
      (items) => {
        if (isSubscribed) {
          setRankings(items);
          setIsLoadingRankings(false);
          try {
            localStorage.setItem('eunpyeong_rankings_cache', JSON.stringify(items));
          } catch {
            // ignore
          }
        }
      },
      (err) => {
        console.warn('Rankings Firestore notice, checking local cache:', err);
        try {
          const cached = localStorage.getItem('eunpyeong_rankings_cache');
          if (cached) {
            setRankings(JSON.parse(cached));
          }
        } catch {
          // ignore
        }
        setIsLoadingRankings(false);
      }
    );

    return () => {
      isSubscribed = false;
      unsubscribe();
    };
  }, []);

  // Refresh helper
  const handleRefresh = () => {
    try {
      const cached = localStorage.getItem('eunpyeong_rankings_cache');
      if (cached) {
        setRankings(JSON.parse(cached));
      }
    } catch {
      // ignore
    }
  };

  // Shuffle and init deck
  const startNewGame = () => {
    if (!playerNick.trim()) {
      setNickError('참가자 닉네임을 입력해주세요!');
      return;
    }
    setNickError('');
    onSetNickname(playerNick.trim());

    // Create 12 cards (6 pairs)
    const deck: CardItem[] = [];
    let uidCounter = 0;
    CARD_PAIRS.forEach((item) => {
      deck.push({ ...item, uid: uidCounter++ });
      deck.push({ ...item, uid: uidCounter++ });
    });

    // Fisher-Yates shuffle
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }

    setCards(deck);
    setFlippedIndexes([]);
    setMatchedPairIds([]);
    setMoves(0);
    setElapsedTime(0);
    setIsFinished(false);
    setMyRegisteredRank(null);
    setLatestRecordId(null);
    setIsPlaying(true);

    startTimeRef.current = Date.now();
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = window.setInterval(() => {
      setElapsedTime(Math.round((Date.now() - startTimeRef.current) / 100) / 10);
    }, 100);
  };

  // Stop timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // Card click handler
  const handleCardClick = (index: number) => {
    if (!isPlaying || isFinished) return;
    if (flippedIndexes.length >= 2) return;
    if (flippedIndexes.includes(index)) return;

    const clickedCard = cards[index];
    if (matchedPairIds.includes(clickedCard.pairId)) return;

    const newFlipped = [...flippedIndexes, index];
    setFlippedIndexes(newFlipped);

    if (newFlipped.length === 2) {
      setMoves((prev) => prev + 1);
      const card1 = cards[newFlipped[0]];
      const card2 = cards[newFlipped[1]];

      if (card1.pairId === card2.pairId) {
        // Match!
        const nextMatched = [...matchedPairIds, card1.pairId];
        setMatchedPairIds(nextMatched);
        setFlippedIndexes([]);

        // Check victory (all 6 pairs matched)
        if (nextMatched.length === CARD_PAIRS.length) {
          handleVictory(moves + 1);
        }
      } else {
        // Not a match: flip back after brief pause
        setTimeout(() => {
          setFlippedIndexes([]);
        }, 700);
      }
    }
  };

  // Victory logic
  const handleVictory = async (finalMoves: number) => {
    if (timerRef.current) clearInterval(timerRef.current);
    const finalSeconds = Math.round((Date.now() - startTimeRef.current) / 100) / 10;
    setElapsedTime(finalSeconds);
    setIsPlaying(false);
    setIsFinished(true);

    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });
    } catch {
      // ignore
    }

    const currentNick = playerNick.trim() || '참가자';

    // Submit ranking directly to Firestore Cloud DB (Shared across all participant phones)
    const rankingPayload = {
      nickname: currentNick,
      timeSeconds: finalSeconds,
      moves: finalMoves,
      createdAt: new Date().toISOString(),
    };

    try {
      const result = await addRankingRecord(rankingPayload);
      if (result?.id) {
        setLatestRecordId(result.id);
      }

      // Also notify local server API in background
      fetch('/api/rankings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(rankingPayload),
      }).catch(() => {});
    } catch (err) {
      console.error('Failed to submit ranking to Firestore:', err);
      // Fallback to server or local cache
      const localRecord: RankingRecord = {
        id: `rank-local-${Date.now()}`,
        ...rankingPayload,
      };
      setRankings((prev) => {
        const next = [...prev, localRecord].sort((a, b) => a.timeSeconds - b.timeSeconds);
        const myIndex = next.findIndex((r) => r.id === localRecord.id) + 1;
        setMyRegisteredRank(myIndex);
        setLatestRecordId(localRecord.id);
        return next;
      });
    }
  };

  const displayedRankings = rankTab === 'top10' ? rankings.slice(0, 10) : rankings;

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 sm:py-10 space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold">
          <Trophy className="w-3.5 h-3.5 text-blue-600" />
          <span>미니유공방 순발력 챌린지</span>
          <span className="text-slate-300">·</span>
          <span>12장 카드 매칭</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
          미니유공방 카드 맞추기 랭킹전 🃏
        </h2>
        <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto">
          짝을 맞춰 카드를 가장 빠르게 뒤집어보세요! 미니유공방 참가자 모두의 기록이 실시간으로 집계됩니다.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Game Board (col-span-7) */}
        <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200 p-4 sm:p-6 shadow-sm space-y-5">
          {/* Status Bar */}
          <div className="flex items-center justify-between bg-slate-50 border border-slate-200/80 rounded-2xl px-4 py-3">
            <div className="flex items-center gap-2">
              <Timer className="w-4 h-4 text-blue-600" />
              <span className="text-xs font-medium text-slate-500">시간:</span>
              <span className="text-base font-black font-mono text-slate-900">
                {elapsedTime.toFixed(1)}s
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Flame className="w-4 h-4 text-amber-500" />
              <span className="text-xs font-medium text-slate-500">뒤집기:</span>
              <span className="text-base font-black font-mono text-slate-900">{moves}회</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Award className="w-4 h-4 text-purple-600" />
              <span className="text-xs font-medium text-slate-500">매칭:</span>
              <span className="text-base font-black font-mono text-slate-900">
                {matchedPairIds.length} / {CARD_PAIRS.length}
              </span>
            </div>
          </div>

          {/* Nickname input bar if not playing */}
          {!isPlaying && !isFinished && (
            <div className="bg-blue-50/50 border border-blue-100 rounded-2xl p-4 space-y-3">
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="flex-1">
                  <label htmlFor="card-game-nickname-input" className="block text-xs font-bold text-slate-700 mb-1">
                    랭킹전에 등록할 닉네임
                  </label>
                  <input
                    id="card-game-nickname-input"
                    type="text"
                    value={playerNick}
                    onChange={(e) => setPlayerNick(e.target.value.slice(0, 12))}
                    placeholder="예: 꿈꾸는별, 히어로"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-sm font-semibold focus:outline-hidden focus:ring-2 focus:ring-blue-500/30"
                  />
                  {nickError && <p className="text-xs text-rose-600 mt-1 font-medium">{nickError}</p>}
                </div>
                <div className="sm:self-end">
                  <button
                    type="button"
                    onClick={startNewGame}
                    className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
                  >
                    <Play className="w-4 h-4 fill-white" />
                    <span>게임 시작</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Cards Grid (3 columns x 4 rows = 12 cards, optimal for mobile portrait) */}
          <div className="grid grid-cols-3 gap-2.5 sm:gap-3">
            {cards.length === 0 ? (
              <div className="col-span-3 flex flex-col items-center justify-center p-8 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-center space-y-3">
                <div className="w-14 h-14 rounded-2xl bg-blue-100/60 text-blue-600 flex items-center justify-center text-2xl">
                  🃏
                </div>
                <div className="space-y-1">
                  <h4 className="font-bold text-slate-800 text-sm sm:text-base">
                    준비되셨나요?
                  </h4>
                  <p className="text-xs text-slate-500 max-w-xs">
                    상단에서 닉네임을 확인하고 [게임 시작]을 누르면 12장의 카드가 뒤집힙니다!
                  </p>
                </div>
                <button
                  type="button"
                  onClick={startNewGame}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm transition-colors cursor-pointer"
                >
                  시작하기
                </button>
              </div>
            ) : (
              cards.map((card, idx) => {
                const isFlipped = flippedIndexes.includes(idx);
                const isMatched = matchedPairIds.includes(card.pairId);
                const showFace = isFlipped || isMatched;

                return (
                  <button
                    type="button"
                    key={card.uid}
                    onClick={() => handleCardClick(idx)}
                    disabled={!isPlaying || isMatched || isFlipped}
                    className={`relative rounded-2xl flex flex-col items-center justify-center transition-all duration-300 transform select-none cursor-pointer border-2 min-h-[86px] sm:min-h-[100px] p-2 ${
                      showFace
                        ? `${card.colorBg} border-current shadow-sm scale-100`
                        : 'bg-slate-900 border-slate-800 hover:bg-slate-800 hover:scale-[1.02] active:scale-95 shadow-xs'
                    }`}
                  >
                    {showFace ? (
                      <div className="flex flex-col items-center justify-center p-1 text-center">
                        <span className="text-2xl sm:text-3xl filter drop-shadow-xs">{card.emoji}</span>
                        <span className="text-[11px] sm:text-xs font-bold mt-1 tracking-tight truncate max-w-[85px] sm:max-w-none">
                          {card.name}
                        </span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center">
                        <span className="text-base sm:text-lg opacity-40 text-white font-mono font-bold">M</span>
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-400/50 mt-0.5" />
                      </div>
                    )}

                    {isMatched && (
                      <div className="absolute top-1.5 right-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 fill-white" />
                      </div>
                    )}
                  </button>
                );
              })
            )}
          </div>

          {/* Victory Modal Overlay inside Box */}
          {isFinished && (
            <div className="bg-slate-900 text-white rounded-2xl p-5 sm:p-6 space-y-4 shadow-xl border border-slate-700 animate-in fade-in zoom-in-95 duration-200">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-400 text-amber-950 flex items-center justify-center text-2xl shadow-sm shrink-0">
                  🏆
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-amber-300">
                    축하합니다! 미션 완주!
                  </h3>
                  <p className="text-xs text-slate-300 font-medium">
                    {playerNick}님의 기록이 랭킹 서버에 실시간으로 등록되었습니다.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 bg-slate-800/80 border border-slate-700 rounded-2xl p-3.5 text-center">
                <div>
                  <div className="text-[11px] text-slate-400">기록 시간</div>
                  <div className="text-lg sm:text-xl font-black font-mono text-emerald-400">{elapsedTime.toFixed(1)}s</div>
                </div>
                <div>
                  <div className="text-[11px] text-slate-400">뒤집은 횟수</div>
                  <div className="text-lg sm:text-xl font-black text-slate-100">{moves}회</div>
                </div>
                <div>
                  <div className="text-[11px] text-slate-400">나의 실시간 순위</div>
                  <div className="text-lg sm:text-xl font-black text-amber-400 flex items-center justify-center gap-1">
                    <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                    <span>{myRegisteredRank ? `${myRegisteredRank}위` : '등록 완료'}</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={startNewGame}
                  className="flex-1 py-3 px-4 rounded-xl bg-blue-600 text-white font-bold text-xs sm:text-sm hover:bg-blue-700 shadow-sm cursor-pointer"
                >
                  기록 갱신 재도전
                </button>
                <button
                  type="button"
                  onClick={() => onNavigate('guestbook')}
                  className="py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-bold text-xs sm:text-sm cursor-pointer flex items-center gap-1.5"
                >
                  <BookOpen className="w-4 h-4" />
                  <span>방명록 남기기</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right: Real-time Leaderboard matching Professional Polish Theme (col-span-5) */}
        <div className="lg:col-span-5 bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 flex flex-col shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-blue-600" />
              <h3 className="font-bold text-slate-900 text-base">실시간 랭킹</h3>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-bold border border-blue-100 flex items-center gap-1">
                <Users className="w-3 h-3" />
                <span>총 {rankings.length}명</span>
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200 hidden sm:inline-flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                클라우드 연동
              </span>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handleRefresh}
                title="새로고침"
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 cursor-pointer transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Tab Selector: Top 10 vs All */}
          <div className="flex rounded-xl bg-slate-100 p-1 text-xs font-bold text-slate-600">
            <button
              type="button"
              onClick={() => setRankTab('top10')}
              className={`flex-1 py-1.5 rounded-lg transition-all cursor-pointer ${
                rankTab === 'top10' ? 'bg-white text-blue-700 shadow-xs font-extrabold' : 'hover:text-slate-900'
              }`}
            >
              🏆 TOP 10
            </button>
            <button
              type="button"
              onClick={() => setRankTab('all')}
              className={`flex-1 py-1.5 rounded-lg transition-all cursor-pointer ${
                rankTab === 'all' ? 'bg-white text-blue-700 shadow-xs font-extrabold' : 'hover:text-slate-900'
              }`}
            >
              전체 순위 ({rankings.length})
            </button>
          </div>

          {/* Highlight Card if user just finished */}
          {myRegisteredRank !== null && (
            <div className="bg-amber-50 border border-amber-200/80 rounded-xl p-3 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="text-base">🎯</span>
                <div>
                  <span className="font-bold text-amber-950">내 방금 순위: </span>
                  <span className="font-extrabold text-blue-700 text-sm">{myRegisteredRank}위</span>
                  <span className="text-slate-500 text-[11px] ml-1.5">({playerNick} · {elapsedTime.toFixed(1)}초)</span>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-md bg-amber-200/80 text-amber-900 text-[10px] font-bold">
                등록완료
              </span>
            </div>
          )}

          {/* Rankings List */}
          <div className="space-y-2 flex-1 max-h-[380px] overflow-y-auto pr-1">
            {isLoadingRankings && rankings.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400 space-y-1">
                <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                <p>실시간 랭킹을 집계 중입니다...</p>
              </div>
            ) : rankings.length === 0 ? (
              <div className="py-10 text-center text-xs text-slate-400 space-y-2">
                <Trophy className="w-8 h-8 mx-auto text-slate-300" />
                <p>아직 등록된 기록이 없습니다.<br />첫 번째 랭킹의 주인공이 되어보세요!</p>
              </div>
            ) : (
              displayedRankings.map((item, idx) => {
                const rankNum = idx + 1;
                const isMyLatest =
                  item.id === latestRecordId ||
                  (myRegisteredRank === rankNum && item.nickname === playerNick);

                const isTop1 = rankNum === 1;
                const isTop2 = rankNum === 2;
                const isTop3 = rankNum === 3;

                return (
                  <div
                    key={item.id}
                    className={`flex items-center p-2.5 sm:p-3 rounded-xl transition-all ${
                      isMyLatest
                        ? 'bg-amber-50/90 border-2 border-amber-400 shadow-xs ring-2 ring-amber-400/20'
                        : isTop1
                        ? 'bg-blue-50/70 border border-blue-200'
                        : isTop2
                        ? 'bg-slate-50 border border-slate-200/80'
                        : isTop3
                        ? 'bg-orange-50/40 border border-orange-100'
                        : 'bg-slate-50/50 border border-slate-100'
                    }`}
                  >
                    {/* Rank Badge */}
                    <div className="w-8 flex items-center justify-center shrink-0">
                      {isTop1 ? (
                        <span className="w-6 h-6 rounded-full bg-amber-400 text-amber-950 font-black text-xs flex items-center justify-center shadow-2xs">
                          1
                        </span>
                      ) : isTop2 ? (
                        <span className="w-6 h-6 rounded-full bg-slate-300 text-slate-800 font-black text-xs flex items-center justify-center">
                          2
                        </span>
                      ) : isTop3 ? (
                        <span className="w-6 h-6 rounded-full bg-amber-600/80 text-white font-black text-xs flex items-center justify-center">
                          3
                        </span>
                      ) : (
                        <span className="text-slate-400 font-bold text-xs font-mono">{rankNum}</span>
                      )}
                    </div>

                    {/* Nickname & moves */}
                    <div className="flex-1 ml-2 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="text-sm font-bold text-slate-900 leading-none truncate">{item.nickname}</p>
                        {isMyLatest && (
                          <span className="text-[10px] font-extrabold px-1.5 py-0.2 rounded bg-amber-400 text-amber-950 shrink-0">
                            내 기록
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-400 mt-1 font-medium">{item.moves}회 시도</p>
                    </div>

                    {/* Time */}
                    <span className={`text-sm font-mono font-bold ${isTop1 || isMyLatest ? 'text-blue-600 font-black' : 'text-slate-600'}`}>
                      {item.timeSeconds.toFixed(1)}s
                    </span>
                  </div>
                );
              })
            )}
          </div>

          <button
            type="button"
            onClick={startNewGame}
            className="w-full mt-1 py-3 bg-slate-900 text-white rounded-xl text-sm font-bold hover:bg-slate-800 transition-colors cursor-pointer flex items-center justify-center gap-2"
          >
            <Play className="w-4 h-4 fill-white" />
            <span>도전하기</span>
          </button>
        </div>
      </div>
    </div>
  );
};
