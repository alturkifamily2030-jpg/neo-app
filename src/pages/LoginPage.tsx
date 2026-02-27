import { useState } from 'react';
import { Eye, EyeOff, X, CheckCircle2 } from 'lucide-react';

interface LoginPageProps {
  onLogin: () => void;
}

const DEMO_EMAIL = 'demo@neo.app';
const DEMO_PASSWORD = 'demo123';
const VALID_EMAILS = [DEMO_EMAIL, 'admin@hotel.com', 'john@hotel.com', 'sarah@hotel.com'];

export default function LoginPage({ onLogin }: LoginPageProps) {
  const [loginType, setLoginType] = useState<'email' | 'phone'>('email');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showForgot, setShowForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSent, setForgotSent] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const identifier = loginType === 'email' ? email : phone;
    if (!identifier || !password) {
      setError('Please enter your ' + (loginType === 'email' ? 'email' : 'phone number') + ' and password');
      return;
    }

    if (loginType === 'email') {
      const isValid = VALID_EMAILS.includes(email.trim().toLowerCase()) && password === DEMO_PASSWORD;
      if (!isValid) {
        setError('Invalid email or password. Use demo@neo.app / demo123 to log in.');
        return;
      }
    }

    setError('');
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      onLogin();
    }, 1200);
  };

  const handleSocialLogin = (provider: string) => {
    setError(`${provider} login is not available in this demo. Please use email login.`);
  };

  const handleForgotSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail.trim()) return;
    setForgotSent(true);
  };

  return (
    <div className="min-h-screen flex">
      {/* Left panel */}
      <div className="flex-1 flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-sm">
          {/* Logo */}
          <div className="flex items-center gap-2 mb-8">
            <span className="w-3.5 h-3.5 rounded-full bg-red-500"></span>
            <span className="w-3.5 h-3.5 rounded-full bg-yellow-400"></span>
            <span className="w-3.5 h-3.5 rounded-full bg-green-500"></span>
            <span className="ml-1 text-xl font-bold text-gray-800">neo</span>
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-2">Sign in</h1>

          {/* Demo credentials hint */}
          <div className="mb-5 bg-blue-50 border border-blue-100 rounded-xl px-4 py-3">
            <p className="text-xs font-semibold text-blue-700 mb-1">Demo credentials</p>
            <p className="text-xs text-blue-600 font-mono">Email: demo@neo.app</p>
            <p className="text-xs text-blue-600 font-mono">Password: demo123</p>
            <button
              type="button"
              onClick={() => { setEmail(DEMO_EMAIL); setPassword(DEMO_PASSWORD); setLoginType('email'); }}
              className="mt-2 text-xs text-blue-700 font-medium hover:underline"
            >
              Fill in automatically →
            </button>
          </div>

          {/* Login type toggle */}
          <div className="mb-5">
            <p className="text-sm text-gray-500 mb-2">Login type</p>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="loginType"
                  checked={loginType === 'email'}
                  onChange={() => setLoginType('email')}
                  className="accent-blue-600"
                />
                <span className="text-sm text-gray-700">Email</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="loginType"
                  checked={loginType === 'phone'}
                  onChange={() => setLoginType('phone')}
                  className="accent-blue-600"
                />
                <span className="text-sm text-gray-700">Phone Number</span>
              </label>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {loginType === 'email' ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm
                    focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                <input
                  type="tel"
                  placeholder="Enter your phone number"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm
                    focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm pr-10
                    focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(s => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className="text-right">
              <button
                type="button"
                onClick={() => { setShowForgot(true); setForgotSent(false); setForgotEmail(''); }}
                className="text-xs text-blue-600 hover:underline"
              >
                Forgot password?
              </button>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-600">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-700 hover:bg-blue-800 text-white font-medium rounded-lg py-2.5 text-sm
                transition-colors disabled:opacity-60"
            >
              {loading ? 'Signing in...' : 'Login'}
            </button>
          </form>

          <div className="mt-6">
            <div className="relative flex items-center gap-3">
              <div className="flex-1 h-px bg-gray-200"></div>
              <span className="text-xs text-gray-400">OR continue with</span>
              <div className="flex-1 h-px bg-gray-200"></div>
            </div>
            <div className="flex justify-center gap-4 mt-4">
              {[{ label: 'G', name: 'Google' }, { label: 'f', name: 'Facebook' }, { label: 'in', name: 'LinkedIn' }].map(p => (
                <button
                  key={p.label}
                  onClick={() => handleSocialLogin(p.name)}
                  className="w-10 h-10 border border-gray-200 rounded-lg flex items-center justify-center
                    text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <p className="mt-6 text-xs text-center text-gray-400">
            Having trouble logging in?{' '}
            <a href="#" className="text-blue-600 hover:underline">HelpHub</a>
          </p>
        </div>
      </div>

      {/* Right panel - decorative */}
      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-gray-100 to-gray-200 items-center justify-center relative overflow-hidden">
        <div className="text-center z-10">
          <div className="flex items-center justify-center gap-2 mb-4">
            <span className="w-4 h-4 rounded-full bg-red-400 opacity-80"></span>
            <span className="w-4 h-4 rounded-full bg-yellow-300 opacity-80"></span>
            <span className="w-4 h-4 rounded-full bg-green-400 opacity-80"></span>
          </div>
          <p className="text-3xl font-bold text-gray-700">NEO</p>
          <p className="text-gray-500 mt-2">Facility Management Platform</p>
        </div>
        <div className="absolute -bottom-16 -right-16 w-64 h-64 rounded-full bg-blue-100 opacity-40"></div>
        <div className="absolute -top-10 -left-10 w-48 h-48 rounded-full bg-green-100 opacity-40"></div>
      </div>

      {/* Forgot Password Modal */}
      {showForgot && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
            {!forgotSent ? (
              <>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base font-semibold text-gray-900">Reset Password</h3>
                  <button onClick={() => setShowForgot(false)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400">
                    <X size={18} />
                  </button>
                </div>
                <p className="text-sm text-gray-500 mb-4">
                  Enter your email address and we'll send you a reset link.
                </p>
                <form onSubmit={handleForgotSubmit} className="space-y-3">
                  <input
                    type="email"
                    placeholder="your@email.com"
                    value={forgotEmail}
                    onChange={e => setForgotEmail(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                  <button
                    type="submit"
                    className="w-full bg-blue-700 hover:bg-blue-800 text-white rounded-lg py-2.5 text-sm font-medium"
                  >
                    Send Reset Link
                  </button>
                </form>
              </>
            ) : (
              <div className="text-center py-4">
                <CheckCircle2 size={40} className="text-green-500 mx-auto mb-3" />
                <h3 className="text-base font-semibold text-gray-900 mb-2">Check your email</h3>
                <p className="text-sm text-gray-500 mb-4">
                  We've sent a password reset link to <strong>{forgotEmail}</strong>.
                  Check your inbox (and spam folder).
                </p>
                <p className="text-xs text-amber-600 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2 mb-4">
                  This is a demo — no actual email was sent.
                </p>
                <button
                  onClick={() => setShowForgot(false)}
                  className="text-sm text-blue-600 hover:underline font-medium"
                >
                  Back to login
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
