import React, { useState, useMemo, useCallback, useEffect } from "react";
import { supabase } from "./supabase";
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
  Trash2,
  CreditCard,
  ShieldCheck,
  Zap,
} from "lucide-react";

// --- HARDCODED BACKEND CONFIG ---
const N8N_WEBHOOK_URL = "https://your-instance.app.n8n.cloud/webhook/your-production-id";

function normalizeLeads(raw) {
  const list = Array.isArray(raw) ? raw : raw?.leads || raw?.data || [];
  return list.map((item, i) => ({
    id: item.id || `${Date.now()}-${i}`,
    company: item.company_name || item.company || item.companyName || item.name || "Unnamed company",
    website: item.website || item.url || item.domain || "",
    phone: item.phone || item.phone_number || item.phoneNumber || "",
    email: item.email || item.contact_email || item.email_address || "",
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

function DashboardPage({ leads, lastScan, onNavigateToTool, isSubscribed }) {
  const uniqueCompanies = useMemo(() => new Set(leads.map((l) => l.company)).size, [leads]);
  const withEmail = leads.filter((l) => l.email).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Dashboard</h1>
          <p className="mt-1 text-sm text-slate-500">
            A live view of every lead your workflow has generated this session.
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
        emptyHint="Head to the Lead Gen Tool to run your first search and results will show up here automatically."
      />
    </div>
  );
}

function LeadGenPage({ onLeadsGenerated, isSubscribed, onNavigateToPricing }) {
  const [keyword, setKeyword] = useState("");
  const [location, setLocation] = useState("");
  const [status, setStatus] = useState("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [results, setResults] = useState([]);

  const canSubmit = isSubscribed && keyword.trim().length > 0 && location.trim().length > 0 && status !== "loading";

  const runScan = useCallback(
    async (e) => {
      e.preventDefault();
      if (!canSubmit) return;

      setStatus("loading");
      setErrorMessage("");

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
        setStatus("error");
        setErrorMessage(
          err instanceof Error ? err.message : "Something went wrong reaching the webhook."
        );
      }
    },
    [canSubmit, keyword, location, onLeadsGenerated]
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Lead gen tool</h1>
        <p className="mt-1 text-sm text-slate-500">
          Enter a keyword and location to fetch fresh leads instantly using your Apify backend.
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

        {status === "error" && (
          <div className="mt-4 flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2.5 text-sm text-rose-700">
            <AlertCircle size={16} className="mt-0.5 shrink-0" />
            <div>
              <p className="font-medium">Couldn't reach the webhook</p>
              <p className="mt-0.5 text-xs text-rose-600">{errorMessage}</p>
            </div>
          </div>
        )}

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
          emptyHint="Run a scan above and results from your n8n workflow will appear here."
        />
      </div>
    </div>
  );
}

function PricingPage({ isSubscribed, onSubscribe }) {
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
          ) : (
            <button
              onClick={onSubscribe}
              className="w-full flex items-center justify-center gap-2 rounded-lg bg-teal-700 py-3 text-sm font-medium text-white hover:bg-teal-800 transition-colors"
            >
              <CreditCard size={18} />
              Subscribe with Stripe (Mock Checkout)
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function LeadGenDashboard() {
  const [page, setPage] = useState("dashboard");
  const [leads, setLeads] = useState([]);
  const [lastScan, setLastScan] = useState(null);
  const [isSubscribed, setIsSubscribed] = useState(false);

  // Fetch leads from Supabase on load
  useEffect(() => {
    async function fetchLeads() {
      const { data, error } = await supabase.from('leads').select('*');
      if (error) {
        console.error('Error fetching leads:', error);
      } else if (data) {
        setLeads(data);
      }
    }
    fetchLeads();
  }, []);

  const handleLeadsGenerated = useCallback((newLeads, scanMeta) => {
    setLeads((prev) => [...newLeads, ...prev]);
    setLastScan(scanMeta);
  }, []);

  const navItems = [
    { key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { key: "leadgen", label: "Lead Gen Tool", icon: Radar },
    { key: "pricing", label: "Subscription", icon: CreditCard },
  ];

  return (
    <div className="flex h-full min-h-[640px] w-full overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 text-slate-900">
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
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <main className="flex-1 overflow-y-auto p-4 sm:p-8">
          {page === "dashboard" && (
            <DashboardPage
              leads={leads}
              lastScan={lastScan}
              onNavigateToTool={() => setPage("leadgen")}
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