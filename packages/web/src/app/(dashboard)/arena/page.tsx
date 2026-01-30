'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useArenaStore } from '@/stores/arena';
import { useAuthStore } from '@/stores/auth';

const statusColors: Record<string, string> = {
  waiting: 'text-yellow-400 border-yellow-400/30 bg-yellow-400/10',
  active: 'text-green-400 border-green-400/30 bg-green-400/10',
  completed: 'text-white/40 border-white/10 bg-white/5',
  cancelled: 'text-red-400 border-red-400/30 bg-red-400/10',
};

export default function ArenaPage() {
  const { rooms, fetchRooms, deleteRoom, isLoading, error } = useArenaStore();
  const user = useAuthStore((s) => s.user);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    fetchRooms();
  }, [fetchRooms]);

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this arena room?')) return;
    setDeleting(id);
    try {
      await deleteRoom(id);
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-xl font-medium">Arena</h1>
          <p className="text-xs text-white/40 mt-1">
            Pit your agent against others in live multiplayer debates
          </p>
        </div>
        <Link
          href="/arena/new"
          className="bg-orange-500 hover:bg-orange-600 text-black text-xs font-medium px-4 py-2 transition-colors"
        >
          create arena
        </Link>
      </div>

      {isLoading && rooms.length === 0 && (
        <div className="text-center py-20 text-white/40 text-sm">Loading arenas...</div>
      )}

      {error && (
        <div className="border border-red-500/30 bg-red-500/10 p-4 mb-6 text-sm text-red-400">
          {error}
        </div>
      )}

      {!isLoading && rooms.length === 0 && (
        <div className="text-center py-20 border border-white/5">
          <p className="text-white/40 text-sm">No arena rooms yet</p>
          <p className="text-white/20 text-xs mt-2">Create one to start a live debate</p>
        </div>
      )}

      <div className="space-y-3">
        {rooms.map((room) => (
          <Link
            key={room.id}
            href={`/arena/${room.id}`}
            className="block border border-white/10 hover:border-white/20 p-4 transition-colors group"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-1">
                  <h3 className="text-sm font-medium truncate">{room.title}</h3>
                  <span
                    className={`text-[10px] px-2 py-0.5 border font-mono ${statusColors[room.status] || 'text-white/40'}`}
                  >
                    {room.status}
                  </span>
                </div>
                <p className="text-xs text-white/40 truncate">{room.topic}</p>
                <div className="flex items-center gap-4 mt-3">
                  <span className="text-[10px] text-white/30">
                    {room._count.participants}/{room.maxParticipants} participants
                  </span>
                  <span className="text-[10px] text-white/30">
                    {room.totalRounds} rounds
                  </span>
                  <span className="text-[10px] text-white/30">
                    by {room.createdBy.username || room.createdBy.email}
                  </span>
                </div>
                {room.participants.length > 0 && (
                  <div className="flex items-center gap-2 mt-2">
                    {room.participants.map((p) => (
                      <div
                        key={p.id}
                        className="flex items-center gap-1.5 border border-white/10 px-2 py-0.5"
                      >
                        <div
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: p.agent.avatarColor }}
                        />
                        <span className="text-[10px] text-white/60">{p.agent.name}</span>
                        {p.isReady && (
                          <span className="text-[10px] text-green-400">ready</span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {room.createdById === user?.id && room.status === 'waiting' && (
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    handleDelete(room.id);
                  }}
                  disabled={deleting === room.id}
                  className="text-[10px] text-white/30 hover:text-red-400 transition-colors ml-4"
                >
                  {deleting === room.id ? '...' : 'delete'}
                </button>
              )}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
