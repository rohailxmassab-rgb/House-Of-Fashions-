import { collection, query, where, onSnapshot, orderBy, limit } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';

export const subscribeToNotifications = (userId: string | null, callback: (notifications: any[]) => void) => {
  const path = 'notifications';
  
  // To comply with standard security rules for global notifications,
  // we filter for those explicitly. This prevents "Permission Denied" 
  // when trying to read the whole collection if rules are restricted.
  const q = query(
    collection(db, path),
    where('type', '==', 'global'),
    orderBy('createdAt', 'desc'),
    limit(20)
  );
  
  return onSnapshot(q, (snapshot) => {
    const notifications = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as any }));
    callback(notifications);
  }, (error) => {
    console.warn(`[Firestore] Notifications sync failed: ${error.message}`);
  });
};
