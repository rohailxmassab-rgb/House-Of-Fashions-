import { motion, AnimatePresence } from 'motion/react';
import { Heart, ShoppingBag, Plus, Eye, Star } from 'lucide-react';
import { Product } from '../types';
import { cn, formatPrice } from '../lib/utils';
import React, { useState, useEffect } from 'react';
import { db, auth } from '../lib/firebase';
import { useStore } from '../context/StoreContext';
import { doc, getDoc, setDoc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';

import { addToCart } from '../services/cartService';

interface ProductCardProps {
  product: Product;
  onClick: () => void;
}

export default function ProductCard({ product, onClick }: ProductCardProps) {
  const { settings: storeSettings } = useStore();
  const [isWishlist, setIsWishlist] = useState(false);
  const [loading, setLoading] = useState(false);
  const [addingToCart, setAddingToCart] = useState(false);

  useEffect(() => {
    const checkWishlist = async () => {
      if (!auth.currentUser) return;
      const wishlistRef = doc(db, 'wishlist', auth.currentUser.uid);
      const wishlistSnap = await getDoc(wishlistRef);
      if (wishlistSnap.exists()) {
        const products = wishlistSnap.data().products || [];
        setIsWishlist(products.includes(product.id));
      }
    };
    checkWishlist();
  }, [product.id]);

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!auth.currentUser) {
      alert('Please sign in to add items to your bag');
      return;
    }

    setAddingToCart(true);
    try {
      await addToCart(auth.currentUser.uid, {
        ...product,
        quantity: 1,
        selectedSize: product.sizes?.[0] || 'M',
        selectedColor: product.colors?.[0] || 'Default'
      } as any);
    } catch (error) {
      console.error("Error adding to cart:", error);
    } finally {
      setAddingToCart(false);
    }
  };

  const toggleWishlist = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!auth.currentUser) {
      alert('Please sign in to save items to your wishlist');
      return;
    }

    setLoading(true);
    try {
      const wishlistRef = doc(db, 'wishlist', auth.currentUser.uid);
      const wishlistSnap = await getDoc(wishlistRef);

      if (!wishlistSnap.exists()) {
        await setDoc(wishlistRef, {
          userId: auth.currentUser.uid,
          products: [product.id]
        });
      } else {
        await updateDoc(wishlistRef, {
          products: isWishlist ? arrayRemove(product.id) : arrayUnion(product.id)
        });
      }
      setIsWishlist(!isWishlist);
    } catch (error) {
      console.error("Error updating wishlist:", error);
    } finally {
      setLoading(false);
    }
  };

  const productImage = (product.imageUrls?.[0] || product.images?.[0] || product.imageUrl || product.image || "").trim() || null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="group relative bg-luxury-surface/30 rounded-2xl overflow-hidden border border-white/5 hover:border-luxury-gold/20 transition-all duration-500 shadow-xl"
      onClick={onClick}
    >
      {/* Top Actions */}
      <div className="absolute top-4 right-4 z-20 flex flex-col gap-2 transform translate-x-12 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 transition-all duration-500">
        <button
          onClick={toggleWishlist}
          disabled={loading}
          className={cn(
            "p-2.5 rounded-full backdrop-blur-md transition-all duration-300",
            isWishlist 
              ? "bg-luxury-gold text-black shadow-[0_0_15px_rgba(212,175,55,0.4)]" 
              : "bg-black/40 text-white hover:bg-luxury-gold hover:text-black border border-white/10"
          )}
        >
          <Heart size={16} fill={isWishlist ? "currentColor" : "none"} />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onClick(); }}
          className="p-2.5 rounded-full bg-black/40 text-white hover:bg-white hover:text-black backdrop-blur-md border border-white/10 transition-all duration-300"
        >
          <Eye size={16} />
        </button>
      </div>

      {/* Badges */}
      <div className="absolute top-4 left-4 z-20 flex flex-col gap-2">
        {product.discount > 0 && (
          <span className="px-3 py-1 bg-luxury-gold text-black text-[9px] font-bold tracking-[0.2em] rounded-full uppercase shadow-lg">
            -{product.discount}%
          </span>
        )}
        {product.newArrival && (
          <span className="px-3 py-1 bg-white text-black text-[9px] font-bold tracking-[0.2em] rounded-full uppercase shadow-lg">
            New
          </span>
        )}
      </div>

      {/* Image Wrapper */}
      <div className="aspect-[3/4] overflow-hidden relative">
        <img
          src={productImage}
          alt={product.name}
          className="w-full h-full object-cover transition-transform duration-[1.5s] group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        
        {/* Quick Add Overlay */}
        <div className="absolute bottom-4 left-4 right-4 transform translate-y-12 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500 z-20">
          <button 
            onClick={handleAddToCart}
            disabled={addingToCart || product.stock <= 0}
            className="w-full bg-white text-black py-3 rounded-xl text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-luxury-gold transition-colors shadow-2xl flex items-center justify-center gap-2"
          >
            {addingToCart ? (
              <div className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin" />
            ) : product.stock > 0 ? (
              <>
                <Plus size={14} />
                Add to Bag
              </>
            ) : 'Sold Out'}
          </button>
        </div>
      </div>

      {/* Info Section */}
      <div className="p-5 space-y-3">
        <div className="flex justify-between items-start gap-4">
          <div className="space-y-1">
            <span className="text-[10px] text-luxury-gold/60 uppercase tracking-[0.2em] font-medium block">
              {product.category || 'Maison'}
            </span>
            <h3 className="text-sm font-display font-medium text-white/90 group-hover:text-white transition-colors line-clamp-1">
              {product.name}
            </h3>
          </div>
          <div className="flex items-center gap-1 bg-white/5 px-2 py-1 rounded-lg">
            <Star size={10} className="text-luxury-gold fill-luxury-gold" />
            <span className="text-[10px] font-bold text-white/60">4.8</span>
          </div>
        </div>

        <div className="flex items-center gap-3 pt-1">
          <span className="text-lg font-display font-semibold text-gold-gradient">
            {formatPrice(product.salePrice, storeSettings?.currency)}
          </span>
          {product.discount > 0 && (
            <span className="text-xs text-white/30 line-through font-light">
              {formatPrice(product.price, storeSettings?.currency)}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
}
