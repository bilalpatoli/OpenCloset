type PendingUpload = {
  base64: string;
  mediaType: 'image/jpeg' | 'image/png' | 'image/webp';
} | null;

let pending: PendingUpload = null;

export const uploadStore = {
  set(base64: string, mediaType: 'image/jpeg' | 'image/png' | 'image/webp') {
    pending = { base64, mediaType };
  },
  get(): PendingUpload {
    return pending;
  },
  clear() {
    pending = null;
  },
};
