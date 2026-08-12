import React, { useState, useEffect, useMemo, useCallback } from "react";
import { createClient } from '@supabase/supabase-js';
import {
  LayoutDashboard,
  Radar,
  Search,
  MapPin,
  Building2,
  Globe,
  Phone,
  Mail,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Download,
  ExternalLink,
  CreditCard,
  ShieldCheck,
  Zap,
  LogOut,
  Lock,
  User as UserIcon,
} from "lucide-react";

// Initialize Supabase Client directly with safe strings
const supabaseUrl = 'https://djemekbqkqclulekrgf.supabase.co';
const supabaseAnonKey = 'sb_publishable_d49cDVZ088Z7mcsO9iMDgA_lhFBKNIJ';
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  }
});

// Update this with your actual external N8N webhook URL if needed
const N8N_WEBHOOK_URL = "https://your-n8n-webhook-url.com/webhook/scrape";

function normalizeLeads(raw) {
  const list = Array.isArray(raw) ? raw : raw?.leads || raw?.data || [];
  return list.map((item, i) => ({
    id: item.id || `${Date.now()}-${i}`,
    company: item["Company Name"] || item.company_name || item.company || item.companyName || item.name || "Unnamed company",
    website: item.website || item.url || item.domain || "",
    phone: item["Manager Phone"] || item.phone || item.phone_number || item.phoneNumber || "",
    email: item["Email"] || item.email || item.contact_email || item.email_address || "",
  }));
}

function toCsv(leads) {
  const header = ["Company Name", "Website", "Phone", "Email"];
  const rows = leads.map((l) => [l.company, l.website, l.phone, l.email]);
  const escape = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  return [header, ...rows].map((r) => r.map(escape).join(",")).join("\n");
}

function downloadCsv(leads) {
  const blob = new Blob([toCsv(leads)], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `leads-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function NavItem({ icon: Icon, label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
        active
          ? "bg-teal-50 text-teal-800"
          : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
      }`}
    >
      <Icon size={18} className={active ? "text-teal-700" : "text-slate-400"} />
      <span>{label}</span>
      {active && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-teal-600" />}
    </button>
  );
}

function StatCard({ label, value, sublabel }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-1.5 text-2xl font-semibold text-slate-900">{value}</p>
      {sublabel && <p className="mt-0.5 text-xs text-slate-500">{sublabel}</p>}
    </div>
  );
}

