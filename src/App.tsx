import { useState, useEffect } from 'react';
import { Sparkles, Globe, Settings, Terminal, ShieldAlert, Lock } from 'lucide-react';
import { MenuItem, Order, Reservation, Offer, RestaurantSettings } from './types';
import CustomerSite from './components/CustomerSite';
import AdminTerminal from './components/AdminTerminal';

// Import Firebase config & helpers
import { db, auth, OperationType, handleFirestoreError } from './firebase';
import { onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut } from 'firebase/auth';
import { collection, doc, onSnapshot, setDoc, updateDoc, deleteDoc, getDoc } from 'firebase/firestore';

// Default seed structures matching original db.json
const defaultSettings: RestaurantSettings = {
  restaurantName: "My Restaurant",
  tagline: "Your Restaurant tagline here.",
  logoUrl: "",
  themeColor: "orange",
  businessHours: "Mon - Sun: 11:00 AM - 11:00 PM",
  whatsappNumber: "",
  email: "contact@myrestaurant.com",
  location: "H-No 1-57, Ginnedhari, Thiryani, DIST: Komaram Bheem Asifabad, Telangana 504297.",
  googleMapUrl: "",
  socialLinks: {
    instagram: "",
    facebook: ""
  },
  bannerImage: ""
};

const defaultMenu: MenuItem[] = [];

const defaultOffers: Offer[] = [];

const defaultOrders: Order[] = [];

const defaultReservations: Reservation[] = [];

