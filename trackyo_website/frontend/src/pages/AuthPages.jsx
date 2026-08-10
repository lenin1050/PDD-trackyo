import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Sparkles, Mail, Lock, User, Phone, DollarSign, Palette, Eye, EyeOff } from 'lucide-react';

const InputField = ({ label, icon: Icon, type = 'text', name, placeholder, value, onChange, required, rightElement, showLabel = true }) => (
  <div className="flex flex-col gap-1.5">
    {showLabel && (
      <label className="text-[10px] font-bold uppercase tracking-widest pl-1" style={{ color: 'var(--text-secondary)' }}>
        {label}
      </label>
    )}
    <div className="relative flex items-center">
      <Icon
        className="absolute left-3 w-4 h-4 pointer-events-none z-10 flex-shrink-0"
        style={{ color: 'var(--text-secondary)' }}
      />
      <input
        type={type}
        name={name}
        required={required}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className="theme-input w-full text-sm"
        style={{ paddingLeft: '2.5rem', paddingRight: rightElement ? '2.75rem' : '1rem' }}
      />
      {rightElement && (
        <div className="absolute right-3 flex items-center z-10">
          {rightElement}
        </div>
      )}
    </div>
  </div>
);

const SelectField = ({ label, icon: Icon, name, value, onChange, children }) => (
  <div className="flex flex-col gap-1.5">
    <label className="text-[10px] font-bold uppercase tracking-widest pl-1" style={{ color: 'var(--text-secondary)' }}>
      {label}
    </label>
    <div className="relative flex items-center">
      <Icon
        className="absolute left-3 w-4 h-4 pointer-events-none z-10 flex-shrink-0"
        style={{ color: 'var(--text-secondary)' }}
      />
      <select
        name={name}
        value={value}
        onChange={onChange}
        className="theme-input w-full text-xs appearance-none"
        style={{ paddingLeft: '2.5rem', paddingRight: '1rem' }}
      >
        {children}
      </select>
    </div>
  </div>
);