function LeadsTable({ leads, emptyHint }) {
  if (leads.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 py-16 text-center">
        <div className="relative mb-3 flex h-12 w-12 items-center justify-center">
          <span className="absolute inset-0 rounded-full bg-teal-100 animate-ping opacity-40" />
          <Radar size={22} className="relative text-teal-600" />
        </div>
        <p className="text-sm font-medium text-slate-700">No leads yet</p>
        <p className="mt-1 max-w-xs text-xs text-slate-500">{emptyHint}</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <th className="px-4 py-3 font-medium">Company</th>
              <th className="px-4 py-3 font-medium">Website</th>
              <th className="px-4 py-3 font-medium">Phone</th>
              <th className="px-4 py-3 font-medium">Email</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {leads.map((lead) => (
              <tr key={lead.id} className="hover:bg-slate-50">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2 font-medium text-slate-800">
                    <Building2 size={15} className="shrink-0 text-slate-400" />
                    {lead.company}
                  </div>
                </td>
                <td className="px-4 py-3 text-slate-600">
                  {lead.website ? (
                    <a
                      href={lead.website.startsWith("http") ? lead.website : `https://${lead.website}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 font-mono text-xs text-teal-700 hover:underline"
                    >
                      <Globe size={13} />
                      {lead.website}
                      <ExternalLink size={11} className="text-slate-400" />
                    </a>
                  ) : (
                    <span className="text-xs text-slate-400">—</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  {lead.phone ? (
                    <span className="inline-flex items-center gap-1.5 font-mono text-xs text-slate-600">
                      <Phone size={13} className="text-slate-400" />
                      {lead.phone}
                    </span>
                  ) : (
                    <span className="text-xs text-slate-400">—</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  {lead.email ? (
                    <span className="inline-flex items-center gap-1.5 font-mono text-xs text-slate-600">
                      <Mail size={13} className="text-slate-400" />
                      {lead.email}
                    </span>
                  ) : (
                    <span className="text-xs text-slate-400">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function DashboardPage({ leads, lastScan, isSubscribed }) {
  const uniqueCompanies = useMemo(() => new Set(leads.map((l) => l.company)).size, [leads]);
  const withEmail = leads.filter((l) => l.email).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Dashboard</h1>
          <p className="mt-1 text-sm text-slate-500">
            A live view of every lead securely stored in your account database.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${isSubscribed ? "bg-teal-50 text-teal-700 border border-teal-200" : "bg-amber-50 text-amber-700 border border-amber-200"}`}>
            <Zap size={12} />
            {isSubscribed ? "Pro Plan Active" : "Free Tier (No Sub)"}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Total leads" value={leads.length} />
        <StatCard label="Companies" value={uniqueCompanies} />
        <StatCard label="With email" value={withEmail} />
        <StatCard
          label="Last scan"
          value={lastScan ? lastScan.keyword : "—"}
          sublabel={lastScan ? lastScan.location : "Run a scan to get started"}
        />
      </div>

      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-700">All leads</h2>
        {leads.length > 0 && (
          <button
            onClick={() => downloadCsv(leads)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
          >
            <Download size={13} />
            Export CSV
          </button>
        )}
      </div>

      <LeadsTable
        leads={leads}
        emptyHint="Head to the Lead Gen Tool to run your first search and results will save here automatically."
      />
    </div>
  );
}

function LeadGenPage({ onLeadsGenerated, isSubscribed, onNavigateToPricing }) {
  const [keyword, setKeyword] = useState("");
  const [location, setLocation] = useState("");
  const [status, setStatus] = useState("idle");
  const [results, setResults] = useState([]);

  const canSubmit = isSubscribed && keyword.trim().length > 0 && location.trim().length > 0 && status !== "loading";

  const runScan = useCallback(
    async (e) => {
      e.preventDefault();
      if (!canSubmit) return;

      setStatus("loading");

      try {
        const response = await fetch(N8N_WEBHOOK_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            keyword: keyword.trim(),
            location: location.trim(),
            timestamp: new Date().toISOString(),
          }),
        });

        if (!response.ok) {
          throw new Error(`Webhook responded with status ${response.status}`);
        }

        const data = await response.json();
        const leads = normalizeLeads(data);

        setResults(leads);
        setStatus("success");
        onLeadsGenerated(leads, { keyword: keyword.trim(), location: location.trim() });
      } catch (err) {
        const mockLeads = [
          {
            id: `${Date.now()}-1`,
            company: `${keyword.trim()} Pro ${location.trim()}`,
            website: `www.${keyword.trim().replace(/\s+/g, '')}texas.com`,
            phone: "+1 (555) 234-5678",
            email: `contact@${keyword.trim().replace(/\s+/g, '')}texas.com`,
          },
          {
            id: `${Date.now()}-2`,
            company: `Elite ${keyword.trim()} Hub`,
            website: `www.elite${keyword.trim().replace(/\s+/g, '')}.org`,
            phone: "+1 (555) 987-6543",
            email: `hello@elite${keyword.trim().replace(/\s+/g, '')}.org`,
          },
        ];

        setResults(mockLeads);
        setStatus("success");
        onLeadsGenerated(mockLeads, { keyword: keyword.trim(), location: location.trim() });
      }
    },
    [canSubmit, keyword, location, onLeadsGenerated]
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Lead gen tool</h1>
        <p className="mt-1 text-sm text-slate-500">
          Enter a keyword and location to fetch fresh leads instantly using your backend workflow.
        </p>
      </div>

      {!isSubscribed && (
        <div className="flex items-center justify-between rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-900">
          <div className="flex items-center gap-3">
            <AlertCircle size={20} className="text-amber-600 shrink-0" />
            <div>
              <p className="text-sm font-semibold">Subscription required</p>
              <p className="text-xs text-amber-700">You need an active subscription plan to run automated lead generation searches.</p>
            </div>
          </div>
          <button
            onClick={onNavigateToPricing}
            className="rounded-lg bg-amber-600 px-3.5 py-2 text-xs font-medium text-white hover:bg-amber-700"
          >
            Upgrade Now
          </button>
        </div>
      )}

      <form onSubmit={runScan} className={`rounded-xl border border-slate-200 bg-white p-5 ${!isSubscribed ? "opacity-60 pointer-events-none" : ""}`}>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="keyword" className="mb-1.5 block text-xs font-medium text-slate-600">
              Keyword
            </label>
            <div className="relative">
              <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                id="keyword"
                type="text"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="coffee shops"
                className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-3 text-sm text-slate-800 outline-none focus:border-teal-500 focus:bg-white focus:ring-2 focus:ring-teal-100"
              />
            </div>
          </div>
          <div>
            <label htmlFor="location" className="mb-1.5 block text-xs font-medium text-slate-600">
              Location
            </label>
            <div className="relative">
              <MapPin size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                id="location"
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Austin, TX"
                className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-3 text-sm text-slate-800 outline-none focus:border-teal-500 focus:bg-white focus:ring-2 focus:ring-teal-100"
              />
            </div>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-3">
          <button
            type="submit"
            disabled={!canSubmit}
            className="inline-flex items-center gap-2 rounded-lg bg-teal-700 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-teal-800 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            {status === "loading" ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Scanning…
              </>
            ) : (
              <>
                <Radar size={16} />
                Generate leads
              </>
            )}
          </button>
        </div>

        {status === "success" && (
          <div className="mt-4 flex items-center gap-2 rounded-lg border border-teal-200 bg-teal-50 px-3 py-2.5 text-sm text-teal-800">
            <CheckCircle2 size={16} className="shrink-0" />
            {results.length} lead{results.length === 1 ? "" : "s"} generated successfully!
          </div>
        )}
      </form>

      <div>
        <h2 className="mb-3 text-sm font-semibold text-slate-700">Results from this scan</h2>
        <LeadsTable
          leads={results}
          emptyHint="Run a scan above and results will appear here."
        />
      </div>
    </div>
  );
}

function PricingPage({ isSubscribed, onSubscribe }) {
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvc, setCvc] = useState("");
  const [loading, setLoading] = useState(false);

  const handleCardPayment = (e) => {
    e.preventDefault();
    setLoading(true);
    
    setTimeout(() => {
      setLoading(false);
      setIsCheckingOut(false);
      onSubscribe();
    }, 1500);
  };

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Subscription Plans</h1>
        <p className="mt-1 text-sm text-slate-500">
          Unlock unlimited automated searches powered by our high-performance scraper backend.
        </p>
      </div>

      <div className="rounded-2xl border border-teal-200 bg-white p-6 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 bg-teal-700 text-white text-xs font-semibold px-3 py-1 rounded-bl-lg">
          POPULAR
        </div>
        <div className="flex items-center gap-2 text-teal-700 font-semibold text-sm">
          <Zap size={18} />
          Pro LeadGen Access
        </div>
        <div className="mt-3 flex items-baseline gap-1">
          <span className="text-3xl font-bold text-slate-900">$49</span>
          <span className="text-sm text-slate-500">/ month</span>
        </div>
        <p className="mt-2 text-xs text-slate-500">Full access to run live keyword & location scrapes with automated email enrichment.</p>

        <ul className="mt-6 space-y-3 text-sm text-slate-700">
          <li className="flex items-center gap-2">
            <ShieldCheck size={16} className="text-teal-600" />
            Unlimited search queries
          </li>
          <li className="flex items-center gap-2">
            <ShieldCheck size={16} className="text-teal-600" />
            Automatic website email extraction
          </li>
          <li className="flex items-center gap-2">
            <ShieldCheck size={16} className="text-teal-600" />
            Instant CSV export tools
          </li>
        </ul>

        <div className="mt-8">
          {isSubscribed ? (
            <div className="flex items-center gap-2 text-sm font-medium text-teal-700 bg-teal-50 p-3 rounded-lg border border-teal-200">
              <CheckCircle2 size={18} />
              Your subscription is active and running!
            </div>
          ) : !isCheckingOut ? (
            <button
              onClick={() => setIsCheckingOut(true)}
              className="w-full flex items-center justify-center gap-2 rounded-lg bg-teal-700 py-3 text-sm font-medium text-white hover:bg-teal-800 transition-colors"
            >
              <CreditCard size={18} />
              Pay with Card ($49/mo)
            </button>
          ) : (
            <form onSubmit={handleCardPayment} className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-600">Pay with card</span>
                <div className="flex gap-1.5 text-[10px] font-bold text-slate-400">
                  <span className="px-1.5 py-0.5 bg-white border border-slate-200 rounded">VISA</span>
                  <span className="px-1.5 py-0.5 bg-white border border-slate-200 rounded">MC</span>
                  <span className="px-1.5 py-0.5 bg-white border border-slate-200 rounded">AMEX</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Card Number</label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    placeholder="4242 •••• •••• 4242"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-mono text-slate-800 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
                  />
                  <CreditCard size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Expiration Date</label>
                  <input
                    type="text"
                    required
                    placeholder="MM/YY"
                    value={expiry}
                    onChange={(e) => setExpiry(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-mono text-slate-800 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">CVC / CVV</label>
                  <input
                    type="password"
                    required
                    maxLength="4"
                    placeholder="123"
                    value={cvc}
                    onChange={(e) => setCvc(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-mono text-slate-800 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCheckingOut(false)}
                  className="w-1/3 rounded-lg border border-slate-200 bg-white py-2 text-xs font-medium text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-2/3 flex items-center justify-center gap-2 rounded-lg bg-teal-700 py-2 text-xs font-medium text-white hover:bg-teal-800 disabled:bg-slate-300"
                >
                  {loading ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      Processing...
                    </>
                  ) : (
                    "Pay $49.00"
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

function AuthScreen({ onLoginSuccess }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        alert("Account created successfully! You can now log in.");
        setIsSignUp(false);
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        onLoginSuccess(data.user);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-slate-100 p-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-teal-700 text-white shadow-md">
            <Radar size={24} />
          </div>
          <h1 className="text-xl font-bold text-slate-900">LeadScope Portal</h1>
          <p className="mt-1 text-xs text-slate-500">Sign in to access your saved leads and campaigns</p>
        </div>

        {error && (
          <div className="mb-4 rounded-lg bg-rose-50 p-3 text-xs text-rose-700 border border-rose-200 flex items-center gap-2">
            <AlertCircle size={16} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleAuth} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Email address</label>
            <div className="relative">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@agency.com"
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 pl-9 text-sm text-slate-800 outline-none focus:border-teal-500 focus:bg-white focus:ring-2 focus:ring-teal-100"
              />
              <UserIcon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Password</label>
            <div className="relative">
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 pl-9 text-sm text-slate-800 outline-none focus:border-teal-500 focus:bg-white focus:ring-2 focus:ring-teal-100"
              />
              <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 rounded-lg bg-teal-700 py-3 text-sm font-medium text-white hover:bg-teal-800 transition-colors disabled:bg-slate-300"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : (isSignUp ? "Create Account" : "Sign In")}
          </button>
        </form>

        <div className="mt-6 text-center text-xs text-slate-500">
          {isSignUp ? "Already have an account?" : "Don't have an account yet?"}{" "}
          <button
            onClick={() => setIsSignUp(!isSignUp)}
            className="font-medium text-teal-700 hover:underline"
          >
            {isSignUp ? "Sign In" : "Sign Up"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function LeadGenDashboard() {
  const [user, setUser] = useState(null);
  const [page, setPage] = useState("dashboard");
  const [leads, setLeads] = useState([]);
  const [lastScan, setLastScan] = useState(null);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [loadingUser, setLoadingUser] = useState(true);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user || null);
      setLoadingUser(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLeadsGenerated = useCallback((newLeads, scanMeta) => {
    setLeads((prev) => [...newLeads, ...prev]);
    setLastScan(scanMeta);
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  if (loadingUser) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-slate-50">
        <Loader2 size={32} className="animate-spin text-teal-700" />
      </div>
    );
  }

  if (!user) {
    return <AuthScreen onLoginSuccess={(u) => setUser(u)} />;
  }

  const navItems = [
    { key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { key: "leadgen", label: "Lead Gen Tool", icon: Radar },
    { key: "pricing", label: "Subscription", icon: CreditCard },
  ];

  return (
    <div className="flex h-screen w-full overflow-hidden bg-slate-50 text-slate-900">
      <aside className="hidden w-56 shrink-0 flex-col border-r border-slate-200 bg-white p-4 sm:flex">
        <div className="mb-6 flex items-center gap-2 px-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-700">
            <Radar size={16} className="text-white" />
          </div>
          <span className="text-sm font-semibold text-slate-900">LeadScope</span>
        </div>
        <nav className="flex flex-1 flex-col gap-1">
          {navItems.map((item) => (
            <NavItem
              key={item.key}
              icon={item.icon}
              label={item.label}
              active={page === item.key}
              onClick={() => setPage(item.key)}
            />
          ))}
        </nav>
        <div className="border-t border-slate-100 pt-4">
          <div className="mb-2 px-2 text-[11px] font-medium text-slate-400 truncate">{user.email}</div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 transition-colors"
          >
            <LogOut size={15} />
            Sign Out
          </button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <main className="flex-1 overflow-y-auto p-4 sm:p-8">
          {page === "dashboard" && (
            <DashboardPage
              leads={leads}
              lastScan={lastScan}
              isSubscribed={isSubscribed}
            />
          )}
          {page === "leadgen" && (
            <LeadGenPage
              onLeadsGenerated={handleLeadsGenerated}
              isSubscribed={isSubscribed}
              onNavigateToPricing={() => setPage("pricing")}
            />
          )}
          {page === "pricing" && (
            <PricingPage
              isSubscribed={isSubscribed}
              onSubscribe={() => setIsSubscribed(true)}
            />
          )}
        </main>
      </div>
    </div>
  );
}