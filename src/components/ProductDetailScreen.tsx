import { motion, AnimatePresence } from 'motion/react';
import { 
  ChevronLeft, Share2, Heart, Star, ShoppingBag, Ruler, 
  Info, ShieldCheck, ChevronRight, Maximize2, ArrowLeft, ArrowRight
} from 'lucide-react';
import { Product, CartItem } from '../types';
import { formatPrice, cn } from '../lib/utils';
import React, { useState, useEffect, useRef } from 'react';
import { db, auth } from '../lib/firebase';
import { useStore } from '../context/StoreContext';
import { doc, getDoc, setDoc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { addToCart } from '../services/cartService';
import { subscribeToProductReviews, submitReview } from '../services/reviewService';

interface ProductDetailScreenProps {
  product: Product;
  onBack: () => void;
}

const SkeletonLoader = () => (
  <div className="absolute inset-0 bg-white/5 animate-pulse flex items-center justify-center">
    <div className="w-10 h-[1px] bg-luxury-gold/30 relative overflow-hidden">
      <motion.div 
        animate={{ x: [-50, 50] }}
        transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
        className="absolute inset-y-0 w-4 bg-luxury-gold"
      />
    </div>
  </div>
);

export default function ProductDetailScreen({ product, onBack }: ProductDetailScreenProps) {
  const { settings: storeSettings } = useStore();
  const [selectedSize, setSelectedSize] = useState(product.sizes[0]);
  const [selectedColor, setSelectedColor] = useState(product.colors[0]);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [loadingWishlist, setLoadingWishlist] = useState(false);
  const [addingToCart, setAddingToCart] = useState(false);
  const [reviews, setReviews] = useState<any[]>([]);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewRating, setReviewRating] = useState(5);
  const [submittingReview, setSubmittingReview] = useState(false);
  
  // Gallery State
  const allImages = Array.from(new Set([
    ...(product.imageUrls || []),
    ...(product.images || []),
    product.imageUrl,
    product.image
  ].filter((img): img is string => !!img && typeof img === 'string' && img.trim() !== "")));
  
  const displayImages = allImages.length > 0 ? allImages : ["https://placehold.co/800x1200/1a1a1a/ffffff?text=Image+Unavailable"];
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [imageLoading, setImageLoading] = useState(true);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsub = subscribeToProductReviews(product.id, setReviews);
    return () => unsub();
  }, [product.id]);

  useEffect(() => {
    // Reset index when product changes
    setActiveImageIndex(0);
    window.scrollTo(0, 0);
  }, [product.id]);

  useEffect(() => {
    setImageLoading(true);
  }, [activeImageIndex]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') handlePrevImage();
      if (e.key === 'ArrowRight') handleNextImage();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeImageIndex, displayImages.length]);

  const handleNextImage = () => {
    setActiveImageIndex((prev) => (prev + 1) % displayImages.length);
  };

  const handlePrevImage = () => {
    setActiveImageIndex((prev) => (prev === 0 ? displayImages.length - 1 : prev - 1));
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) {
      alert('Please sign in to leave a review');
      return;
    }
    if (!reviewComment.trim()) return;

    setSubmittingReview(true);
    try {
      await submitReview(
        product.id,
        auth.currentUser.uid,
        auth.currentUser.displayName || 'House Client',
        reviewRating,
        reviewComment
      );
      setReviewComment('');
      alert('Thank you. Your review has been submitted for curation.');
    } catch (error) {
      console.error("Error submitting review:", error);
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleAddToCart = async () => {
    if (!auth.currentUser) {
      alert('Please sign in to add items to your bag');
      return;
    }

    setAddingToCart(true);
    try {
      const cartItem: CartItem = {
        ...product,
        selectedSize,
        selectedColor,
        quantity: 1
      };
      await addToCart(auth.currentUser.uid, cartItem);
      alert('Product added to your selection');
    } catch (error) {
      console.error("Error adding to cart:", error);
    } finally {
      setAddingToCart(false);
    }
  };

  useEffect(() => {
    const checkWishlist = async () => {
      if (!auth.currentUser) return;
      const wishlistRef = doc(db, 'wishlist', auth.currentUser.uid);
      const wishlistSnap = await getDoc(wishlistRef);
      if (wishlistSnap.exists()) {
        const products = wishlistSnap.data().products || [];
        setIsWishlisted(products.includes(product.id));
      }
    };
    checkWishlist();
  }, [product.id]);

  const toggleWishlist = async () => {
    if (!auth.currentUser) {
      alert('Please sign in to save items to your wishlist');
      return;
    }

    setLoadingWishlist(true);
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
          products: isWishlisted ? arrayRemove(product.id) : arrayUnion(product.id)
        });
      }
      setIsWishlisted(!isWishlisted);
    } catch (error) {
      console.error("Error updating wishlist:", error);
    } finally {
      setLoadingWishlist(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-luxury-bg overflow-y-auto no-scrollbar selection:bg-luxury-gold selection:text-black"
    >
      {/* Top Header */}
      <div className="fixed top-0 left-0 right-0 z-[60] p-6 md:px-12 flex items-center justify-between pointer-events-none">
        <button 
          onClick={onBack}
          className="w-12 h-12 flex items-center justify-center rounded-full bg-black/40 backdrop-blur-xl border border-white/10 pointer-events-auto hover:bg-white hover:text-black transition-all"
        >
          <ChevronLeft size={24} />
        </button>
        <div className="flex gap-3 pointer-events-auto">
          <button className="hidden md:flex w-12 h-12 flex items-center justify-center rounded-full bg-black/40 backdrop-blur-xl border border-white/10 hover:bg-white hover:text-black transition-all">
            <Share2 size={20} />
          </button>
          <button 
            onClick={toggleWishlist}
            disabled={loadingWishlist}
            className="w-12 h-12 flex items-center justify-center rounded-full bg-black/40 backdrop-blur-xl border border-white/10 hover:bg-white hover:text-black transition-all disabled:opacity-50"
          >
            <Heart size={20} className={cn(isWishlisted && "fill-red-500 text-red-500")} />
          </button>
        </div>
      </div>
 
      <div className="flex flex-col lg:flex-row min-h-screen">
        {/* Image Gallery Section */}
        <section className="relative w-full lg:w-3/5 xl:w-2/3 lg:h-screen lg:sticky lg:top-0 bg-[#0a0a0a] overflow-hidden">
          <div className="relative w-full h-[75vh] lg:h-full group">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeImageIndex}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                onDragEnd={(_, info) => {
                  if (info.offset.x < -50) handleNextImage();
                  if (info.offset.x > 50) handlePrevImage();
                }}
                className="w-full h-full flex items-center justify-center p-4 md:p-12 lg:p-20 cursor-grab active:cursor-grabbing"
              >
                {imageLoading && <SkeletonLoader />}
                <img
                  src={displayImages[activeImageIndex]}
                  alt={`${product.name} - ${activeImageIndex + 1}`}
                  className={cn(
                    "w-full h-full object-contain transition-opacity duration-500",
                    imageLoading ? "opacity-0" : "opacity-100"
                  )}
                  onLoad={() => setImageLoading(false)}
                  onError={(e) => {
                    setImageLoading(false);
                    e.currentTarget.src = "https://placehold.co/800x1200/1a1a1a/ffffff?text=Image+Unavailable";
                  }}
                />
              </motion.div>
            </AnimatePresence>

            {/* Carousel Controls */}
            {displayImages.length > 1 && (
              <>
                <button 
                  onClick={(e) => { e.stopPropagation(); handlePrevImage(); }}
                  className="absolute left-6 top-1/2 -translate-y-1/2 p-4 rounded-full bg-black/20 backdrop-blur-sm border border-white/5 opacity-0 group-hover:opacity-100 transition-all hover:bg-white hover:text-black"
                >
                  <ArrowLeft size={20} />
                </button>
                <button 
                  onClick={(e) => { e.stopPropagation(); handleNextImage(); }}
                  className="absolute right-6 top-1/2 -translate-y-1/2 p-4 rounded-full bg-black/20 backdrop-blur-sm border border-white/5 opacity-0 group-hover:opacity-100 transition-all hover:bg-white hover:text-black"
                >
                  <ArrowRight size={20} />
                </button>
                
                {/* Image Counter */}
                <div className="absolute bottom-8 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-[9px] uppercase tracking-[0.2em] font-bold">
                  {activeImageIndex + 1} / {displayImages.length}
                </div>
              </>
            )}
          </div>

          {/* Thumbnails Sidebar/Bottom */}
          {displayImages.length > 1 && (
            <div className="absolute bottom-24 lg:bottom-auto lg:top-1/2 lg:right-8 lg:-translate-y-1/2 flex lg:flex-col gap-3 px-8 lg:px-0 w-full lg:w-auto overflow-x-auto lg:overflow-x-visible no-scrollbar">
              {displayImages.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setActiveImageIndex(i)}
                  className={cn(
                    "w-16 h-20 md:w-20 md:h-24 flex-shrink-0 border-2 transition-all duration-300 overflow-hidden rounded-lg",
                    activeImageIndex === i ? "border-luxury-gold scale-105" : "border-white/5 opacity-40 hover:opacity-100"
                  )}
                >
                  <img src={img} className="w-full h-full object-cover" alt={`Thumb ${i + 1}`} />
                </button>
              ))}
            </div>
          )}
          
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-luxury-bg/40 pointer-events-none lg:hidden" />
        </section>

        {/* Info Section */}
        <section className="relative px-6 md:px-12 lg:px-16 py-12 lg:py-24 w-full lg:w-2/5 xl:w-1/3 bg-luxury-bg">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="max-w-xl mx-auto lg:mx-0"
          >
            <div className="flex flex-col gap-4 mb-8">
              <div className="flex items-center justify-between">
                <span className="luxury-label !mb-0">{product.brand}</span>
                <div className="flex items-center gap-1.5 px-3 py-1 bg-white/5 rounded-full border border-white/5">
                  <Star size={12} className="fill-luxury-gold text-luxury-gold" />
                  <span className="text-white font-bold text-xs">{product.rating}</span>
                  <span className="text-white/20 text-[9px] uppercase tracking-widest">({product.reviewCount})</span>
                </div>
              </div>
              <h1 className="text-3xl md:text-5xl font-serif italic uppercase leading-tight tracking-tighter">
                {product.name}
              </h1>
            </div>

            <div className="flex items-end gap-6 mb-12">
              <span className="text-3xl md:text-4xl font-display font-light text-gold-gradient">
                {formatPrice(product.salePrice, storeSettings?.currency)}
              </span>
              {product.discount > 0 && (
                <span className="text-lg text-white/20 line-through font-light mb-1">
                  {formatPrice(product.price, storeSettings?.currency)}
                </span>
              )}
              <div className="ml-auto flex flex-col items-end">
                <span className={cn(
                  "text-[9px] font-bold uppercase tracking-[0.2em] px-3 py-1 rounded-full border",
                  product.stock > 10 
                    ? "text-green-500 border-green-500/20 bg-green-500/5" 
                    : "text-luxury-gold border-luxury-gold/20 bg-luxury-gold/5"
                )}>
                  {product.stock > 0 ? `${product.stock} In Stock` : 'Out of Stock'}
                </span>
              </div>
            </div>

            {/* Color Selector */}
            {product.colors && product.colors.length > 0 && (
              <div className="mb-10">
                <div className="flex justify-between items-center mb-5">
                  <p className="text-[10px] uppercase tracking-[0.3em] font-bold text-white/60">Color / {selectedColor}</p>
                </div>
                <div className="flex gap-3 flex-wrap">
                  {product.colors.map((color) => (
                    <button
                      key={color}
                      onClick={() => setSelectedColor(color)}
                      className={cn(
                        "h-12 px-5 flex items-center justify-center rounded-xl font-bold text-[10px] transition-all duration-300 border tracking-[0.2em] uppercase",
                        selectedColor === color 
                          ? "bg-white text-black border-white shadow-lg" 
                          : "bg-white/5 text-white/40 border-white/10 hover:border-white/20"
                      )}
                    >
                      {color}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Size Selector */}
            {product.sizes && product.sizes.length > 0 && (
              <div className="mb-12">
                <div className="flex items-center justify-between mb-5">
                  <p className="text-[10px] uppercase tracking-[0.3em] font-bold text-white/60">Size / {selectedSize}</p>
                  <button className="flex items-center gap-2 text-luxury-gold text-[9px] font-bold uppercase tracking-widest hover:text-white transition-colors">
                    <Ruler size={12} /> Size Guide
                  </button>
                </div>
                <div className="flex gap-3 flex-wrap">
                  {product.sizes.map((size) => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={cn(
                        "min-w-[4rem] h-12 flex items-center justify-center rounded-xl font-bold text-[10px] transition-all duration-300 border tracking-widest uppercase",
                        selectedSize === size 
                          ? "bg-white text-black border-white shadow-lg" 
                          : "bg-white/5 text-white/40 border-white/10 hover:border-white/20"
                      )}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-4 mb-16">
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={handleAddToCart}
                disabled={addingToCart || product.stock <= 0}
                className="flex-1 h-16 bg-white text-black rounded-2xl font-bold uppercase tracking-[0.2em] text-[10px] hover:bg-luxury-gold transition-all disabled:opacity-50 shadow-xl flex items-center justify-center gap-3"
              >
                {addingToCart ? (
                  <>
                    <div className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                    Adding...
                  </>
                ) : product.stock > 0 ? (
                  <>
                    <ShoppingBag size={16} />
                    Add to Selection
                  </>
                ) : 'Out of Stock'}
              </motion.button>
            </div>

            {/* Description & Details */}
            <div className="space-y-10 mb-24">
              <div className="space-y-4">
                <h4 className="text-[10px] uppercase tracking-[0.4em] font-bold text-luxury-gold">Editorial Notes</h4>
                <p className="text-white/50 text-sm font-light leading-relaxed italic border-l border-luxury-gold/20 pl-6">
                  {product.description}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-10 border-t border-white/5">
                {[
                  { icon: ShieldCheck, text: "Authenticity Certified" },
                  { icon: Info, text: `SKU: ${product.productId}` },
                  { icon: Star, text: `${product.soldCount}+ Curated` },
                  { icon: ShoppingBag, text: "Signature Packaging" }
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-4 text-[9px] uppercase tracking-[0.2em] text-white/40">
                    <item.icon size={16} className="text-luxury-gold/40" />
                    {item.text}
                  </div>
                ))}
              </div>
            </div>

            {/* Reviews Section */}
            <div className="border-t border-white/5 pt-16">
              <div className="flex items-center justify-between mb-12">
                <h4 className="text-[10px] uppercase tracking-[0.4em] font-bold text-white">Client Appraisals ({reviews.length})</h4>
                <div className="h-[1px] flex-1 mx-8 bg-white/5" />
              </div>
              
              <div className="space-y-10">
                {reviews.length > 0 ? reviews.map((rev) => (
                  <div key={rev.id} className="space-y-3">
                    <div className="flex justify-between items-center">
                      <p className="text-[9px] font-bold uppercase tracking-widest text-white">{rev.userName}</p>
                      <div className="flex gap-0.5">
                        {[...Array(5)].map((_, i) => (
                          <Star 
                            key={i} 
                            size={8} 
                            className={cn(i < rev.rating ? "text-luxury-gold fill-luxury-gold" : "text-white/10")} 
                          />
                        ))}
                      </div>
                    </div>
                    <p className="text-xs text-white/40 font-light leading-relaxed italic">"{rev.comment}"</p>
                  </div>
                )) : (
                  <p className="text-[9px] uppercase tracking-[0.2em] text-white/20 text-center py-10">No appraisals recorded for this piece.</p>
                )}
              </div>

              {/* Review Form */}
              <div className="mt-16 p-8 bg-white/5 rounded-3xl border border-white/5">
                <h5 className="text-[9px] font-bold uppercase tracking-[0.3em] mb-6 text-luxury-gold">Submit Appraisal</h5>
                <form onSubmit={handleReviewSubmit} className="space-y-6">
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((num) => (
                      <button 
                        key={num}
                        type="button"
                        onClick={() => setReviewRating(num)}
                        className={cn(
                          "w-10 h-10 rounded-lg border flex items-center justify-center transition-all",
                          reviewRating >= num ? "border-luxury-gold text-luxury-gold bg-luxury-gold/5" : "border-white/10 text-white/20"
                        )}
                      >
                        <Star size={14} fill={reviewRating >= num ? "currentColor" : "none"} />
                      </button>
                    ))}
                  </div>
                  <textarea 
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    placeholder="Your experience..."
                    className="w-full bg-black/40 border border-white/10 p-5 text-sm text-white outline-none focus:border-luxury-gold transition-colors min-h-[100px] rounded-2xl"
                  />
                  <button 
                    disabled={submittingReview}
                    className="w-full py-4 bg-white text-black rounded-xl text-[9px] font-bold uppercase tracking-widest hover:bg-luxury-gold transition-all disabled:opacity-50"
                  >
                    {submittingReview ? 'Submitting...' : 'Post Review'}
                  </button>
                </form>
              </div>
            </div>

            <div className="h-32" />
          </motion.div>
        </section>
      </div>
    </motion.div>
  );
}
