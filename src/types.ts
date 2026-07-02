export interface Product {
  id: string; // Internal ID
  productId: string; // Display/SKU ID
  name: string;
  description: string;
  categoryId: string;
  category: string; // Keep for convenience
  brand: string;
  price: number;
  salePrice: number;
  discount: number;
  stock: number;
  soldCount: number;
  rating: number;
  reviewCount: number;
  featured: boolean;
  bestSeller: boolean;
  newArrival: boolean;
  status: 'active' | 'inactive';
  image: string; // Primary image for UI
  images: string[];
  imageUrls?: string[];
  imageUrl?: string;
  sizes: string[];
  colors: string[];
}

export interface Category {
  id: string;
  name: string;
  image: string;
  imageUrl?: string;
  productCount?: number;
  active?: boolean;
}

export interface Banner {
  id: string;
  title: string;
  subtitle?: string;
  desc?: string;
  image: string;
  imageUrl?: string;
  link?: string;
  buttonText?: string;
  type?: string;
  status?: string;
  active?: boolean;
  priority?: number;
  targetType?: string;
  targetId?: string;
}

export interface Collection {
  id: string;
  name: string;
  description: string;
  image: string;
  imageUrl?: string;
  products?: string[];
}

export interface CartItem extends Product {
  quantity: number;
  selectedSize?: string;
  selectedColor?: string;
}

export interface ShippingAddress {
  street: string;
  city: string;
  state: string;
  zip: string;
  country: string;
}

export interface Order {
  id?: string;
  orderId: string;
  userId: string;
  customerName: string;
  customerPhone: string;
  paymentMethod: string;
  paymentStatus: string;
  orderStatus: string;
  subtotal: number;
  shippingFee: number;
  discount: number;
  total: number;
  items: any[]; // Or CartItem[]
  shippingAddress: ShippingAddress;
  createdAt: any; // Timestamp
}

export interface StoreSettings {
  storeName: string;
  currency: string;
  shippingFee: number;
  taxPercentage: number;
  supportEmail: string;
  supportPhone: string;
}

export type AppScreen = 'splash' | 'onboarding' | 'auth' | 'home' | 'product-list' | 'product-detail' | 'collections' | 'collection-detail' | 'cart' | 'checkout' | 'profile' | 'wishlist';
