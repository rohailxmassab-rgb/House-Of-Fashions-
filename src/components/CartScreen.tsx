import { motion, AnimatePresence } from 'motion/react';
import { useState, useEffect } from 'react';
import { ShoppingBag, Trash2, ChevronRight, ArrowLeft, CreditCard, Truck, CheckCircle2, User, Phone, MapPin } from 'lucide-react';
import { formatPrice } from '../lib/utils';
import { db, auth } from '../lib/firebase';
import { collection, addDoc, serverTimestamp, doc, updateDoc } from 'firebase/firestore';
import { ShippingAddress, Order, CartItem } from '../types';
import { subscribeToCart, removeFromCart, clearCart } from '../services/cartService';
import { subscribeToAddresses, addAddress } from '../services/addressService';
import { validateCoupon } from '../services/couponService';
import { useStore } from '../context/StoreContext';

interface CartScreenProps {
  onBack: () => void;
  onCheckout: () => void;
}

type CartStep = 'review' | 'shipping' | 'success';

export default function CartScreen({ onBack, onCheckout }: CartScreenProps) {
  const { settings: storeSettings } = useStore();
  const [step, setStep] = useState<CartStep>('review');
  const [loading, setLoading] = useState(false);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [savedAddresses, setSavedAddresses] = useState<any[]>([]);
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
  const [couponError, setCouponError] = useState('');
  const [orderInfo, setOrderInfo] = useState({
    name: '',
    phone: '',
    street: '',
    city: '',
    state: '',
    zip: '',
    country: storeSettings?.country || 'USA',
    paymentMethod: 'Cash on Delivery'
  });

  useEffect(() => {
    if (!auth.currentUser) return;
    const unsubCart = subscribeToCart(auth.currentUser.uid, setCartItems);
    const unsubAddr = subscribeToAddresses(auth.currentUser.uid, setSavedAddresses);
    return () => {
      unsubCart();
      unsubAddr();
    };
  }, []);

  const selectSavedAddress = (addr: any) => {
    setOrderInfo({
      ...orderInfo,
      street: addr.street,
      city: addr.city,
      state: addr.state,
      zip: addr.zip,
      country: addr.country
    });
  };

  const subtotal = cartItems.reduce((acc, item) => acc + (item.salePrice * item.quantity), 0);
  const shippingFee = Number(storeSettings?.shippingFee || 0);
  const taxPercentage = Number(storeSettings?.taxPercentage || 0);
  const taxAmount = subtotal * (taxPercentage / 100);
  
  const discount = appliedCoupon 
    ? (appliedCoupon.type === 'percentage' ? (subtotal * appliedCoupon.value / 100) : appliedCoupon.value)
    : 0;
  const total = subtotal + shippingFee + taxAmount - discount;

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    setLoading(true);
    setCouponError('');
    const result = await validateCoupon(couponCode);
    if (result.valid) {
      setAppliedCoupon(result.coupon);
    } else {
      setCouponError(result.message || 'Invalid coupon');
    }
    setLoading(false);
  };

  const handleRemoveItem = async (item: CartItem) => {
    if (!auth.currentUser) return;
    try {
      await removeFromCart(auth.currentUser.uid, item);
    } catch (error) {
      console.error("Error removing item:", error);
    }
  };

  const sanitizeData = (obj: any, path: string = ''): any => {
    if (obj === null) return null;
    if (obj === undefined) {
      console.warn(`[Firestore Sanitizer] Field "${path}" was undefined. Defaulting to empty string.`);
      return '';
    }
    if (typeof obj !== 'object') return obj;
    if (Array.isArray(obj)) {
      return obj.map((item, index) => sanitizeData(item, `${path}[${index}]`));
    }
    
    const sanitized: any = {};
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        const value = obj[key];
        const currentPath = path ? `${path}.${key}` : key;
        
        if (value === undefined) {
          console.warn(`[Firestore Sanitizer] Field "${currentPath}" was undefined. Applying safe default.`);
          // Apply defaults based on common naming patterns or keep as empty string
          if (key.toLowerCase().includes('price') || key.toLowerCase().includes('total') || key.toLowerCase().includes('fee') || key.toLowerCase().includes('discount')) {
            sanitized[key] = 0;
          } else if (Array.isArray(value)) {
            sanitized[key] = [];
          } else {
            sanitized[key] = '';
          }
        } else {
          sanitized[key] = sanitizeData(value, currentPath);
        }
      }
    }
    return sanitized;
  };

  const handlePlaceOrder = async () => {
    if (!auth.currentUser) {
      alert('Please sign in to place an order');
      return;
    }

    // Validate required fields
    const requiredFields = ['name', 'street', 'city', 'state', 'zip', 'country'];
    const missingFields = requiredFields.filter(field => !orderInfo[field as keyof typeof orderInfo]);
    
    if (missingFields.length > 0) {
      alert(`Please provide your full details. Missing: ${missingFields.join(', ')}`);
      return;
    }

    setLoading(true);
    try {
      const shippingAddress: ShippingAddress = {
        street: orderInfo.street || '',
        city: orderInfo.city || '',
        state: orderInfo.state || '',
        zip: orderInfo.zip || '',
        country: orderInfo.country || 'USA'
      };

      const rawOrderData: any = {
        orderId: `ORD-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
        userId: auth.currentUser.uid,
        customerName: orderInfo.name,
        customerPhone: orderInfo.phone,
        paymentMethod: orderInfo.paymentMethod,
        paymentStatus: 'Pending',
        orderStatus: 'Processing',
        subtotal: subtotal || 0,
        shippingFee: shippingFee || 0,
        taxAmount: taxAmount || 0,
        taxPercentage: taxPercentage || 0,
        currency: storeSettings?.currency || 'USD',
        discount: discount || 0,
        total: total || 0,
        items: cartItems.map(item => ({
          id: item.id || '',
          name: item.name || 'Unknown Item',
          price: item.price || 0,
          salePrice: item.salePrice || 0,
          quantity: item.quantity || 1,
          image: item.imageUrls?.[0] || item.images?.[0] || item.imageUrl || item.image || ''
        })),
        shippingAddress,
        createdAt: serverTimestamp()
      };

      console.log('[Order] Placing order with raw data:', rawOrderData);
      const orderData = sanitizeData(rawOrderData);
      console.log('[Order] Sanitized order data ready for Firestore:', orderData);

      await addDoc(collection(db, 'orders'), orderData);
      
      // Save address if not already in saved addresses
      const alreadySaved = savedAddresses.some(a => a.street === orderInfo.street && a.zip === orderInfo.zip);
      if (!alreadySaved) {
        await addAddress(auth.currentUser.uid, shippingAddress);
      }

      await clearCart(auth.currentUser.uid);
      setStep('success');
    } catch (error) {
      console.error("Error placing order:", error);
      alert('Failed to place order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (step === 'success') {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="fixed inset-0 z-[60] bg-luxury-bg flex items-center justify-center p-10"
      >
        <div className="text-center max-w-sm">
          <motion.div 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', damping: 12 }}
            className="w-24 h-24 bg-luxury-gold/20 rounded-full flex items-center justify-center mx-auto mb-10 text-luxury-gold"
          >
            <CheckCircle2 size={48} />
          </motion.div>
          <h2 className="text-4xl font-display font-light lowercase mb-6 tracking-tight">Order Confirmed</h2>
          <p className="text-white/40 text-xs uppercase tracking-[0.2em] font-medium leading-loose mb-12">
            Your selection has been curated and registered. A house representative will oversee its journey to you.
          </p>
          <button 
            onClick={onBack}
            className="w-full h-16 bg-white text-black font-display font-bold uppercase tracking-[0.3em] text-xs hover:bg-luxury-gold transition-all"
          >
            Return to House
          </button>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      className="fixed inset-0 z-[60] bg-luxury-bg/95 backdrop-blur-3xl flex flex-col overflow-hidden"
    >
      <div className="flex-1 overflow-y-auto no-scrollbar">
        <div className="max-w-4xl mx-auto min-h-full border-x border-white/5 bg-luxury-bg shadow-2xl relative flex flex-col">
          <header className="p-10 flex items-center justify-between border-b border-white/5 sticky top-0 bg-luxury-bg/90 backdrop-blur-xl z-30">
          <button onClick={onBack} className="w-12 h-12 flex items-center justify-center rounded-full hover:bg-white/5 transition-colors">
            <ArrowLeft size={24} />
          </button>
          <h2 className="text-2xl font-display font-light lowercase tracking-tight">
            {step === 'review' ? 'Your Selection' : 'Delivery & Terms'}
          </h2>
          <div className="flex items-center gap-2">
            <ShoppingBag size={20} className="text-luxury-gold" />
            <span className="text-sm font-bold">{cartItems.length}</span>
          </div>
        </header>

        <AnimatePresence mode="wait">
          {step === 'review' ? (
            <motion.div 
              key="review"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="p-10 space-y-10"
            >
              {cartItems.map((item) => {
                const productImage = item.imageUrls?.[0] || item.images?.[0] || item.imageUrl || item.image || "";
                return (
                  <div key={item.id} className="flex flex-col sm:flex-row gap-8 p-6 md:p-10 rounded-none bg-luxury-surface border border-white/5 group hover:border-luxury-gold transition-colors">
                    <div className="w-full sm:w-40 aspect-[3/4] rounded-none overflow-hidden flex-shrink-0 bg-luxury-bg">
                      <img src={productImage} alt={item.name} className="w-full h-full object-cover grayscale opacity-80 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-700" />
                    </div>
                    <div className="flex-1 flex flex-col justify-between">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="text-xl font-serif italic mb-2 tracking-tighter uppercase">{item.name}</h3>
                          <p className="luxury-label !tracking-[0.1em]">{item.category} • {item.brand}</p>
                        </div>
                        <button 
                          onClick={() => handleRemoveItem(item)}
                          className="text-white/20 hover:text-red-500 transition-colors"
                        >
                          <Trash2 size={20} />
                        </button>
                      </div>
                      
                      <div className="flex items-end justify-between mt-8">
                        <div className="flex flex-col gap-4">
                          <span className="luxury-label">Quantity</span>
                          <div className="flex items-center gap-6">
                            <button className="w-8 h-8 flex items-center justify-center rounded-none border border-white/10 text-xs hover:border-white transition-colors">-</button>
                            <span className="text-lg font-display">1</span>
                            <button className="w-8 h-8 flex items-center justify-center rounded-none border border-white/10 text-xs hover:border-white transition-colors">+</button>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="luxury-label block mb-2">Item Total</span>
                          <span className="text-2xl font-display font-medium text-gold-gradient">{formatPrice(item.salePrice, storeSettings?.currency)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}

              <div className="p-10 mt-10 border-t border-white/5 bg-luxury-surface/30">
                <div className="max-w-md ml-auto space-y-6">
                  <div className="flex justify-between text-white/40 text-[10px] uppercase tracking-widest font-bold">
                    <span>Subtotal</span>
                    <span>{formatPrice(subtotal, storeSettings?.currency)}</span>
                  </div>
                  <div className="flex justify-between text-white/40 text-[10px] uppercase tracking-widest font-bold">
                    <span>Shipping / Concierge</span>
                    <span className="text-luxury-gold uppercase tracking-widest">
                      {shippingFee > 0 ? formatPrice(shippingFee, storeSettings?.currency) : 'Complimentary'}
                    </span>
                  </div>

                  {taxPercentage > 0 && (
                    <div className="flex justify-between text-white/40 text-[10px] uppercase tracking-widest font-bold">
                      <span>Estimated Tax ({taxPercentage}%)</span>
                      <span>{formatPrice(taxAmount, storeSettings?.currency)}</span>
                    </div>
                  )}

                  <div className="pt-6 border-t border-white/5 space-y-4">
                    <div className="flex gap-4">
                      <input
                        type="text"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value)}
                        placeholder="ENTER PROMO CODE"
                        className="flex-1 bg-black/40 border border-white/10 px-6 py-4 text-[10px] uppercase tracking-widest text-white outline-none focus:border-luxury-gold transition-colors"
                      />
                      <button 
                        onClick={handleApplyCoupon}
                        disabled={loading}
                        className="px-8 bg-white text-black text-[10px] font-bold uppercase tracking-widest hover:bg-luxury-gold transition-all disabled:opacity-50"
                      >
                        Apply
                      </button>
                    </div>
                    {couponError && <p className="text-[10px] text-red-500 uppercase tracking-widest">{couponError}</p>}
                    {appliedCoupon && (
                      <p className="text-[10px] text-luxury-gold uppercase tracking-widest font-bold">
                        Coupon Applied: {appliedCoupon.code} (-{appliedCoupon.type === 'percentage' ? `${appliedCoupon.value}%` : formatPrice(appliedCoupon.value, storeSettings?.currency)})
                      </p>
                    )}
                  </div>

                  <div className="flex justify-between text-3xl font-serif italic pt-8 border-t border-white/10 text-white">
                    <span className="tracking-tighter">Grand Total</span>
                    <span className="text-gold-gradient font-sans font-bold not-italic">{formatPrice(total, storeSettings?.currency)}</span>
                  </div>
                </div>
              </div>
              
              {/* Spacer to prevent footer overlap */}
              <div className="h-48 md:h-64" />
            </motion.div>
          ) : (
            <motion.div 
              key="shipping"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="p-10 space-y-12"
            >
              <section>
                <h3 className="luxury-label mb-8">Personal Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={18} />
                    <input 
                      type="text" 
                      placeholder="Full Name"
                      value={orderInfo.name}
                      onChange={(e) => setOrderInfo({...orderInfo, name: e.target.value})}
                      className="w-full bg-luxury-surface border border-white/5 rounded-none py-5 pl-12 pr-4 text-xs font-bold uppercase tracking-widest outline-none focus:border-luxury-gold transition-colors"
                    />
                  </div>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={18} />
                    <input 
                      type="tel" 
                      placeholder="Phone Number"
                      value={orderInfo.phone}
                      onChange={(e) => setOrderInfo({...orderInfo, phone: e.target.value})}
                      className="w-full bg-luxury-surface border border-white/5 rounded-none py-5 pl-12 pr-4 text-xs font-bold uppercase tracking-widest outline-none focus:border-luxury-gold transition-colors"
                    />
                  </div>
                </div>
              </section>

              <section>
                <div className="flex items-center justify-between mb-8">
                  <h3 className="luxury-label !mb-0">Delivery Address</h3>
                  {savedAddresses.length > 0 && (
                    <span className="text-[10px] text-luxury-gold uppercase tracking-widest font-bold">
                      {savedAddresses.length} Saved Addresses
                    </span>
                  )}
                </div>

                {savedAddresses.length > 0 && (
                  <div className="flex gap-4 overflow-x-auto pb-6 mb-8 no-scrollbar">
                    {savedAddresses.map((addr) => (
                      <button
                        key={addr.id}
                        onClick={() => selectSavedAddress(addr)}
                        className="shrink-0 w-64 p-6 border border-white/5 bg-luxury-surface hover:border-luxury-gold transition-colors text-left group"
                      >
                        <p className="text-[10px] font-bold uppercase tracking-widest mb-2 group-hover:text-luxury-gold transition-colors">
                          {addr.street}
                        </p>
                        <p className="text-[9px] text-white/40 uppercase tracking-tighter">
                          {addr.city}, {addr.state} {addr.zip}
                        </p>
                      </button>
                    ))}
                  </div>
                )}

                <div className="space-y-6">
                  <div className="relative">
                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={18} />
                    <input 
                      type="text" 
                      placeholder="Street Address"
                      value={orderInfo.street}
                      onChange={(e) => setOrderInfo({...orderInfo, street: e.target.value})}
                      className="w-full bg-luxury-surface border border-white/5 rounded-none py-5 pl-12 pr-4 text-xs font-bold uppercase tracking-widest outline-none focus:border-luxury-gold transition-colors"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-6">
                    <input 
                      type="text" 
                      placeholder="City"
                      value={orderInfo.city}
                      onChange={(e) => setOrderInfo({...orderInfo, city: e.target.value})}
                      className="w-full bg-luxury-surface border border-white/5 rounded-none py-5 px-6 text-xs font-bold uppercase tracking-widest outline-none focus:border-luxury-gold transition-colors"
                    />
                    <input 
                      type="text" 
                      placeholder="State / Province"
                      value={orderInfo.state}
                      onChange={(e) => setOrderInfo({...orderInfo, state: e.target.value})}
                      className="w-full bg-luxury-surface border border-white/5 rounded-none py-5 px-6 text-xs font-bold uppercase tracking-widest outline-none focus:border-luxury-gold transition-colors"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-6">
                    <input 
                      type="text" 
                      placeholder="Zip / Postal Code"
                      value={orderInfo.zip}
                      onChange={(e) => setOrderInfo({...orderInfo, zip: e.target.value})}
                      className="w-full bg-luxury-surface border border-white/5 rounded-none py-5 px-6 text-xs font-bold uppercase tracking-widest outline-none focus:border-luxury-gold transition-colors"
                    />
                    <input 
                      type="text" 
                      placeholder="Country"
                      value={orderInfo.country}
                      onChange={(e) => setOrderInfo({...orderInfo, country: e.target.value})}
                      className="w-full bg-luxury-surface border border-white/5 rounded-none py-5 px-6 text-xs font-bold uppercase tracking-widest outline-none focus:border-luxury-gold transition-colors"
                    />
                  </div>
                </div>
              </section>

              <section>
                <h3 className="luxury-label mb-8">Payment Method</h3>
                <div className="grid grid-cols-1 gap-6">
                  {['Cash on Delivery'].map((method) => (
                    <button
                      key={method}
                      onClick={() => setOrderInfo({...orderInfo, paymentMethod: method})}
                      className={`flex items-center gap-6 p-10 border transition-all text-left ${
                        orderInfo.paymentMethod === method 
                          ? 'border-luxury-gold bg-luxury-gold/5' 
                          : 'border-white/5 bg-luxury-surface hover:border-white/20'
                      }`}
                    >
                      <div className={`w-6 h-6 rounded-full border flex items-center justify-center ${
                        orderInfo.paymentMethod === method ? 'border-luxury-gold' : 'border-white/20'
                      }`}>
                        {orderInfo.paymentMethod === method && <div className="w-3 h-3 rounded-full bg-luxury-gold" />}
                      </div>
                      <div>
                        <p className="text-sm font-bold uppercase tracking-[0.2em]">{method}</p>
                        <p className="text-[10px] text-white/20 uppercase tracking-widest mt-1">Direct payment upon arrival at your residence</p>
                      </div>
                    </button>
                  ))}
                </div>
              </section>

              {/* Spacing for content flow */}
              <div className="h-10" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>

    {/* Persistent Footer with consistent positioning at the bottom */}
      <div className="p-8 md:p-12 border-t border-white/10 bg-black/95 backdrop-blur-3xl z-[70] relative">
        <div className="max-w-4xl mx-auto flex gap-4">
          <button 
            onClick={() => step === 'review' ? onBack() : setStep('review')}
            className="flex-1 h-20 border border-white/10 text-white hover:bg-white/5 transition-all text-[10px] font-bold uppercase tracking-[0.2em] font-display"
          >
            {step === 'review' ? 'Return to House' : 'Back to Selection'}
          </button>
          <button 
            onClick={step === 'review' ? () => setStep('shipping') : handlePlaceOrder}
            disabled={loading}
            className="flex-[2] h-20 bg-white text-black font-display font-bold uppercase tracking-[0.3em] text-[10px] hover:bg-luxury-gold transition-all disabled:opacity-50 relative overflow-hidden"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-3">
                Processing Journey
                <motion.span 
                  animate={{ x: [0, 5, 0] }} 
                  transition={{ repeat: Infinity, duration: 1 }}
                >
                  ...
                </motion.span>
              </span>
            ) : (
              step === 'review' ? 'Proceed to Delivery' : `Place Order • ${formatPrice(total, storeSettings?.currency)}`
            )}
          </button>
        </div>
      </div>
    </motion.div>
  );
}

