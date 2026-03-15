"use client";

import { useState, useCallback, useRef } from 'react';

export type VoteType = 'add' | 'confused' | 'reduce' | 'remove';

export interface VoteData {
  vote?: VoteType;
  counts: Record<VoteType, number>;
}

type VoteCache = {
  [itemId: string]: VoteData;
};

const emptyVoteData = (): VoteData => ({
  counts: { add: 0, confused: 0, reduce: 0, remove: 0 },
});

function mergeApiCounts(raw: Record<string, number>): Record<VoteType, number> {
  return {
    add: raw['add'] ?? 0,
    confused: raw['confused'] ?? 0,
    reduce: raw['reduce'] ?? 0,
    remove: raw['remove'] ?? 0,
  };
}

export function useVotes() {
  const [cache, setCache] = useState<VoteCache>({});
  // Track in-flight fetches so we don't double-fetch
  const fetchingRef = useRef<Set<string>>(new Set());

  const fetchVoteData = useCallback(async (itemId: string) => {
    if (fetchingRef.current.has(itemId)) return;
    fetchingRef.current.add(itemId);
    try {
      const res = await fetch(`/api/votes?itemId=${encodeURIComponent(itemId)}`);
      if (!res.ok) return;
      const data = (await res.json()) as { counts: Record<string, number>; userVote: string | null };
      setCache(prev => ({
        ...prev,
        [itemId]: {
          vote: (data.userVote as VoteType) ?? undefined,
          counts: mergeApiCounts(data.counts),
        },
      }));
    } catch {
      // API unavailable — leave defaults in place (graceful degradation)
    } finally {
      fetchingRef.current.delete(itemId);
    }
  }, []);

  const castVote = useCallback(async (itemId: string, voteType: VoteType) => {
    // Optimistic update
    setCache(prev => {
      const current = prev[itemId] ?? emptyVoteData();
      const prevVote = current.vote;
      const newCounts = { ...current.counts };

      if (prevVote === voteType) {
        // Toggle off
        newCounts[voteType] = Math.max(0, newCounts[voteType] - 1);
        return { ...prev, [itemId]: { counts: newCounts } };
      }

      if (prevVote) {
        newCounts[prevVote] = Math.max(0, newCounts[prevVote] - 1);
      }
      newCounts[voteType] = (newCounts[voteType] ?? 0) + 1;
      return { ...prev, [itemId]: { vote: voteType, counts: newCounts } };
    });

    try {
      const res = await fetch('/api/votes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId, voteType }),
      });
      if (!res.ok) return;
      const data = (await res.json()) as { counts: Record<string, number>; userVote: string | null };
      // Reconcile with server response
      setCache(prev => ({
        ...prev,
        [itemId]: {
          vote: (data.userVote as VoteType) ?? undefined,
          counts: mergeApiCounts(data.counts),
        },
      }));
    } catch {
      // API unavailable — optimistic update stays
    }
  }, []);

  const getVoteData = useCallback(
    (itemId: string): VoteData => {
      if (!(itemId in cache)) {
        // Kick off a fetch without blocking render
        fetchVoteData(itemId);
        return emptyVoteData();
      }
      return cache[itemId];
    },
    [cache, fetchVoteData],
  );

  return { castVote, getVoteData };
}
