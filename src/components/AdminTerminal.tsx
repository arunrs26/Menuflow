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
  Image as ImageIcon,
  LogOut,
  Mail,
  Send,
  RefreshCw,
  QrCode,
  Printer,
  Download,
  Copy,
  ExternalLink
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { MenuItem, Order, Reservation, Offer, RestaurantSettings } from '../types';
import GmailManager from './GmailManager';
import GoogleChatManager from './GoogleChatManager';

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
  currentUser?: any;
  onSignOut?: () => Promise<void>;
  onWipeDatabase?: () => Promise<void>;
  googleAccessToken?: string | null;
  onConnectGmail?: () => Promise<void>;
  onTokenAcquired?: (token: string | null) => void;
}

type AdminTab = 'dashboard' | 'menu' | 'orders' | 'analytics' | 'ai-assistant' | 'gmail' | 'chat' | 'offers' | 'reservations' | 'settings';

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
  onSwitchToCustomer,
  currentUser,
  onSignOut,
  onWipeDatabase,
  googleAccessToken,
  onConnectGmail,
  onTokenAcquired
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

  // GMAIL PORTAL STATE
  const [gmailMessages, setGmailMessages] = useState<any[]>([]);
  const [gmailLoading, setGmailLoading] = useState(false);
  const [gmailError, setGmailError] = useState('');
  const [selectedGmailId, setSelectedGmailId] = useState<string | null>(null);
  const [gmailSearchQuery, setGmailSearchQuery] = useState('');
  const [gmailFilter, setGmailFilter] = useState<'all' | 'reservations' | 'orders' | 'feedback'>('all');
  const [replyBody, setReplyBody] = useState('');
  const [aiDraftTone, setAiDraftTone] = useState('Warm & Thankful');
  const [aiDraftInstructions, setAiDraftInstructions] = useState('');
  const [aiDraftLoading, setAiDraftLoading] = useState(false);
  const [composeOpen, setComposeOpen] = useState(false);
  const [composeTo, setComposeTo] = useState('');
  const [composeSubject, setComposeSubject] = useState('');
  const [composeBody, setComposeBody] = useState('');
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [gmailProfile, setGmailProfile] = useState<any>(null);

  const getMailHeader = (message: any, name: string) => {
    if (!message || !message.payload || !message.payload.headers) return '';
    const found = message.payload.headers.find((h: any) => h.name.toLowerCase() === name.toLowerCase());
    return found ? found.value : '';
  };

  const getMessageBody = (message: any) => {
    if (!message) return '';
    const payload = message.payload;
    if (!payload) return message.snippet || '';
    
    const decodeBase64 = (b64: string) => {
      try {
        const cleaned = b64.replace(/-/g, '+').replace(/_/g, '/');
        return decodeURIComponent(atob(cleaned).split('').map((c) => {
          return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
      } catch (err) {
        try {
          return atob(b64.replace(/-/g, '+').replace(/_/g, '/'));
        } catch (e) {
          return 'Failed to decode message body.';
        }
      }
    };

    if (payload.body && payload.body.data) {
      return decodeBase64(payload.body.data);
    }

    if (payload.parts) {
      const parts = payload.parts;
      let htmlPart = parts.find((p: any) => p.mimeType === 'text/html');
      let textPart = parts.find((p: any) => p.mimeType === 'text/plain');
      
      if (htmlPart && htmlPart.body && htmlPart.body.data) {
        return decodeBase64(htmlPart.body.data);
      }
      if (textPart && textPart.body && textPart.body.data) {
        return `<pre style="font-family: inherit; white-space: pre-wrap; word-break: break-word;">${decodeBase64(textPart.body.data)}</pre>`;
      }
      
      for (const part of parts) {
        if (part.parts) {
          let subHtml = part.parts.find((sp: any) => sp.mimeType === 'text/html');
          if (subHtml && subHtml.body && subHtml.body.data) {
            return decodeBase64(subHtml.body.data);
          }
        }
      }
    }
    
    return message.snippet || '';
  };

  const loadGmailData = async () => {
    if (!googleAccessToken) return;
    setGmailLoading(true);
    setGmailError('');
    try {
      const profileRes = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/profile', {
        headers: { Authorization: `Bearer ${googleAccessToken}` }
      });
      if (profileRes.ok) {
        const profileData = await profileRes.json();
        setGmailProfile(profileData);
      }

      let queryStr = '';
      if (gmailFilter === 'reservations') {
        queryStr = 'subject:(reservation OR booking OR table)';
      } else if (gmailFilter === 'orders') {
        queryStr = 'subject:(order OR delivery OR purchase)';
      } else if (gmailFilter === 'feedback') {
        queryStr = 'subject:(feedback OR review OR experience)';
      }
      
      if (gmailSearchQuery.trim()) {
        queryStr = queryStr ? `(${queryStr}) ${gmailSearchQuery.trim()}` : gmailSearchQuery.trim();
      }

      const listRes = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=10${queryStr ? `&q=${encodeURIComponent(queryStr)}` : ''}`, {
        headers: { Authorization: `Bearer ${googleAccessToken}` }
      });
      
      if (!listRes.ok) {
        throw new Error('Failed to retrieve Gmail messages. Access token may be expired.');
      }

      const listData = await listRes.json();
      if (listData.messages && listData.messages.length > 0) {
        const detailedMessages = await Promise.all(
          listData.messages.map(async (msg: any) => {
            const detailRes = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=full`, {
              headers: { Authorization: `Bearer ${googleAccessToken}` }
            });
            if (detailRes.ok) {
              return detailRes.json();
            }
            return msg;
          })
        );
        setGmailMessages(detailedMessages);
        if (detailedMessages.length > 0) {
          setSelectedGmailId(detailedMessages[0].id);
        }
      } else {
        setGmailMessages([]);
        setSelectedGmailId(null);
      }
    } catch (err: any) {
      console.error('Error fetching Gmail data:', err);
      setGmailError(err.message || 'Failed to sync with Gmail API.');
    } finally {
      setGmailLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'gmail' && googleAccessToken) {
      loadGmailData();
    }
  }, [activeTab, googleAccessToken, gmailFilter]);

  const handleGenerateAiDraft = async (msg: any) => {
    if (!msg) return;
    setAiDraftLoading(true);
    try {
      const subject = getMailHeader(msg, 'subject');
      const from = getMailHeader(msg, 'from');
      const snippet = msg.snippet || '';

      const response = await fetch('/api/ai/draft-email-reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          emailSubject: subject,
          emailSnippet: snippet,
          emailFrom: from,
          replyTone: aiDraftTone,
          customInstructions: aiDraftInstructions
        })
      });

      if (!response.ok) throw new Error('Failed to generate AI response draft.');
      const data = await response.json();
      setReplyBody(data.replyText || '');
    } catch (err) {
      console.error('AI Draft generation failed:', err);
      alert('Failed to draft response with Gemini AI. Using default fallback.');
      setReplyBody(`Dear customer,\n\nThank you for writing to us. We have received your inquiry and will look into it immediately.\n\nWarm regards,\n${settingsName || 'Restaurant'} Management`);
    } finally {
      setAiDraftLoading(false);
    }
  };

  const sendGmailMessage = async (to: string, subject: string, bodyText: string, threadId?: string) => {
    if (!to || !subject || !bodyText) {
      alert('Recipient, subject, and message body are all required.');
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to send this email to "${to}"? This will be sent from your connected Gmail address.`
    );
    if (!confirmed) return;

    setIsSendingEmail(true);
    try {
      const emailRaw = [
        `To: ${to}`,
        `Subject: ${subject}`,
        'Content-Type: text/html; charset=utf-8',
        'MIME-Version: 1.0',
        '',
        `<div>${bodyText.replace(/\n/g, '<br/>')}</div>`
      ].join('\r\n');

      const base64Safe = btoa(unescape(encodeURIComponent(emailRaw)))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');

      const payload: any = { raw: base64Safe };
      if (threadId) {
        payload.threadId = threadId;
      }

      const response = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${googleAccessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorDetails = await response.text();
        throw new Error(`Failed to send email: ${errorDetails}`);
      }

      alert('Email has been successfully sent!');
      setReplyBody('');
      setComposeOpen(false);
      setComposeTo('');
      setComposeSubject('');
      setComposeBody('');
      loadGmailData();
    } catch (err: any) {
      console.error(err);
      alert(`Failed to send email: ${err.message || err}`);
    } finally {
      setIsSendingEmail(false);
    }
  };

  const selectedMessage = gmailMessages.find(m => m.id === selectedGmailId);

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

  // QR CODE STATE
  const [qrTableNum, setQrTableNum] = useState('1');
  const [generatedTables, setGeneratedTables] = useState<string[]>(['1', '2', '3', '5', '8']);
  const [copiedTable, setCopiedTable] = useState<string | null>(null);

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
  const totalRevenueNum = orders.reduce((acc, o) => o.status !== 'cancelled' ? acc + o.totalAmount : acc, 0);
  const totalOrdersCount = orders.length;
  
  const uniqueCustomers = new Set([
    ...orders.map(o => o.customerPhone),
    ...reservations.map(r => r.customerPhone)
  ].filter(Boolean));
  const visitorsCount = uniqueCustomers.size;

  const getPopularDish = () => {
    if (orders.length === 0) return { name: "None Yet", count: 0 };
    const counts: { [key: string]: number } = {};
    orders.forEach(o => {
      o.items?.forEach(item => {
        counts[item.name] = (counts[item.name] || 0) + (item.quantity || 1);
      });
    });
    let maxName = "";
    let maxCount = 0;
    Object.entries(counts).forEach(([name, count]) => {
      if (count > maxCount) {
        maxCount = count;
        maxName = name;
      }
    });
    return { name: maxName || "None Yet", count: maxCount };
  };
  const popularDish = getPopularDish();

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
              id="nav-gmail"
              onClick={() => setActiveTab('gmail')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition ${
                activeTab === 'gmail' 
                  ? 'bg-amber-700/10 text-amber-900 shadow-xs' 
                  : 'text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900'
              }`}
            >
              <Mail size={18} className="text-amber-700" /> Gmail Portal
            </button>
            <button
              id="nav-chat"
              onClick={() => setActiveTab('chat')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition ${
                activeTab === 'chat' 
                  ? 'bg-amber-700/10 text-amber-900 shadow-xs' 
                  : 'text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900'
              }`}
            >
              <MessageSquare size={18} className="text-amber-700" /> Google Chat
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
          <div className="flex items-center justify-between gap-2 px-2">
            <div className="flex items-center gap-3">
              {currentUser?.photoURL ? (
                <img 
                  src={currentUser.photoURL} 
                  alt={currentUser.displayName || 'Admin'} 
                  className="w-9 h-9 rounded-full border border-neutral-200 object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-9 h-9 rounded-full bg-amber-700 text-white flex items-center justify-center font-bold text-sm border border-white">
                  {currentUser?.displayName ? currentUser.displayName.slice(0, 2).toUpperCase() : 'AD'}
                </div>
              )}
              <div className="min-w-0">
                <h4 className="text-xs font-bold text-neutral-950 truncate max-w-[110px]">
                  {currentUser?.displayName || 'Admin Rossi'}
                </h4>
                <p className="text-[9px] text-neutral-500 font-semibold truncate max-w-[110px]">
                  {currentUser?.email || 'arunbunnychitti111@gmail.com'}
                </p>
              </div>
            </div>

            {onSignOut && (
              <button
                onClick={onSignOut}
                title="Sign Out"
                className="p-1.5 text-neutral-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
              >
                <LogOut size={16} />
              </button>
            )}
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
                  <p className="text-neutral-500 text-xs font-semibold uppercase tracking-wider mb-2">Total Visitors</p>
                  <h4 className="text-3xl font-bold text-neutral-950">{visitorsCount.toLocaleString()}</h4>
                  <span className="inline-flex items-center text-[10px] font-bold text-neutral-500 bg-neutral-50 px-2 py-0.5 rounded-md mt-1.5">Unique customers</span>
                </div>
                <div className="p-4 rounded-xl bg-neutral-50 text-neutral-500">
                  <UsersIcon size={24} />
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-neutral-200/60 p-6 flex items-center justify-between shadow-xs">
                <div>
                  <p className="text-neutral-500 text-xs font-semibold uppercase tracking-wider mb-2">Total Orders</p>
                  <h4 className="text-3xl font-bold text-neutral-950">{totalOrdersCount}</h4>
                  <span className="inline-flex items-center text-[10px] font-bold text-neutral-500 bg-neutral-50 px-2 py-0.5 rounded-md mt-1.5">Live database</span>
                </div>
                <div className="p-4 rounded-xl bg-neutral-50 text-neutral-500">
                  <ListOrdered size={24} />
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-neutral-200/60 p-6 flex items-center justify-between shadow-xs">
                <div>
                  <p className="text-neutral-500 text-xs font-semibold uppercase tracking-wider mb-2">Total Revenue</p>
                  <h4 className="text-3xl font-bold text-neutral-950">${totalRevenueNum.toLocaleString()}</h4>
                  <span className="inline-flex items-center text-[10px] font-bold text-neutral-500 bg-neutral-50 px-2 py-0.5 rounded-md mt-1.5">From active orders</span>
                </div>
                <div className="p-4 rounded-xl bg-neutral-50 text-neutral-500">
                  <DollarSign size={24} />
                </div>
              </div>

              <div className="bg-amber-700 rounded-2xl p-6 text-white flex items-center justify-between shadow-md">
                <div>
                  <p className="text-white/70 text-xs font-semibold uppercase tracking-wider mb-2">Popular Dish</p>
                  <h4 className="text-xl font-bold leading-tight">{popularDish.name}</h4>
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-200 mt-1.5">★ {popularDish.count} orders</span>
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
                        <td className="py-4 px-4 font-semibold text-neutral-800">
                          <div>
                            <span>{order.customerName}</span>
                            {order.tableNumber && (
                              <span className="ml-2 inline-flex items-center px-1.5 py-0.25 bg-amber-50 border border-amber-200 text-amber-800 text-[10px] font-bold rounded font-sans">
                                Table {order.tableNumber}
                              </span>
                            )}
                          </div>
                        </td>
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
                      src={item.image || undefined} 
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
                            <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                              <h5 className="font-bold text-neutral-900">{order.customerName}</h5>
                              {order.tableNumber && (
                                <span className="px-1.5 py-0.25 bg-amber-100 border border-amber-200 text-amber-800 text-[9px] font-bold rounded">
                                  Table {order.tableNumber}
                                </span>
                              )}
                            </div>
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
                        <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                          <h5 className="font-bold text-neutral-900">{order.customerName}</h5>
                          {order.tableNumber && (
                            <span className="px-1.5 py-0.25 bg-amber-100 border border-amber-200 text-amber-800 text-[9px] font-bold rounded">
                              Table {order.tableNumber}
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-blue-700 font-bold mt-1.5 bg-blue-50 px-2 py-0.5 rounded-md inline-block">
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
                        <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                          <h5 className="font-bold text-neutral-900">{order.customerName}</h5>
                          {order.tableNumber && (
                            <span className="px-1.5 py-0.25 bg-amber-100 border border-amber-200 text-amber-800 text-[9px] font-bold rounded">
                              Table {order.tableNumber}
                            </span>
                          )}
                        </div>
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

        {activeTab === 'gmail' && (
          <GmailManager
            accessToken={googleAccessToken || null}
            onTokenAcquired={(token) => {
              if (onTokenAcquired && token) {
                onTokenAcquired(token);
              }
            }}
            onTokenCleared={() => {
              if (onTokenAcquired) {
                onTokenAcquired(null);
              }
            }}
            restaurantName={settings?.restaurantName || 'Our Restaurant'}
          />
        )}

        {activeTab === 'chat' && (
          <GoogleChatManager
            accessToken={googleAccessToken || null}
            onTokenAcquired={(token) => {
              if (onTokenAcquired && token) {
                onTokenAcquired(token);
              }
            }}
            onTokenCleared={() => {
              if (onTokenAcquired) {
                onTokenAcquired(null);
              }
            }}
            restaurantName={settings?.restaurantName || 'Our Restaurant'}
            orders={orders}
            reservations={reservations}
          />
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

        {/* GMAIL PORTAL TAB */}
        {activeTab === 'gmail' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h3 className="font-serif text-3xl font-bold text-neutral-950">Gmail Integration</h3>
                <p className="text-neutral-500 text-sm">Manage feedback, booking requests, and orders directly using Gmail combined with Gemini AI support.</p>
              </div>

              {googleAccessToken && (
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setComposeOpen(true)}
                    className="px-4 py-2 bg-amber-700 text-white rounded-xl text-xs font-semibold hover:bg-amber-800 transition flex items-center gap-2 shadow-xs"
                  >
                    <Plus size={14} /> Compose Email
                  </button>
                  <button
                    onClick={loadGmailData}
                    disabled={gmailLoading}
                    className="p-2 border border-neutral-200 hover:bg-neutral-50 rounded-xl transition text-neutral-600 disabled:opacity-50"
                    title="Sync Messages"
                  >
                    <RefreshCw size={16} className={gmailLoading ? 'animate-spin' : ''} />
                  </button>
                </div>
              )}
            </div>

            {!googleAccessToken ? (
              <div className="bg-white border border-neutral-200/60 shadow-xs rounded-2xl p-10 text-center max-w-xl mx-auto space-y-6">
                <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mx-auto text-amber-700">
                  <Mail size={32} />
                </div>
                <div className="space-y-2">
                  <h4 className="text-xl font-bold text-neutral-900">Connect Your Restaurant Gmail Account</h4>
                  <p className="text-neutral-500 text-sm leading-relaxed">
                    Link your business or management Gmail account to review incoming customer emails, table requests, feedback, and draft intelligent, context-aware responses instantly with the Gemini AI Email Assistant.
                  </p>
                </div>

                <div className="pt-2">
                  <button
                    onClick={onConnectGmail}
                    className="inline-flex items-center justify-center gap-3 bg-white border border-neutral-300 hover:bg-neutral-50 text-neutral-700 px-6 py-3 rounded-xl font-medium transition duration-200 shadow-sm text-sm"
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      />
                    </svg>
                    <span>Sign in with Google Workspace</span>
                  </button>
                  <p className="text-[10px] text-neutral-400 mt-3">Requires permission to search, read, and draft replies using Gmail API securely.</p>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Connection Status Banner */}
                <div className="bg-emerald-50 border border-emerald-100/80 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                    <div>
                      <p className="text-emerald-950 font-semibold text-xs">Connected to Google Workspace</p>
                      {gmailProfile && (
                        <p className="text-emerald-700 text-[11px]">{gmailProfile.emailAddress} ({gmailProfile.messagesTotal} total messages)</p>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={onSignOut}
                    className="text-neutral-500 hover:text-red-600 text-xs font-semibold transition"
                  >
                    Disconnect
                  </button>
                </div>

                {/* Filters & Search */}
                <div className="bg-white rounded-2xl border border-neutral-200/60 p-4 flex flex-col md:flex-row gap-4 items-center">
                  <div className="flex flex-wrap gap-1 w-full md:w-auto">
                    {(['all', 'reservations', 'orders', 'feedback'] as const).map((filter) => (
                      <button
                        key={filter}
                        onClick={() => setGmailFilter(filter)}
                        className={`px-4 py-2 rounded-xl text-xs font-semibold capitalize transition ${
                          gmailFilter === filter
                            ? 'bg-amber-700 text-white shadow-xs'
                            : 'bg-neutral-50 text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900'
                        }`}
                      >
                        {filter}
                      </button>
                    ))}
                  </div>

                  <div className="relative flex-1 w-full flex gap-2">
                    <div className="relative flex-1">
                      <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" size={16} />
                      <input
                        type="text"
                        value={gmailSearchQuery}
                        onChange={(e) => setGmailSearchQuery(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && loadGmailData()}
                        placeholder="Search customer emails (Press Enter)..."
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-neutral-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                      />
                    </div>
                    <button
                      onClick={loadGmailData}
                      className="px-4 py-2.5 bg-neutral-900 text-white rounded-xl text-xs font-semibold hover:bg-neutral-800 transition"
                    >
                      Search
                    </button>
                  </div>
                </div>

                {/* Main Mailbox Content */}
                {gmailLoading ? (
                  <div className="bg-white rounded-2xl border border-neutral-200/60 p-16 text-center">
                    <RefreshCw size={32} className="animate-spin text-amber-700 mx-auto mb-4" />
                    <p className="text-neutral-600 font-medium text-sm">Syncing with Gmail Portal...</p>
                    <p className="text-neutral-400 text-xs mt-1">Downloading your latest customer conversations</p>
                  </div>
                ) : gmailError ? (
                  <div className="bg-white rounded-2xl border border-neutral-200/60 p-10 text-center space-y-4">
                    <div className="w-12 h-12 rounded-full bg-red-50 text-red-600 flex items-center justify-center mx-auto">
                      <AlertTriangle size={24} />
                    </div>
                    <div>
                      <p className="text-neutral-900 font-bold text-sm">Gmail Synchronization Failed</p>
                      <p className="text-neutral-500 text-xs mt-1">{gmailError}</p>
                    </div>
                    <button
                      onClick={loadGmailData}
                      className="px-4 py-2 bg-neutral-900 text-white rounded-xl text-xs font-semibold hover:bg-neutral-800 transition"
                    >
                      Retry Connection
                    </button>
                  </div>
                ) : gmailMessages.length === 0 ? (
                  <div className="bg-white rounded-2xl border border-neutral-200/60 p-16 text-center space-y-3">
                    <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-700 flex items-center justify-center mx-auto">
                      <Mail size={24} />
                    </div>
                    <div>
                      <p className="text-neutral-900 font-bold text-sm">No Matching Emails Found</p>
                      <p className="text-neutral-500 text-xs mt-1">We couldn't find any direct emails under the filter "{gmailFilter}".</p>
                    </div>
                    <button
                      onClick={() => { setGmailFilter('all'); setGmailSearchQuery(''); }}
                      className="px-4 py-2 border border-neutral-200 rounded-xl text-xs font-semibold hover:bg-neutral-50 transition text-neutral-600"
                    >
                      Clear Filters
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">
                    <div className="lg:col-span-2 bg-white rounded-2xl border border-neutral-200/60 max-h-[600px] overflow-y-auto divide-y divide-neutral-100 shadow-xs">
                      {gmailMessages.map((msg) => {
                        const isSelected = msg.id === selectedGmailId;
                        const subject = getMailHeader(msg, 'subject') || '(No Subject)';
                        const from = getMailHeader(msg, 'from') || 'Unknown';
                        const dateVal = getMailHeader(msg, 'date');
                        let formattedDate = dateVal;
                        try {
                          formattedDate = new Date(dateVal).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
                        } catch (e) {}

                        return (
                          <div
                            key={msg.id}
                            onClick={() => {
                              setSelectedGmailId(msg.id);
                              setReplyBody('');
                            }}
                            className={`p-4 cursor-pointer text-left transition duration-150 ${
                              isSelected 
                                ? 'bg-amber-50/60 border-l-4 border-amber-700' 
                                : 'hover:bg-neutral-50/60 border-l-4 border-transparent'
                            }`}
                          >
                            <div className="flex justify-between items-start gap-2 mb-1">
                              <span className="font-bold text-neutral-900 text-xs truncate max-w-[150px]">
                                {from.split('<')[0].trim() || from}
                              </span>
                              <span className="text-[10px] text-neutral-400 shrink-0">{formattedDate}</span>
                            </div>
                            <h5 className={`text-xs font-bold text-neutral-800 mb-1 truncate ${isSelected ? 'text-amber-900' : ''}`}>
                              {subject}
                            </h5>
                            <p className="text-neutral-500 text-[11px] line-clamp-2 leading-relaxed">
                              {msg.snippet}
                            </p>
                          </div>
                        );
                      })}
                    </div>

                    <div className="lg:col-span-3 bg-white rounded-2xl border border-neutral-200/60 shadow-xs overflow-hidden">
                      {selectedMessage ? (
                        <div className="divide-y divide-neutral-100">
                          <div className="p-6 bg-neutral-50/50">
                            <h4 className="text-lg font-bold text-neutral-900 mb-2 font-serif">
                              {getMailHeader(selectedMessage, 'subject') || '(No Subject)'}
                            </h4>
                            <div className="flex flex-col gap-1 text-xs text-neutral-500">
                              <div className="flex gap-1">
                                <span className="font-bold text-neutral-700">From:</span>
                                <span>{getMailHeader(selectedMessage, 'from')}</span>
                              </div>
                              <div className="flex gap-1">
                                <span className="font-bold text-neutral-700">To:</span>
                                <span>{getMailHeader(selectedMessage, 'to')}</span>
                              </div>
                              <div className="flex gap-1">
                                <span className="font-bold text-neutral-700">Date:</span>
                                <span>{getMailHeader(selectedMessage, 'date')}</span>
                              </div>
                            </div>
                          </div>

                          <div className="p-6">
                            <div className="text-xs text-neutral-400 uppercase tracking-wider mb-2 font-bold">Message Content</div>
                            <div 
                              className="p-4 border border-neutral-200/70 rounded-xl bg-neutral-50/50 text-neutral-700 text-xs leading-relaxed max-h-72 overflow-y-auto whitespace-pre-line select-text"
                              dangerouslySetInnerHTML={{ __html: getMessageBody(selectedMessage) }}
                            />
                          </div>

                          <div className="p-6 bg-amber-50/20 space-y-4">
                            <div className="flex items-center gap-2 text-amber-900 font-bold text-xs uppercase tracking-wider">
                              <Sparkles size={16} className="text-amber-700" />
                              <span>Gemini AI Smart Responder</span>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <div>
                                <label className="block text-[10px] font-bold text-neutral-600 uppercase tracking-wider mb-1.5">Reply Tone</label>
                                <select
                                  value={aiDraftTone}
                                  onChange={(e) => setAiDraftTone(e.target.value)}
                                  className="w-full px-3 py-2 rounded-xl border border-neutral-200 bg-white text-xs text-neutral-800 focus:outline-none focus:ring-1 focus:ring-amber-500"
                                >
                                  <option value="Warm & Thankful">Warm & Thankful (Good reviews, bookings)</option>
                                  <option value="Polite & Apologetic">Polite & Apologetic (Complaints, refunds)</option>
                                  <option value="Formal & Professional">Formal & Professional (Business queries)</option>
                                  <option value="Excited & Promoting">Excited & Promoting (Coupons, party bookings)</option>
                                </select>
                              </div>

                              <div>
                                <label className="block text-[10px] font-bold text-neutral-600 uppercase tracking-wider mb-1.5">Custom Instructions (Optional)</label>
                                <input
                                  type="text"
                                  value={aiDraftInstructions}
                                  onChange={(e) => setAiDraftInstructions(e.target.value)}
                                  placeholder="e.g., offer 20% off code BISTRO20"
                                  className="w-full px-3 py-2 rounded-xl border border-neutral-200 text-xs focus:outline-none focus:ring-1 focus:ring-amber-500"
                                />
                              </div>
                            </div>

                            <button
                              onClick={() => handleGenerateAiDraft(selectedMessage)}
                              disabled={aiDraftLoading}
                              className="w-full py-2.5 rounded-xl bg-amber-700 hover:bg-amber-800 text-white font-semibold text-xs transition flex items-center justify-center gap-2 shadow-xs disabled:opacity-50"
                            >
                              <Sparkles size={14} /> 
                              {aiDraftLoading ? 'Gemini is drafting reply...' : 'Draft Response with Gemini'}
                            </button>
                          </div>

                          <div className="p-6 space-y-4">
                            <div>
                              <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-2">Reply Draft Editor</label>
                              <textarea
                                value={replyBody}
                                onChange={(e) => setReplyBody(e.target.value)}
                                rows={6}
                                placeholder="Edit the generated draft or write your custom response here..."
                                className="w-full p-4 border border-neutral-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 bg-white"
                              />
                            </div>

                            <div className="flex justify-end gap-3">
                              <button
                                onClick={() => setReplyBody('')}
                                className="px-4 py-2 border border-neutral-200 rounded-xl text-xs font-semibold hover:bg-neutral-50 transition text-neutral-500"
                              >
                                Clear Draft
                              </button>
                              <button
                                onClick={() => {
                                  const fromHeader = getMailHeader(selectedMessage, 'from');
                                  const emailMatch = fromHeader.match(/<([^>]+)>/) || [null, fromHeader];
                                  const recipientEmail = emailMatch[1] || fromHeader;
                                  const subject = getMailHeader(selectedMessage, 'subject') || '';
                                  const replySubject = subject.toLowerCase().startsWith('re:') ? subject : `Re: ${subject}`;
                                  sendGmailMessage(recipientEmail, replySubject, replyBody, selectedMessage.threadId);
                                }}
                                disabled={isSendingEmail || !replyBody.trim()}
                                className="px-5 py-2 bg-neutral-900 text-white rounded-xl text-xs font-semibold hover:bg-neutral-800 transition flex items-center gap-2 shadow-xs disabled:opacity-50"
                              >
                                <Send size={14} />
                                {isSendingEmail ? 'Sending...' : 'Send Reply Now'}
                              </button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="p-16 text-center text-neutral-400 text-sm">
                          Select an email from the left column to view message contents and draft replies.
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
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

            {/* TABLE QR CODE GENERATOR */}
            <div className="bg-white rounded-2xl border border-neutral-200/60 shadow-xs p-8 mt-8 space-y-6">
              <div>
                <h4 className="font-serif text-2xl font-bold text-neutral-950 flex items-center gap-2">
                  <QrCode size={24} className="text-amber-700" />
                  Table QR Code Generator & Placards
                </h4>
                <p className="text-neutral-500 text-sm mt-1">
                  Create digital table QR codes. When patrons scan them, the menu will load automatically with their table pre-assigned.
                </p>
              </div>

              {/* Controls */}
              <div className="flex flex-col sm:flex-row items-end gap-4 p-4 bg-neutral-50 rounded-xl border border-neutral-100">
                <div className="w-full sm:w-auto">
                  <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-2">New Table Number</label>
                  <input
                    id="new-table-input"
                    type="text"
                    value={qrTableNum}
                    onChange={(e) => setQrTableNum(e.target.value)}
                    placeholder="e.g. 12"
                    className="w-full px-4 py-2.5 bg-white border border-neutral-200 rounded-lg text-sm"
                  />
                </div>
                <button
                  id="add-table-btn"
                  type="button"
                  onClick={() => {
                    const trimmed = qrTableNum.trim();
                    if (trimmed && !generatedTables.includes(trimmed)) {
                      setGeneratedTables([...generatedTables, trimmed].sort((a, b) => {
                        const numA = parseInt(a);
                        const numB = parseInt(b);
                        if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
                        return a.localeCompare(b);
                      }));
                      setQrTableNum('');
                    }
                  }}
                  className="px-5 py-2.5 bg-neutral-950 hover:bg-neutral-900 text-white font-semibold text-sm rounded-lg transition shrink-0 shadow-xs flex items-center gap-2"
                >
                  <Plus size={16} /> Add Table
                </button>

                <div className="sm:ml-auto">
                  <button
                    id="print-all-placards-btn"
                    type="button"
                    onClick={() => {
                      const printWindow = window.open('', '_blank');
                      if (!printWindow) return;
                      
                      let html = `
                        <html>
                          <head>
                            <title>Table QR Placards - ${settingsName || 'MenuFlow'}</title>
                            <style>
                              body { font-family: 'Inter', system-ui, sans-serif; text-align: center; margin: 0; padding: 20px; background: #f9f9f9; }
                              .placard { 
                                background: white; border: 2px solid #e5e5e5; border-radius: 24px; 
                                width: 350px; margin: 30px auto; padding: 40px 30px; 
                                box-shadow: 0 4px 20px rgba(0,0,0,0.05); page-break-inside: avoid;
                              }
                              .logo { font-size: 24px; font-weight: 800; color: #b45309; margin-bottom: 5px; font-family: serif; }
                              .tagline { font-size: 11px; color: #6b7280; margin-bottom: 25px; text-transform: uppercase; letter-spacing: 1.5px; }
                              .qr-box { background: #fafafa; border: 1px solid #f3f3f3; padding: 20px; border-radius: 16px; display: inline-block; }
                              .qr-img { width: 220px; height: 220px; display: block; }
                              .table-num { font-size: 36px; font-weight: 800; color: #111827; margin-top: 25px; }
                              .instruction { font-size: 13px; color: #4b5563; font-weight: 500; margin-top: 10px; }
                              @media print {
                                body { background: white; padding: 0; }
                                .placard { border: 2px solid #000; box-shadow: none; margin: 50px auto; page-break-after: always; }
                              }
                            </style>
                          </head>
                          <body>
                      `;

                      generatedTables.forEach(t => {
                        const scanUrl = `${window.location.origin}?table=${t}`;
                        const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(scanUrl)}`;
                        html += `
                          <div class="placard">
                            <div class="logo">${settingsName || 'MenuFlow'}</div>
                            <div class="tagline">Smart Digital Menu</div>
                            <div class="qr-box">
                              <img class="qr-img" src="${qrUrl}" alt="Table ${t} QR Code" />
                            </div>
                            <div class="table-num">TABLE ${t}</div>
                            <div class="instruction">Scan QR Code to view menu and order instantly</div>
                          </div>
                        `;
                      });

                      html += `
                            <script>window.onload = function() { window.print(); }</script>
                          </body>
                        </html>
                      `;
                      printWindow.document.write(html);
                      printWindow.document.close();
                    }}
                    className="px-5 py-2.5 border border-neutral-300 hover:bg-neutral-100 text-neutral-700 font-semibold text-sm rounded-lg transition shadow-xs flex items-center gap-2"
                  >
                    <Printer size={16} /> Print All Placards
                  </button>
                </div>
              </div>

              {/* Tables Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {generatedTables.map((t) => {
                  const scanUrl = `${window.location.origin}?table=${t}`;
                  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(scanUrl)}`;
                  
                  return (
                    <div key={t} className="bg-neutral-50/50 rounded-xl border border-neutral-200/60 p-5 flex flex-col items-center text-center space-y-4">
                      {/* Placard Header */}
                      <div className="w-full flex justify-between items-center text-xs font-bold text-neutral-400 uppercase tracking-widest px-1">
                        <span>Table Placard</span>
                        <span className="text-amber-800 font-semibold">T-{t}</span>
                      </div>

                      {/* QR Code Graphic Frame */}
                      <div className="p-3 bg-white rounded-lg border border-neutral-100 shadow-xs relative group">
                        <img
                          src={qrUrl}
                          alt={`QR Table ${t}`}
                          className="w-32 h-32 object-contain"
                        />
                      </div>

                      {/* Info & Copy */}
                      <div className="space-y-1">
                        <h5 className="font-bold text-neutral-900 text-base">Table {t}</h5>
                        <p className="text-[10px] text-neutral-400 font-mono truncate max-w-[200px]">{scanUrl}</p>
                      </div>

                      {/* Actions */}
                      <div className="grid grid-cols-2 gap-2 w-full pt-1">
                        <button
                          id={`copy-table-${t}`}
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(scanUrl);
                            setCopiedTable(t);
                            setTimeout(() => setCopiedTable(null), 2000);
                          }}
                          className={`py-1.5 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
                            copiedTable === t 
                              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
                              : 'bg-white hover:bg-neutral-100 border border-neutral-200 text-neutral-700'
                          }`}
                        >
                          <Copy size={12} />
                          <span>{copiedTable === t ? 'Copied' : 'Copy Link'}</span>
                        </button>

                        <button
                          id={`print-table-${t}`}
                          type="button"
                          onClick={() => {
                            const printWindow = window.open('', '_blank');
                            if (!printWindow) return;
                            const html = `
                              <html>
                                <head>
                                  <title>Table ${t} Placard - ${settingsName || 'MenuFlow'}</title>
                                  <style>
                                    body { font-family: 'Inter', system-ui, sans-serif; text-align: center; margin: 0; padding: 40px; background: white; }
                                    .placard { 
                                      background: white; border: 3px solid #111; border-radius: 28px; 
                                      max-width: 380px; margin: 40px auto; padding: 50px 30px; 
                                    }
                                    .logo { font-size: 28px; font-weight: 800; color: #b45309; margin-bottom: 5px; font-family: serif; }
                                    .tagline { font-size: 12px; color: #6b7280; margin-bottom: 30px; text-transform: uppercase; letter-spacing: 2px; }
                                    .qr-box { background: #fafafa; border: 1px solid #f3f3f3; padding: 25px; border-radius: 20px; display: inline-block; }
                                    .qr-img { width: 240px; height: 240px; display: block; }
                                    .table-num { font-size: 42px; font-weight: 800; color: #111827; margin-top: 30px; }
                                    .instruction { font-size: 14px; color: #4b5563; font-weight: 500; margin-top: 10px; }
                                  </style>
                                </head>
                                <body>
                                  <div class="placard">
                                    <div class="logo">${settingsName || 'MenuFlow'}</div>
                                    <div class="tagline">Smart Digital Menu</div>
                                    <div class="qr-box">
                                      <img class="qr-img" src="${qrUrl}" alt="Table ${t} QR Code" />
                                    </div>
                                    <div class="table-num">TABLE ${t}</div>
                                    <div class="instruction">Scan QR Code to view menu and order instantly</div>
                                  </div>
                                  <script>window.onload = function() { window.print(); }</script>
                                </body>
                              </html>
                            `;
                            printWindow.document.write(html);
                            printWindow.document.close();
                          }}
                          className="py-1.5 px-3 bg-white hover:bg-neutral-100 border border-neutral-200 text-neutral-700 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition"
                        >
                          <Printer size={12} />
                          <span>Print</span>
                        </button>
                      </div>

                      <button
                        id={`delete-table-${t}`}
                        type="button"
                        onClick={() => {
                          setGeneratedTables(generatedTables.filter(item => item !== t));
                        }}
                        className="text-xs text-red-500 hover:text-red-700 font-semibold pt-1"
                      >
                        Delete Table
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {onWipeDatabase && (
              <div className="bg-red-50/50 rounded-2xl border-2 border-red-200/60 shadow-xs p-8 mt-8 space-y-4">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-red-100 text-red-600 rounded-xl">
                    <Trash2 size={24} />
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-red-950 font-serif">Danger Zone</h4>
                    <p className="text-red-700 text-xs mt-1">
                      Permanently wipe all sample menu items, mock business details, coupons, and fake orders from your database.
                    </p>
                  </div>
                </div>
                <div className="flex justify-end pt-2">
                  <button
                    id="wipe-database-btn"
                    type="button"
                    onClick={async () => {
                      if (window.confirm("Are you absolutely sure you want to permanently clear all sample dishes, mock details, coupons, and orders? This action cannot be undone.")) {
                        await onWipeDatabase();
                        alert("Database has been successfully cleared to an empty layout!");
                      }
                    }}
                    className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold text-sm rounded-xl transition shadow-md"
                  >
                    Clear Database & Sample Data
                  </button>
                </div>
              </div>
            )}
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

        {/* MODAL 3: COMPOSE EMAIL */}
        {composeOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50" onClick={() => setComposeOpen(false)} />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-2xl bg-white rounded-2xl shadow-xl overflow-hidden z-10 border border-neutral-100"
            >
              <div className="px-6 py-4 bg-neutral-900 text-white flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Mail size={18} className="text-amber-500" />
                  <span className="font-bold text-sm">Compose New Email</span>
                </div>
                <button 
                  onClick={() => setComposeOpen(false)}
                  className="p-1 hover:bg-white/10 rounded-lg transition"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-neutral-600 uppercase tracking-wider mb-1.5">Recipient Email Address</label>
                    <input
                      type="email"
                      value={composeTo}
                      onChange={(e) => setComposeTo(e.target.value)}
                      placeholder="e.g. customer@example.com"
                      className="w-full px-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-sm"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-neutral-600 uppercase tracking-wider mb-1.5">Subject Line</label>
                    <input
                      type="text"
                      value={composeSubject}
                      onChange={(e) => setComposeSubject(e.target.value)}
                      placeholder="e.g. Your Booking Confirmation - Bistro Flow"
                      className="w-full px-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-sm"
                      required
                    />
                  </div>

                  {/* AI Assistant Compose Helper */}
                  <div className="p-4 rounded-xl bg-amber-50/40 border border-amber-100/60 space-y-3">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900 uppercase">
                      <Sparkles size={14} className="text-amber-700" />
                      <span>Gemini AI Drafting Assistant</span>
                    </div>
                    <div className="flex gap-2">
                      <input
                        id="ai-compose-prompt"
                        type="text"
                        placeholder="What should this email be about? (e.g. confirm table for Marcus at 7pm)"
                        className="flex-1 px-3 py-2 bg-white border border-neutral-200 rounded-xl text-xs"
                      />
                      <button
                        type="button"
                        onClick={async () => {
                          const promptInput = document.getElementById('ai-compose-prompt') as HTMLInputElement;
                          const promptText = promptInput?.value || '';
                          if (!promptText.trim()) {
                            alert('Please write a brief prompt description first!');
                            return;
                          }
                          setAiDraftLoading(true);
                          try {
                            const res = await fetch('/api/ai/draft-email-reply', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({
                                emailSubject: composeSubject || 'Business update',
                                emailSnippet: 'Write a fresh email about: ' + promptText,
                                emailFrom: 'Bistro Flow Management',
                                replyTone: 'Warm & Thankful',
                                customInstructions: promptText
                              })
                            });
                            if (res.ok) {
                              const data = await res.json();
                              setComposeBody(data.replyText || '');
                            } else {
                              throw new Error();
                            }
                          } catch (e) {
                            alert('Failed to generate draft with Gemini AI.');
                          } finally {
                            setAiDraftLoading(false);
                          }
                        }}
                        disabled={aiDraftLoading}
                        className="px-4 py-2 bg-amber-700 hover:bg-amber-800 text-white rounded-xl text-xs font-semibold transition shrink-0 disabled:opacity-50"
                      >
                        {aiDraftLoading ? 'Writing...' : 'Draft with AI'}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-neutral-600 uppercase tracking-wider mb-1.5">Email Body</label>
                    <textarea
                      value={composeBody}
                      onChange={(e) => setComposeBody(e.target.value)}
                      rows={8}
                      placeholder="Write your email details here..."
                      className="w-full p-4 bg-neutral-50 border border-neutral-200 rounded-xl text-sm"
                      required
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-neutral-100">
                  <button
                    onClick={() => setComposeOpen(false)}
                    className="px-4 py-2.5 border border-neutral-200 rounded-xl text-xs font-semibold hover:bg-neutral-50 transition text-neutral-500"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => sendGmailMessage(composeTo, composeSubject, composeBody)}
                    disabled={isSendingEmail || !composeTo.trim() || !composeSubject.trim() || !composeBody.trim()}
                    className="px-6 py-2.5 bg-neutral-900 text-white rounded-xl text-xs font-semibold hover:bg-neutral-800 transition flex items-center gap-2 shadow-xs disabled:opacity-50"
                  >
                    <Send size={14} />
                    {isSendingEmail ? 'Sending...' : 'Send Email'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
