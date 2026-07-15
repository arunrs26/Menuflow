import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import { DatabaseSchema, MenuItem, Order, Reservation, Offer, RestaurantSettings } from './src/types.js';

// Initialize Gemini SDK safely
const apiKey = process.env.GEMINI_API_KEY;
let ai: GoogleGenAI | null = null;
if (apiKey && apiKey !== 'MY_GEMINI_API_KEY') {
  ai = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

const DB_FILE = path.join(process.cwd(), 'db.json');

// Helper to write database
function saveDb(data: DatabaseSchema) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving database:', err);
  }
}

// Helper to load database with rich seed data matching screenshots
function loadDb(): DatabaseSchema {
  try {
    if (fs.existsSync(DB_FILE)) {
      const content = fs.readFileSync(DB_FILE, 'utf-8');
      return JSON.parse(content);
    }
  } catch (err) {
    console.error('Error loading database, seeding instead:', err);
  }

  // Seed Data
  const defaultDb: DatabaseSchema = {
    menu: [
      {
        id: '1',
        name: 'Truffle Risotto',
        price: 28.00,
        description: 'Creamy Arborio rice slow-cooked with seasonal forest mushrooms, authentic Italian black truffles, and aged Parmigiano-Reggiano.',
        category: 'Starters',
        image: 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=600&auto=format&fit=crop&q=60',
        isVeg: true,
        isAvailable: true
      },
      {
        id: '2',
        name: 'Honey Chili Wings',
        price: 14.50,
        description: 'Double-fried crispy chicken wings tossed in a sweet and spicy house-made honey chili glaze, topped with toasted sesame.',
        category: 'Starters',
        image: 'https://images.unsplash.com/photo-1567620832903-9fc6debc209f?w=600&auto=format&fit=crop&q=60',
        isVeg: false,
        isAvailable: true
      },
      {
        id: '3',
        name: 'Classic Tiramisu',
        price: 12.00,
        description: 'Traditional Italian dessert with espresso-soaked ladyfingers, whipped mascarpone, and a dusting of premium Valrhona cocoa.',
        category: 'Desserts',
        image: 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=600&auto=format&fit=crop&q=60',
        isVeg: true,
        isAvailable: true
      },
      {
        id: '4',
        name: 'Wagyu Truffle Burger',
        price: 32.00,
        description: 'A juicy grade-A5 Wagyu patty with black truffle aioli, melted gruyere cheese, and caramelized onions on a warm toasted brioche bun.',
        category: 'Chef\'s Specials',
        image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&auto=format&fit=crop&q=60',
        isVeg: false,
        isAvailable: true
      },
      {
        id: '5',
        name: 'Signature Lobster Roll',
        price: 38.00,
        description: 'Freshly caught Maine lobster meat tossed in light herb mayo and warm clarified butter, stuffed in a toasted split-top roll.',
        category: 'Chef\'s Specials',
        image: 'https://images.unsplash.com/photo-1551248429-40975aa4de74?w=600&auto=format&fit=crop&q=60',
        isVeg: false,
        isAvailable: true
      },
      {
        id: '6',
        name: 'Artisanal Wood-fired Margherita',
        price: 18.00,
        description: 'Classic San Marzano tomato sauce, fresh buffalo mozzarella, aromatic basil, and a drizzle of extra virgin olive oil.',
        category: 'Main Course',
        image: 'https://images.unsplash.com/photo-1604068549290-dea0e4a305ca?w=600&auto=format&fit=crop&q=60',
        isVeg: true,
        isAvailable: true
      },
      {
        id: '7',
        name: 'Classic Garlic Bread',
        price: 8.00,
        description: 'Artisanal sourdough slices spread with rich garlic herb butter and roasted till perfectly golden and crisp.',
        category: 'Starters',
        image: 'https://images.unsplash.com/photo-1573140247632-f8fd74997d5c?w=600&auto=format&fit=crop&q=60',
        isVeg: true,
        isAvailable: true
      },
      {
        id: '8',
        name: 'Truffle Tagliatelle',
        price: 26.00,
        description: 'Hand-cut egg pasta tossed in a luxurious black truffle cream sauce with fresh parmigiano and micro herbs.',
        category: 'Main Course',
        image: 'https://images.unsplash.com/photo-1645112411341-6c4fd023714a?w=600&auto=format&fit=crop&q=60',
        isVeg: true,
        isAvailable: true
      }
    ],
    orders: [
      {
        id: '8924',
        customerName: 'Marcus Thorne',
        customerPhone: '+1 (555) 123-4567',
        items: [
          { id: '4', name: 'Wagyu Truffle Burger', quantity: 2, price: 32.00 },
          { id: '7', name: 'Classic Garlic Bread', quantity: 1, price: 8.00 }
        ],
        totalAmount: 72.00,
        status: 'pending',
        timestamp: new Date(Date.now() - 12 * 60 * 1000).toISOString(), // 12 mins ago
        orderType: 'direct',
        notes: 'Please cook burger medium-rare.'
      },
      {
        id: '8925',
        customerName: 'Sarah Jenkins',
        customerPhone: '+1 (555) 987-6543',
        items: [
          { id: '5', name: 'Signature Lobster Roll', quantity: 1, price: 38.00 }
        ],
        totalAmount: 38.00,
        status: 'pending',
        timestamp: new Date(Date.now() - 25 * 60 * 1000).toISOString(), // 25 mins ago, overdue
        orderType: 'direct',
        notes: 'Extra clarified butter on the side'
      },
      {
        id: '8918',
        customerName: 'David K.',
        customerPhone: '+1 (555) 234-5678',
        items: [
          { id: '1', name: 'Truffle Risotto', quantity: 1, price: 28.00 },
          { id: '8', name: 'Truffle Tagliatelle', quantity: 1, price: 26.00 }
        ],
        totalAmount: 54.00,
        status: 'preparing',
        timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
        orderType: 'direct',
        notes: 'Extra Parmigiano'
      },
      {
        id: '8912',
        customerName: 'Elena Rossi',
        customerPhone: '+39 333 456 7890',
        items: [
          { id: '3', name: 'Classic Tiramisu', quantity: 2, price: 12.00 }
        ],
        totalAmount: 24.00,
        status: 'ready',
        timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
        orderType: 'whatsapp',
        notes: 'Please write Happy Anniversary on the box'
      }
    ],
    reservations: [
      {
        id: 'res-1',
        customerName: 'Anjali Sharma',
        customerPhone: '+91 98765 43210',
        date: new Date().toISOString().split('T')[0],
        time: '19:30',
        guests: 4,
        status: 'pending',
        notes: 'Window table preferred if available.',
        createdAt: new Date().toISOString()
      },
      {
        id: 'res-2',
        customerName: 'Robert Vance',
        customerPhone: '+1 (555) 765-4321',
        date: new Date(Date.now() + 86400000).toISOString().split('T')[0], // tomorrow
        time: '20:00',
        guests: 2,
        status: 'confirmed',
        notes: 'Birthday celebration.',
        createdAt: new Date().toISOString()
      }
    ],
    offers: [
      {
        code: 'WELCOME10',
        discountPercent: 10,
        description: 'Get 10% off on your first order with us!',
        isActive: true
      },
      {
        code: 'BISTRO20',
        discountPercent: 20,
        description: 'Special weekend discount for gourmet lovers.',
        isActive: true
      }
    ],
    settings: {
      restaurantName: 'Bistro Flow',
      tagline: 'Your Restaurant. Your Website. Your Customers.',
      logoUrl: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=200&h=200&fit=crop',
      themeColor: 'orange',
      businessHours: 'Mon - Sun: 11:00 AM - 11:00 PM',
      whatsappNumber: '+919876543210',
      email: 'hello@bistroflow.com',
      location: '123 Gourmet Blvd, Food District, Bangalore, KA - 560001',
      googleMapUrl: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3887.9234857476597!2d77.591415!3d12.971598!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3bae1670c0000001%3A0x1b5a6c6df9b1d1e4!2sBangalore%20Palace!5e0!3m2!1sen!2sin!4v1625000000000!5m2!1sen!2sin',
      socialLinks: {
        instagram: 'https://instagram.com/bistroflow',
        facebook: 'https://facebook.com/bistroflow'
      },
      bannerImage: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=1200&h=600&fit=crop'
    }
  };

  saveDb(defaultDb);
  return defaultDb;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Route: Get Database state
  app.get('/api/db', (req, res) => {
    res.json(loadDb());
  });

  // API Route: Update Restaurant Settings
  app.post('/api/settings', (req, res) => {
    const db = loadDb();
    db.settings = { ...db.settings, ...req.body };
    saveDb(db);
    res.json(db.settings);
  });

  // API Route: Save / Update Menu Item
  app.post('/api/menu', (req, res) => {
    const db = loadDb();
    const item: MenuItem = req.body;
    
    if (!item.id) {
      item.id = Date.now().toString();
      db.menu.push(item);
    } else {
      const idx = db.menu.findIndex(m => m.id === item.id);
      if (idx !== -1) {
        db.menu[idx] = item;
      } else {
        db.menu.push(item);
      }
    }
    
    saveDb(db);
    res.json({ success: true, item, menu: db.menu });
  });

  // API Route: Delete Menu Item
  app.delete('/api/menu/:id', (req, res) => {
    const db = loadDb();
    const { id } = req.params;
    db.menu = db.menu.filter(m => m.id !== id);
    saveDb(db);
    res.json({ success: true, menu: db.menu });
  });

  // API Route: Create Order
  app.post('/api/orders', (req, res) => {
    const db = loadDb();
    const newOrder: Order = {
      id: Math.floor(1000 + Math.random() * 9000).toString(), // Random 4-digit ID
      status: 'pending',
      timestamp: new Date().toISOString(),
      customerName: req.body.customerName || 'Walk-in Customer',
      customerPhone: req.body.customerPhone || '',
      items: req.body.items || [],
      totalAmount: req.body.totalAmount || 0,
      orderType: req.body.orderType || 'direct',
      notes: req.body.notes || ''
    };

    db.orders.unshift(newOrder); // Add to beginning of list
    saveDb(db);
    res.json({ success: true, order: newOrder });
  });

  // API Route: Update Order Status
  app.post('/api/orders/:id/status', (req, res) => {
    const db = loadDb();
    const { id } = req.params;
    const { status } = req.body;

    const idx = db.orders.findIndex(o => o.id === id);
    if (idx !== -1) {
      db.orders[idx].status = status;
      saveDb(db);
      res.json({ success: true, order: db.orders[idx] });
    } else {
      res.status(404).json({ error: 'Order not found' });
    }
  });

  // API Route: Create Reservation
  app.post('/api/reservations', (req, res) => {
    const db = loadDb();
    const newRes: Reservation = {
      id: 'res-' + Date.now().toString(),
      customerName: req.body.customerName,
      customerPhone: req.body.customerPhone,
      date: req.body.date,
      time: req.body.time,
      guests: Number(req.body.guests) || 2,
      status: 'pending',
      notes: req.body.notes || '',
      createdAt: new Date().toISOString()
    };

    db.reservations.unshift(newRes);
    saveDb(db);
    res.json({ success: true, reservation: newRes });
  });

  // API Route: Update Reservation Status
  app.post('/api/reservations/:id/status', (req, res) => {
    const db = loadDb();
    const { id } = req.params;
    const { status } = req.body;

    const idx = db.reservations.findIndex(r => r.id === id);
    if (idx !== -1) {
      db.reservations[idx].status = status;
      saveDb(db);
      res.json({ success: true, reservation: db.reservations[idx] });
    } else {
      res.status(404).json({ error: 'Reservation not found' });
    }
  });

  // API Route: Update/Add Offer
  app.post('/api/offers', (req, res) => {
    const db = loadDb();
    const offer: Offer = req.body;

    const idx = db.offers.findIndex(o => o.code.toUpperCase() === offer.code.toUpperCase());
    if (idx !== -1) {
      db.offers[idx] = offer;
    } else {
      db.offers.push(offer);
    }

    saveDb(db);
    res.json({ success: true, offers: db.offers });
  });

  // API Route: AI Description Generator using @google/genai
  app.post('/api/ai/describe', async (req, res) => {
    const { name, ingredients, tone = 'Sophisticated', length = 'Standard' } = req.body;
    if (!name) {
      return res.status(400).json({ error: 'Dish name is required' });
    }

    const prompt = `Write a menu description for a dish named "${name}"${
      ingredients ? ` with key ingredients: ${ingredients}` : ''
    }. 
    The tone should be ${tone}. 
    Length should be ${length === 'Short' ? 'under 15 words' : length === 'Long' ? 'around 50-60 words' : 'around 25-30 words'}. 
    Return only the beautifully crafted description, without any quotes or introductory text.`;

    try {
      if (ai) {
        const response = await ai.models.generateContent({
          model: 'gemini-3.5-flash',
          contents: prompt,
        });
        res.json({ description: response.text?.trim() });
      } else {
        // High-quality localized fallback descriptions if API key is not active
        const fallbacks: Record<string, string> = {
          'Truffle Risotto': 'Creamy Arborio rice slow-cooked with seasonal forest mushrooms, authentic Italian black truffles, and aged Parmigiano-Reggiano.',
          'Honey Chili Wings': 'Double-fried crispy chicken wings tossed in a sweet and spicy house-made honey chili glaze, topped with toasted sesame.',
          'Classic Tiramisu': 'Traditional Italian dessert with espresso-soaked ladyfingers, whipped mascarpone, and a dusting of premium Valrhona cocoa.'
        };
        const defaultDesc = `An exquisite presentation of culinary art featuring premium ingredients, crafted to perfection with an unforgettable blend of rich textures and delicate flavors.`;
        const description = fallbacks[name] || defaultDesc;
        res.json({ description, isFallback: true });
      }
    } catch (err: any) {
      console.error('AI describe error:', err);
      res.status(500).json({ error: 'Failed to generate description with AI. Using custom default.', details: err.message });
    }
  });

  // API Route: AI Translation
  app.post('/api/ai/translate', async (req, res) => {
    const { name, description, targetLang } = req.body;
    if (!name || !targetLang) {
      return res.status(400).json({ error: 'Name and target language are required.' });
    }

    const prompt = `Translate the following menu item to language: "${targetLang}".
    Name: "${name}"
    Description: "${description || ''}"
    
    Respond strictly in JSON format matching the schema below:
    {
      "name": "Translated Name",
      "description": "Translated Description"
    }`;

    try {
      if (ai) {
        const response = await ai.models.generateContent({
          model: 'gemini-3.5-flash',
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                description: { type: Type.STRING }
              },
              required: ['name', 'description']
            }
          }
        });
        res.json(JSON.parse(response.text?.trim() || '{}'));
      } else {
        // Fallback translation
        const fallbacks: Record<string, Record<string, { name: string, description: string }>> = {
          ES: {
            'Truffle Risotto': { name: 'Risotto de Trufa', description: 'Arroz Arborio cremoso cocinado a fuego lento con champiñones silvestres de temporada, trufas negras italianas auténticas y queso Parmigiano-Reggiano envejecido.' }
          },
          FR: {
            'Truffle Risotto': { name: 'Risotto aux Truffes', description: 'Riz Arborio crémeux mijoté avec des champignons des bois de saison, de véritables truffes noires italiennes et du Parmigiano-Reggiano affiné.' }
          }
        };
        const defaultTrans = {
          name: `${name} (${targetLang})`,
          description: description ? `${description} (Translated to ${targetLang})` : ''
        };
        res.json(fallbacks[targetLang]?.[name] || defaultTrans);
      }
    } catch (err: any) {
      console.error('AI translation error:', err);
      res.status(500).json({ error: 'Failed to translate' });
    }
  });

  // API Route: AI SEO & Keyword Generation
  app.post('/api/ai/seo', async (req, res) => {
    const { name, category, description } = req.body;
    const prompt = `Generate 5 search keywords and delivery application tags for a restaurant menu item named "${name}" in category "${category}". 
    Description: "${description || ''}".
    Return a list of tags. Ensure they are SEO optimized for food search.
    Respond strictly in JSON format matching the schema below:
    {
      "keywords": ["tag1", "tag2", "tag3", "tag4", "tag5"],
      "seoScore": 92
    }`;

    try {
      if (ai) {
        const response = await ai.models.generateContent({
          model: 'gemini-3.5-flash',
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                keywords: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING }
                },
                seoScore: { type: Type.INTEGER }
              },
              required: ['keywords', 'seoScore']
            }
          }
        });
        res.json(JSON.parse(response.text?.trim() || '{}'));
      } else {
        // Fallback keywords
        const defaultKeywords = ['#fine_dining', '#comfort_food', `#local_eats`, `#${category.toLowerCase().replace(/[^a-z]/g, '_')}`, `#gourmet_${name.toLowerCase().replace(/[^a-z]/g, '_')}`];
        res.json({
          keywords: defaultKeywords,
          seoScore: 92
        });
      }
    } catch (err: any) {
      console.error('AI SEO error:', err);
      res.status(500).json({ error: 'Failed to generate SEO keywords' });
    }
  });

  // Serve static files in production / Vite middlewares in dev
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
