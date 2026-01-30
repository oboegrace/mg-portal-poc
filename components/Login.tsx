
import React, { useState, useEffect } from 'react';
import { Mail, Phone, Lock, Eye, EyeOff, ArrowRight, Loader2, ChevronDown, Check, X, ShieldAlert, KeyRound, Smartphone } from 'lucide-react';
import { CellLeader } from '../types';

interface LoginProps {
  onLoginSuccess: (leader: CellLeader) => void;
  leaders: CellLeader[];
}

const COUNTRY_CODES = [
  { code: '+852', label: 'HK', flag: '🇭🇰' },
  { code: '+86', label: 'CN', flag: '🇨🇳' },
  { code: '+886', label: 'TW', flag: '🇹🇼' },
  { code: '+65', label: 'SG', flag: '🇸🇬' },
  { code: '+1', label: 'US', flag: '🇺🇸' },
  { code: '+44', label: 'UK', flag: '🇬🇧' },
];

type ForgotStep = 'identity' | 'otp' | 'reset' | 'success';

const Login: React.FC<LoginProps> = ({ onLoginSuccess, leaders }) => {
  const [authMode, setAuthMode] = useState<'email' | 'phone'>('email');
  const [identifier, setIdentifier] = useState(''); 
  const [password, setPassword] = useState('');
  const [countryCode, setCountryCode] = useState('+852');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Forgot Password Flow States
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotStep, setForgotStep] = useState<ForgotStep>('identity');
  const [forgotMode, setForgotMode] = useState<'email' | 'phone'>('email');
  const [forgotIdentifier, setForgotIdentifier] = useState('');
  const [forgotCountryCode, setForgotCountryCode] = useState('+852');
  const [forgotError, setForgotError] = useState<string | null>(null);
  const [forgotLoading, setForgotLoading] = useState(false);
  const [otpValue, setOtpValue] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    setTimeout(() => {
      const leader = leaders.find((l) => {
        const matchesIdentifier = authMode === 'email' 
            ? l.email === identifier 
            : l.phoneNumber === identifier;
        return matchesIdentifier && l.password === password;
      });

      if (leader) {
        if (rememberMe) {
          localStorage.setItem('remembered_user', JSON.stringify(leader));
        }
        onLoginSuccess(leader);
      } else {
        const typeLabel = authMode === 'email' ? 'email' : 'phone number';
        setError(`Invalid ${typeLabel} or password.`);
        setIsLoading(false);
      }
    }, 1200);
  };

  const handleForgotIdentitySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError(null);
    setForgotLoading(true);

    setTimeout(() => {
      const accountExists = leaders.some(l => 
        forgotMode === 'email' 
          ? l.email === forgotIdentifier 
          : l.phoneNumber === forgotIdentifier
      );

      if (!accountExists) {
        setForgotError("沒有這個帳號，請輸入其他email/phone再嘗試");
        setForgotLoading(false);
      } else {
        setForgotLoading(false);
        setForgotStep('otp');
      }
    }, 1000);
  };

  const handleOtpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (otpValue.length < 4) {
      setForgotError("請輸入有效的驗證碼");
      return;
    }
    setForgotLoading(true);
    setTimeout(() => {
      setForgotLoading(false);
      setForgotStep('reset');
      setForgotError(null);
    }, 800);
  };

  const handleResetPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      setForgotError("新密碼必須至少為 6 個字元");
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setForgotError("兩次輸入的密碼不一致");
      return;
    }
    setForgotLoading(true);
    setTimeout(() => {
      // In a real app, we'd call an API here
      setForgotLoading(false);
      setForgotStep('success');
    }, 1200);
  };

  const closeForgotModal = () => {
    setShowForgotModal(false);
    setForgotStep('identity');
    setForgotIdentifier('');
    setForgotError(null);
    setOtpValue('');
    setNewPassword('');
    setConfirmNewPassword('');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-[#E85C10] rounded-2xl shadow-lg shadow-orange-200 mb-4 animate-in zoom-in duration-500">
            <span className="text-white font-serif italic font-bold text-3xl">An</span>
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Shepherd View</h1>
          <p className="text-slate-500 mt-2">Connect, Lead, and Grow Together</p>
        </div>

        <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 p-8 border border-slate-100 animate-in slide-in-from-bottom-6 duration-700">
          <div className="flex p-1 bg-slate-100 rounded-xl mb-8 relative">
              <div 
                  className={`absolute top-1 bottom-1 w-[calc(50%-4px)] bg-white rounded-lg shadow-sm transition-transform duration-300 ease-out ${authMode === 'phone' ? 'translate-x-full' : 'translate-x-0'}`}
              />
              <button 
                  type="button"
                  onClick={() => { setAuthMode('email'); setIdentifier(''); setError(null); }}
                  className={`flex-1 py-2 text-sm font-bold z-10 transition-colors ${authMode === 'email' ? 'text-orange-600' : 'text-slate-500'}`}
              >
                  Email
              </button>
              <button 
                  type="button"
                  onClick={() => { setAuthMode('phone'); setIdentifier(''); setError(null); }}
                  className={`flex-1 py-2 text-sm font-bold z-10 transition-colors ${authMode === 'phone' ? 'text-orange-600' : 'text-slate-500'}`}
              >
                  Phone
              </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">
                  {authMode === 'email' ? 'Email Address' : 'Phone Number'}
              </label>
              
              <div className="relative group">
                {authMode === 'email' ? (
                    <>
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-orange-500 transition-colors">
                          <Mail className="w-5 h-5" />
                        </div>
                        <input
                          type="email"
                          required
                          placeholder="name@example.com"
                          value={identifier}
                          onChange={(e) => setIdentifier(e.target.value)}
                          className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all text-slate-900 font-medium placeholder:text-slate-400"
                        />
                    </>
                ) : (
                    <div className="flex">
                        <div className="relative">
                            <select 
                                value={countryCode}
                                onChange={(e) => setCountryCode(e.target.value)}
                                className="appearance-none pl-4 pr-10 py-3.5 bg-slate-100 border border-slate-200 border-r-0 rounded-l-2xl focus:ring-0 focus:outline-none text-sm font-bold text-slate-700"
                            >
                                {COUNTRY_CODES.map(c => (
                                    <option key={c.code} value={c.code}>{c.flag} {c.code}</option>
                                ))}
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                        </div>
                        <div className="relative flex-1 group">
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-orange-500 transition-colors">
                              <Phone className="w-5 h-5" />
                            </div>
                            <input
                              type="tel"
                              required
                              placeholder="1234 5678"
                              value={identifier}
                              onChange={(e) => setIdentifier(e.target.value)}
                              className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-r-2xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all text-slate-900 font-medium placeholder:text-slate-400"
                            />
                        </div>
                    </div>
                )}
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-sm font-bold text-slate-700">Password</label>
              </div>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-orange-500 transition-colors">
                  <Lock className="w-5 h-5" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-12 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all text-slate-900 font-medium placeholder:text-slate-400"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer group select-none">
                    <div className="relative">
                        <input 
                            type="checkbox" 
                            className="peer sr-only"
                            checked={rememberMe}
                            onChange={(e) => setRememberMe(e.target.checked)}
                        />
                        <div className="w-5 h-5 border-2 border-slate-200 rounded-md bg-white peer-checked:bg-orange-500 peer-checked:border-orange-500 transition-all flex items-center justify-center">
                            <Check className={`w-3.5 h-3.5 text-white transition-transform ${rememberMe ? 'scale-100' : 'scale-0'}`} />
                        </div>
                    </div>
                    <span className="text-sm font-medium text-slate-600 group-hover:text-slate-900 transition-colors">Remember Me</span>
                </label>
                <button type="button" onClick={() => setShowForgotModal(true)} className="text-xs font-bold text-orange-600 hover:text-orange-700">
                  Forgot Password?
                </button>
            </div>

            {error && (
              <div className="p-3.5 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm font-medium animate-in fade-in slide-in-from-top-2 text-center">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className={`
                w-full py-4 bg-[#E85C10] text-white rounded-2xl font-bold text-lg shadow-lg shadow-orange-200/50 
                flex items-center justify-center gap-3 transition-all active:scale-[0.98]
                ${isLoading ? 'opacity-80 cursor-not-allowed' : 'hover:bg-orange-600 hover:shadow-orange-300/50'}
              `}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Authenticating...
                </>
              ) : (
                <>
                  Sign In
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 pt-8 border-t border-slate-100 text-center">
            <p className="text-slate-500 text-sm">
              New leader?{' '}
              <button className="font-bold text-orange-600 hover:text-orange-700">Request Access</button>
            </p>
          </div>
        </div>
        
        <p className="mt-8 text-center text-slate-400 text-xs font-medium">
          &copy; 2024 Shepherd View. Powered by 611 BIC.
        </p>
      </div>

      {/* Advanced Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300" onClick={closeForgotModal} />
            <div className="relative bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
                
                {/* Close Button */}
                <button onClick={closeForgotModal} className="absolute top-6 right-6 p-2 bg-slate-50 hover:bg-slate-100 rounded-full text-slate-400 transition-colors z-10">
                    <X className="w-5 h-5" />
                </button>

                <div className="p-8 pt-10">
                    {/* Progress Indicator */}
                    <div className="flex gap-2 mb-8 justify-center">
                        {(['identity', 'otp', 'reset'] as const).map((s, idx) => (
                             <div key={s} className={`h-1.5 rounded-full transition-all duration-500 ${
                                 (forgotStep === s || (idx === 0 && forgotStep !== 'identity') || (idx === 1 && forgotStep === 'reset')) 
                                 ? 'w-8 bg-orange-500' : 'w-2 bg-slate-100'
                             }`} />
                        ))}
                    </div>

                    {/* Step 1: Identify Account */}
                    {forgotStep === 'identity' && (
                        <div className="animate-in fade-in slide-in-from-bottom-4">
                            <div className="text-center mb-8">
                                <div className="w-16 h-16 bg-orange-50 text-orange-600 rounded-3xl flex items-center justify-center mx-auto mb-4">
                                    <Smartphone className="w-8 h-8" />
                                </div>
                                <h3 className="text-2xl font-black text-slate-900">Reset Password</h3>
                                <p className="text-slate-500 text-sm mt-2">Choose how you'd like to verify your account</p>
                            </div>

                            <div className="flex p-1 bg-slate-50 rounded-2xl mb-6 border border-slate-100">
                                <button 
                                    onClick={() => { setForgotMode('email'); setForgotIdentifier(''); setForgotError(null); }}
                                    className={`flex-1 py-3 text-sm font-black rounded-xl transition-all ${forgotMode === 'email' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400'}`}
                                >
                                    Email
                                </button>
                                <button 
                                    onClick={() => { setForgotMode('phone'); setForgotIdentifier(''); setForgotError(null); }}
                                    className={`flex-1 py-3 text-sm font-black rounded-xl transition-all ${forgotMode === 'phone' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400'}`}
                                >
                                    Phone
                                </button>
                            </div>

                            <form onSubmit={handleForgotIdentitySubmit} className="space-y-6">
                                <div className="relative group">
                                    {forgotMode === 'email' ? (
                                        <input 
                                            type="email" required placeholder="Enter your email" value={forgotIdentifier}
                                            onChange={(e) => setForgotIdentifier(e.target.value)}
                                            className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 outline-none font-bold text-slate-800 transition-all text-sm"
                                        />
                                    ) : (
                                        <div className="flex gap-2">
                                            <div className="relative">
                                                <select value={forgotCountryCode} onChange={(e) => setForgotCountryCode(e.target.value)}
                                                    className="appearance-none pl-4 pr-10 py-4 bg-slate-100 border border-slate-200 rounded-2xl focus:ring-0 text-sm font-bold text-slate-700 h-[54px]">
                                                    {COUNTRY_CODES.map(c => <option key={c.code} value={c.code}>{c.flag} {c.code}</option>)}
                                                </select>
                                                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                                            </div>
                                            <input 
                                                type="tel" required placeholder="1234 5678" value={forgotIdentifier}
                                                onChange={(e) => setForgotIdentifier(e.target.value)}
                                                className="flex-1 p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 outline-none font-bold text-slate-800 transition-all text-sm h-[54px]"
                                            />
                                        </div>
                                    )}
                                </div>

                                {forgotError && (
                                    <div className="p-4 bg-red-50 border border-red-100 rounded-2xl text-red-600 text-xs font-black flex gap-2 items-center animate-in shake">
                                        <ShieldAlert className="w-4 h-4 flex-shrink-0" />
                                        {forgotError}
                                    </div>
                                )}

                                <button 
                                    disabled={forgotLoading}
                                    className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-sm flex items-center justify-center gap-2 hover:bg-slate-800 transition-all active:scale-95 disabled:opacity-50"
                                >
                                    {forgotLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Verify Account"}
                                </button>
                            </form>
                        </div>
                    )}

                    {/* Step 2: OTP Verification */}
                    {forgotStep === 'otp' && (
                        <div className="animate-in fade-in slide-in-from-bottom-4">
                             <div className="text-center mb-8">
                                <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-3xl flex items-center justify-center mx-auto mb-4">
                                    <ShieldAlert className="w-8 h-8" />
                                </div>
                                <h3 className="text-2xl font-black text-slate-900">OTP Verification</h3>
                                <p className="text-slate-500 text-sm mt-2 px-4">We've sent a 6-digit code to <br/><span className="text-slate-900 font-bold">{forgotIdentifier}</span></p>
                            </div>

                            <form onSubmit={handleOtpSubmit} className="space-y-6">
                                <div className="flex justify-center">
                                    <input 
                                        type="text" maxLength={6} required placeholder="000000"
                                        value={otpValue} onChange={(e) => setOtpValue(e.target.value)}
                                        className="w-48 p-4 bg-slate-100 border border-slate-200 rounded-2xl text-center font-black text-3xl tracking-[0.2em] outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all placeholder:text-slate-300"
                                    />
                                </div>

                                {forgotError && (
                                    <div className="p-4 bg-red-50 border border-red-100 rounded-2xl text-red-600 text-xs font-black text-center">
                                        {forgotError}
                                    </div>
                                )}

                                <button 
                                    disabled={forgotLoading}
                                    className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-sm flex items-center justify-center gap-2 hover:bg-slate-800 transition-all active:scale-95 disabled:opacity-50"
                                >
                                    {forgotLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Confirm Code"}
                                </button>
                                
                                <p className="text-center text-xs font-bold text-slate-400">
                                    Didn't receive code? <button type="button" className="text-blue-600">Resend</button>
                                </p>
                            </form>
                        </div>
                    )}

                    {/* Step 3: Reset Password */}
                    {forgotStep === 'reset' && (
                        <div className="animate-in fade-in slide-in-from-bottom-4">
                            <div className="text-center mb-8">
                                <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-3xl flex items-center justify-center mx-auto mb-4">
                                    <KeyRound className="w-8 h-8" />
                                </div>
                                <h3 className="text-2xl font-black text-slate-900">Create New Password</h3>
                                <p className="text-slate-500 text-sm mt-2">Enter at least 6 characters</p>
                            </div>

                            <form onSubmit={handleResetPassword} className="space-y-5">
                                <div className="relative">
                                    <input 
                                        type={showNewPassword ? 'text' : 'password'} required placeholder="New Password"
                                        value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
                                        className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none font-bold text-slate-800 transition-all text-sm"
                                    />
                                    <button type="button" onClick={() => setShowNewPassword(!showNewPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">
                                        {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                                <input 
                                    type={showNewPassword ? 'text' : 'password'} required placeholder="Confirm New Password"
                                    value={confirmNewPassword} onChange={(e) => setConfirmNewPassword(e.target.value)}
                                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none font-bold text-slate-800 transition-all text-sm"
                                />

                                {forgotError && (
                                    <div className="p-4 bg-red-50 border border-red-100 rounded-2xl text-red-600 text-xs font-black text-center">
                                        {forgotError}
                                    </div>
                                )}

                                <button 
                                    disabled={forgotLoading}
                                    className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-black text-sm flex items-center justify-center gap-2 hover:bg-emerald-700 transition-all active:scale-95 disabled:opacity-50 shadow-lg shadow-emerald-100"
                                >
                                    {forgotLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Reset & Log In"}
                                </button>
                            </form>
                        </div>
                    )}

                    {/* Step 4: Success */}
                    {forgotStep === 'success' && (
                        <div className="text-center animate-in zoom-in-95 duration-500">
                            <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
                                <Check className="w-10 h-10 stroke-[3]" />
                            </div>
                            <h3 className="text-2xl font-black text-slate-900 mb-2">Password Updated!</h3>
                            <p className="text-slate-500 font-medium mb-8">Your security is our priority. You can now log in with your new password.</p>
                            <button 
                                onClick={closeForgotModal}
                                className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-sm hover:bg-slate-800 transition-all active:scale-95"
                            >
                                Back to Login
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default Login;
