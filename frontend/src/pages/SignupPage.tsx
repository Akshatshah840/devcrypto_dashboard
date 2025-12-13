import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { FiMail, FiLock, FiEye, FiEyeOff, FiUser, FiGithub, FiTrendingUp, FiCheck, FiX } from 'react-icons/fi';

const SignupPage: React.FC = () => {
  const navigate = useNavigate();
  const { signup, confirmSignup, isLoading, error, clearError, isAuthenticated } = useAuth();

  const [step, setStep] = useState<'signup' | 'verify'>('signup');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState('');

  // Password strength indicators
  const passwordChecks = {
    minLength: password.length >= 8,
    hasUppercase: /[A-Z]/.test(password),
    hasLowercase: /[a-z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    hasSpecial: /[!@#$%^&*(),.?":{}|<>]/.test(password),
  };

  const isPasswordStrong = Object.values(passwordChecks).every(Boolean);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  // Clear errors when inputs change
  useEffect(() => {
    if (error) clearError();
    if (localError) setLocalError('');
  }, [name, email, password, confirmPassword, verificationCode]);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError('');

    // Validation
    if (!name.trim()) {
      setLocalError('Name is required');
      return;
    }
    if (!email.trim()) {
      setLocalError('Email is required');
      return;
    }
    if (!isPasswordStrong) {
      setLocalError('Password does not meet requirements');
      return;
    }
    if (password !== confirmPassword) {
      setLocalError('Passwords do not match');
      return;
    }

    const success = await signup(email, password, name);
    if (success) {
      setStep('verify');
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError('');

    if (!verificationCode.trim()) {
      setLocalError('Verification code is required');
      return;
    }

    const success = await confirmSignup(email, verificationCode);
    if (success) {
      navigate('/login', { state: { message: 'Email verified! Please sign in.' } });
    }
  };

  const displayError = localError || error;

  const PasswordCheck: React.FC<{ passed: boolean; label: string }> = ({ passed, label }) => (
    <div className={`flex items-center gap-2 text-xs ${passed ? 'text-success' : 'text-base-content/40'}`}>
      {passed ? <FiCheck className="w-3 h-3" /> : <FiX className="w-3 h-3" />}
      <span>{label}</span>
    </div>
  );

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
          <p className="text-base-content/60 mt-1">GitHub Activity vs Crypto Prices</p>
        </div>

        {/* Signup Card */}
        <div className="glass-card rounded-2xl p-8">
          {step === 'signup' ? (
            <>
              <h2 className="text-xl font-semibold text-base-content mb-6">Create your account</h2>

              <form onSubmit={handleSignup} className="space-y-4">
                {/* Name Input */}
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-medium">Full Name</span>
                  </label>
                  <div className="relative">
                    <FiUser className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-base-content/40" />
                    <input
                      type="text"
                      placeholder="John Doe"
                      className="input input-bordered w-full pl-10 bg-base-200/50 focus:bg-base-100"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      disabled={isLoading}
                      autoComplete="name"
                    />
                  </div>
                </div>

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

                {/* Password Input */}
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-medium">Password</span>
                  </label>
                  <div className="relative">
                    <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-base-content/40" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Create a strong password"
                      className="input input-bordered w-full pl-10 pr-10 bg-base-200/50 focus:bg-base-100"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
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

                  {/* Password Requirements */}
                  {password && (
                    <div className="mt-2 p-3 bg-base-200/50 rounded-lg grid grid-cols-2 gap-1">
                      <PasswordCheck passed={passwordChecks.minLength} label="8+ characters" />
                      <PasswordCheck passed={passwordChecks.hasUppercase} label="Uppercase" />
                      <PasswordCheck passed={passwordChecks.hasLowercase} label="Lowercase" />
                      <PasswordCheck passed={passwordChecks.hasNumber} label="Number" />
                      <PasswordCheck passed={passwordChecks.hasSpecial} label="Special char" />
                    </div>
                  )}
                </div>

                {/* Confirm Password Input */}
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-medium">Confirm Password</span>
                  </label>
                  <div className="relative">
                    <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-base-content/40" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Confirm your password"
                      className="input input-bordered w-full pl-10 bg-base-200/50 focus:bg-base-100"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      disabled={isLoading}
                      autoComplete="new-password"
                    />
                  </div>
                  {confirmPassword && password !== confirmPassword && (
                    <label className="label">
                      <span className="label-text-alt text-error">Passwords do not match</span>
                    </label>
                  )}
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
                  className={`btn btn-primary w-full mt-2 ${isLoading ? 'loading' : ''}`}
                  disabled={isLoading}
                >
                  {isLoading ? 'Creating account...' : 'Create Account'}
                </button>
              </form>
            </>
          ) : (
            <>
              <h2 className="text-xl font-semibold text-base-content mb-2">Verify your email</h2>
              <p className="text-base-content/60 text-sm mb-6">
                We've sent a verification code to <strong>{email}</strong>
              </p>

              <form onSubmit={handleVerify} className="space-y-5">
                {/* Verification Code Input */}
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-medium">Verification Code</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Enter 6-digit code"
                    className="input input-bordered w-full text-center text-2xl tracking-widest bg-base-200/50 focus:bg-base-100"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    disabled={isLoading}
                    maxLength={6}
                  />
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
                  disabled={isLoading || verificationCode.length !== 6}
                >
                  {isLoading ? 'Verifying...' : 'Verify Email'}
                </button>

                {/* Resend Code */}
                <button
                  type="button"
                  className="btn btn-ghost btn-sm w-full"
                  onClick={() => setStep('signup')}
                >
                  Back to signup
                </button>
              </form>
            </>
          )}

          {/* Sign In Link */}
          {step === 'signup' && (
            <p className="text-center mt-6 text-base-content/60">
              Already have an account?{' '}
              <Link to="/login" className="text-primary font-medium hover:text-primary-focus transition-colors">
                Sign in
              </Link>
            </p>
          )}
        </div>

        {/* Footer */}
        <p className="text-center mt-6 text-xs text-base-content/40">
          By signing up, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
  );
};

export default SignupPage;
