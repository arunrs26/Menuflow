import React, { useState, useEffect } from 'react';
import { 
  Mail, Inbox, Send, Trash2, Sparkles, RefreshCw, 
  AlertCircle, CheckCircle2, Search, Loader2, Plus, 
  CornerUpLeft, SendHorizontal, AlertTriangle, FileText, ArrowLeft, ExternalLink, X
} from 'lucide-react';
import { auth } from '../firebase';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';

interface GmailManagerProps {
  accessToken: string | null;
  onTokenAcquired: (token: string) => void;
  onTokenCleared: () => void;
  restaurantName: string;
}

interface EmailMessage {
  id: string;
  threadId: string;
  from: string;
  subject: string;
  date: string;
  snippet: string;
  body: string;
  labels: string[];
}

export default function GmailManager({ 
  accessToken, 
  onTokenAcquired, 
  onTokenCleared,
  restaurantName 
}: GmailManagerProps) {
  const [emails, setEmails] = useState<EmailMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEmail, setSelectedEmail] = useState<EmailMessage | null>(null);
  const [activeFolder, setActiveFolder] = useState<'INBOX' | 'SENT' | 'DRAFT'>('INBOX');
  
  // Compose Email State
  const [isComposing, setIsComposing] = useState(false);
  const [composeTo, setComposeTo] = useState('');
  const [composeSubject, setComposeSubject] = useState('');
  const [composeBody, setComposeBody] = useState('');
  const [aiGenerating, setAiGenerating] = useState(false);
  const [actionSuccess, setActionSuccess] = useState('');
  
  // Gemini Template Selection
  const [selectedTemplate, setSelectedTemplate] = useState('custom');
  const [customAiPrompt, setCustomAiPrompt] = useState('');

  // OAuth Setup
  const [isConnecting, setIsConnecting] = useState(false);

  // Load emails
  useEffect(() => {
    if (accessToken) {
      loadEmails();
    }
  }, [accessToken, activeFolder]);

  const handleConnectGmail = async () => {
    setIsConnecting(true);
    setError('');
    try {
      const provider = new GoogleAuthProvider();
      provider.addScope('https://mail.google.com/');
      provider.addScope('https://www.googleapis.com/auth/gmail.modify');
      provider.addScope('https://www.googleapis.com/auth/gmail.compose');
      provider.addScope('https://www.googleapis.com/auth/gmail.send');
      
      provider.setCustomParameters({ prompt: 'select_account' });
      const result = await signInWithPopup(auth, provider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      const token = credential?.accessToken;
      if (!token) {
        throw new Error('No access token returned from Google Sign-In.');
      }
      onTokenAcquired(token);
    } catch (err: any) {
      console.error('Failed to connect Gmail:', err);
      setError(err.message || 'Failed to authenticate with Google Gmail scopes.');
    } finally {
      setIsConnecting(false);
    }
  };

  // Helper to get headers from Gmail message
  const getHeaderValue = (headers: any[], name: string) => {
    return headers?.find(h => h.name.toLowerCase() === name.toLowerCase())?.value || '';
  };

  // Safe recursive decoding of body
  const decodeMessageBody = (payload: any): string => {
    if (payload.body?.data) {
      try {
        const decoded = atob(payload.body.data.replace(/-/g, '+').replace(/_/g, '/'));
        return decoded;
      } catch (e) {
        return payload.snippet || '';
      }
    }
    if (payload.parts) {
      for (const part of payload.parts) {
        const body = decodeMessageBody(part);
        if (body) return body;
      }
    }
    return '';
  };

  const loadEmails = async () => {
    setLoading(true);
    setError('');
    try {
      let url = `https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=10&q=label:${activeFolder}`;
      if (searchQuery) {
        url += ` ${encodeURIComponent(searchQuery)}`;
      }

      const listRes = await fetch(url, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });

      if (!listRes.ok) {
        if (listRes.status === 401) {
          onTokenCleared(); // Token expired
          throw new Error('Access token expired. Please connect again.');
        }
        throw new Error(`Gmail API returned status ${listRes.status}`);
      }

      const listData = await listRes.json();
      if (!listData.messages || listData.messages.length === 0) {
        setEmails([]);
        setSelectedEmail(null);
        return;
      }

      // Fetch individual message details in parallel
      const detailPromises = listData.messages.map(async (msg: { id: string }) => {
        const detailRes = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}`, {
          headers: { Authorization: `Bearer ${accessToken}` }
        });
        if (!detailRes.ok) return null;
        const detailData = await detailRes.json();

        const headers = detailData.payload?.headers || [];
        const from = getHeaderValue(headers, 'From');
        const subject = getHeaderValue(headers, 'Subject') || '(No Subject)';
        const dateRaw = getHeaderValue(headers, 'Date');
        const snippet = detailData.snippet || '';
        const body = decodeMessageBody(detailData.payload) || snippet;
        
        let dateFormatted = dateRaw;
        try {
          dateFormatted = new Date(dateRaw).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
        } catch (_) {}

        return {
          id: detailData.id,
          threadId: detailData.threadId,
          from,
          subject,
          date: dateFormatted,
          snippet,
          body,
          labels: detailData.labelIds || []
        };
      });

      const resolvedEmails = (await Promise.all(detailPromises)).filter(Boolean) as EmailMessage[];
      setEmails(resolvedEmails);
      if (resolvedEmails.length > 0 && !selectedEmail) {
        setSelectedEmail(resolvedEmails[0]);
      }
    } catch (err: any) {
      console.error('Failed to load Gmail messages:', err);
      setError(err.message || 'Failed to retrieve emails from Gmail.');
    } finally {
      setLoading(false);
    }
  };

  // Generate Email Draft with Gemini API
  const generateAiDraft = async () => {
    setAiGenerating(true);
    setError('');
    
    let context = '';
    let instructions = customAiPrompt;

    switch (selectedTemplate) {
      case 'confirm_booking':
        context = 'Confirming a customer table reservation booking at our restaurant.';
        if (!instructions) instructions = 'Ask for arrival on time, mention that we hold tables for 15 minutes max, and welcome them warmly.';
        break;
      case 'confirm_order':
        context = 'Order received and confirmed. Let the customer know we are busy preparing it with the freshest ingredients.';
        if (!instructions) instructions = 'Express gratitude for their direct support, and state that delivery or direct pickup is underway.';
        break;
      case 'delay_apology':
        context = 'Apologize sincerely to a customer for a slight delay in their order preparation or reservation scheduling.';
        if (!instructions) instructions = 'Apologize for the inconvenience, explain that we only serve pristine freshly-cooked dishes which take time, and offer a complimentary 10% coupon for their next visit.';
        break;
      case 'welcome_promo':
        context = 'Thanking a new customer and providing a welcome promo offer coupon WELCOME10 for 10% off.';
        if (!instructions) instructions = 'Encourage them to explore our customizable visual menu and order direct via WhatsApp next time.';
        break;
      default:
        context = 'Restaurant general communication.';
        if (!instructions) instructions = 'Write a polite, warm response answering customer queries about opening hours, dishes, or bookings.';
    }

    try {
      const res = await fetch('/api/ai/draft-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipientName: composeTo.split('<')[0]?.trim() || 'Valued Guest',
          context,
          instructions
        })
      });

      const data = await res.json();
      if (data.draft) {
        setComposeBody(data.draft);
        setActionSuccess('Gemini has generated a beautifully drafted professional email template!');
        setTimeout(() => setActionSuccess(''), 5000);
      } else {
        throw new Error(data.error || 'Failed to generate AI draft.');
      }
    } catch (err: any) {
      console.error('AI draft generation failed:', err);
      setError('Failed to generate draft with Gemini. Using default format.');
    } finally {
      setAiGenerating(false);
    }
  };

  // Base64URL encode raw RFC 822 emails
  const makeRawEmailString = (to: string, subject: string, htmlBody: string) => {
    const emailParts = [
      `To: ${to}`,
      'Content-Type: text/html; charset=utf-8',
      'MIME-Version: 1.0',
      `Subject: ${subject}`,
      '',
      htmlBody
    ];
    const email = emailParts.join('\r\n');
    return btoa(unescape(encodeURIComponent(email)))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
  };

  // Send Email
  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!composeTo || !composeSubject || !composeBody) {
      setError('Recipient, Subject, and Body are all required.');
      return;
    }

    const confirmed = window.confirm(`Are you sure you want to send this email to ${composeTo}? This will use your linked Gmail account.`);
    if (!confirmed) return;

    setLoading(true);
    setError('');
    try {
      const raw = makeRawEmailString(composeTo, composeSubject, composeBody);
      const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`
        },
        body: JSON.stringify({ raw })
      });

      if (!res.ok) {
        throw new Error(`Failed to send email. Status code: ${res.status}`);
      }

      setActionSuccess('Email sent successfully via Gmail!');
      setComposeTo('');
      setComposeSubject('');
      setComposeBody('');
      setIsComposing(false);
      loadEmails();
      setTimeout(() => setActionSuccess(''), 4000);
    } catch (err: any) {
      console.error('Failed to send email:', err);
      setError(err.message || 'An error occurred while sending the email.');
    } finally {
      setLoading(false);
    }
  };

  // Create Draft
  const handleSaveDraft = async () => {
    if (!composeTo || !composeSubject || !composeBody) {
      setError('Please fill in Recipient, Subject, and Body before saving draft.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const raw = makeRawEmailString(composeTo, composeSubject, composeBody);
      const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/drafts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`
        },
        body: JSON.stringify({
          message: { raw }
        })
      });

      if (!res.ok) {
        throw new Error(`Failed to save draft. Status code: ${res.status}`);
      }

      setActionSuccess('Draft saved successfully in your Gmail account!');
      setIsComposing(false);
      loadEmails();
      setTimeout(() => setActionSuccess(''), 4000);
    } catch (err: any) {
      console.error('Failed to save draft:', err);
      setError(err.message || 'An error occurred while saving the draft.');
    } finally {
      setLoading(false);
    }
  };

  // Move email to Trash (destructive operation)
  const handleTrashMessage = async (msgId: string) => {
    const confirmed = window.confirm('Are you absolutely sure you want to permanently move this message to trash?');
    if (!confirmed) return;

    setLoading(true);
    setError('');
    try {
      const res = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${msgId}/trash`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}` }
      });

      if (!res.ok) {
        throw new Error('Failed to trash message.');
      }

      setActionSuccess('Message moved to Gmail trash.');
      setSelectedEmail(null);
      loadEmails();
      setTimeout(() => setActionSuccess(''), 4000);
    } catch (err: any) {
      console.error('Trash error:', err);
      setError('Failed to trash the email.');
    } finally {
      setLoading(false);
    }
  };

  // Setup Compose reply
  const handleSetupReply = (email: EmailMessage) => {
    // Extract reply-to email address
    let replyTo = email.from;
    const match = email.from.match(/<([^>]+)>/);
    if (match && match[1]) {
      replyTo = match[1];
    }
    
    setComposeTo(replyTo);
    setComposeSubject(email.subject.startsWith('Re:') ? email.subject : `Re: ${email.subject}`);
    setComposeBody(`<p><br/></p><hr/><p>On ${email.date}, ${email.from} wrote:</p><blockquote>${email.snippet || ''}...</blockquote>`);
    setSelectedTemplate('custom');
    setCustomAiPrompt(`Answer the customer query polite and briefly.`);
    setIsComposing(true);
  };

  // CONNECTION SCREEN
  if (!accessToken) {
    return (
      <div className="bg-white rounded-2xl border border-neutral-200/60 shadow-xs p-10 max-w-2xl mx-auto my-12 text-center space-y-6">
        <div className="w-16 h-16 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
          <Mail size={32} />
        </div>
        <div className="space-y-2">
          <h3 className="text-2xl font-bold font-serif text-neutral-900">Connect Gmail Inbox</h3>
          <p className="text-neutral-500 text-sm max-w-md mx-auto">
            Authorize and connect your Gmail account to manage direct customer inquiries, reservation updates, and delivery alerts using our stunning Gmail integration.
          </p>
        </div>

        <div className="bg-neutral-50 rounded-xl p-4 text-xs text-neutral-600 text-left space-y-2 max-w-md mx-auto">
          <div className="flex gap-2 items-center font-semibold text-neutral-800">
            <Sparkles size={14} className="text-amber-500" />
            <span>Premium Integration Features:</span>
          </div>
          <ul className="list-disc list-inside space-y-1 pl-1 text-neutral-500">
            <li>Sync and view your restaurant's inquiries & feedback</li>
            <li>Generate professional emails using **Gemini AI Drafting**</li>
            <li>Send confirmations or apologies directly in 1 click</li>
            <li>Least privilege secured client-side authorization</li>
          </ul>
        </div>

        {error && (
          <div className="p-4 bg-red-50 text-red-700 text-xs rounded-xl flex items-center gap-2 max-w-md mx-auto border border-red-100">
            <AlertTriangle size={16} className="shrink-0" />
            <span className="text-left font-medium">{error}</span>
          </div>
        )}

        <div className="pt-4 flex justify-center">
          <button
            onClick={handleConnectGmail}
            disabled={isConnecting}
            className="flex items-center gap-3 bg-red-600 hover:bg-red-700 text-white font-semibold text-sm px-6 py-3 rounded-xl shadow-md hover:shadow-lg transition cursor-pointer disabled:opacity-50"
          >
            {isConnecting ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Connecting OAuth Account...
              </>
            ) : (
              <>
                <Mail size={16} />
                Connect Gmail with Google
              </>
            )}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl border border-neutral-200/60 shadow-xs">
        <div>
          <h2 className="text-2xl font-bold text-neutral-900 font-serif">Gmail Communication Hub</h2>
          <p className="text-neutral-500 text-xs mt-1">
            Seamlessly view, reply, and generate AI drafts for incoming client communications on behalf of {restaurantName}.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setIsComposing(true);
              setComposeTo('');
              setComposeSubject('');
              setComposeBody('');
            }}
            className="flex items-center gap-2 bg-neutral-900 hover:bg-neutral-800 text-white font-semibold text-xs px-4 py-2.5 rounded-xl transition shadow-sm"
          >
            <Plus size={14} /> New Message
          </button>
          <button
            onClick={loadEmails}
            disabled={loading}
            className="p-2.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded-xl transition disabled:opacity-50"
            title="Refresh mailboxes"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
          <button
            onClick={onTokenCleared}
            className="text-xs text-neutral-500 hover:text-red-600 bg-neutral-100 px-3 py-2.5 rounded-xl transition"
          >
            Disconnect Account
          </button>
        </div>
      </div>

      {/* STATUS CHIPS AND NOTIFICATIONS */}
      {actionSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-100 text-emerald-800 text-xs rounded-xl flex items-center gap-2 shadow-xs">
          <CheckCircle2 size={16} className="text-emerald-600" />
          <span className="font-semibold">{actionSuccess}</span>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 border border-red-100 text-red-800 text-xs rounded-xl flex items-center gap-2">
          <AlertCircle size={16} className="text-red-600" />
          <span className="font-semibold">{error}</span>
        </div>
      )}

      {/* COMPOSER MODAL / FORM */}
      {isComposing && (
        <div className="bg-white rounded-2xl border border-neutral-200/60 shadow-md p-6 space-y-6">
          <div className="flex justify-between items-center pb-4 border-b border-neutral-100">
            <h3 className="text-lg font-bold text-neutral-950 flex items-center gap-2">
              <Mail size={18} className="text-red-600" />
              Compose New Message
            </h3>
            <button 
              onClick={() => setIsComposing(false)}
              className="p-1.5 hover:bg-neutral-100 rounded-lg text-neutral-400 hover:text-neutral-600 transition"
            >
              <X size={18} />
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Input fields */}
            <form onSubmit={handleSendEmail} className="lg:col-span-7 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-600 uppercase tracking-wider mb-1.5">To (Recipient Email)</label>
                <input 
                  type="email"
                  required
                  placeholder="customer@email.com"
                  value={composeTo}
                  onChange={(e) => setComposeTo(e.target.value)}
                  className="w-full px-4 py-2.5 bg-neutral-50/50 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-neutral-950 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-600 uppercase tracking-wider mb-1.5">Subject Line</label>
                <input 
                  type="text"
                  required
                  placeholder="e.g. Reservation Confirmation"
                  value={composeSubject}
                  onChange={(e) => setComposeSubject(e.target.value)}
                  className="w-full px-4 py-2.5 bg-neutral-50/50 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-neutral-950 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-600 uppercase tracking-wider mb-1.5">HTML Email Body</label>
                <textarea 
                  required
                  rows={10}
                  placeholder="<p>Type your message or use Gemini Draft tool on the right...</p>"
                  value={composeBody}
                  onChange={(e) => setComposeBody(e.target.value)}
                  className="w-full px-4 py-3 bg-neutral-50/50 border border-neutral-200 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-neutral-950 focus:bg-white leading-relaxed"
                />
              </div>

              <div className="flex justify-between items-center pt-2">
                <button
                  type="button"
                  onClick={handleSaveDraft}
                  className="px-5 py-2.5 border border-neutral-200 text-neutral-700 font-semibold text-xs rounded-xl hover:bg-neutral-50 transition"
                >
                  Save as Draft
                </button>

                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-semibold text-xs px-6 py-2.5 rounded-xl shadow-sm transition disabled:opacity-50"
                >
                  <SendHorizontal size={14} /> Send via Gmail
                </button>
              </div>
            </form>

            {/* Gemini drafting panel */}
            <div className="lg:col-span-5 bg-amber-50/40 border border-amber-200/50 rounded-2xl p-6 space-y-4">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-amber-100 text-amber-700 rounded-lg">
                  <Sparkles size={18} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-neutral-950 font-serif">Gemini AI Smart Drafting</h4>
                  <p className="text-[10px] text-neutral-500">Instantly write high-quality templates using AI</p>
                </div>
              </div>

              <div className="space-y-3 pt-2">
                <div>
                  <label className="block text-[10px] font-bold text-neutral-600 uppercase tracking-wider mb-1">Select Email Template</label>
                  <select
                    value={selectedTemplate}
                    onChange={(e) => setSelectedTemplate(e.target.value)}
                    className="w-full bg-white border border-neutral-200 px-3 py-2 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-amber-500"
                  >
                    <option value="custom">Custom Instructions Only</option>
                    <option value="confirm_booking">Table Reservation Confirmation</option>
                    <option value="confirm_order">Live Order Receipt & Preparation</option>
                    <option value="welcome_promo">Welcome Promo Discount (WELCOME10)</option>
                    <option value="delay_apology">Apology for Service Delay</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-neutral-600 uppercase tracking-wider mb-1">Custom Prompt / Details</label>
                  <textarea
                    rows={4}
                    value={customAiPrompt}
                    onChange={(e) => setCustomAiPrompt(e.target.value)}
                    placeholder="Enter customer details, order item, time, custom instructions, or leave blank to auto-generate default format."
                    className="w-full bg-white border border-neutral-200 p-3 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-amber-500 leading-relaxed"
                  />
                </div>

                <button
                  type="button"
                  onClick={generateAiDraft}
                  disabled={aiGenerating}
                  className="w-full flex items-center justify-center gap-2 bg-amber-700 hover:bg-amber-800 text-white font-bold text-xs py-2.5 rounded-xl transition shadow-xs disabled:opacity-50"
                >
                  {aiGenerating ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      Gemini drafting...
                    </>
                  ) : (
                    <>
                      <Sparkles size={14} />
                      Generate AI Email Draft
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CORE MAILBOX SPLIT VIEW */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 bg-white border border-neutral-200/60 rounded-2xl shadow-xs overflow-hidden min-h-[560px]">
        
        {/* Left Side: Mailbox Navigation & List (5 Cols) */}
        <div className="lg:col-span-5 border-r border-neutral-100 flex flex-col h-full min-h-[500px]">
          {/* Folders navigation */}
          <div className="flex border-b border-neutral-100 bg-neutral-50/50 p-2 gap-1 shrink-0">
            <button
              onClick={() => setActiveFolder('INBOX')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition ${
                activeFolder === 'INBOX' 
                  ? 'bg-neutral-900 text-white shadow-xs' 
                  : 'text-neutral-500 hover:bg-neutral-100'
              }`}
            >
              <Inbox size={14} /> Inbox
            </button>
            <button
              onClick={() => setActiveFolder('SENT')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition ${
                activeFolder === 'SENT' 
                  ? 'bg-neutral-900 text-white shadow-xs' 
                  : 'text-neutral-500 hover:bg-neutral-100'
              }`}
            >
              <Send size={14} /> Sent
            </button>
            <button
              onClick={() => setActiveFolder('DRAFT')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition ${
                activeFolder === 'DRAFT' 
                  ? 'bg-neutral-900 text-white shadow-xs' 
                  : 'text-neutral-500 hover:bg-neutral-100'
              }`}
            >
              <FileText size={14} /> Drafts
            </button>
          </div>

          {/* Search bar */}
          <div className="p-4 border-b border-neutral-100 shrink-0">
            <div className="relative">
              <Search className="absolute left-3 top-3 text-neutral-400" size={16} />
              <input
                type="text"
                placeholder={`Search ${activeFolder.toLowerCase()}...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && loadEmails()}
                className="w-full pl-9 pr-4 py-2 bg-neutral-50 border border-neutral-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-neutral-900"
              />
            </div>
          </div>

          {/* Messages list */}
          <div className="flex-1 overflow-y-auto max-h-[420px] divide-y divide-neutral-100">
            {loading ? (
              <div className="py-20 text-center space-y-2 flex flex-col items-center">
                <Loader2 className="text-neutral-400 animate-spin" size={28} />
                <p className="text-xs text-neutral-500 font-medium">Fetching emails from Gmail...</p>
              </div>
            ) : emails.length === 0 ? (
              <div className="py-24 text-center space-y-2 flex flex-col items-center">
                <Mail className="text-neutral-300" size={32} />
                <h5 className="font-semibold text-neutral-700 text-sm">No messages found</h5>
                <p className="text-xs text-neutral-400">Your {activeFolder.toLowerCase()} folder is empty.</p>
              </div>
            ) : (
              emails.map((email) => {
                const isSelected = selectedEmail?.id === email.id;
                const isUnread = email.labels.includes('UNREAD');
                return (
                  <div
                    key={email.id}
                    onClick={() => {
                      setSelectedEmail(email);
                      setIsComposing(false);
                    }}
                    className={`p-4 text-left cursor-pointer transition relative border-l-3 ${
                      isSelected 
                        ? 'bg-amber-700/5 border-amber-700' 
                        : isUnread 
                          ? 'bg-neutral-50/40 border-neutral-400' 
                          : 'border-transparent hover:bg-neutral-50/50'
                    }`}
                  >
                    <div className="flex justify-between items-start gap-2 mb-1">
                      <span className={`text-xs font-bold truncate ${isUnread ? 'text-neutral-900 font-extrabold' : 'text-neutral-700'}`}>
                        {email.from.split('<')[0]?.replace(/"/g, '') || email.from}
                      </span>
                      <span className="text-[10px] text-neutral-400 whitespace-nowrap shrink-0 font-medium">{email.date}</span>
                    </div>
                    <h5 className={`text-xs truncate mb-1 ${isUnread ? 'text-neutral-950 font-bold' : 'text-neutral-800'}`}>
                      {email.subject}
                    </h5>
                    <p className="text-[11px] text-neutral-500 line-clamp-2 leading-relaxed">
                      {email.snippet}
                    </p>
                    {isUnread && (
                      <span className="absolute right-3 bottom-3 w-1.5 h-1.5 bg-neutral-900 rounded-full" />
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Side: Message Detail Display (7 Cols) */}
        <div className="lg:col-span-7 flex flex-col h-full min-h-[500px] bg-neutral-50/30">
          {selectedEmail ? (
            <div className="flex flex-col h-full flex-1">
              {/* Email details header */}
              <div className="bg-white p-6 border-b border-neutral-100 flex justify-between items-start gap-4">
                <div className="space-y-1.5 min-w-0">
                  <h3 className="text-base font-bold text-neutral-900 leading-tight">
                    {selectedEmail.subject}
                  </h3>
                  <div className="flex flex-wrap gap-x-2 gap-y-1 text-xs text-neutral-500">
                    <span className="font-semibold text-neutral-700">From:</span>
                    <span className="truncate">{selectedEmail.from}</span>
                    <span className="text-neutral-300">|</span>
                    <span>{selectedEmail.date}</span>
                  </div>
                </div>

                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={() => handleSetupReply(selectedEmail)}
                    className="flex items-center gap-1.5 p-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded-xl text-xs font-bold transition"
                    title="Reply using AI drafting"
                  >
                    <CornerUpLeft size={14} /> Reply
                  </button>
                  <button
                    onClick={() => handleTrashMessage(selectedEmail.id)}
                    className="p-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl transition"
                    title="Move email to trash"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              {/* Email Body Area */}
              <div className="flex-1 p-6 overflow-y-auto bg-white max-h-[380px]">
                <div 
                  className="prose prose-sm max-w-none text-neutral-800 text-sm leading-relaxed whitespace-pre-line break-words font-sans"
                  dangerouslySetInnerHTML={{ __html: selectedEmail.body }}
                />
              </div>

              {/* Quick AI Response Footer Card */}
              <div className="p-4 bg-neutral-50 border-t border-neutral-100 flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <Sparkles size={14} className="text-amber-500 shrink-0" />
                  <span className="text-xs text-neutral-600 font-medium">Need to compose a professional reply?</span>
                </div>
                <button
                  onClick={() => handleSetupReply(selectedEmail)}
                  className="flex items-center gap-1 bg-amber-700 hover:bg-amber-800 text-white font-bold text-[11px] px-3 py-1.5 rounded-lg transition shadow-inner"
                >
                  <Sparkles size={12} />
                  Draft AI Response
                </button>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-12 text-center text-neutral-400">
              <Inbox size={48} className="text-neutral-300 mb-3" />
              <h5 className="font-semibold text-neutral-700 text-sm">No message selected</h5>
              <p className="text-xs text-neutral-400 mt-1 max-w-xs">
                Select an email from your {activeFolder.toLowerCase()} folder to read, reply, or delete.
              </p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
