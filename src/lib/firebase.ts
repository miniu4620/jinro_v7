import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDocFromServer,
  collection,
  onSnapshot,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  limit as firestoreLimit,
  increment,
  Unsubscribe
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { GuestbookEntry, RankingRecord } from '../types';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

// Initialize Firebase App and Firestore with explicit database ID
export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth();

// Error handler adhering strictly to skill mandate
export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Validate connection on boot as mandated by skill
export async function testConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    console.log('Firestore connection verified successfully.');
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration.');
    }
    // Non-fatal if doc does not exist, connection handshake still succeeded
    return true;
  }
}

// Test immediately
testConnection();

// Initial seed data if collection is brand new
const INITIAL_GUESTBOOK_SEEDS: GuestbookEntry[] = [
  {
    id: 'seed-1',
    nickname: '꿈꾸는별',
    personalityType: 'apple',
    message: '미니유공방 부스 방문 완료! 성향 진단도 신기하고 미니어처 키트 체험 너무 유익했어요 ✨',
    sticker: '🍏',
    likes: 12,
    createdAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
  },
  {
    id: 'seed-2',
    nickname: '미래건축가',
    personalityType: 'apple',
    message: '전공 상담도 받고 미니어처 키트도 직접 체험해봤어요. 스태프 작가님들 너무 친절해요 최고!',
    sticker: '🍏',
    likes: 9,
    createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
  },
  {
    id: 'seed-3',
    nickname: '지우랑민서',
    personalityType: 'strawberry',
    message: '친구랑 같이 와서 서로 카드 성향 맞춰봤어요! 미니유공방 파이팅 ✨',
    sticker: '✨',
    likes: 6,
    createdAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
  },
];

// Subscribe to real-time guestbook updates
export function subscribeGuestbook(
  onData: (entries: GuestbookEntry[]) => void,
  onError?: (err: any) => void
): Unsubscribe {
  const path = 'guestbook';
  const q = query(collection(db, path), orderBy('createdAt', 'desc'), firestoreLimit(200));

  return onSnapshot(
    q,
    (snapshot) => {
      if (snapshot.empty) {
        // If completely empty on first launch, optionally populate seeds
        onData(INITIAL_GUESTBOOK_SEEDS);
      } else {
        const items: GuestbookEntry[] = snapshot.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            nickname: data.nickname || '방문자',
            personalityType: data.personalityType || 'apple',
            message: data.message || '',
            sticker: data.sticker || '💖',
            likes: Number(data.likes) || 0,
            createdAt: data.createdAt || new Date().toISOString(),
          };
        });
        onData(items);
      }
    },
    (error) => {
      console.warn('Guestbook onSnapshot error:', error);
      onError?.(error);
      handleFirestoreError(error, OperationType.GET, path);
    }
  );
}

// Add guestbook entry
export async function addGuestbookEntry(entry: Omit<GuestbookEntry, 'id'>): Promise<GuestbookEntry> {
  const path = 'guestbook';
  const docId = `guest-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const docRef = doc(db, path, docId);

  const payload = {
    nickname: entry.nickname.slice(0, 30),
    personalityType: entry.personalityType || 'apple',
    message: entry.message.slice(0, 500),
    sticker: entry.sticker || '💖',
    likes: 0,
    createdAt: entry.createdAt || new Date().toISOString(),
  };

  try {
    await setDoc(docRef, payload);
    return { id: docId, ...payload };
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `${path}/${docId}`);
  }
}

// Like guestbook entry
export async function likeGuestbookEntry(id: string): Promise<void> {
  const path = `guestbook/${id}`;
  try {
    const docRef = doc(db, 'guestbook', id);
    await updateDoc(docRef, {
      likes: increment(1),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

// Delete guestbook entry
export async function deleteGuestbookEntry(id: string): Promise<void> {
  const path = `guestbook/${id}`;
  try {
    const docRef = doc(db, 'guestbook', id);
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// Subscribe to real-time rankings updates
export function subscribeRankings(
  onData: (rankings: RankingRecord[]) => void,
  onError?: (err: any) => void
): Unsubscribe {
  const path = 'rankings';
  const q = query(collection(db, path), orderBy('timeSeconds', 'asc'), firestoreLimit(200));

  return onSnapshot(
    q,
    (snapshot) => {
      const items: RankingRecord[] = snapshot.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          nickname: data.nickname || '참가자',
          timeSeconds: Number(data.timeSeconds) || 0,
          moves: Number(data.moves) || 0,
          createdAt: data.createdAt || new Date().toISOString(),
        };
      });
      onData(items);
    },
    (error) => {
      console.warn('Rankings onSnapshot error:', error);
      onError?.(error);
      handleFirestoreError(error, OperationType.GET, path);
    }
  );
}

// Add ranking record
export async function addRankingRecord(
  record: Omit<RankingRecord, 'id'>
): Promise<{ id: string; rank: number }> {
  const path = 'rankings';
  const docId = `rank-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const docRef = doc(db, path, docId);

  const payload = {
    nickname: record.nickname.slice(0, 30),
    timeSeconds: Math.round(record.timeSeconds * 10) / 10,
    moves: Math.max(1, record.moves),
    createdAt: record.createdAt || new Date().toISOString(),
  };

  try {
    await setDoc(docRef, payload);
    return { id: docId, rank: 1 };
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `${path}/${docId}`);
  }
}

// Delete ranking record
export async function deleteRankingRecord(id: string): Promise<void> {
  const path = `rankings/${id}`;
  try {
    const docRef = doc(db, 'rankings', id);
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}
