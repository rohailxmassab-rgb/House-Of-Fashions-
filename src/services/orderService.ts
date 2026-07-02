import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { Order } from '../types';

export const subscribeToUserOrders = (userId: string, callback: (orders: Order[]) => void) => {
  const path = 'orders';
  const q = query(
    collection(db, path),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc')
  );
  
  return onSnapshot(q, (snapshot) => {
    const orders = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Order[];
    callback(orders);
  }, (error) => {
    handleFirestoreError(error, OperationType.LIST, path);
  });
};
