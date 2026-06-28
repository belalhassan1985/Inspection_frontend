import { useCallback, useEffect, useRef, useState, type Dispatch, type SetStateAction } from 'react';
import { findStructureNodeById, officialStructureTree } from './StructureTree';
import type { ElementStyleOverride } from './types';

const MAX_HISTORY_STEPS = 50;

type HistorySnapshot = {
  elementTextOverrides: Record<string, string>;
  elementStyleOverrides: Record<string, ElementStyleOverride>;
  selectedNodeId: string | null;
  manualPageBreaks: string[];
};

type UseDesignerHistoryParams = {
  elementTextOverrides: Record<string, string>;
  setElementTextOverrides: Dispatch<SetStateAction<Record<string, string>>>;
  elementStyleOverrides: Record<string, ElementStyleOverride>;
  setElementStyleOverrides: Dispatch<SetStateAction<Record<string, ElementStyleOverride>>>;
  selectedNodeId: string | null;
  setSelectedNodeId: Dispatch<SetStateAction<string | null>>;
  setSelectedNodeType: Dispatch<SetStateAction<string | null>>;
  setHighlightedStructureAnchorId: Dispatch<SetStateAction<string | null>>;
  manualPageBreaks: string[];
  setManualPageBreaks: Dispatch<SetStateAction<string[]>>;
};

export const useDesignerHistory = ({
  elementTextOverrides,
  setElementTextOverrides,
  elementStyleOverrides,
  setElementStyleOverrides,
  selectedNodeId,
  setSelectedNodeId,
  setSelectedNodeType,
  setHighlightedStructureAnchorId,
  manualPageBreaks,
  setManualPageBreaks,
}: UseDesignerHistoryParams) => {
  const historyPastRef = useRef<HistorySnapshot[]>([]);
  const historyFutureRef = useRef<HistorySnapshot[]>([]);
  const isUndoRedoRef = useRef(false);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  const snapshotCurrent = useCallback((): HistorySnapshot => ({
    elementTextOverrides,
    elementStyleOverrides,
    selectedNodeId,
    manualPageBreaks,
  }), [elementTextOverrides, elementStyleOverrides, selectedNodeId, manualPageBreaks]);

  useEffect(() => {
    if (isUndoRedoRef.current) {
      isUndoRedoRef.current = false;
    } else {
      const prevSnapshot = historyPastRef.current.length > 0
        ? historyPastRef.current[historyPastRef.current.length - 1]
        : null;
      const current: HistorySnapshot = { elementTextOverrides, elementStyleOverrides, selectedNodeId, manualPageBreaks };
      const changed = !prevSnapshot
        || prevSnapshot.elementTextOverrides !== current.elementTextOverrides
        || prevSnapshot.elementStyleOverrides !== current.elementStyleOverrides
        || prevSnapshot.selectedNodeId !== current.selectedNodeId
        || prevSnapshot.manualPageBreaks !== current.manualPageBreaks;
      if (changed) {
        const past = historyPastRef.current;
        if (past.length >= MAX_HISTORY_STEPS) past.shift();
        past.push(current);
        historyFutureRef.current = [];
      }
    }
    setCanUndo(historyPastRef.current.length > 0);
    setCanRedo(historyFutureRef.current.length > 0);
  }, [elementTextOverrides, elementStyleOverrides, selectedNodeId, manualPageBreaks]);

  const clearHistory = useCallback(() => {
    historyPastRef.current = [];
    historyFutureRef.current = [];
    setCanUndo(false);
    setCanRedo(false);
  }, []);

  const undo = useCallback(() => {
    const past = historyPastRef.current;
    if (past.length === 0) return;
    const current = snapshotCurrent();
    historyFutureRef.current.push(current);
    const snapshot = past.pop()!;
    isUndoRedoRef.current = true;
    setElementTextOverrides(snapshot.elementTextOverrides);
    setElementStyleOverrides(snapshot.elementStyleOverrides);
    setSelectedNodeId(snapshot.selectedNodeId);
    setManualPageBreaks(snapshot.manualPageBreaks);
    if (snapshot.selectedNodeId) {
      const node = findStructureNodeById(officialStructureTree, snapshot.selectedNodeId);
      if (node) {
        setSelectedNodeType(node.type);
        setHighlightedStructureAnchorId(node.canvasAnchorId || null);
      }
    }
    setCanUndo(past.length > 0);
    setCanRedo(true);
  }, [snapshotCurrent]);

  const redo = useCallback(() => {
    const future = historyFutureRef.current;
    if (future.length === 0) return;
    const current = snapshotCurrent();
    historyPastRef.current.push(current);
    const snapshot = future.pop()!;
    isUndoRedoRef.current = true;
    setElementTextOverrides(snapshot.elementTextOverrides);
    setElementStyleOverrides(snapshot.elementStyleOverrides);
    setSelectedNodeId(snapshot.selectedNodeId);
    setManualPageBreaks(snapshot.manualPageBreaks);
    if (snapshot.selectedNodeId) {
      const node = findStructureNodeById(officialStructureTree, snapshot.selectedNodeId);
      if (node) {
        setSelectedNodeType(node.type);
        setHighlightedStructureAnchorId(node.canvasAnchorId || null);
      }
    }
    setCanUndo(true);
    setCanRedo(future.length > 0);
  }, [snapshotCurrent]);

  // ?? Undo/Redo keyboard shortcuts ??
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const mod = e.ctrlKey || e.metaKey;
      if (!mod) return;
      if (e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
      } else if (e.key === 'y' || (e.key === 'z' && e.shiftKey)) {
        e.preventDefault();
        redo();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [undo, redo]);

  return {
    canUndo,
    canRedo,
    clearHistory,
    undo,
    redo,
  };
};
