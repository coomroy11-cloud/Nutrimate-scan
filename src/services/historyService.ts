import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  getDocs,
  onSnapshot,
  query,
  orderBy,
  writeBatch,
  DocumentData,
  QueryDocumentSnapshot,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { ScanResult } from '../types';

/**
 * Helper to convert a Firestore document snapshot into a type-safe ScanResult
 */
function docToScanResult(docSnap: QueryDocumentSnapshot<DocumentData>): ScanResult {
  const data = docSnap.data();
  return {
    id: docSnap.id,
    timestamp: typeof data.timestamp === 'number' ? data.timestamp : Date.now(),
    isReadable: data.isReadable ?? true,
    unreadableMessage: data.unreadableMessage || '',
    productType: data.productType || 'ไม่สามารถระบุได้',
    productName: data.productName || 'ไม่ระบุชื่อผลิตภัณฑ์',
    brandName: data.brandName || '',
    genericName: data.genericName || '',
    fdaNumber: data.fdaNumber || '',
    fdaValidation: data.fdaValidation,
    nutritionFacts: data.nutritionFacts,
    activeIngredients: Array.isArray(data.activeIngredients) ? data.activeIngredients : [],
    allergensFound: Array.isArray(data.allergensFound) ? data.allergensFound : [],
    contraindications: Array.isArray(data.contraindications) ? data.contraindications : [],
    drugInteractions: Array.isArray(data.drugInteractions) ? data.drugInteractions : [],
    directions: data.directions || '',
    expiryDate: data.expiryDate || '',
    warnings: Array.isArray(data.warnings) ? data.warnings : [],
    storageAdvice: data.storageAdvice || '',
    riskLevel: data.riskLevel || 'safe',
    riskSummaryText: data.riskSummaryText || '',
    userFriendlySummary: data.userFriendlySummary || '',
    actionableGuidance: Array.isArray(data.actionableGuidance) ? data.actionableGuidance : [],
    elderlyTips: data.elderlyTips || '',
    imageUrl: typeof data.imageUrl === 'string' && data.imageUrl.length < 500000 ? data.imageUrl : undefined,
    rawOcrText: data.rawOcrText || '',
    formattedMarkdownReport: data.formattedMarkdownReport || '',
  };
}

/**
 * Real-time listener for user scan history in Firestore: users/{userId}/scanHistory
 */
export function subscribeToUserHistory(
  userId: string,
  onUpdate: (history: ScanResult[]) => void,
  onError?: (err: any) => void
): () => void {
  if (!userId) {
    console.warn('[HistoryService] subscribeToUserHistory called with empty userId');
    onUpdate([]);
    return () => {};
  }

  const path = `users/${userId}/scanHistory`;
  console.log(`[HistoryService] Setting up real-time listener for ${path}`);

  try {
    const historyCol = collection(db, 'users', userId, 'scanHistory');
    const q = query(historyCol, orderBy('timestamp', 'desc'));

    let isFallback = false;

    const handleSnapshot = (snapshot: any) => {
      const items: ScanResult[] = [];
      snapshot.forEach((docSnap: QueryDocumentSnapshot<DocumentData>) => {
        items.push(docToScanResult(docSnap));
      });
      // Ensure sorted by timestamp descending
      items.sort((a, b) => b.timestamp - a.timestamp);
      console.log(`[HistoryService] Snapshot received: ${items.length} items for user ${userId}`);
      onUpdate(items);
    };

    const handleSnapshotError = (error: any) => {
      console.error(`[HistoryService] Firestore onSnapshot error at ${path}:`, {
        code: error?.code,
        message: error?.message,
      });

      if (!isFallback) {
        // In case ordering error occurs, retry with plain collection query
        console.warn(`[HistoryService] Retrying query without orderBy clause for ${path}...`);
        isFallback = true;
        try {
          return onSnapshot(
            historyCol,
            handleSnapshot,
            (fallbackErr) => {
              console.error(`[HistoryService] Fallback query also failed:`, fallbackErr);
              if (onError) onError(fallbackErr);
            }
          );
        } catch (fbErr) {
          console.error(`[HistoryService] Failed to establish fallback listener:`, fbErr);
        }
      }

      if (onError) onError(error);
    };

    const unsubscribe = onSnapshot(q, handleSnapshot, handleSnapshotError);
    return unsubscribe;
  } catch (err) {
    console.error(`[HistoryService] Exception setting up listener at ${path}:`, err);
    if (onError) onError(err);
    return () => {};
  }
}

/**
 * One-time fetch for user history on mount or restore
 */
