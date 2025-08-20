import { signIn, confirmSignIn, fetchAuthSession, SignInOutput, ConfirmSignInOutput } from 'aws-amplify/auth';

export interface AuthChallenge {
  challengeName: 'EMAIL_OTP' | 'SMS_OTP' | 'NEW_PASSWORD_REQUIRED' | 'SOFTWARE_TOKEN_MFA';
  challengeParameters?: Record<string, string>;
}

export class AuthService {
  /**
   * Handle sign in with proper error handling
   */
  static async handleSignIn(username: string, password: string): Promise<SignInOutput> {
    try {
      console.log('Signing in with:', { username });
      
      const result = await signIn({
        username,
        password,
      });
      
      console.log('Sign in result:', result);
      
      // If MFA is required, this is not an error - it's a normal flow step
      // The result should indicate the next step is to confirm sign-in
      if (result.nextStep && result.nextStep.signInStep) {
        console.log('MFA required, next step:', result.nextStep.signInStep);
        // Return the result so Amplify can handle the flow properly
        return result;
      }
      
      return result;
    } catch (error) {
      console.error('Error signing in:', error);
      throw error;
    }
  }

  /**
   * Handle confirm sign in for both EMAIL_OTP and SMS_OTP challenges
   */
  static async handleConfirmSignIn(confirmationCode: string): Promise<ConfirmSignInOutput> {
    try {
      console.log('Confirming sign in with OTP:', confirmationCode);
      
      // Handle both EMAIL_OTP and SMS_OTP challenges
      // The confirmSignIn function automatically handles different challenge types
      const result = await confirmSignIn({
        challengeResponse: confirmationCode,
      });
      
      console.log('Confirm sign in result:', result);
      return result;
    } catch (error) {
      console.error('Error confirming sign in:', error);
      throw error;
    }
  }

  /**
   * Get current authentication session
   */
  static async getCurrentSession() {
    try {
      const session = await fetchAuthSession();
      return session;
    } catch (error) {
      console.error('Error fetching auth session:', error);
      throw error;
    }
  }

  /**
   * Check if user is authenticated
   */
  static async isAuthenticated(): Promise<boolean> {
    try {
      const session = await this.getCurrentSession();
      return session.tokens !== undefined;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get challenge type from error message
   */
  static getChallengeType(error: any): 'EMAIL_OTP' | 'SMS_OTP' | 'UNKNOWN' {
    if (error?.message?.includes('EMAIL_OTP')) {
      return 'EMAIL_OTP';
    } else if (error?.message?.includes('SMS_OTP')) {
      return 'SMS_OTP';
    }
    return 'UNKNOWN';
  }

  /**
   * Handle authentication error and provide user-friendly message
   */
  static handleAuthError(error: any): string {
    // Don't handle MFA challenges as errors - they are normal flow steps
    if (error?.name === 'InvalidParameterException' && 
        (error?.message?.includes('EMAIL_OTP') || error?.message?.includes('SMS_OTP'))) {
      // This is a normal MFA challenge, not an error
      return '';
    }
    
    const challengeType = this.getChallengeType(error);
    
    switch (challengeType) {
      case 'EMAIL_OTP':
        return 'Please enter the OTP sent to your email or mobile.';
      case 'SMS_OTP':
        return 'Please enter the OTP sent to your email or mobile.';
      default:
        return error?.message || 'An error occurred during authentication.';
    }
  }
}

export default AuthService; 