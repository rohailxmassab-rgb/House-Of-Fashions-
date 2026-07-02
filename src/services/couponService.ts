import { collection, query, where, getDocs, limit } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';

export const validateCoupon = async (code: string) => {
  const path = 'coupons';
  try {
    const q = query(
      collection(db, path),
      where('code', '==', code.toUpperCase()),
      where('status', '==', 'active'),
      limit(1)
    );
    
    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) {
      return { valid: false, message: 'Invalid or inactive coupon code' };
    }

    const coupon = querySnapshot.docs[0].data();
    const now = new Date();
    
    if (coupon.expiryDate && coupon.expiryDate.toDate() < now) {
      return { valid: false, message: 'Coupon has expired' };
    }

    return { valid: true, coupon: { id: querySnapshot.docs[0].id, ...coupon } };
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
    return { valid: false, message: 'Error validating coupon' };
  }
};
