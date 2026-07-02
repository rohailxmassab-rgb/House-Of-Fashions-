import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, Filter, ListFilter, ShoppingBag, Plus } from 'lucide-react';
import { subscribeToProductsByIds } from '../services/storeService';
import { Product, Collection } from '../types';
import ProductCard from './ProductCard';

interface CollectionDetailScreenProps {
  collection: Collection;
  onBack: () => void;
  onProductClick: (product: Product) => void;
}

const SkeletonProduct = () => (
  <div className="space-y-4 animate-skeleton">
    <div className="aspect-[3/4] bg-white/5 rounded-2xl" />
    <div className="h-4 w-2/3 bg-white/5 rounded" />
    <div className="h-3 w-1/3 bg-white/5 rounded" />
  </div>
);

export default function CollectionDetailScreen({ collection, onBack, onProductClick }: CollectionDetailScreenProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    window.scrollTo(0, 0);
    const productIds = collection.products || [];
    
    if (productIds.length === 0) {
      setProducts([]);
      setLoading(false);
      return;
    }

    const unsub = subscribeToProductsByIds(productIds, (fetchedProducts) => {
      const orderedProducts = productIds
        .map(id => fetchedProducts.find(p => p.id === id))
        .filter((p): p is Product => !!p);
        
      setProducts(orderedProducts);
      setTimeout(() => setLoading(false), 1000);
    });
    
    return () => unsub();
  }, [collection]);

  return (
    <div className="min-h-screen bg-luxury-bg pb-40">
      {/* Hero Banner Section */}
      <section className="relative h-[60vh] overflow-hidden">
        <motion.div 
          initial={{ scale: 1.1 }}
          animate={{ scale: 1 }}
          transition={{ duration: 2 }}
          className="absolute inset-0"
        >
          <img 
            src={collection.imageUrl || collection.image || null} 
            className="w-full h-full object-cover grayscale-[0.2]"
            alt={collection.name}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/20 to-luxury-bg" />
        </motion.div>

        {/* Floating Controls */}
        <div className="absolute top-10 left-6 right-6 md:left-10 md:right-10 z-20 flex justify-between items-center">
          <button 
            onClick={onBack}
            className="p-4 rounded-full bg-black/40 backdrop-blur-md border border-white/10 hover:bg-white hover:text-black transition-all"
          >
            <ArrowLeft size={20} />
          </button>
          
          <div className="flex gap-4">
            <button className="p-4 rounded-full bg-black/40 backdrop-blur-md border border-white/10 hover:bg-white hover:text-black transition-all">
              <Filter size={18} />
            </button>
          </div>
        </div>

        {/* Content Section */}
        <div className="absolute inset-0 flex flex-col justify-end px-6 md:px-10 pb-20 max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="space-y-6"
          >
            <span className="luxury-label">Editorial House</span>
            <h1 className="text-5xl md:text-8xl luxury-heading uppercase leading-none">
              {collection.name}
            </h1>
            <p className="text-white/60 text-sm md:text-lg italic font-light leading-relaxed max-w-2xl">
              {collection.description}
            </p>
            <div className="flex items-center gap-6 pt-4">
              <span className="text-[10px] text-luxury-gold uppercase tracking-[0.4em] font-bold">
                {products.length} Pieces in Maison
              </span>
              <div className="h-[1px] w-12 bg-white/20" />
            </div>
          </motion.div>
        </div>
      </section>

      {/* Grid Controls */}
      <section className="px-6 md:px-10 py-10 sticky top-0 z-30 bg-luxury-bg/80 backdrop-blur-xl border-b border-white/5 flex justify-between items-center">
        <div className="flex gap-10">
          <button className="text-[10px] uppercase font-bold tracking-[0.3em] text-luxury-gold">Best Matches</button>
          <button className="text-[10px] uppercase font-bold tracking-[0.3em] text-white/40 hover:text-white transition-colors">Price High-Low</button>
        </div>
        <button className="flex items-center gap-3 text-[10px] uppercase font-bold tracking-[0.3em] text-white/40 hover:text-white transition-colors">
          Filters <ListFilter size={14} />
        </button>
      </section>

      {/* Product Grid */}
      <section className="px-6 md:px-10 mt-20">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-16">
          {loading ? Array(8).fill(0).map((_, i) => <SkeletonProduct key={i} />) : 
            products.map((prod, i) => (
              <motion.div
                key={prod.id}
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05, duration: 0.8 }}
              >
                <ProductCard product={prod} onClick={() => onProductClick(prod)} />
              </motion.div>
            ))
          }
        </div>

        {!loading && products.length === 0 && (
          <div className="flex flex-col items-center justify-center py-40 space-y-10">
            <div className="w-24 h-24 rounded-full border border-white/5 flex items-center justify-center bg-luxury-surface/20">
              <ShoppingBag size={32} className="text-white/10" />
            </div>
            <div className="text-center space-y-4">
              <h3 className="text-2xl font-serif italic">Maison is currently empty</h3>
              <p className="text-white/40 text-[10px] uppercase tracking-[0.4em]">No products identified in this house.</p>
            </div>
            <button onClick={onBack} className="bg-white text-black px-10 py-4 rounded-full text-[10px] font-bold uppercase tracking-[0.3em] hover:bg-luxury-gold transition-colors">
              Return to Catalog
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
