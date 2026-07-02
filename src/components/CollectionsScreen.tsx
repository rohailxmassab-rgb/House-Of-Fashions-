import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, ArrowRight, Plus } from 'lucide-react';
import { subscribeToCollections } from '../services/storeService';
import { Collection } from '../types';

interface CollectionsScreenProps {
  onBack: () => void;
  onCollectionClick: (collection: Collection) => void;
}

const SkeletonCollection = () => (
  <div className="space-y-8 animate-skeleton">
    <div className="aspect-[16/9] bg-white/5 rounded-3xl" />
    <div className="space-y-4">
      <div className="h-8 w-1/2 bg-white/5 rounded" />
      <div className="h-4 w-full bg-white/5 rounded" />
    </div>
  </div>
);

export default function CollectionsScreen({ onBack, onCollectionClick }: CollectionsScreenProps) {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = subscribeToCollections((data) => {
      setCollections(data);
      setTimeout(() => setLoading(false), 1000);
    });
    return () => unsub();
  }, []);

  return (
    <div className="min-h-screen bg-luxury-bg pt-32 pb-40 px-6 md:px-10">
      <div className="max-w-[1800px] mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-24 gap-10">
          <div className="flex items-center gap-8">
            <button 
              onClick={onBack} 
              className="p-5 rounded-full border border-white/5 hover:border-luxury-gold hover:text-luxury-gold transition-all group"
            >
              <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
            </button>
            <div>
              <span className="luxury-label !mb-2">Seasonal Houses</span>
              <h1 className="text-4xl md:text-7xl luxury-heading">The Collections</h1>
            </div>
          </div>
          <p className="text-white/40 text-xs italic font-light max-w-sm leading-relaxed border-l border-white/10 pl-8">
            Discover the narrative behind each house. A fusion of heritage craft and avant-garde silhouette.
          </p>
        </div>

        {/* Collections Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-x-10 gap-y-24">
          {loading ? Array(4).fill(0).map((_, i) => <SkeletonCollection key={i} />) : 
            collections.filter(c => c.imageUrl || c.image).map((col, i) => (
              <motion.div
                key={col.id}
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1, duration: 1, ease: [0.22, 1, 0.36, 1] }}
                className="group cursor-pointer flex flex-col"
                onClick={() => onCollectionClick(col)}
              >
                {/* Image Section - 50% height equivalent usually in flex but we'll use aspect */}
                <div className="relative aspect-[16/10] overflow-hidden rounded-[2.5rem] border border-white/5 mb-10">
                  <img
                    src={col.imageUrl || col.image || null}
                    alt={col.name}
                    className="w-full h-full object-cover transition-transform duration-[2.5s] group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                  
                  {/* Floating count */}
                  <div className="absolute top-8 right-8 bg-black/40 backdrop-blur-md border border-white/10 px-6 py-2 rounded-full">
                    <span className="text-[10px] text-luxury-gold font-bold uppercase tracking-[0.2em]">
                      {col.products?.length || 0} Pieces
                    </span>
                  </div>
                </div>

                {/* Content Section */}
                <div className="flex flex-col md:flex-row justify-between items-start gap-8 px-4">
                  <div className="space-y-4 max-w-xl">
                    <h3 className="text-3xl md:text-5xl font-serif italic group-hover:text-luxury-gold transition-colors duration-500">
                      {col.name}
                    </h3>
                    <p className="text-white/40 text-sm italic font-light leading-loose">
                      {col.description}
                    </p>
                  </div>
                  
                  <button className="flex items-center gap-4 bg-white text-black px-10 py-5 rounded-full text-[10px] font-bold uppercase tracking-[0.3em] hover:bg-luxury-gold transition-all duration-500 group/btn shrink-0">
                    Explore House 
                    <ArrowRight size={16} className="group-hover/btn:translate-x-2 transition-transform" />
                  </button>
                </div>
              </motion.div>
            ))
          }
        </div>

        {!loading && collections.length === 0 && (
          <div className="py-40 text-center space-y-10">
            <div className="w-20 h-20 border border-white/10 rounded-full flex items-center justify-center mx-auto mb-8">
              <Plus size={32} className="text-white/10" />
            </div>
            <p className="text-white/20 uppercase tracking-[0.5em] text-[10px]">No signature houses discovered yet.</p>
            <button onClick={onBack} className="luxury-label mx-auto border-b border-luxury-gold pb-1">Return to Maison</button>
          </div>
        )}
      </div>
    </div>
  );
}
