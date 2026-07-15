import { useState, useEffect } from 'react';
import { Sparkles, Globe, Settings, Terminal, ShieldAlert } from 'lucide-react';
import { MenuItem, Order, Reservation, Offer, RestaurantSettings } from './types';
import CustomerSite from './components/CustomerSite';
import AdminTerminal from './components/AdminTerminal';

export default function App() {
  const [userRole, setUserRole] = useState<'customer' | 'admin'>('admin');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // App Database State
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [settings, setSettings] = useState<RestaurantSettings | null>(null);

  // Fetch all data from backend
  const fetchDbState = async () => {
    try {
      const response = await fetch('/api/db');
      if (!response.ok) throw new Error('Failed to retrieve restaurant records');
      const data = await response.json();
      
      setMenu(data.menu || []);
      setOrders(data.orders || []);
      setReservations(data.reservations || []);
      setOffers(data.offers || []);
      setSettings(data.settings || null);
      setError('');
    } catch (err: any) {
      console.error(err);
      setError('Could not connect to the backend server. Make sure Vite server is fully booted.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDbState();
    
    // Poll the backend periodically to get live updates of orders and reservations
    const interval = setInterval(fetchDbState, 8000);
    return () => clearInterval(interval);
  }, []);

  // Update settings handler
  const handleUpdateSettings = async (newSettings: Partial<RestaurantSettings>) => {
    try {
      const response = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSettings)
      });
      if (response.ok) {
        const updated = await response.json();
        setSettings(updated);
      }
    } catch (err) {
      console.error('Failed to update settings:', err);
    }
  };

  // Save / Edit menu item handler
  const handleSaveMenuItem = async (item: MenuItem) => {
    try {
      const response = await fetch('/api/menu', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item)
      });
      if (response.ok) {
        await fetchDbState(); // Re-sync state
      }
    } catch (err) {
      console.error('Failed to save menu item:', err);
    }
  };

  // Delete menu item handler
  const handleDeleteMenuItem = async (id: string) => {
    try {
      const response = await fetch(`/api/menu/${id}`, {
        method: 'DELETE'
      });
      if (response.ok) {
        await fetchDbState();
      }
    } catch (err) {
      console.error('Failed to delete menu item:', err);
    }
  };

  // Place order handler from customer
  const handlePlaceOrder = async (orderData: {
    customerName: string;
    customerPhone: string;
    items: any[];
    totalAmount: number;
    orderType: 'whatsapp' | 'direct';
    notes: string;
  }) => {
    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData)
      });
      if (response.ok) {
        const data = await response.json();
        await fetchDbState();
        return { success: true, order: data.order };
      }
    } catch (err) {
      console.error('Failed to place order:', err);
    }
    return { success: false };
  };

  // Update order status from admin kanban
  const handleUpdateOrderStatus = async (id: string, status: Order['status']) => {
    try {
      const response = await fetch(`/api/orders/${id}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      if (response.ok) {
        await fetchDbState();
      }
    } catch (err) {
      console.error('Failed to update order status:', err);
    }
  };

  // Book table from customer
  const handleBookTable = async (resData: {
    customerName: string;
    customerPhone: string;
    date: string;
    time: string;
    guests: number;
    notes: string;
  }) => {
    try {
      const response = await fetch('/api/reservations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(resData)
      });
      if (response.ok) {
        await fetchDbState();
        return true;
      }
    } catch (err) {
      console.error('Failed to book table:', err);
    }
    return false;
  };

  // Update reservation status from admin panel
  const handleUpdateReservationStatus = async (id: string, status: Reservation['status']) => {
    try {
      const response = await fetch(`/api/reservations/${id}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      if (response.ok) {
        await fetchDbState();
      }
    } catch (err) {
      console.error('Failed to update reservation status:', err);
    }
  };

  // Save / Toggle offer coupons
  const handleSaveOffer = async (offer: Offer) => {
    try {
      const response = await fetch('/api/offers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(offer)
      });
      if (response.ok) {
        await fetchDbState();
      }
    } catch (err) {
      console.error('Failed to save offer coupon:', err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-950 text-white flex flex-col items-center justify-center p-6 text-center">
        <div className="p-4 rounded-full bg-amber-700/10 text-amber-500 mb-4 animate-pulse">
          <Sparkles size={40} />
        </div>
        <h4 className="font-serif text-lg font-bold">Initializing MenuFlow Engine</h4>
        <p className="text-neutral-500 text-xs mt-1.5 max-w-sm">Please wait while the full-stack database system mounts assets and configures local services.</p>
      </div>
    );
  }

  if (error || !settings) {
    return (
      <div className="min-h-screen bg-neutral-950 text-white flex flex-col items-center justify-center p-6 text-center">
        <ShieldAlert size={48} className="text-red-500 mb-4" />
        <h4 className="font-serif text-lg font-bold">Mounting Failures Occurred</h4>
        <p className="text-neutral-400 text-xs mt-2 max-w-md">{error || 'Unable to connect to the backend server.'}</p>
        <button 
          onClick={fetchDbState}
          className="mt-6 px-5 py-2.5 bg-amber-700 hover:bg-amber-800 text-white rounded-xl text-xs font-semibold"
        >
          Retry Connection
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Floating Global Role Switcher Pill Bar */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-neutral-950/90 text-white px-5 py-3 rounded-full shadow-2xl border border-neutral-800 backdrop-blur-md flex items-center gap-4 text-xs font-bold">
        <span className="text-neutral-400 text-[10px] uppercase tracking-wider">Current View:</span>
        <div className="flex gap-1.5 bg-white/10 p-1 rounded-full">
          <button
            id="role-btn-customer"
            onClick={() => setUserRole('customer')}
            className={`px-4 py-1.5 rounded-full transition ${
              userRole === 'customer' 
                ? 'bg-amber-700 text-white' 
                : 'text-neutral-300 hover:text-white hover:bg-white/5'
            }`}
          >
            <Globe size={14} className="inline mr-1.5" /> Customer Website
          </button>
          <button
            id="role-btn-admin"
            onClick={() => setUserRole('admin')}
            className={`px-4 py-1.5 rounded-full transition ${
              userRole === 'admin' 
                ? 'bg-amber-700 text-white' 
                : 'text-neutral-300 hover:text-white hover:bg-white/5'
            }`}
          >
            <Terminal size={14} className="inline mr-1.5" /> Admin Dashboard
          </button>
        </div>
      </div>

      {/* Main Viewport */}
      <div className="flex-1 pb-16">
        {userRole === 'customer' ? (
          <CustomerSite 
            settings={settings}
            menu={menu}
            offers={offers}
            onPlaceOrder={handlePlaceOrder}
            onBookTable={handleBookTable}
          />
        ) : (
          <AdminTerminal 
            settings={settings}
            menu={menu}
            orders={orders}
            reservations={reservations}
            offers={offers}
            onUpdateSettings={handleUpdateSettings}
            onSaveMenuItem={handleSaveMenuItem}
            onDeleteMenuItem={handleDeleteMenuItem}
            onUpdateOrderStatus={handleUpdateOrderStatus}
            onUpdateReservationStatus={handleUpdateReservationStatus}
            onSaveOffer={handleSaveOffer}
            onSwitchToCustomer={() => setUserRole('customer')}
          />
        )}
      </div>
    </div>
  );
}
