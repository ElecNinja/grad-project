import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { supabase } from '../config/supabaseClient';

/**
 * PresenceContext
 * ───────────────
 * Single source of truth for the "online-users" Supabase Presence channel.
 *
 * • Router.jsx broadcasts (track) on this channel for every logged-in user.
 * • Any component that calls useOnlineIds() reads the live Set of online user IDs.
 *
 * Wrap the app with <PresenceProvider> (already done in Router → AppLayout).
 * If the provider is absent, the hook returns an empty Set (safe fallback).
 */

const PresenceContext = createContext(new Set());

export function PresenceProvider({ userId, role, children }) {
  const [onlineIds, setOnlineIds] = useState(new Set());
  const channelRef = useRef(null);

  useEffect(() => {
    // Create the single shared channel
    const channel = supabase.channel('online-users', {
      config: { presence: { key: userId || 'anonymous' } },
    });

    channelRef.current = channel;

    const sync = () => {
      const state = channel.presenceState();
      const ids = new Set();
      Object.values(state)
        .flat()
        .forEach((p) => { if (p?.user_id) ids.add(p.user_id); });
      setOnlineIds(ids);
    };

    channel
      .on('presence', { event: 'sync' }, sync)
      .on('presence', { event: 'join' }, sync)
      .on('presence', { event: 'leave' }, sync)
      .subscribe((status) => {
        if (status !== 'SUBSCRIBED') return;
        // Track self only if logged in
        if (userId) {
          channel.track({ user_id: userId, role, online_at: new Date().toISOString() });
        }
      });

    return () => {
      channel.untrack();
      supabase.removeChannel(channel);
    };
  }, [userId, role]);

  return (
    <PresenceContext.Provider value={onlineIds}>
      {children}
    </PresenceContext.Provider>
  );
}

/**
 * useOnlineIds() — returns the live Set<string> of online user IDs.
 * Safe to call from any component inside <PresenceProvider>.
 */
export function useOnlineIds() {
  return useContext(PresenceContext);
}
