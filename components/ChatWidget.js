import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { FiMessageCircle, FiX, FiSend, FiMinimize2 } from 'react-icons/fi';
import toast from 'react-hot-toast';

const ChatWidget = ({ user }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null);

  // Scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen && messages.length > 0) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  // Load initial messages
  useEffect(() => {
    if (isOpen && user) {
      loadMessages();
    }
  }, [isOpen, user]);

  // Subscribe to new messages via Realtime
  useEffect(() => {
    if (!user || !isOpen) return;

    const channel = supabase
      .channel('chat_messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          console.log('New message received:', payload);
          setMessages((prev) => [...prev, payload.new]);
          scrollToBottom();
          
          // Show notification if chat is minimized or not focused
          if (isMinimized || document.hidden) {
            toast.success('New message received', {
              icon: '💬',
            });
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: 'is_admin=eq.true',
        },
        (payload) => {
          // Admin messages for this user
          if (payload.new.user_id === user.id || payload.new.is_admin) {
            console.log('New admin message received:', payload);
            setMessages((prev) => {
              // Avoid duplicates
              const exists = prev.find((m) => m.id === payload.new.id);
              if (exists) return prev;
              return [...prev, payload.new];
            });
            scrollToBottom();
            
            if (isMinimized || document.hidden) {
              toast.success('New message from support', {
                icon: '💬',
              });
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, isOpen, isMinimized]);

  const loadMessages = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true })
        .limit(50);

      if (error) throw error;

      setMessages(data || []);
    } catch (error) {
      console.error('Error loading messages:', error);
      toast.error('Failed to load messages');
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !user || sending) return;

    const messageText = newMessage.trim();
    setNewMessage('');
    setSending(true);

    try {
      // Get user profile for name/email
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, email, username')
        .eq('id', user.id)
        .single();

      const { data, error } = await supabase
        .from('chat_messages')
        .insert({
          user_id: user.id,
          user_email: user.email || profile?.email,
          user_name: profile?.full_name || profile?.username || user.email?.split('@')[0],
          message: messageText,
          is_admin: false,
          is_read: false,
        })
        .select()
        .single();

      if (error) throw error;

      // Message will be added via Realtime subscription
      // But add it immediately for better UX
      setMessages((prev) => [...prev, data]);
      scrollToBottom();
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
      setNewMessage(messageText); // Restore message on error
    } finally {
      setSending(false);
    }
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;

    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (!user) return null;

  return (
    <>
      {/* Floating Chat Button */}
      {!isOpen && (
        <button
          onClick={() => {
            setIsOpen(true);
            setIsMinimized(false);
          }}
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            width: '60px',
            height: '60px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
            border: 'none',
            color: '#ffffff',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(59, 130, 246, 0.4)',
            zIndex: 1000,
            transition: 'all 0.3s ease',
          }}
          onMouseEnter={(e) => {
            e.target.style.transform = 'scale(1.1)';
            e.target.style.boxShadow = '0 6px 20px rgba(59, 130, 246, 0.6)';
          }}
          onMouseLeave={(e) => {
            e.target.style.transform = 'scale(1)';
            e.target.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.4)';
          }}
          aria-label="Open chat"
        >
          <FiMessageCircle size={28} />
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div
          ref={chatContainerRef}
          style={{
            position: 'fixed',
            bottom: isMinimized ? '24px' : '24px',
            right: '24px',
            width: isMinimized ? '320px' : '380px',
            height: isMinimized ? '60px' : '600px',
            maxHeight: '90vh',
            background: 'rgba(15, 17, 36, 0.98)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '16px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.4), 0 10px 10px -5px rgba(0, 0, 0, 0.2)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            flexDirection: 'column',
            zIndex: 1001,
            transition: 'all 0.3s ease',
            overflow: 'hidden',
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: '16px 20px',
              background: 'linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%)',
              borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              cursor: isMinimized ? 'pointer' : 'default',
            }}
            onClick={() => isMinimized && setIsMinimized(false)}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <FiMessageCircle size={20} color="#ffffff" />
              <span style={{ color: '#ffffff', fontWeight: 600, fontSize: '16px' }}>
                Support Chat
              </span>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsMinimized(!isMinimized);
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#ffffff',
                  cursor: 'pointer',
                  padding: '4px',
                  display: 'flex',
                  alignItems: 'center',
                }}
                aria-label={isMinimized ? 'Maximize' : 'Minimize'}
              >
                <FiMinimize2 size={18} />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsOpen(false);
                  setIsMinimized(false);
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#ffffff',
                  cursor: 'pointer',
                  padding: '4px',
                  display: 'flex',
                  alignItems: 'center',
                }}
                aria-label="Close chat"
              >
                <FiX size={18} />
              </button>
            </div>
          </div>

          {!isMinimized && (
            <>
              {/* Messages Container */}
              <div
                style={{
                  flex: 1,
                  overflowY: 'auto',
                  padding: '20px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '16px',
                }}
              >
                {loading ? (
                  <div style={{ textAlign: 'center', color: '#9ca3af', padding: '20px' }}>
                    Loading messages...
                  </div>
                ) : messages.length === 0 ? (
                  <div style={{ textAlign: 'center', color: '#9ca3af', padding: '20px' }}>
                    <p style={{ marginBottom: '8px', fontSize: '16px', fontWeight: 600 }}>
                      👋 Hello!
                    </p>
                    <p style={{ fontSize: '14px' }}>
                      Start a conversation with our support team. We're here to help!
                    </p>
                  </div>
                ) : (
                  messages.map((message) => (
                    <div
                      key={message.id}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: message.is_admin ? 'flex-start' : 'flex-end',
                        gap: '4px',
                      }}
                    >
                      <div
                        style={{
                          maxWidth: '75%',
                          padding: '12px 16px',
                          borderRadius: '12px',
                          background: message.is_admin
                            ? 'rgba(59, 130, 246, 0.2)'
                            : 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                          color: '#ffffff',
                          fontSize: '14px',
                          lineHeight: '1.5',
                          wordWrap: 'break-word',
                        }}
                      >
                        {message.message}
                      </div>
                      <div
                        style={{
                          fontSize: '11px',
                          color: '#9ca3af',
                          padding: '0 4px',
                        }}
                      >
                        {formatTime(message.created_at)}
                        {message.is_admin && ' • Support'}
                      </div>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input Form */}
              <form
                onSubmit={sendMessage}
                style={{
                  padding: '16px 20px',
                  borderTop: '1px solid rgba(255, 255, 255, 0.1)',
                  background: 'rgba(15, 17, 36, 0.95)',
                }}
              >
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type your message..."
                    disabled={sending}
                    style={{
                      flex: 1,
                      padding: '12px 16px',
                      borderRadius: '12px',
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      color: '#ffffff',
                      fontSize: '14px',
                      outline: 'none',
                      transition: 'all 0.2s',
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = '#3b82f6';
                      e.target.style.background = 'rgba(255, 255, 255, 0.08)';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                      e.target.style.background = 'rgba(255, 255, 255, 0.05)';
                    }}
                  />
                  <button
                    type="submit"
                    disabled={sending || !newMessage.trim()}
                    style={{
                      padding: '12px 16px',
                      borderRadius: '12px',
                      background: sending || !newMessage.trim()
                        ? 'rgba(59, 130, 246, 0.5)'
                        : 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                      border: 'none',
                      color: '#ffffff',
                      cursor: sending || !newMessage.trim() ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.2s',
                    }}
                  >
                    <FiSend size={18} />
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
      )}
    </>
  );
};

export default ChatWidget;
