import React, { useEffect } from 'react';
import { translations } from '@aws-amplify/ui-react';
import { Amplify } from 'aws-amplify';
import { I18n } from 'aws-amplify/utils';
import '@aws-amplify/ui-react/styles.css';
import AuthAmplify from './components/AuthAmplify';
import AuthCustom from './components/AuthCustom';
import { Authenticator } from '@aws-amplify/ui-react';
import { useTranslation } from 'react-i18next';
import './i18n';
import { validateSocialProvider } from './utils/SocialProviderUtils';
import AppContent from './layouts/AppContent';
import { ErrorBoundary } from 'react-error-boundary';
import ErrorFallback from './pages/ErrorFallback';

const customProviderEnabled =
  import.meta.env.VITE_APP_CUSTOM_PROVIDER_ENABLED === 'true';
const socialProviderFromEnv = import.meta.env.VITE_APP_SOCIAL_PROVIDERS?.split(
  ','
).filter(validateSocialProvider);

const App: React.FC = () => {
  const { t, i18n } = useTranslation();

  useEffect(() => {
    // set header title
    document.title = t('app.name')
  }, [t]);

  useEffect(() => {
    // Inject custom CSS to reduce font size of OTP text
    const style = document.createElement('style');
    style.textContent = `
      [data-amplify-authenticator] [data-amplify-heading],
      [data-amplify-authenticator] h1,
      [data-amplify-authenticator] .amplify-heading {
        font-size: 15px !important;
        line-height: 1.2 !important;
        white-space: nowrap !important;
        overflow: hidden !important;
        text-overflow: ellipsis !important;
      }
    `;
    document.head.appendChild(style);

    return () => {
      document.head.removeChild(style);
    };
  }, []);

  Amplify.configure({
    Auth: {
      Cognito: {
        userPoolId: import.meta.env.VITE_APP_USER_POOL_ID,
        userPoolClientId: import.meta.env.VITE_APP_USER_POOL_CLIENT_ID,
        loginWith: {
          oauth: {
            domain: import.meta.env.VITE_APP_COGNITO_DOMAIN,
            scopes: ['openid', 'email'],
            redirectSignIn: [import.meta.env.VITE_APP_REDIRECT_SIGNIN_URL],
            redirectSignOut: [import.meta.env.VITE_APP_REDIRECT_SIGNOUT_URL],
            responseType: 'code',
          },
        },
        // Add configuration for handling OTP challenges
        signUpVerificationMethod: 'code',
        userAttributes: {
          email: {
            required: true,
          },
        },
        // Enable MFA configuration
        mfa: {
          status: 'on',
          totpEnabled: true,
          smsEnabled: true,
        },
      },
    },
  });

  // Custom translations to override default Amplify text
  const customTranslations = {
    en: {
      'Confirm SMS Code': 'Enter the OTP sent to your email or mobile',
      'Code': 'OTP',
      'Confirm': 'Verify OTP',
      'Code *': 'OTP *',
      'Enter your code': 'Enter your OTP',
      'Enter code': 'Enter OTP',
      'Confirm Sign In': 'Verify OTP',
      'Enter your confirmation code': 'Enter the OTP sent to your email or mobile',
      'Confirmation Code': 'OTP Code',
      'Confirmation Code *': 'OTP Code *',
      'EMAIL_OTP': 'Email OTP',
      'SMS_OTP': 'SMS OTP',
      'Challenge': 'OTP Challenge',
      'Enter your email code': 'Enter the OTP sent to your email or mobile',
      'Enter your SMS code': 'Enter the OTP sent to your email or mobile',
      'Email code': 'OTP Code',
      'SMS code': 'OTP Code',
      'Please enter the code sent to your email': 'Please enter the OTP sent to your email or mobile',
      'Please enter the code sent to your mobile': 'Please enter the OTP sent to your email or mobile',
      'Invalid code': 'Invalid OTP code. Please try again.',
      'Code is required': 'OTP code is required',
      'Code must be 6 digits': 'OTP code must be 6 digits',
      'We sent a code to': 'We sent an OTP to',
      'Enter the code we sent to': 'Enter the OTP we sent to',
      'Didn\'t receive a code?': 'Didn\'t receive an OTP?',
      'Resend code': 'Resend OTP',
      'Resend': 'Resend OTP'
    }
  };

  I18n.putVocabularies(translations);
  I18n.putVocabularies(customTranslations);
  I18n.setLanguage(i18n.language);

  return (
    <ErrorBoundary fallback={<ErrorFallback />}>
      {customProviderEnabled ? (
        <AuthCustom>
          <AppContent />
        </AuthCustom>
      ) : (
        <Authenticator.Provider>
          <AuthAmplify socialProviders={socialProviderFromEnv}>
            <AppContent />
          </AuthAmplify>
        </Authenticator.Provider>
      )}
    </ErrorBoundary>
  );
};

export default App;
