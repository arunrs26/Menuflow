import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Menu as MenuIcon, 
  ListOrdered, 
  BarChart3, 
  Sparkles, 
  Settings as SettingsIcon, 
  HelpCircle, 
  Plus, 
  Edit2, 
  Trash2, 
  Check, 
  X, 
  Clock, 
  TrendingUp, 
  Users as UsersIcon, 
  DollarSign, 
  Search, 
  MapPin, 
  FileText, 
  Percent, 
  Globe, 
  Volume2, 
  Calendar as CalendarIcon, 
  Smartphone, 
  MessageSquare,
  AlertTriangle,
  RotateCcw,
  BookOpen,
  Image as ImageIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { MenuItem, Order, Reservation, Offer, RestaurantSettings } from '../types';

interface AdminTerminalProps {
  settings: RestaurantSettings;
  menu: MenuItem[];
  orders: Order[];
  reservations: Reservation[];
  offers: Offer[];
  onUpdateSettings: (settings: Partial<RestaurantSettings>) => Promise<void>;
  onSaveMenuItem: (item: MenuItem) => Promise<void>;
  onDeleteMenuItem: (id: string) => Promise<void>;
  onUpdateOrderStatus: (id: string, status: Order['status']) => Promise<void>;
  onUpdateReservationStatus: (id: string, status: Reservation['status']) => Promise<void>;
  onSaveOffer: (offer: Offer) => Promise<void>;
  onSwitchToCustomer: () => void;
}

type AdminTab = 'dashboard' | 'menu' | 'orders' | 'analytics' | 'ai-assistant' | 'offers' | 'reservations' | 'settings';

