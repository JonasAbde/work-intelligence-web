import { isExplicitPreviewMode } from '../../runtime/runtimeMode';
import { getAccessToken, getAppletApiKey } from './googleAuth';

declare global {
  interface Window {
    gapi?: any;
    google?: any;
  }
}

export interface PickedFileResult {
  id: string;
  name: string;
  url: string;
  mimeType: string;
  sizeBytes?: number;
}

export const loadGooglePickerScript = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (window.gapi && window.google?.picker) {
      resolve();
      return;
    }

    const loadPicker = () => {
      if (!window.gapi) {
        reject(new Error('Google API loader is unavailable.'));
        return;
      }
      window.gapi.load('picker', {
        callback: () => resolve(),
        onerror: () => reject(new Error('Google Picker module failed to load.')),
      });
    };

    const existingScript = document.getElementById('google-picker-script') as HTMLScriptElement | null;
    if (existingScript) {
      if (window.gapi) loadPicker();
      else {
        existingScript.addEventListener('load', loadPicker, { once: true });
        existingScript.addEventListener('error', () => reject(new Error('Google API script failed to load.')), { once: true });
      }
      return;
    }

    const script = document.createElement('script');
    script.id = 'google-picker-script';
    script.src = 'https://apis.google.com/js/api.js';
    script.async = true;
    script.defer = true;
    script.onload = loadPicker;
    script.onerror = () => reject(new Error('Google API script failed to load.'));
    document.head.appendChild(script);
  });
};

export const openGooglePicker = async (
  onPicked: (file: PickedFileResult) => void,
  onError?: (err: unknown) => void,
): Promise<boolean> => {
  if (isExplicitPreviewMode()) return false;

  try {
    const token = await getAccessToken();
    if (!token) throw new Error('Google Drive authorization required.');

    const apiKey = getAppletApiKey();
    if (!apiKey) throw new Error('Google Picker developer key is not configured.');

    await loadGooglePickerScript();
    if (!window.google?.picker) throw new Error('Google Picker API is unavailable after loading.');

    const pickerCallback = (data: any) => {
      if (data.action === window.google.picker.Action.PICKED) {
        const doc = data.docs?.[0];
        if (!doc) return;
        onPicked({
          id: doc.id,
          name: doc.name,
          url: doc.url,
          mimeType: doc.mimeType,
          sizeBytes: doc.sizeBytes,
        });
      }
    };

    const docsView = new window.google.picker.DocsView(window.google.picker.ViewId.DOCS)
      .setIncludeFolders(true)
      .setSelectFolderEnabled(false);
    const sheetsView = new window.google.picker.DocsView(window.google.picker.ViewId.SPREADSHEETS);

    const picker = new window.google.picker.PickerBuilder()
      .enableFeature(window.google.picker.Feature.NAV_HIDDEN)
      .setOAuthToken(token)
      .setDeveloperKey(apiKey)
      .addView(docsView)
      .addView(sheetsView)
      .setCallback(pickerCallback)
      .build();

    picker.setVisible(true);
    return true;
  } catch (err: unknown) {
    onError?.(err);
    throw err;
  }
};