export default function App() {
  const [userRole, setUserRole] = useState<'customer' | 'admin'>('customer');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Firebase Auth State
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [googleAccessToken, setGoogleAccessToken] = useState<string | null>(null);

  // App Database State
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [settings, setSettings] = useState<RestaurantSettings | null>(null);

  // Synchronize base metadata, config and public records in real-time
  useEffect(() => {
    // 1. Unsubscribe handler for Auth state change
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });

    // 2. Real-time subscription to global restaurant settings
    const unsubscribeSettings = onSnapshot(doc(db, 'settings', 'restaurant'), (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data() as RestaurantSettings;
        setSettings(data);
        setLoading(false);
        setError('');

        // Auto-migrate placeholder address to user's real address
        if (data.location === "Enter Restaurant Address Here" || !data.location || data.location.trim() === "") {
          updateDoc(doc(db, 'settings', 'restaurant'), {
            location: "H-No 1-57, Ginnedhari, Thiryani, DIST: Komaram Bheem Asifabad, Telangana 504297."
          }).catch((err) => console.error("Failed to auto-update location:", err));
        }
      } else {
        console.log("No restaurant settings found in Firestore, using default local settings.");
        setSettings(defaultSettings);
        setLoading(false);
        setError('');
      }
    }, (err) => {
      handleFirestoreError(err, OperationType.GET, 'settings/restaurant');
    });

    // 3. Real-time menu updates
    const unsubscribeMenu = onSnapshot(collection(db, 'menu'), (snapshot) => {
      const items: MenuItem[] = [];
      snapshot.forEach((doc) => {
        items.push(doc.data() as MenuItem);
      });
      setMenu(items.length > 0 ? items : defaultMenu);
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, 'menu');
    });

    // 4. Real-time offer coupons
    const unsubscribeOffers = onSnapshot(collection(db, 'offers'), (snapshot) => {
      const items: Offer[] = [];
      snapshot.forEach((doc) => {
        items.push(doc.data() as Offer);
      });
      setOffers(items.length > 0 ? items : defaultOffers);
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, 'offers');
    });

    return () => {
      unsubscribeAuth();
      unsubscribeSettings();
      unsubscribeMenu();
      unsubscribeOffers();
    };
  }, []);

  // Sync protected collections (orders & reservations) in real-time strictly if signed-in as verified admin
  useEffect(() => {
    let unsubscribeOrders = () => {};
    let unsubscribeReservations = () => {};

    const isUserAdmin = currentUser && currentUser.email === "arunbunnychitti111@gmail.com" && currentUser.emailVerified === true;

    if (isUserAdmin) {
      unsubscribeOrders = onSnapshot(collection(db, 'orders'), (snapshot) => {
        const items: Order[] = [];
        snapshot.forEach((doc) => {
          items.push(doc.data() as Order);
        });
        // Sort newest first
        items.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        setOrders(items);
      }, (err) => {
        handleFirestoreError(err, OperationType.LIST, 'orders');
      });

      unsubscribeReservations = onSnapshot(collection(db, 'reservations'), (snapshot) => {
        const items: Reservation[] = [];
        snapshot.forEach((doc) => {
          items.push(doc.data() as Reservation);
        });
        // Sort newest first
        items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setReservations(items);
      }, (err) => {
        handleFirestoreError(err, OperationType.LIST, 'reservations');
      });
    } else {
      setOrders([]);
      setReservations([]);
    }

    return () => {
      unsubscribeOrders();
      unsubscribeReservations();
    };
  }, [currentUser]);

  // Seeding helper that only runs when the verified Admin is logged in
  useEffect(() => {
    const isUserAdmin = currentUser && currentUser.email === "arunbunnychitti111@gmail.com" && currentUser.emailVerified === true;
    if (isUserAdmin) {
      const seedDb = async () => {
        try {
          const settingsSnap = await getDoc(doc(db, 'settings', 'restaurant'));
          if (!settingsSnap.exists()) {
            console.log("[Admin Autoseed] No restaurant settings in Firestore. Seeding defaults...");
            await setDoc(doc(db, 'settings', 'restaurant'), defaultSettings);
            
            // Seed Menu
            for (const item of defaultMenu) {
              await setDoc(doc(db, 'menu', item.id), item);
            }
            // Seed Offers
            for (const offer of defaultOffers) {
              await setDoc(doc(db, 'offers', offer.code), offer);
            }
            // Seed Orders
            for (const order of defaultOrders) {
              await setDoc(doc(db, 'orders', order.id), order);
            }
            // Seed Reservations
            for (const res of defaultReservations) {
              await setDoc(doc(db, 'reservations', res.id), res);
            }
            console.log("[Admin Autoseed] Database seeded successfully in Firestore!");
          }
        } catch (err) {
          console.error("[Admin Autoseed] Seeding failed:", err);
        }
      };
      seedDb();
    }
  }, [currentUser]);

  // Auth Handlers
  const handleSignInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    provider.addScope('https://mail.google.com/');
    provider.addScope('https://www.googleapis.com/auth/gmail.compose');
    provider.addScope('https://www.googleapis.com/auth/gmail.modify');
    provider.addScope('https://www.googleapis.com/auth/gmail.readonly');
    provider.addScope('https://www.googleapis.com/auth/gmail.send');
    provider.setCustomParameters({ prompt: 'select_account' });
    try {
      const result = await signInWithPopup(auth, provider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      if (credential?.accessToken) {
        setGoogleAccessToken(credential.accessToken);
      }
    } catch (err) {
      console.error('Google Sign-In failed:', err);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      setGoogleAccessToken(null);
    } catch (err) {
      console.error('Sign out failed:', err);
    }
  };

  // Update settings handler
  const handleUpdateSettings = async (newSettings: Partial<RestaurantSettings>) => {
    try {
      const docRef = doc(db, 'settings', 'restaurant');
      await setDoc(docRef, { ...settings, ...newSettings }, { merge: true });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, 'settings/restaurant');
    }
  };

  // Save / Edit menu item handler
  const handleSaveMenuItem = async (item: MenuItem) => {
    try {
      const id = item.id || Date.now().toString();
      const itemToSave = { ...item, id };
      await setDoc(doc(db, 'menu', id), itemToSave);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'menu');
    }
  };

  // Delete menu item handler
  const handleDeleteMenuItem = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'menu', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `menu/${id}`);
    }
  };

  // Place order handler from customer (guests can place)
  const handlePlaceOrder = async (orderData: {
    customerName: string;
    customerPhone: string;
    items: any[];
    totalAmount: number;
    orderType: 'whatsapp' | 'direct';
    notes: string;
    tableNumber?: string;
  }) => {
    try {
      const id = Math.floor(1000 + Math.random() * 9000).toString();
      const newOrder: Order = {
        id,
        status: 'pending',
        timestamp: new Date().toISOString(),
        customerName: orderData.customerName || 'Walk-in Customer',
        customerPhone: orderData.customerPhone || '',
        items: orderData.items || [],
        totalAmount: orderData.totalAmount || 0,
        orderType: orderData.orderType || 'direct',
        notes: orderData.notes || '',
        tableNumber: orderData.tableNumber || undefined
      };
      await setDoc(doc(db, 'orders', id), newOrder);
      return { success: true, order: newOrder };
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'orders');
      return { success: false };
    }
  };

  // Update order status from admin kanban
  const handleUpdateOrderStatus = async (id: string, status: Order['status']) => {
    try {
      await updateDoc(doc(db, 'orders', id), { status });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `orders/${id}`);
    }
  };

  // Book table from customer (guests can book)
  const handleBookTable = async (resData: {
    customerName: string;
    customerPhone: string;
    date: string;
    time: string;
    guests: number;
    notes: string;
  }) => {
    try {
      const id = 'res-' + Date.now().toString();
      const newRes: Reservation = {
        id,
        customerName: resData.customerName,
        customerPhone: resData.customerPhone,
        date: resData.date,
        time: resData.time,
        guests: Number(resData.guests) || 2,
        status: 'pending',
        notes: resData.notes || '',
        createdAt: new Date().toISOString()
      };
      await setDoc(doc(db, 'reservations', id), newRes);
      return true;
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'reservations');
      return false;
    }
  };

  // Update reservation status from admin panel
  const handleUpdateReservationStatus = async (id: string, status: Reservation['status']) => {
    try {
      await updateDoc(doc(db, 'reservations', id), { status });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `reservations/${id}`);
    }
  };

  // Save / Toggle offer coupons
  const handleSaveOffer = async (offer: Offer) => {
    try {
      const code = offer.code.toUpperCase();
      await setDoc(doc(db, 'offers', code), {
        code,
        discountPercent: Number(offer.discountPercent),
        description: offer.description,
        isActive: offer.isActive
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `offers/${offer.code}`);
    }
  };

  // Wipe all database data (clear existing mock/sample data)
  const handleWipeDatabase = async () => {
    try {
      // 1. Delete menu items from Firestore
      for (const item of menu) {
        await deleteDoc(doc(db, 'menu', item.id));
      }
      // 2. Delete offers from Firestore
      for (const offer of offers) {
        await deleteDoc(doc(db, 'offers', offer.code));
      }
      // 3. Delete orders from Firestore
      for (const order of orders) {
        await deleteDoc(doc(db, 'orders', order.id));
      }
      // 4. Delete reservations from Firestore
      for (const res of reservations) {
        await deleteDoc(doc(db, 'reservations', res.id));
      }
      // 5. Reset settings in Firestore to the clean defaultSettings
      await setDoc(doc(db, 'settings', 'restaurant'), defaultSettings);
      console.log("Database successfully reset!");
    } catch (err) {
      console.error("Failed to wipe database:", err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-950 text-white flex flex-col items-center justify-center p-6 text-center">
        <div className="p-4 rounded-full bg-amber-700/10 text-amber-500 mb-4 animate-pulse">
          <Sparkles size={40} />
        </div>
        <h4 className="font-serif text-lg font-bold">Initializing MenuFlow Engine</h4>
        <p className="text-neutral-500 text-xs mt-1.5 max-w-sm">Please wait while the full-stack database system mounts cloud assets and configures secure Firestore listeners.</p>
      </div>
    );
  }

  if (error || !settings) {
    return (
      <div className="min-h-screen bg-neutral-950 text-white flex flex-col items-center justify-center p-6 text-center">
        <ShieldAlert size={48} className="text-red-500 mb-4" />
        <h4 className="font-serif text-lg font-bold">Mounting Failures Occurred</h4>
        <p className="text-neutral-400 text-xs mt-2 max-w-md">{error || 'Unable to connect to the cloud server.'}</p>
        <button 
          onClick={() => window.location.reload()}
          className="mt-6 px-5 py-2.5 bg-amber-700 hover:bg-amber-800 text-white rounded-none text-xs font-bold uppercase tracking-widest"
        >
          Reload Interface
        </button>
      </div>
    );
  }

  const isUserAdmin = currentUser && currentUser.email === "arunbunnychitti111@gmail.com" && currentUser.emailVerified === true;

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
          /* Secure Auth Wall for Admin Terminal */
          !isUserAdmin ? (
            <div className="min-h-[85vh] bg-neutral-50 flex items-center justify-center p-6">
              <div className="w-full max-w-md bg-white border-2 border-neutral-950 p-8 shadow-none text-center">
                <div className="w-16 h-16 bg-neutral-950 text-white flex items-center justify-center mx-auto mb-6">
                  <Lock size={32} />
                </div>
                <h2 className="text-2xl font-black uppercase tracking-tighter text-neutral-950 mb-2">Secure Admin Terminal</h2>
                <p className="text-neutral-500 text-xs leading-relaxed max-w-xs mx-auto mb-6 font-medium">
                  This panel is secured by Zero-Trust Firestore Security rules. Please authenticate with your registered Google Administrator account to manage live orders and menus.
                </p>

                {currentUser ? (
                  // Logged in but not verified email/admin
                  <div className="mb-6 p-4 bg-red-50 border border-red-200 text-left">
                    <p className="text-red-800 text-xs font-bold uppercase tracking-wider mb-1">Access Denied</p>
                    <p className="text-red-700 text-xs font-medium leading-relaxed">
                      Logged in as <strong className="break-all">{currentUser.email}</strong>, which is not verified as the administrator of this project.
                    </p>
                    <button
                      onClick={handleSignOut}
                      className="mt-3 text-neutral-950 underline text-xs font-bold hover:text-neutral-800 uppercase tracking-wider"
                    >
                      Sign Out / Switch Account
                    </button>
                  </div>
                ) : null}

                <button
                  id="google-signin-btn"
                  onClick={handleSignInWithGoogle}
                  className="w-full py-4 bg-neutral-950 hover:bg-neutral-900 active:bg-neutral-950 text-white font-black text-xs uppercase tracking-widest transition flex items-center justify-center gap-3 border-2 border-neutral-950"
                >
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path d="M12.24 10.285V13.4h6.887C18.2 15.614 15.645 18 12.24 18c-3.86 0-7-3.14-7-7s3.14-7 7-7c1.71 0 3.28.61 4.5 1.625l2.437-2.437C17.312 1.696 14.933 1 12.24 1 6.58 1 2 5.58 2 11.24s4.58 10.24 10.24 10.24c5.795 0 10.254-4.074 10.254-10.24 0-.69-.08-1.355-.22-1.955H12.24z"/>
                  </svg>
                  Sign In with Google
                </button>
              </div>
            </div>
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
              currentUser={currentUser}
              onSignOut={handleSignOut}
              onWipeDatabase={handleWipeDatabase}
              googleAccessToken={googleAccessToken}
              onConnectGmail={handleSignInWithGoogle}
              onTokenAcquired={setGoogleAccessToken}
            />
          )
        )}
      </div>
    </div>
  );
}
