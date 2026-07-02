import { motion, AnimatePresence } from 'motion/react';
import { useState, useEffect } from 'react';
import { ChevronRight, ArrowRight } from 'lucide-react';
import { Banner } from '../types';
import { subscribeToOnboardingBanners } from '../services/storeService';

interface OnboardingProps {
  onFinish: () => void;
}

export default function Onboarding({ onFinish }: OnboardingProps) {
  const [current, setCurrent] = useState(0);
  const [screens, setScreens] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = subscribeToOnboardingBanners((banners) => {
      if (banners.length > 0) {
        setScreens(banners.map(b => ({
          id: b.id,
          title: b.title,
          desc: b.subtitle || b.desc || b.buttonText || '',
          imageUrl: (b.imageUrl || b.image || '').trim()
        })).filter(s => s.imageUrl !== ''));
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleImageError = (imageUrl: string) => {
    console.error("Onboarding Image Load Error, skipping slide:", imageUrl);
    setScreens(prev => {
      const newScreens = prev.filter(s => s.imageUrl !== imageUrl);
      // If we removed the last screen and we were on it, go to finish
      if (newScreens.length === 0) {
        onFinish();
      }
      return newScreens;
    });
  };

  const next = () => {
    if (current < screens.length - 1) {
      setCurrent(current + 1);
    } else {
      onFinish();
    }
  };

  if (loading) {
    return (
      <div className="h-screen bg-luxury-bg flex items-center justify-center">
        <div className="w-12 h-12 border-2 border-luxury-gold/20 border-t-luxury-gold rounded-full animate-spin" />
      </div>
    );
  }

  // If no banners found, just finish onboarding
  if (screens.length === 0) {
    onFinish();
    return null;
  }

  const currentScreen = screens[current] || screens[0];

  return (
    <div className="relative h-screen bg-luxury-bg overflow-hidden flex flex-col">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentScreen?.id || current}
          initial={{ opacity: 0, scale: 1.1 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 1.05 }}
          transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
          className="absolute inset-0"
        >
          <div className="absolute inset-0 bg-gradient-to-t from-luxury-bg via-transparent to-black/30 z-10" />
          <img
            key={currentScreen?.imageUrl}
            src={currentScreen?.imageUrl}
            alt="background"
            className="w-full h-full object-cover"
            onLoad={() => console.log("Onboarding image loaded:", currentScreen?.imageUrl)}
            onError={() => handleImageError(currentScreen?.imageUrl)}
          />
        </motion.div>
      </AnimatePresence>

      <div className="relative z-20 mt-auto p-8 mb-10">
        <div className="flex gap-2 mb-8">
          {screens.map((_, i) => (
            <motion.div
              key={i}
              animate={{ 
                width: i === current ? 40 : 8,
                backgroundColor: i === current ? '#D4AF37' : 'rgba(255,255,255,0.3)'
              }}
              className="h-1 rounded-full transition-all duration-500"
            />
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={current}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-4xl font-display font-medium mb-4 leading-tight">
              {currentScreen?.title.split(' ').map((word: string, i: number) => (
                <span key={i} className={word === 'Luxury' || word === 'Premium' ? 'text-gold-gradient font-bold' : ''}>
                  {word}{' '}
                </span>
              ))}
            </h1>
            <p className="text-gray-400 text-lg font-light leading-relaxed mb-10 max-w-[90%]">
              {currentScreen?.desc}
            </p>
          </motion.div>
        </AnimatePresence>

        <div className="flex items-center justify-between">
          <button 
            onClick={onFinish}
            className="text-white/40 hover:text-white transition-all uppercase tracking-[0.3em] text-[10px] font-medium border-b border-white/5 hover:border-white/20 pb-1"
          >
            Skip
          </button>
          
          <motion.button
            whileHover={{ x: 5 }}
            whileTap={{ scale: 0.98 }}
            onClick={next}
            className="flex items-center gap-12 bg-white text-black pl-10 pr-6 py-5 rounded-none font-display font-bold transition-all text-xs tracking-[0.2em] hover:bg-[#D4AF37]"
          >
            {current === screens.length - 1 ? 'ENTER HOUSE' : 'NEXT CHAPTER'}
            <ArrowRight size={18} strokeWidth={2.5} />
          </motion.button>
        </div>
      </div>
    </div>
  );
}