const AuthPages = ({ showToast }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const { login, register, forgotPassword } = useAuth();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    mobile: '',
    preferredCurrency: 'INR',
    themePreference: 'dark',
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (isLogin) {
      if (!formData.email || !formData.password) {
        showToast('Please fill all required fields', 'warning');
        setLoading(false);
        return;
      }
      const res = await login(formData.email, formData.password);
      if (res.success) {
        showToast('Logged in successfully! Welcome to Trackyo.', 'success');
      } else {
        showToast(res.message, 'danger');
      }
    } else {
      if (!formData.name || !formData.email || !formData.password || !formData.mobile) {
        showToast('Please fill all required fields', 'warning');
        setLoading(false);
        return;
      }
      const res = await register(
        formData.name,
        formData.email,
        formData.password,
        formData.mobile,
        formData.preferredCurrency,
        formData.themePreference
      );
      if (res.success) {
        showToast('Account registered successfully!', 'success');
      } else {
        showToast(res.message, 'danger');
      }
    }
    setLoading(false);
  };

  const handleForgot = async () => {
    if (!formData.email) {
      showToast('Please enter your email address first', 'warning');
      return;
    }
    const res = await forgotPassword(formData.email);
    showToast(res.message, res.success ? 'success' : 'danger');
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center relative overflow-auto select-none"
      style={{ background: 'var(--background)', padding: '2rem 1rem' }}
    >
      {/* Background glowing orbs */}
      <div
        className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full pointer-events-none"
        style={{ background: 'rgba(99,102,241,0.08)', filter: 'blur(80px)' }}
      />
      <div
        className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full pointer-events-none"
        style={{ background: 'rgba(16,185,129,0.07)', filter: 'blur(80px)' }}
      />

      {/* Auth Card */}
      <div
        className="glass-panel rounded-2xl relative z-10 w-full"
        style={{ maxWidth: '440px', padding: '2rem' }}
      >
        {/* Brand Banner */}
        <div className="flex flex-col items-center text-center mb-7">
          <div
            className="flex items-center justify-center w-14 h-14 rounded-2xl mb-3 shadow-lg"
            style={{ background: 'var(--primary-accent)' }}
          >
            <Sparkles className="w-7 h-7 text-white" style={{ animation: 'spin 6s linear infinite' }} />
          </div>
          <h2
            className="text-2xl font-extrabold tracking-tight"
            style={{
              background: 'linear-gradient(to right, var(--primary-accent), var(--accent-color))',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            {isLogin ? 'Welcome Back' : 'Create Account'}
          </h2>
          <p className="text-xs font-bold tracking-widest uppercase mt-1.5" style={{ color: 'var(--text-secondary)' }}>
            {isLogin ? 'Track Smart. Spend Wise. That\'s Trackyo.' : 'Start Automated AI Expense Tracking'}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleAuthSubmit} className="flex flex-col gap-4">

          {/* Registration-only fields */}
          {!isLogin && (
            <>
              <InputField
                label="Full Name*"
                icon={User}
                name="name"
                placeholder="Rahul Sharma"
                value={formData.name}
                onChange={handleInputChange}
                required
              />
              <InputField
                label="Mobile Number*"
                icon={Phone}
                type="tel"
                name="mobile"
                placeholder="9876543210"
                value={formData.mobile}
                onChange={handleInputChange}
                required
              />
            </>
          )}

          {/* Email */}
          <InputField
            label="Email Address*"
            icon={Mail}
            type="email"
            name="email"
            placeholder="Email Address"
            value={formData.email}
            onChange={handleInputChange}
            required
            showLabel={!isLogin}
          />

          {/* Password */}
          <InputField
            label="Password*"
            icon={Lock}
            showLabel={!isLogin}
            type={showPassword ? 'text' : 'password'}
            name="password"
            placeholder="••••••••"
            value={formData.password}
            onChange={handleInputChange}
            required
            rightElement={
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="flex items-center justify-center transition-all"
                style={{ color: 'var(--text-secondary)' }}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            }
          />

          {/* Currency & Theme — Register only */}
          {!isLogin && (
            <div className="grid grid-cols-2 gap-3">
              <SelectField label="Preferred Currency" icon={DollarSign} name="preferredCurrency" value={formData.preferredCurrency} onChange={handleInputChange}>
                <option value="INR" className="bg-slate-900 text-white">INR (Rs.)</option>
                <option value="USD" className="bg-slate-900 text-white">USD ($)</option>
                <option value="EUR" className="bg-slate-900 text-white">EUR (€)</option>
                <option value="GBP" className="bg-slate-900 text-white">GBP (£)</option>
              </SelectField>
              <SelectField label="Theme Style" icon={Palette} name="themePreference" value={formData.themePreference} onChange={handleInputChange}>
                <option value="dark" className="bg-slate-900 text-white">Dark Mode</option>
                <option value="light" className="bg-slate-900 text-white">Light Mode</option>
                <option value="neon" className="bg-slate-900 text-white">Cyber Neon</option>
                <option value="minimal" className="bg-slate-900 text-white">Mono Minimal</option>
              </SelectField>
            </div>
          )}

          {/* Forgot Password */}
          {isLogin && (
            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleForgot}
                className="text-xs font-bold transition-all hover:underline"
                style={{ color: 'var(--primary-accent)' }}
              >
                Forgot Password?
              </button>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl text-white font-bold text-sm tracking-wide transition-all flex items-center justify-center gap-2 mt-1"
            style={{
              background: 'var(--primary-accent)',
              boxShadow: '0 0 20px rgba(99,102,241,0.4)',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = 'var(--primary-hover)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'var(--primary-accent)')}
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <span>{isLogin ? 'Sign In Securely' : 'Register Account'}</span>
            )}
          </button>

          {/* Toggle Login/Register */}
          <div
            className="text-center pt-4 text-xs border-t"
            style={{ color: 'var(--text-secondary)', borderColor: 'var(--card-border)' }}
          >
            <span>{isLogin ? "Don't have an account? " : 'Already registered? '}</span>
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="font-bold hover:underline transition-all"
              style={{ color: 'var(--primary-accent)' }}
            >
              {isLogin ? 'Create Account' : 'Sign In'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};

export default AuthPages;
