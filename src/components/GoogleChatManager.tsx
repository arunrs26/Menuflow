import React, { useState, useEffect } from 'react';
import { 
  MessageSquare, Plus, Trash2, Sparkles, RefreshCw, 
  AlertTriangle, Send, Users, CheckCircle2, X, PlusCircle,
  Hash, ShieldAlert, Layers, Bell, Check, ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { MenuItem, Order, Reservation, RestaurantSettings } from '../types';

interface GoogleChatManagerProps {
  accessToken: string | null;
  onTokenAcquired: (token: string | null) => void;
  onTokenCleared: () => void;
  restaurantName: string;
  orders: Order[];
  reservations: Reservation[];
}

interface ChatSpace {
  name: string;
  displayName?: string;
  spaceType?: 'SPACE' | 'GROUP_CHAT' | 'DIRECT_MESSAGE';
  singleUserBotDm?: boolean;
}

interface ChatMessage {
  name: string;
  text: string;
  createTime: string;
  sender?: {
    displayName?: string;
    avatarUrl?: string;
    type?: string;
  };
}

export default function GoogleChatManager({
  accessToken,
  onTokenAcquired,
  onTokenCleared,
  restaurantName,
  orders,
  reservations
}: GoogleChatManagerProps) {
  // Chat API state
  const [spaces, setSpaces] = useState<ChatSpace[]>([]);
  const [selectedSpaceId, setSelectedSpaceId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loadingSpaces, setLoadingSpaces] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // New message / Space Creation state
  const [messageText, setMessageText] = useState('');
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [newSpaceName, setNewSpaceName] = useState('');
  const [isCreatingSpace, setIsCreatingSpace] = useState(false);
  const [showCreateSpaceModal, setShowCreateSpaceModal] = useState(false);

  // Gemini AI state
  const [aiTone, setAiTone] = useState('Professional');
  const [aiTopic, setAiTopic] = useState('');
  const [aiDraftLoading, setAiDraftLoading] = useState(false);
  const [aiDraftResult, setAiDraftResult] = useState('');

  // Notification Config state
  const [notificationSpaceId, setNotificationSpaceId] = useState<string>('');
  const [orderAlertsEnabled, setOrderAlertsEnabled] = useState(false);
  const [bookingAlertsEnabled, setBookingAlertsEnabled] = useState(false);
  const [alertSuccess, setAlertSuccess] = useState(false);

  // Load configuration from local storage if available
  useEffect(() => {
    const savedSpaceId = localStorage.getItem('menuflow_chat_alert_space_id');
    const savedOrderAlerts = localStorage.getItem('menuflow_chat_order_alerts');
    const savedBookingAlerts = localStorage.getItem('menuflow_chat_booking_alerts');
    
    if (savedSpaceId) setNotificationSpaceId(savedSpaceId);
    if (savedOrderAlerts) setOrderAlertsEnabled(savedOrderAlerts === 'true');
    if (savedBookingAlerts) setBookingAlertsEnabled(savedBookingAlerts === 'true');
  }, []);

  // Fetch all chat spaces
  const loadChatSpaces = async () => {
    if (!accessToken) return;
    setLoadingSpaces(true);
    setError(null);
    try {
      const response = await fetch('https://chat.googleapis.com/v1/spaces', {
        headers: { Authorization: `Bearer ${accessToken}` }
      });

      if (!response.ok) {
        if (response.status === 401) {
          onTokenCleared();
          throw new Error('Access token expired. Please reauthenticate.');
        }
        throw new Error(`Failed to list Google Chat spaces: ${response.statusText}`);
      }

      const data = await response.json();
      const loadedSpaces = data.spaces || [];
      setSpaces(loadedSpaces);
      
      // Select first space automatically if none selected
      if (loadedSpaces.length > 0 && !selectedSpaceId) {
        setSelectedSpaceId(loadedSpaces[0].name);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to fetch Google Chat Spaces.');
    } finally {
      setLoadingSpaces(false);
    }
  };

  // Fetch messages for selected space
  const loadMessages = async (spaceName: string) => {
    if (!accessToken) return;
    setLoadingMessages(true);
    try {
      // Space name is in the format "spaces/AAAABBBB"
      const response = await fetch(`https://chat.googleapis.com/v1/${spaceName}/messages?pageSize=25`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });

      if (!response.ok) {
        throw new Error(`Failed to load messages: ${response.statusText}`);
      }

      const data = await response.json();
      // Google Chat returns messages in chronological order, or reverse. Let's make sure they are sorted nicely
      const loadedMessages = data.messages || [];
      // Sort oldest first for chat flow
      loadedMessages.sort((a: any, b: any) => new Date(a.createTime).getTime() - new Date(b.createTime).getTime());
      setMessages(loadedMessages);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoadingMessages(false);
    }
  };

  // Load spaces on mount or token change
  useEffect(() => {
    if (accessToken) {
      loadChatSpaces();
    }
  }, [accessToken]);

  // Load messages when selected space changes
  useEffect(() => {
    if (selectedSpaceId && accessToken) {
      loadMessages(selectedSpaceId);
    } else {
      setMessages([]);
    }
  }, [selectedSpaceId, accessToken]);

  // Send message
  const handleSendMessage = async (textToSend?: string) => {
    const finalContent = textToSend || messageText;
    if (!accessToken || !selectedSpaceId || !finalContent.trim()) return;

    setIsSendingMessage(true);
    try {
      const response = await fetch(`https://chat.googleapis.com/v1/${selectedSpaceId}/messages`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          text: finalContent.trim()
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to send message: ${response.statusText}`);
      }

      if (!textToSend) {
        setMessageText('');
      }
      // Reload messages to show sent item
      await loadMessages(selectedSpaceId);
    } catch (err: any) {
      console.error(err);
      alert(`Error sending message: ${err.message}`);
    } finally {
      setIsSendingMessage(false);
    }
  };

  // Create new Google Chat Space
  const handleCreateSpace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken || !newSpaceName.trim()) return;

    setIsCreatingSpace(true);
    try {
      const response = await fetch('https://chat.googleapis.com/v1/spaces', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          spaceType: 'SPACE',
          displayName: newSpaceName.trim()
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to create space: ${response.statusText}`);
      }

      const created = await response.json();
      setShowCreateSpaceModal(false);
      setNewSpaceName('');
      alert(`Chat space "${created.displayName}" created successfully!`);
      
      // Reload spaces and auto select the new one
      await loadChatSpaces();
      setSelectedSpaceId(created.name);
    } catch (err: any) {
      console.error(err);
      alert(`Error creating space: ${err.message}`);
    } finally {
      setIsCreatingSpace(false);
    }
  };

  // Delete message
  const handleDeleteMessage = async (messageName: string) => {
    if (!accessToken) return;
    const confirmed = window.confirm('Are you sure you want to delete this message in Google Chat?');
    if (!confirmed) return;

    try {
      const response = await fetch(`https://chat.googleapis.com/v1/${messageName}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${accessToken}` }
      });

      if (!response.ok) {
        throw new Error(`Failed to delete message: ${response.statusText}`);
      }

      // Reload messages
      if (selectedSpaceId) {
        await loadMessages(selectedSpaceId);
      }
    } catch (err: any) {
      console.error(err);
      alert(`Failed to delete message: ${err.message}. You can only delete messages created by this workspace app or authenticated account.`);
    }
  };

  // Draft a structured update with Gemini AI
  const handleDraftWithGemini = async () => {
    if (!aiTopic.trim()) {
      alert('Please write a brief topic or prompt description first.');
      return;
    }

    setAiDraftLoading(true);
    try {
      const res = await fetch('/api/ai/describe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: `Google Chat message about: ${aiTopic}`,
          ingredients: `Formatting rules: Use Google Chat styling markers (*bold*, _italic_, - bullet lists) where applicable. Do not write HTML code. Make it highly professional.`,
          tone: aiTone,
          length: 'Long'
        })
      });

      if (res.ok) {
        const data = await res.json();
        // Set drafting result
        setAiDraftResult(data.description || '');
      } else {
        throw new Error('Gemini API call failed');
      }
    } catch (e) {
      console.error(e);
      // Fallback
      setAiDraftResult(`*Team Announcement* 📢\n\nWe are excited to share a brand-new update regarding: *${aiTopic}*.\n\n- Topic: ${aiTopic}\n- Priority: Standard\n- Generated via Gemini AI.\n\nPlease let the management know if you have any questions!`);
    } finally {
      setAiDraftLoading(false);
    }
  };

  // Save auto-notification config
  const saveNotificationConfig = () => {
    if (!notificationSpaceId) {
      alert('Please select a target notification space first.');
      return;
    }
    localStorage.setItem('menuflow_chat_alert_space_id', notificationSpaceId);
    localStorage.setItem('menuflow_chat_order_alerts', String(orderAlertsEnabled));
    localStorage.setItem('menuflow_chat_booking_alerts', String(bookingAlertsEnabled));
    
    setAlertSuccess(true);
    setTimeout(() => setAlertSuccess(false), 3000);
  };

  // Dispatch live order/reservation details manual card to Google Chat
  const postManualCard = async (type: 'order' | 'booking', data: any) => {
    if (!accessToken || !selectedSpaceId) {
      alert('Please select an active space from the left column first.');
      return;
    }

    let text = '';
    if (type === 'order') {
      const itemsStr = data.items.map((i: any) => `• ${i.name} (x${i.quantity}) - $${(i.price * i.quantity).toFixed(2)}`).join('\n');
      text = `⚡ *NEW ORDER RECEIVED - #${data.id}*\n\n*Customer Details:*\n• Name: *${data.customerName}*\n• Contact: *${data.customerPhone}*\n\n*Items Ordered:*\n${itemsStr}\n\n*Total Amount:* *$${data.totalAmount.toFixed(2)}*\n*Type:* ${data.orderType.toUpperCase()} checkout\n*Timestamp:* ${new Date(data.timestamp).toLocaleString()}\n\n🔔 _Posted instantly from Bistro Flow Admin Panel_`;
    } else {
      text = `📅 *NEW TABLE BOOKING APPROVED*\n\n*Patron Details:*\n• Name: *${data.customerName}*\n• Phone: *${data.customerPhone}*\n\n*Reservation Details:*\n• Date: *${data.date}*\n• Time: *${data.time} PM*\n• Party Size: *${data.guests} Guests*\n• Status: *${data.status.toUpperCase()}*\n\n🍷 _Review live seating chart inside the Dashboard_`;
    }

    try {
      const response = await fetch(`https://chat.googleapis.com/v1/${selectedSpaceId}/messages`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ text })
      });

      if (!response.ok) {
        throw new Error(`Failed to post team notification: ${response.statusText}`);
      }

      alert('Successfully dispatched detailed summary card to Google Chat!');
      await loadMessages(selectedSpaceId);
    } catch (e: any) {
      alert(`Failed to dispatch card: ${e.message}`);
    }
  };

  // Find currently selected space details
  const activeSpace = spaces.find(s => s.name === selectedSpaceId);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="font-serif text-3xl font-bold text-neutral-950 flex items-center gap-2">
            <MessageSquare size={28} className="text-amber-700" /> Google Chat Workspace
          </h3>
          <p className="text-neutral-500 text-sm">
            Coordinate instantly with your kitchen staff, dispatchers, and managers using direct Google Chat spaces.
          </p>
        </div>

        {accessToken && (
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowCreateSpaceModal(true)}
              className="px-4 py-2 bg-amber-700 text-white rounded-xl text-xs font-semibold hover:bg-amber-800 transition flex items-center gap-2 shadow-xs"
            >
              <PlusCircle size={14} /> Create Space
            </button>
            <button
              onClick={loadChatSpaces}
              disabled={loadingSpaces}
              className="p-2 border border-neutral-200 hover:bg-neutral-50 rounded-xl transition text-neutral-600 disabled:opacity-50"
              title="Sync Spaces"
            >
              <RefreshCw size={16} className={loadingSpaces ? 'animate-spin' : ''} />
            </button>
          </div>
        )}
      </div>

      {/* 1. Connection Banner */}
      {accessToken && (
        <div className="bg-emerald-50 border border-emerald-100/80 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <div>
              <p className="text-emerald-950 font-bold text-xs">Connected to Google Chat Enterprise APIs</p>
              <p className="text-emerald-700 text-[10px] font-medium">
                Linked workspace project: <span className="font-mono bg-emerald-100/60 px-1 py-0.25 rounded">gen-lang-client-0740167777</span>
              </p>
            </div>
          </div>
          <button
            onClick={onTokenCleared}
            className="text-neutral-500 hover:text-red-600 text-xs font-semibold transition"
          >
            Disconnect Account
          </button>
        </div>
      )}

      {/* 2. Chat Workspaces Main UI */}
      {accessToken ? (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">
          
          {/* Left Column: Spaces List & Quick Alerts Config */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Spaces navigation box */}
            <div className="bg-white rounded-2xl border border-neutral-200/60 shadow-xs overflow-hidden">
              <div className="p-4 bg-neutral-50 border-b border-neutral-100 flex justify-between items-center">
                <span className="text-xs font-bold text-neutral-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Hash size={14} className="text-neutral-400" /> Active Team Channels ({spaces.length})
                </span>
              </div>

              {loadingSpaces ? (
                <div className="p-12 text-center text-neutral-500 text-xs">
                  <RefreshCw size={20} className="animate-spin text-amber-700 mx-auto mb-2" />
                  Loading chat spaces...
                </div>
              ) : spaces.length === 0 ? (
                <div className="p-12 text-center text-neutral-400 text-xs space-y-2">
                  <MessageSquare size={24} className="mx-auto text-neutral-300" />
                  <p>No active chat spaces found.</p>
                  <button 
                    onClick={() => setShowCreateSpaceModal(true)}
                    className="text-amber-700 font-bold hover:underline"
                  >
                    Create your first Space now
                  </button>
                </div>
              ) : (
                <div className="divide-y divide-neutral-100 max-h-[350px] overflow-y-auto">
                  {spaces.map((space) => {
                    const isSelected = space.name === selectedSpaceId;
                    return (
                      <div
                        key={space.name}
                        onClick={() => setSelectedSpaceId(space.name)}
                        className={`p-3.5 cursor-pointer text-left transition flex items-center justify-between ${
                          isSelected 
                            ? 'bg-amber-50/50 border-l-4 border-amber-700' 
                            : 'hover:bg-neutral-50 border-l-4 border-transparent'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                            isSelected ? 'bg-amber-100 text-amber-800' : 'bg-neutral-100 text-neutral-500'
                          }`}>
                            <Users size={14} />
                          </div>
                          <div className="min-w-0">
                            <h5 className={`text-xs font-bold truncate ${isSelected ? 'text-amber-950' : 'text-neutral-800'}`}>
                              {space.displayName || space.name.replace('spaces/', 'Space #')}
                            </h5>
                            <p className="text-[10px] text-neutral-400 font-medium font-mono uppercase tracking-wider">
                              {space.spaceType || 'ROOM'}
                            </p>
                          </div>
                        </div>
                        {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-amber-700 shrink-0" />}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Quick Auto-Notifications Alert Hub */}
            <div className="bg-white rounded-2xl border border-neutral-200/60 shadow-xs p-5 space-y-4">
              <div className="flex items-center gap-2 border-b border-neutral-100 pb-3">
                <Bell size={16} className="text-amber-700" />
                <h4 className="text-xs font-bold text-neutral-900 uppercase tracking-wider">Live Chat Alerts Trigger</h4>
              </div>

              <p className="text-neutral-500 text-[11px] leading-relaxed">
                Connect your live customer checkouts and reservation bookings directly to a Google Chat team room for instant notification.
              </p>

              <div className="space-y-3 pt-1">
                <div>
                  <label className="block text-[10px] font-bold text-neutral-600 uppercase tracking-wider mb-1.5">Target Notification Space</label>
                  <select
                    value={notificationSpaceId}
                    onChange={(e) => setNotificationSpaceId(e.target.value)}
                    className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl text-xs text-neutral-800 focus:outline-none"
                  >
                    <option value="">-- Choose a Space --</option>
                    {spaces.map(s => (
                      <option key={s.name} value={s.name}>{s.displayName || s.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2 pt-1">
                  <label className="flex items-center justify-between text-xs font-semibold text-neutral-700 cursor-pointer">
                    <span>Order Placement Alerts</span>
                    <button
                      type="button"
                      onClick={() => setOrderAlertsEnabled(!orderAlertsEnabled)}
                      className={`relative w-9 h-5 rounded-full transition-colors ${orderAlertsEnabled ? 'bg-emerald-600' : 'bg-neutral-200'}`}
                    >
                      <span className={`absolute top-0.5 left-0.5 bg-white w-4 h-4 rounded-full shadow-xs transition-transform ${orderAlertsEnabled ? 'translate-x-4' : ''}`} />
                    </button>
                  </label>

                  <label className="flex items-center justify-between text-xs font-semibold text-neutral-700 cursor-pointer">
                    <span>Table Reservation Alerts</span>
                    <button
                      type="button"
                      onClick={() => setBookingAlertsEnabled(!bookingAlertsEnabled)}
                      className={`relative w-9 h-5 rounded-full transition-colors ${bookingAlertsEnabled ? 'bg-emerald-600' : 'bg-neutral-200'}`}
                    >
                      <span className={`absolute top-0.5 left-0.5 bg-white w-4 h-4 rounded-full shadow-xs transition-transform ${bookingAlertsEnabled ? 'translate-x-4' : ''}`} />
                    </button>
                  </label>
                </div>

                <button
                  type="button"
                  onClick={saveNotificationConfig}
                  className="w-full py-2 bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 mt-2"
                >
                  {alertSuccess ? <Check size={14} className="text-emerald-400" /> : <Bell size={14} />}
                  {alertSuccess ? 'Configuration Saved!' : 'Save Alerts Setup'}
                </button>
              </div>
            </div>

            {/* Quick dispatching box for recent activity */}
            <div className="bg-white rounded-2xl border border-neutral-200/60 shadow-xs p-5 space-y-3.5">
              <div className="flex items-center gap-2 border-b border-neutral-100 pb-2.5">
                <Layers size={15} className="text-amber-700" />
                <h4 className="text-xs font-bold text-neutral-900 uppercase tracking-wider">Manual Dispatcher Tool</h4>
              </div>

              <p className="text-neutral-500 text-[11px] leading-relaxed">
                Manually push any recent transaction or table reservation details as a beautiful card directly into the current room.
              </p>

              {orders.length > 0 && (
                <div className="space-y-2 pt-1">
                  <div className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Recent Orders</div>
                  <div className="space-y-1.5 max-h-[140px] overflow-y-auto">
                    {orders.slice(0, 3).map(order => (
                      <div key={order.id} className="p-2 border border-neutral-100 hover:bg-neutral-50 rounded-xl flex justify-between items-center text-xs">
                        <div className="truncate pr-2">
                          <span className="font-mono font-bold text-neutral-950">#{order.id}</span>
                          <span className="text-neutral-400 mx-1">|</span>
                          <span className="font-medium text-neutral-700">{order.customerName}</span>
                        </div>
                        <button
                          onClick={() => postManualCard('order', order)}
                          className="px-2 py-1 bg-amber-50 text-amber-800 border border-amber-100 rounded-md text-[10px] font-semibold flex items-center gap-1 hover:bg-amber-100 transition"
                        >
                          Send <ArrowRight size={10} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {reservations.length > 0 && (
                <div className="space-y-2 pt-2">
                  <div className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Approved Bookings</div>
                  <div className="space-y-1.5 max-h-[140px] overflow-y-auto">
                    {reservations.slice(0, 3).map(res => (
                      <div key={res.id} className="p-2 border border-neutral-100 hover:bg-neutral-50 rounded-xl flex justify-between items-center text-xs">
                        <div className="truncate pr-2">
                          <span className="font-bold text-neutral-800">{res.customerName}</span>
                          <span className="text-neutral-400 mx-1">|</span>
                          <span className="text-neutral-500">{res.guests}p</span>
                        </div>
                        <button
                          onClick={() => postManualCard('booking', res)}
                          className="px-2 py-1 bg-amber-50 text-amber-800 border border-amber-100 rounded-md text-[10px] font-semibold flex items-center gap-1 hover:bg-amber-100 transition"
                        >
                          Send <ArrowRight size={10} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

          </div>

          {/* Right Column: Chat Feed, Message Input, & Gemini Drafter */}
          <div className="lg:col-span-3 space-y-6">
            
            {/* Active chat window */}
            <div className="bg-white rounded-2xl border border-neutral-200/60 shadow-xs flex flex-col h-[520px] overflow-hidden">
              
              {/* Chat window Header */}
              <div className="p-4 bg-neutral-900 text-white flex justify-between items-center shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                  <div>
                    <h4 className="font-bold text-xs">
                      {activeSpace?.displayName || 'Select a Chat Space'}
                    </h4>
                    <p className="text-[9px] text-neutral-400 uppercase tracking-widest font-mono">
                      Active Session Room
                    </p>
                  </div>
                </div>
                <span className="text-[10px] bg-white/10 px-2.5 py-0.5 rounded-md font-mono text-neutral-300">
                  {messages.length} messages
                </span>
              </div>

              {/* Chat messages viewport */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-neutral-50/50">
                {loadingMessages ? (
                  <div className="h-full flex flex-col justify-center items-center text-neutral-400 text-xs">
                    <RefreshCw className="animate-spin text-amber-700 mb-2" size={24} />
                    Loading conversation feed...
                  </div>
                ) : messages.length === 0 ? (
                  <div className="h-full flex flex-col justify-center items-center text-neutral-400 text-center p-8 space-y-3">
                    <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-700 flex items-center justify-center">
                      <MessageSquare size={20} />
                    </div>
                    <div>
                      <p className="font-bold text-sm text-neutral-900">This channel is empty</p>
                      <p className="text-xs text-neutral-500 mt-0.5 max-w-xs">No recent messages in this space. Type a greeting below to coordinate with the staff.</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {messages.map((msg, index) => {
                      const isMe = msg.sender?.type === 'HUMAN';
                      const formattedTime = new Date(msg.createTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                      
                      return (
                        <div 
                          key={msg.name || index} 
                          className={`flex items-start gap-2.5 max-w-[85%] group ${
                            isMe ? 'ml-auto flex-row-reverse' : ''
                          }`}
                        >
                          {/* Avatar */}
                          <div className={`w-7 h-7 rounded-full text-xs font-bold flex items-center justify-center shrink-0 ${
                            isMe ? 'bg-amber-700 text-white' : 'bg-neutral-800 text-white'
                          }`}>
                            {msg.sender?.displayName ? msg.sender.displayName.slice(0, 2).toUpperCase() : 'ST'}
                          </div>

                          {/* Message bubble */}
                          <div className="space-y-1">
                            <div className={`flex items-center gap-1.5 text-[10px] text-neutral-400 font-semibold ${
                              isMe ? 'flex-row-reverse' : ''
                            }`}>
                              <span>{msg.sender?.displayName || 'Team Member'}</span>
                              <span>•</span>
                              <span>{formattedTime}</span>
                              {msg.name && (
                                <button
                                  onClick={() => handleDeleteMessage(msg.name)}
                                  className="opacity-0 group-hover:opacity-100 transition text-red-500 hover:text-red-700 ml-1"
                                  title="Delete Message"
                                >
                                  <Trash2 size={11} />
                                </button>
                              )}
                            </div>
                            <div className={`p-3 text-xs leading-relaxed rounded-2xl whitespace-pre-wrap shadow-2xs select-text ${
                              isMe 
                                ? 'bg-amber-700 text-white rounded-tr-none font-medium' 
                                : 'bg-white text-neutral-800 rounded-tl-none border border-neutral-100'
                            }`}>
                              {msg.text}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Chat Input Bar */}
              <div className="p-3 bg-white border-t border-neutral-100 flex gap-2 shrink-0">
                <input
                  type="text"
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Type kitchen update or message to team..."
                  className="flex-1 px-4 py-2 bg-neutral-50 border border-neutral-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
                <button
                  onClick={() => handleSendMessage()}
                  disabled={isSendingMessage || !messageText.trim()}
                  className="px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 disabled:opacity-50"
                >
                  <Send size={12} /> Send
                </button>
              </div>

            </div>

            {/* Premium Gemini AI smart message drafting block */}
            <div className="bg-amber-50/40 border border-amber-100 rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles size={16} className="text-amber-700" /> Gemini AI Message Drafter
                </span>
                <span className="text-[10px] text-amber-800 bg-amber-100 px-2.5 py-0.5 rounded-full font-bold">Smart Templates</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-[10px] font-bold text-neutral-600 uppercase tracking-wider mb-1">Message Intent or Goal</label>
                  <input
                    type="text"
                    value={aiTopic}
                    onChange={(e) => setAiTopic(e.target.value)}
                    placeholder="e.g. alert team about kitchen stock update or special party"
                    className="w-full px-3 py-2 bg-white border border-neutral-200 rounded-xl text-xs focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-neutral-600 uppercase tracking-wider mb-1">Channel Tone</label>
                  <select
                    value={aiTone}
                    onChange={(e) => setAiTone(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-neutral-200 rounded-xl text-xs text-neutral-800"
                  >
                    <option value="Professional">Professional Update</option>
                    <option value="Casual">Casual Team Chat</option>
                    <option value="Excited">Excited Celebration</option>
                    <option value="Urgent">Urgent Alert</option>
                  </select>
                </div>
              </div>

              <button
                type="button"
                onClick={handleDraftWithGemini}
                disabled={aiDraftLoading}
                className="w-full py-2.5 bg-amber-700 hover:bg-amber-800 text-white rounded-xl text-xs font-semibold transition flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                <Sparkles size={13} />
                {aiDraftLoading ? 'Gemini is drafting message...' : 'Draft Announcement with Gemini'}
              </button>

              {aiDraftResult && (
                <div className="p-4 bg-white rounded-xl border border-amber-100/80 space-y-3 shadow-2xs">
                  <div className="flex justify-between items-center border-b border-neutral-100 pb-2">
                    <span className="text-[10px] text-emerald-700 font-bold uppercase tracking-wider flex items-center gap-1">
                      <CheckCircle2 size={12} /> Suggested Draft
                    </span>
                    <button
                      onClick={() => {
                        setMessageText(aiDraftResult);
                        setAiDraftResult('');
                        setAiTopic('');
                      }}
                      className="text-[10px] font-bold text-amber-800 hover:underline"
                    >
                      Use template
                    </button>
                  </div>
                  <p className="text-neutral-800 font-mono text-[11px] leading-relaxed whitespace-pre-wrap select-text">
                    {aiDraftResult}
                  </p>
                </div>
              )}
            </div>

          </div>

        </div>
      ) : (
        /* 3. Empty Connection Auth State */
        <div className="bg-white border border-neutral-200/60 shadow-xs rounded-2xl p-10 text-center max-w-xl mx-auto space-y-6">
          <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mx-auto text-amber-700">
            <MessageSquare size={32} />
          </div>
          <div className="space-y-2">
            <h4 className="text-xl font-bold text-neutral-900">Connect Your Restaurant Google Workspace</h4>
            <p className="text-neutral-500 text-sm leading-relaxed">
              Link your restaurant's administrative Google Workspace account to coordinate live with team spaces, broadcast premium Gemini AI-drafted kitchen updates, and automate real-time order alerts.
            </p>
          </div>

          <div className="pt-2">
            <button
              onClick={() => {
                // Trigger the main parent auth connection handler
                const btn = document.getElementById('google-signin-btn');
                if (btn) {
                  btn.click();
                } else {
                  alert('Please sign in using your Google administrator account at the secure admin terminal wall.');
                }
              }}
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
              <span>Authorize Google Chat integration</span>
            </button>
            <p className="text-[10px] text-neutral-400 mt-3">
              Requires permission to list spaces, read messages, and post updates to Google Chat spaces.
            </p>
          </div>
        </div>
      )}

      {/* 4. Create Chat Space Modal */}
      <AnimatePresence>
        {showCreateSpaceModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50" onClick={() => setShowCreateSpaceModal(false)} />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden z-10 border border-neutral-100"
            >
              <div className="px-6 py-4 bg-neutral-900 text-white flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <MessageSquare size={18} className="text-amber-500" />
                  <span className="font-bold text-sm">Create Google Chat Space</span>
                </div>
                <button 
                  onClick={() => setShowCreateSpaceModal(false)}
                  className="p-1 hover:bg-white/10 rounded-lg transition"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleCreateSpace} className="p-6 space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-neutral-600 uppercase tracking-wider mb-1.5">
                    Space Name (e.g. Kitchen-Crew or Delivery-Updates)
                  </label>
                  <input
                    type="text"
                    value={newSpaceName}
                    onChange={(e) => setNewSpaceName(e.target.value)}
                    placeholder="e.g. VIP Catering Coordination"
                    className="w-full px-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-sm"
                    required
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-neutral-100">
                  <button
                    type="button"
                    onClick={() => setShowCreateSpaceModal(false)}
                    className="px-4 py-2 border border-neutral-200 rounded-xl text-xs font-semibold hover:bg-neutral-50 transition text-neutral-500"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isCreatingSpace || !newSpaceName.trim()}
                    className="px-5 py-2 bg-neutral-900 text-white rounded-xl text-xs font-semibold hover:bg-neutral-800 transition disabled:opacity-50"
                  >
                    {isCreatingSpace ? 'Creating...' : 'Create Space'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
