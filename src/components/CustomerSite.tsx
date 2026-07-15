import React, { useState, useEffect } from 'react';
import { 
  Utensils, 
  Search, 
  ShoppingBag, 
  Plus, 
  Minus, 
  Clock, 
  MapPin, 
  Phone, 
  Mail, 
  Calendar, 
  Users, 
  ChevronRight, 
  Star, 
  Check, 
  MessageSquare, 
  Instagram, 
  Facebook, 
  Twitter, 
  AlertCircle,
  X,
  Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { MenuItem, OrderItem, Reservation, Offer, RestaurantSettings } from '../types';

interface CustomerSiteProps {
  settings: RestaurantSettings;
  menu: MenuItem[];
  offers: Offer[];
  onPlaceOrder: (orderData: {
    customerName: string;
    customerPhone: string;
    items: OrderItem[];
    totalAmount: number;
    orderType: 'whatsapp' | 'direct';
    notes: string;
  }) => Promise<{ success: boolean; order?: any }>;
  onBookTable: (resData: {
    customerName: string;
    customerPhone: string;
    date: string;
    time: string;
    guests: number;
    notes: string;
  }) => Promise<boolean>;
}

export default function CustomerSite({ 
  settings, 
  menu, 
  offers, 
  onPlaceOrder, 
  onBookTable 
}: CustomerSiteProps) {
  // Filters & Search
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [vegOnly, setVegOnly] = useState(false);

  // Shopping Cart State
  const [cart, setCart] = useState<OrderItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutNotes, setCheckoutNotes] = useState('');
  const [promoCode, setPromoCode] = useState('');
  const [activeDiscount, setActiveDiscount] = useState<Offer | null>(null);
  const [promoError, setPromoError] = useState('');
  const [promoSuccess, setPromoSuccess] = useState('');

  // Customer Contact Info (Saved in local state for convenience)
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState<any | null>(null);

  // Table Booking Form State
  const [bookingName, setBookingName] = useState('');
  const [bookingPhone, setBookingPhone] = useState('');
  const [bookingDate, setBookingDate] = useState('');
  const [bookingTime, setBookingTime] = useState('');
  const [bookingGuests, setBookingGuests] = useState(2);
  const [bookingNotes, setBookingNotes] = useState('');
  const [isBooking, setIsBooking] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);

  // Reviews State
  const [reviews, setReviews] = useState([
    { name: 'Elena R.', rating: 5, text: 'The Truffle Risotto is absolutely divine. Tastes like genuine Northern Italy! Wonderful experience ordering direct.', date: 'Today' },
    { name: 'Marcus T.', rating: 5, text: 'Wagyu Burger was exceptionally juicy and cooked exactly to medium-rare. Quick WhatsApp checkout process too!', date: 'Yesterday' },
    { name: 'Simran K.', rating: 4, text: 'The woodfired margherita has the perfect airy crust. Easy table reservations, beautiful restaurant interior.', date: '3 days ago' },
  ]);
  const [newReviewName, setNewReviewName] = useState('');
  const [newReviewText, setNewReviewText] = useState('');
  const [newReviewRating, setNewReviewRating] = useState(5);

  const categories = ['All', ...Array.from(new Set(menu.map(item => item.category)))];

  // Map theme color to actual tailwind color classes
  const getThemeClasses = () => {
    switch (settings.themeColor) {
      case 'amber':
        return {
          bg: 'bg-amber-600 hover:bg-amber-700',
          bgLight: 'bg-amber-50',
          border: 'border-amber-600',
          text: 'text-amber-600',
          textDark: 'text-amber-900',
          focus: 'focus:ring-amber-500',
          accent: 'amber'
        };
      case 'emerald':
        return {
          bg: 'bg-emerald-600 hover:bg-emerald-700',
          bgLight: 'bg-emerald-50',
          border: 'border-emerald-600',
          text: 'text-emerald-600',
          textDark: 'text-emerald-900',
          focus: 'focus:ring-emerald-500',
          accent: 'emerald'
        };
      case 'rose':
        return {
          bg: 'bg-rose-600 hover:bg-rose-700',
          bgLight: 'bg-rose-50',
          border: 'border-rose-600',
          text: 'text-rose-600',
          textDark: 'text-rose-900',
          focus: 'focus:ring-rose-500',
          accent: 'rose'
        };
      case 'indigo':
        return {
          bg: 'bg-indigo-600 hover:bg-indigo-700',
          bgLight: 'bg-indigo-50',
          border: 'border-indigo-600',
          text: 'text-indigo-600',
          textDark: 'text-indigo-900',
          focus: 'focus:ring-indigo-500',
          accent: 'indigo'
        };
      case 'neutral':
        return {
          bg: 'bg-neutral-900 hover:bg-neutral-800',
          bgLight: 'bg-neutral-100',
          border: 'border-neutral-900',
          text: 'text-neutral-900',
          textDark: 'text-neutral-900',
          focus: 'focus:ring-neutral-900',
          accent: 'neutral'
        };
      case 'orange':
      default:
        return {
          bg: 'bg-amber-700 hover:bg-amber-800',
          bgLight: 'bg-amber-50',
          border: 'border-amber-700',
          text: 'text-amber-800',
          textDark: 'text-amber-900',
          focus: 'focus:ring-amber-700',
          accent: 'orange'
        };
    }
  };

  const theme = getThemeClasses();

  // Cart logic
  const addToCart = (item: MenuItem) => {
    const existing = cart.find(c => c.id === item.id);
    if (existing) {
      setCart(cart.map(c => c.id === item.id ? { ...c, quantity: c.quantity + 1 } : c));
    } else {
      setCart([...cart, { id: item.id, name: item.name, price: item.price, quantity: 1 }]);
    }
    setCartOpen(true);
  };

  const updateCartQuantity = (id: string, amount: number) => {
    const item = cart.find(c => c.id === id);
    if (!item) return;

    const newQty = item.quantity + amount;
    if (newQty <= 0) {
      setCart(cart.filter(c => c.id !== id));
    } else {
      setCart(cart.map(c => c.id === id ? { ...c, quantity: newQty } : c));
    }
  };

  const subtotal = cart.reduce((acc, c) => acc + (c.price * c.quantity), 0);
  const discountAmount = activeDiscount ? (subtotal * activeDiscount.discountPercent) / 100 : 0;
  const total = subtotal - discountAmount;

  // Apply promo code
  const handleApplyPromo = () => {
    setPromoError('');
    setPromoSuccess('');
    const found = offers.find(o => o.code.toUpperCase() === promoCode.toUpperCase() && o.isActive);
    if (found) {
      setActiveDiscount(found);
      setPromoSuccess(`Promo code applied! Enjoy ${found.discountPercent}% off.`);
    } else {
      setPromoError('Invalid or expired promo code.');
      setActiveDiscount(null);
    }
  };

  // WhatsApp Checkout
  const handleWhatsAppCheckout = async () => {
    if (!customerName || !customerPhone) {
      setPromoError('Please enter your Name and Phone Number to check out.');
      return;
    }

    setIsPlacingOrder(true);
    const orderData = {
      customerName,
      customerPhone,
      items: cart,
      totalAmount: total,
      orderType: 'whatsapp' as const,
      notes: checkoutNotes
    };

    const res = await onPlaceOrder(orderData);
    setIsPlacingOrder(false);

    if (res.success) {
      // Build WhatsApp Link
      let text = `*New Order from ${settings.restaurantName} Website!*\n\n`;
      text += `*Customer:* ${customerName}\n`;
      text += `*Phone:* ${customerPhone}\n`;
      text += `*Notes:* ${checkoutNotes || 'None'}\n\n`;
      text += `*Items Ordered:*\n`;
      cart.forEach(item => {
        text += `- ${item.name} (x${item.quantity}) - $${(item.price * item.quantity).toFixed(2)}\n`;
      });
      if (activeDiscount) {
        text += `\n*Promo Applied:* ${activeDiscount.code} (${activeDiscount.discountPercent}% off)`;
      }
      text += `\n*Total Amount:* $${total.toFixed(2)}`;

      const formattedPhone = settings.whatsappNumber.replace(/[^0-9+]/g, '');
      const whatsappUrl = `https://api.whatsapp.com/send?phone=${formattedPhone}&text=${encodeURIComponent(text)}`;
      
      // Clear cart
      setCart([]);
      setCartOpen(false);
      setOrderSuccess(res.order);

      // Open whatsapp
      window.open(whatsappUrl, '_blank');
    }
  };

  // Direct Checkout (Live to Dashboard)
  const handleDirectCheckout = async () => {
    if (!customerName || !customerPhone) {
      setPromoError('Please enter your Name and Phone Number to check out.');
      return;
    }

    setIsPlacingOrder(true);
    const orderData = {
      customerName,
      customerPhone,
      items: cart,
      totalAmount: total,
      orderType: 'direct' as const,
      notes: checkoutNotes
    };

    const res = await onPlaceOrder(orderData);
    setIsPlacingOrder(false);

    if (res.success) {
      setCart([]);
      setCartOpen(false);
      setOrderSuccess(res.order);
    }
  };

  // Reservation Book
  const handleBookTableSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookingName || !bookingPhone || !bookingDate || !bookingTime) return;

    setIsBooking(true);
    const success = await onBookTable({
      customerName: bookingName,
      customerPhone: bookingPhone,
      date: bookingDate,
      time: bookingTime,
      guests: bookingGuests,
      notes: bookingNotes
    });
    setIsBooking(false);

    if (success) {
      setBookingSuccess(true);
      setBookingName('');
      setBookingPhone('');
      setBookingDate('');
      setBookingTime('');
      setBookingGuests(2);
      setBookingNotes('');
    }
  };

  // Add review
  const handleAddReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReviewName || !newReviewText) return;

    setReviews([
      {
        name: newReviewName,
        rating: newReviewRating,
        text: newReviewText,
        date: 'Just now'
      },
      ...reviews
    ]);
    setNewReviewName('');
    setNewReviewText('');
    setNewReviewRating(5);
  };

  // Filter menu items
  const filteredMenu = menu.filter(item => {
    const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
    const matchesVeg = !vegOnly || item.isVeg;
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          item.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesVeg && matchesSearch && item.isAvailable;
  });

  return (
    <div className={`min-h-screen bg-neutral-50 text-neutral-800 font-sans theme-${theme.accent}`}>
      {/* Banner / Navigation Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-neutral-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 ${theme.bg} rounded-lg flex items-center justify-center`}>
              <div className="w-4 h-4 border-2 border-white rounded-sm"></div>
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tighter uppercase text-neutral-950">{settings.restaurantName}</h1>
              <p className="text-[10px] text-orange-500 font-bold uppercase tracking-[0.2em]">{settings.tagline}</p>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-xs font-bold uppercase tracking-widest text-neutral-600">
            <a href="#hero" className="hover:text-neutral-950 transition-colors">Home</a>
            <a href="#menu" className="hover:text-neutral-950 transition-colors">Menu</a>
            <a href="#book" className="hover:text-neutral-950 transition-colors">Book Table</a>
            <a href="#reviews" className="hover:text-neutral-950 transition-colors">Reviews</a>
            <a href="#contact" className="hover:text-neutral-950 transition-colors">About</a>
          </nav>

          <div className="flex items-center gap-4">
            <button 
              id="view-cart-btn"
              onClick={() => setCartOpen(true)}
              className="relative p-2.5 rounded-none bg-neutral-100 hover:bg-neutral-200 text-neutral-700 transition-colors"
            >
              <ShoppingBag size={20} />
              {cart.length > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 rounded-none bg-red-600 text-white text-[11px] font-bold flex items-center justify-center">
                  {cart.reduce((a, c) => a + c.quantity, 0)}
                </span>
              )}
            </button>
            <a 
              href="#menu" 
              className={`hidden sm:inline-flex items-center justify-center px-6 py-3 rounded-none text-white text-xs font-bold uppercase tracking-widest transition-colors ${theme.bg}`}
            >
              Order Online
            </a>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section id="hero" className="relative bg-neutral-950 text-white overflow-hidden py-24 md:py-32">
        <div className="absolute inset-0 opacity-40">
          <img 
            src={settings.bannerImage || "https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=1200"} 
            alt="Delicious gourmet dishes spread across restaurant table" 
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-r from-neutral-950 via-neutral-950/80 to-transparent"></div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <span className="text-orange-500 font-bold uppercase tracking-[0.2em] text-xs block mb-3">
              THE NEXT EVOLUTION
            </span>
            <h2 className="text-[52px] sm:text-[76px] lg:text-[84px] leading-[0.85] font-black tracking-tighter uppercase mb-6">
              Savor the art<br/>
              of <span className="text-orange-500">culinary</span><br/>
              creations.
            </h2>
            <p className="text-base sm:text-lg text-neutral-300 font-medium max-w-[500px] leading-relaxed mb-8">
              Every dish is a curated story of hand-selected ingredients, traditional culinary art, and modern innovation, served fresh to your screen or table.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <a 
                href="#menu" 
                className={`inline-flex items-center justify-center px-8 py-4 rounded-none text-white font-bold text-xs uppercase tracking-widest transition-colors ${theme.bg}`}
              >
                Browse Menu <ChevronRight size={16} className="ml-1.5" />
              </a>
              <a 
                href="#book" 
                className="inline-flex items-center justify-center px-8 py-4 rounded-none bg-white/10 hover:bg-white/20 text-white font-bold text-xs uppercase tracking-widest border border-white/20 backdrop-blur-sm transition-colors"
              >
                Book a Table
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Special Offers Banner */}
      {offers.length > 0 && (
        <section className="bg-amber-50 border-b border-amber-100 py-4 overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-center gap-4 text-center md:text-left">
            <span className="flex items-center gap-2 text-amber-800 font-bold text-sm uppercase tracking-wider bg-amber-200/50 px-3 py-1 rounded-md">
              <Sparkles size={16} /> Exclusive Offers
            </span>
            <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-2 text-sm text-amber-900 font-medium">
              {offers.map((offer, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <Check size={16} className="text-amber-700" />
                  <span>Use code <strong className="font-bold font-mono text-base tracking-wider text-amber-950">{offer.code}</strong> for {offer.discountPercent}% off ({offer.description})</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Main Menu Section */}
      <section id="menu" className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-xl mx-auto mb-12">
          <span className="text-orange-500 font-bold uppercase tracking-[0.2em] text-xs block mb-2">SAVORY FLAVORS</span>
          <h3 className="text-4xl sm:text-5xl font-black tracking-tighter uppercase text-neutral-950 mb-3">Our Exquisite Menu</h3>
          <p className="text-neutral-500 text-sm font-medium">Discover fresh, artisanal dishes prepared daily. Filter by category or search your favorite ingredients.</p>
        </div>

        {/* Search, Category Filters, Veg Switch */}
        <div className="bg-white rounded-none border border-neutral-200 p-6 mb-10 flex flex-col gap-6">
          <div className="flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="absolute left-4 top-3.5 text-neutral-400" size={18} />
              <input 
                id="search-dishes-input"
                type="text" 
                placeholder="Search savory dishes, ingredients, or desserts..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-neutral-50 border border-neutral-200 rounded-none text-sm focus:outline-none focus:border-neutral-400 focus:bg-white transition"
              />
            </div>
            
            {/* Veg Switch */}
            <div className="flex items-center gap-3 px-1">
              <label htmlFor="veg-only-toggle" className="text-xs font-bold text-neutral-700 uppercase tracking-widest cursor-pointer">Vegetarian Only</label>
              <button 
                id="veg-only-toggle"
                onClick={() => setVegOnly(!vegOnly)}
                className={`relative w-11 h-6 rounded-none transition-colors ${vegOnly ? 'bg-emerald-600' : 'bg-neutral-200'}`}
              >
                <span className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-none shadow-sm transition-transform ${vegOnly ? 'translate-x-5' : ''}`}></span>
              </button>
            </div>
          </div>

          {/* Categories Horizontal Slider */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar border-t border-neutral-100 pt-4">
            {categories.map((cat, idx) => (
              <button
                key={idx}
                id={`cat-tab-${cat.replace(/\s+/g, '-').toLowerCase()}`}
                onClick={() => setSelectedCategory(cat)}
                className={`px-5 py-2.5 rounded-none text-xs font-bold uppercase tracking-widest whitespace-nowrap transition-all ${
                  selectedCategory === cat 
                    ? `${theme.bg} text-white shadow-sm` 
                    : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-700'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Menu Items Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <AnimatePresence mode="popLayout">
            {filteredMenu.map((item) => (
              <motion.div 
                key={item.id}
                layout
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white rounded-none border border-neutral-200 overflow-hidden flex flex-col group hover:border-neutral-400 transition duration-300"
              >
                {/* Item Image */}
                <div className="h-56 relative bg-neutral-100 overflow-hidden">
                  <img 
                    src={item.image} 
                    alt={item.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                    referrerPolicy="no-referrer"
                  />
                  {/* Badges */}
                  <div className="absolute top-4 left-4 flex gap-2">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-none text-[9px] font-black uppercase tracking-wider ${
                      item.isVeg ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' : 'bg-red-100 text-red-800 border border-red-200'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-none ${item.isVeg ? 'bg-emerald-600' : 'bg-red-600'}`}></span>
                      {item.isVeg ? 'Veg' : 'Non-Veg'}
                    </span>
                    <span className="bg-neutral-900 text-white px-3 py-1 rounded-none text-[9px] font-black uppercase tracking-wider border border-neutral-800">
                      {item.category}
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-6 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start gap-4 mb-2">
                      <h4 className="text-lg font-black tracking-tighter uppercase text-neutral-950 group-hover:text-orange-500 transition-colors">
                        {item.name}
                      </h4>
                      <span className="font-mono text-lg font-black text-neutral-950">
                        ${item.price.toFixed(2)}
                      </span>
                    </div>
                    <p className="text-neutral-500 text-xs leading-relaxed mb-6 font-medium">
                      {item.description}
                    </p>
                  </div>

                  <button
                    id={`add-to-cart-${item.id}`}
                    onClick={() => addToCart(item)}
                    className={`w-full py-3 rounded-none font-black text-xs uppercase tracking-widest transition-colors flex items-center justify-center gap-2 bg-neutral-950 text-white hover:bg-orange-600`}
                  >
                    <Plus size={14} /> Add to Order
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {filteredMenu.length === 0 && (
            <div className="col-span-full py-16 text-center">
              <AlertCircle className="mx-auto text-neutral-400 mb-4" size={40} />
              <h5 className="font-semibold text-neutral-800 mb-1">No dishes match your search</h5>
              <p className="text-neutral-500 text-sm">Try adjusting your filters or search keywords.</p>
            </div>
          )}
        </div>
      </section>

      {/* Booking Form Section */}
      <section id="book" className="py-20 bg-neutral-100 border-y border-neutral-200/50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-none border-2 border-neutral-950 shadow-none overflow-hidden grid grid-cols-1 md:grid-cols-5">
            {/* Dark Promo Sidebar */}
            <div className="bg-neutral-950 text-white p-8 md:col-span-2 flex flex-col justify-between">
              <div>
                <span className="inline-block px-3 py-1 rounded-none text-[9px] font-black tracking-widest uppercase mb-6 bg-transparent border border-white/20 text-orange-500">
                  Table Reservations
                </span>
                <h4 className="text-2xl font-black uppercase tracking-tighter mb-4">Book Your Table</h4>
                <p className="text-neutral-400 text-sm leading-relaxed mb-6 font-medium">
                  Join us for lunch, dinner, or host your intimate celebrations. Secure your spot now to avoid wait times.
                </p>
              </div>

              <div className="space-y-4 text-xs text-neutral-300 border-t border-neutral-800 pt-6 font-medium">
                <div className="flex items-center gap-3">
                  <Clock size={16} className="text-orange-500" />
                  <span>{settings.businessHours}</span>
                </div>
                <div className="flex items-center gap-3">
                  <MapPin size={16} className="text-orange-500" />
                  <span>{settings.location}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Phone size={16} className="text-orange-500" />
                  <span>{settings.whatsappNumber}</span>
                </div>
              </div>
            </div>

            {/* Form */}
            <div className="p-8 md:col-span-3">
              {bookingSuccess ? (
                <div className="h-full flex flex-col items-center justify-center text-center py-8">
                  <div className="w-16 h-16 bg-emerald-50 text-emerald-600 border-2 border-emerald-600 rounded-none flex items-center justify-center mb-4">
                    <Check size={32} />
                  </div>
                  <h4 className="text-xl font-black uppercase tracking-tighter text-neutral-950 mb-2">Reservation Submitted!</h4>
                  <p className="text-neutral-500 text-xs max-w-sm mb-6 font-medium">
                    Your table request is pending review. We will contact you shortly to confirm your booking.
                  </p>
                  <button 
                    onClick={() => setBookingSuccess(false)}
                    className={`px-6 py-3 rounded-none text-white font-bold text-xs uppercase tracking-widest transition-colors ${theme.bg}`}
                  >
                    Book Another Table
                  </button>
                </div>
              ) : (
                <form onSubmit={handleBookTableSubmit} className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-neutral-700 uppercase tracking-widest mb-2">Name</label>
                      <input 
                        id="book-name"
                        type="text" 
                        required
                        value={bookingName}
                        onChange={(e) => setBookingName(e.target.value)}
                        placeholder="Your full name"
                        className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-none text-sm focus:outline-none focus:border-neutral-950 focus:bg-white transition"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-neutral-700 uppercase tracking-widest mb-2">Phone</label>
                      <input 
                        id="book-phone"
                        type="tel" 
                        required
                        value={bookingPhone}
                        onChange={(e) => setBookingPhone(e.target.value)}
                        placeholder="Phone number"
                        className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-none text-sm focus:outline-none focus:border-neutral-950 focus:bg-white transition"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-neutral-700 uppercase tracking-widest mb-2">Date</label>
                      <input 
                        id="book-date"
                        type="date" 
                        required
                        value={bookingDate}
                        onChange={(e) => setBookingDate(e.target.value)}
                        className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-none text-sm focus:outline-none focus:border-neutral-950 focus:bg-white transition"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-neutral-700 uppercase tracking-widest mb-2">Time</label>
                      <input 
                        id="book-time"
                        type="time" 
                        required
                        value={bookingTime}
                        onChange={(e) => setBookingTime(e.target.value)}
                        className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-none text-sm focus:outline-none focus:border-neutral-950 focus:bg-white transition"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-neutral-700 uppercase tracking-widest mb-2">Guests</label>
                      <select 
                        id="book-guests"
                        value={bookingGuests}
                        onChange={(e) => setBookingGuests(Number(e.target.value))}
                        className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-none text-sm focus:outline-none focus:border-neutral-950 focus:bg-white transition"
                      >
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
                          <option key={n} value={n}>{n} {n === 1 ? 'Guest' : 'Guests'}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-neutral-700 uppercase tracking-widest mb-2">Special Request (Optional)</label>
                    <textarea 
                      id="book-notes"
                      rows={2}
                      value={bookingNotes}
                      onChange={(e) => setBookingNotes(e.target.value)}
                      placeholder="High chair, dietary request, specific table..."
                      className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-none text-sm focus:outline-none focus:border-neutral-950 focus:bg-white transition"
                    ></textarea>
                  </div>

                  <button 
                    id="submit-booking-btn"
                    type="submit"
                    disabled={isBooking}
                    className={`w-full py-4 rounded-none font-black text-xs uppercase tracking-widest transition-colors ${theme.bg} text-white disabled:opacity-50`}
                  >
                    {isBooking ? 'Booking...' : 'Confirm Table Booking'}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Reviews Section */}
      <section id="reviews" className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Add Review Form */}
          <div className="bg-white rounded-2xl border border-neutral-100 shadow-sm p-6">
            <h4 className="font-serif text-xl font-bold text-neutral-950 mb-2">Share Your Experience</h4>
            <p className="text-neutral-500 text-sm mb-6">Your honest feedback keeps our kitchen fires burning bright.</p>

            <form onSubmit={handleAddReview} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-700 uppercase mb-2">Your Name</label>
                <input 
                  id="review-name"
                  type="text" 
                  required
                  value={newReviewName}
                  onChange={(e) => setNewReviewName(e.target.value)}
                  placeholder="e.g. Rachel Green"
                  className="w-full px-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:border-neutral-400 focus:bg-white transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 uppercase mb-2">Rating</label>
                <div className="flex gap-1.5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      id={`star-btn-${star}`}
                      onClick={() => setNewReviewRating(star)}
                      className="text-amber-400 hover:scale-110 transition"
                    >
                      <Star fill={star <= newReviewRating ? 'currentColor' : 'none'} size={24} />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 uppercase mb-2">Review</label>
                <textarea 
                  id="review-text"
                  required
                  rows={3}
                  value={newReviewText}
                  onChange={(e) => setNewReviewText(e.target.value)}
                  placeholder="What did you order? How did it taste?"
                  className="w-full px-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:border-neutral-400 focus:bg-white transition"
                ></textarea>
              </div>

              <button 
                id="submit-review-btn"
                type="submit"
                className={`w-full py-3 rounded-xl text-white font-semibold text-sm transition ${theme.bg}`}
              >
                Submit Review
              </button>
            </form>
          </div>

          {/* Reviews List */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex justify-between items-end mb-4">
              <div>
                <h4 className="font-serif text-2xl font-bold text-neutral-950">Guest Guestbook</h4>
                <p className="text-neutral-500 text-sm">See what other patrons are raving about.</p>
              </div>
              <div className="flex items-center gap-1.5 text-amber-500">
                <Star fill="currentColor" size={20} />
                <span className="font-bold text-neutral-950 text-lg">4.9</span>
                <span className="text-neutral-400 text-sm">/ 5.0 rating</span>
              </div>
            </div>

            <div className="space-y-4 max-h-[420px] overflow-y-auto pr-2">
              {reviews.map((r, idx) => (
                <div key={idx} className="bg-white rounded-2xl border border-neutral-100 shadow-xs p-5">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h5 className="font-semibold text-neutral-900">{r.name}</h5>
                      <div className="flex gap-0.5 text-amber-400 mt-0.5">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star key={i} fill={i < r.rating ? 'currentColor' : 'none'} size={14} />
                        ))}
                      </div>
                    </div>
                    <span className="text-xs text-neutral-400">{r.date}</span>
                  </div>
                  <p className="text-neutral-600 text-sm leading-relaxed">{r.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Map, About & Contact Section */}
      <section id="contact" className="py-20 bg-white border-t border-neutral-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Info Side */}
          <div className="lg:col-span-5 space-y-8">
            <div>
              <span className={`inline-block px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider mb-4 ${theme.bgLight} ${theme.text}`}>
                Visit Us
              </span>
              <h3 className="font-serif text-3xl font-bold text-neutral-950 mb-4">Bistro Flow Dining</h3>
              <p className="text-neutral-500 leading-relaxed text-sm">
                Established with a vision to deliver unmatched culinary excellence. We welcome you to experience high-gastronomy dishes, custom desserts, and hand-selected wines curated by local culinary masters.
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex gap-4">
                <div className={`p-3 rounded-xl bg-neutral-100 ${theme.text}`}>
                  <MapPin size={20} />
                </div>
                <div>
                  <h5 className="text-sm font-bold text-neutral-900 mb-0.5">Our Location</h5>
                  <p className="text-neutral-500 text-sm">{settings.location}</p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className={`p-3 rounded-xl bg-neutral-100 ${theme.text}`}>
                  <Clock size={20} />
                </div>
                <div>
                  <h5 className="text-sm font-bold text-neutral-900 mb-0.5">Business Hours</h5>
                  <p className="text-neutral-500 text-sm">{settings.businessHours}</p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className={`p-3 rounded-xl bg-neutral-100 ${theme.text}`}>
                  <MessageSquare size={20} />
                </div>
                <div>
                  <h5 className="text-sm font-bold text-neutral-900 mb-0.5">Inquiries & Support</h5>
                  <p className="text-neutral-500 text-sm">{settings.email}</p>
                  <p className="text-neutral-500 text-sm font-medium mt-0.5">{settings.whatsappNumber}</p>
                </div>
              </div>
            </div>

            <div className="pt-4 flex items-center gap-4">
              {settings.socialLinks?.instagram && (
                <a href={settings.socialLinks.instagram} target="_blank" rel="noreferrer" className="p-2.5 rounded-full bg-neutral-100 hover:bg-neutral-200 text-neutral-700">
                  <Instagram size={18} />
                </a>
              )}
              {settings.socialLinks?.facebook && (
                <a href={settings.socialLinks.facebook} target="_blank" rel="noreferrer" className="p-2.5 rounded-full bg-neutral-100 hover:bg-neutral-200 text-neutral-700">
                  <Facebook size={18} />
                </a>
              )}
              {settings.socialLinks?.twitter && (
                <a href={settings.socialLinks.twitter} target="_blank" rel="noreferrer" className="p-2.5 rounded-full bg-neutral-100 hover:bg-neutral-200 text-neutral-700">
                  <Twitter size={18} />
                </a>
              )}
            </div>
          </div>

          {/* Map Side */}
          <div className="lg:col-span-7 h-[400px] rounded-3xl overflow-hidden border border-neutral-100 shadow-sm bg-neutral-100">
            <iframe 
              src={settings.googleMapUrl} 
              width="100%" 
              height="100%" 
              style={{ border: 0 }} 
              allowFullScreen={false} 
              loading="lazy"
              title="Google Map Location"
            ></iframe>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-neutral-950 text-neutral-400 py-12 border-t border-neutral-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center sm:text-left flex flex-col sm:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <div className={`p-1.5 rounded-lg ${theme.bgLight} ${theme.text}`}>
              <Utensils size={18} />
            </div>
            <span className="font-serif text-lg font-bold text-white">{settings.restaurantName}</span>
          </div>
          <p className="text-xs text-neutral-500">© 2026 {settings.restaurantName} - MenuFlow AI Applet. All rights reserved.</p>
        </div>
      </footer>

      {/* Cart Sidebar Modal Drawer */}
      <AnimatePresence>
        {cartOpen && (
          <div className="fixed inset-0 z-50 overflow-hidden">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-xs" onClick={() => setCartOpen(false)} />

            <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
              <motion.div 
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="w-screen max-w-md bg-white shadow-2xl flex flex-col h-full"
              >
                {/* Header */}
                <div className="px-6 py-5 border-b border-neutral-100 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <ShoppingBag className={theme.text} size={20} />
                    <h4 className="font-bold text-neutral-950">Your Cart</h4>
                  </div>
                  <button 
                    onClick={() => setCartOpen(false)}
                    className="p-2 rounded-full hover:bg-neutral-100 text-neutral-400 hover:text-neutral-600"
                  >
                    <X size={20} />
                  </button>
                </div>

                {/* Cart list items */}
                <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
                  {cart.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center">
                      <ShoppingBag className="text-neutral-300 mb-4" size={48} />
                      <h5 className="font-semibold text-neutral-800 mb-1">Your cart is empty</h5>
                      <p className="text-neutral-400 text-sm max-w-[200px]">Add gourmet dishes to get started.</p>
                    </div>
                  ) : (
                    <>
                      <div className="space-y-4">
                        {cart.map((item) => (
                          <div key={item.id} className="flex items-center justify-between border-b border-neutral-100 pb-4">
                            <div className="flex-1 pr-4">
                              <h5 className="font-semibold text-neutral-900 text-sm">{item.name}</h5>
                              <p className="text-xs text-neutral-500 font-mono mt-0.5">${item.price.toFixed(2)} each</p>
                            </div>
                            <div className="flex items-center gap-3">
                              <button 
                                onClick={() => updateCartQuantity(item.id, -1)}
                                className="w-7 h-7 bg-neutral-100 hover:bg-neutral-200 rounded-full flex items-center justify-center text-neutral-600 transition"
                              >
                                <Minus size={12} />
                              </button>
                              <span className="font-semibold text-sm w-4 text-center text-neutral-900">{item.quantity}</span>
                              <button 
                                onClick={() => updateCartQuantity(item.id, 1)}
                                className="w-7 h-7 bg-neutral-100 hover:bg-neutral-200 rounded-full flex items-center justify-center text-neutral-600 transition"
                              >
                                <Plus size={12} />
                              </button>
                            </div>
                            <div className="text-right pl-4 min-w-[70px]">
                              <span className="font-mono font-bold text-sm text-neutral-950">${(item.price * item.quantity).toFixed(2)}</span>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Customer Checkout Form */}
                      <div className="border-t border-neutral-100 pt-6 space-y-4">
                        <h5 className="font-bold text-neutral-900 text-sm">Delivery & Checkout Details</h5>
                        <div className="space-y-3">
                          <div>
                            <label className="block text-[10px] font-bold text-neutral-700 uppercase mb-1.5">Your Name</label>
                            <input 
                              id="checkout-name"
                              type="text" 
                              required
                              value={customerName}
                              onChange={(e) => setCustomerName(e.target.value)}
                              placeholder="Rachel Green"
                              className="w-full px-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:border-neutral-400 focus:bg-white transition"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-neutral-700 uppercase mb-1.5">Phone Number</label>
                            <input 
                              id="checkout-phone"
                              type="tel" 
                              required
                              value={customerPhone}
                              onChange={(e) => setCustomerPhone(e.target.value)}
                              placeholder="e.g. +91 98765 43210"
                              className="w-full px-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:border-neutral-400 focus:bg-white transition"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-neutral-700 uppercase mb-1.5">Special Instructions (Optional)</label>
                            <textarea 
                              id="checkout-notes"
                              rows={2}
                              value={checkoutNotes}
                              onChange={(e) => setCheckoutNotes(e.target.value)}
                              placeholder="Cutlery requests, allergen details, doorbell instructions..."
                              className="w-full px-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:border-neutral-400 focus:bg-white transition"
                            ></textarea>
                          </div>
                        </div>
                      </div>

                      {/* Promo Code Input */}
                      <div className="border-t border-neutral-100 pt-6">
                        <label className="block text-[10px] font-bold text-neutral-700 uppercase mb-1.5">Promo Coupon Code</label>
                        <div className="flex gap-2">
                          <input 
                            id="promo-code-input"
                            type="text" 
                            placeholder="e.g. WELCOME10" 
                            value={promoCode}
                            onChange={(e) => setPromoCode(e.target.value)}
                            className="flex-1 px-4 py-2 bg-neutral-50 border border-neutral-200 rounded-xl text-sm font-mono uppercase focus:outline-none"
                          />
                          <button
                            id="apply-promo-btn"
                            type="button"
                            onClick={handleApplyPromo}
                            className={`px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl text-sm font-semibold transition`}
                          >
                            Apply
                          </button>
                        </div>
                        {promoError && <p className="text-red-600 text-xs mt-1.5 flex items-center gap-1"><AlertCircle size={12} /> {promoError}</p>}
                        {promoSuccess && <p className="text-emerald-600 text-xs mt-1.5 flex items-center gap-1"><Check size={12} /> {promoSuccess}</p>}
                      </div>
                    </>
                  )}
                </div>

                {/* Checkout Actions */}
                {cart.length > 0 && (
                  <div className="px-6 py-6 border-t border-neutral-100 bg-neutral-50 space-y-4">
                    <div className="space-y-2.5 text-sm">
                      <div className="flex justify-between text-neutral-600">
                        <span>Subtotal</span>
                        <span className="font-mono">${subtotal.toFixed(2)}</span>
                      </div>
                      {activeDiscount && (
                        <div className="flex justify-between text-emerald-600 font-medium">
                          <span>Discount ({activeDiscount.code})</span>
                          <span className="font-mono">-${discountAmount.toFixed(2)}</span>
                        </div>
                      )}
                      <div className="flex justify-between text-neutral-950 font-bold text-base border-t border-neutral-200/50 pt-2.5">
                        <span>Total Amount</span>
                        <span className="font-mono text-lg">${total.toFixed(2)}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-2.5 pt-2">
                      <button 
                        id="whatsapp-checkout-btn"
                        onClick={handleWhatsAppCheckout}
                        disabled={isPlacingOrder}
                        className="w-full py-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm transition flex items-center justify-center gap-2 shadow-sm"
                      >
                        <MessageSquare size={18} /> Order via WhatsApp
                      </button>
                      <button 
                        id="direct-checkout-btn"
                        onClick={handleDirectCheckout}
                        disabled={isPlacingOrder}
                        className={`w-full py-4 rounded-xl text-white font-semibold text-sm transition ${theme.bg} shadow-md`}
                      >
                        {isPlacingOrder ? 'Processing...' : 'Place Direct Order'}
                      </button>
                    </div>
                  </div>
                )}
              </motion.div>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* Order Success Screen Dialog overlay */}
      <AnimatePresence>
        {orderSuccess && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={() => setOrderSuccess(null)} />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-3xl p-8 max-w-md w-full relative z-10 shadow-2xl text-center"
            >
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <Check size={32} />
              </div>

              <h4 className="font-serif text-2xl font-bold text-neutral-950 mb-2">Order Confirmed!</h4>
              <p className="text-neutral-500 text-sm mb-6 leading-relaxed">
                Thank you, {orderSuccess.customerName}. Your order <strong className="text-neutral-950 font-mono">#{orderSuccess.id}</strong> has been received and sent directly to our kitchen. 
                {orderSuccess.orderType === 'whatsapp' ? ' We also opened a WhatsApp connection for your convenience.' : ''}
              </p>

              <div className="bg-neutral-50 rounded-2xl p-4 mb-8 text-left space-y-2 border border-neutral-100 text-sm">
                <div className="flex justify-between">
                  <span className="text-neutral-500">Order ID:</span>
                  <span className="font-bold font-mono text-neutral-950">#{orderSuccess.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500">Status:</span>
                  <span className="font-bold text-amber-700 capitalize">● Pending Review</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500">Total Amount:</span>
                  <span className="font-bold font-mono text-neutral-950">${orderSuccess.totalAmount.toFixed(2)}</span>
                </div>
              </div>

              <button 
                id="close-success-btn"
                onClick={() => setOrderSuccess(null)}
                className={`w-full py-3.5 rounded-xl text-white font-semibold text-sm transition ${theme.bg}`}
              >
                Continue Browsing
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
