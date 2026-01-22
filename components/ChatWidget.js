import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { FiMessageCircle, FiX, FiSend, FiMinimize2, FiPaperclip, FiFile, FiImage } from 'react-icons/fi';
import toast from 'react-hot-toast';

const ChatWidget = ({ user }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isAdminTyping, setIsAdminTyping] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null);
  const fileInputRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const typingChannelRef = useRef(null);

  // Check if mobile on mount and resize
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

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
          setMessages((prev) => {
            // Check if message already exists to prevent duplicates
            const exists = prev.find((m) => m.id === payload.new.id);
            if (exists) return prev;
            return [...prev, payload.new];
          });
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
              // Check if message already exists to prevent duplicates
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

    // Subscribe to typing indicator for admin messages
    const typingChannel = supabase
      .channel(`typing:${user.id}`)
      .on('broadcast', { event: 'typing' }, (payload) => {
        console.log('Typing broadcast received:', payload);
        if (payload.payload && payload.payload.isAdmin) {
          setIsAdminTyping(true);
          // Clear existing timeout
          if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
          }
          // Reset timeout to 5 seconds after last typing indicator
          typingTimeoutRef.current = setTimeout(() => {
            setIsAdminTyping(false);
          }, 5000);
        }
      })
      .subscribe();

    typingChannelRef.current = typingChannel;

    return () => {
      supabase.removeChannel(channel);
      if (typingChannelRef.current) {
        supabase.removeChannel(typingChannelRef.current);
      }
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
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

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size exceeds 10MB limit');
      return;
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'application/pdf', 'text/plain', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Invalid file type. Only images, PDF, TXT, DOC, and DOCX files are allowed.');
      return;
    }

    setSelectedFile(file);
  };

  const uploadFile = async () => {
    if (!selectedFile || !user || uploadingFile) return;

    setUploadingFile(true);
    try {
      // Convert file to base64
      const reader = new FileReader();
      const fileBase64Promise = new Promise((resolve, reject) => {
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(selectedFile);
      });

      const fileBase64 = await fileBase64Promise;

      // Upload file via API
      const uploadResponse = await fetch('/api/chat/upload-file', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: user.id,
          file_base64: fileBase64,
          file_name: selectedFile.name,
          file_type: selectedFile.type,
        }),
      });

      const uploadResult = await uploadResponse.json();

      if (!uploadResult.success) {
        throw new Error(uploadResult.error || 'Failed to upload file');
      }

      // Get user profile for name/email
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, email, username')
        .eq('id', user.id)
        .single();

      // Send message with attachment
      const { data, error } = await supabase
        .from('chat_messages')
        .insert({
          user_id: user.id,
          user_email: user.email || profile?.email,
          user_name: profile?.full_name || profile?.username || user.email?.split('@')[0],
          message: `📎 ${selectedFile.name}`,
          attachment_url: uploadResult.attachment_url,
          attachment_name: uploadResult.attachment_name,
          attachment_type: uploadResult.attachment_type,
          is_admin: false,
          is_read: false,
        })
        .select()
        .single();

      if (error) throw error;

      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      toast.success('File uploaded successfully');
    } catch (error) {
      console.error('Error uploading file:', error);
      toast.error(error.message || 'Failed to upload file');
    } finally {
      setUploadingFile(false);
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if ((!newMessage.trim() && !selectedFile) || !user || sending || uploadingFile) return;

    // If file is selected, upload it first
    if (selectedFile) {
      await uploadFile();
      return;
    }

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

      // Don't add immediately - let Realtime subscription handle it
      // This prevents duplicate messages
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
            bottom: isMobile ? '16px' : '24px',
            right: isMobile ? '16px' : '24px',
            width: isMobile ? '56px' : '60px',
            height: isMobile ? '56px' : '60px',
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
          <FiMessageCircle size={isMobile ? 24 : 28} />
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div
          ref={chatContainerRef}
          style={{
            position: 'fixed',
            bottom: isMinimized ? '16px' : '16px',
            right: isMobile ? '16px' : '24px',
            left: isMobile ? '16px' : 'auto',
            width: isMobile 
              ? (isMinimized ? 'calc(100% - 32px)' : 'calc(100% - 32px)')
              : (isMinimized ? '320px' : '380px'),
            maxWidth: isMobile ? '400px' : '380px',
            height: isMinimized ? '60px' : (isMobile ? '500px' : '600px'),
            maxHeight: isMobile ? '70vh' : '90vh',
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
                        {message.attachment_url && (
                          <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid rgba(255, 255, 255, 0.2)' }}>
                            {message.attachment_type?.startsWith('image/') ? (
                              <div>
                                <img
                                  src={message.attachment_url}
                                  alt={message.attachment_name || 'Attachment'}
                                  style={{
                                    maxWidth: '100%',
                                    maxHeight: '300px',
                                    borderRadius: '8px',
                                    marginBottom: '8px',
                                    cursor: 'pointer',
                                  }}
                                  onClick={() => window.open(message.attachment_url, '_blank')}
                                />
                                <a
                                  href={message.attachment_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    color: '#ffffff',
                                    textDecoration: 'none',
                                    fontSize: '13px',
                                    fontWeight: 500,
                                  }}
                                  onMouseEnter={(e) => {
                                    e.target.style.textDecoration = 'underline';
                                  }}
                                  onMouseLeave={(e) => {
                                    e.target.style.textDecoration = 'none';
                                  }}
                                >
                                  <FiImage size={16} />
                                  {message.attachment_name || 'Attachment'}
                                </a>
                              </div>
                            ) : (
                              <a
                                href={message.attachment_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '8px',
                                  color: '#ffffff',
                                  textDecoration: 'none',
                                  fontSize: '13px',
                                  fontWeight: 500,
                                }}
                                onMouseEnter={(e) => {
                                  e.target.style.textDecoration = 'underline';
                                }}
                                onMouseLeave={(e) => {
                                  e.target.style.textDecoration = 'none';
                                }}
                              >
                                <FiFile size={16} />
                                {message.attachment_name || 'Attachment'}
                              </a>
                            )}
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
                        {message.is_admin && ' • Support'}
                      </div>
                    </div>
                  ))
                )}
                {isAdminTyping && (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '12px 16px',
                    color: '#9ca3af',
                    fontSize: '13px',
                    fontStyle: 'italic',
                  }}>
                    <span>Support is typing</span>
                    <span style={{
                      display: 'inline-flex',
                      gap: '4px',
                    }}>
                      <span style={{
                        animation: 'typing 1.4s infinite',
                        animationDelay: '0s',
                      }}>.</span>
                      <span style={{
                        animation: 'typing 1.4s infinite',
                        animationDelay: '0.2s',
                      }}>.</span>
                      <span style={{
                        animation: 'typing 1.4s infinite',
                        animationDelay: '0.4s',
                      }}>.</span>
                    </span>
                  </div>
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
                {selectedFile && (
                  <div style={{ 
                    marginBottom: '8px', 
                    padding: '8px 12px', 
                    background: 'rgba(59, 130, 246, 0.1)', 
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '8px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, overflow: 'hidden' }}>
                      <FiFile size={16} color="#60a5fa" />
                      <span style={{ fontSize: '12px', color: '#ffffff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {selectedFile.name}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedFile(null);
                        if (fileInputRef.current) {
                          fileInputRef.current.value = '';
                        }
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
                    >
                      <FiX size={16} />
                    </button>
                  </div>
                )}
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileSelect}
                    accept="image/*,.pdf,.txt,.doc,.docx"
                    style={{ display: 'none' }}
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingFile}
                    style={{
                      padding: '12px 16px',
                      borderRadius: '12px',
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      color: '#ffffff',
                      cursor: uploadingFile ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.2s',
                    }}
                    onMouseEnter={(e) => {
                      if (!uploadingFile) {
                        e.target.style.background = 'rgba(255, 255, 255, 0.08)';
                        e.target.style.borderColor = '#3b82f6';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!uploadingFile) {
                        e.target.style.background = 'rgba(255, 255, 255, 0.05)';
                        e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                      }
                    }}
                  >
                    <FiPaperclip size={18} />
                  </button>
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => {
                      setNewMessage(e.target.value);
                      // Broadcast typing indicator with debounce
                      if (typingChannelRef.current && e.target.value.trim()) {
                        // Clear existing timeout
                        if (typingTimeoutRef.current) {
                          clearTimeout(typingTimeoutRef.current);
                        }
                        // Send typing indicator - debounced
                        typingTimeoutRef.current = setTimeout(() => {
                          if (typingChannelRef.current) {
                            typingChannelRef.current.send({
                              type: 'broadcast',
                              event: 'typing',
                              payload: { isAdmin: false, userId: user.id }
                            }).catch(err => console.error('Error sending typing indicator:', err));
                          }
                        }, 300); // Debounce 300ms
                      }
                    }}
                    placeholder={selectedFile ? "Add a message (optional)..." : "Type your message..."}
                    disabled={sending || uploadingFile}
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
                    disabled={sending || uploadingFile || (!newMessage.trim() && !selectedFile)}
                    style={{
                      padding: '12px 16px',
                      borderRadius: '12px',
                      background: (sending || uploadingFile || (!newMessage.trim() && !selectedFile))
                        ? 'rgba(59, 130, 246, 0.5)'
                        : 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                      border: 'none',
                      color: '#ffffff',
                      cursor: (sending || uploadingFile || (!newMessage.trim() && !selectedFile)) ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.2s',
                    }}
                  >
                    {uploadingFile ? (
                      <span style={{ fontSize: '12px' }}>Uploading...</span>
                    ) : (
                      <FiSend size={18} />
                    )}
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
