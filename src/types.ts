export interface MenuItem {
  id: string;
  name: string;
  price: number;
  description: string;
  category: string;
  image: string;
  isVeg: boolean;
  isAvailable: boolean;
  translations?: Record<string, { name: string; description: string }>;
}

export interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
}

export interface Order {
  id: string;
  customerName: string;
  customerPhone: string;
  items: OrderItem[];
  totalAmount: number;
  status: 'pending' | 'preparing' | 'ready' | 'delivered' | 'cancelled';
  timestamp: string;
  orderType: 'whatsapp' | 'direct';
  notes?: string;
  tableNumber?: string;
}

export interface Reservation {
  id: string;
  customerName: string;
  customerPhone: string;
  date: string;
  time: string;
  guests: number;
  status: 'pending' | 'confirmed' | 'cancelled';
  notes?: string;
  createdAt: string;
}

export interface Offer {
  code: string;
  discountPercent: number;
  description: string;
  isActive: boolean;
}

export interface RestaurantSettings {
  restaurantName: string;
  tagline: string;
  logoUrl: string;
  themeColor: 'amber' | 'emerald' | 'rose' | 'indigo' | 'neutral' | 'orange';
  businessHours: string;
  whatsappNumber: string;
  email: string;
  location: string;
  googleMapUrl: string;
  socialLinks: {
    instagram?: string;
    facebook?: string;
    twitter?: string;
  };
  bannerImage?: string;
}

export interface DatabaseSchema {
  menu: MenuItem[];
  orders: Order[];
  reservations: Reservation[];
  offers: Offer[];
  settings: RestaurantSettings;
}
