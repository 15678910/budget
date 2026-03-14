import { RegisterForm } from '@/components/auth/RegisterForm';

export const metadata = {
  title: '회원가입 | 마을살림/나라살림',
  robots: 'noindex, nofollow',
};

export default function RegisterPage() {
  return (
    <div className="min-h-[calc(100vh-3.5rem)] flex items-center justify-center py-8">
      <RegisterForm />
    </div>
  );
}
