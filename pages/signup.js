import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import Header from '../components/Header';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import { FiEye, FiEyeOff } from 'react-icons/fi';

const cardStyle = {
  borderRadius: '16px',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  background: 'rgba(15, 17, 36, 0.95)',
  boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.4), 0 10px 10px -5px rgba(0, 0, 0, 0.2)',
  backdropFilter: 'blur(8px)',
};

function SignUpPage() {
  const [name, setName] = useState('');
  const [surname, setSurname] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [kycFile, setKycFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // Validation errors
  const [errors, setErrors] = useState({
    name: '',
    surname: '',
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    kycFile: '',
  });
  
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Reset errors
    const newErrors = {
      name: '',
      surname: '',
      username: '',
      email: '',
      password: '',
      confirmPassword: '',
      kycFile: '',
    };
    
    // Validate all fields
    let hasError = false;
    
    if (!name || !name.trim()) {
      newErrors.name = 'Name is required';
      hasError = true;
    }
    
    if (!surname || !surname.trim()) {
      newErrors.surname = 'Surname is required';
      hasError = true;
    }
    
    if (!username || !username.trim()) {
      newErrors.username = 'User name is required';
      hasError = true;
    }
    
    if (!email || !email.trim()) {
      newErrors.email = 'Email is required';
      hasError = true;
    } else {
      // Basic email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.trim())) {
        newErrors.email = 'Please enter a valid email address';
        hasError = true;
      }
    }
    
    if (!password) {
      newErrors.password = 'Password is required';
      hasError = true;
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
      hasError = true;
    }
    
    if (!confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
      hasError = true;
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
      hasError = true;
    }
    
    if (!kycFile) {
      newErrors.kycFile = 'Please upload KYC document';
      hasError = true;
    }
    
    // Set errors and return if validation fails
    setErrors(newErrors);
    if (hasError) {
      return;
    }

    setLoading(true);

    try {
      // Sign up with Supabase
      const emailRedirectTo = typeof window !== 'undefined' 
        ? `${window.location.origin}/login`
        : undefined;

      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: email.trim(),
        password: password,
        options: {
          data: {
            full_name: `${name} ${surname}`,
            username: username,
          },
          emailRedirectTo: emailRedirectTo || `${window.location.origin}/login?confirmed=true`,
          // Force email confirmation
          captchaToken: undefined, // Remove if you're not using captcha
        }
      });

      if (signUpError) {
        console.error('Signup error:', signUpError);
        toast.error(signUpError.message || 'Failed to create account');
        setLoading(false);
        return;
      }

      if (authData.user) {
        // Check if email confirmation is required
        const emailConfirmed = authData.user.email_confirmed_at !== null;
        
        // Set the session for the authenticated user (CRITICAL for RLS policies)
        if (authData.session) {
          const { error: sessionError } = await supabase.auth.setSession(authData.session);
          if (sessionError) {
            console.error('Session set error:', sessionError);
          } else {
            console.log('Session set successfully for user:', authData.user.id);
          }
        }
        
        // Wait a bit for session to be fully established
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Create profile via API endpoint (bypasses RLS using service role)
        // This prevents 401 errors during signup
        console.log('🔐 [SIGNUP] Creating profile via API...');
        try {
          const profileResponse = await fetch('/api/auth/create-profile', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              user_id: authData.user.id,
              email: email.trim(),
              full_name: `${name} ${surname}`,
              username: username,
            }),
          });

          const profileResult = await profileResponse.json();
          
          if (!profileResponse.ok || !profileResult.success) {
            console.error('🔐 [SIGNUP] Profile creation API error:', profileResult);
            // Continue anyway - trigger might have created it
            console.warn('🔐 [SIGNUP] Profile API failed, but continuing (trigger may have created it)');
          } else {
            console.log('🔐 [SIGNUP] ✅ Profile created/updated successfully via API:', profileResult.message);
          }
        } catch (profileApiError) {
          console.error('🔐 [SIGNUP] Profile creation API exception:', profileApiError);
          // Continue anyway - trigger might have created it
          console.warn('🔐 [SIGNUP] Profile API exception, but continuing (trigger may have created it)');
        }

        // Upload KYC file via API (bypasses RLS using service role)
        if (kycFile) {
          console.log('=== KYC UPLOAD START ===');
          console.log('Starting KYC file upload via API...', {
            fileName: kycFile.name,
            fileSize: kycFile.size,
            fileType: kycFile.type,
            userId: authData.user.id
          });
          
          try {
            // Convert file to base64
            console.log('Converting file to base64...');
            const reader = new FileReader();
            const fileBase64Promise = new Promise((resolve, reject) => {
              reader.onload = () => {
                console.log('File converted to base64, length:', reader.result?.length || 0);
                resolve(reader.result);
              };
              reader.onerror = (error) => {
                console.error('FileReader error:', error);
                reject(error);
              };
              reader.readAsDataURL(kycFile);
            });

            const fileBase64 = await fileBase64Promise;
            console.log('Base64 conversion complete');

            // Upload via API endpoint (uses service role, bypasses RLS)
            console.log('Calling /api/kyc/upload-file...');
            const uploadResponse = await fetch('/api/kyc/upload-file', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                user_id: authData.user.id,
                document_type: 'id_card',
                file_base64: fileBase64,
                file_name: kycFile.name,
                file_type: kycFile.type || 'image/jpeg',
              }),
            });

            console.log('Upload response status:', uploadResponse.status, uploadResponse.statusText);

            if (!uploadResponse.ok) {
              const errorData = await uploadResponse.json();
              console.error('KYC upload API error:', errorData);
              toast.error(`Failed to upload KYC document: ${errorData.error || 'Unknown error'}`);
              
              // Fallback: Save record without URL
              try {
                console.log('Attempting fallback: Save record without URL...');
                const { data: insertData, error: docError2 } = await supabase
                  .from('kyc_documents')
                  .insert({
                    user_id: authData.user.id,
                    document_type: 'id_card',
                    document_url: 'pending_upload',
                    status: 'pending',
                  });
                
                if (docError2) {
                  console.error('KYC document insert error (fallback):', docError2);
                } else {
                  console.log('KYC document record saved (pending_upload):', insertData);
                }
              } catch (fallbackErr) {
                console.error('Fallback insert error:', fallbackErr);
              }
            } else {
              const result = await uploadResponse.json();
              console.log('=== KYC UPLOAD SUCCESS ===');
              console.log('KYC file uploaded successfully via API:', result);
              toast.success('KYC document uploaded successfully');
            }
          } catch (uploadErr) {
            console.error('=== KYC UPLOAD EXCEPTION ===');
            console.error('KYC upload exception:', uploadErr);
            toast.error('Failed to upload KYC document. Please try again.');
            
            // Fallback: Save record without URL
            try {
              console.log('Attempting fallback after exception...');
              const { data: insertData, error: docError3 } = await supabase
                .from('kyc_documents')
                .insert({
                  user_id: authData.user.id,
                  document_type: 'id_card',
                  document_url: 'pending_upload',
                  status: 'pending',
                });
              
              if (docError3) {
                console.error('KYC document save error:', docError3);
              } else {
                console.log('KYC document record saved (exception fallback):', insertData);
              }
            } catch (docErr) {
              console.error('KYC document save exception:', docErr);
            }
          }
        } else {
          console.warn('No KYC file provided during signup');
        }

        // Clear form
        setName('');
        setSurname('');
        setUsername('');
        setEmail('');
        setPassword('');
        setConfirmPassword('');
        setKycFile(null);

        // Show email confirmation message
        // Note: email_confirmed_at is usually null for new signups, so we assume confirmation is required
        const needsConfirmation = !authData.user.email_confirmed_at;
        
        if (needsConfirmation) {
          toast.success('Account created successfully!', { duration: 2000 });
          
          // Show prominent notification box immediately
          toast(
            <div style={{ padding: '4px 0' }}>
              <div style={{ fontSize: '16px', fontWeight: 700, marginBottom: '8px', color: '#ffffff' }}>
                📧 Email Confirmation Required
              </div>
              <div style={{ fontSize: '14px', color: '#e5e7eb', lineHeight: '1.6' }}>
                We've sent a confirmation email to <strong style={{ color: '#ffffff' }}>{email}</strong>.
                <br />
                <br />
                Please check your inbox and click the confirmation link to verify your account before logging in.
              </div>
            </div>,
            {
              icon: '📧',
              duration: 15000,
              style: {
                background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.95) 0%, rgba(139, 92, 246, 0.95) 100%)',
                color: '#ffffff',
                padding: '20px 24px',
                borderRadius: '12px',
                fontSize: '14px',
                maxWidth: '500px',
                border: '2px solid rgba(255, 255, 255, 0.2)',
                boxShadow: '0 10px 25px rgba(0, 0, 0, 0.3)',
              },
            }
          );
          
          // Redirect to login after showing the message
          setTimeout(() => {
            router.push('/login');
          }, 3000);
        } else {
          toast.success('Account created successfully! Redirecting to login...');
          setTimeout(() => {
            router.push('/login');
          }, 2000);
        }
      }
    } catch (error) {
      console.error('Signup error:', error);
      toast.error('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#080915] via-[#0b0c1a] to-[#0d0f25] text-white">
      <Header />
      <div className="flex items-center justify-center px-6 py-12" style={{ minHeight: 'calc(100vh - 80px)' }}>
      <div style={{ ...cardStyle, padding: '48px', maxWidth: '440px', width: '100%' }}>
        <div className="text-center mb-8">
          <h1 style={{ fontSize: '32px', fontWeight: 800, color: '#ffffff', marginBottom: '8px' }}>
            Create account
          </h1>
          <p style={{ fontSize: '15px', color: '#9ca3af' }}>
            Sign up to get started with Synax
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#e5e7eb', marginBottom: '8px' }}>
              Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (errors.name) setErrors({ ...errors, name: '' });
              }}
              required
              style={{
                width: '100%',
                padding: '12px 16px',
                borderRadius: '10px',
                background: 'rgba(255, 255, 255, 0.05)',
                border: errors.name ? '1px solid #ef4444' : '1px solid rgba(255, 255, 255, 0.1)',
                color: '#ffffff',
                fontSize: '15px',
                outline: 'none',
                transition: 'all 0.2s',
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = errors.name ? '#ef4444' : 'rgba(59, 130, 246, 0.5)';
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = errors.name ? '#ef4444' : 'rgba(255, 255, 255, 0.1)';
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
              }}
              placeholder="John"
            />
            {errors.name && (
              <p style={{ fontSize: '12px', color: '#ef4444', marginTop: '6px' }}>{errors.name}</p>
            )}
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#e5e7eb', marginBottom: '8px' }}>
              Surname
            </label>
            <input
              type="text"
              value={surname}
              onChange={(e) => {
                setSurname(e.target.value);
                if (errors.surname) setErrors({ ...errors, surname: '' });
              }}
              required
              style={{
                width: '100%',
                padding: '12px 16px',
                borderRadius: '10px',
                background: 'rgba(255, 255, 255, 0.05)',
                border: errors.surname ? '1px solid #ef4444' : '1px solid rgba(255, 255, 255, 0.1)',
                color: '#ffffff',
                fontSize: '15px',
                outline: 'none',
                transition: 'all 0.2s',
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = errors.surname ? '#ef4444' : 'rgba(59, 130, 246, 0.5)';
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = errors.surname ? '#ef4444' : 'rgba(255, 255, 255, 0.1)';
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
              }}
              placeholder="Doe"
            />
            {errors.surname && (
              <p style={{ fontSize: '12px', color: '#ef4444', marginTop: '6px' }}>{errors.surname}</p>
            )}
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#e5e7eb', marginBottom: '8px' }}>
              User Name
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => {
                setUsername(e.target.value);
                if (errors.username) setErrors({ ...errors, username: '' });
              }}
              required
              style={{
                width: '100%',
                padding: '12px 16px',
                borderRadius: '10px',
                background: 'rgba(255, 255, 255, 0.05)',
                border: errors.username ? '1px solid #ef4444' : '1px solid rgba(255, 255, 255, 0.1)',
                color: '#ffffff',
                fontSize: '15px',
                outline: 'none',
                transition: 'all 0.2s',
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = errors.username ? '#ef4444' : 'rgba(59, 130, 246, 0.5)';
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = errors.username ? '#ef4444' : 'rgba(255, 255, 255, 0.1)';
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
              }}
              placeholder="johndoe"
            />
            {errors.username && (
              <p style={{ fontSize: '12px', color: '#ef4444', marginTop: '6px' }}>{errors.username}</p>
            )}
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#e5e7eb', marginBottom: '8px' }}>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (errors.email) setErrors({ ...errors, email: '' });
              }}
              required
              style={{
                width: '100%',
                padding: '12px 16px',
                borderRadius: '10px',
                background: 'rgba(255, 255, 255, 0.05)',
                border: errors.email ? '1px solid #ef4444' : '1px solid rgba(255, 255, 255, 0.1)',
                color: '#ffffff',
                fontSize: '15px',
                outline: 'none',
                transition: 'all 0.2s',
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = errors.email ? '#ef4444' : 'rgba(59, 130, 246, 0.5)';
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = errors.email ? '#ef4444' : 'rgba(255, 255, 255, 0.1)';
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
              }}
              placeholder="you@example.com"
            />
            {errors.email && (
              <p style={{ fontSize: '12px', color: '#ef4444', marginTop: '6px' }}>{errors.email}</p>
            )}
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#e5e7eb', marginBottom: '8px' }}>
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errors.password) setErrors({ ...errors, password: '' });
                }}
                required
                style={{
                  width: '100%',
                  padding: '12px 45px 12px 16px',
                  borderRadius: '10px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: errors.password ? '1px solid #ef4444' : '1px solid rgba(255, 255, 255, 0.1)',
                  color: '#ffffff',
                  fontSize: '15px',
                  outline: 'none',
                  transition: 'all 0.2s',
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = errors.password ? '#ef4444' : 'rgba(59, 130, 246, 0.5)';
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = errors.password ? '#ef4444' : 'rgba(255, 255, 255, 0.1)';
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                }}
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: '#9ca3af',
                  cursor: 'pointer',
                  padding: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {showPassword ? <FiEyeOff size={20} /> : <FiEye size={20} />}
              </button>
            </div>
            {errors.password && (
              <p style={{ fontSize: '12px', color: '#ef4444', marginTop: '6px' }}>{errors.password}</p>
            )}
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#e5e7eb', marginBottom: '8px' }}>
              Confirm Password
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  if (errors.confirmPassword) setErrors({ ...errors, confirmPassword: '' });
                }}
                required
                style={{
                  width: '100%',
                  padding: '12px 45px 12px 16px',
                  borderRadius: '10px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: errors.confirmPassword ? '1px solid #ef4444' : '1px solid rgba(255, 255, 255, 0.1)',
                  color: '#ffffff',
                  fontSize: '15px',
                  outline: 'none',
                  transition: 'all 0.2s',
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = errors.confirmPassword ? '#ef4444' : 'rgba(59, 130, 246, 0.5)';
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = errors.confirmPassword ? '#ef4444' : 'rgba(255, 255, 255, 0.1)';
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                }}
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: '#9ca3af',
                  cursor: 'pointer',
                  padding: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {showConfirmPassword ? <FiEyeOff size={20} /> : <FiEye size={20} />}
              </button>
            </div>
            {errors.confirmPassword && (
              <p style={{ fontSize: '12px', color: '#ef4444', marginTop: '6px' }}>{errors.confirmPassword}</p>
            )}
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#e5e7eb', marginBottom: '8px' }}>
              KYC ID Upload
            </label>
            <div
              style={{
                width: '100%',
                padding: '12px 16px',
                borderRadius: '10px',
                background: 'rgba(255, 255, 255, 0.05)',
                border: errors.kycFile ? '1px solid #ef4444' : '1px solid rgba(255, 255, 255, 0.1)',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                transition: 'all 0.2s',
              }}
            >
              <input
                type="file"
                id="kyc-file-input"
                accept="image/*,.pdf"
                onChange={(e) => {
                  setKycFile(e.target.files[0]);
                  if (errors.kycFile) setErrors({ ...errors, kycFile: '' });
                }}
                required
                style={{
                  display: 'none',
                }}
              />
              <label
                htmlFor="kyc-file-input"
                style={{
                  padding: '8px 16px',
                  borderRadius: '8px',
                  background: 'rgba(59, 130, 246, 0.15)',
                  border: '1px solid rgba(59, 130, 246, 0.3)',
                  color: '#60a5fa',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  whiteSpace: 'nowrap',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(59, 130, 246, 0.25)';
                  e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.5)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(59, 130, 246, 0.15)';
                  e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.3)';
                }}
              >
                Select File
              </label>
              <span style={{ fontSize: '14px', color: kycFile ? '#9ca3af' : '#6b7280', flex: 1 }}>
                {kycFile ? kycFile.name : 'No file selected'}
              </span>
            </div>
            {kycFile && !errors.kycFile && (
              <p style={{ fontSize: '12px', color: '#4ade80', marginTop: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span>✓</span> File selected successfully
              </p>
            )}
            {errors.kycFile && (
              <p style={{ fontSize: '12px', color: '#ef4444', marginTop: '6px' }}>{errors.kycFile}</p>
            )}
          </div>

          <div className="text-sm" style={{ color: '#9ca3af' }}>
            By signing up, you agree to our{' '}
            <Link href="/terms" style={{ color: '#60a5fa' }}>Terms of Use</Link> and{' '}
            <Link href="/privacy" style={{ color: '#60a5fa' }}>Privacy Policy</Link>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '14px',
              borderRadius: '10px',
              background: loading ? 'rgba(59, 130, 246, 0.5)' : 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
              border: 'none',
              color: '#ffffff',
              fontSize: '15px',
              fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s',
              boxShadow: '0 4px 14px 0 rgba(139, 92, 246, 0.3)',
            }}
            onMouseEnter={(e) => {
              if (!loading) {
                e.currentTarget.style.opacity = '0.9';
                e.currentTarget.style.transform = 'translateY(-1px)';
              }
            }}
            onMouseLeave={(e) => {
              if (!loading) {
                e.currentTarget.style.opacity = '1';
                e.currentTarget.style.transform = 'translateY(0)';
              }
            }}
          >
            {loading ? 'Creating account...' : 'Create account'}
          </button>
        </form>

        <div className="text-center mt-6" style={{ fontSize: '14px', color: '#9ca3af' }}>
          Already have an account?{' '}
          <Link href="/login" style={{ color: '#60a5fa', textDecoration: 'none', fontWeight: 600 }}>
            Sign in
          </Link>
        </div>
      </div>
      </div>
    </div>
  );
}

export default SignUpPage;

