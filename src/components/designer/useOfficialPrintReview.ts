import { useState, useCallback, useRef } from 'react';
import { apiFetch } from '../../services/api';

export type ReviewState = 'idle' | 'generating' | 'ready' | 'confirmed' | 'stale' | 'error';

export interface ReviewPageMeta {
  pageNumber: number;
  startsWith: string;
  endsWith: string;
  textLength: number;
}

export interface ReviewWarning {
  type: string;
  page: number;
  message: string;
}

export interface ReviewSessionData {
  id: string;
  campaignId: string;
  state: ReviewState;
  pageCount: number;
  warnings: ReviewWarning[];
  createdAt: string;
  confirmedAt: string | null;
  generationDurationMs: number;
}

export interface ReviewArtifactData {
  pdf: string;
  session: ReviewSessionData;
}

export interface UseOfficialPrintReviewReturn {
  reviewState: ReviewState;
  reviewSession: ReviewSessionData | null;
  pdfBlobUrl: string | null;
  errorMessage: string;
  generateReview: (campaignId: string, payload?: Record<string, unknown>) => Promise<void>;
  confirmReview: (campaignId: string) => Promise<void>;
  discardReview: (campaignId: string) => Promise<void>;
  reset: () => void;
}

export const useOfficialPrintReview = (): UseOfficialPrintReviewReturn => {
  const [reviewState, setReviewState] = useState<ReviewState>('idle');
  const [reviewSession, setReviewSession] = useState<ReviewSessionData | null>(null);
  const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const blobUrlRef = useRef<string | null>(null);

  const revokeBlobUrl = useCallback(() => {
    if (blobUrlRef.current) {
      window.URL.revokeObjectURL(blobUrlRef.current);
      blobUrlRef.current = null;
    }
  }, []);

  const generateReview = useCallback(async (campaignId: string, payload?: Record<string, unknown>) => {
    setReviewState('generating');
    setErrorMessage('');
    revokeBlobUrl();
    setPdfBlobUrl(null);
    setReviewSession(null);

    try {
      const body = payload && Object.keys(payload).length > 0 ? payload : undefined;
      const data: ReviewArtifactData = await apiFetch(`/reports/campaign/${campaignId}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body || {}),
      });

      const pdfBinary = atob(data.pdf);
      const pdfBytes = new Uint8Array(pdfBinary.length);
      for (let i = 0; i < pdfBinary.length; i++) {
        pdfBytes[i] = pdfBinary.charCodeAt(i);
      }
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      blobUrlRef.current = url;
      setPdfBlobUrl(url);
      setReviewSession(data.session);
      setReviewState(data.session.state as ReviewState);
    } catch (err: any) {
      const msg = err?.message || 'فشل توليد المراجعة';
      setErrorMessage(msg);
      setReviewState('error');
    }
  }, [revokeBlobUrl]);

  const confirmReview = useCallback(async (campaignId: string) => {
    if (!reviewSession) return;
    setReviewState('confirmed');
    try {
      const session: ReviewSessionData = await apiFetch(`/reports/campaign/${campaignId}/review/confirm`, {
        method: 'POST',
      });
      setReviewSession(session);
      setReviewState('confirmed');
    } catch (err: any) {
      const msg = err?.message || 'فشل تأكيد المراجعة';
      setErrorMessage(msg);
      setReviewState('error');
    }
  }, [reviewSession]);

  const discardReview = useCallback(async (campaignId: string) => {
    try {
      await apiFetch(`/reports/campaign/${campaignId}/review`, {
        method: 'DELETE',
      });
    } catch {
      // silently ignore discard errors
    }
    reset();
  }, []);

  const reset = useCallback(() => {
    revokeBlobUrl();
    setReviewState('idle');
    setReviewSession(null);
    setPdfBlobUrl(null);
    setErrorMessage('');
  }, [revokeBlobUrl]);

  return {
    reviewState,
    reviewSession,
    pdfBlobUrl,
    errorMessage,
    generateReview,
    confirmReview,
    discardReview,
    reset,
  };
};
