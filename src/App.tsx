import { motion, AnimatePresence } from 'motion/react';
import { useState, useEffect } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from './lib/firebase';
import { ShoppingBag } from 'lucide-react';
import { Product, AppScreen } from './types';
import SplashScreen from './components/SplashScreen';
import Onboarding from './components/Onboarding';
import HomeScreen from './components/HomeScreen';
import ProductDetailScreen from './components/ProductDetailScreen';
import ProfileScreen from './components/ProfileScreen';
import CartScreen from './components/CartScreen';
import BottomNav from './components/BottomNav';
import CollectionsScreen from './components/CollectionsScreen';
import CollectionDetailScreen from './components/CollectionDetailScreen';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [currentScreen, setCurrentScreen] = useState<AppScreen>('splash');
  const [activeTab, setActiveTab] = useState('home');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedCollection, setSelectedCollection] = useState<any | null>(null);
  const [showCart, setShowCart] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
    });
    return () => unsubscribe();
  }, []);

  const handleSplashFinish = () => setCurrentScreen('onboarding');
  const handleOnboardingFinish = () => setCurrentScreen('home');

  const goToProduct = (product: Product) => {
    setSelectedProduct(product);
    setCurrentScreen('product-detail');
  };

  const handleBackFromDetail = () => {
    setCurrentScreen('home');
    setSelectedProduct(null);
  };

  const goToCollections = () => {
    setCurrentScreen('collections');
  };

  const goToCollectionDetail = (collection: any) => {
    setSelectedCollection(collection);
    setCurrentScreen('collection-detail');
  };

  const handleBackFromCollections = () => {
    setCurrentScreen('home');
  };

  const handleBackFromCollectionDetail = () => {
    setCurrentScreen('collections');
    setSelectedCollection(null);
  };

  return (
    <div className="app-container">
      <AnimatePresence mode="wait">
        {currentScreen === 'splash' && (
          <SplashScreen onFinish={handleSplashFinish} />
        )}

        {currentScreen === 'onboarding' && (
          <AnimatePresence>
            <Onboarding onFinish={handleOnboardingFinish} />
          </AnimatePresence>
        )}

        {(currentScreen === 'home' || currentScreen === 'product-detail' || currentScreen === 'profile' || currentScreen === 'collections' || currentScreen === 'collection-detail') && (
          <div className="relative w-full min-h-screen">
            {/* Conditional Rendering of Screens */}
            {activeTab === 'home' && !['product-detail', 'collections', 'collection-detail'].includes(currentScreen) && (
              <HomeScreen 
                onProductClick={goToProduct} 
                onCartClick={() => {
                  setActiveTab('cart');
                  setShowCart(true);
                }}
                onCollectionsClick={goToCollections}
                onCollectionClick={goToCollectionDetail}
              />
            )}
            
            {activeTab === 'profile' && !['product-detail', 'collections', 'collection-detail'].includes(currentScreen) && (
              <div className="content-wrapper pt-32">
                <ProfileScreen />
              </div>
            )}

            {activeTab === 'cart' && !['product-detail', 'collections', 'collection-detail'].includes(currentScreen) && (
              <CartScreen 
                onBack={() => setActiveTab('home')} 
                onCheckout={() => setActiveTab('home')} 
              />
            )}

            {/* Other tabs placeholders with luxury empty states */}
            {['categories', 'wishlist'].includes(activeTab) && !['product-detail', 'collections', 'collection-detail'].includes(currentScreen) && (
              <div className="flex flex-col items-center justify-center min-h-screen text-gray-500 p-10 text-center bg-luxury-bg">
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="space-y-10"
                >
                  <div className="w-24 h-24 rounded-full bg-luxury-surface flex items-center justify-center mx-auto mb-6 border border-white/5 relative overflow-hidden">
                    <motion.div 
                      animate={{ rotate: 360 }}
                      transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                      className="absolute inset-0 border border-luxury-gold/10 border-t-luxury-gold/40 rounded-full"
                    />
                    <ShoppingBag className="text-luxury-gold/20" size={32} />
                  </div>
                  <div>
                    <h3 className="text-2xl font-serif italic text-white mb-4 uppercase tracking-widest">
                      Curating {activeTab}
                    </h3>
                    <p className="text-white/40 text-[10px] uppercase tracking-[0.4em] font-medium max-w-xs mx-auto leading-loose">
                      Our artisans are curating an exclusive {activeTab} experience for the House. Available in the next edit.
                    </p>
                  </div>
                  <button 
                    onClick={() => setActiveTab('home')}
                    className="px-10 py-4 border border-white/10 text-[10px] uppercase tracking-[0.4em] font-bold hover:border-luxury-gold transition-colors"
                  >
                    Return to Catalog
                  </button>
                </motion.div>
              </div>
            )}

            <AnimatePresence>
              {currentScreen === 'product-detail' && selectedProduct && (
                <ProductDetailScreen 
                  product={selectedProduct} 
                  onBack={handleBackFromDetail} 
                />
              )}
            </AnimatePresence>

            <AnimatePresence>
              {currentScreen === 'collections' && (
                <CollectionsScreen 
                  onBack={handleBackFromCollections}
                  onCollectionClick={goToCollectionDetail}
                />
              )}
            </AnimatePresence>

            <AnimatePresence>
              {currentScreen === 'collection-detail' && selectedCollection && (
                <CollectionDetailScreen 
                  collection={selectedCollection}
                  onBack={handleBackFromCollectionDetail}
                  onProductClick={goToProduct}
                />
              )}
            </AnimatePresence>

            <AnimatePresence>
              {showCart && (
                <CartScreen 
                  onBack={() => setShowCart(false)} 
                  onCheckout={() => setShowCart(false)} 
                />
              )}
            </AnimatePresence>

            {/* Bottom Navigation - Hidden on Desktop */}
            {currentScreen !== 'product-detail' && !showCart && (
              <div className="md:hidden">
                <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
              </div>
            )}
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
