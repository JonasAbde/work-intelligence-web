import { getAccessToken, getAppletApiKey } from './googleAuth';

declare global {
  interface Window {
    gapi?: any;
    google?: any;
  }
}

export const loadGooglePickerScript = (): Promise<void> => {
  return new Promise((resolve) => {
    if (window.gapi && window.google?.picker) {
      resolve();
      return;
    }

    const existingScript = document.getElementById('google-picker-script');
    if (existingScript) {
      if (window.gapi) {
        window.gapi.load('picker', () => {
          resolve();
        });
      } else {
        existingScript.addEventListener('load', () => {
          window.gapi?.load('picker', () => {
            resolve();
          });
        });
      }
      return;
    }

    const script = document.createElement('script');
    script.id = 'google-picker-script';
    script.src = 'https://apis.google.com/js/api.js';
    script.onload = () => {
      window.gapi.load('picker', () => {
        resolve();
      });
    };
    script.onerror = () => {
      console.warn('Could not load Google Picker script via CDN.');
      resolve();
    };
    document.body.appendChild(script);
  });
};

export interface PickedFileResult {
  id: string;
  name: string;
  url: string;
  mimeType: string;
  sizeBytes?: number;
}

export const openGooglePicker = async (
  onPicked: (file: PickedFileResult) => void,
  onError?: (err: any) => void
): Promise<boolean> => {
  try {
    const token = await getAccessToken();
    const apiKey = getAppletApiKey();

    if (!token) {
      return false; // Caller should fallback to In-House Picker dialog
    }

    await loadGooglePickerScript();

    if (!window.google?.picker) {
      return false;
    }

    const pickerCallback = (data: any) => {
      if (data.action === window.google.picker.Action.PICKED) {
        const doc = data.docs[0];
        onPicked({
          id: doc.id,
          name: doc.name,
          url: doc.url,
          mimeType: doc.mimeType,
          sizeBytes: doc.sizeBytes,
        });
      }
    };

    const viewDocs = new window.google.picker.DocsView(window.google.picker.ViewId.DOCS)
      .setIncludeFolders(true)
      .setSelectFolderEnabled(false);

    const viewSheets = new window.google.picker.DocsView(window.google.picker.ViewId.SPREADSHEETS);

    const builder = new window.google.picker.PickerBuilder()
      .enableFeature(window.google.picker.Feature.NAV_HIDDEN)
      .enableFeature(window.google.picker.Feature.MULTISELECT_ENABLED)
      .setAppId(apiKey)
      .setOAuthToken(token)
      .addView(viewDocs)
      .addView(viewSheets)
      .setDeveloperKey(apiKey)
      .setCallback(pickerCallback);

    const picker = builder.build();
    picker.setVisible(true);
    return true;
  } catch (err) {
    console.warn('Error launching Google Picker builder:', err);
    if (onError) onError(err);
    return false;
  }
};
