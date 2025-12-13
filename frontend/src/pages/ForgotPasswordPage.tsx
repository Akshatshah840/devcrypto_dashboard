import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { FiMail, FiLock, FiEye, FiEyeOff, FiGithub, FiTrendingUp, FiArrowLeft } from 'react-icons/fi';

const ForgotPasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const { forgotPassword, confirmForgotPassword, isLoading, error, clearError } = useAuth();

  const [step, setStep] = useState<'request' | 'reset'>('request');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Clear errors when inputs change
  useEffect(() => {
    if (error) clearError();
    if (localError) setLocalError('');
    if (successMessage) setSuccessMessage('');
  }, [email, code, newPassword, confirmPassword]);

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError('');

    if (!email.trim()) {
      setLocalError('Email is required');
      return;
    }

    const success = await forgotPassword(email);
    if (success) {
      setStep('reset');
      setSuccessMessage('Verification code sent to your email');
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError('');

    if (!code.trim()) {
      setLocalError('Verification code is required');
      return;
    }
    if (newPassword.length < 8) {
      setLocalError('Password must be at least 8 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      setLocalError('Passwords do not match');
      return;
    }

    const success = await confirmForgotPassword(email, code, newPassword);
    if (success) {
      navigate('/login', { state: { message: 'Password reset successful! Please sign in.' } });
    }
  };

  const displayError = localError || error;

  return (
    <div className="min-h-screen bg-base-200 flex items-center justify-center p-4">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-secondary/20 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Logo/Brand */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-primary/90 flex items-center justify-center shadow-lg shadow-primary/30">
              <FiGithub className="w-6 h-6 text-primary-content" />
            </div>
            <FiTrendingUp className="w-6 h-6 text-secondary" />
            <div className="w-12 h-12 rounded-xl bg-secondary/90 flex items-center justify-center shadow-lg shadow-secondary/30">
              <span className="text-xl">₿</span>
            </div>
          </div>
          <h1 className="text-2xl font-bold text-base-content">DevCrypto Analytics</h1>
        </div>

        {/* Card */}
        <div className="glass-card rounded-2xl p-8">
          {/* Back Link */}
          <Link
            to="/login"
            className="inline-flex items-center gap-2 text-sm text-base-content/60 hover:text-base-content mb-6 transition-colors"
          >
            <FiArrowLeft className="w-4 h-4" />
            Back to login
          </Link>

          {step === 'request' ? (
            <>
              <h2 className="text-xl font-semibold text-base-content mb-2">Forgot password?</h2>
              <p className="text-base-content/60 text-sm mb-6">
                Enter your email and we'll send you a code to reset your password.
              </p>

              <form onSubmit={handleRequestReset} className="space-y-5">
                {/* Email Input */}
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-medium">Email</span>
                  </label>
                  <div className="relative">
                    <FiMail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-base-content/40" />
                    <input
                      type="email"
                      placeholder="you@example.com"
                      className="input input-bordered w-full pl-10 bg-base-200/50 focus:bg-base-100"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={isLoading}
                      autoComplete="email"
                    />
                  </div>
                </div>

                {/* Error Message */}
                {displayError && (
                  <div className="alert alert-error text-sm py-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-5 w-5" fill="none" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>{displayError}</span>
                  </div>
                )}

                {/* Submit Button */}
                <button
                  type="submit"
                  className={`btn btn-primary w-full ${isLoading ? 'loading' : ''}`}
                  disabled={isLoading}
                >
                  {isLoading ? 'Sending...' : 'Send Reset Code'}
                </button>
              </form>
            </>
          ) : (
            <>
              <h2 className="text-xl font-semibold text-base-content mb-2">Reset your password</h2>
              <p className="text-base-content/60 text-sm mb-6">
                Enter the code we sent to <strong>{email}</strong>
              </p>

              {successMessage && (
                <div className="alert alert-success text-sm py-2 mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-5 w-5" fill="none" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>{successMessage}</span>
                </div>
              )}

              <form onSubmit={handleResetPassword} className="space-y-4">
                {/* Code Input */}
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-medium">Verification Code</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Enter 6-digit code"
                    className="input input-bordered w-full text-center text-xl tracking-widest bg-base-200/50 focus:bg-base-100"
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    disabled={isLoading}
                    maxLength={6}
                  />
                </div>

                {/* New Password Input */}
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-medium">New Password</span>
                  </label>
                  <div className="relative">
                    <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-base-content/40" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Enter new password"
                      className="input input-bordered w-full pl-10 pr-10 bg-base-200/50 focus:bg-base-100"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      disabled={isLoading}
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-base-content/40 hover:text-base-content"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <FiEyeOff className="w-5 h-5" /> : <FiEye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {/* Confirm Password Input */}
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-medium">Confirm New Password</span>
                  </label>
                  <div className="relative">
                    <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-base-content/40" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Confirm new password"
                      className="input input-bordered w-full pl-10 bg-base-200/50 focus:bg-base-100"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      disabled={isLoading}
                      autoComplete="new-password"
                    />
                  </div>
                </div>

                {/* Error Message */}
                {displayError && (
                  <div className="alert alert-error text-sm py-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-5 w-5" fill="none" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>{displayError}</span>
                  </div>
                )}

                {/* Submit Button */}
                <button
                  type="submit"
                  className={`btn btn-primary w-full ${isLoading ? 'loading' : ''}`}
                  disabled={isLoading || code.length !== 6}
                >
                  {isLoading ? 'Resetting...' : 'Reset Password'}
                </button>

                {/* Back Button */}
                <button
                  type="button"
                  className="btn btn-ghost btn-sm w-full"
                  onClick={() => setStep('request')}
                >
                  Try different email
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
