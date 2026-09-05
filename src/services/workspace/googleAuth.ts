import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithPopup, 
  GoogleAuthProvider, 
  onAuthStateChanged, 
  signOut, 
  User 
} from 'firebase/auth';
import firebaseConfig from '../../../firebase-applet-config.json';

// Re-use or initialize Firebase app
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);

// Configure Google Provider with requested Workspace Scopes
export const provider = new GoogleAuthProvider();
provider.addScope('https://www.googleapis.com/auth/drive');
provider.addScope('https://www.googleapis.com/auth/drive.file');
provider.addScope('https://www.googleapis.com/auth/drive.readonly');
provider.addScope('https://www.googleapis.com/auth/drive.metadata.readonly');
provider.addScope('https://mail.google.com/');
provider.addScope('https://www.googleapis.com/auth/gmail.readonly');
provider.addScope('https://www.googleapis.com/auth/gmail.send');
provider.addScope('https://www.googleapis.com/auth/gmail.compose');
provider.addScope('https://www.googleapis.com/auth/gmail.modify');
provider.addScope('https://www.googleapis.com/auth/calendar');
provider.addScope('https://www.googleapis.com/auth/calendar.events');
provider.addScope('https://www.googleapis.com/auth/calendar.readonly');
provider.addScope('https://www.googleapis.com/auth/spreadsheets');
provider.addScope('https://www.googleapis.com/auth/spreadsheets.readonly');
provider.addScope('https://www.googleapis.com/auth/documents');
provider.addScope('https://www.googleapis.com/auth/documents.readonly');

// Session token storage key (cleared automatically on tab close)
const SESSION_TOKEN_KEY = 'aftergraph_ws_session_token_v1';
let cachedAccessToken: string | null = null;
let isSigningIn = false;

export const isAuthSigningIn = (): boolean => isSigningIn;

export const getStoredSessionToken = (): string | null => {
  if (cachedAccessToken) return cachedAccessToken;
  try {
    const stored = sessionStorage.getItem(SESSION_TOKEN_KEY);
    if (stored) {
      cachedAccessToken = stored;
      return stored;
    }
  } catch {
    // Storage access may be blocked in some sandboxes
  }
  return null;
};

export const setStoredSessionToken = (token: string | null) => {
  cachedAccessToken = token;
  try {
    if (token) {
      sessionStorage.setItem(SESSION_TOKEN_KEY, token);
    } else {
      sessionStorage.removeItem(SESSION_TOKEN_KEY);
    }
  } catch {
    // Storage access may be blocked
  }
};

export const initAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      const token = getStoredSessionToken();
      if (token) {
        if (onAuthSuccess) onAuthSuccess(user, token);
      } else {
        // User is authenticated in Firebase, but Google access token needs to be acquired
        if (onAuthSuccess) onAuthSuccess(user, '');
      }
    } else {
      setStoredSessionToken(null);
      if (onAuthFailure) onAuthFailure();
    }
  });
};

export const googleSignIn = async (): Promise<{ user: User; accessToken: string } | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    const token = credential?.accessToken || '';
    if (!token) {
      throw new Error('Google did not return an access token. Please check OAuth credentials.');
    }
    setStoredSessionToken(token);
    return { user: result.user, accessToken: token };
  } catch (error: any) {
    console.error('Sign in error:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const getAccessToken = async (): Promise<string | null> => {
  return getStoredSessionToken();
};

export const logoutGoogle = async () => {
  await signOut(auth);
  setStoredSessionToken(null);
};

export const getAppletOAuthClientId = () => {
  return firebaseConfig.oAuthClientId;
};

export const getAppletApiKey = () => {
  return firebaseConfig.apiKey;
};
