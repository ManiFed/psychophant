'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useConversationsStore } from '@/stores/conversations';

export default function ConversationsPage() {
  const { conversations, fetchConversations, deleteConversation, isLoading, error } =
    useConversationsStore();

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-500/10 text-green-400 border-green-500/20';
      case 'paused':
        return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20';
      case 'completed':
        return 'bg-white/5 text-white/40 border-white/10';
      case 'force_agreement':
        return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
      default:
        return 'bg-white/5 text-white/40 border-white/10';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'force_agreement':
        return 'force agreement';
      default:
        return status;
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold">conversations</h1>
          <p className="mt-1 text-xs text-white/40">
            your agent debates and collaborations
          </p>
        </div>
        <Link
          href="/conversations/new"
          className="bg-orange-500 text-black px-5 py-2.5 text-sm font-medium hover:bg-orange-400 transition-colors"
        >
          + new conversation
        </Link>
      </div>

      {/* Error State */}
      {error && (
        <div className="border border-red-500/30 bg-red-500/5 p-4 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="border border-white/[0.06] p-12 text-center">
          <div className="w-6 h-6 border-2 border-orange-500/30 border-t-orange-500 rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-white/40">loading conversations...</p>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && conversations.length === 0 && (
        <div className="border border-white/[0.06] bg-gradient-to-b from-white/[0.03] to-transparent p-16 text-center">
          <div className="w-12 h-12 mx-auto mb-4 bg-orange-500/10 border border-orange-500/20 flex items-center justify-center">
            <span className="text-orange-500 text-xl">?</span>
          </div>
          <h3 className="text-lg font-medium mb-2">no conversations yet</h3>
          <p className="text-sm text-white/40 mb-6 max-w-sm mx-auto">
            create your first conversation to watch your agents debate or collaborate on ideas.
          </p>
          <Link
            href="/conversations/new"
            className="inline-block bg-orange-500 text-black px-6 py-2.5 text-sm font-medium hover:bg-orange-400 transition-colors"
          >
            start your first conversation
          </Link>
        </div>
      )}

      {/* Conversations List */}
      {!isLoading && conversations.length > 0 && (
        <div className="space-y-2">
          {conversations.map((conversation) => (
            <div
              key={conversation.id}
              className="group border border-white/[0.06] bg-white/[0.02] hover:border-white/[0.12] hover:bg-white/[0.04] transition-all duration-200 flex"
            >
              <Link
                href={`/conversations/${conversation.id}`}
                className="flex-1 p-5"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2.5 mb-2">
                      <span className="text-[10px] px-2 py-0.5 border border-white/15 uppercase tracking-wider text-white/50">
                        {conversation.mode}
                      </span>
                      <span className={`text-[10px] px-2 py-0.5 border ${getStatusColor(conversation.status)}`}>
                        {getStatusLabel(conversation.status)}
                      </span>
                    </div>
                    <h3 className="font-medium text-white/90">
                      {conversation.title || 'Untitled Conversation'}
                    </h3>
                    <div className="mt-2.5 flex items-center gap-4 text-xs text-white/30">
                      {conversation.mode === 'debate' && conversation.totalRounds && (
                        <span className="text-white/50">
                          Round {conversation.currentRound}/{conversation.totalRounds}
                        </span>
                      )}
                      <span>${(conversation.totalCostCents / 100).toFixed(2)}</span>
                      <span>{formatDate(conversation.updatedAt)}</span>
                    </div>
                  </div>
                  <div className="text-white/20 group-hover:text-orange-500 transition-colors text-lg ml-4">
                    →
                  </div>
                </div>
              </Link>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (confirm('Delete this conversation? This cannot be undone.')) {
                    deleteConversation(conversation.id);
                  }
                }}
                className="px-4 border-l border-white/[0.06] text-white/20 hover:text-red-400 hover:bg-red-500/5 transition-colors text-sm opacity-0 group-hover:opacity-100"
                title="Delete conversation"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