export async function getUserHistoryOnce(userId: string): Promise<ScanResult[]> {
  if (!userId) return [];
  const path = `users/${userId}/scanHistory`;
  try {
    const historyCol = collection(db, 'users', userId, 'scanHistory');
    const q = query(historyCol, orderBy('timestamp', 'desc'));
    const snapshot = await getDocs(q);
    const items: ScanResult[] = [];
    snapshot.forEach((docSnap) => {
      items.push(docToScanResult(docSnap));
    });
    items.sort((a, b) => b.timestamp - a.timestamp);
    console.log(`[HistoryService] getUserHistoryOnce fetched ${items.length} records for ${userId}`);
    return items;
  } catch (err: any) {
    console.warn(`[HistoryService] getUserHistoryOnce failed with orderBy, trying fallback:`, err?.message);
    try {
      const historyCol = collection(db, 'users', userId, 'scanHistory');
      const snapshot = await getDocs(historyCol);
      const items: ScanResult[] = [];
      snapshot.forEach((docSnap) => {
        items.push(docToScanResult(docSnap));
      });
      items.sort((a, b) => b.timestamp - a.timestamp);
      return items;
    } catch (fallbackErr) {
      console.error(`[HistoryService] Fallback getUserHistoryOnce also failed:`, fallbackErr);
      return [];
    }
  }
}

/**
 * Save or update a single scan record in users/{userId}/scanHistory/{scanId}
 */
export async function saveScanToFirestore(
  userId: string,
  scanResult: ScanResult
): Promise<void> {
  if (!userId || !scanResult?.id) {
    console.warn('[HistoryService] saveScanToFirestore called with invalid userId or scanId');
    return;
  }

  // Ensure clean ID matching Firestore regex rules: ^[a-zA-Z0-9_\-]+$
  const safeId = scanResult.id.replace(/[^a-zA-Z0-9_\-]/g, '_');
  const path = `users/${userId}/scanHistory/${safeId}`;

  try {
    const docRef = doc(db, 'users', userId, 'scanHistory', safeId);
    const cleanPayload: Record<string, any> = {
      id: safeId,
      uid: userId,
      timestamp: typeof scanResult.timestamp === 'number' ? scanResult.timestamp : Date.now(),
      productType: scanResult.productType || 'ไม่สามารถระบุได้',
      productName: scanResult.productName || 'ไม่ระบุชื่อผลิตภัณฑ์',
      brandName: scanResult.brandName || '',
      genericName: scanResult.genericName || '',
      fdaNumber: scanResult.fdaNumber || '',
      directions: scanResult.directions || '',
      expiryDate: scanResult.expiryDate || '',
      riskLevel: scanResult.riskLevel || 'safe',
      riskSummaryText: scanResult.riskSummaryText || '',
      userFriendlySummary: scanResult.userFriendlySummary || '',
      warnings: Array.isArray(scanResult.warnings) ? scanResult.warnings : [],
      activeIngredients: Array.isArray(scanResult.activeIngredients) ? scanResult.activeIngredients : [],
      allergensFound: Array.isArray(scanResult.allergensFound) ? scanResult.allergensFound : [],
      contraindications: Array.isArray(scanResult.contraindications) ? scanResult.contraindications : [],
      drugInteractions: Array.isArray(scanResult.drugInteractions) ? scanResult.drugInteractions : [],
      actionableGuidance: Array.isArray(scanResult.actionableGuidance) ? scanResult.actionableGuidance : [],
      elderlyTips: scanResult.elderlyTips || '',
      rawOcrText: scanResult.rawOcrText || '',
      createdAt: new Date().toISOString(),
    };

    if (scanResult.fdaValidation) {
      cleanPayload.fdaValidation = scanResult.fdaValidation;
    }
    if (scanResult.nutritionFacts) {
      cleanPayload.nutritionFacts = scanResult.nutritionFacts;
    }
    // Only store thumbnail/preview image if reasonable size
    if (scanResult.imageUrl && scanResult.imageUrl.length < 500000) {
      cleanPayload.imageUrl = scanResult.imageUrl;
    }

    await setDoc(docRef, cleanPayload, { merge: true });
    console.log(`[HistoryService] Successfully saved scan ${safeId} to ${path}`);
  } catch (err) {
    console.error(`[HistoryService] Failed to save scan to ${path}:`, err);
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

/**
 * Delete a single scan item from users/{userId}/scanHistory/{scanId}
 */
export async function deleteScanFromFirestore(
  userId: string,
  scanId: string
): Promise<void> {
  if (!userId || !scanId) return;
  const safeId = scanId.replace(/[^a-zA-Z0-9_\-]/g, '_');
  const path = `users/${userId}/scanHistory/${safeId}`;
  try {
    const docRef = doc(db, 'users', userId, 'scanHistory', safeId);
    await deleteDoc(docRef);
    console.log(`[HistoryService] Deleted scan record at ${path}`);
  } catch (err) {
    console.error(`[HistoryService] Failed to delete scan at ${path}:`, err);
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}

/**
 * Clear all scan records for the current user in Firestore
 */
export async function clearUserHistoryFromFirestore(
  userId: string
): Promise<void> {
  if (!userId) return;
  const path = `users/${userId}/scanHistory`;
  try {
    const historyCol = collection(db, 'users', userId, 'scanHistory');
    const snapshot = await getDocs(historyCol);
    const batch = writeBatch(db);
    snapshot.forEach((d) => {
      batch.delete(d.ref);
    });
    await batch.commit();
    console.log(`[HistoryService] Successfully cleared all scans for user ${userId}`);
  } catch (err) {
    console.error(`[HistoryService] Failed to clear scans at ${path}:`, err);
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}
