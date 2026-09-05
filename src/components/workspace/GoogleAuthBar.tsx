import React, { useState, useEffect } from 'react';
import { 
  initAuth, 
  googleSignIn, 
  logoutGoogle
} from '../../services/workspace/googleAuth';
import { WorkspaceUser } from '../../runtime/runtimeTypes';
import { InHouseButton } from '../../runtime/primitives/Actions';
import { 
  CheckCircle2, 
  LogOut, 
  User as UserIcon,
  ShieldCheck,
  HardDrive,
  Mail,
  Calendar,
  FileSpreadsheet,
  FileText,
  StickyNote
} from 'lucide-react';

export const GoogleAuthBar: React.FC<{
  onAuthChange?: (isAuthed: boolean) => void;
}> = ({ onAuthChange }) => {
  const [user, setUser] = useState<WorkspaceUser | null>(null);
  const [hasLiveToken, setHasLiveToken] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showScopes, setShowScopes] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = initAuth(
      (authUser, token) => {
        setUser({
          displayName: authUser.displayName,
          email: authUser.email,
          photoURL: authUser.photoURL,
          uid: authUser.uid,
        });
        setHasLiveToken(Boolean(token));
        if (onAuthChange) onAuthChange(Boolean(token));
      },
      () => {
        setUser(null);
        setHasLiveToken(false);
        if (onAuthChange) onAuthChange(false);
      }
    );
    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, [onAuthChange]);

  const handleSignIn = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const res = await googleSignIn();
      if (res) {
        setUser({
          displayName: res.user.displayName,
          email: res.user.email,
          photoURL: res.user.photoURL,
          uid: res.user.uid,
        });
        setHasLiveToken(true);
        if (onAuthChange) onAuthChange(true);
      }
    } catch (err: any) {
      console.error('Google Sign In failed:', err);
      const msg = err?.message || 'Authentication was cancelled or blocked by browser.';
      if (msg.includes('popup-closed-by-user')) {
        setErrorMessage('Sign-in cancelled. You can retry anytime.');
      } else if (msg.includes('popup-blocked')) {
        setErrorMessage('Browser blocked popup window. Please allow popups for this preview.');
      } else {
        setErrorMessage(msg.slice(0, 120));
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      await logoutGoogle();
      setUser(null);
      setHasLiveToken(false);
      if (onAuthChange) onAuthChange(false);
    } catch (err) {
      console.error('Sign out error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const scopeServices = [
    { name: 'Drive & Picker', icon: HardDrive, granted: true },
    { name: 'Gmail', icon: Mail, granted: true },
    { name: 'Calendar', icon: Calendar, granted: true },
    { name: 'Sheets', icon: FileSpreadsheet, granted: true },
    { name: 'Docs', icon: FileText, granted: true },
    { name: 'Keep Sync', icon: StickyNote, granted: true },
  ];

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-3 px-3 py-2 rounded-xl bg-[#0e1424] border border-slate-800 text-xs">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="flex items-center gap-1.5 shrink-0">
            <span className={`w-2 h-2 rounded-full ${user && hasLiveToken ? 'bg-emerald-400 animate-pulse' : user ? 'bg-amber-400' : 'bg-slate-500'}`} />
            <span className="font-medium text-slate-300">
              {user && hasLiveToken
                ? 'Google Workspace Connected'
                : user
                ? 'Google Account Connected (OAuth Refresh Needed)'
                : 'Google Workspace: Ready for Sign-in'}
            </span>
          </div>

          {user ? (
            <div className="hidden sm:flex items-center gap-2 pl-2 border-l border-slate-700/80 truncate">
              {user.photoURL ? (
                <img 
                  src={user.photoURL} 
                  alt={user.displayName || 'User'} 
                  className="w-5 h-5 rounded-full ring-1 ring-cyan-500/50" 
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-5 h-5 rounded-full bg-slate-700 flex items-center justify-center text-[10px]">
                  <UserIcon className="w-3 h-3 text-slate-300" />
                </div>
              )}
              <span className="text-slate-200 font-semibold truncate">{user.displayName || user.email}</span>
              <span className="text-slate-500 text-[11px] truncate hidden md:inline">({user.email})</span>
            </div>
          ) : (
            <span className="text-slate-500 hidden md:inline truncate">
              Drive, Gmail, Calendar, Sheets, Docs & Keep active
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setShowScopes(!showScopes)}
            className="text-[11px] text-slate-400 hover:text-cyan-300 px-2 py-1 rounded hover:bg-slate-800 transition-colors flex items-center gap-1"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">Active Scopes</span>
          </button>

          {user && hasLiveToken ? (
            <InHouseButton
              variant="quiet"
              size="sm"
              onClick={handleSignOut}
              loading={isLoading}
              icon={LogOut}
            >
              Disconnect
            </InHouseButton>
          ) : user && !hasLiveToken ? (
            <div className="flex items-center gap-1.5">
              <InHouseButton
                variant="primary"
                size="sm"
                onClick={handleSignIn}
                loading={isLoading}
              >
                Authorize Scopes
              </InHouseButton>
              <InHouseButton
                variant="quiet"
                size="sm"
                onClick={handleSignOut}
                loading={isLoading}
                icon={LogOut}
              >
                Sign out
              </InHouseButton>
            </div>
          ) : (
            <button 
              type="button"
              onClick={handleSignIn}
              disabled={isLoading}
              className="gsi-material-button inline-flex items-center justify-center gap-2 px-3 py-1.5 bg-white hover:bg-slate-100 active:bg-slate-200 text-slate-800 text-xs font-semibold rounded-lg shadow-sm border border-slate-300 transition-colors cursor-pointer disabled:opacity-60"
            >
              <div className="w-4 h-4 shrink-0">
                <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" style={{ display: 'block', width: '100%', height: '100%' }}>
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                </svg>
              </div>
              <span>{isLoading ? 'Connecting...' : 'Sign in with Google'}</span>
            </button>
          )}
        </div>
      </div>

      {errorMessage && (
        <div className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-rose-950/60 border border-rose-800/80 text-rose-300 text-[11px]">
          <span>{errorMessage}</span>
          <button 
            onClick={() => setErrorMessage(null)} 
            className="text-rose-400 hover:text-rose-200 ml-2 font-mono"
          >
            ✕
          </button>
        </div>
      )}

      {showScopes && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="w-full max-w-md bg-[#0f1527] border border-slate-700 rounded-2xl p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-cyan-400" />
                Configured Google Workspace Scopes
              </h3>
              <button 
                onClick={() => setShowScopes(false)}
                className="text-slate-400 hover:text-slate-200 text-xs p-1"
              >
                ✕
              </button>
            </div>
            <p className="text-xs text-slate-400">
              The application connects directly to Google Workspace APIs via OAuth 2.0. All tokens remain in-memory and are never written to disk or storage.
            </p>
            <div className="grid grid-cols-2 gap-2 pt-1">
              {scopeServices.map((s, i) => {
                const Icon = s.icon;
                return (
                  <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-slate-900 border border-slate-800 text-xs">
                    <Icon className="w-4 h-4 text-cyan-400 shrink-0" />
                    <span className="text-slate-200 font-medium truncate">{s.name}</span>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 ml-auto shrink-0" />
                  </div>
                );
              })}
            </div>
            <div className="pt-2 flex justify-end">
              <InHouseButton size="sm" onClick={() => setShowScopes(false)}>
                Close
              </InHouseButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
