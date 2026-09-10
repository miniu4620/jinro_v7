/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { StartScreen } from './components/StartScreen';
import { QuizScreen } from './components/QuizScreen';
import { ResultCard } from './components/ResultCard';
import { CardGameScreen } from './components/CardGameScreen';
import { GuestbookScreen } from './components/GuestbookScreen';
import { AdminModal } from './components/AdminModal';
import { AppScreen, PersonalityTypeId } from './types';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<AppScreen>('start');
  const [nickname, setNickname] = useState<string>('');
  const [personalityType, setPersonalityType] = useState<PersonalityTypeId>('strawberry');
  const [scores, setScores] = useState<{ extraversion: number; feeling: number }>({
    extraversion: 0,
    feeling: 0,
  });
  const [isAdminModalOpen, setIsAdminModalOpen] = useState<boolean>(false);
  const [guestbookRefreshKey, setGuestbookRefreshKey] = useState<number>(0);

  // Restore nickname from local storage if available
  useEffect(() => {
    try {
      const savedNick = localStorage.getItem('eunpyeong_expo_nickname');
      if (savedNick) {
        setNickname(savedNick);
      }
    } catch {
      // ignore
    }
  }, []);

  const handleSetNickname = (nick: string) => {
    setNickname(nick);
    try {
      localStorage.setItem('eunpyeong_expo_nickname', nick);
    } catch {
      // ignore
    }
  };

  const handleResetNickname = () => {
    setNickname('');
    try {
      localStorage.removeItem('eunpyeong_expo_nickname');
    } catch {
      // ignore
    }
    setCurrentScreen('start');
  };

  const handleQuizComplete = (
    type: PersonalityTypeId,
    calculatedScores: { extraversion: number; feeling: number }
  ) => {
    setPersonalityType(type);
    setScores(calculatedScores);
    setCurrentScreen('result');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleRestartQuiz = () => {
    setCurrentScreen('quiz');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800 antialiased font-['Pretendard',sans-serif] overflow-x-hidden">
      {/* Top Navbar */}
      <Navbar
        currentScreen={currentScreen}
        onNavigate={(scr) => {
          // If craft is somehow triggered, fallback to start or quiz
          if (scr === 'craft') {
            setCurrentScreen('start');
          } else {
            setCurrentScreen(scr);
          }
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        nickname={nickname}
        onResetNickname={handleResetNickname}
        onOpenAdmin={() => setIsAdminModalOpen(true)}
      />

      {/* Main Dynamic View */}
      <main className="flex-1">
        {currentScreen === 'start' && (
          <StartScreen
            nickname={nickname}
            onSetNickname={handleSetNickname}
            onStartQuiz={() => {
              setCurrentScreen('quiz');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onNavigate={(scr) => {
              setCurrentScreen(scr === 'craft' ? 'start' : scr);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        )}

        {currentScreen === 'quiz' && (
          <QuizScreen
            nickname={nickname}
            onComplete={handleQuizComplete}
            onBackToStart={() => setCurrentScreen('start')}
          />
        )}

        {currentScreen === 'result' && (
          <ResultCard
            nickname={nickname}
            personalityType={personalityType}
            scores={scores}
            onNavigate={(scr) => {
              setCurrentScreen(scr === 'craft' ? 'game' : scr);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onRestartQuiz={handleRestartQuiz}
          />
        )}

        {currentScreen === 'game' && (
          <CardGameScreen
            nickname={nickname}
            onSetNickname={handleSetNickname}
            onNavigate={(scr) => {
              setCurrentScreen(scr === 'craft' ? 'start' : scr);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        )}

        {currentScreen === 'guestbook' && (
          <GuestbookScreen
            key={guestbookRefreshKey}
            nickname={nickname}
            personalityType={personalityType}
            onSetNickname={handleSetNickname}
            onNavigate={(scr) => {
              setCurrentScreen(scr === 'craft' ? 'start' : scr);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        )}
      </main>

      {/* Admin Modal (Protected with password 0410, masked input, guestbook delete capability) */}
      <AdminModal
        isOpen={isAdminModalOpen}
        onClose={() => setIsAdminModalOpen(false)}
        onGuestbookUpdated={() => setGuestbookRefreshKey((k) => k + 1)}
      />

      {/* Footer in Professional Polish theme */}
      <footer className="h-auto sm:h-14 bg-white border-t border-slate-200 px-4 sm:px-8 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 font-medium py-3 sm:py-0 gap-1.5 sm:gap-0 text-center sm:text-left">
        <span className="font-semibold text-slate-700">
          2026 수원청소년진로박람회 &lt;AI와 함께 미래를 JOB다!&gt;
        </span>
        <div className="flex items-center gap-2 sm:gap-3 text-[11px] text-slate-400">
          <span>청소년 진로체험 프로그램</span>
          <span>·</span>
          <span>Powered by MINIU WORKSHOP</span>
        </div>
      </footer>
    </div>
  );
}
