import { motion } from 'motion/react';
import React, { useState, useEffect } from 'react';
import { User as UserIcon, Package, Heart, MapPin, Bell, Shield, HelpCircle, LogOut, ChevronRight } from 'lucide-react';
import { auth, db } from '../lib/firebase';
import { useStore } from '../context/StoreContext';
import { GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged, User } from 'firebase/auth';
import { Order } from '../types';
import { subscribeToUserOrders } from '../services/orderService';
import { doc, onSnapshot } from 'firebase/firestore';

export default function ProfileScreen() {
  const { settings: storeSettings } = useStore();
  const [currentUser, setCurrentUser] = useState<User | null>(auth.currentUser);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [orders, setOrders] = useState<Order[]>([]);
  const [wishlistCount, setWishlistCount] = useState(0);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });
    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (!currentUser) {
      setOrders([]);
      setWishlistCount(0);
      return;
    }

    const unsubOrders = subscribeToUserOrders(currentUser.uid, setOrders);
    
    const unsubWishlist = onSnapshot(doc(db, 'wishlist', currentUser.uid), (snap) => {
      if (snap.exists()) {
        setWishlistCount(snap.data().products?.length || 0);
      }
    });

    return () => {
      unsubOrders();
      unsubWishlist();
    };
  }, [currentUser]);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError('');
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
  };

  const MENU_ITEMS = [
    { icon: Package, label: 'Order History', secondary: `${orders.length} orders placed` },
    { icon: Heart, label: 'My Wishlist', secondary: `${wishlistCount} items saved` },
    { icon: MapPin, label: 'Saved Addresses', secondary: 'Manage delivery addresses' },
    { icon: Bell, label: 'Notifications', secondary: 'Check for updates' },
    { icon: Shield, label: 'Privacy & Security', secondary: '' },
    { icon: HelpCircle, label: 'Help Center', secondary: '' },
  ];

  if (!currentUser) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="pb-32 bg-luxury-bg min-h-screen p-8 flex flex-col justify-center"
      >
        <div className="text-center mb-12">
          <div className="w-20 h-20 rounded-full bg-luxury-surface border border-luxury-gold/30 flex items-center justify-center mx-auto mb-6 text-luxury-gold shadow-[0_0_30px_rgba(212,175,55,0.1)]">
            <UserIcon size={32} />
          </div>
          <h1 className="text-3xl font-display font-light lowercase tracking-tighter mb-2">
            {storeSettings?.storeName ? `Sign in to ${storeSettings.storeName}` : 'Member Access'}
          </h1>
          <p className="text-white/40 text-xs uppercase tracking-[0.2em] font-bold">Sign in with Google to continue</p>
        </div>

        <div className="max-w-sm mx-auto w-full space-y-6">
          {error && <p className="text-red-500 text-[10px] uppercase tracking-widest text-center">{error}</p>}
          
          <button 
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full h-16 bg-white text-black flex items-center justify-center gap-4 font-display font-bold uppercase tracking-[0.3em] text-xs hover:bg-luxury-gold transition-all disabled:opacity-50"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            {loading ? 'Connecting...' : 'Sign In with Google'}
          </button>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="pb-32 bg-luxury-bg min-h-screen p-8"
    >
      <div className="flex items-center justify-between mb-10 mt-6">
        <h1 className="text-3xl font-display font-medium">My Profile</h1>
        <button className="w-10 h-10 rounded-full bg-luxury-surface border border-white/10 flex items-center justify-center text-luxury-gold">
          <UserIcon size={20} />
        </button>
      </div>

      {/* User Card */}
      <div className="relative p-8 rounded-3xl bg-luxury-surface border border-white/5 overflow-hidden mb-8 group">
        <div className="absolute top-0 right-0 w-32 h-32 bg-luxury-gold/5 rounded-full -translate-y-16 translate-x-16 blur-2xl group-hover:bg-luxury-gold/10 transition-all duration-700" />
        
        <div className="flex items-center gap-6 relative z-10">
          <div className="w-20 h-20 rounded-full border-2 border-luxury-gold p-1 shadow-[0_0_20px_rgba(212,175,55,0.2)]">
            <img 
              src={currentUser.photoURL || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=400"} 
              alt="Avatar" 
              className="w-full h-full object-cover rounded-full"
            />
          </div>
          <div>
            <h2 className="text-xl font-display font-bold">{currentUser.displayName || 'Member'}</h2>
            <p className="text-gray-500 text-sm mb-2">{currentUser.email}</p>
            <span className="px-3 py-1 bg-luxury-gold/10 text-luxury-gold text-[10px] font-bold uppercase tracking-widest rounded-full">
              Gold Member
            </span>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-10">
        {[
          { label: 'Orders', val: orders.length.toString() },
          { label: 'Wishlist', val: wishlistCount.toString() },
          { label: 'Points', val: '850' },
        ].map((s) => (
          <div key={s.label} className="p-4 rounded-2xl bg-luxury-surface border border-white/5 text-center">
            <p className="text-xl font-display font-bold text-white mb-1">{s.val}</p>
            <p className="text-[8px] text-gray-500 uppercase tracking-widest">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Menu */}
      <div className="space-y-3">
        {MENU_ITEMS.map((item, idx) => {
          const Icon = item.icon;
          return (
            <motion.button
              key={item.label}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.05 }}
              whileHover={{ x: 5 }}
              className="w-full p-5 flex items-center justify-between rounded-2xl bg-luxury-surface border border-white/5 hover:bg-white/5 transition-all group"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-black flex items-center justify-center text-gray-400 group-hover:text-luxury-gold transition-colors">
                  <Icon size={20} />
                </div>
                <div className="text-left">
                  <p className="text-sm font-display font-medium">{item.label}</p>
                  {item.secondary && <p className="text-[10px] text-gray-500">{item.secondary}</p>}
                </div>
              </div>
              <ChevronRight size={18} className="text-gray-700" />
            </motion.button>
          );
        })}
      </div>

      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={handleLogout}
        className="w-full mt-10 p-5 flex items-center justify-center gap-3 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-500 font-display font-bold uppercase tracking-widest text-xs"
      >
        <LogOut size={18} />
        Log Out
      </motion.button>
    </motion.div>
  );
}
