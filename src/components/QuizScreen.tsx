import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, Sparkles, CheckCircle2 } from 'lucide-react';
import { QUIZ_QUESTIONS, calculatePersonalityType } from '../data/quizData';
import { PersonalityTypeId, QuizChoice } from '../types';

interface QuizScreenProps {
  nickname: string;
  onComplete: (type: PersonalityTypeId, scores: { extraversion: number; feeling: number }) => void;
  onBackToStart: () => void;
}

export const QuizScreen: React.FC<QuizScreenProps> = ({
  nickname,
  onComplete,
  onBackToStart,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<QuizChoice[]>([]);
  const [reactionFeedback, setReactionFeedback] = useState<string | null>(null);
  const [selectedChoiceIndex, setSelectedChoiceIndex] = useState<number | null>(null);

  const currentQ = QUIZ_QUESTIONS[currentIndex];
  const progressPercent = ((currentIndex + 1) / QUIZ_QUESTIONS.length) * 100;

  const handleSelectChoice = (choice: QuizChoice, choiceIdx: number) => {
    if (selectedChoiceIndex !== null) return; // prevent double clicks during animation

    setSelectedChoiceIndex(choiceIdx);
    setReactionFeedback(choice.reaction);

    setTimeout(() => {
      const nextAnswers = [...answers, choice];
      setAnswers(nextAnswers);
      setSelectedChoiceIndex(null);
      setReactionFeedback(null);

      if (currentIndex + 1 < QUIZ_QUESTIONS.length) {
        setCurrentIndex(currentIndex + 1);
      } else {
        // Complete quiz! Calculate scores:
        let extraversion = 0;
        let feeling = 0;
        nextAnswers.forEach((a) => {
          extraversion += a.extraversion;
          feeling += a.feeling;
        });

        const resultType = calculatePersonalityType(nextAnswers);
        onComplete(resultType, { extraversion, feeling });
      }
    }, 650);
  };

  const handleGoBack = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setAnswers(answers.slice(0, -1));
      setSelectedChoiceIndex(null);
      setReactionFeedback(null);
    } else {
      onBackToStart();
    }
  };

  return (
    <div className="max-w-xl mx-auto px-4 py-6 sm:py-10">
      {/* Top Progress & Navigation Bar */}
      <div className="mb-6 space-y-2">
        <div className="flex items-center justify-between text-xs font-bold text-slate-500">
          <button
            onClick={handleGoBack}
            id="quiz-btn-back"
            className="flex items-center gap-1 text-slate-600 hover:text-slate-900 px-2 py-1 -ml-2 rounded-lg hover:bg-slate-100 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>이전으로</span>
          </button>
          <div className="flex items-center gap-1.5">
            <span className="text-blue-600 font-extrabold">{currentIndex + 1}</span>
            <span>/</span>
            <span>{QUIZ_QUESTIONS.length} 문항</span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-blue-600 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progressPercent}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </div>

      {/* Question Card Container */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.25 }}
          className="bg-white rounded-3xl border border-slate-200 shadow-xl p-6 sm:p-8 relative overflow-hidden"
        >
          {/* Badge & Scenario Header */}
          <div className="mb-5 space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{currentQ.badge}</span>
            </div>
            <p className="text-xs sm:text-sm font-semibold text-slate-500 leading-relaxed">
              {currentQ.scenario}
            </p>
            <h3 className="text-lg sm:text-xl font-black text-slate-900 leading-snug">
              {currentQ.title}
            </h3>
          </div>

          {/* Reaction Animation Toast */}
          <AnimatePresence>
            {reactionFeedback && (
              <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="mb-4 py-2 px-4 rounded-xl bg-blue-600 text-white text-xs sm:text-sm font-bold text-center shadow-md flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{reactionFeedback}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Choices: 2 interactive options */}
          <div className="space-y-3.5">
            {currentQ.choices.map((choice, idx) => {
              const isSelected = selectedChoiceIndex === idx;
              return (
                <motion.button
                  key={idx}
                  id={`quiz-choice-${currentIndex}-${idx}`}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={() => handleSelectChoice(choice, idx)}
                  disabled={selectedChoiceIndex !== null}
                  className={`w-full text-left p-4 sm:p-5 rounded-2xl border-2 transition-all duration-200 cursor-pointer ${
                    isSelected
                      ? 'border-blue-600 bg-blue-50/80 shadow-md ring-2 ring-blue-200'
                      : 'border-slate-200 hover:border-blue-400 bg-slate-50/40 hover:bg-white'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs shrink-0 mt-0.5 transition-colors ${
                        isSelected
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      {idx === 0 ? 'A' : 'B'}
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm sm:text-base font-bold text-slate-900 leading-snug">
                        {choice.text}
                      </p>
                      {choice.subtext && (
                        <p className="text-xs text-slate-500 font-medium leading-relaxed">
                          {choice.subtext}
                        </p>
                      )}
                    </div>
                  </div>
                </motion.button>
              );
            })}
          </div>

          {/* Helper hint */}
          <div className="mt-6 text-center">
            <span className="text-[11px] text-slate-400 font-medium">
              💡 {nickname ? `${nickname}님, ` : ''}가장 마음이 끌리는 선택지를 탭해주세요!
            </span>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};
