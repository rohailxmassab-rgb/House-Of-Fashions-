import { doc, onSnapshot, setDoc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '../lib/firebase';
import { Product, CartItem } from '../types';

export const subscribeToCart = (userId: string, callback: (items: CartItem[]) => void) => {
  const path = `cart/${userId}`;
  return onSnapshot(doc(db, 'cart', userId), (snapshot) => {
    if (snapshot.exists()) {
      callback(snapshot.data().items || []);
    } else {
      callback([]);
    }
  }, (error) => {
    handleFirestoreError(error, OperationType.GET, path);
  });
};

export const addToCart = async (userId: string, item: CartItem) => {
  const path = `cart/${userId}`;
  try {
    const cartRef = doc(db, 'cart', userId);
    // Note: This is a simplified version. Ideally we should check if item exists and increment quantity.
    // For now, following the user's "Add products to cart" directive.
    await setDoc(cartRef, {
      userId,
      items: arrayUnion(item)
    }, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
};

export const removeFromCart = async (userId: string, item: CartItem) => {
  const path = `cart/${userId}`;
  try {
    const cartRef = doc(db, 'cart', userId);
    await updateDoc(cartRef, {
      items: arrayRemove(item)
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
};

export const clearCart = async (userId: string) => {
  const path = `cart/${userId}`;
  try {
    const cartRef = doc(db, 'cart', userId);
    await setDoc(cartRef, { userId, items: [] });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
};
