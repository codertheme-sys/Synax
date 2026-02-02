// pages/feedback.js - Feedback/Contact Page
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../lib/supabase';
import Head from 'next/head';
import Header from '../components/Header';
import toast from 'react-hot-toast';

export default function Feedback() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    type: 'feedback',
    subject: '',
    message: ''
  });

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    const { data: { user: currentUser } } = await supabase.auth.getUser();
    setUser(currentUser);
    setLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.subject.trim() || !formData.message.trim()) {
      toast.error('Please fill in all required fields', {
        style: { background: '#1f2937', color: '#fff' }
      });
      return;
    }

    if (!user) {
      toast.error('Please login to submit feedback', {
        style: { background: '#1f2937', color: '#fff' }
      });
      router.push('/login');
      return;
    }

    setSubmitting(true);

    try {
      const { data, error } = await supabase
        .from('feedback')
        .insert([
          {
            user_id: user.id,
            type: formData.type,
            subject: formData.subject.trim(),
            message: formData.message.trim(),
            status: 'pending'
          }
        ])
        .select()
        .single();

      if (error) throw error;

      toast.success('Thank you for your feedback! We will review it and get back to you soon.', {
        duration: 5000,
        style: { background: '#1f2937', color: '#fff' }
      });

      // Form'u temizle
      setFormData({
        type: 'feedback',
        subject: '',
        message: ''
      });
    } catch (error) {
      console.error('Error submitting feedback:', error);
      toast.error('Failed to submit feedback. Please try again.', {
        style: { background: '#1f2937', color: '#fff' }
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0a0e1a 0%, #1a1f35 100%)', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <div style={{ color: 'white', fontSize: '24px' }}>Loading...</div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Feedback & Contact - Synax</title>
      </Head>

      <Header />

      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0a0e1a 0%, #1a1f35 100%)',
        padding: '40px 20px',
        paddingTop: '120px'
      }}>
        <div style={{
          maxWidth: '800px',
          margin: '0 auto'
        }}>
          <div style={{
            background: 'rgba(255, 255, 255, 0.03)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '20px',
            padding: '40px',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
          }}>
            <h1 style={{
              fontSize: '36px',
              fontWeight: 'bold',
              color: 'white',
              marginBottom: '10px',
              textAlign: 'center'
            }}>
              💬 Feedback & Contact
            </h1>
            <p style={{
              color: 'rgba(255, 255, 255, 0.7)',
              textAlign: 'center',
              marginBottom: '40px',
              fontSize: '16px'
            }}>
              We value your opinion! Share your feedback, suggestions, or report any issues you've encountered.
            </p>

            {!user && (
              <div style={{
                background: 'rgba(244, 172, 34, 0.1)',
                border: '1px solid rgba(244, 172, 34, 0.3)',
                borderRadius: '12px',
                padding: '20px',
                marginBottom: '30px',
                textAlign: 'center'
              }}>
                <p style={{ color: '#f4ac22', margin: 0, fontSize: '14px' }}>
                  ⚠️ Please <a href="/login" style={{ color: '#f4ac22', textDecoration: 'underline' }}>login</a> to submit feedback. 
                  We need your account information to respond to your message.
                </p>
              </div>
            )}

            <form onSubmit={handleSubmit}>
              {/* Feedback Type */}
              <div style={{ marginBottom: '25px' }}>
                <label style={{
                  display: 'block',
                  color: 'white',
                  fontSize: '14px',
                  fontWeight: '600',
                  marginBottom: '10px'
                }}>
                  Type *
                </label>
                <div style={{
                  display: 'flex',
                  gap: '15px',
                  flexWrap: 'wrap'
                }}>
                  {[
                    { value: 'feedback', label: '💭 General Feedback', desc: 'Share your thoughts' },
                    { value: 'suggestion', label: '💡 Suggestion', desc: 'Improvement ideas' },
                    { value: 'complaint', label: '⚠️ Complaint', desc: 'Report an issue' }
                  ].map((type) => (
                    <label
                      key={type.value}
                      style={{
                        flex: '1',
                        minWidth: '150px',
                        padding: '15px',
                        background: formData.type === type.value
                          ? 'rgba(59, 130, 246, 0.2)'
                          : 'rgba(255, 255, 255, 0.05)',
                        border: formData.type === type.value
                          ? '2px solid #3b82f6'
                          : '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '12px',
                        cursor: 'pointer',
                        transition: 'all 0.3s',
                        textAlign: 'center'
                      }}
                      onMouseEnter={(e) => {
                        if (formData.type !== type.value) {
                          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (formData.type !== type.value) {
                          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                        }
                      }}
                    >
                      <input
                        type="radio"
                        name="type"
                        value={type.value}
                        checked={formData.type === type.value}
                        onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                        style={{ display: 'none' }}
                      />
                      <div style={{ fontSize: '20px', marginBottom: '5px' }}>{type.label.split(' ')[0]}</div>
                      <div style={{
                        color: 'white',
                        fontSize: '14px',
                        fontWeight: '600',
                        marginBottom: '4px'
                      }}>
                        {type.label.split(' ').slice(1).join(' ')}
                      </div>
                      <div style={{
                        color: 'rgba(255, 255, 255, 0.6)',
                        fontSize: '12px'
                      }}>
                        {type.desc}
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Subject */}
              <div style={{ marginBottom: '25px' }}>
                <label style={{
                  display: 'block',
                  color: 'white',
                  fontSize: '14px',
                  fontWeight: '600',
                  marginBottom: '10px'
                }}>
                  Subject *
                </label>
                <input
                  type="text"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  placeholder="Brief description of your feedback"
                  required
                  maxLength={200}
                  style={{
                    width: '100%',
                    padding: '14px',
                    background: 'rgba(0, 0, 0, 0.3)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '10px',
                    color: 'white',
                    fontSize: '16px',
                    outline: 'none',
                    transition: 'all 0.3s'
                  }}
                  onFocus={(e) => {
                    e.target.style.border = '1px solid #3b82f6';
                    e.target.style.background = 'rgba(0, 0, 0, 0.5)';
                  }}
                  onBlur={(e) => {
                    e.target.style.border = '1px solid rgba(255, 255, 255, 0.1)';
                    e.target.style.background = 'rgba(0, 0, 0, 0.3)';
                  }}
                />
              </div>

              {/* Message */}
              <div style={{ marginBottom: '30px' }}>
                <label style={{
                  display: 'block',
                  color: 'white',
                  fontSize: '14px',
                  fontWeight: '600',
                  marginBottom: '10px'
                }}>
                  Message *
                </label>
                <textarea
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  placeholder="Please provide detailed information about your feedback, suggestion, or complaint..."
                  required
                  rows={8}
                  maxLength={2000}
                  style={{
                    width: '100%',
                    padding: '14px',
                    background: 'rgba(0, 0, 0, 0.3)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '10px',
                    color: 'white',
                    fontSize: '16px',
                    outline: 'none',
                    resize: 'vertical',
                    fontFamily: 'inherit',
                    transition: 'all 0.3s'
                  }}
                  onFocus={(e) => {
                    e.target.style.border = '1px solid #3b82f6';
                    e.target.style.background = 'rgba(0, 0, 0, 0.5)';
                  }}
                  onBlur={(e) => {
                    e.target.style.border = '1px solid rgba(255, 255, 255, 0.1)';
                    e.target.style.background = 'rgba(0, 0, 0, 0.3)';
                  }}
                />
                <div style={{
                  color: 'rgba(255, 255, 255, 0.5)',
                  fontSize: '12px',
                  marginTop: '5px',
                  textAlign: 'right'
                }}>
                  {formData.message.length} / 2000 characters
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={submitting || !user}
                style={{
                  width: '100%',
                  padding: '16px',
                  fontSize: '18px',
                  fontWeight: 'bold',
                  background: user
                    ? 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)'
                    : 'rgba(255, 255, 255, 0.1)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  cursor: user && !submitting ? 'pointer' : 'not-allowed',
                  boxShadow: user
                    ? '0 4px 15px rgba(59, 130, 246, 0.4)'
                    : 'none',
                  transition: 'all 0.3s',
                  opacity: user ? 1 : 0.5
                }}
                onMouseEnter={(e) => {
                  if (user && !submitting) {
                    e.target.style.transform = 'translateY(-2px)';
                    e.target.style.boxShadow = '0 6px 20px rgba(59, 130, 246, 0.6)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (user && !submitting) {
                    e.target.style.transform = 'translateY(0)';
                    e.target.style.boxShadow = '0 4px 15px rgba(59, 130, 246, 0.4)';
                  }
                }}
              >
                {submitting ? '⏳ Submitting...' : '📤 Submit Feedback'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}
