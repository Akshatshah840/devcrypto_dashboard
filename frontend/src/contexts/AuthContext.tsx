import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  signUp,
  signIn,
  signOut,
  confirmSignUp,
  getCurrentUser,
  fetchAuthSession,
  fetchUserAttributes,
  resendSignUpCode,
  resetPassword,
  confirmResetPassword,
  type SignUpInput,
  type SignInInput,
} from 'aws-amplify/auth';

interface User {
  userId: string;
  username: string;
  email?: string;
  name?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
  // Auth actions
  login: (email: string, password: string) => Promise<boolean>;
  signup: (email: string, password: string, name: string) => Promise<boolean>;
  confirmSignup: (email: string, code: string) => Promise<boolean>;
  logout: () => Promise<void>;
  resendCode: (email: string) => Promise<boolean>;
  forgotPassword: (email: string) => Promise<boolean>;
  confirmForgotPassword: (email: string, code: string, newPassword: string) => Promise<boolean>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isAuthenticated = !!user;

  // Check for existing session on mount
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      setIsLoading(true);
      const currentUser = await getCurrentUser();
      const session = await fetchAuthSession();

      if (currentUser && session.tokens) {
        // Fetch user attributes to get the name
        let userName: string | undefined;
        let userEmail: string | undefined;
        try {
          const attributes = await fetchUserAttributes();
          userName = attributes.name;
          userEmail = attributes.email;
        } catch {
          // Fallback if attributes fetch fails
        }

        setUser({
          userId: currentUser.userId,
          username: currentUser.username,
          email: userEmail || currentUser.signInDetails?.loginId,
          name: userName,
        });
      }
    } catch {
      // Not authenticated
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      setError(null);

      const signInInput: SignInInput = {
        username: email,
        password,
      };

      const { isSignedIn, nextStep } = await signIn(signInInput);

      if (isSignedIn) {
        const currentUser = await getCurrentUser();
        // Fetch user attributes to get the name
        let userName: string | undefined;
        try {
          const attributes = await fetchUserAttributes();
          userName = attributes.name;
        } catch {
          // Fallback if attributes fetch fails
        }
        setUser({
          userId: currentUser.userId,
          username: currentUser.username,
          email: email,
          name: userName,
        });
        return true;
      }

      if (nextStep?.signInStep === 'CONFIRM_SIGN_UP') {
        setError('Please verify your email first');
        return false;
      }

      return false;
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Login failed';
      setError(errorMessage);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const signup = useCallback(async (email: string, password: string, name: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      setError(null);

      const signUpInput: SignUpInput = {
        username: email,
        password,
        options: {
          userAttributes: {
            email,
            name,
          },
        },
      };

      const { isSignUpComplete, nextStep } = await signUp(signUpInput);

      if (isSignUpComplete) {
        return true;
      }

      if (nextStep?.signUpStep === 'CONFIRM_SIGN_UP') {
        // User needs to confirm email
        return true;
      }

      return false;
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Signup failed';
      setError(errorMessage);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const confirmSignup = useCallback(async (email: string, code: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      setError(null);

      const { isSignUpComplete } = await confirmSignUp({
        username: email,
        confirmationCode: code,
      });

      return isSignUpComplete;
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Verification failed';
      setError(errorMessage);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      setIsLoading(true);
      await signOut();
      setUser(null);
    } catch (err: unknown) {
      console.error('Logout error:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const resendCode = useCallback(async (email: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      setError(null);
      await resendSignUpCode({ username: email });
      return true;
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to resend code';
      setError(errorMessage);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const forgotPassword = useCallback(async (email: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      setError(null);
      await resetPassword({ username: email });
      return true;
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to send reset code';
      setError(errorMessage);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const confirmForgotPassword = useCallback(async (
    email: string,
    code: string,
    newPassword: string
  ): Promise<boolean> => {
    try {
      setIsLoading(true);
      setError(null);
      await confirmResetPassword({
        username: email,
        confirmationCode: code,
        newPassword,
      });
      return true;
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to reset password';
      setError(errorMessage);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated,
    error,
    login,
    signup,
    confirmSignup,
    logout,
    resendCode,
    forgotPassword,
    confirmForgotPassword,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
