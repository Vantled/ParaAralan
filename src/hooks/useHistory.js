import { useState, useCallback } from 'react';

function useHistory(initialState) {
  const [index, setIndex] = useState(0);
  const [history, setHistory] = useState([initialState]);

  const setState = useCallback((action) => {
    const newState = typeof action === 'function' ? action(history[index]) : action;
    const historyCopy = history.slice(0, index + 1);
    historyCopy.push(newState);
    setHistory(historyCopy);
    setIndex(historyCopy.length - 1);
  }, [index, history]);

  const undo = useCallback(() => {
    if (index > 0) {
      setIndex(index - 1);
      return true;
    }
    return false;
  }, [index]);

  const redo = useCallback(() => {
    if (index < history.length - 1) {
      setIndex(index + 1);
      return true;
    }
    return false;
  }, [index, history.length]);

  const canUndo = index > 0;
  const canRedo = index < history.length - 1;

  return {
    state: history[index],
    setState,
    undo,
    redo,
    canUndo,
    canRedo,
  };
}

export default useHistory; 