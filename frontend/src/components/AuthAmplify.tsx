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
    }
  };

  return (
    <Authenticator
      socialProviders={socialProviders}
      formFields={formFields}
      loginMechanisms={['email']}
      hideSignUp={true}
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
