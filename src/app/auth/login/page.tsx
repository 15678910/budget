import { LoginForm } from '@/components/auth/LoginForm';

export const metadata = {
  title: '로그인 | 마을살림/나라살림',
  robots: 'noindex, nofollow',
};

export default function LoginPage() {
  return (
    <div className="min-h-[calc(100vh-3.5rem)] flex items-center justify-center">
      <LoginForm />
    </div>
  );
}