export default function AdminTerminal({
  settings,
  menu,
  orders,
  reservations,
  offers,
  onUpdateSettings,
  onSaveMenuItem,
  onDeleteMenuItem,
  onUpdateOrderStatus,
  onUpdateReservationStatus,
  onSaveOffer,
  onSwitchToCustomer
}: AdminTerminalProps) {
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');

  // MODALS STATE
  const [menuModalOpen, setMenuModalOpen] = useState(false);
  const [selectedMenuItem, setSelectedMenuItem] = useState<MenuItem | null>(null);

  const [offerModalOpen, setOfferModalOpen] = useState(false);
  const [selectedOffer, setSelectedOffer] = useState<Offer | null>(null);

  // SEARCH AND FILTERS
  const [menuSearch, setMenuSearch] = useState('');
  const [menuFilterCategory, setMenuFilterCategory] = useState('All');

  // AI ASSISTANT VIEW LOCAL STATE
  const [aiDishName, setAiDishName] = useState('Truffle Risotto');
  const [aiIngredients, setAiIngredients] = useState('Braised Short Ribs, truffle polenta, roasted root vegetables');
  const [aiTone, setAiTone] = useState('Sophisticated');
  const [aiLength, setAiLength] = useState('Standard');
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiResult, setAiResult] = useState('');
  const [aiSeoKeywords, setAiSeoKeywords] = useState<string[]>(['#truffle_polenta', '#braised_ribs', '#fine_dining', '#comfort_food']);
  const [aiSeoScore, setAiSeoScore] = useState(92);
  const [aiTranslateTarget, setAiTranslateTarget] = useState('ES');
  const [aiTranslateResult, setAiTranslateResult] = useState<{ name: string; description: string } | null>(null);

  // SETTINGS FORM STATE
  const [settingsName, setSettingsName] = useState(settings.restaurantName);
  const [settingsTagline, setSettingsTagline] = useState(settings.tagline);
  const [settingsLogo, setSettingsLogo] = useState(settings.logoUrl);
  const [settingsTheme, setSettingsTheme] = useState(settings.themeColor);
  const [settingsHours, setSettingsHours] = useState(settings.businessHours);
  const [settingsWhatsApp, setSettingsWhatsApp] = useState(settings.whatsappNumber);
  const [settingsEmail, setSettingsEmail] = useState(settings.email);
  const [settingsLocation, setSettingsLocation] = useState(settings.location);
  const [settingsMapUrl, setSettingsMapUrl] = useState(settings.googleMapUrl);
  const [settingsBanner, setSettingsBanner] = useState(settings.bannerImage || '');
  const [settingsSaving, setSettingsSaving] = useState(false);

  // MENU FORM STATE
  const [menuFormName, setMenuFormName] = useState('');
  const [menuFormPrice, setMenuFormPrice] = useState(0);
  const [menuFormDesc, setMenuFormDesc] = useState('');
  const [menuFormCategory, setMenuFormCategory] = useState('Starters');
  const [menuFormImage, setMenuFormImage] = useState('');
  const [menuFormVeg, setMenuFormVeg] = useState(true);
  const [menuFormAvailable, setMenuFormAvailable] = useState(true);

  // OFFER FORM STATE
  const [offerFormCode, setOfferFormCode] = useState('');
  const [offerFormPercent, setOfferFormPercent] = useState(10);
  const [offerFormDesc, setOfferFormDesc] = useState('');
  const [offerFormActive, setOfferFormActive] = useState(true);

  // Synchronize Settings Form when main settings change
  useEffect(() => {
    setSettingsName(settings.restaurantName);
    setSettingsTagline(settings.tagline);
    setSettingsLogo(settings.logoUrl);
    setSettingsTheme(settings.themeColor);
    setSettingsHours(settings.businessHours);
    setSettingsWhatsApp(settings.whatsappNumber);
    setSettingsEmail(settings.email);
    setSettingsLocation(settings.location);
    setSettingsMapUrl(settings.googleMapUrl);
    setSettingsBanner(settings.bannerImage || '');
  }, [settings]);

  // Open Menu Modal in Add vs Edit
  const openMenuModal = (item: MenuItem | null = null) => {
    if (item) {
      setSelectedMenuItem(item);
      setMenuFormName(item.name);
      setMenuFormPrice(item.price);
      setMenuFormDesc(item.description);
      setMenuFormCategory(item.category);
      setMenuFormImage(item.image);
      setMenuFormVeg(item.isVeg);
      setMenuFormAvailable(item.isAvailable);
    } else {
      setSelectedMenuItem(null);
      setMenuFormName('');
      setMenuFormPrice(10);
      setMenuFormDesc('');
      setMenuFormCategory('Starters');
      setMenuFormImage('https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600');
      setMenuFormVeg(true);
      setMenuFormAvailable(true);
    }
    setMenuModalOpen(true);
  };

  const handleSaveMenuItemSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const itemData: MenuItem = {
      id: selectedMenuItem ? selectedMenuItem.id : '',
      name: menuFormName,
      price: Number(menuFormPrice),
      description: menuFormDesc,
      category: menuFormCategory,
      image: menuFormImage,
      isVeg: menuFormVeg,
      isAvailable: menuFormAvailable
    };

    await onSaveMenuItem(itemData);
    setMenuModalOpen(false);
  };

  const openOfferModal = (offer: Offer | null = null) => {
    if (offer) {
      setSelectedOffer(offer);
      setOfferFormCode(offer.code);
      setOfferFormPercent(offer.discountPercent);
      setOfferFormDesc(offer.description);
      setOfferFormActive(offer.isActive);
    } else {
      setSelectedOffer(null);
      setOfferFormCode('');
      setOfferFormPercent(15);
      setOfferFormDesc('');
      setOfferFormActive(true);
    }
    setOfferModalOpen(true);
  };

  const handleSaveOfferSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSaveOffer({
      code: offerFormCode.toUpperCase(),
      discountPercent: Number(offerFormPercent),
      description: offerFormDesc,
      isActive: offerFormActive
    });
    setOfferModalOpen(false);
  };

  const handleSaveSettingsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSettingsSaving(true);
    await onUpdateSettings({
      restaurantName: settingsName,
      tagline: settingsTagline,
      logoUrl: settingsLogo,
      themeColor: settingsTheme,
      businessHours: settingsHours,
      whatsappNumber: settingsWhatsApp,
      email: settingsEmail,
      location: settingsLocation,
      googleMapUrl: settingsMapUrl,
      bannerImage: settingsBanner
    });
    setSettingsSaving(false);
  };

  // AI Description Tool
  const generateAiDescription = async () => {
    setAiGenerating(true);
    try {
      const response = await fetch('/api/ai/describe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: aiDishName,
          ingredients: aiIngredients,
          tone: aiTone,
          length: aiLength
        })
      });
      const data = await response.json();
      setAiResult(data.description || '');

      // Also trigger auto SEO generation for this item
      const seoRes = await fetch('/api/ai/seo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: aiDishName,
          category: 'Chef\'s Specials',
          description: data.description
        })
      });
      const seoData = await seoRes.json();
      if (seoData.keywords) {
        setAiSeoKeywords(seoData.keywords);
        setAiSeoScore(seoData.seoScore);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setAiGenerating(false);
    }
  };

  // AI Translation Tool
  const generateAiTranslation = async () => {
    try {
      const response = await fetch('/api/ai/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: aiDishName,
          description: aiResult || 'Select ingredients and generate a description first.',
          targetLang: aiTranslateTarget
        })
      });
      const data = await response.json();
      setAiTranslateResult({
        name: data.name,
        description: data.description
      });
    } catch (err) {
      console.error(err);
    }
  };

  // KANBAN GROUPING FOR ORDERS
  const pendingOrders = orders.filter(o => o.status === 'pending');
  const preparingOrders = orders.filter(o => o.status === 'preparing');
  const readyOrders = orders.filter(o => o.status === 'ready');

  // STATISTICS CALCULATIONS
  const totalRevenueNum = orders.reduce((acc, o) => o.status !== 'cancelled' ? acc + o.totalAmount : acc, 0) + 24192; // Seeding additional revenue
  const totalOrdersCount = orders.length + 412;
  const visitorsCount = 1284;

  const categoriesList = ['All', ...Array.from(new Set(menu.map(item => item.category)))];

  const filteredMenuItems = menu.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(menuSearch.toLowerCase()) || 
                          item.description.toLowerCase().includes(menuSearch.toLowerCase());
    const matchesCategory = menuFilterCategory === 'All' || item.category === menuFilterCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-neutral-100 flex flex-col md:flex-row text-neutral-800 font-sans">
      
      {/* LEFT SIDEBAR NAVIGATION */}
      <aside className="w-full md:w-64 bg-white border-r border-neutral-200 flex flex-col justify-between shrink-0">
        <div>
          {/* Logo Brand Header */}
          <div className="p-6 border-b border-neutral-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-amber-700 text-white">
                <Sparkles size={20} />
              </div>
              <div>
                <h2 className="font-serif text-lg font-bold text-neutral-950">MenuFlow AI</h2>
                <p className="text-[10px] text-neutral-500 tracking-wider uppercase">Admin Terminal</p>
              </div>
            </div>
          </div>

          {/* Navigation Items */}
          <nav className="p-4 space-y-1">
            <button
              id="nav-dashboard"
              onClick={() => setActiveTab('dashboard')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition ${
                activeTab === 'dashboard' 
                  ? 'bg-amber-700/10 text-amber-900' 
                  : 'text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900'
              }`}
            >
              <LayoutDashboard size={18} /> Dashboard
            </button>
            <button
              id="nav-menu"
              onClick={() => setActiveTab('menu')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition ${
                activeTab === 'menu' 
                  ? 'bg-amber-700/10 text-amber-900' 
                  : 'text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900'
              }`}
            >
              <MenuIcon size={18} /> Menu Management
            </button>
            <button
              id="nav-orders"
              onClick={() => setActiveTab('orders')}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-semibold transition ${
                activeTab === 'orders' 
                  ? 'bg-amber-700/10 text-amber-900' 
                  : 'text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900'
              }`}
            >
              <span className="flex items-center gap-3"><ListOrdered size={18} /> Live Orders</span>
              {pendingOrders.length > 0 && (
                <span className="w-5 h-5 rounded-full bg-red-600 text-white text-[10px] font-bold flex items-center justify-center animate-pulse">
                  {pendingOrders.length}
                </span>
              )}
            </button>
            <button
              id="nav-analytics"
              onClick={() => setActiveTab('analytics')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition ${
                activeTab === 'analytics' 
                  ? 'bg-amber-700/10 text-amber-900' 
                  : 'text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900'
              }`}
            >
              <BarChart3 size={18} /> Analytics
            </button>
            <button
              id="nav-ai-assistant"
              onClick={() => setActiveTab('ai-assistant')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition ${
                activeTab === 'ai-assistant' 
                  ? 'bg-amber-700/10 text-amber-900 shadow-xs' 
                  : 'text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900'
              }`}
            >
              <Sparkles size={18} className="text-amber-700" /> AI Assistant
            </button>
            <button
              id="nav-offers"
              onClick={() => setActiveTab('offers')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition ${
                activeTab === 'offers' 
                  ? 'bg-amber-700/10 text-amber-900' 
                  : 'text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900'
              }`}
            >
              <Percent size={18} /> Coupons & Offers
            </button>
            <button
              id="nav-reservations"
              onClick={() => setActiveTab('reservations')}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-semibold transition ${
                activeTab === 'reservations' 
                  ? 'bg-amber-700/10 text-amber-900' 
                  : 'text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900'
              }`}
            >
              <span className="flex items-center gap-3"><CalendarIcon size={18} /> Bookings</span>
              {reservations.filter(r => r.status === 'pending').length > 0 && (
                <span className="w-5 h-5 rounded-full bg-amber-600 text-white text-[10px] font-bold flex items-center justify-center">
                  {reservations.filter(r => r.status === 'pending').length}
                </span>
              )}
            </button>
            <button
              id="nav-settings"
              onClick={() => setActiveTab('settings')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition ${
                activeTab === 'settings' 
                  ? 'bg-amber-700/10 text-amber-900' 
                  : 'text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900'
              }`}
            >
              <SettingsIcon size={18} /> Settings
            </button>
          </nav>
        </div>

        {/* User Card & Switch to Live Website */}
        <div className="p-4 border-t border-neutral-100 bg-neutral-50 space-y-3">
          <div className="flex items-center gap-3 px-2">
            <div className="w-9 h-9 rounded-full bg-neutral-200 flex items-center justify-center font-bold text-neutral-700 text-sm border border-white">
              AR
            </div>
            <div>
              <h4 className="text-xs font-bold text-neutral-950">Alex Rossi</h4>
              <p className="text-[10px] text-neutral-500 font-semibold">Restaurant Owner</p>
            </div>
          </div>
          
          <button
            id="switch-to-customer-btn"
            onClick={onSwitchToCustomer}
            className="w-full py-2.5 rounded-xl border border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-800 text-xs font-bold shadow-xs transition flex items-center justify-center gap-2"
          >
            <Globe size={14} /> View Live Site
          </button>
        </div>
      </aside>

      {/* MAIN VIEWPORT PANELS */}
      <main className="flex-1 overflow-y-auto p-8 max-w-7xl mx-auto w-full">
        
        {/* TAB 1: DASHBOARD */}
        {activeTab === 'dashboard' && (
          <div className="space-y-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h3 className="font-serif text-3xl font-bold text-neutral-950">Dashboard</h3>
                <p className="text-neutral-500 text-sm">Welcome back, Alex. Here is a brief look at today\'s operations.</p>
              </div>
              <button 
                id="add-new-dish-shortcut"
                onClick={() => { setActiveTab('menu'); openMenuModal(); }}
                className="px-5 py-3 rounded-xl bg-amber-700 hover:bg-amber-800 text-white font-semibold text-sm transition flex items-center gap-2 shadow-md"
              >
                <Plus size={16} /> New Menu Item
              </button>
            </div>

            {/* Metrics Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white rounded-2xl border border-neutral-200/60 p-6 flex items-center justify-between shadow-xs">
                <div>
                  <p className="text-neutral-500 text-xs font-semibold uppercase tracking-wider mb-2">Today's Visitors</p>
                  <h4 className="text-3xl font-bold text-neutral-950">1,284</h4>
                  <span className="inline-flex items-center text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md mt-1.5">+12% vs last week</span>
                </div>
                <div className="p-4 rounded-xl bg-neutral-50 text-neutral-500">
                  <UsersIcon size={24} />
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-neutral-200/60 p-6 flex items-center justify-between shadow-xs">
                <div>
                  <p className="text-neutral-500 text-xs font-semibold uppercase tracking-wider mb-2">Total Orders</p>
                  <h4 className="text-3xl font-bold text-neutral-950">{totalOrdersCount}</h4>
                  <span className="inline-flex items-center text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md mt-1.5">+5% vs last week</span>
                </div>
                <div className="p-4 rounded-xl bg-neutral-50 text-neutral-500">
                  <ListOrdered size={24} />
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-neutral-200/60 p-6 flex items-center justify-between shadow-xs">
                <div>
                  <p className="text-neutral-500 text-xs font-semibold uppercase tracking-wider mb-2">Total Revenue</p>
                  <h4 className="text-3xl font-bold text-neutral-950">${totalRevenueNum.toLocaleString()}</h4>
                  <span className="inline-flex items-center text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md mt-1.5">+18% vs last week</span>
                </div>
                <div className="p-4 rounded-xl bg-neutral-50 text-neutral-500">
                  <DollarSign size={24} />
                </div>
              </div>

              <div className="bg-amber-700 rounded-2xl p-6 text-white flex items-center justify-between shadow-md">
                <div>
                  <p className="text-white/70 text-xs font-semibold uppercase tracking-wider mb-2">Popular Dish</p>
                  <h4 className="text-xl font-bold leading-tight">Truffle Tagliatelle</h4>
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-200 mt-1.5">★ 84 orders today</span>
                </div>
                <div className="p-4 rounded-xl bg-white/10 text-amber-200">
                  <Sparkles size={24} />
                </div>
              </div>
            </div>

            {/* Chart Section and AI Insight Column */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Curve Line Chart */}
              <div className="bg-white rounded-2xl border border-neutral-200/60 p-6 lg:col-span-2 shadow-xs">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h4 className="font-serif text-lg font-bold text-neutral-950">Order Trends</h4>
                    <p className="text-neutral-500 text-xs">Hourly breakdown of incoming orders today</p>
                  </div>
                  <div className="bg-neutral-100 rounded-lg p-1 flex gap-1 text-xs font-semibold">
                    <button className="bg-white px-3 py-1 rounded-md text-neutral-800 shadow-xs">Today</button>
                    <button className="px-3 py-1 text-neutral-500">Week</button>
                  </div>
                </div>

                <div className="h-64 relative mt-4">
                  {/* Curved Trend SVG Line */}
                  <svg viewBox="0 0 600 200" className="w-full h-full text-amber-700">
                    <defs>
                      <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="rgba(180, 83, 9, 0.25)" />
                        <stop offset="100%" stopColor="rgba(180, 83, 9, 0.0)" />
                      </linearGradient>
                    </defs>
                    {/* Grid Lines */}
                    <line x1="0" y1="150" x2="600" y2="150" stroke="#f3f4f6" strokeWidth="1" />
                    <line x1="0" y1="100" x2="600" y2="100" stroke="#f3f4f6" strokeWidth="1" />
                    <line x1="0" y1="50" x2="600" y2="50" stroke="#f3f4f6" strokeWidth="1" />

                    {/* Chart Gradient Path Area */}
                    <path 
                      d="M 0 140 C 100 120, 150 110, 200 90 C 250 70, 300 120, 350 130 C 400 140, 450 40, 500 40 C 550 40, 570 80, 600 110 L 600 200 L 0 200 Z" 
                      fill="url(#chartGradient)" 
                    />
                    {/* Chart Line Path */}
                    <path 
                      d="M 0 140 C 100 120, 150 110, 200 90 C 250 70, 300 120, 350 130 C 400 140, 450 40, 500 40 C 550 40, 570 80, 600 110" 
                      fill="none" 
                      stroke="currentColor" 
                      strokeWidth="3.5" 
                      strokeLinecap="round"
                    />
                    
                    {/* Highlight Dot for Peak */}
                    <circle cx="500" cy="40" r="5" fill="currentColor" stroke="#fff" strokeWidth="2.5" />
                  </svg>
                  
                  {/* Time stamps */}
                  <div className="flex justify-between text-[10px] text-neutral-400 font-mono mt-4 border-t border-neutral-100 pt-3">
                    <span>08:00 AM</span>
                    <span>10:00 AM</span>
                    <span>12:00 PM</span>
                    <span>02:00 PM</span>
                    <span>04:00 PM</span>
                    <span>06:00 PM (Peak: 124 Orders)</span>
                    <span>08:00 PM</span>
                  </div>
                </div>
              </div>

              {/* AI Insight Sidebar */}
              <div className="bg-neutral-900 text-white rounded-2xl p-6 flex flex-col justify-between shadow-lg relative overflow-hidden">
                <div className="absolute top-0 right-0 opacity-10 pointer-events-none">
                  <Sparkles size={160} />
                </div>
                
                <div>
                  <div className="flex items-center gap-2 text-amber-400 font-semibold text-xs tracking-wider uppercase mb-4">
                    <Sparkles size={14} /> AI Recommendation
                  </div>
                  <h4 className="font-serif text-lg font-bold mb-3">Optimize Pizza Sales</h4>
                  <p className="text-neutral-300 text-sm leading-relaxed">
                    "Orders for <strong className="text-white">Artisanal Pizzas</strong> are up 40% compared to last Thursday. Consider featuring the 'Margherita Supreme' on your mobile homepage to capitalize on the trend."
                  </p>
                </div>

                <div className="border-t border-neutral-800 pt-6 mt-6">
                  <button 
                    onClick={() => setActiveTab('ai-assistant')}
                    className="text-amber-400 hover:text-amber-300 text-xs font-bold flex items-center gap-1 transition"
                  >
                    Launch AI Marketing tools →
                  </button>
                </div>
              </div>
            </div>

            {/* Recent Orders List Table */}
            <div className="bg-white rounded-2xl border border-neutral-200/60 shadow-xs p-6">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h4 className="font-serif text-lg font-bold text-neutral-950">Recent Live Transactions</h4>
                  <p className="text-neutral-500 text-xs">Real-time update of customer ordering and checkout actions</p>
                </div>
                <button 
                  onClick={() => setActiveTab('orders')}
                  className="text-xs font-bold text-amber-700 hover:text-amber-800"
                >
                  View live feed ({pendingOrders.length} pending)
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-neutral-100 text-neutral-400 text-xs font-semibold uppercase tracking-wider pb-3">
                      <th className="py-3 px-4">Order ID</th>
                      <th className="py-3 px-4">Customer</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Items</th>
                      <th className="py-3 px-4 text-right">Amount</th>
                      <th className="py-3 px-4 text-right">Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.slice(0, 5).map((order) => (
                      <tr key={order.id} className="border-b border-neutral-100 last:border-0 hover:bg-neutral-50 transition">
                        <td className="py-4 px-4 font-mono font-bold text-neutral-950">#{order.id}</td>
                        <td className="py-4 px-4 font-semibold text-neutral-800">{order.customerName}</td>
                        <td className="py-4 px-4">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                            order.status === 'pending' ? 'bg-amber-100 text-amber-800' :
                            order.status === 'preparing' ? 'bg-blue-100 text-blue-800' :
                            order.status === 'ready' ? 'bg-green-100 text-green-800' : 'bg-neutral-100 text-neutral-600'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${
                              order.status === 'pending' ? 'bg-amber-600' :
                              order.status === 'preparing' ? 'bg-blue-600' :
                              order.status === 'ready' ? 'bg-green-600' : 'bg-neutral-500'
                            }`}></span>
                            {order.status}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-xs text-neutral-500 font-medium">
                          {order.items.map(i => `${i.name} (x${i.quantity})`).join(', ')}
                        </td>
                        <td className="py-4 px-4 font-mono font-bold text-right text-neutral-950">${order.totalAmount.toFixed(2)}</td>
                        <td className="py-4 px-4 text-right text-neutral-400 font-mono text-xs">{new Date(order.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: MENU MANAGEMENT */}
        {activeTab === 'menu' && (
          <div className="space-y-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h3 className="font-serif text-3xl font-bold text-neutral-950">Menu Management</h3>
                <p className="text-neutral-500 text-sm">Create, edit, toggle availability, or delete your restaurant's recipes.</p>
              </div>
              <button 
                id="add-item-btn"
                onClick={() => openMenuModal()}
                className="px-5 py-3 rounded-xl bg-amber-700 hover:bg-amber-800 text-white font-semibold text-sm transition flex items-center gap-2 shadow-md"
              >
                <Plus size={16} /> Add Menu Item
              </button>
            </div>

            {/* Filter Bar */}
            <div className="bg-white rounded-2xl border border-neutral-200/60 p-5 shadow-xs flex flex-col md:flex-row gap-4 items-center justify-between">
              <div className="relative flex-1 w-full">
                <Search className="absolute left-4 top-3 text-neutral-400" size={16} />
                <input 
                  id="admin-menu-search"
                  type="text" 
                  placeholder="Search savory dishes, drinks, appetizers..." 
                  value={menuSearch}
                  onChange={(e) => setMenuSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-xs focus:outline-none focus:border-neutral-400 focus:bg-white transition"
                />
              </div>

              <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto no-scrollbar py-1">
                {categoriesList.map((cat, idx) => (
                  <button
                    key={idx}
                    onClick={() => setMenuFilterCategory(cat)}
                    className={`px-4 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
                      menuFilterCategory === cat 
                        ? 'bg-amber-700 text-white shadow-sm' 
                        : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-700'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Menu Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredMenuItems.map((item) => (
                <div 
                  key={item.id}
                  className="bg-white rounded-2xl border border-neutral-200/60 shadow-xs overflow-hidden flex flex-col justify-between group"
                >
                  {/* Image & Badge */}
                  <div className="h-48 relative bg-neutral-100">
                    <img 
                      src={item.image} 
                      alt={item.name} 
                      className="w-full h-full object-cover group-hover:scale-101 transition duration-500"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute top-3 left-3 flex gap-2">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                        item.isVeg ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${item.isVeg ? 'bg-emerald-600' : 'bg-red-600'}`}></span>
                        {item.isVeg ? 'Veg' : 'Non-Veg'}
                      </span>
                    </div>
                  </div>

                  {/* Body Info */}
                  <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                    <div>
                      <div className="flex justify-between items-start gap-4 mb-2">
                        <h4 className="font-serif text-base font-bold text-neutral-950">{item.name}</h4>
                        <span className="font-mono text-base font-bold text-neutral-950">${item.price.toFixed(2)}</span>
                      </div>
                      <p className="text-neutral-500 text-xs leading-relaxed line-clamp-3">
                        {item.description}
                      </p>
                    </div>

                    {/* Actions and availability switch */}
                    <div className="border-t border-neutral-100 pt-4 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-neutral-500 font-semibold">Available</span>
                        <button
                          id={`toggle-item-${item.id}`}
                          onClick={() => onSaveMenuItem({ ...item, isAvailable: !item.isAvailable })}
                          className={`relative w-10 h-5.5 rounded-full transition-colors ${item.isAvailable ? 'bg-amber-700' : 'bg-neutral-200'}`}
                        >
                          <span className={`absolute top-0.75 left-0.75 bg-white w-4 h-4 rounded-full shadow-sm transition-transform ${item.isAvailable ? 'translate-x-4.5' : ''}`}></span>
                        </button>
                      </div>

                      <div className="flex gap-2">
                        <button
                          id={`edit-item-${item.id}`}
                          onClick={() => openMenuModal(item)}
                          className="p-2 rounded-lg border border-neutral-200 hover:bg-neutral-50 text-neutral-600"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          id={`delete-item-${item.id}`}
                          onClick={() => onDeleteMenuItem(item.id)}
                          className="p-2 rounded-lg border border-red-100 hover:bg-red-50 text-red-600"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: LIVE ORDERS KANBAN */}
        {activeTab === 'orders' && (
          <div className="space-y-8">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-serif text-3xl font-bold text-neutral-950">Live Order Feed</h3>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  <p className="text-xs text-emerald-800 font-bold bg-emerald-50 px-2 py-0.5 rounded-md">Real-time Sync Active</p>
                </div>
              </div>
            </div>

            {/* Kanban Columns Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* Column 1: Pending */}
              <div className="bg-neutral-50/50 rounded-2xl border border-neutral-200 p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-neutral-200/60 pb-3">
                  <h4 className="font-bold text-sm text-neutral-800 flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span> Pending Review
                  </h4>
                  <span className="px-2 py-0.5 bg-amber-100 text-amber-800 text-xs font-bold rounded-full">{pendingOrders.length}</span>
                </div>

                <div className="space-y-4 max-h-[600px] overflow-y-auto pr-1">
                  {pendingOrders.map((order) => {
                    const elapsedMins = Math.floor((Date.now() - new Date(order.timestamp).getTime()) / 60000);
                    const isOverdue = elapsedMins > 15;
                    
                    return (
                      <div key={order.id} className="bg-white rounded-xl border border-neutral-200 p-5 shadow-xs space-y-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="font-mono text-xs font-bold text-neutral-500">Order #{order.id}</span>
                            <h5 className="font-bold text-neutral-900 mt-0.5">{order.customerName}</h5>
                          </div>
                          
                          {/* Timer */}
                          <div className={`px-2 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1.5 ${
                            isOverdue ? 'bg-red-50 text-red-700 border border-red-100' : 'bg-amber-50 text-amber-700 border border-amber-100'
                          }`}>
                            <Clock size={12} />
                            <span>{isOverdue ? `${elapsedMins}m overdue` : `${15 - elapsedMins}m left`}</span>
                          </div>
                        </div>

                        {/* Items ordered list */}
                        <div className="space-y-1.5 text-xs text-neutral-600 border-y border-neutral-100 py-3">
                          {order.items.map((i, idx) => (
                            <p key={idx} className="font-medium">
                              • {i.name} <span className="text-neutral-400 font-bold">(x{i.quantity})</span>
                            </p>
                          ))}
                          {order.notes && (
                            <p className="text-[11px] text-neutral-400 italic mt-2 bg-neutral-50 p-2 rounded-lg border border-neutral-100">
                              Note: "{order.notes}"
                            </p>
                          )}
                        </div>

                        <div className="flex gap-2">
                          <button
                            id={`accept-order-${order.id}`}
                            onClick={() => onUpdateOrderStatus(order.id, 'preparing')}
                            className="flex-1 py-2 rounded-lg bg-amber-700 hover:bg-amber-800 text-white font-bold text-xs shadow-xs transition"
                          >
                            Accept
                          </button>
                          <button
                            id={`cancel-order-${order.id}`}
                            onClick={() => onUpdateOrderStatus(order.id, 'cancelled')}
                            className="px-3 py-2 rounded-lg border border-red-100 hover:bg-red-50 text-red-600 transition"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      </div>
                    );
                  })}

                  {pendingOrders.length === 0 && (
                    <div className="py-12 text-center text-neutral-400 text-xs">
                      No pending orders.
                    </div>
                  )}
                </div>
              </div>

              {/* Column 2: Preparing */}
              <div className="bg-neutral-50/50 rounded-2xl border border-neutral-200 p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-neutral-200/60 pb-3">
                  <h4 className="font-bold text-sm text-neutral-800 flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span> In Preparation
                  </h4>
                  <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-xs font-bold rounded-full">{preparingOrders.length}</span>
                </div>

                <div className="space-y-4 max-h-[600px] overflow-y-auto pr-1">
                  {preparingOrders.map((order) => (
                    <div key={order.id} className="bg-white rounded-xl border border-neutral-200 p-5 shadow-xs space-y-4">
                      <div>
                        <span className="font-mono text-xs font-bold text-neutral-500">Order #{order.id}</span>
                        <h5 className="font-bold text-neutral-900 mt-0.5">{order.customerName}</h5>
                        <p className="text-[10px] text-blue-700 font-bold mt-1 bg-blue-50 px-2 py-0.5 rounded-md inline-block">
                          Station: Main Grill & Sauté
                        </p>
                      </div>

                      {/* Items ordered list */}
                      <div className="space-y-1.5 text-xs text-neutral-600 border-y border-neutral-100 py-3">
                        {order.items.map((i, idx) => (
                          <p key={idx} className="font-medium">
                            • {i.name} <span className="text-neutral-400 font-bold">(x{i.quantity})</span>
                          </p>
                        ))}
                      </div>

                      <button
                        id={`ready-order-${order.id}`}
                        onClick={() => onUpdateOrderStatus(order.id, 'ready')}
                        className="w-full py-2.5 rounded-lg border border-amber-700 hover:bg-amber-700/5 text-amber-900 font-bold text-xs transition"
                      >
                        Mark as Ready
                      </button>
                    </div>
                  ))}

                  {preparingOrders.length === 0 && (
                    <div className="py-12 text-center text-neutral-400 text-xs">
                      No active prep.
                    </div>
                  )}
                </div>
              </div>

              {/* Column 3: Ready for Pickup */}
              <div className="bg-neutral-50/50 rounded-2xl border border-neutral-200 p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-neutral-200/60 pb-3">
                  <h4 className="font-bold text-sm text-neutral-800 flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Ready for Dispatch
                  </h4>
                  <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-full">{readyOrders.length}</span>
                </div>

                <div className="space-y-4 max-h-[600px] overflow-y-auto pr-1">
                  {readyOrders.map((order) => (
                    <div key={order.id} className="bg-white rounded-xl border border-neutral-200 p-5 shadow-xs space-y-4">
                      <div>
                        <div className="flex justify-between items-start">
                          <span className="font-mono text-xs font-bold text-neutral-500">Order #{order.id}</span>
                          <span className="px-2 py-0.5 bg-green-100 text-green-800 text-[10px] font-bold uppercase rounded-md">Ready</span>
                        </div>
                        <h5 className="font-bold text-neutral-900 mt-0.5">{order.customerName}</h5>
                      </div>

                      {/* Pick up locker mockup matching screenshots */}
                      <div className="p-3 bg-red-50 border border-red-100 rounded-xl space-y-1.5 text-xs text-red-800">
                        <div className="flex items-center gap-2 font-bold">
                          <Volume2 size={14} /> Locker Pick-up Bay
                        </div>
                        <p className="text-[11px] text-red-700/95 font-medium">Locker #B-4 | Passcode: <span className="font-mono font-bold text-sm tracking-widest bg-white px-2 py-0.5 rounded-md text-red-950">4921</span></p>
                      </div>

                      {/* Items ordered list */}
                      <div className="space-y-1.5 text-xs text-neutral-600 border-y border-neutral-100 py-3">
                        {order.items.map((i, idx) => (
                          <p key={idx} className="font-medium">
                            • {i.name} <span className="text-neutral-400 font-bold">(x{i.quantity})</span>
                          </p>
                        ))}
                      </div>

                      <button
                        id={`dispatch-order-${order.id}`}
                        onClick={() => onUpdateOrderStatus(order.id, 'delivered')}
                        className="w-full py-2.5 rounded-lg bg-neutral-950 hover:bg-neutral-900 text-white font-bold text-xs shadow-xs transition"
                      >
                        Mark Dispatched
                      </button>
                    </div>
                  ))}

                  {readyOrders.length === 0 && (
                    <div className="py-12 text-center text-neutral-400 text-xs">
                      No ready orders.
                    </div>
                  )}
                </div>
              </div>

            </div>
          </div>
        )}

        {/* TAB 4: ANALYTICS */}
        {activeTab === 'analytics' && (
          <div className="space-y-8">
            <div>
              <h3 className="font-serif text-3xl font-bold text-neutral-950">Analytics</h3>
              <p className="text-neutral-500 text-sm">Deep-dive into visitor, sales, and recipe performance metrics.</p>
            </div>

            {/* Performance charts grid mockup */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-white rounded-2xl border border-neutral-200/60 p-6 shadow-xs">
                <h4 className="font-serif text-base font-bold text-neutral-950 mb-1">Sales by Category</h4>
                <p className="text-neutral-500 text-xs mb-6">Popular food streams</p>
                
                <div className="space-y-4">
                  {[
                    { name: 'Starters & Risottos', pct: 45, val: '$10,886', color: 'bg-amber-700' },
                    { name: 'Main Course Pizzas', pct: 30, val: '$7,257', color: 'bg-orange-500' },
                    { name: 'Chef\'s Specials', pct: 15, val: '$3,628', color: 'bg-red-500' },
                    { name: 'Desserts & Sweets', pct: 10, val: '$2,419', color: 'bg-yellow-500' },
                  ].map((cat, idx) => (
                    <div key={idx} className="space-y-1.5">
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="text-neutral-800">{cat.name}</span>
                        <span className="text-neutral-900 font-mono font-bold">{cat.val} ({cat.pct}%)</span>
                      </div>
                      <div className="w-full h-2.5 bg-neutral-100 rounded-full overflow-hidden">
                        <div className={`h-full ${cat.color}`} style={{ width: `${cat.pct}%` }}></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-neutral-200/60 p-6 shadow-xs">
                <h4 className="font-serif text-base font-bold text-neutral-950 mb-1">Incoming Channels</h4>
                <p className="text-neutral-500 text-xs mb-6">WhatsApp checkout vs Direct onsite submissions</p>
                
                <div className="flex items-center justify-around h-48">
                  <div className="text-center">
                    <span className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-lg mx-auto mb-3">
                      60%
                    </span>
                    <h5 className="font-bold text-neutral-900 text-sm">WhatsApp link</h5>
                    <p className="text-neutral-500 text-xs mt-0.5">Quick social order</p>
                  </div>
                  
                  <div className="w-px h-24 bg-neutral-100"></div>

                  <div className="text-center">
                    <span className="w-16 h-16 rounded-full bg-amber-50 text-amber-800 flex items-center justify-center font-bold text-lg mx-auto mb-3">
                      40%
                    </span>
                    <h5 className="font-bold text-neutral-900 text-sm">Direct Order</h5>
                    <p className="text-neutral-500 text-xs mt-0.5">Live dashboard update</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: AI MENU ASSISTANT */}
        {activeTab === 'ai-assistant' && (
          <div className="space-y-8">
            <div>
              <h3 className="font-serif text-3xl font-bold text-neutral-950 flex items-center gap-2">
                <Sparkles size={26} className="text-amber-700" /> AI Menu Assistant
              </h3>
              <p className="text-neutral-500 text-sm">Use Gemini AI models to draft luxury dish descriptions, generate delivery application SEO tags, and translate menus.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* Left Side: Input Form & Results */}
              <div className="lg:col-span-2 space-y-6">
                <div className="bg-white rounded-2xl border border-neutral-200/60 p-6 shadow-xs space-y-5">
                  <div className="flex items-center gap-2 pb-2 border-b border-neutral-100">
                    <Sparkles size={16} className="text-amber-700" />
                    <h4 className="font-serif text-base font-bold text-neutral-950">Luxury Description Generator</h4>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-neutral-700 mb-2">Dish Name</label>
                      <input 
                        id="ai-dish-name"
                        type="text" 
                        value={aiDishName}
                        onChange={(e) => setAiDishName(e.target.value)}
                        placeholder="e.g. Wagyu Truffle Burger"
                        className="w-full px-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-sm focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-neutral-700 mb-2">Key Ingredients / Keywords</label>
                      <textarea 
                        id="ai-ingredients"
                        rows={2}
                        value={aiIngredients}
                        onChange={(e) => setAiIngredients(e.target.value)}
                        placeholder="e.g. grade A5 Wagyu, black truffle aioli, melted gruyere, brioche bun"
                        className="w-full px-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-sm focus:outline-none"
                      ></textarea>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-neutral-700 mb-2">Writing Tone</label>
                        <select 
                          id="ai-tone"
                          value={aiTone}
                          onChange={(e) => setAiTone(e.target.value)}
                          className="w-full px-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-sm"
                        >
                          <option value="Sophisticated">Sophisticated & Fine Dining</option>
                          <option value="Playful">Playful & Street Food</option>
                          <option value="Casual">Casual & Warm</option>
                          <option value="Minimalist">Minimalist & Direct</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-neutral-700 mb-2">Description Length</label>
                        <select 
                          id="ai-length"
                          value={aiLength}
                          onChange={(e) => setAiLength(e.target.value)}
                          className="w-full px-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-sm"
                        >
                          <option value="Short">Short (under 15 words)</option>
                          <option value="Standard">Standard (25-30 words)</option>
                          <option value="Long">Long (50-60 words)</option>
                        </select>
                      </div>
                    </div>

                    <button
                      id="generate-ai-description-btn"
                      onClick={generateAiDescription}
                      disabled={aiGenerating}
                      className="w-full py-3.5 rounded-xl bg-amber-700 hover:bg-amber-800 text-white font-semibold text-sm transition flex items-center justify-center gap-2 shadow-xs"
                    >
                      <Sparkles size={16} /> {aiGenerating ? 'AI Writing...' : 'Generate Description'}
                    </button>
                  </div>
                </div>

                {/* Description Result Container */}
                {aiResult && (
                  <div className="bg-amber-50 border border-amber-100 rounded-2xl p-6 space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-amber-800 uppercase tracking-wider flex items-center gap-1.5">
                        <Check size={14} /> AI Result Generated
                      </span>
                      <button
                        onClick={() => {
                          // Copy to clipboard or set directly to current item
                          navigator.clipboard.writeText(aiResult);
                          alert('Copied to clipboard!');
                        }}
                        className="text-xs font-bold text-amber-900 hover:underline"
                      >
                        Copy text
                      </button>
                    </div>
                    <p className="font-serif italic text-neutral-900 leading-relaxed text-sm">
                      "{aiResult}"
                    </p>
                  </div>
                )}
              </div>

              {/* Right Side Column: SEO Tags & Translations */}
              <div className="space-y-6">
                
                {/* SEO Panel */}
                <div className="bg-white rounded-2xl border border-neutral-200/60 p-6 shadow-xs space-y-4">
                  <div className="flex justify-between items-center border-b border-neutral-100 pb-3">
                    <h4 className="font-bold text-sm text-neutral-900 flex items-center gap-1.5">
                      <TrendingUp size={16} className="text-neutral-500" /> SEO Keywords
                    </h4>
                    <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-md">Score: {aiSeoScore}%</span>
                  </div>

                  <p className="text-neutral-500 text-xs">Optimized hashtags for Swiggy, Zomato, Google Search, and delivery apps:</p>
                  
                  <div className="flex flex-wrap gap-2 pt-2">
                    {aiSeoKeywords.map((tag, idx) => (
                      <span key={idx} className="bg-neutral-50 border border-neutral-200 text-neutral-700 px-2.5 py-1 rounded-md text-[11px] font-mono font-medium">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Translation Panel */}
                <div className="bg-white rounded-2xl border border-neutral-200/60 p-6 shadow-xs space-y-4">
                  <div className="border-b border-neutral-100 pb-3">
                    <h4 className="font-bold text-sm text-neutral-900 flex items-center gap-1.5">
                      <Globe size={16} className="text-neutral-500" /> Menu Localization
                    </h4>
                  </div>

                  <div className="space-y-3.5">
                    <div className="flex gap-2">
                      <select 
                        id="ai-translate-lang"
                        value={aiTranslateTarget}
                        onChange={(e) => setAiTranslateTarget(e.target.value)}
                        className="flex-1 px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-xs"
                      >
                        <option value="ES">Spanish (Español)</option>
                        <option value="FR">French (Français)</option>
                        <option value="IT">Italian (Italiano)</option>
                        <option value="DE">German (Deutsch)</option>
                      </select>
                      <button
                        id="translate-ai-btn"
                        onClick={generateAiTranslation}
                        className="px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-white font-bold rounded-lg text-xs transition"
                      >
                        Translate
                      </button>
                    </div>

                    {aiTranslateResult && (
                      <div className="bg-neutral-50 border border-neutral-100 p-4 rounded-xl text-xs space-y-1.5">
                        <h5 className="font-bold text-neutral-950">{aiTranslateResult.name}</h5>
                        <p className="text-neutral-500 leading-relaxed italic">"{aiTranslateResult.description}"</p>
                      </div>
                    )}
                  </div>
                </div>

              </div>
            </div>
          </div>
        )}

        {/* TAB 6: COUPONS AND OFFERS */}
        {activeTab === 'offers' && (
          <div className="space-y-8">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-serif text-3xl font-bold text-neutral-950">Coupons & Offers</h3>
                <p className="text-neutral-500 text-sm">Manage dynamic discounts and promotion campaigns.</p>
              </div>
              <button 
                id="create-offer-btn"
                onClick={() => openOfferModal()}
                className="px-5 py-3 rounded-xl bg-amber-700 hover:bg-amber-800 text-white font-semibold text-sm transition flex items-center gap-2 shadow-md"
              >
                <Plus size={16} /> New Offer
              </button>
            </div>

            {/* List existing */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {offers.map((offer, idx) => (
                <div key={idx} className="bg-white rounded-2xl border border-neutral-200/60 p-6 flex flex-col justify-between shadow-xs">
                  <div className="space-y-3">
                    <div className="flex justify-between items-start">
                      <span className="font-mono text-lg font-bold tracking-widest text-neutral-950 bg-amber-50 border border-amber-100 px-3.5 py-1.5 rounded-lg">
                        {offer.code}
                      </span>
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                        offer.isActive ? 'bg-emerald-50 text-emerald-800' : 'bg-red-50 text-red-800'
                      }`}>
                        {offer.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    
                    <div>
                      <h4 className="font-bold text-neutral-900 text-sm">{offer.discountPercent}% Discount Rate</h4>
                      <p className="text-neutral-500 text-xs mt-1 leading-relaxed">{offer.description}</p>
                    </div>
                  </div>

                  <div className="border-t border-neutral-100 pt-4 mt-6 flex justify-between items-center">
                    <button
                      id={`toggle-offer-${offer.code}`}
                      onClick={() => onSaveOffer({ ...offer, isActive: !offer.isActive })}
                      className="text-xs font-semibold text-amber-700 hover:underline"
                    >
                      Toggle Status
                    </button>
                    <button
                      id={`edit-offer-${offer.code}`}
                      onClick={() => openOfferModal(offer)}
                      className="text-xs font-bold text-neutral-600 hover:underline"
                    >
                      Edit details
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 7: TABLE RESERVATIONS */}
        {activeTab === 'reservations' && (
          <div className="space-y-8">
            <div>
              <h3 className="font-serif text-3xl font-bold text-neutral-950">Table Bookings</h3>
              <p className="text-neutral-500 text-sm">Monitor, approve, or decline reservation requests from customer web portals.</p>
            </div>

            <div className="bg-white rounded-2xl border border-neutral-200/60 shadow-xs p-6 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-neutral-100 text-neutral-400 text-xs font-semibold uppercase tracking-wider pb-3">
                      <th className="py-3 px-4">Patron Name</th>
                      <th className="py-3 px-4">Contact</th>
                      <th className="py-3 px-4">Date / Time</th>
                      <th className="py-3 px-4 text-center">Guests</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reservations.map((res) => (
                      <tr key={res.id} className="border-b border-neutral-100 last:border-0 hover:bg-neutral-50 transition">
                        <td className="py-4 px-4 font-bold text-neutral-900">{res.customerName}</td>
                        <td className="py-4 px-4 text-xs font-medium text-neutral-500">{res.customerPhone}</td>
                        <td className="py-4 px-4">
                          <div className="flex flex-col">
                            <span className="font-semibold text-neutral-800">{res.date}</span>
                            <span className="text-xs text-neutral-400 mt-0.5">{res.time} PM</span>
                          </div>
                        </td>
                        <td className="py-4 px-4 text-center font-bold text-neutral-900">{res.guests}</td>
                        <td className="py-4 px-4">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
                            res.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                            res.status === 'pending' ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {res.status}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-right">
                          {res.status === 'pending' && (
                            <div className="flex gap-2 justify-end">
                              <button
                                id={`confirm-res-${res.id}`}
                                onClick={() => onUpdateReservationStatus(res.id, 'confirmed')}
                                className="px-3 py-1.5 rounded-lg bg-green-600 hover:bg-green-700 text-white font-bold text-xs"
                              >
                                Confirm
                              </button>
                              <button
                                id={`cancel-res-${res.id}`}
                                onClick={() => onUpdateReservationStatus(res.id, 'cancelled')}
                                className="px-3 py-1.5 rounded-lg border border-red-100 hover:bg-red-50 text-red-600 font-bold text-xs"
                              >
                                Cancel
                              </button>
                            </div>
                          )}
                          {res.status !== 'pending' && (
                            <span className="text-xs text-neutral-400 italic">No actions pending</span>
                          )}
                        </td>
                      </tr>
                    ))}

                    {reservations.length === 0 && (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-neutral-400 text-xs">No table bookings received yet.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 8: SETTINGS */}
        {activeTab === 'settings' && (
          <div className="space-y-8">
            <div>
              <h3 className="font-serif text-3xl font-bold text-neutral-950">Settings</h3>
              <p className="text-neutral-500 text-sm">Configure restaurant layouts, theme colors, and communication links.</p>
            </div>

            <form onSubmit={handleSaveSettingsSubmit} className="bg-white rounded-2xl border border-neutral-200/60 shadow-xs p-8 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-2">Restaurant Name</label>
                  <input 
                    id="settings-rest-name"
                    type="text" 
                    required
                    value={settingsName}
                    onChange={(e) => setSettingsName(e.target.value)}
                    className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl text-sm"
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-2">Tagline Slogan</label>
                  <input 
                    id="settings-rest-tagline"
                    type="text" 
                    required
                    value={settingsTagline}
                    onChange={(e) => setSettingsTagline(e.target.value)}
                    className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-2">Logo URL</label>
                  <input 
                    id="settings-logo-url"
                    type="url" 
                    value={settingsLogo}
                    onChange={(e) => setSettingsLogo(e.target.value)}
                    className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-2">Banner Cover Image</label>
                  <input 
                    id="settings-banner-url"
                    type="url" 
                    value={settingsBanner}
                    onChange={(e) => setSettingsBanner(e.target.value)}
                    className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div>
                  <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-2">Theme Preset Color</label>
                  <select 
                    id="settings-theme-color"
                    value={settingsTheme}
                    onChange={(e) => setSettingsTheme(e.target.value as any)}
                    className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl text-sm font-semibold capitalize"
                  >
                    <option value="orange">Bistro Earth (Orange)</option>
                    <option value="amber">Warm Amber</option>
                    <option value="emerald">Forest Emerald</option>
                    <option value="rose">Delicate Rose</option>
                    <option value="indigo">Modern Indigo</option>
                    <option value="neutral">Classic Charcoal</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-2">WhatsApp Order Number</label>
                  <input 
                    id="settings-whatsapp"
                    type="tel" 
                    required
                    value={settingsWhatsApp}
                    onChange={(e) => setSettingsWhatsApp(e.target.value)}
                    className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl text-sm font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-2">Contact Email</label>
                  <input 
                    id="settings-email"
                    type="email" 
                    required
                    value={settingsEmail}
                    onChange={(e) => setSettingsEmail(e.target.value)}
                    className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-2">Physical Location</label>
                <input 
                  id="settings-location"
                  type="text" 
                  required
                  value={settingsLocation}
                  onChange={(e) => setSettingsLocation(e.target.value)}
                  className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl text-sm"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-2">Business Hours</label>
                  <input 
                    id="settings-hours"
                    type="text" 
                    required
                    value={settingsHours}
                    onChange={(e) => setSettingsHours(e.target.value)}
                    className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-2">Google Map Embedded Frame URL</label>
                  <input 
                    id="settings-map-url"
                    type="url" 
                    required
                    value={settingsMapUrl}
                    onChange={(e) => setSettingsMapUrl(e.target.value)}
                    className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl text-sm font-mono text-xs"
                  />
                </div>
              </div>

              <button 
                id="save-settings-btn"
                type="submit"
                disabled={settingsSaving}
                className="px-6 py-3.5 bg-amber-700 hover:bg-amber-800 text-white font-semibold text-sm rounded-xl transition shadow-md"
              >
                {settingsSaving ? 'Saving Configurations...' : 'Save Configuration Changes'}
              </button>
            </form>
          </div>
        )}

      </main>

      {/* MODAL 1: ADD / EDIT MENU ITEM */}
      <AnimatePresence>
        {menuModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50" onClick={() => setMenuModalOpen(false)} />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl max-w-lg w-full p-6 relative z-10 shadow-2xl overflow-y-auto max-h-[90vh]"
            >
              <div className="flex justify-between items-center border-b border-neutral-100 pb-4 mb-4">
                <h4 className="font-serif text-lg font-bold text-neutral-900">
                  {selectedMenuItem ? 'Edit Menu Item' : 'New Menu Item'}
                </h4>
                <button onClick={() => setMenuModalOpen(false)} className="text-neutral-400 hover:text-neutral-600">
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSaveMenuItemSubmit} className="space-y-4 text-xs">
                <div>
                  <label className="block font-bold text-neutral-700 uppercase mb-2">Recipe Name</label>
                  <input 
                    id="menu-form-name"
                    type="text" 
                    required
                    value={menuFormName}
                    onChange={(e) => setMenuFormName(e.target.value)}
                    placeholder="e.g. Truffle Gnocchi"
                    className="w-full px-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-sm"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-neutral-700 uppercase mb-2">Category Stream</label>
                    <select 
                      id="menu-form-category"
                      value={menuFormCategory}
                      onChange={(e) => setMenuFormCategory(e.target.value)}
                      className="w-full px-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-sm"
                    >
                      <option value="Starters">Starters & Appetizers</option>
                      <option value="Main Course">Main Courses</option>
                      <option value="Desserts">Sweet Desserts</option>
                      <option value="Beverages">Refreshing Beverages</option>
                      <option value="Chef's Specials">Chef's Signature Specials</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-neutral-700 uppercase mb-2">Price ($)</label>
                    <input 
                      id="menu-form-price"
                      type="number" 
                      step="0.01"
                      required
                      value={menuFormPrice}
                      onChange={(e) => setMenuFormPrice(Number(e.target.value))}
                      className="w-full px-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-sm font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-neutral-700 uppercase mb-2">Dish Description</label>
                  <textarea 
                    id="menu-form-desc"
                    required
                    rows={3}
                    value={menuFormDesc}
                    onChange={(e) => setMenuFormDesc(e.target.value)}
                    placeholder="Briefly describe the tasting notes, cooking technique, and allergens..."
                    className="w-full px-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-sm"
                  ></textarea>
                </div>

                <div>
                  <label className="block font-bold text-neutral-700 uppercase mb-2">Image URL</label>
                  <input 
                    id="menu-form-image"
                    type="url" 
                    value={menuFormImage}
                    onChange={(e) => setMenuFormImage(e.target.value)}
                    className="w-full px-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-sm font-mono"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4 border-t border-neutral-100 pt-4">
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-neutral-700">Vegetarian Choice</span>
                    <button
                      type="button"
                      id="menu-form-veg-toggle"
                      onClick={() => setMenuFormVeg(!menuFormVeg)}
                      className={`relative w-10 h-5.5 rounded-full transition-colors ${menuFormVeg ? 'bg-emerald-600' : 'bg-neutral-200'}`}
                    >
                      <span className={`absolute top-0.75 left-0.75 bg-white w-4 h-4 rounded-full shadow-sm transition-transform ${menuFormVeg ? 'translate-x-4.5' : ''}`}></span>
                    </button>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-neutral-700">Recipe Available</span>
                    <button
                      type="button"
                      id="menu-form-avail-toggle"
                      onClick={() => setMenuFormAvailable(!menuFormAvailable)}
                      className={`relative w-10 h-5.5 rounded-full transition-colors ${menuFormAvailable ? 'bg-amber-700' : 'bg-neutral-200'}`}
                    >
                      <span className={`absolute top-0.75 left-0.75 bg-white w-4 h-4 rounded-full shadow-sm transition-transform ${menuFormAvailable ? 'translate-x-4.5' : ''}`}></span>
                    </button>
                  </div>
                </div>

                <button
                  id="submit-menu-item-btn"
                  type="submit"
                  className="w-full py-3 rounded-xl bg-amber-700 hover:bg-amber-800 text-white font-semibold text-sm transition shadow-md pt-3 mt-4"
                >
                  Save Recipe Details
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 2: ADD / EDIT COUPON OFFER */}
      <AnimatePresence>
        {offerModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50" onClick={() => setOfferModalOpen(false)} />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl max-w-sm w-full p-6 relative z-10 shadow-2xl"
            >
              <div className="flex justify-between items-center border-b border-neutral-100 pb-4 mb-4">
                <h4 className="font-serif text-lg font-bold text-neutral-900">
                  {selectedOffer ? 'Edit Coupon Offer' : 'New Coupon Offer'}
                </h4>
                <button onClick={() => setOfferModalOpen(false)} className="text-neutral-400 hover:text-neutral-600">
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSaveOfferSubmit} className="space-y-4 text-xs">
                <div>
                  <label className="block font-bold text-neutral-700 uppercase mb-2">Coupon Code</label>
                  <input 
                    id="offer-form-code"
                    type="text" 
                    required
                    value={offerFormCode}
                    onChange={(e) => setOfferFormCode(e.target.value)}
                    placeholder="e.g. SPECIAL30"
                    className="w-full px-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-sm font-mono uppercase"
                  />
                </div>

                <div>
                  <label className="block font-bold text-neutral-700 uppercase mb-2">Discount Percentage (%)</label>
                  <input 
                    id="offer-form-percent"
                    type="number" 
                    min="1"
                    max="100"
                    required
                    value={offerFormPercent}
                    onChange={(e) => setOfferFormPercent(Number(e.target.value))}
                    className="w-full px-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-sm font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-neutral-700 uppercase mb-2">Promo Description</label>
                  <input 
                    id="offer-form-desc"
                    type="text" 
                    required
                    value={offerFormDesc}
                    onChange={(e) => setOfferFormDesc(e.target.value)}
                    placeholder="e.g. Weekend special on desserts"
                    className="w-full px-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-sm"
                  />
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <span className="font-semibold text-neutral-700 font-bold uppercase">Offer Active</span>
                  <button
                    type="button"
                    id="offer-form-active-toggle"
                    onClick={() => setOfferFormActive(!offerFormActive)}
                    className={`relative w-10 h-5.5 rounded-full transition-colors ${offerFormActive ? 'bg-emerald-600' : 'bg-neutral-200'}`}
                  >
                    <span className={`absolute top-0.75 left-0.75 bg-white w-4 h-4 rounded-full shadow-sm transition-transform ${offerFormActive ? 'translate-x-4.5' : ''}`}></span>
                  </button>
                </div>

                <button
                  id="submit-offer-btn"
                  type="submit"
                  className="w-full py-3 rounded-xl bg-amber-700 hover:bg-amber-800 text-white font-semibold text-sm transition shadow-md mt-4"
                >
                  Save Coupon Details
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
