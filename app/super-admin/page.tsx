'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function SuperAdminIndexPage() {
  const router = useRouter();

  useEffect(() => {
    const isAuth = localStorage.getItem('super_admin_session');
    if (isAuth === 'true') {
      router.replace('/super-admin/dashboard');
    } else {
      router.replace('/super-admin/login');
    }
  }, [router]);

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-white flex items-center justify-center font-sans">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        <span className="text-sm text-neutral-400 tracking-wider">Verifying Super Admin Access...</span>
      </div>
    </div>
  );
}
