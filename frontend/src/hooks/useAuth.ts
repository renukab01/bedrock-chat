import { useState, useCallback } from 'react';
import { useAuthenticator } from '@aws-amplify/ui-react';
import AuthService from '../services/authService';

export interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  challengeType: 'EMAIL_OTP' | 'SMS_OTP' | 'NONE';
}

export const useAuth = () => {
  const { signOut, user } = useAuthenticator();
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: !!user,
    isLoading: false,
    error: null,
    challengeType: 'NONE',
  });

  const handleSignIn = useCallback(async (username: string, password: string) => {
    setAuthState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const result = await AuthService.handleSignIn(username, password);
      
      if (result.nextStep.signInStep === 'CONFIRM_SIGN_IN_WITH_SMS_CODE') {
        setAuthState(prev => ({ 
          ...prev, 
          isLoading: false, 
          challengeType: 'SMS_OTP' 
        }));
      } else if (result.nextStep.signInStep === 'CONFIRM_SIGN_IN_WITH_TOTP_CODE') {
        setAuthState(prev => ({ 
          ...prev, 
          isLoading: false, 
          challengeType: 'EMAIL_OTP' 
        }));
      } else {
        setAuthState(prev => ({ 
          ...prev, 
          isLoading: false, 
          isAuthenticated: true,
          challengeType: 'NONE' 
        }));
      }
      
      return result;
    } catch (error: any) {
      const errorMessage = AuthService.handleAuthError(error);
      setAuthState(prev => ({ 
        ...prev, 
        isLoading: false, 
        error: errorMessage 
      }));
      throw error;
    }
  }, []);

  const handleConfirmSignIn = useCallback(async (confirmationCode: string) => {
    setAuthState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const result = await AuthService.handleConfirmSignIn(confirmationCode);
      
      setAuthState(prev => ({ 
        ...prev, 
        isLoading: false, 
        isAuthenticated: true,
        challengeType: 'NONE' 
      }));
      
      return result;
    } catch (error: any) {
      const errorMessage = AuthService.handleAuthError(error);
      setAuthState(prev => ({ 
        ...prev, 
        isLoading: false, 
        error: errorMessage 
      }));
      throw error;
    }
  }, []);

  const handleSignOut = useCallback(async () => {
    setAuthState(prev => ({ ...prev, isLoading: true }));
    
    try {
      await signOut();
      setAuthState({
        isAuthenticated: false,
        isLoading: false,
        error: null,
        challengeType: 'NONE',
      });
    } catch (error: any) {
      setAuthState(prev => ({ 
        ...prev, 
        isLoading: false, 
        error: 'Error signing out' 
      }));
    }
  }, [signOut]);

  const clearError = useCallback(() => {
    setAuthState(prev => ({ ...prev, error: null }));
  }, []);

  return {
    ...authState,
    handleSignIn,
    handleConfirmSignIn,
    handleSignOut,
    clearError,
    user,
  };
};

export default useAuth; 