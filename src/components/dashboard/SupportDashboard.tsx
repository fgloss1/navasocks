"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  CheckCircle2,
  ChevronRight,
  LifeBuoy,
  Loader2,
  MessageCircle,
  Plus,
  RefreshCw,
  Send,
  Ticket,
} from "lucide-react";
import { useSitePreferences } from "@/components/SitePreferences";
import { getSupportText } from "@/lib/supportTranslations";

type SupportTicket = {
  id: number;
  category: string;
  subject: string;
  message: string;
  status: string;
  createdAt?: string;
  updatedAt?: string;
};

type SupportMessage = {
  id: number;
  senderType: "customer" | "support";
  message: string;
  createdAt?: string;
};

const CATEGORY_VALUES = ["General", "Proxy", "Billing", "Account", "Technical"] as const;

function getDateLocale(language: string) {
  if (language === "es-ar") return "es-AR";
  if (language === "zh") return "zh-CN";
  return language || "en";
}

export default function SupportDashboard() {
  const { dark, language } = useSitePreferences();
  const searchParams = useSearchParams();

  const [category, setCategory] = useState<(typeof CATEGORY_VALUES)[number]>("General");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [selectedTicketId, setSelectedTicketId] = useState<number | null>(null);
  const [conversation, setConversation] = useState<SupportMessage[]>([]);
  const [reply, setReply] = useState("");
  const [loadingTickets, setLoadingTickets] = useState(false);
  const [loadingConversation, setLoadingConversation] = useState(false);
  const [creating, setCreating] = useState(false);
  const [sending, setSending] = useState(false);
  const [notice, setNotice] = useState("");

  const copy = (key: Parameters<typeof getSupportText>[1]) =>
    getSupportText(language, key);

  const selectedTicket = useMemo(
    () => tickets.find((ticket) => ticket.id === selectedTicketId) ?? null,
    [tickets, selectedTicketId]
  );

  const openCount = useMemo(
    () => tickets.filter((ticket) => String(ticket.status || "").toLowerCase() === "open").length,
    [tickets]
  );

  const formatDate = (value?: string) => {
    if (!value) return "";
    const timestamp = new Date(value);
    if (!Number.isFinite(timestamp.getTime())) return "";
    return timestamp.toLocaleString(getDateLocale(language));
  };

  const statusLabel = (status?: string) => {
    const normalized = String(status || "open").toLowerCase();
    if (normalized === "pending") return copy("statusPending");
    if (normalized === "closed") return copy("statusClosed");
    return copy("statusOpen");
  };

  const categoryLabel = (value: string) => {
    if (value === "Proxy") return copy("proxy");
    if (value === "Billing") return copy("billing");
    if (value === "Account") return copy("account");
    if (value === "Technical") return copy("technical");
    return copy("general");
  };

  const loadTickets = async (preserveNotice = false) => {
    setLoadingTickets(true);
    if (!preserveNotice) setNotice("");

    try {
      const response = await fetch("/api/support/create", {
        method: "GET",
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok) {
        setNotice(data?.error || copy("unableLoad"));
        return;
      }

      const nextTickets = Array.isArray(data?.tickets) ? data.tickets : [];
      setTickets(nextTickets);

      if (
        selectedTicketId !== null &&
        !nextTickets.some((ticket: SupportTicket) => Number(ticket.id) === selectedTicketId)
      ) {
        setSelectedTicketId(null);
        setConversation([]);
      }
    } catch {
      setNotice(copy("unableLoad"));
    } finally {
      setLoadingTickets(false);
    }
  };

  const loadConversation = async (ticketId: number) => {
    setSelectedTicketId(ticketId);
    setLoadingConversation(true);
    setConversation([]);
    setNotice("");

    try {
      const response = await fetch(
        `/api/support/create?ticketId=${encodeURIComponent(ticketId)}`,
        { cache: "no-store" }
      );

      const data = await response.json();

      if (!response.ok) {
        setNotice(data?.error || copy("unableConversation"));
        return;
      }

      setConversation(
        Array.isArray(data?.messages) ? data.messages : []
      );
    } catch {
      setNotice(copy("unableConversation"));
    } finally {
      setLoadingConversation(false);
    }
  };

  const createTicket = async () => {
    const cleanSubject = subject.trim();
    const cleanMessage = message.trim();

    if (!cleanSubject || !cleanMessage) {
      setNotice(copy("required"));
      return;
    }

    setCreating(true);
    setNotice("");

    try {
      const response = await fetch("/api/support/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category,
          subject: cleanSubject,
          message: cleanMessage,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setNotice(data?.error || copy("unableCreate"));
        return;
      }

      setSubject("");
      setMessage("");
      setCategory("General");

      const createdTicket = data?.ticket as SupportTicket | undefined;

      if (createdTicket?.id) {
        setNotice(`Ticket #${createdTicket.id} ${copy("created")}`);
        setSelectedTicketId(Number(createdTicket.id));
      } else {
        setNotice(copy("created"));
      }

      await loadTickets(true);

      if (createdTicket?.id) {
        await loadConversation(Number(createdTicket.id));
      }
    } catch {
      setNotice(copy("unableCreate"));
    } finally {
      setCreating(false);
    }
  };

  const sendReply = async () => {
    const cleanReply = reply.trim();

    if (!cleanReply || selectedTicketId === null) return;

    setSending(true);
    setNotice("");

    try {
      const response = await fetch("/api/support/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ticketId: selectedTicketId,
          message: cleanReply,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setNotice(data?.error || copy("unableReply"));
        return;
      }

      setReply("");
      setConversation(
        Array.isArray(data?.messages) ? data.messages : []
      );

      if (data?.ticket) {
        setTickets((current) =>
          current.map((ticket) =>
            ticket.id === Number(selectedTicketId)
              ? {
                  ...ticket,
                  status: data.ticket.status,
                  updatedAt: data.ticket.updatedAt,
                }
              : ticket
          )
        );
      }
    } catch {
      setNotice(copy("unableReply"));
    } finally {
      setSending(false);
    }
  };

  useEffect(() => {
    void loadTickets();

    const isRefund = searchParams.get("reason") === "refund";
    const badIp = searchParams.get("ip");
    const badPort = searchParams.get("port");

    if (isRefund && badIp) {
      setCategory("Proxy");
      setSubject(`Refund Request: Bad Proxy IP ${badIp}`);
      setMessage(
        `Hello Support Team,\n\nI am requesting a refund for this proxy instance because it appears to be dead/offline:\n\nProxy IP: ${badIp}\nPort Allocation: ${badPort || "N/A"}\n\nPlease review this transaction's logs. Thank you.`
      );
    }
  }, [searchParams]);

  return (
    <div className="space-y-5">
      <section
  className="rounded-2xl border border-cyan-900/40 bg-white dark:bg-[#0e1628] p-5 sm:p-6"
  style={{ zoom: "0.7" }}
>        <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-5">
          <div className="flex items-start gap-3">
            <div className="w-11 h-11 rounded-xl bg-cyan-500/10 border border-cyan-800/50 flex items-center justify-center shrink-0">
              <LifeBuoy className="w-5 h-5 text-cyan-400" />
            </div>

            <div>
              <p className="text-[10px] uppercase tracking-[0.2em] text-cyan-400 font-mono">
                {copy("eyebrow")}
              </p>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-1">
                {copy("title")}
              </h2>
              <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 mt-1 max-w-2xl leading-5">
                {copy("description")}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 min-w-[190px]">
            <div className="rounded-xl border border-slate-300 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 px-3 py-3">
              <p className="text-[9px] uppercase tracking-wider font-mono text-slate-700 dark:text-slate-400">
                {copy("totalTickets")}
              </p>
              <p className="text-lg font-black mt-1">{tickets.length}</p>
            </div>
            <div className="rounded-xl border border-emerald-900/40 bg-emerald-950/10 px-3 py-3">
              <p className="text-[9px] uppercase tracking-wider font-mono text-emerald-500/80">
                {copy("openTickets")}
              </p>
              <p className="text-lg font-black mt-1 text-emerald-500">
                {openCount}
              </p>
            </div>
          </div>
        </div>
      </section>

      {notice && (
        <div className="rounded-xl border border-cyan-900/40 bg-cyan-950/10 px-4 py-3 text-xs text-cyan-700 dark:text-cyan-300 font-mono">
          {notice}
        </div>
      )}

<div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)] gap-4">
<section className="grid xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] gap-5">
        <div className="rounded-2xl border-2 border-slate-300 dark:border-slate-800 bg-white dark:bg-[#0e1628] p-5 sm:p-6">
          <div className="flex items-center gap-2">
            <Plus className="w-4 h-4 text-cyan-400" />
            <div>
              <p className="text-[10px] uppercase tracking-[0.18em] text-cyan-700 dark:text-cyan-400 font-mono">{copy("newTicket")}</p>
              <h3 className="text-base font-bold mt-1">{copy("subject")}</h3>
            </div>
          </div>

          <div className="mt-5 space-y-4">
            <div>
              <label className="block text-[10px] uppercase tracking-wider text-slate-700 dark:text-slate-400 font-mono mb-1.5">
                {copy("category")}
              </label>
              <select
                value={category}
                onChange={(event) =>
                  setCategory(event.target.value as (typeof CATEGORY_VALUES)[number])
                }
                className="w-full rounded-xl border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 py-2.5 text-xs outline-none focus:border-cyan-500"
              >
                {CATEGORY_VALUES.map((value) => (
                  <option key={value} value={value}>
                    {categoryLabel(value)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] uppercase tracking-wider text-slate-700 dark:text-slate-400 font-mono mb-1.5">
                {copy("subject")}
              </label>
              <input
                value={subject}
                onChange={(event) => setSubject(event.target.value)}
                placeholder={copy("subjectPlaceholder")}
                maxLength={160}
                className="w-full rounded-xl border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 py-2.5 text-xs outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <div className="flex items-center justify-between gap-3 mb-1.5">
                <label className="text-[10px] uppercase tracking-wider text-slate-500 font-mono">
                  {copy("message")}
                </label>
                <span className="text-[9px] font-mono text-slate-700 dark:text-slate-400">
                  {message.length}/5000
                </span>
              </div>
              <textarea
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                placeholder={copy("messagePlaceholder")}
                rows={8}
                maxLength={5000}
                className="w-full resize-y rounded-xl border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 py-3 text-xs outline-none focus:border-cyan-500"
              />
            </div>

            <button
              type="button"
              onClick={createTicket}
              disabled={creating}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-cyan-500 px-4 py-3 text-xs font-black text-slate-950 hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {creating ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Ticket className="w-4 h-4" />
              )}
              {creating ? copy("creatingTicket") : copy("createTicket")}
            </button>
          </div>
        </div>

        <div className="rounded-2xl border-2 border-slate-300 dark:border-slate-800 bg-white dark:bg-[#0e1628] overflow-hidden">
          <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-slate-300 dark:border-slate-800">
            <div>
              <p className="text-[10px] uppercase tracking-[0.18em] text-cyan-700 dark:text-cyan-400 font-mono">{copy("myTickets")}</p>
              <h3 className="text-base font-bold mt-1">{tickets.length}</h3>
            </div>

            <button
              type="button"
              onClick={() => void loadTickets()}
              disabled={loadingTickets}
              title={copy("refresh")}
              className="inline-flex items-center justify-center rounded-lg border border-slate-300 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-2.5 py-2 text-slate-500 hover:text-cyan-400 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loadingTickets ? "animate-spin" : ""}`} />
            </button>
          </div>

          <div className="max-h-[520px] overflow-y-auto p-3">
            {loadingTickets ? (
              <div className="flex min-h-[240px] items-center justify-center text-xs font-mono text-slate-700 dark:text-slate-400">
                {copy("loading")}
              </div>
            ) : tickets.length === 0 ? (
              <div className="min-h-[240px] flex items-center justify-center text-center px-6">
                <div>
                  <MessageCircle className="w-7 h-7 mx-auto text-slate-700 dark:text-slate-500" />
                  <p className="text-sm font-bold mt-3">{copy("noTickets")}</p>
                  <p className="text-xs text-slate-700 dark:text-slate-400 mt-2 leading-5">
                    {copy("noTicketsDescription")}
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                {tickets.map((ticket) => {
                  const selected = ticket.id === selectedTicketId;
                  const status = String(ticket.status || "open").toLowerCase();

                  return (
                    <button
                      key={ticket.id}
                      type="button"
                      onClick={() => void loadConversation(ticket.id)}
                      className={[
                        "w-full rounded-xl border p-4 text-left transition",
                        selected
                          ? "border-cyan-700 bg-cyan-950/20"
                          : "border-slate-300 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 hover:border-cyan-800/60",
                      ].join(" ")}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-[9px] uppercase tracking-wider font-mono text-cyan-400">
                              #{ticket.id}
                            </span>
                            <span className="text-[9px] uppercase tracking-wider font-mono text-slate-700 dark:text-slate-400">
                              {categoryLabel(ticket.category)}
                            </span>
                          </div>

                          <h4 className="text-sm font-bold mt-1 truncate">
                            {ticket.subject}
                          </h4>

                          <p className="text-[9px] text-slate-700 dark:text-slate-400 mt-1">
                            {formatDate(ticket.createdAt)}
                          </p>
                        </div>

                        <span
                          className={[
                            "shrink-0 rounded-md border px-2 py-1 text-[9px] font-black font-mono",
                            status === "closed"
                              ? "border-slate-700 bg-slate-900 text-slate-400"
                              : status === "pending"
                                ? "border-amber-800/60 bg-amber-950/20 text-amber-400"
                                : "border-emerald-900/60 bg-emerald-950/20 text-emerald-400",
                          ].join(" ")}
                        >
                          {statusLabel(ticket.status)}
                        </span>
                      </div>

                      <div className="flex items-center justify-between gap-3 mt-3">
                        <p className="text-[11px] text-slate-700 dark:text-slate-400 line-clamp-2 leading-5">
                          {ticket.message}
                        </p>
                        <ChevronRight className="w-4 h-4 text-slate-700 dark:text-slate-500 shrink-0" />
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="rounded-2xl border-2 border-slate-300 dark:border-slate-800 bg-white dark:bg-[#0e1628] overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-300 dark:border-slate-800 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-[0.18em] text-cyan-400 font-mono">
              {copy("conversation")}
            </p>
            <h3 className="text-sm font-bold mt-1 truncate">
              {selectedTicket
                ? `#${selectedTicket.id} · ${selectedTicket.subject}`
                : copy("selectTicket")}
            </h3>
          </div>

          {selectedTicket && (
            <span className="shrink-0 rounded-md border border-emerald-900/60 bg-emerald-950/20 px-2.5 py-1.5 text-[9px] font-black font-mono text-emerald-400">
              {statusLabel(selectedTicket.status)}
            </span>
          )}
        </div>

        {selectedTicketId === null ? (
          <div className="min-h-[280px] flex items-center justify-center text-center px-6">
            <div>
              <CheckCircle2 className="w-7 h-7 mx-auto text-slate-700 dark:text-slate-500" />
              <p className="text-sm font-bold mt-3">{copy("selectTicket")}</p>
              <p className="text-xs text-slate-500 mt-2 max-w-md leading-5">
                {copy("selectTicketDescription")}
              </p>
            </div>
          </div>
        ) : (
          <div className="p-4 sm:p-5">
            <div className="min-h-[280px] max-h-[520px] overflow-y-auto space-y-3 pr-1">
              {loadingConversation ? (
                <div className="min-h-[240px] flex items-center justify-center text-xs font-mono text-slate-700 dark:text-slate-400">
                  {copy("loading")}
                </div>
              ) : conversation.length === 0 ? (
                <div className="min-h-[240px] flex items-center justify-center text-xs font-mono text-slate-700 dark:text-slate-400">
                  {copy("noMessages")}
                </div>
              ) : (
                conversation.map((item) => {
                  const fromSupport = item.senderType === "support";

                  return (
                    <div
                      key={item.id}
                      className={[
                        "max-w-[92%] rounded-2xl border p-4",
                        fromSupport
                          ? "mr-auto border-cyan-900/50 bg-cyan-950/10"
                          : "ml-auto border-slate-300 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/70",
                      ].join(" ")}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-[10px] uppercase tracking-wider font-black font-mono text-slate-500">
                          {fromSupport ? copy("support") : copy("you")}
                        </p>
                        <p className="text-[9px] text-slate-700 dark:text-slate-400">
                          {formatDate(item.createdAt)}
                        </p>
                      </div>
                      <p className="text-xs text-slate-700 dark:text-slate-300 mt-2 whitespace-pre-wrap leading-5">
                        {item.message}
                      </p>
                    </div>
                  );
                })
              )}
            </div>

            <div className="mt-4 pt-4 border-t border-slate-300 dark:border-slate-800">
              <div className="flex items-end gap-2">
                <div className="min-w-0 flex-1">
                  <textarea
                    value={reply}
                    onChange={(event) => setReply(event.target.value)}
                    placeholder={copy("replyPlaceholder")}
                    rows={3}
                    maxLength={5000}
                    disabled={sending}
                    className="w-full resize-none rounded-xl border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 py-3 text-xs outline-none focus:border-cyan-500 disabled:opacity-50"
                  />
                  <div className="mt-1 text-[9px] font-mono text-slate-700 dark:text-slate-400">
                    {reply.length}/5000 {copy("characters")}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => void sendReply()}
                  disabled={sending || !reply.trim()}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-cyan-500 px-4 py-3 text-[10px] font-black text-slate-950 hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {sending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                  <span className="hidden sm:inline">
                    {sending ? copy("sending") : copy("sendReply")}
                  </span>
                </button>
              </div>
            </div>
          </div>
        )}
      </section>
</div>
    </div>
  );
}
