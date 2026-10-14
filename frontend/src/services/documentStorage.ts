import { Platform, Share } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import {
  StoredDocument,
  CreateDocumentInput,
  DocumentStats,
  DocumentCategory,
  DocumentFileType,
} from '../types';

const META_FILE_NAME = 'documents_meta.json';
const WEB_STORAGE_KEY = 'user_documents_meta';
const DOCS_DIR_NAME = 'documents/';

/**
 * Determine file type based on mime type or file extension
 */
export const detectFileType = (fileName: string, mimeType?: string): DocumentFileType => {
  const mime = (mimeType || '').toLowerCase();
  const name = (fileName || '').toLowerCase();

  if (
    mime.startsWith('image/') ||
    name.endsWith('.jpg') ||
    name.endsWith('.jpeg') ||
    name.endsWith('.png') ||
    name.endsWith('.webp') ||
    name.endsWith('.heic') ||
    name.endsWith('.bmp')
  ) {
    return 'image';
  }

  if (mime.includes('pdf') || name.endsWith('.pdf')) {
    return 'pdf';
  }

  return 'other';
};

/**
 * Format bytes to readable string (KB, MB)
 */
export const formatBytes = (bytes?: number): string => {
  if (!bytes || bytes <= 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
};

class DocumentStorageService {
  private isInitialized = false;

  private getBaseDir(): string | null {
    if (Platform.OS === 'web') return null;
    return FileSystem.documentDirectory ? `${FileSystem.documentDirectory}${DOCS_DIR_NAME}` : null;
  }

  private getMetaFilePath(): string | null {
    if (Platform.OS === 'web') return null;
    return FileSystem.documentDirectory ? `${FileSystem.documentDirectory}${META_FILE_NAME}` : null;
  }

  /**
   * Ensure directory exists on native
   */
  public async init(): Promise<void> {
    if (this.isInitialized) return;

    if (Platform.OS !== 'web') {
      try {
        const baseDir = this.getBaseDir();
        if (baseDir) {
          const info = await FileSystem.getInfoAsync(baseDir);
          if (!info.exists) {
            await FileSystem.makeDirectoryAsync(baseDir, { intermediates: true });
          }
        }
      } catch (err) {
        console.warn('Error creating document directory:', err);
      }
    }

    this.isInitialized = true;
  }

  /**
   * Read metadata from disk / localStorage
   */
  private async readMeta(): Promise<StoredDocument[]> {
    try {
      if (Platform.OS === 'web') {
        if (typeof window !== 'undefined' && window.localStorage) {
          const raw = window.localStorage.getItem(WEB_STORAGE_KEY);
          return raw ? JSON.parse(raw) : [];
        }
        return [];
      }

      const metaPath = this.getMetaFilePath();
      if (!metaPath) return [];

      const info = await FileSystem.getInfoAsync(metaPath);
      if (!info.exists) {
        return [];
      }

      const raw = await FileSystem.readAsStringAsync(metaPath);
      if (!raw) return [];

      return JSON.parse(raw);
    } catch (err) {
      console.warn('Failed to read documents metadata:', err);
      return [];
    }
  }

  /**
   * Save metadata to disk / localStorage
   */
  private async writeMeta(docs: StoredDocument[]): Promise<void> {
    try {
      const json = JSON.stringify(docs, null, 2);

      if (Platform.OS === 'web') {
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.setItem(WEB_STORAGE_KEY, json);
        }
        return;
      }

      const metaPath = this.getMetaFilePath();
      if (!metaPath) return;

      await FileSystem.writeAsStringAsync(metaPath, json);
    } catch (err) {
      console.warn('Failed to write documents metadata:', err);
      throw err;
    }
  }

  /**
   * Fetch all stored documents (sorted by pinned first, then newest)
   */
  public async getAll(): Promise<StoredDocument[]> {
    await this.init();
    const docs = await this.readMeta();

    return docs.sort((a, b) => {
      if (a.isFavorite && !b.isFavorite) return -1;
      if (!a.isFavorite && b.isFavorite) return 1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }

  /**
   * Add and save a new document locally into device storage
   */
  public async saveDocument(input: CreateDocumentInput): Promise<StoredDocument> {
    await this.init();

    const id = `doc_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    const now = new Date().toISOString();
    const fileType = detectFileType(input.fileName, input.mimeType);

    let destinationUri = input.sourceUri;
    let actualSize = input.fileSizeBytes || 0;

    // On native, copy the file to safe persistent app directory
    if (Platform.OS !== 'web') {
      const baseDir = this.getBaseDir();
      if (baseDir) {
        const sanitizedName = input.fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
        const targetFileName = `${Date.now()}_${sanitizedName}`;
        destinationUri = `${baseDir}${targetFileName}`;

        try {
          await FileSystem.copyAsync({
            from: input.sourceUri,
            to: destinationUri,
          });

          const info = await FileSystem.getInfoAsync(destinationUri);
          if (info.exists && typeof info.size === 'number') {
            actualSize = info.size;
          }
        } catch (copyErr) {
          console.warn('File copy failed, falling back to source URI:', copyErr);
          destinationUri = input.sourceUri;
        }
      }
    }

    const newDoc: StoredDocument = {
      id,
      title: input.title.trim(),
      category: input.category,
      documentNumber: input.documentNumber?.trim() || undefined,
      fileUri: destinationUri,
      fileName: input.fileName,
      fileType,
      mimeType: input.mimeType,
      fileSizeBytes: actualSize,
      notes: input.notes?.trim() || undefined,
      issueDate: input.issueDate || undefined,
      expiryDate: input.expiryDate || undefined,
      isFavorite: !!input.isFavorite,
      createdAt: now,
      updatedAt: now,
    };

    const currentDocs = await this.readMeta();
    currentDocs.unshift(newDoc);
    await this.writeMeta(currentDocs);

    return newDoc;
  }

  /**
   * Update an existing document
   */
  public async updateDocument(
    id: string,
    updates: Partial<Omit<StoredDocument, 'id' | 'createdAt' | 'fileUri' | 'fileName' | 'fileType'>>
  ): Promise<StoredDocument | null> {
    const docs = await this.readMeta();
    const index = docs.findIndex((d) => d.id === id);
    if (index === -1) return null;

    const updated: StoredDocument = {
      ...docs[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    docs[index] = updated;
    await this.writeMeta(docs);
    return updated;
  }

  /**
   * Toggle pinned/favorite status
   */
  public async toggleFavorite(id: string): Promise<boolean> {
    const docs = await this.readMeta();
    const index = docs.findIndex((d) => d.id === id);
    if (index === -1) return false;

    const newState = !docs[index].isFavorite;
    docs[index].isFavorite = newState;
    docs[index].updatedAt = new Date().toISOString();

    await this.writeMeta(docs);
    return newState;
  }

  /**
   * Delete a document completely (removes physical file from device storage)
   */
  public async deleteDocument(id: string): Promise<boolean> {
    const docs = await this.readMeta();
    const target = docs.find((d) => d.id === id);
    if (!target) return false;

    // Delete local physical file if it exists and is in documents directory
    if (Platform.OS !== 'web' && target.fileUri) {
      try {
        const info = await FileSystem.getInfoAsync(target.fileUri);
        if (info.exists) {
          await FileSystem.deleteAsync(target.fileUri, { idempotent: true });
        }
      } catch (fileErr) {
        console.warn('Could not delete physical document file:', fileErr);
      }
    }

    const filtered = docs.filter((d) => d.id !== id);
    await this.writeMeta(filtered);
    return true;
  }

  /**
   * Native Document Share functionality ("open krne pe share ho sake")
   */
  public async shareDocument(doc: StoredDocument): Promise<boolean> {
    try {
      const isSharingAvailable = await Sharing.isAvailableAsync().catch(() => false);

      if (isSharingAvailable && doc.fileUri && Platform.OS !== 'web') {
        await Sharing.shareAsync(doc.fileUri, {
          mimeType: doc.mimeType || 'application/octet-stream',
          dialogTitle: `Share ${doc.title}`,
          UTI: doc.fileType === 'pdf' ? 'com.adobe.pdf' : undefined,
        });
        return true;
      }

      // Fallback via React Native Share API
      let message = `Document: ${doc.title}`;
      if (doc.documentNumber) {
        message += `\nNumber: ${doc.documentNumber}`;
      }
      if (doc.notes) {
        message += `\nNotes: ${doc.notes}`;
      }

      await Share.share({
        title: doc.title,
        message,
        url: doc.fileUri,
      });

      return true;
    } catch (err: any) {
      if (err.message && err.message.includes('User did not share')) {
        return false;
      }
      console.warn('Failed to share document:', err);
      throw err;
    }
  }

  /**
   * Compute comprehensive document stats & storage usage
   */
  public async getStats(): Promise<DocumentStats> {
    const docs = await this.readMeta();

    const categoriesCount: Record<DocumentCategory, number> = {
      identity: 0,
      education: 0,
      finance: 0,
      health: 0,
      vehicle: 0,
      bills: 0,
      other: 0,
    };

    let totalSizeBytes = 0;
    let favorites = 0;

    for (const doc of docs) {
      if (doc.isFavorite) favorites++;
      if (doc.fileSizeBytes) totalSizeBytes += doc.fileSizeBytes;
      if (categoriesCount[doc.category] !== undefined) {
        categoriesCount[doc.category]++;
      } else {
        categoriesCount.other++;
      }
    }

    return {
      total: docs.length,
      favorites,
      categoriesCount,
      totalSizeBytes,
    };
  }

  /**
   * Clean all documents (for privacy reset / logout / clear data)
   */
  public async clearAll(): Promise<void> {
    const docs = await this.readMeta();

    if (Platform.OS !== 'web') {
      for (const doc of docs) {
        try {
          if (doc.fileUri) {
            await FileSystem.deleteAsync(doc.fileUri, { idempotent: true });
          }
        } catch {}
      }
    }

    await this.writeMeta([]);
  }
}

export const documentStorage = new DocumentStorageService();
