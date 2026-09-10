import React, { useState, useEffect } from 'react';
import {
  Lock,
  Trash2,
  X,
  RefreshCw,
  Search,
  CheckCircle,
  AlertTriangle,
  ShieldCheck,
  LogOut
} from 'lucide-react';
import { GuestbookEntry, PersonalityTypeId } from '../types';
import { PERSONALITY_TYPES } from '../data/quizData';
import { deleteGuestbookEntry, subscribeGuestbook } from '../lib/firebase';

interface AdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGuestbookUpdated?: () => void;
}

export const AdminModal: React.FC<AdminModalProps> = ({
  isOpen,
  onClose,
  onGuestbookUpdated,
}) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [passwordInput, setPasswordInput] = useState<string>('');
  const [authError, setAuthError] = useState<string>('');
  const [savedPassword, setSavedPassword] = useState<string>('');

  const [entries, setEntries] = useState<GuestbookEntry[]>([]);
  const [isLoadingEntries, setIsLoadingEntries] = useState<boolean>(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [toastMessage, setToastMessage] = useState<string>('');

  // Reset states when modal is closed
  useEffect(() => {
    if (!isOpen) {
      setPasswordInput('');
      setAuthError('');
      setConfirmDeleteId(null);
    }
  }, [isOpen]);

  // Subscribe to real-time entries when authenticated
  useEffect(() => {
    if (!isOpen || !isAuthenticated) return;

    setIsLoadingEntries(true);
    const unsub = subscribeGuestbook(
      (items) => {
        setEntries(items);
        setIsLoadingEntries(false);
      },
      (err) => {
        console.warn('Admin Firestore error fallback:', err);
        fetch('/api/guestbook')
          .then((res) => res.json())
          .then((data) => {
            if (Array.isArray(data)) setEntries(data);
          })
          .catch(() => {})
          .finally(() => setIsLoadingEntries(false));
      }
    );

    return () => unsub();
  }, [isOpen, isAuthenticated]);

  const loadGuestbookEntries = () => {
    try {
      const cached = localStorage.getItem('eunpyeong_guestbook_cache');
      if (cached) {
        setEntries(JSON.parse(cached));
      }
    } catch {
      // ignore
    }
  };

  if (!isOpen) return null;

  // Handle password submit
  const handleAuthSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordInput === '0410') {
      setIsAuthenticated(true);
      setSavedPassword(passwordInput);
      setAuthError('');
      setPasswordInput('');
    } else {
      setAuthError('비밀번호가 올바르지 않습니다.');
      setPasswordInput('');
    }
  };

  // Handle delete
  const handleDeleteEntry = async (id: string) => {
    try {
      setDeletingId(id);
      // Delete from Firestore
      try {
        await deleteGuestbookEntry(id);
      } catch (fErr) {
        console.warn('Firestore delete notice:', fErr);
      }

      // Delete from server API as well
      const res = await fetch(`/api/guestbook/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-password': savedPassword || '0410',
        },
      });

      const data = await res.json().catch(() => ({ success: true }));
      setEntries((prev) => prev.filter((item) => item.id !== id));
      setConfirmDeleteId(null);
      setToastMessage('방명록이 정상적으로 삭제되었습니다.');
      setTimeout(() => setToastMessage(''), 3000);
      onGuestbookUpdated?.();
    } catch (err) {
      console.error('Failed to delete guestbook entry:', err);
      alert('삭제 중 오류가 발생했습니다.');
    } finally {
      setDeletingId(null);
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setSavedPassword('');
    setPasswordInput('');
    setAuthError('');
  };

  const filteredEntries = entries.filter((entry) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      entry.nickname?.toLowerCase().includes(q) ||
      entry.message?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-black text-sm">
              M
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900">
                MINIU WORKSHOP 관리자 모드
              </h3>
              <p className="text-[11px] text-slate-400 font-medium">
                {isAuthenticated ? '방명록 관리 및 삭제' : '운영자 보안 인증'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isAuthenticated && (
              <button
                type="button"
                onClick={handleLogout}
                className="p-1.5 text-xs text-slate-500 hover:text-slate-800 rounded-lg hover:bg-slate-100 flex items-center gap-1 cursor-pointer"
                title="로그아웃"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">로그아웃</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              id="admin-modal-close-btn"
              className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 cursor-pointer"
              title="닫기"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 flex-1 overflow-y-auto">
          {!isAuthenticated ? (
            /* Password Authentication Screen */
            <div className="max-w-sm mx-auto py-8 text-center space-y-6">
              <div className="w-14 h-14 rounded-2xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center mx-auto shadow-xs">
                <Lock className="w-7 h-7" />
              </div>

              <div className="space-y-1">
                <h4 className="text-base font-bold text-slate-900">
                  관리자 비밀번호를 입력해주세요
                </h4>
                <p className="text-xs text-slate-500">
                  부스 운영 전용 관리 페이지입니다.
                </p>
              </div>

              <form onSubmit={handleAuthSubmit} className="space-y-4">
                <div>
                  <input
                    type="password"
                    id="admin-password-input"
                    value={passwordInput}
                    onChange={(e) => {
                      setPasswordInput(e.target.value);
                      if (authError) setAuthError('');
                    }}
                    placeholder="비밀번호 입력"
                    autoComplete="off"
                    autoFocus
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 text-center text-lg font-mono tracking-widest focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
                  />
                  {authError && (
                    <p className="mt-2 text-xs font-bold text-rose-500 flex items-center justify-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>{authError}</span>
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  id="admin-auth-submit-btn"
                  className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-xs transition-colors cursor-pointer"
                >
                  인증하기
                </button>
              </form>
            </div>
          ) : (
            /* Authenticated Guestbook Management Screen */
            <div className="space-y-5">
              {/* Toast Message */}
              {toastMessage && (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2 shadow-2xs">
                  <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{toastMessage}</span>
                </div>
              )}

              {/* Controls Bar */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="닉네임 또는 메시지 내용 검색..."
                    className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
                  />
                </div>

                <div className="flex items-center gap-2 justify-between sm:justify-end">
                  <span className="text-xs font-bold text-slate-500">
                    총 <strong className="text-blue-600">{entries.length}</strong>건
                  </span>
                  <button
                    type="button"
                    onClick={loadGuestbookEntries}
                    disabled={isLoadingEntries}
                    className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-100 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isLoadingEntries ? 'animate-spin' : ''}`} />
                    <span>새로고침</span>
                  </button>
                </div>
              </div>

              {/* Entries List */}
              <div className="space-y-2.5 max-h-[50vh] overflow-y-auto pr-1">
                {isLoadingEntries ? (
                  <div className="py-16 text-center text-xs text-slate-400">
                    방명록 데이터를 불러오는 중...
                  </div>
                ) : filteredEntries.length === 0 ? (
                  <div className="py-12 text-center bg-slate-50 rounded-2xl border border-slate-100 text-slate-400 text-xs space-y-1">
                    <p className="font-bold text-slate-600">등록된 방명록이 없습니다.</p>
                    {searchQuery && <p>검색 조건과 일치하는 항목이 없습니다.</p>}
                  </div>
                ) : (
                  filteredEntries.map((entry) => {
                    const personality =
                      entry.personalityType && entry.personalityType in PERSONALITY_TYPES
                        ? PERSONALITY_TYPES[entry.personalityType as PersonalityTypeId]
                        : null;

                    const isConfirming = confirmDeleteId === entry.id;

                    return (
                      <div
                        key={entry.id}
                        className="p-3.5 sm:p-4 rounded-2xl border border-slate-200 bg-white hover:border-slate-300 transition-colors flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs"
                      >
                        <div className="flex items-start gap-3 min-w-0 flex-1">
                          <div className="w-9 h-9 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center text-xl shrink-0">
                            {entry.sticker || '💖'}
                          </div>

                          <div className="space-y-1 min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                                {entry.nickname}
                              </span>
                              {personality && (
                                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md border ${personality.badgeColor}`}>
                                  {personality.nameKo}
                                </span>
                              )}
                              <span className="text-[10px] text-slate-400 font-mono">
                                {new Date(entry.createdAt).toLocaleDateString('ko-KR', {
                                  month: 'numeric',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </span>
                              <span className="text-[10px] text-slate-400">
                                ❤️ {entry.likes || 0}
                              </span>
                            </div>

                            <p className="text-xs text-slate-700 break-all leading-relaxed">
                              {entry.message}
                            </p>
                          </div>
                        </div>

                        {/* Delete Action Button & Confirm */}
                        <div className="self-end sm:self-center shrink-0">
                          {isConfirming ? (
                            <div className="flex items-center gap-1.5 animate-in fade-in duration-150">
                              <button
                                type="button"
                                onClick={() => handleDeleteEntry(entry.id)}
                                disabled={deletingId === entry.id}
                                className="px-2.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs cursor-pointer disabled:opacity-50"
                              >
                                {deletingId === entry.id ? '삭제 중...' : '확인'}
                              </button>
                              <button
                                type="button"
                                onClick={() => setConfirmDeleteId(null)}
                                className="px-2 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold text-xs cursor-pointer"
                              >
                                취소
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteId(entry.id)}
                              title="방명록 삭제"
                              className="px-2.5 py-1.5 rounded-lg text-rose-600 hover:bg-rose-50 border border-rose-200 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>삭제</span>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
