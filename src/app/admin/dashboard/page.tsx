import type { Metadata } from 'next';
import { AdminDashboard } from '@/components/admin/AdminDashboard';

export const metadata: Metadata = {
  title: '분석 대시보드 | 마을살림/나라살림',
  robots: 'noindex, nofollow',
};

export default function AdminDashboardPage() {
  return <AdminDashboard />;
}
