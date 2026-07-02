import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, ShoppingBag, Menu, ChevronRight, ChevronLeft, 
  ArrowRight, ArrowUpRight, Instagram, Twitter, Facebook,
  Bell, Plus, ShieldCheck, Truck, RotateCcw, CreditCard
} from 'lucide-react';
import { Product, Category, Banner, Collection } from '../types';
import { auth, db } from '../lib/firebase';
import { GoogleAuthProvider, signInWithPopup, onAuthStateChanged, User as FirebaseUser, signOut } from 'firebase/auth';
import { 
  subscribeToProducts, subscribeToCategories, 
  subscribeToBanners, subscribeToCollections 
} from '../services/storeService';
import { subscribeToCart } from '../services/cartService';
import { subscribeToNotifications } from '../services/notificationService';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { useStore } from '../context/StoreContext';
import ProductCard from './ProductCard';
import { cn, formatPrice } from '../lib/utils';

interface HomeScreenProps {
  onProductClick: (product: Product) => void;
  onCartClick: () => void;
  onCollectionsClick: () => void;
  onCollectionClick: (collection: any) => void;
}

const SkeletonCard = () => (
  <div className="space-y-4 animate-skeleton rounded-2xl p-4 border border-white/5">
    <div className="aspect-[3/4] bg-white/5 rounded-xl" />
    <div className="h-4 w-2/3 bg-white/5 rounded" />
    <div className="h-3 w-1/3 bg-white/5 rounded" />
  </div>
);

const SkeletonBanner = () => (
  <div className="w-full aspect-[21/9] animate-skeleton bg-white/5 rounded-3xl" />
);

