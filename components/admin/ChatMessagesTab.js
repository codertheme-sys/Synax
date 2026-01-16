import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { FiSend, FiMessageCircle, FiUser, FiClock, FiFile, FiImage, FiDownload } from 'react-icons/fi';
import toast from 'react-hot-toast';

const ChatMessagesTab = () => {
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [unreadCounts, setUnreadCounts] = useState({});
  const messagesEndRef = useRef(null);

  // Load conversations (users with messages)
  useEffect(() => {
    loadConversations();
  }, []);

  // Subscribe to new messages
  useEffect(() => {
    const channel = supabase
      .channel('admin_chat_messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
        },
        (payload) => {
          console.log('New chat message:', payload);
          
          // Reload conversations to update unread counts
          loadConversations();
          
          // If this message is for the selected conversation, add it
          if (selectedConversation && 
              (payload.new.user_id === selectedConversation.user_id || payload.new.is_admin)) {
            setMessages((prev) => {
              const exists = prev.find((m) => m.id === payload.new.id);
              if (exists) return prev;
              return [...prev, payload.new].sort((a, b) => 
                new Date(a.created_at) - new Date(b.created_at)
              );
            });
            scrollToBottom();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedConversation]);

  // Load messages when conversation is selected
  useEffect(() => {
    if (selectedConversation) {
      loadMessages(selectedConversation.user_id);
      markAsRead(selectedConversation.user_id);
    }
  }, [selectedConversation]);

  const loadConversations = async () => {
    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      // Get all unique users who have sent messages
      const { data: allMessages, error } = await supabase
        .from('chat_messages')
        .select('user_id, user_email, user_name, created_at, is_read, is_admin')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Group by user_id and get latest message for each
      const userMap = new Map();
      const unreadMap = {};

      allMessages.forEach((msg) => {
        if (msg.is_admin) return; // Skip admin messages in grouping

        if (!userMap.has(msg.user_id)) {
          userMap.set(msg.user_id, {
            user_id: msg.user_id,
            user_email: msg.user_email,
            user_name: msg.user_name,
            last_message: msg,
            last_message_time: msg.created_at,
          });
          unreadMap[msg.user_id] = 0;
        }

        // Count unread messages
        if (!msg.is_read && !msg.is_admin) {
          unreadMap[msg.user_id] = (unreadMap[msg.user_id] || 0) + 1;
        }
      });

      const conversationsList = Array.from(userMap.values()).sort(
        (a, b) => new Date(b.last_message_time) - new Date(a.last_message_time)
      );

      setConversations(conversationsList);
      setUnreadCounts(unreadMap);
    } catch (error) {
      console.error('Error loading conversations:', error);
      toast.error('Failed to load conversations');
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: true })
        .limit(100);

      if (error) throw error;

      setMessages(data || []);
      scrollToBottom();
    } catch (error) {
      console.error('Error loading messages:', error);
      toast.error('Failed to load messages');
    }
  };

  const markAsRead = async (userId) => {
    try {
      const { error } = await supabase
        .from('chat_messages')
        .update({ is_read: true })
        .eq('user_id', userId)
        .eq('is_read', false)
        .eq('is_admin', false);

      if (error) throw error;

      // Update unread counts
      setUnreadCounts((prev) => ({
        ...prev,
        [userId]: 0,
      }));
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConversation || sending) return;

    const messageText = newMessage.trim();
    setNewMessage('');
    setSending(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Session expired');
        return;
      }

      // Get admin profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, email, username')
        .eq('id', session.user.id)
        .single();

      const { data, error } = await supabase
        .from('chat_messages')
        .insert({
          user_id: selectedConversation.user_id,
          user_email: selectedConversation.user_email,
          user_name: selectedConversation.user_name,
          message: messageText,
          is_admin: true,
          is_read: false,
        })
        .select()
        .single();

      if (error) throw error;

      // Message will be added via Realtime subscription
      scrollToBottom();
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
      setNewMessage(messageText);
    } finally {
      setSending(false);
    }
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
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

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: '#9ca3af' }}>
        Loading conversations...
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 200px)', gap: '20px' }}>
      {/* Conversations List */}
      <div
        style={{
          width: '350px',
          background: 'rgba(15, 17, 36, 0.95)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '16px',
          padding: '20px',
          overflowY: 'auto',
        }}
      >
        <h3 style={{ color: '#ffffff', marginBottom: '20px', fontSize: '18px', fontWeight: 600 }}>
          Conversations
        </h3>
        {conversations.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#9ca3af', padding: '40px' }}>
            <FiMessageCircle size={48} style={{ marginBottom: '16px', opacity: 0.5 }} />
            <p>No conversations yet</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {conversations.map((conv) => (
              <button
                key={conv.user_id}
                onClick={() => setSelectedConversation(conv)}
                style={{
                  padding: '16px',
                  borderRadius: '12px',
                  background:
                    selectedConversation?.user_id === conv.user_id
                      ? 'rgba(59, 130, 246, 0.2)'
                      : 'rgba(255, 255, 255, 0.05)',
                  border:
                    selectedConversation?.user_id === conv.user_id
                      ? '1px solid rgba(59, 130, 246, 0.5)'
                      : '1px solid rgba(255, 255, 255, 0.1)',
                  color: '#ffffff',
                  textAlign: 'left',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  if (selectedConversation?.user_id !== conv.user_id) {
                    e.target.style.background = 'rgba(255, 255, 255, 0.08)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (selectedConversation?.user_id !== conv.user_id) {
                    e.target.style.background = 'rgba(255, 255, 255, 0.05)';
                  }
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <FiUser size={16} color="#60a5fa" />
                      <span style={{ fontWeight: 600, fontSize: '14px' }}>
                        {conv.user_name || conv.user_email || 'Unknown User'}
                      </span>
                    </div>
                    <p
                      style={{
                        fontSize: '12px',
                        color: '#9ca3af',
                        margin: '4px 0 0 0',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {conv.last_message?.message || 'No messages'}
                    </p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
                      <FiClock size={12} color="#6b7280" />
                      <span style={{ fontSize: '11px', color: '#6b7280' }}>
                        {formatTime(conv.last_message_time)}
                      </span>
                    </div>
                  </div>
                  {unreadCounts[conv.user_id] > 0 && (
                    <span
                      style={{
                        background: '#ef4444',
                        color: '#ffffff',
                        borderRadius: '50%',
                        width: '20px',
                        height: '20px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '11px',
                        fontWeight: 600,
                      }}
                    >
                      {unreadCounts[conv.user_id]}
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Chat Window */}
      <div
        style={{
          flex: 1,
          background: 'rgba(15, 17, 36, 0.95)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '16px',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {selectedConversation ? (
          <>
            {/* Header */}
            <div
              style={{
                padding: '20px',
                borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                background: 'linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <FiUser size={20} color="#ffffff" />
                <div>
                  <h3 style={{ color: '#ffffff', margin: 0, fontSize: '16px', fontWeight: 600 }}>
                    {selectedConversation.user_name || selectedConversation.user_email || 'Unknown User'}
                  </h3>
                  <p style={{ color: '#93c5fd', margin: '4px 0 0 0', fontSize: '12px' }}>
                    {selectedConversation.user_email}
                  </p>
                </div>
              </div>
            </div>

            {/* Messages */}
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
              {messages.length === 0 ? (
                <div style={{ textAlign: 'center', color: '#9ca3af', padding: '40px' }}>
                  <p>No messages yet. Start the conversation!</p>
                </div>
              ) : (
                messages.map((message) => (
                  <div
                    key={message.id}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: message.is_admin ? 'flex-end' : 'flex-start',
                      gap: '4px',
                    }}
                  >
                    <div
                      style={{
                        maxWidth: '70%',
                        padding: '12px 16px',
                        borderRadius: '12px',
                        background: message.is_admin
                          ? 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)'
                          : 'rgba(59, 130, 246, 0.2)',
                        color: '#ffffff',
                        fontSize: '14px',
                        lineHeight: '1.5',
                        wordWrap: 'break-word',
                      }}
                    >
                      {message.message}
                      {message.attachment_url && (
                        <div style={{ 
                          marginTop: '8px', 
                          paddingTop: '8px', 
                          borderTop: '1px solid rgba(255, 255, 255, 0.2)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                        }}>
                          {message.attachment_type === 'pdf' || message.attachment_type === 'doc' || message.attachment_type === 'docx' || message.attachment_type === 'txt' ? (
                            <FiFile size={16} color="#ffffff" />
                          ) : (
                            <FiImage size={16} color="#ffffff" />
                          )}
                          <a
                            href={message.attachment_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              color: '#ffffff',
                              textDecoration: 'none',
                              fontSize: '13px',
                              fontWeight: 500,
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                            }}
                            onMouseEnter={(e) => {
                              e.target.style.textDecoration = 'underline';
                            }}
                            onMouseLeave={(e) => {
                              e.target.style.textDecoration = 'none';
                            }}
                          >
                            {message.attachment_name || 'Attachment'}
                            <FiDownload size={14} />
                          </a>
                        </div>
                      )}
                    </div>
                    <div
                      style={{
                        fontSize: '11px',
                        color: '#9ca3af',
                        padding: '0 4px',
                      }}
                    >
                      {formatTime(message.created_at)}
                      {message.is_admin && ' • You'}
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
                padding: '20px',
                borderTop: '1px solid rgba(255, 255, 255, 0.1)',
                background: 'rgba(15, 17, 36, 0.95)',
              }}
            >
              <div style={{ display: 'flex', gap: '12px' }}>
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type your reply..."
                  disabled={sending}
                  style={{
                    flex: 1,
                    padding: '14px 18px',
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
                    padding: '14px 24px',
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
                    gap: '8px',
                    fontSize: '14px',
                    fontWeight: 600,
                    transition: 'all 0.2s',
                  }}
                >
                  <FiSend size={18} />
                  Send
                </button>
              </div>
            </form>
          </>
        ) : (
          <div
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#9ca3af',
            }}
          >
            <div style={{ textAlign: 'center' }}>
              <FiMessageCircle size={64} style={{ marginBottom: '16px', opacity: 0.3 }} />
              <p>Select a conversation to start chatting</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatMessagesTab;
