import React, { useState, useEffect, useRef } from 'react';
import { Send, ArrowLeft, MessageSquare, ShieldCheck, User } from 'lucide-react';
import { Conversation, Message } from '../types';
import { useCommunity } from '../context/CommunityContext';
import { useAuth } from '../context/AuthContext';
import { Avatar } from '../components/common/Avatar';

interface MessagesPageProps {
  conversationId?: string | null;
  navigate: (route: string) => void;
}

export const MessagesPage: React.FC<MessagesPageProps> = ({
  conversationId,
  navigate,
}) => {
  const { currentUser } = useAuth();
  const { conversations, sendMessage, getMessages } = useCommunity();

  const [activeConvId, setActiveConvId] = useState<string | null>(conversationId || (conversations[0]?.id ?? null));
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputBody, setInputBody] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Sync activeConvId if prop changes
  useEffect(() => {
    if (conversationId) {
      setActiveConvId(conversationId);
    }
  }, [conversationId]);

  // Load messages for active conversation
  useEffect(() => {
    if (activeConvId) {
      getMessages(activeConvId).then(list => {
        setMessages(list);
      });
    }
  }, [activeConvId, getMessages]);

  // Scroll to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (!currentUser) return null;

  const currentConv = conversations.find(c => c.id === activeConvId);
  const otherMember = currentConv?.members.find(m => m.id !== currentUser.id);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputBody.trim() || !activeConvId || isSending) return;

    setIsSending(true);
    try {
      const msg = await sendMessage(activeConvId, inputBody.trim());
      setMessages(prev => [...prev, msg]);
      setInputBody('');
    } catch (err) {
      console.error('Error sending message:', err);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="bc-page mx-auto max-w-6xl !py-3 flex h-[calc(100dvh-8rem)] min-h-[32rem] flex-col lg:h-[calc(100dvh-5rem)]">
      <div className="bc-panel flex-1 overflow-hidden flex shadow-xl">
        {/* Conversations List (Sidebar on desktop, hidden on mobile when viewing active conversation) */}
        <div
          className={`w-full md:w-80 border-r border-[#2D233D] flex flex-col bg-[#0E0B13]/60 ${
            activeConvId && conversationId ? 'hidden md:flex' : 'flex'
          }`}
        >
          <div className="p-4 border-b border-[#2D233D] flex items-center justify-between">
            <h2 className="text-base font-bold font-display text-white">Direct Conversations</h2>
            <span className="text-[11px] text-[#B9B0C6]">{conversations.length} active</span>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-[#2D233D]/50">
            {conversations.length === 0 ? (
              <div className="p-6 text-center text-xs text-[#B9B0C6]">
                No conversations yet. Connect with a friend to start chatting!
              </div>
            ) : (
              conversations.map(conv => {
                const partner = conv.members.find(m => m.id !== currentUser.id) || conv.members[0];
                const isSelected = conv.id === activeConvId;

                return (
                  <button
                    key={conv.id}
                    onClick={() => {
                      setActiveConvId(conv.id);
                      navigate(`/messages/${conv.id}`);
                    }}
                    className={`w-full p-3.5 text-left flex items-start gap-3 transition-colors cursor-pointer ${
                      isSelected ? 'bg-[#9B5CFF]/15 border-l-2 border-[#9B5CFF]' : 'hover:bg-[#191321]'
                    }`}
                  >
                    <Avatar src={partner.avatar_path} name={partner.display_name} size="md" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-xs text-white truncate">
                          {partner.display_name}
                        </span>
                        <span className="text-[10px] text-[#B9B0C6] shrink-0">
                          {conv.last_message ? new Date(conv.last_message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                        </span>
                      </div>
                      <p className="text-xs text-[#B9B0C6] truncate mt-0.5">
                        {conv.last_message?.body || 'No messages yet'}
                      </p>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Chat Conversation Area */}
        <div
          className={`flex-1 flex flex-col bg-[#191321] ${
            !activeConvId && !conversationId ? 'hidden md:flex' : 'flex'
          }`}
        >
          {currentConv && otherMember ? (
            <>
              {/* Header */}
              <div className="p-4 border-b border-[#2D233D] flex items-center justify-between bg-[#191321]">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => navigate('/messages')}
                    className="md:hidden p-1.5 text-[#B9B0C6] hover:text-white"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => navigate(`/members/${otherMember.id}`)}
                    className="flex items-center gap-2.5 text-left cursor-pointer group"
                  >
                    <Avatar src={otherMember.avatar_path} name={otherMember.display_name} size="sm" />
                    <div>
                      <div className="text-xs font-bold text-white group-hover:text-[#9B5CFF] transition-colors">
                        {otherMember.display_name}
                      </div>
                      <div className="text-[10px] text-[#B9B0C6]">@{otherMember.username}</div>
                    </div>
                  </button>
                </div>

                <div className="flex items-center gap-2 text-xs text-[#B9B0C6]">
                  <span className="hidden sm:inline text-[11px] text-emerald-400 font-medium">● Connected</span>
                  <button
                    onClick={() => navigate(`/members/${otherMember.id}`)}
                    className="p-1.5 rounded-lg hover:bg-[#2D233D] text-[#B9B0C6] hover:text-white"
                    title="View Profile"
                  >
                    <User className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Message History */}
              <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-[#0E0B13]/30">
                {messages.length === 0 ? (
                  <div className="py-12 text-center text-xs text-[#B9B0C6] space-y-2">
                    <ShieldCheck className="w-8 h-8 text-[#9B5CFF] mx-auto opacity-70" />
                    <p>This is the start of your private conversation with {otherMember.display_name}.</p>
                    <p className="text-[11px] text-[#B9B0C6]/70">Respect confidentiality and community guidelines.</p>
                  </div>
                ) : (
                  messages.map(msg => {
                    const isMe = msg.sender_id === currentUser.id;
                    return (
                      <div
                        key={msg.id}
                        className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                      >
                        <div
                          className={`max-w-[80%] sm:max-w-md px-4 py-2.5 rounded-2xl text-xs sm:text-sm leading-relaxed shadow-sm ${
                            isMe
                              ? 'bg-gradient-to-r from-[#9B5CFF] to-[#8040E0] text-white rounded-br-none'
                              : 'bg-[#191321] border border-[#2D233D] text-[#F8F5FC] rounded-bl-none'
                          }`}
                        >
                          {msg.body}
                        </div>
                        <span className="text-[10px] text-[#B9B0C6]/60 mt-1 px-1">
                          {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input Bar */}
              <form onSubmit={handleSend} className="p-3 border-t border-[#2D233D] bg-[#191321] flex items-center gap-2">
                <input
                  type="text"
                  placeholder={`Message ${otherMember.display_name}...`}
                  value={inputBody}
                  onChange={(e) => setInputBody(e.target.value)}
                  className="bc-field flex-1 text-sm"
                />
                <button
                  type="submit"
                  disabled={isSending || !inputBody.trim()}
                  className="p-2.5 bg-gradient-to-r from-[#9B5CFF] to-[#F05AA6] hover:opacity-95 text-white rounded-xl shadow-md shadow-[#9B5CFF]/20 disabled:opacity-40 transition-all cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-[#B9B0C6]">
              <MessageSquare className="w-12 h-12 text-[#9B5CFF]/40 mb-3" />
              <h3 className="text-base font-bold text-white">Select a conversation</h3>
              <p className="text-xs text-[#B9B0C6] mt-1 max-w-xs">
                Pick a friend from the left sidebar to resume your discussion or start a new friendship from the Circles tab.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
