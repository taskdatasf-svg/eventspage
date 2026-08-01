'use client';

import React, { useState } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { GoCheck, GoPerson, GoLock, GoMail, GoShieldCheck, GoArrowLeft } from 'react-icons/go';

export default function AuthPage() {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  
  // Sign Up Multi-Step State (Step 1: Email -> Step 2: OTP Verification -> Step 3: Set Password)
  const [signupStep, setSignupStep] = useState<1 | 2 | 3>(1);
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

    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name || email.split('@')[0], email, password })
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

  // Normal Sign In
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
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
    <main className="relative min-h-screen bg-[#161618] text-white flex flex-col justify-between antialiased font-sans">
      <Navbar />

      <div className="w-full max-w-md mx-auto py-12 px-4 flex-1 flex flex-col justify-center">
        
        {/* Auth Box Container */}
        <div className="bg-[#1c1c1f] border border-[#2e2e34] rounded-2xl p-6 sm:p-8 flex flex-col gap-6 shadow-2xl relative">
          
          {/* Header Icon & Title */}
          <div className="flex flex-col items-center text-center gap-2">
            <div className="w-12 h-12 rounded-full bg-[#222226] border border-[#2e2e34] text-white flex items-center justify-center shadow-md">
              {mode === 'signup' && signupStep === 2 ? (
                <GoShieldCheck className="w-6 h-6 text-neutral-300" />
              ) : (
                <GoPerson className="w-6 h-6" />
              )}
            </div>

            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              {mode === 'login'
                ? 'Welcome Back'
                : signupStep === 1
                ? 'Verify Your Email'
                : signupStep === 2
                ? 'Enter Verification Code'
                : 'Set Account Password'}
            </h1>
            <p className="text-xs text-[#9a9aa0]">
              {mode === 'login'
                ? 'Sign in to access your event dashboard'
                : signupStep === 1
                ? 'Enter your email address to receive a 6-digit verification code'
                : signupStep === 2
                ? `Enter the 6-digit code sent to ${email}`
                : 'Create a password to finalize your account registration'}
            </p>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="flex items-center gap-1 bg-[#222226] border border-[#2e2e34] rounded-xl p-1">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setError('');
                setSuccessMsg('');
                setSignupStep(1);
              }}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                mode === 'login' ? 'bg-[#2b2b30] text-white shadow-sm' : 'text-neutral-400 hover:text-white'
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
              }}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                mode === 'signup' ? 'bg-[#2b2b30] text-white shadow-sm' : 'text-neutral-400 hover:text-white'
              }`}
            >
              Sign Up
            </button>
          </div>



          {/* Feedback Messages */}
          {error && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs text-rose-400 text-center">
              {error}
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-neutral-800 border border-neutral-700 rounded-xl text-xs text-neutral-200 text-center flex items-center justify-center gap-1.5">
              <GoCheck className="w-4 h-4 text-neutral-400" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* FORMS */}
          {mode === 'login' ? (
            /* Normal Sign In Form */
            <form onSubmit={handleLoginSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <span className="text-[10px] uppercase font-mono text-neutral-400">Email Address</span>
                <div className="bg-[#222226] border border-[#2e2e34] focus-within:border-[#44444a] rounded-xl p-3 flex items-center gap-3">
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

              <div className="flex flex-col gap-1">
                <span className="text-[10px] uppercase font-mono text-neutral-400">Password</span>
                <div className="bg-[#222226] border border-[#2e2e34] focus-within:border-[#44444a] rounded-xl p-3 flex items-center gap-3">
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

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 bg-white text-black hover:bg-neutral-200 font-semibold text-sm rounded-xl transition-all shadow-xl cursor-pointer mt-2 flex items-center justify-center gap-2"
              >
                {isLoading ? <span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" /> : 'Sign In'}
              </button>
            </form>
          ) : (
            /* Multi-Step Sign Up Form */
            <>
              {signupStep === 1 && (
                /* Step 1: Type Email only */
                <form onSubmit={handleSendVerificationCode} className="flex flex-col gap-4">
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] uppercase font-mono text-neutral-400">Registered Email</span>
                    <div className="bg-[#222226] border border-[#2e2e34] focus-within:border-[#44444a] rounded-xl p-3 flex items-center gap-3">
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
                    className="w-full py-3.5 bg-[#222226] text-white border border-[#333339] hover:bg-[#2c2c32] font-semibold text-sm rounded-xl transition-all shadow-xl cursor-pointer mt-2 flex items-center justify-center gap-2"
                  >
                    {isLoading ? <span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" /> : 'Send Verification Code'}
                  </button>
                </form>
              )}

              {signupStep === 2 && (
                /* Step 2: Confirm 6-Digit OTP */
                <form onSubmit={handleVerifyOtp} className="flex flex-col gap-4">
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] uppercase font-mono text-neutral-400">6-Digit Verification Code</span>
                    <div className="bg-[#222226] border border-[#2e2e34] focus-within:border-[#44444a] rounded-xl p-3 flex items-center gap-3">
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
                      className="px-4 py-3 bg-[#222226] hover:bg-[#2a2a30] text-neutral-300 text-xs font-medium rounded-xl border border-[#2e2e34] transition-colors cursor-pointer flex items-center gap-1.5"
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
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] uppercase font-mono text-neutral-400">Full Name</span>
                    <div className="bg-[#222226] border border-[#2e2e34] focus-within:border-[#44444a] rounded-xl p-3 flex items-center gap-3">
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

                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] uppercase font-mono text-neutral-400">Create Password</span>
                    <div className="bg-[#222226] border border-[#2e2e34] focus-within:border-[#44444a] rounded-xl p-3 flex items-center gap-3">
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

                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] uppercase font-mono text-neutral-400">Confirm Password</span>
                    <div className="bg-[#222226] border border-[#2e2e34] focus-within:border-[#44444a] rounded-xl p-3 flex items-center gap-3">
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
                    {isLoading ? <span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" /> : 'Complete Sign Up'}
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
