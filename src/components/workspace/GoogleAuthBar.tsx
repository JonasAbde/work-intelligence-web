import React, { useState, useEffect } from 'react';
import {
  initAuth,
  googleSignIn,
  logoutGoogle,
} from '../../services/workspace/googleAuth';
import { WorkspaceUser } from '../../runtime/runtimeTypes';
import { InHouseButton } from '../../runtime/primitives/Actions';
import {
  LogOut,
  User as UserIcon,
  ShieldCheck,
  HardDrive,
  Mail,
  Calendar,
  FileSpreadsheet,
  FileText,
} from 'lucide-react';

export const GoogleAuthBar: React.FC<{
  onAuthChange?: (isAuthed: boolean) => void;
}> = ({ onAuthChange }) => {
  const [user, setUser] = useState<WorkspaceUser | null>(null);
  const [hasLiveToken, setHasLiveToken] = useState(false);
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
        onAuthChange?.(Boolean(token));
      },
      () => {
        setUser(null);
        setHasLiveToken(false);
        onAuthChange?.(false);
      },
    );
    return unsubscribe;
  }, [onAuthChange]);

  const handleSignIn = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const res = await googleSignIn();
      setUser({
        displayName: res.user.displayName,
        email: res.user.email,
        photoURL: res.user.photoURL,
        uid: res.user.uid,
      });
      setHasLiveToken(true);
      onAuthChange?.(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Google Workspace authorization failed.';
      if (msg.includes('popup-closed-by-user')) {
        setErrorMessage('Sign-in was cancelled.');
      } else if (msg.includes('popup-blocked')) {
        setErrorMessage('The browser blocked the Google sign-in popup.');
      } else {
        setErrorMessage(msg.slice(0, 160));
      }
      setHasLiveToken(false);
      onAuthChange?.(false);
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
      onAuthChange?.(false);
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Google sign-out failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const requestedServices = [
    { name: 'Drive', icon: HardDrive, detail: 'Read/write Drive resources' },
    { name: 'Gmail', icon: Mail, detail: 'Modify mail + send messages' },
    { name: 'Calendar', icon: Calendar, detail: 'Manage calendar events' },
    { name: 'Sheets', icon: FileSpreadsheet, detail: 'Read/write spreadsheets' },
    { name: 'Docs', icon: FileText, detail: 'Read/write documents' },
  ];

  const connected = Boolean(user && hasLiveToken);

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-3 px-3 py-2 rounded-xl bg-[#0e1424] border border-slate-800 text-xs">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="flex items-center gap-1.5 shrink-0">
            <span className={`w-2 h-2 rounded-full ${connected ? 'bg-emerald-400' : 'bg-slate-500'}`} />
            <span className="font-medium text-slate-300">
              {connected ? 'Google Workspace connected for this tab' : 'Google Workspace not connected'}
            </span>
          </div>

          {connected && user ? (
            <div className="hidden sm:flex items-center gap-2 pl-2 border-l border-slate-700/80 truncate">
              {user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.displayName || 'Google user'}
                  className="w-5 h-5 rounded-full ring-1 ring-cyan-500/50"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-5 h-5 rounded-full bg-slate-700 flex items-center justify-center text-[10px]">
                  <UserIcon className="w-3 h-3 text-slate-300" />
                </div>
              )}
              <span className="text-slate-200 font-semibold truncate">{user.displayName || user.email}</span>
            </div>
          ) : (
            <span className="text-slate-500 hidden md:inline truncate">
              A fresh OAuth grant is required after reload or tab close.
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setShowScopes(!showScopes)}
            className="text-[11px] text-slate-400 hover:text-cyan-300 px-2 py-1 rounded hover:bg-slate-800 transition-colors flex items-center gap-1"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">Requested access</span>
          </button>

          {connected ? (
            <InHouseButton
              variant="quiet"
              size="sm"
              onClick={handleSignOut}
              loading={isLoading}
              icon={LogOut}
            >
              Disconnect
            </InHouseButton>
          ) : (
            <button
              type="button"
              onClick={handleSignIn}
              disabled={isLoading}
              className="gsi-material-button inline-flex items-center justify-center gap-2 px-3 py-1.5 bg-white hover:bg-slate-100 active:bg-slate-200 text-slate-800 text-xs font-semibold rounded-lg shadow-sm border border-slate-300 transition-colors cursor-pointer disabled:opacity-60"
            >
              <span>{isLoading ? 'Connecting…' : 'Sign in with Google'}</span>
            </button>
          )}
        </div>
      </div>

      {errorMessage && (
        <div className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-rose-950/60 border border-rose-800/80 text-rose-300 text-[11px]">
          <span>{errorMessage}</span>
          <button type="button" onClick={() => setErrorMessage(null)} className="text-rose-400 hover:text-rose-200 ml-2 font-mono">✕</button>
        </div>
      )}

      {showScopes && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="w-full max-w-md bg-[#0f1527] border border-slate-700 rounded-2xl p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-cyan-400" />
                Requested Google Workspace access
              </h3>
              <button type="button" onClick={() => setShowScopes(false)} className="text-slate-400 hover:text-slate-200 text-xs p-1">✕</button>
            </div>
            <p className="text-xs text-slate-400">
              These are scopes requested by the browser client. This view does not claim that every scope was granted. The provider access token is held in memory only and is discarded on reload, disconnect, or tab close.
            </p>
            <div className="space-y-2 pt-1">
              {requestedServices.map(({ name, icon: Icon, detail }) => (
                <div key={name} className="flex items-center gap-2 p-2 rounded-lg bg-slate-900 border border-slate-800 text-xs">
                  <Icon className="w-4 h-4 text-cyan-400 shrink-0" />
                  <div className="min-w-0">
                    <div className="text-slate-200 font-medium">{name}</div>
                    <div className="text-slate-500 text-[10px]">{detail}</div>
                  </div>
                  <span className="ml-auto text-[10px] text-slate-500">requested</span>
                </div>
              ))}
            </div>
            <div className="rounded-lg border border-amber-800/50 bg-amber-950/20 p-2 text-[10px] text-amber-200">
              Google Keep is not represented as a live OAuth capability here. Its current UI surface must remain preview-only until a supported connector contract is implemented.
            </div>
            <div className="pt-2 flex justify-end">
              <InHouseButton size="sm" onClick={() => setShowScopes(false)}>Close</InHouseButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
