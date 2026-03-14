import type { Metadata } from 'next';
import { AdminLoginForm } from '@/components/admin/AdminLoginForm';

export const metadata: Metadata = {
  title: '관리자 로그인 | 마을살림/나라살림',
  robots: 'noindex, nofollow',
};

export default function AdminPage() {
  return (
    <div className="min-h-[calc(100vh-3.5rem)] flex items-center justify-center">
      <AdminLoginForm />
    </div>
  );
}
