import { motion } from 'motion/react';
import { Home, Heart, User, LayoutGrid, ShoppingBag } from 'lucide-react';
import { cn } from '../lib/utils';

interface BottomNavProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const TABS = [
  { id: 'home', icon: Home, label: 'Home' },
  { id: 'categories', icon: LayoutGrid, label: 'Categories' },
  { id: 'wishlist', icon: Heart, label: 'Wishlist' },
  { id: 'cart', icon: ShoppingBag, label: 'Cart' },
  { id: 'profile', icon: User, label: 'Profile' },
];

export default function BottomNav({ activeTab, setActiveTab }: BottomNavProps) {
  return (
    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-40 w-[90%] max-w-md">
      <div className="bg-black/80 backdrop-blur-3xl rounded-full px-6 py-4 flex items-center justify-between shadow-2xl border border-white/10">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="relative flex flex-col items-center transition-all duration-300"
            >
              <motion.div
                animate={{ 
                  scale: isActive ? 1.1 : 1,
                  color: isActive ? '#D4AF37' : 'rgba(255,255,255,0.4)'
                }}
                className="transition-colors"
              >
                <Icon size={20} strokeWidth={isActive ? 2 : 1.5} />
              </motion.div>
              
              {isActive && (
                <motion.div
                  layoutId="active-nav-dot"
                  className="absolute -bottom-2 w-1 h-1 rounded-full bg-luxury-gold shadow-[0_0_10px_rgba(212,175,55,0.8)]"
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
