"use client";

import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import {
  MessageSquare,
  Search,
  RefreshCw,
  Phone,
  User as UserIcon,
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { T } from "@/styles/theme";

interface Message {
  id: string;
  lead_id: number | null;
  name: string | null;
  phone: string;
  message_content: string;
  type: "Inbound" | "Outbound";
  status: string | null;
  created_at: string;
}

export default function MessagesPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPhone, setSelectedPhone] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchMessages();

    // Set up Realtime subscription to listen for new messages
    const channel = supabase
      .channel("maddy_messages_changes")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "maddy_candidate_messages",
        },
        (payload) => {
          console.log("New message received:", payload.new);
          // Trigger a full refetch to keep everything perfectly in sync
          fetchMessages();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  async function fetchMessages() {
    setLoading(true);
    setError(null);
    try {
      const { data, error: supabaseError } = await supabase
        .from("maddy_candidate_messages")
        .select("*")
        .order("created_at", { ascending: true });

      if (supabaseError) {
        console.error("Supabase Error:", supabaseError);
        setError(`Failed to fetch: ${supabaseError.message}`);
      } else {
        const msgs = data || [];
        setMessages(msgs);

        if (msgs.length > 0 && !selectedPhone) {
          const map = new Map<string, string>();
          msgs.forEach((m) => map.set(m.phone, m.created_at));
          const sortedEntries = Array.from(map.entries()).sort(
            (a, b) => new Date(b[1]).getTime() - new Date(a[1]).getTime(),
          );
          if (sortedEntries.length > 0) {
            setSelectedPhone(sortedEntries[0][0]);
          }
        }
      }
    } catch (err: any) {
      console.error("Unexpected error:", err);
      setError(
        err.message || "An unexpected error occurred while fetching messages.",
      );
    } finally {
      setLoading(false);
    }
  }

  const formatUKTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString("en-GB", {
      timeZone: "Europe/London",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const contacts = useMemo(() => {
    const map = new Map<string, { name: string | null; lastMsg: Message }>();
    messages.forEach((m) => {
      const existing = map.get(m.phone);
      if (
        !existing ||
        new Date(m.created_at) >= new Date(existing.lastMsg.created_at)
      ) {
        map.set(m.phone, { name: m.name, lastMsg: m });
      }
    });

    return Array.from(map.entries())
      .map(([phone, data]) => ({ phone, ...data }))
      .sort(
        (a, b) =>
          new Date(b.lastMsg.created_at).getTime() -
          new Date(a.lastMsg.created_at).getTime(),
      );
  }, [messages]);

  const filteredContacts = contacts.filter(
    (c) =>
      c.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.phone.includes(searchTerm),
  );

  const selectedMessages = messages.filter((m) => m.phone === selectedPhone);
  const selectedContact = contacts.find((c) => c.phone === selectedPhone);

  return (
    <div
      className={`flex flex-col h-screen overflow-hidden font-sans bg-[#f3f4f6]`}
    >
      {/* Header */}
      <div className="px-8 pt-8 pb-4">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-gray-900 flex items-center gap-3">
              <div className="p-2 bg-[#FDB8D7]/20 rounded-xl">
                <MessageSquare className="w-8 h-8 text-[#be185d]" />
              </div>
              Message Logs
            </h1>
          </div>
          <button
            onClick={fetchMessages}
            className={T.cls.btnGhost}
          >
            <RefreshCw className={`w-5 h-5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden p-8 pt-4 gap-6">
        {error ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-12 bg-white/50 rounded-[2.5rem] border border-red-100 shadow-sm backdrop-blur-md">
            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-6">
              <RefreshCw className="w-8 h-8 text-red-400" />
            </div>
            <h2 className="text-2xl font-black text-gray-900 mb-2">
              Connection Issue
            </h2>
            <p className="text-gray-500 max-w-md mb-8">{error}</p>
            <button
              onClick={fetchMessages}
              className={T.cls.btnPrimary}
            >
              Try Again
            </button>
          </div>
        ) : (
          <>
            {/* Sidebar */}
            <div
              className={`${T.cls.tableWrap} w-full max-w-[360px] flex flex-col overflow-hidden shadow-sm bg-white/80 backdrop-blur-sm border-gray-100`}
            >
              <div className="p-6 border-b border-gray-100">
                <p className={T.cls.infoLabel}>Conversations</p>
                <h2 className="text-xl font-black mt-1 mb-6 text-gray-900">
                  Contacts
                </h2>
                <div className="relative group">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-[#be185d] transition-colors" />
                  <input
                    type="text"
                    placeholder="Search by name or number..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className={`${T.cls.input} pl-11 bg-gray-50/50 focus:bg-white`}
                  />
                </div>
              </div>

              <ScrollArea className="flex-1">
                <div className="p-2 space-y-1">
                  {loading ? (
                    Array.from({ length: 6 }).map((_, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-4 p-4 rounded-2xl animate-pulse"
                      >
                        <div className="w-11 h-11 rounded-full bg-gray-100" />
                        <div className="flex-1">
                          <div className="w-24 h-3 bg-gray-100 rounded mb-2" />
                          <div className="w-full h-2 bg-gray-50 rounded" />
                        </div>
                      </div>
                    ))
                  ) : filteredContacts.length === 0 ? (
                    <div className="p-8 text-center text-gray-400">
                      <Search className="w-8 h-8 mx-auto mb-3 opacity-20" />
                      <p className="text-xs font-bold uppercase tracking-widest">
                        No contacts found
                      </p>
                    </div>
                  ) : (
                    filteredContacts.map((contact) => (
                      <button
                        key={contact.phone}
                        onClick={() => setSelectedPhone(contact.phone)}
                        className={`w-full flex items-center gap-4 p-4 rounded-3xl transition-all text-left ${
                          selectedPhone === contact.phone
                            ? "bg-[#FDB8D7]/20 ring-1 ring-[#FDB8D7]/30"
                            : "hover:bg-gray-50/80"
                        }`}
                      >
                        <div
                          className={`w-11 h-11 rounded-full flex items-center justify-center text-lg font-black shrink-0 ${
                            selectedPhone === contact.phone
                              ? "bg-[#be185d] text-white"
                              : "bg-gray-200 text-gray-400"
                          }`}
                        >
                          {(
                            contact.name?.[0] || contact.phone.slice(-1)
                          ).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-baseline mb-0.5 min-w-0">
                            <div
                              className={`font-bold text-sm ${selectedPhone === contact.phone ? "text-[#be185d]" : "text-gray-900"} flex items-center gap-1.5 min-w-0`}
                            >
                              <span className="truncate">
                                {contact.name || "Unknown"}
                              </span>
                            </div>
                            <span className="text-[10px] font-semibold text-gray-400 shrink-0 ml-2">
                              {formatUKTime(contact.lastMsg.created_at)}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500 truncate max-w-[180px]">
                            {contact.lastMsg.message_content}
                          </p>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </ScrollArea>
            </div>

            {/* Chat Pane */}
            <div
              className={`${T.cls.tableWrap} flex-1 flex flex-col overflow-hidden relative shadow-sm bg-white/60 backdrop-blur-sm border-gray-100`}
            >
              {selectedPhone ? (
                <>
                  {/* Chat Top Bar */}
                  <div className="px-8 py-5 border-b border-gray-100 flex justify-between items-center bg-white/40 backdrop-blur-md sticky top-0 z-10">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-[#FDB8D7]/20 rounded-full flex items-center justify-center border border-[#FDB8D7]/30">
                        <UserIcon className="w-5 h-5 text-[#be185d]" />
                      </div>
                      <div className="min-w-0">
                        <h3
                          className="text-lg font-black tracking-tight text-gray-900 truncate max-w-[400px]"
                          title={selectedContact?.name || "Candidate"}
                        >
                          {selectedContact?.name || "Candidate"}
                        </h3>
                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-0.5 flex items-center gap-1.5">
                          <Phone className="w-3 h-3 text-[#be185d]/40" />
                          {selectedPhone}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Messages Feed */}
                  <ScrollArea className="flex-1 px-8 py-8 bg-gray-50/40">
                    <div className="space-y-6 max-w-3xl mx-auto">
                      {selectedMessages.map((msg) => {
                        const isOutbound = msg.type === "Outbound";
                        return (
                          <div
                            key={msg.id}
                            className={`flex flex-col ${isOutbound ? "items-end" : "items-start"}`}
                          >
                            <div
                              className={`max-w-[85%] rounded-3xl p-5 shadow-sm relative break-words border ${
                                isOutbound
                                  ? "bg-[#FDB8D7]/10 border-[#FDB8D7]/20 text-gray-800 rounded-tr-md"
                                  : "bg-white border-gray-200 text-gray-700 rounded-tl-md"
                              }`}
                            >
                              <p className="text-[14px] leading-relaxed whitespace-pre-wrap font-medium">
                                {msg.message_content}
                              </p>
                              <div className="text-[9px] mt-3 font-bold text-gray-400 flex justify-end items-center gap-2 uppercase tracking-tighter">
                                {formatUKTime(msg.created_at)}
                                {isOutbound && <span>· SENT</span>}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </ScrollArea>
                </>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-gray-300">
                  <MessageSquare className="w-20 h-20 mb-6 opacity-10" />
                  <p className="text-xl font-black tracking-tight uppercase">
                    Select a conversation
                  </p>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
