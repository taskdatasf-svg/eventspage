'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { GoCheck, GoPerson, GoLock, GoMail, GoShieldCheck, GoArrowLeft } from 'react-icons/go';
import TurnstileWidget from '@/components/TurnstileWidget';
import Link from 'next/link';
import { DotmSquare5 } from '@/components/ui/dotm-square-5';

export default function AuthPage() {
  const [mode, setMode] = useState<'login' | 'signup' | 'forgot'>('login');
  
  // Sign Up Multi-Step State (Step 1: Email -> Step 2: OTP Verification -> Step 3: Set Password)
  const [signupStep, setSignupStep] = useState<1 | 2 | 3>(1);
  const [forgotStep, setForgotStep] = useState<1 | 2 | 3>(1);
  const [sentCode, setSentCode] = useState('');
  const [enteredOtp, setEnteredOtp] = useState('');
  
  // Form Inputs
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // UI Messages
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState('');
  const [isLocalhost, setIsLocalhost] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      setIsLocalhost(isLocal);
      if (isLocal) {
        setTurnstileToken('localhost_bypass');
      }
    }
  }, []);

  // Step 1: Send Verification Email
  const handleSendVerificationCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!email || !email.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/send-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Failed to send verification code');

      setSentCode(data.code);
      setSignupStep(2);
      setSuccessMsg(`Verification code sent to ${email}`);
    } catch (err: unknown) {
      if (err instanceof Error) setError(err.message);
      else setError('An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2: Confirm OTP Verification Code
  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (enteredOtp.trim() !== sentCode.trim()) {
      setError('Invalid 6-digit code. Please check your email notification and try again.');
      return;
    }

    setSuccessMsg('Email verified! Now set your account password.');
    setSignupStep(3);
  };

  // Step 3: Complete Registration (Set Password)
  const handleCompleteRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (!isLocalhost && !turnstileToken) {
      setError('Please complete the security verification check.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name || email.split('@')[0], email, password, turnstileToken })
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Registration failed');

      localStorage.setItem('student_forge_user', JSON.stringify(data.user));
      setSuccessMsg('Account created successfully! Redirecting...');
      setTimeout(() => {
        window.location.href = '/';
      }, 1200);
    } catch (err: unknown) {
      if (err instanceof Error) setError(err.message);
      else setError('An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  // Forgot Password - Step 1: Send OTP for Password Recovery
  const handleSendForgotCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!email || !email.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/send-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, checkUserExists: true })
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Failed to send verification code');

      setSentCode(data.code);
      setForgotStep(2);
      setSuccessMsg(`Verification code sent to ${email}`);
    } catch (err: unknown) {
      if (err instanceof Error) setError(err.message);
      else setError('An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  // Forgot Password - Step 2: Confirm Forgot OTP Code
  const handleVerifyForgotOtp = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (enteredOtp.trim() !== sentCode.trim()) {
      setError('Invalid 6-digit code. Please check your email notification and try again.');
      return;
    }

    setSuccessMsg('Email verified! Now choose a new password.');
    setForgotStep(3);
  };

  // Forgot Password - Step 3: Complete Password Reset
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Failed to reset password');

      setSuccessMsg('Password reset successfully! Redirecting to sign in...');
      setTimeout(() => {
        setMode('login');
        setForgotStep(1);
        setError('');
        setSuccessMsg('');
        setPassword('');
        setConfirmPassword('');
      }, 1500);
    } catch (err: unknown) {
      if (err instanceof Error) setError(err.message);
      else setError('An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  // Normal Sign In
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!isLocalhost && !turnstileToken) {
      setError('Please complete the security verification check.');
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, turnstileToken })
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Invalid credentials');

      localStorage.setItem('student_forge_user', JSON.stringify(data.user));
      setSuccessMsg('Signed in successfully! Redirecting...');
      setTimeout(() => {
        window.location.href = '/';
      }, 1200);
    } catch (err: unknown) {
      if (err instanceof Error) setError(err.message);
      else setError('An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="relative min-h-screen bg-[#161618] text-white flex flex-col justify-between antialiased font-sans overflow-x-hidden selection:bg-neutral-800 selection:text-white">
      <Navbar />

      {/* Crisp grid background pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#232329_1px,transparent_1px),linear-gradient(to_bottom,#232329_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-20 pointer-events-none" />

      {/* Floating ambient radial glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Centered Auth Card Workspace */}
      <div className="w-full max-w-md mx-auto py-12 px-4 flex-1 flex flex-col justify-center z-10 relative">
        
        <div className="bg-[#121214] border border-[#232329] rounded-2xl p-6 sm:p-8 flex flex-col gap-6 shadow-[0_8px_30px_rgb(0,0,0,0.4)]">
          
          {/* Header Icon & Title */}
          <div className="flex flex-col items-center text-center gap-2">
            <div className="w-12 h-12 rounded-full bg-[#18181B] border border-[#232329] text-white flex items-center justify-center shadow-inner">
              {(mode === 'signup' && signupStep === 2) || (mode === 'forgot' && forgotStep === 2) ? (
                <GoShieldCheck className="w-5 h-5 text-neutral-300" />
              ) : (
                <GoPerson className="w-5 h-5" />
              )}
            </div>

            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              {mode === 'login'
                ? 'Welcome Back'
                : mode === 'signup'
                ? (signupStep === 1
                  ? 'Verify Your Email'
                  : signupStep === 2
                  ? 'Enter Verification Code'
                  : 'Set Account Password')
                : (forgotStep === 1
                  ? 'Verify Your Email'
                  : forgotStep === 2
                  ? 'Enter Verification Code'
                  : 'Reset Password')}
            </h1>
            <p className="text-xs text-neutral-400 max-w-[280px]">
              {mode === 'login'
                ? 'Sign in to access your event dashboard'
                : mode === 'signup'
                ? (signupStep === 1
                  ? 'Enter your email address to receive a 6-digit verification code'
                  : signupStep === 2
                  ? `Enter the 6-digit code sent to ${email}`
                  : 'Create a password to finalize your account registration')
                : (forgotStep === 1
                  ? 'Enter your email address to verify your account and receive an OTP'
                  : forgotStep === 2
                  ? `Enter the 6-digit code sent to ${email}`
                  : 'Enter and confirm your new account password')}
            </p>
          </div>

          {/* Mode Switcher Tabs */}
          {mode !== 'forgot' ? (
            <div className="flex items-center gap-1 bg-[#18181B] border border-[#232329] rounded-xl p-1">
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setError('');
                  setSuccessMsg('');
                  setSignupStep(1);
                  setTurnstileToken(isLocalhost ? 'localhost_bypass' : '');
                }}
                className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all duration-200 cursor-pointer ${
                  mode === 'login' ? 'bg-[#27272A] text-white shadow-sm' : 'text-neutral-400 hover:text-white'
                }`}
              >
                Sign In
              </button>

              <button
                type="button"
                onClick={() => {
                  setMode('signup');
                  setError('');
                  setSuccessMsg('');
                  setSignupStep(1);
                  setTurnstileToken(isLocalhost ? 'localhost_bypass' : '');
                }}
                className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all duration-200 cursor-pointer ${
                  mode === 'signup' ? 'bg-[#27272A] text-white shadow-sm' : 'text-neutral-400 hover:text-white'
                }`}
              >
                Sign Up
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-start">
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setForgotStep(1);
                  setError('');
                  setSuccessMsg('');
                  setTurnstileToken(isLocalhost ? 'localhost_bypass' : '');
                }}
                className="text-xs text-neutral-400 hover:text-white font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <GoArrowLeft className="w-3.5 h-3.5" />
                <span>Back to Sign In</span>
              </button>
            </div>
          )}

          {/* Feedback Messages */}
          {error && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs text-rose-400 text-center animate-fade-in">
              {error}
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-neutral-900 border border-neutral-800 rounded-xl text-xs text-neutral-200 text-center flex items-center justify-center gap-1.5 animate-fade-in">
              <GoCheck className="w-4 h-4 text-neutral-400" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* FORMS */}
          {mode === 'login' && (
            /* Normal Sign In Form */
            <form onSubmit={handleLoginSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <span className="text-[10px] uppercase font-mono text-neutral-400 tracking-wider">Email Address</span>
                <div className="bg-[#18181B] border border-[#232329] focus-within:border-neutral-700 rounded-xl p-3 flex items-center gap-3 transition-colors">
                  <GoMail className="w-4 h-4 text-neutral-400 flex-shrink-0" />
                  <input
                    type="email"
                    placeholder="name@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="bg-transparent text-sm text-white placeholder-neutral-500 outline-none w-full"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-mono text-neutral-400 tracking-wider">Password</span>
                  <button
                    type="button"
                    onClick={() => {
                      setMode('forgot');
                      setForgotStep(1);
                      setError('');
                      setSuccessMsg('');
                      setEnteredOtp('');
                      setPassword('');
                      setConfirmPassword('');
                      setTurnstileToken(isLocalhost ? 'localhost_bypass' : '');
                    }}
                    className="text-[10px] uppercase font-mono text-neutral-400 hover:text-white transition-colors cursor-pointer"
                  >
                    Forgot Password?
                  </button>
                </div>
                <div className="bg-[#18181B] border border-[#232329] focus-within:border-neutral-700 rounded-xl p-3 flex items-center gap-3 transition-colors">
                  <GoLock className="w-4 h-4 text-neutral-400 flex-shrink-0" />
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="bg-transparent text-sm text-white placeholder-neutral-500 outline-none w-full"
                  />
                </div>
              </div>

              {/* Turnstile Widget */}
              {!isLocalhost && <TurnstileWidget onVerify={setTurnstileToken} />}

              <button
                type="submit"
                disabled={isLoading || (!isLocalhost && !turnstileToken)}
                className="w-full py-3.5 bg-white text-black hover:bg-neutral-200 disabled:bg-neutral-800 disabled:text-neutral-500 disabled:opacity-60 font-semibold text-sm rounded-xl transition-all shadow-xl cursor-pointer mt-2 flex items-center justify-center gap-2"
              >
                {isLoading ? <DotmSquare5 size={18} dotSize={2} speed={1.2} bloom colorPreset="grad-aurora" animated /> : 'Sign In'}
              </button>
            </form>
          )}

          {mode === 'signup' && (
            /* Multi-Step Sign Up Form */
            <>
              {signupStep === 1 && (
                /* Step 1: Type Email only */
                <form onSubmit={handleSendVerificationCode} className="flex flex-col gap-4">
                  <div className="flex flex-col gap-1.5">
                    <span className="text-[10px] uppercase font-mono text-neutral-400 tracking-wider">Registered Email</span>
                    <div className="bg-[#18181B] border border-[#232329] focus-within:border-neutral-700 rounded-xl p-3 flex items-center gap-3 transition-colors">
                      <GoMail className="w-4 h-4 text-neutral-400 flex-shrink-0" />
                      <input
                        type="email"
                        placeholder="name@company.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="bg-transparent text-sm text-white placeholder-neutral-500 outline-none w-full"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3.5 bg-[#18181B] text-white border border-[#232329] hover:bg-[#27272A] font-semibold text-sm rounded-xl transition-all shadow-xl cursor-pointer mt-2 flex items-center justify-center gap-2"
                  >
                    {isLoading ? <DotmSquare5 size={18} dotSize={2} speed={1.2} bloom colorPreset="grad-aurora" animated /> : 'Send Verification Code'}
                  </button>
                </form>
              )}

              {signupStep === 2 && (
                /* Step 2: Confirm 6-Digit OTP */
                <form onSubmit={handleVerifyOtp} className="flex flex-col gap-4">
                  <div className="p-3 bg-neutral-900/60 border border-[#232329] rounded-xl text-[11px] text-neutral-300 flex flex-col gap-1.5 leading-relaxed">
                    <span className="font-semibold text-white uppercase font-mono text-[9px] tracking-wider flex items-center gap-1.5">
                      <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>
                      Can't find the email?
                    </span>
                    <span>Please check your <strong>Spam or Junk box</strong> if you cannot find the verification code in your primary inbox.</span>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <span className="text-[10px] uppercase font-mono text-neutral-400 tracking-wider">6-Digit Verification Code</span>
                    <div className="bg-[#18181B] border border-[#232329] focus-within:border-neutral-700 rounded-xl p-3 flex items-center gap-3 transition-colors">
                      <GoShieldCheck className="w-4 h-4 text-neutral-300 flex-shrink-0" />
                      <input
                        type="text"
                        placeholder="123456"
                        maxLength={6}
                        value={enteredOtp}
                        onChange={(e) => setEnteredOtp(e.target.value)}
                        required
                        className="bg-transparent text-base font-mono tracking-widest text-white placeholder-neutral-500 outline-none w-full text-center"
                        autoFocus
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-3 mt-2">
                    <button
                      type="button"
                      onClick={() => setSignupStep(1)}
                      className="px-4 py-3 bg-[#18181B] hover:bg-[#27272A] text-neutral-300 text-xs font-medium rounded-xl border border-[#232329] transition-colors cursor-pointer flex items-center gap-1.5"
                    >
                      <GoArrowLeft className="w-3.5 h-3.5" />
                      <span>Back</span>
                    </button>

                    <button
                      type="submit"
                      className="flex-1 py-3 bg-white hover:bg-neutral-200 text-black font-semibold text-xs rounded-xl transition-colors cursor-pointer shadow-md"
                    >
                      Verify Email Code
                    </button>
                  </div>
                </form>
              )}

              {signupStep === 3 && (
                /* Step 3: Set Name and Password */
                <form onSubmit={handleCompleteRegistration} className="flex flex-col gap-4">
                  <div className="flex flex-col gap-1.5">
                    <span className="text-[10px] uppercase font-mono text-neutral-400 tracking-wider">Full Name</span>
                    <div className="bg-[#18181B] border border-[#232329] focus-within:border-neutral-700 rounded-xl p-3 flex items-center gap-3 transition-colors">
                      <GoPerson className="w-4 h-4 text-neutral-400 flex-shrink-0" />
                      <input
                        type="text"
                        placeholder="John Doe"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                        className="bg-transparent text-sm text-white placeholder-neutral-500 outline-none w-full"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <span className="text-[10px] uppercase font-mono text-neutral-400 tracking-wider">Create Password</span>
                    <div className="bg-[#18181B] border border-[#232329] focus-within:border-neutral-700 rounded-xl p-3 flex items-center gap-3 transition-colors">
                      <GoLock className="w-4 h-4 text-neutral-400 flex-shrink-0" />
                      <input
                        type="password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="bg-transparent text-sm text-white placeholder-neutral-500 outline-none w-full"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <span className="text-[10px] uppercase font-mono text-neutral-400 tracking-wider">Confirm Password</span>
                    <div className="bg-[#18181B] border border-[#232329] focus-within:border-neutral-700 rounded-xl p-3 flex items-center gap-3 transition-colors">
                      <GoLock className="w-4 h-4 text-neutral-400 flex-shrink-0" />
                      <input
                        type="password"
                        placeholder="••••••••"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        className="bg-transparent text-sm text-white placeholder-neutral-500 outline-none w-full"
                      />
                    </div>
                  </div>

                  {/* Turnstile Widget */}
                  {!isLocalhost && <TurnstileWidget onVerify={setTurnstileToken} />}

                  <button
                    type="submit"
                    disabled={isLoading || (!isLocalhost && !turnstileToken)}
                    className="w-full py-3.5 bg-white text-black hover:bg-neutral-200 disabled:bg-neutral-800 disabled:text-neutral-500 disabled:opacity-60 font-semibold text-sm rounded-xl transition-all shadow-xl cursor-pointer mt-2 flex items-center justify-center gap-2"
                  >
                    {isLoading ? <DotmSquare5 size={18} dotSize={2} speed={1.2} bloom colorPreset="grad-aurora" animated /> : 'Complete Sign Up'}
                  </button>
                </form>
              )}
            </>
          )}

          {mode === 'forgot' && (
            /* Multi-Step Forgot Password Form */
            <>
              {forgotStep === 1 && (
                /* Step 1: Type Email only */
                <form onSubmit={handleSendForgotCode} className="flex flex-col gap-4">
                  <div className="flex flex-col gap-1.5">
                    <span className="text-[10px] uppercase font-mono text-neutral-400 tracking-wider">Account Email</span>
                    <div className="bg-[#18181B] border border-[#232329] focus-within:border-neutral-700 rounded-xl p-3 flex items-center gap-3 transition-colors">
                      <GoMail className="w-4 h-4 text-neutral-400 flex-shrink-0" />
                      <input
                        type="email"
                        placeholder="name@company.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="bg-transparent text-sm text-white placeholder-neutral-500 outline-none w-full"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3.5 bg-white text-black hover:bg-neutral-200 font-semibold text-sm rounded-xl transition-all shadow-xl cursor-pointer mt-2 flex items-center justify-center gap-2"
                  >
                    {isLoading ? <DotmSquare5 size={18} dotSize={2} speed={1.2} bloom colorPreset="grad-aurora" animated /> : 'Verify Email & Send OTP'}
                  </button>
                </form>
              )}

              {forgotStep === 2 && (
                /* Step 2: Confirm 6-Digit OTP */
                <form onSubmit={handleVerifyForgotOtp} className="flex flex-col gap-4">
                  <div className="p-3 bg-neutral-900/60 border border-[#232329] rounded-xl text-[11px] text-neutral-300 flex flex-col gap-1.5 leading-relaxed">
                    <span className="font-semibold text-white uppercase font-mono text-[9px] tracking-wider flex items-center gap-1.5">
                      <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>
                      Can't find the email?
                    </span>
                    <span>Please check your <strong>Spam or Junk box</strong> if you cannot find the verification code in your primary inbox.</span>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <span className="text-[10px] uppercase font-mono text-neutral-400 tracking-wider">6-Digit Verification Code</span>
                    <div className="bg-[#18181B] border border-[#232329] focus-within:border-neutral-700 rounded-xl p-3 flex items-center gap-3 transition-colors">
                      <GoShieldCheck className="w-4 h-4 text-neutral-300 flex-shrink-0" />
                      <input
                        type="text"
                        placeholder="123456"
                        maxLength={6}
                        value={enteredOtp}
                        onChange={(e) => setEnteredOtp(e.target.value)}
                        required
                        className="bg-transparent text-base font-mono tracking-widest text-white placeholder-neutral-500 outline-none w-full text-center"
                        autoFocus
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-3 mt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setForgotStep(1);
                        setError('');
                        setSuccessMsg('');
                      }}
                      className="px-4 py-3 bg-[#18181B] hover:bg-[#27272A] text-neutral-300 text-xs font-medium rounded-xl border border-[#232329] transition-colors cursor-pointer flex items-center gap-1.5"
                    >
                      <GoArrowLeft className="w-3.5 h-3.5" />
                      <span>Back</span>
                    </button>

                    <button
                      type="submit"
                      className="flex-1 py-3 bg-white hover:bg-neutral-200 text-black font-semibold text-xs rounded-xl transition-colors cursor-pointer shadow-md"
                    >
                      Verify Code
                    </button>
                  </div>
                </form>
              )}

              {forgotStep === 3 && (
                /* Step 3: Set Password */
                <form onSubmit={handleResetPassword} className="flex flex-col gap-4">
                  <div className="flex flex-col gap-1.5">
                    <span className="text-[10px] uppercase font-mono text-neutral-400 tracking-wider">New Password</span>
                    <div className="bg-[#18181B] border border-[#232329] focus-within:border-neutral-700 rounded-xl p-3 flex items-center gap-3 transition-colors">
                      <GoLock className="w-4 h-4 text-neutral-400 flex-shrink-0" />
                      <input
                        type="password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="bg-transparent text-sm text-white placeholder-neutral-500 outline-none w-full"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <span className="text-[10px] uppercase font-mono text-neutral-400 tracking-wider">Confirm New Password</span>
                    <div className="bg-[#18181B] border border-[#232329] focus-within:border-[#44444a] rounded-xl p-3 flex items-center gap-3">
                      <GoLock className="w-4 h-4 text-neutral-400 flex-shrink-0" />
                      <input
                        type="password"
                        placeholder="••••••••"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        className="bg-transparent text-sm text-white placeholder-neutral-500 outline-none w-full"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3.5 bg-white text-black hover:bg-neutral-200 font-semibold text-sm rounded-xl transition-all shadow-xl cursor-pointer mt-2 flex items-center justify-center gap-2"
                  >
                    {isLoading ? <DotmSquare5 size={18} dotSize={2} speed={1.2} bloom colorPreset="grad-aurora" animated /> : 'Reset Password'}
                  </button>
                </form>
              )}
            </>
          )}

        </div>

      </div>

      <Footer />
    </main>
  );
}
