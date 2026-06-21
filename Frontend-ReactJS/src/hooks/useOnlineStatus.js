import { useEffect, useState } from 'react';
import { supabase } from '../config/supabaseClient';

/**
 * Subscribes to the global "online-users" Supabase Presence channel
 * and returns a Set of user IDs that are currently online.
 *
 * Uses a separate named instance ("online-users-observer") so it does NOT
 * conflict with the broadcaster channel in Router.jsx. Both channel names
 * connect to the same Realtime topic "realtime:online-users" on the server,
 * so presence events are shared correctly.
 *
 * Usage:
 *   const onlineIds = useOnlineStatus();
 *   const isOnline = onlineIds.has(someUserId);
 */
export function useOnlineStatus() {
  const [onlineIds, setOnlineIds] = useState(new Set());

  useEffect(() => {
    // Distinct local name avoids Supabase client-side channel collision
    // with the broadcaster in Router.jsx ('online-users').
    const channel = supabase.channel('online-users-observer');

    const syncPresence = () => {
      const state = channel.presenceState();
      const ids = new Set();
      Object.values(state)
        .flat()
        .forEach((presence) => {
          if (presence?.user_id) ids.add(presence.user_id);
        });
      setOnlineIds(ids);
    };

    channel
      .on('presence', { event: 'sync' }, syncPresence)
      .on('presence', { event: 'join' }, syncPresence)
      .on('presence', { event: 'leave' }, syncPresence)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return onlineIds;
}