export default function HomeScreen({ onProductClick, onCartClick, onCollectionsClick, onCollectionClick }: HomeScreenProps) {
  const { settings: storeSettings } = useStore();
  const [user, setUser] = useState<FirebaseUser | null>(auth.currentUser);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [cartItems, setCartItems] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [currentBanner, setCurrentBanner] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const handleExplore = () => {
    onCollectionsClick();
  };

  useEffect(() => {
    const unsubs = [
      onAuthStateChanged(auth, async (u) => {
        setUser(u);
        if (u) {
          const userRef = doc(db, 'users', u.uid);
          const snap = await getDoc(userRef);
          if (!snap.exists()) {
            await setDoc(userRef, {
              uid: u.uid,
              displayName: u.displayName,
              email: u.email,
              photoURL: u.photoURL,
              role: 'customer',
              createdAt: serverTimestamp()
            });
          }
        }
      }),
      subscribeToProducts(setProducts),
      subscribeToCategories(setCategories),
      subscribeToBanners(setBanners),
      subscribeToCollections(setCollections),
      subscribeToNotifications(user?.uid || null, setNotifications)
    ];

    if (user) {
      unsubs.push(subscribeToCart(user.uid, setCartItems));
    }

    const timer = setTimeout(() => setLoading(false), 2000);

    return () => {
      unsubs.forEach(unsub => unsub());
      clearTimeout(timer);
    };
  }, [user]);

  useEffect(() => {
    if (banners.length > 0) {
      const timer = setInterval(() => {
        setCurrentBanner((prev) => (prev + 1) % banners.length);
      }, 6000);
      return () => clearInterval(timer);
    }
  }, [banners.length]);

  const newArrivals = products.filter(p => 
    p.newArrival || 
    p.isNew ||
    p.category?.toLowerCase() === 'new-arrivals' || 
    p.categoryId?.toLowerCase() === 'new-arrivals' ||
    p.category?.toLowerCase() === 'new arrivals'
  ).slice(0, 8);
  const featured = products.filter(p => p.featured).slice(0, 8);
  const bestSellers = products.filter(p => p.bestSeller).slice(0, 4);

  const filteredProducts = selectedCategory 
    ? products.filter(p => {
        const categoryName = selectedCategory.toLowerCase();
        const categoryId = selectedCategory.toLowerCase().replace(/\s+/g, '-');
        
        return (
          p.category?.toLowerCase() === categoryName ||
          p.category?.toLowerCase() === categoryId ||
          p.categoryId?.toLowerCase() === categoryName ||
          p.categoryId?.toLowerCase() === categoryId ||
          (categoryName === 'new arrivals' && (p.newArrival || p.category?.toLowerCase().includes('new')))
        );
      })
    : [];

  const handleSignIn = async () => {
    const provider = new GoogleAuthProvider();
    try { await signInWithPopup(auth, provider); } catch (e) { console.error(e); }
  };

  const handleSignOut = async () => {
    try { await signOut(auth); } catch (e) { console.error(e); }
  };

  return (
    <div className="min-h-screen bg-luxury-bg text-white pb-32 selection:bg-luxury-gold selection:text-black">
      {/* Dynamic Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-luxury-bg/80 backdrop-blur-xl border-b border-white/5 px-6 py-4">
        <div className="max-w-[1800px] mx-auto flex justify-between items-center">
          <div className="flex items-center gap-6">
            <button className="p-2 hover:bg-white/5 rounded-full transition-colors">
              <Menu size={20} />
            </button>
            <div className="hidden lg:flex gap-8">
              {['Collections', 'Maison', 'Editorial', 'Atelier'].map(item => (
                <button 
                  key={item} 
                  onClick={() => item === 'Collections' ? onCollectionsClick() : null}
                  className="text-[10px] uppercase tracking-[0.3em] font-medium text-white/40 hover:text-white transition-colors"
                >
                  {item}
                </button>
              ))}
            </div>
          </div>

          <div className="absolute left-1/2 -translate-x-1/2">
            <h1 className="text-xl md:text-2xl font-serif italic tracking-tighter">
              {storeSettings?.storeName || 'House of Fashions'}
            </h1>
          </div>

          <div className="flex items-center gap-4">
            <button className="p-2 hover:bg-white/5 rounded-full transition-colors hidden sm:block">
              <Search size={20} />
            </button>
            <button onClick={onCartClick} className="p-2 hover:bg-white/5 rounded-full transition-colors relative">
              <ShoppingBag size={20} />
              {cartItems.length > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-luxury-gold text-black text-[8px] font-bold flex items-center justify-center rounded-full">
                  {cartItems.length}
                </span>
              )}
            </button>
            {user ? (
              <button onClick={handleSignOut} className="w-8 h-8 rounded-full border border-white/10 overflow-hidden hover:border-luxury-gold transition-colors">
                <img src={user.photoURL || null} alt="User" className="w-full h-full object-cover" />
              </button>
            ) : (
              <button onClick={handleSignIn} className="text-[9px] font-bold uppercase tracking-[0.3em] border border-white/20 px-4 py-2 hover:bg-white hover:text-black transition-all">
                Login
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Slider */}
      <section className="pt-24 px-6 md:px-10 mb-12">
        {loading && banners.length === 0 ? <SkeletonBanner /> : (
          <div className="relative aspect-[21/9] md:aspect-[3/1] overflow-hidden rounded-[2rem] border border-white/5">
            <AnimatePresence mode="wait">
              {banners.length > 0 && (
                <motion.div
                  key={currentBanner}
                  initial={{ opacity: 0, scale: 1.1 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
                  className="absolute inset-0"
                >
                  <img 
                    src={banners[currentBanner].imageUrl || banners[currentBanner].image || null} 
                    className="w-full h-full object-cover"
                    alt="Banner"
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-transparent to-transparent" />
                  <div className="absolute inset-0 flex flex-col justify-center px-10 md:px-20 max-w-2xl">
                    <motion.span 
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 }}
                      className="luxury-label"
                    >
                      Exclusive Editorial
                    </motion.span>
                    <motion.h2 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5 }}
                      className="text-4xl md:text-7xl luxury-heading mb-8 uppercase"
                    >
                      {banners[currentBanner].title}
                    </motion.h2>
                    <motion.button 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.7 }}
                      onClick={handleExplore}
                      className="w-fit bg-white text-black px-8 py-4 rounded-full text-[10px] font-bold uppercase tracking-[0.3em] hover:bg-luxury-gold transition-colors flex items-center gap-3"
                    >
                      Shop Collection <ArrowRight size={14} />
                    </motion.button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            
            <div className="absolute bottom-10 right-10 flex gap-4">
              <button 
                onClick={() => setCurrentBanner((b) => (b === 0 ? banners.length - 1 : b - 1))}
                className="p-4 rounded-full bg-black/40 backdrop-blur-md border border-white/10 hover:bg-white hover:text-black transition-all"
              >
                <ChevronLeft size={20} />
              </button>
              <button 
                onClick={() => setCurrentBanner((b) => (b === banners.length - 1 ? 0 : b + 1))}
                className="p-4 rounded-full bg-black/40 backdrop-blur-md border border-white/10 hover:bg-white hover:text-black transition-all"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          </div>
        )}
      </section>

      {/* Categories Horizontal Scroll */}
      <section className="px-6 md:px-10 mb-20">
        <div className="flex justify-between items-end mb-10">
          <div>
            <span className="luxury-label">Curated Selection</span>
            <h3 className="text-2xl font-serif italic">Browse by Category</h3>
          </div>
        </div>

        <div className="flex gap-8 overflow-x-auto no-scrollbar pb-4 -mx-6 px-6">
          {categories.filter(cat => cat.id !== 'new-arrivals' && cat.name.toLowerCase() !== 'new arrivals').map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.name === selectedCategory ? null : cat.name)}
              className="flex flex-col items-center gap-4 group flex-shrink-0"
            >
              <div className={cn(
                "w-24 h-24 md:w-32 md:h-32 rounded-full p-1 border-2 transition-all duration-500 overflow-hidden",
                selectedCategory === cat.name ? "border-luxury-gold scale-110 shadow-[0_0_20px_rgba(212,175,55,0.2)]" : "border-white/5 group-hover:border-white/20"
              )}>
                <img src={cat.imageUrl || cat.image || null} className="w-full h-full object-cover rounded-full group-hover:scale-110 transition-transform duration-700" alt={cat.name} />
              </div>
              <span className={cn(
                "text-[10px] uppercase tracking-[0.2em] font-medium transition-colors",
                selectedCategory === cat.name ? "text-luxury-gold" : "text-white/40 group-hover:text-white"
              )}>
                {cat.name}
              </span>
            </button>
          ))}
        </div>

        {/* Filtered Category Results */}
        <AnimatePresence>
          {selectedCategory && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-20"
            >
              <div className="flex items-center justify-between mb-12">
                <div>
                  <span className="luxury-label">Category Search</span>
                  <h3 className="text-3xl font-serif italic">{selectedCategory} Collections</h3>
                </div>
                <div className="text-[10px] uppercase tracking-[0.3em] text-white/30">
                  {filteredProducts.length} Pieces Found
                </div>
              </div>
              
              {filteredProducts.length > 0 ? (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-12">
                  {filteredProducts.map((prod) => (
                    <div key={prod.id}>
                      <ProductCard product={prod} onClick={() => onProductClick(prod)} />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-20 text-center border border-white/5 rounded-[3rem] bg-luxury-surface/10">
                  <p className="text-white/20 text-xs uppercase tracking-[0.4em] italic font-light">
                    No pieces currently available in the {selectedCategory} Maison.
                  </p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      {/* New Arrivals Grid */}
      <section className="px-6 md:px-10 mb-32">
        <div className="flex justify-between items-end mb-12">
          <div>
            <span className="luxury-label">Latest Drop</span>
            <h3 className="text-3xl font-serif italic">New Arrivals</h3>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-12">
          {loading && products.length === 0 ? Array(4).fill(0).map((_, i) => <SkeletonCard key={i} />) : 
            newArrivals.map((prod) => (
              <div key={prod.id}>
                <ProductCard product={prod} onClick={() => onProductClick(prod)} />
              </div>
            ))
          }
        </div>
      </section>

      {/* Collections Section - Improved */}
      <section className="px-6 md:px-10 mb-32 bg-luxury-surface/20 py-24 rounded-[3rem] mx-6">
        <div className="text-center mb-16">
          <span className="luxury-label mx-auto">Seasonal Houses</span>
          <h3 className="text-4xl md:text-5xl luxury-heading">Explore Collections</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          {collections.filter(c => c.imageUrl || c.image).slice(0, 3).map((col, i) => (
            <motion.div
              key={col.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              viewport={{ once: true }}
              className="group relative h-[600px] rounded-3xl overflow-hidden border border-white/5 cursor-pointer shadow-2xl"
              onClick={() => onCollectionClick(col)}
            >
              <img src={col.imageUrl || col.image || null} className="w-full h-full object-cover transition-transform duration-[2s] group-hover:scale-110" alt={col.name} />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
              
              <div className="absolute bottom-10 left-10 right-10">
                <span className="text-luxury-gold text-[10px] uppercase tracking-[0.4em] font-bold block mb-4">
                  House of {col.name?.split(' ')[0] || 'Luxury'}
                </span>
                <h4 className="text-3xl font-serif italic mb-6">{col.name}</h4>
                <div className="flex items-center justify-between gap-6 pt-6 border-t border-white/10">
                  <span className="text-[10px] text-white/40 uppercase tracking-[0.2em]">
                    {col.products?.length || 0} Products
                  </span>
                  <button className="bg-white text-black px-6 py-3 rounded-full text-[9px] font-bold uppercase tracking-[0.2em] group-hover:bg-luxury-gold transition-colors flex items-center gap-2">
                    Explore House <Plus size={12} />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
        
        <div className="mt-16 text-center">
          <button 
            onClick={onCollectionsClick}
            className="px-10 py-5 rounded-full border border-white/10 hover:border-luxury-gold transition-colors text-[10px] font-bold uppercase tracking-[0.4em]"
          >
            View All Houses
          </button>
        </div>
      </section>

      {/* Best Sellers */}
      <section className="px-6 md:px-10 mb-32">
        <div className="flex flex-col md:flex-row items-center justify-between mb-16 gap-8">
          <div className="text-center md:text-left">
            <span className="luxury-label">The Icons</span>
            <h3 className="text-4xl font-serif italic">Most Coveted</h3>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {featured.map((prod) => (
            <div key={prod.id}>
              <ProductCard product={prod} onClick={() => onProductClick(prod)} />
            </div>
          ))}
        </div>
      </section>

      {/* Service Experience */}
      <section className="px-6 md:px-10 mb-32">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {[
            { icon: ShieldCheck, title: "Authenticity", desc: "Each piece is certified for heritage and craft." },
            { icon: Truck, title: "Shipping", desc: "Global white-glove concierge delivery service." },
            { icon: RotateCcw, title: "Exchanges", desc: "Seamless private returns within 45 days." },
            { icon: CreditCard, title: "Maison Pay", desc: "Exclusive luxury finance and secure payments." }
          ].map((item, i) => (
            <motion.div 
              key={i}
              className="flex flex-col items-center text-center p-10 bg-luxury-surface/40 rounded-3xl border border-white/5"
            >
              <item.icon className="text-luxury-gold mb-8" size={32} strokeWidth={1} />
              <h5 className="text-[10px] font-bold uppercase tracking-[0.4em] mb-4">{item.title}</h5>
              <p className="text-white/30 text-[11px] tracking-widest leading-relaxed font-light italic">{item.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Footer / Newsletter */}
      <footer className="px-6 md:px-10 pt-32 pb-20 border-t border-white/5">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-20 mb-32">
          <div className="lg:col-span-2 space-y-10">
            <h1 className="text-3xl font-serif italic tracking-tighter">
              {storeSettings?.storeName || 'House of Fashions'}
            </h1>
            <p className="text-white/40 text-sm italic font-light leading-relaxed max-w-sm">
              Subscribe to the Maison's private notifications for exclusive early access and unique editorial content.
            </p>
            <div className="flex border-b border-white/20 pb-4 max-w-md group focus-within:border-luxury-gold transition-colors">
              <input 
                type="email" 
                placeholder="EMAIL ADDRESS" 
                className="bg-transparent border-none outline-none w-full text-[10px] uppercase tracking-[0.3em] font-medium"
              />
              <button className="text-luxury-gold hover:text-white transition-colors">
                <ArrowRight size={20} />
              </button>
            </div>
          </div>

          <div className="space-y-8">
            <h5 className="luxury-label !mb-0">Advisory</h5>
            <ul className="space-y-4 text-white/30 text-[10px] uppercase tracking-[0.2em]">
              <li className="hover:text-white transition-colors cursor-pointer">Concierge</li>
              <li className="hover:text-white transition-colors cursor-pointer">Gift Services</li>
              <li className="hover:text-white transition-colors cursor-pointer">Shipping</li>
              <li className="hover:text-white transition-colors cursor-pointer">Returns</li>
            </ul>
          </div>

          <div className="space-y-8">
            <h5 className="luxury-label !mb-0">Maison</h5>
            <ul className="space-y-4 text-white/30 text-[10px] uppercase tracking-[0.2em]">
              <li className="hover:text-white transition-colors cursor-pointer">Heritage</li>
              <li className="hover:text-white transition-colors cursor-pointer">Craftsmanship</li>
              <li className="hover:text-white transition-colors cursor-pointer">Careers</li>
              <li className="hover:text-white transition-colors cursor-pointer">Press</li>
            </ul>
          </div>
        </div>

        <div className="flex flex-col md:flex-row justify-between items-center gap-10 pt-10 border-t border-white/5 text-[9px] text-white/20 tracking-[0.4em]">
          <span>© 2026 {(storeSettings?.storeName || 'House of Fashions').toUpperCase()}. PARIS</span>
          <div className="flex gap-8">
            <Instagram size={14} className="hover:text-white transition-colors cursor-pointer" />
            <Twitter size={14} className="hover:text-white transition-colors cursor-pointer" />
            <Facebook size={14} className="hover:text-white transition-colors cursor-pointer" />
          </div>
          <span>CRAFTED BY MAISON INTERACTIVE</span>
        </div>
      </footer>
    </div>
  );
}
