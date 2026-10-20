// Amarbold owns file storage; Narmandakh owns the HTTP upload controller.
// A concrete filesystem/object-storage adapter will implement this in weeks 10–11.
export interface StoredPhoto {
  storageKey: string;
  mimeType: 'image/jpeg' | 'image/png';
  bytes: number;
}
export interface FileStore {
  save(content: Buffer, mimeType: StoredPhoto['mimeType']): Promise<StoredPhoto>;
  read(storageKey: string): Promise<Buffer>;
  remove(storageKey: string): Promise<void>;
}
