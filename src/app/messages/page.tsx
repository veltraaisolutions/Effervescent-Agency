"use client";

import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import {
  MessageSquare,
  Search,
  RefreshCw,
  MoreVertical,
  Phone,
  Bot,
  User as UserIcon,
  Send
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { T } from "@/styles/theme";

interface Message {
  id: string;
  lead_id: number | null;
  name: string | null;
  phone: string;
  message_content: string;
  type: 'Inbound' | 'Outbound';
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
          msgs.forEach(m => map.set(m.phone, m.created_at));
          const sortedEntries = Array.from(map.entries()).sort((a, b) => 
            new Date(b[1]).getTime() - new Date(a[1]).getTime()
          );
          if (sortedEntries.length > 0) {
            setSelectedPhone(sortedEntries[0][0]);
          }
        }
      }
    } catch (err: any) {
      console.error("Unexpected error:", err);
      setError(err.message || "An unexpected error occurred while fetching messages.");
    } finally {
      setLoading(false);
    }
  }

  const contacts = useMemo(() => {
    const map = new Map<string, { name: string | null; lastMsg: Message }>();
    messages.forEach(m => {
      const existing = map.get(m.phone);
      if (!existing || new Date(m.created_at) >= new Date(existing.lastMsg.created_at)) {
        map.set(m.phone, { name: m.name, lastMsg: m });
      }
    });

    return Array.from(map.entries())
      .map(([phone, data]) => ({ phone, ...data }))
      .sort((a, b) => new Date(b.lastMsg.created_at).getTime() - new Date(a.lastMsg.created_at).getTime());
  }, [messages]);

  const filteredContacts = contacts.filter(c =>
    c.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.phone.includes(searchTerm)
  );

  const selectedMessages = messages.filter(m => m.phone === selectedPhone);
  const selectedContact = contacts.find(c => c.phone === selectedPhone);

  return (
    <div className={`flex flex-col h-screen overflow-hidden font-sans ${T.cls.page}`}>
      {/* Header */}
      <div className="px-8 pt-8 pb-4">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-gray-900 flex items-center gap-3">
              <div className="p-2 bg-[#FDB8D7]/10 rounded-xl">
                <MessageSquare className="w-8 h-8 text-[#FDB8D7]" />
              </div>
              Message Logs
            </h1>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.3em] mt-2">
              REAL-TIME WHATSAPP FEED
            </p>
          </div>
          <button
            onClick={fetchMessages}
            className={T.cls.btnGhost}
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden p-8 pt-4 gap-6">
        {error ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-12 bg-white rounded-[2.5rem] border border-red-100 shadow-sm">
            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-6">
              <RefreshCw className="w-8 h-8 text-red-400" />
            </div>
            <h2 className="text-2xl font-black text-gray-900 mb-2">Connection Issue</h2>
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
            <div className={`${T.cls.tableWrap} w-full max-w-[360px] flex flex-col overflow-hidden shadow-sm`}>
              <div className="p-6 border-b border-gray-100">
                <p className={T.cls.infoLabel}>Conversations</p>
                <h2 className="text-xl font-black mt-1 mb-6 text-gray-900">Contacts</h2>
                <div className="relative group">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-[#FDB8D7] transition-colors" />
                  <input
                    type="text"
                    placeholder="Search contacts..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className={`${T.cls.input} pl-11`}
                  />
                </div>
              </div>

              <ScrollArea className="flex-1">
                <div className="p-2 space-y-1">
                  {loading ? (
                    Array.from({ length: 6 }).map((_, i) => (
                      <div key={i} className="flex items-center gap-4 p-4 rounded-2xl animate-pulse">
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
                      <p className="text-xs font-bold uppercase tracking-widest">No contacts found</p>
                    </div>
                  ) : (
                    filteredContacts.map(contact => (
                      <button
                        key={contact.phone}
                        onClick={() => setSelectedPhone(contact.phone)}
                        className={`w-full flex items-center gap-4 p-4 rounded-3xl transition-all text-left ${selectedPhone === contact.phone
                            ? "bg-[#FDB8D7]/10 ring-1 ring-[#FDB8D7]/20"
                            : "hover:bg-gray-50"
                          }`}
                      >
                        <div className={`w-11 h-11 rounded-full flex items-center justify-center text-lg font-black shrink-0 ${selectedPhone === contact.phone
                            ? "bg-[#FDB8D7] text-white"
                            : "bg-gray-100 text-gray-400"
                          }`}>
                          {(contact.name?.[0] || contact.phone.slice(-1)).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-baseline mb-0.5 min-w-0">
                            <div className={`font-bold text-sm ${selectedPhone === contact.phone ? "text-[#be185d]" : "text-gray-900"} flex items-center gap-1.5 min-w-0`}>
                              {contact.lastMsg.type === 'Inbound' ? (
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" title="Last message was inbound" />
                              ) : (
                                <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" title="Last message was outbound" />
                              )}
                              <span className="truncate">{contact.name || "Unknown"}</span>
                            </div>
                            <span className="text-[10px] font-semibold text-gray-400 shrink-0 ml-2">
                              {new Date(contact.lastMsg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500 truncate">
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
            <div className={`${T.cls.tableWrap} flex-1 flex flex-col overflow-hidden relative shadow-sm`}>
              {selectedPhone ? (
                <>
                  {/* Chat Top Bar */}
                  <div className="px-8 py-5 border-b border-gray-100 flex justify-between items-center bg-white/80 backdrop-blur-md sticky top-0 z-10">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-[#FDB8D7]/10 rounded-full flex items-center justify-center border border-[#FDB8D7]/20">
                        <UserIcon className="w-5 h-5 text-[#FDB8D7]" />
                      </div>
                      <div>
                      <h3 className="text-lg font-black tracking-tight text-gray-900 truncate max-w-[300px]" title={selectedContact?.name || "Candidate"}>
                        {selectedContact?.name || "Candidate"} - Whatsapp
                      </h3>
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5 flex items-center gap-1.5">
                        <Phone className="w-3 h-3 text-[#FDB8D7]/50" />
                        {selectedPhone}
                      </p>
                    </div>
                    </div>
                    <button className="p-2 hover:bg-gray-50 rounded-xl transition-colors text-gray-400">
                      <MoreVertical className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Messages Feed */}
                  <ScrollArea className="flex-1 px-8 py-8 bg-gray-50/30">
                    <div className="space-y-6 max-w-3xl mx-auto">
                      {selectedMessages.map((msg) => {
                        const isOutbound = msg.type === 'Outbound';
                        return (
                          <div
                            key={msg.id}
                            className={`flex flex-col ${isOutbound ? 'items-end' : 'items-start'}`}
                          >
                            <div className={`max-w-[85%] rounded-3xl p-5 shadow-sm relative break-words ${isOutbound
                                ? "bg-white border border-[#FDB8D7]/20 text-gray-800 rounded-tr-md"
                                : "bg-white border border-gray-100 text-gray-700 rounded-tl-md shadow-[0_2px_10px_rgba(0,0,0,0.02)]"
                              }`}>
                              <div className="flex items-center gap-2 mb-2">
                                <div className={`w-5 h-5 rounded-lg flex items-center justify-center ${isOutbound ? "bg-[#FDB8D7]/20 text-[#be185d]" : "bg-gray-100 text-gray-500"
                                  }`}>
                                  {isOutbound ? <Bot className="w-3 h-3" /> : <UserIcon className="w-3 h-3" />}
                                </div>
                                <span className={`text-[10px] font-black uppercase tracking-wider ${isOutbound ? "text-[#be185d]/70" : "text-gray-400"
                                  }`}>
                                  {isOutbound ? "Outbound Message" : "Inbound Message"}
                                </span>
                              </div>
                              <p className="text-[14px] leading-relaxed whitespace-pre-wrap font-medium">
                                {msg.message_content}
                              </p>
                              <div className="text-[9px] mt-3 font-bold text-gray-300 flex justify-end items-center gap-2 uppercase tracking-tighter">
                                {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                {isOutbound && <span>· READ</span>}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </ScrollArea>

                  {/* Simulated Input */}
                  <div className="px-8 py-6 bg-white border-t border-gray-100">
                    <div className="bg-gray-50 rounded-[2rem] p-2 pl-6 flex items-center gap-2 border border-gray-100">
                      <input
                        type="text"
                        readOnly
                        placeholder="Type a message..."
                        className="flex-1 bg-transparent border-none text-gray-500 text-sm font-medium focus:ring-0 cursor-not-allowed"
                      />
                      <div className="w-11 h-11 bg-[#FDB8D7] rounded-full flex items-center justify-center cursor-not-allowed shadow-sm shrink-0">
                        <Send className="w-5 h-5 text-white" />
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-gray-200">
                  <MessageSquare className="w-20 h-20 mb-6 opacity-20" />
                  <p className="text-xl font-black tracking-tight uppercase">Select a conversation</p>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
