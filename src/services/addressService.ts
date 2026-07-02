import { collection, query, where, onSnapshot, addDoc, doc, updateDoc, deleteDoc, getDocs } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { ShippingAddress } from '../types';

export const subscribeToAddresses = (userId: string, callback: (addresses: any[]) => void) => {
  const path = 'addresses';
  const q = query(
    collection(db, path),
    where('userId', '==', userId)
  );
  
  return onSnapshot(q, (snapshot) => {
    const addresses = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    callback(addresses);
  }, (error) => {
    handleFirestoreError(error, OperationType.LIST, path);
  });
};

export const addAddress = async (userId: string, address: ShippingAddress, isDefault: boolean = false) => {
  const path = 'addresses';
  try {
    // If setting as default, unset others first (optional luxury feature)
    await addDoc(collection(db, path), {
      userId,
      ...address,
      isDefault,
      createdAt: new Date()
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
};
