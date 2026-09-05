import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  signOut,
  User,
} from 'firebase/auth';
import firebaseConfig from '../../../firebase-applet-config.json';

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);

/**
 * Browser OAuth is intentionally short-lived and memory-only.
 * Long-lived refresh credentials, watches and webhooks belong behind a
 * server-side connector boundary, never in browser storage.
 */
export const provider = new GoogleAuthProvider();
[
  'https://www.googleapis.com/auth/drive',
  'https://www.googleapis.com/auth/gmail.modify',
  'https://www.googleapis.com/auth/gmail.send',
  'https://www.googleapis.com/auth/calendar.events',
  'https://www.googleapis.com/auth/spreadsheets',
  'https://www.googleapis.com/auth/documents',
].forEach(scope => provider.addScope(scope));
provider.setCustomParameters({ prompt: 'consent' });

let cachedAccessToken: string | null = null;
let isSigningIn = false;

export const isAuthSigningIn = (): boolean => isSigningIn;
export const hasGoogleAccessToken = (): boolean => Boolean(cachedAccessToken);

export const initAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void,
) => {
  return onAuthStateChanged(auth, (user: User | null) => {
    if (user && cachedAccessToken) {
      onAuthSuccess?.(user, cachedAccessToken);
      return;
    }

    // Firebase can restore its own auth session, but it cannot restore the
    // Google provider access token we deliberately keep out of browser storage.
    // Do not report Workspace as connected until a fresh provider token exists.
    onAuthFailure?.();
  });
};

export const googleSignIn = async (): Promise<{ user: User; accessToken: string }> => {
  if (isSigningIn) {
    throw new Error('Google sign-in is already in progress.');
  }

  isSigningIn = true;
  try {
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    const token = credential?.accessToken;
    if (!token) {
      throw new Error('Google did not return a Workspace access token.');
    }

    cachedAccessToken = token;
    return { user: result.user, accessToken: token };
  } finally {
    isSigningIn = false;
  }
};

export const getAccessToken = async (): Promise<string | null> => cachedAccessToken;

export const logoutGoogle = async () => {
  cachedAccessToken = null;
  await signOut(auth);
};

export const getConfiguredWorkspaceScopes = (): string[] => [
  'Drive',
  'Gmail modify',
  'Gmail send',
  'Calendar events',
  'Sheets',
  'Docs',
];

export const getAppletOAuthClientId = () => firebaseConfig.oAuthClientId;
export const getAppletApiKey = () => firebaseConfig.apiKey;
