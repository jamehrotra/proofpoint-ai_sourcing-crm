import { LoginForm } from '@/components/auth/LoginForm';

export default function LoginPage() {
  return (
    <main className="min-h-[calc(100vh-56px)] flex items-center justify-center px-8 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8">
          <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#6b1f2a] mb-3">
            Proofpoint Capital · Sign In
          </div>
          <h1 className="font-serif text-[40px] font-normal leading-[1.05] tracking-[-0.02em] text-[#1a1816]">
            Signal <em className="font-light italic text-[#6b1f2a]">Scout</em>
          </h1>
          <p className="mt-4 text-[14px] text-[#6b6358] leading-relaxed">
            Sign in to continue to the sourcing pipeline. Demo credentials are listed in the README.
          </p>
        </div>

        <div className="border border-[#e8e2d4] bg-white p-8">
          <LoginForm />
        </div>

        <p className="mt-6 font-mono text-[10px] uppercase tracking-[0.1em] text-[#908874] text-center">
          Prototype build · Mock authentication
        </p>
      </div>
    </main>
  );
}
