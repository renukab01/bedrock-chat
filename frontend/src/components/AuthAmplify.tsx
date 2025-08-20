import React, { ReactNode, cloneElement, ReactElement } from 'react';
import { BaseProps } from '../@types/common';
import { Authenticator, useAuthenticator } from '@aws-amplify/ui-react';
import { SocialProvider } from '../@types/auth';
import pravartanamLogo from '../assets/pravartanam.jpg';

type Props = BaseProps & {
  socialProviders: SocialProvider[];
  children: ReactNode;
};

const AuthAmplify: React.FC<Props> = ({ socialProviders, children }) => {
  const { signOut } = useAuthenticator();

  // Configure form fields for sign-in only (sign-up disabled)
  const formFields = {
    signIn: {
      username: {
        placeholder: 'Enter your email',
        isRequired: true,
        label: 'Email:'
      },
      password: {
        placeholder: 'Enter your password',
        isRequired: true,
        label: 'Password:'
      }
    },
    confirmSignIn: {
      confirmation_code: {
        placeholder: 'Enter OTP sent to your email/mobile',
        isRequired: true,
        label: 'OTP Code:'
      }
    },
    confirmSignUp: {
      confirmation_code: {
        placeholder: 'Enter OTP sent to your email/mobile',
        isRequired: true,
        label: 'OTP Code:'
      }
    },
    forceNewPassword: {
      password: {
        placeholder: 'Enter new password',
        isRequired: true,
        label: 'New Password:'
      }
    }
  };

  return (
    <Authenticator
      socialProviders={socialProviders}
      formFields={formFields}
      loginMechanisms={['email']}
      hideSignUp={true}
      services={{
        async handleConfirmSignIn(formData: any) {
          const { confirmation_code } = formData;
          try {
            console.log('Confirming sign in with OTP:', confirmation_code);
            console.log('Form data:', formData);
            
            // Let Amplify handle the confirm sign-in flow naturally
            const { confirmSignIn } = await import('aws-amplify/auth');
            const result = await confirmSignIn({
              challengeResponse: confirmation_code,
            });
            
            console.log('Confirm sign in result:', result);
            return result;
          } catch (error: any) {
            console.error('Error confirming sign in:', error);
            throw error;
          }
        },
        async handleSignIn(formData: any) {
          const { username, password } = formData;
          try {
            console.log('Signing in with:', { username, password });
            
            // Let Amplify handle the sign-in flow naturally
            // This will automatically handle MFA challenges and redirect to the appropriate screen
            const { signIn } = await import('aws-amplify/auth');
            const result = await signIn({
              username,
              password,
            });
            
            console.log('Sign in result:', result);
            return result;
          } catch (error: any) {
            console.error('Error signing in:', error);
            throw error;
          }
        }
      }}
      components={{
        Header: () => (
          <div className="mb-5 mt-10 flex flex-col items-center">
            <div className="flex items-center justify-center">
              <img 
                src={pravartanamLogo} 
                alt="Pravartanam Logo" 
                className="w-[80px] h-[80px] sm:w-[100px] sm:h-[100px] mr-3 object-contain"
                style={{ marginTop: '11px' }}
              />
              <div className="flex flex-col">
                <span className="text-lg sm:text-xl font-bold">SAIL GPT</span>
                <span className="text-[10px] sm:text-xs text-gray-600 dark:text-gray-400">Forging The Future With Intelligence Of Tomorrow</span>
              </div>
            </div>
          </div>
        ),
      }}
    >
      <>{cloneElement(children as ReactElement, { signOut })}</>
    </Authenticator>
  );
};

export default AuthAmplify;
