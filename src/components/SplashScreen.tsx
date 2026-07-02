import { motion } from 'motion/react';
import { useEffect, useState } from 'react';
import { useStore } from '../context/StoreContext';

interface SplashScreenProps {
  onFinish: () => void;
}

export default function SplashScreen({ onFinish }: SplashScreenProps) {
  const { settings: storeSettings } = useStore();
  const [showTagline, setShowTagline] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setShowTagline(true), 1500);
    const finishTimer = setTimeout(() => onFinish(), 4000);
    return () => {
      clearTimeout(timer);
      clearTimeout(finishTimer);
    };
  }, [onFinish]);

  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-luxury-bg overflow-hidden"
    >
      {/* Background Particles (Animated) */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ 
              x: Math.random() * window.innerWidth, 
              y: Math.random() * window.innerHeight,
              opacity: 0 
            }}
            animate={{ 
              y: [null, -100],
              opacity: [0, 0.4, 0],
              scale: [0.5, 1, 0.5]
            }}
            transition={{ 
              duration: 3 + Math.random() * 2, 
              repeat: Infinity,
              delay: Math.random() * 2,
              ease: "linear"
            }}
            className="absolute w-1 h-1 bg-luxury-gold rounded-full"
          />
        ))}
      </div>

      <div className="relative z-10 flex flex-col items-center">
        <motion.div
          initial={{ scale: 0.8, opacity: 0, letterSpacing: "0.2em" }}
          animate={{ scale: 1, opacity: 1, letterSpacing: "0.5em" }}
          transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1] }}
          className="text-white text-4xl md:text-5xl font-display font-light uppercase text-center"
        >
          {storeSettings?.storeName ? (
            <>
              {storeSettings.storeName?.split(' ').slice(0, -1).join(' ') || ''} <br />
              <span className="font-bold text-gold-gradient">{storeSettings.storeName?.split(' ').slice(-1) || ''}</span>
            </>
          ) : (
            <>
              HOUSE OF <br />
              <span className="font-bold text-gold-gradient">FASHIONS</span>
            </>
          )}
        </motion.div>

        {showTagline && (
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="mt-6 text-gray-400 font-sans tracking-[0.3em] uppercase text-xs"
          >
            Luxury Meets Style
          </motion.p>
        )}
      </div>

      <motion.div
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ duration: 3.5, ease: "easeInOut" }}
        className="absolute bottom-10 left-1/4 right-1/4 h-[1px] bg-luxury-gold/30 origin-left"
      />
    </motion.div>
  );
}
