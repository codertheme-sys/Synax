// pages/contact.js - Contact Page
import { useState, useRef } from 'react';
import Header from '../components/Header';
import toast from 'react-hot-toast';

const cardStyle = {
  borderRadius: '16px',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  background: 'rgba(15, 17, 36, 1)',
  boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.4), 0 10px 10px -5px rgba(0, 0, 0, 0.2)',
  backdropFilter: 'blur(8px)',
};

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) {
      setSelectedFile(null);
      setFilePreview(null);
      return;
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf', 'text/plain'];
    const allowedExtensions = ['jpeg', 'jpg', 'png', 'pdf', 'txt'];
    const fileExt = file.name.split('.').pop()?.toLowerCase();
    
    if (!allowedExtensions.includes(fileExt)) {
      toast.error('Invalid file type. Only JPEG, PNG, PDF, and TXT files are allowed.');
      e.target.value = '';
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size exceeds 10MB limit.');
      e.target.value = '';
      return;
    }

    setSelectedFile(file);

    // Create preview for images
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFilePreview(reader.result);
      };
      reader.readAsDataURL(file);
    } else {
      setFilePreview(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      let attachmentUrl = null;
      let attachmentName = null;
      let attachmentType = null;

      // Upload file if selected
      if (selectedFile) {
        setUploadingFile(true);
        try {
          // Convert file to base64
          const reader = new FileReader();
          const fileBase64 = await new Promise((resolve, reject) => {
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(selectedFile);
          });

          const uploadResponse = await fetch('/api/contact/upload-file', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              file_base64: fileBase64,
              file_name: selectedFile.name,
              file_type: selectedFile.type,
            }),
          });

          const uploadResult = await uploadResponse.json();
          if (!uploadResponse.ok || !uploadResult.success) {
            throw new Error(uploadResult.error || 'Failed to upload file');
          }

          attachmentUrl = uploadResult.file_url;
          attachmentName = uploadResult.file_name;
          attachmentType = uploadResult.file_type;
        } catch (fileError) {
          console.error('File upload error:', fileError);
          toast.error(fileError.message || 'Failed to upload file. Please try again.');
          setUploadingFile(false);
          setLoading(false);
          return;
        } finally {
          setUploadingFile(false);
        }
      }

      // Submit form to API
      const response = await fetch('/api/contact/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          subject: formData.subject,
          message: formData.message,
          attachment_url: attachmentUrl,
          attachment_name: attachmentName,
          attachment_type: attachmentType,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to send message');
      }
      
      toast.success(result.message || 'Your message has been sent successfully! We will get back to you soon.', {
        duration: 5000,
        style: {
          background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.2) 0%, rgba(22, 163, 74, 0.2) 100%)',
          border: '2px solid rgba(34, 197, 94, 0.5)',
          borderRadius: '14px',
          padding: '20px 26px',
          fontSize: '17px',
          fontWeight: 700,
          color: '#ffffff',
          boxShadow: '0 12px 32px rgba(34, 197, 94, 0.4)',
          backdropFilter: 'blur(10px)',
        },
        icon: '✅',
      });

      // Reset form
      setFormData({
        name: '',
        email: '',
        subject: '',
        message: '',
      });
      setSelectedFile(null);
      setFilePreview(null);
      // Reset file input
      const fileInput = document.querySelector('input[type="file"]');
      if (fileInput) fileInput.value = '';
    } catch (error) {
      console.error('Contact form error:', error);
      toast.error(error.message || 'Failed to send message. Please try again.', {
        duration: 5000,
        style: {
          background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.2) 0%, rgba(220, 38, 38, 0.2) 100%)',
          border: '2px solid rgba(239, 68, 68, 0.5)',
          borderRadius: '14px',
          padding: '20px 26px',
          fontSize: '17px',
          fontWeight: 700,
          color: '#ffffff',
          boxShadow: '0 12px 32px rgba(239, 68, 68, 0.4)',
          backdropFilter: 'blur(10px)',
        },
        icon: '⚠️',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#080915] via-[#0b0c1a] to-[#0d0f25] text-white pb-16">
      <Header />
      <main className="max-w-7xl mx-auto px-6 lg:px-8 pt-16">
        <div className="text-center mb-12">
          <h1 style={{ fontSize: '42px', fontWeight: 800, color: '#ffffff', lineHeight: '1.1', marginBottom: '12px', letterSpacing: '-0.02em' }}>
            Contact Us
          </h1>
          <p style={{ fontSize: '16px', color: '#d1d5db', lineHeight: '1.6', maxWidth: '600px', margin: '0 auto' }}>
            Get in touch with our customer service team. We're here to help!
          </p>
        </div>

        {/* Three Container Layout */}
        <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', justifyContent: 'center', marginBottom: '40px' }}>
          {/* Container 1 - Image (1000px width, 400px height) */}
          <div
            style={{
              ...cardStyle,
              width: '1000px',
              height: '400px',
              padding: '0',
              overflow: 'hidden',
              position: 'relative',
              flexShrink: 0,
            }}
          >
            <img
              src="/images/contact-2.jpg"
              alt="Contact"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
              }}
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.parentElement.style.background = 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)';
                e.target.parentElement.innerHTML = '<div style="display: flex; align-items: center; justify-content: center; height: 100%; color: #9ca3af; font-size: 18px;">Contact Image</div>';
              }}
            />
          </div>

          {/* Container 2 - Image (500px width, 700px height) */}
          <div
            style={{
              ...cardStyle,
              width: '500px',
              height: '700px',
              padding: '0',
              overflow: 'hidden',
              position: 'relative',
            }}
          >
            <img
              src="/images/contact-1.jpg"
              alt="Contact"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
              }}
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.parentElement.style.background = 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)';
                e.target.parentElement.innerHTML = '<div style="display: flex; align-items: center; justify-content: center; height: 100%; color: #9ca3af; font-size: 18px;">Contact Image</div>';
              }}
            />
          </div>

          {/* Container 3 - Customer Service Form */}
          <div
            style={{
              ...cardStyle,
              width: '500px',
              height: '700px',
              padding: '32px',
              display: 'flex',
              flexDirection: 'column',
              overflowY: 'auto',
            }}
          >
            <h2 style={{ fontSize: '28px', fontWeight: 700, color: '#ffffff', marginBottom: '24px' }}>
              Customer Service Request
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#e5e7eb', marginBottom: '8px' }}>
                  Full Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: '10px',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    color: '#ffffff',
                    fontSize: '15px',
                    outline: 'none',
                    transition: 'all 0.2s',
                  }}
                  placeholder="Enter your full name"
                  onFocus={(e) => {
                    e.target.style.borderColor = 'rgba(59, 130, 246, 0.5)';
                    e.target.style.background = 'rgba(255, 255, 255, 0.08)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                    e.target.style.background = 'rgba(255, 255, 255, 0.05)';
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#e5e7eb', marginBottom: '8px' }}>
                  Email Address *
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: '10px',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    color: '#ffffff',
                    fontSize: '15px',
                    outline: 'none',
                    transition: 'all 0.2s',
                  }}
                  placeholder="your.email@example.com"
                  onFocus={(e) => {
                    e.target.style.borderColor = 'rgba(59, 130, 246, 0.5)';
                    e.target.style.background = 'rgba(255, 255, 255, 0.08)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                    e.target.style.background = 'rgba(255, 255, 255, 0.05)';
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#e5e7eb', marginBottom: '8px' }}>
                  Subject *
                </label>
                <input
                  type="text"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  required
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: '10px',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    color: '#ffffff',
                    fontSize: '15px',
                    outline: 'none',
                    transition: 'all 0.2s',
                  }}
                  placeholder="What is this regarding?"
                  onFocus={(e) => {
                    e.target.style.borderColor = 'rgba(59, 130, 246, 0.5)';
                    e.target.style.background = 'rgba(255, 255, 255, 0.08)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                    e.target.style.background = 'rgba(255, 255, 255, 0.05)';
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#e5e7eb', marginBottom: '8px' }}>
                  Message *
                </label>
                <textarea
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  required
                  rows={6}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: '10px',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    color: '#ffffff',
                    fontSize: '15px',
                    outline: 'none',
                    transition: 'all 0.2s',
                    resize: 'vertical',
                    fontFamily: 'inherit',
                  }}
                  placeholder="Please describe your issue or question in detail..."
                  onFocus={(e) => {
                    e.target.style.borderColor = 'rgba(59, 130, 246, 0.5)';
                    e.target.style.background = 'rgba(255, 255, 255, 0.08)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                    e.target.style.background = 'rgba(255, 255, 255, 0.05)';
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#e5e7eb', marginBottom: '8px' }}>
                  Attachment (Optional)
                </label>
                <div style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '8px' }}>
                  Supported formats: JPEG, PNG, PDF, TXT (Max 10MB)
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '100%' }}>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".jpeg,.jpg,.png,.pdf,.txt,image/jpeg,image/png,application/pdf,text/plain"
                    onChange={handleFileChange}
                    style={{ display: 'none' }}
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    style={{
                      padding: '10px 16px',
                      borderRadius: '8px',
                      background: 'rgba(255, 255, 255, 0.08)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      color: '#ffffff',
                      fontSize: '14px',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    Choose File
                  </button>
                  <div style={{ flex: 1, fontSize: '14px', color: '#d1d5db', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {selectedFile ? selectedFile.name : 'No file selected'}
                  </div>
                </div>
                {selectedFile && (
                  <div style={{ marginTop: '12px', padding: '12px', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '8px', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      {filePreview && (
                        <img 
                          src={filePreview} 
                          alt="Preview" 
                          style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '6px' }}
                        />
                      )}
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '14px', color: '#ffffff', fontWeight: 600 }}>
                          {selectedFile.name}
                        </div>
                        <div style={{ fontSize: '12px', color: '#9ca3af' }}>
                          {(selectedFile.size / 1024).toFixed(2)} KB
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedFile(null);
                          setFilePreview(null);
                          if (fileInputRef.current) fileInputRef.current.value = '';
                        }}
                        style={{
                          padding: '6px 12px',
                          borderRadius: '6px',
                          background: 'rgba(239, 68, 68, 0.2)',
                          color: '#f87171',
                          fontSize: '12px',
                          fontWeight: 600,
                          border: 'none',
                          cursor: 'pointer',
                        }}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={loading || uploadingFile}
                style={{
                  width: '100%',
                  padding: '16px',
                  borderRadius: '10px',
                  background: (loading || uploadingFile)
                    ? 'rgba(59, 130, 246, 0.5)'
                    : 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
                  border: 'none',
                  color: '#ffffff',
                  fontSize: '16px',
                  fontWeight: 600,
                  cursor: (loading || uploadingFile) ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s',
                  marginTop: '8px',
                }}
                onMouseEnter={(e) => {
                  if (!loading && !uploadingFile) {
                    e.target.style.transform = 'translateY(-2px)';
                    e.target.style.boxShadow = '0 10px 25px rgba(59, 130, 246, 0.4)';
                  }
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = 'none';
                }}
              >
                {uploadingFile ? 'Uploading file...' : loading ? 'Sending...' : 'Send Message'}
              </button>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}

