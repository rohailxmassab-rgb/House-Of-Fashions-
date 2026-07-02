import { collection, query, where, onSnapshot, doc, getDoc, orderBy, documentId } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { Product, Category, Banner, Collection } from '../types';

export const subscribeToProducts = (callback: (products: Product[]) => void) => {
  const path = 'products';
  const q = query(collection(db, path), where('status', '==', 'active'));
  
  return onSnapshot(q, (snapshot) => {
    const products = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Product[];
    callback(products);
  }, (error) => {
    handleFirestoreError(error, OperationType.LIST, path);
  });
};

export const subscribeToProductsByIds = (ids: string[], callback: (products: Product[]) => void) => {
  const validIds = (ids || []).filter(id => id && typeof id === 'string' && id.trim() !== '');
  
  if (validIds.length === 0) {
    callback([]);
    return () => {};
  }

  const path = 'products';
  // Firestore 'in' query supports up to 30 IDs
  const chunks = [];
  for (let i = 0; i < validIds.length; i += 30) {
    chunks.push(validIds.slice(i, i + 30));
  }

  const unsubscribers: (() => void)[] = [];
  const results: Record<string, Product[]> = {};

  chunks.forEach((chunk, index) => {
    const q = query(collection(db, path), where(documentId(), 'in', chunk));
    const unsub = onSnapshot(q, (snapshot) => {
      results[index] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Product[];
      
      const allFetched = Object.values(results).flat();
      callback(allFetched);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    });
    unsubscribers.push(unsub);
  });

  return () => unsubscribers.forEach(unsub => unsub());
};

export const subscribeToCategories = (callback: (categories: Category[]) => void) => {
  const path = 'categories';
  const q = collection(db, path);
  
  return onSnapshot(q, (snapshot) => {
    const categories = snapshot.docs
      .map(doc => {
        const data = doc.data();
        let name = data.name || '';
        if (!name || !name.trim()) {
          // If name is empty, use doc.id and capitalize it
          const id = doc.id.toLowerCase();
          if (id === 'men') name = 'Men';
          else if (id === 'women') name = 'Women';
          else if (id === 'kids') name = 'Kids';
          else if (id === 'accessories') name = 'Accessories';
          else if (id === 'bags') name = 'Bags';
          else name = doc.id.charAt(0).toUpperCase() + doc.id.slice(1);
        }
        const image = (data.imageUrl || data.image || '').trim();
        return {
          id: doc.id,
          name: name.trim(),
          image: image,
          imageUrl: data.imageUrl || '',
          productCount: data.productCount || 0,
          active: data.active !== false, // Default to true if not specified
          ...data
        } as Category;
      })
      .filter(cat => cat.active && (cat.productCount > 0 || cat.image !== ''));
    
    callback(categories);
  }, (error) => {
    handleFirestoreError(error, OperationType.LIST, path);
  });
};

export const subscribeToBanners = (callback: (banners: Banner[]) => void) => {
  const path = 'banners';
  const q = collection(db, path);
  
  return onSnapshot(q, (snapshot) => {
        const banners = snapshot.docs.map(doc => {
      const data = doc.data();
      const imageUrl = (data.imageUrl || data.image || '').trim();
      return {
        id: doc.id,
        ...data,
        image: imageUrl,
        imageUrl: imageUrl
      } as Banner;
    })
    .filter(b => b.imageUrl !== ''); // Only show if we have an image
    callback(banners);
  }, (error) => {
    handleFirestoreError(error, OperationType.LIST, path);
  });
};

export const subscribeToOnboardingBanners = (callback: (banners: Banner[]) => void) => {
  const path = 'banners';
  const q = query(
    collection(db, path), 
    where('active', '==', true),
    orderBy('priority', 'asc')
  );
  
  return onSnapshot(q, (snapshot) => {
    const banners = snapshot.docs.map(doc => {
      const data = doc.data();
      const imageUrl = (data.imageUrl || data.image || '').trim();
      return {
        id: doc.id,
        ...data,
        image: imageUrl,
        imageUrl: imageUrl
      } as Banner;
    })
    .filter(b => b.imageUrl !== '');
    callback(banners);
  }, (error) => {
    handleFirestoreError(error, OperationType.LIST, path);
  });
};

export const subscribeToCollections = (callback: (collections: Collection[]) => void) => {
  const path = 'collections';
  const q = collection(db, path);
  
  return onSnapshot(q, (snapshot) => {
    const collections = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        image: data.imageUrl || data.image || '',
        imageUrl: data.imageUrl || data.image || ''
      } as Collection;
    });
    callback(collections);
  }, (error) => {
    handleFirestoreError(error, OperationType.LIST, path);
  });
};

export const getStoreSettings = (callback: (settings: any) => void) => {
  const collectionName = 'settings';
  const docId = 'store';
  const docRef = doc(db, collectionName, docId);
  
  return onSnapshot(docRef, (snapshot) => {
    if (snapshot.exists()) {
      callback({ id: snapshot.id, ...snapshot.data() });
    }
  }, (error) => {
    handleFirestoreError(error, OperationType.GET, `${collectionName}/${docId}`);
  });
};
