import { collection, query, where, onSnapshot, addDoc, serverTimestamp, orderBy } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';

export const subscribeToProductReviews = (productId: string, callback: (reviews: any[]) => void) => {
  const collectionName = 'reviews';
  const q = query(
    collection(db, collectionName),
    where('productId', '==', productId),
    orderBy('createdAt', 'desc')
  );
  
  return onSnapshot(q, (snapshot) => {
    const reviews = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    callback(reviews);
  }, (error) => {
    handleFirestoreError(error, OperationType.LIST, `${collectionName}?productId=${productId}`);
  });
};

export const submitReview = async (productId: string, userId: string, userName: string, rating: number, comment: string) => {
  const path = 'reviews';
  try {
    await addDoc(collection(db, path), {
      productId,
      userId,
      userName,
      rating,
      comment,
      status: 'pending',
      createdAt: serverTimestamp()
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
};
