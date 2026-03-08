"use client";

import { useState, useCallback, useEffect } from 'react';

export type VoteType = 'add' | 'confused' | 'reduce' | 'remove';

export interface VoteData {
  [itemId: string]: {
    vote?: VoteType;        // user's own vote (one per item)
    counts: Record<VoteType, number>;  // aggregated counts
  };
}

const STORAGE_KEY = 'narasalim-votes';

function loadVotes(): VoteData {
  if (typeof window === 'undefined') return {};
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
}

function saveVotes(data: VoteData): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // localStorage full or unavailable
  }
}

export function useVotes() {
  const [votes, setVotes] = useState<VoteData>({});

  // Load from localStorage on mount
  useEffect(() => {
    setVotes(loadVotes());
  }, []);

  const castVote = useCallback((itemId: string, voteType: VoteType) => {
    setVotes(prev => {
      const itemVotes = prev[itemId] || { counts: { add: 0, confused: 0, reduce: 0, remove: 0 } };
      const previousVote = itemVotes.vote;

      // If clicking same vote type, toggle off
      if (previousVote === voteType) {
        const newCounts = { ...itemVotes.counts };
        newCounts[voteType] = Math.max(0, newCounts[voteType] - 1);
        const newData = {
          ...prev,
          [itemId]: { counts: newCounts },
        };
        saveVotes(newData);
        return newData;
      }

      // Otherwise, switch vote
      const newCounts = { ...itemVotes.counts };
      if (previousVote) {
        newCounts[previousVote] = Math.max(0, newCounts[previousVote] - 1);
      }
      newCounts[voteType] = (newCounts[voteType] || 0) + 1;

      const newData = {
        ...prev,
        [itemId]: { vote: voteType, counts: newCounts },
      };
      saveVotes(newData);
      return newData;
    });
  }, []);

  const getVoteData = useCallback((itemId: string) => {
    return votes[itemId] || { counts: { add: 0, confused: 0, reduce: 0, remove: 0 } };
  }, [votes]);

  return { castVote, getVoteData };
}
