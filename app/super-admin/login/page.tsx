'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { GoEye, GoEyeClosed, GoArrowRight, GoCheckCircle, GoAlert } from 'react-icons/go';

export default function SuperAdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (localStorage.getItem('super_admin_session') === 'true') {
      router.replace('/super-admin/dashboard');
    }
  }, [router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/super-admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Invalid credentials');
      }

      setSuccess(true);
      localStorage.setItem('super_admin_session', 'true');
      localStorage.setItem('super_admin_user', JSON.stringify(data.user));

      setTimeout(() => {
        router.push('/super-admin/dashboard');
      }, 600);
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0e] text-white flex items-center justify-center p-4 font-sans selection:bg-indigo-600 selection:text-white">
      {/* Super Admin Single-Color Card */}
      <div className="w-full max-w-md bg-[#121218] border border-[#22222e] rounded-2xl p-8 shadow-2xl">
        
        {/* Official Events Logo Centered */}
        <div className="flex flex-col items-center text-center mb-8">
          <img
            src="https://ik.imagekit.io/dypkhqxip/events%20loho"
            alt="Events Logo"
            className="h-12 w-auto object-contain mb-4"
            style={{ filter: 'brightness(0) invert(1)' }}
            draggable={false}
          />
          <h1 className="text-xl font-bold text-white tracking-tight">Super Admin Portal</h1>
          <p className="text-xs text-neutral-400 mt-1.5">Sign in to manage your system dashboard</p>
        </div>

        {/* Error message */}
        {error && (
          <div className="mb-5 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-400 flex items-center gap-2">
            <GoAlert className="w-4 h-4 shrink-0 text-red-400" />
            <span>{error}</span>
          </div>
        )}

        {/* Success message */}
        {success && (
          <div className="mb-5 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-xs text-emerald-400 flex items-center gap-2">
            <GoCheckCircle className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>Authenticated! Redirecting to Dashboard...</span>
          </div>
        )}

        {/* Clean Single Color Form */}
        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <div>
            <label className="block text-xs font-medium text-neutral-300 mb-1.5">Email Address</label>
            <input
              type="email"
              required
              placeholder="Enter super admin email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-[#181820] border border-[#2a2a38] focus:border-indigo-600 rounded-xl text-sm text-white placeholder-neutral-500 outline-none transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-300 mb-1.5">Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-3.5 pr-10 py-2.5 bg-[#181820] border border-[#2a2a38] focus:border-indigo-600 rounded-xl text-sm text-white placeholder-neutral-500 outline-none transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white transition-colors"
              >
                {showPassword ? <GoEyeClosed className="w-4 h-4" /> : <GoEye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Solid Single-Color Button (No Gradients) */}
          <button
            type="submit"
            disabled={loading || success}
            className="w-full mt-2 py-3 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 font-semibold text-sm rounded-xl text-white transition-all shadow-md shadow-indigo-600/20 flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Signing in...</span>
              </>
            ) : (
              <>
                <span>Sign In</span>
                <GoArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
