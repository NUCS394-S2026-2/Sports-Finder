import {
  addDoc,
  collection,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  type Timestamp,
} from 'firebase/firestore';

import { db } from './firebase';

export type ChatMessage = {
  id: string;
  senderId: string; // Firebase UID
  senderName: string;
  senderEmail: string;
  text: string;
  createdAt: Timestamp | null;
};

/**
 * Subscribes to messages for a game in real time.
 * Returns an unsubscribe function — call it in your useEffect cleanup.
 */
export function subscribeToMessages(
  gameId: string,
  callback: (messages: ChatMessage[]) => void,
  onError?: (err: Error) => void,
): () => void {
  const messagesCol = collection(db, 'games', gameId, 'messages');
  const q = query(messagesCol, orderBy('createdAt', 'asc'));
  return onSnapshot(
    q,
    (snapshot) => {
      const messages: ChatMessage[] = snapshot.docs.map((d) => {
        const data = d.data() as Omit<ChatMessage, 'id'>;
        return { id: d.id, ...data };
      });
      callback(messages);
    },
    (err) => {
      onError?.(err);
    },
  );
}

export async function sendMessage(
  gameId: string,
  text: string,
  sender: { uid: string; name: string; email: string },
): Promise<void> {
  const trimmed = text.trim();
  if (!trimmed) return;
  const messagesCol = collection(db, 'games', gameId, 'messages');
  await addDoc(messagesCol, {
    senderId: sender.uid,
    senderName: sender.name,
    senderEmail: sender.email,
    text: trimmed,
    createdAt: serverTimestamp(),
  });
}
