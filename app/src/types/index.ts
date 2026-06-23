export interface Product {
  id: number;
  name: string;
  slug: string;
  price: number;
  originalPrice?: number;
  images: string[];
  category: string;
  fit: 'Oversized' | 'Tailored' | 'Classic' | 'Slim';
  sizes: string[];
  colors: string[];
  description: string;
  inStock: boolean;
  isNew?: boolean;
  isBestseller?: boolean;
  details?: {
    material: string;
    care: string;
    shipping: string;
    sizeGuide: string;
  };
}

export interface CartItem {
  product: Product;
  size: string;
  quantity: number;
}

export interface User {
  id: string;
  name: string;
  email: string;
  membershipTier: 'standard' | 'deluxe' | 'elite';
  phone?: string;
  avatar?: string;
}

export interface Order {
  id: string;
  date: string;
  items: CartItem[];
  total: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  shippingAddress: Address;
}

export interface Address {
  id: string;
  name: string;
  phone: string;
  email: string;
  street: string;
  city: string;
  state: string;
  isDefault?: boolean;
}

export interface MembershipTier {
  tier: string;
  price: number;
  billing: string;
  description: string;
  features: string[];
  isPopular?: boolean;
}

export interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

export interface Review {
  id: number;
  name: string;
  avatar: string;
  rating: number;
  comment: string;
  date: string;
  image: string;
}

export type PaymentMethod = 'card' | 'transfer' | 'pod';
