'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useConversationsStore } from '@/stores/conversations';
import { useCreditsStore, formatCents } from '@/stores/credits';
import { useConversationStream } from '@/hooks/useConversationStream';
import { conversationsApi, CommentData, VoteSummary } from '@/lib/api';
import { useAuthStore } from '@/stores/auth';
import { MessageList } from '@/components/MessageBubble';

export default function ConversationPage() {
  const params = useParams();
  const router = useRouter();
  const conversationId = params.id as string;

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const isNearBottomRef = useRef(true);

  const {
    currentConversation,
    messages,
    participants,
    fetchConversation,
    pauseConversation,
    resumeConversation,
    addInterjection,
    startForceAgreement,
    isLoading,
    error,
  } = useConversationsStore();

  const { totalCents, fetchBalance } = useCreditsStore();

  const { token } = useAuthStore();
  const [interjectionText, setInterjectionText] = useState('');
  const [currentAgentName, setCurrentAgentName] = useState<string | null>(null);
  const [streamingMessageId, setStreamingMessageId] = useState<string | null>(null);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [shareCopied, setShareCopied] = useState(false);
  const [comments, setComments] = useState<CommentData[]>([]);
  const [commentText, setCommentText] = useState('');
  const [commentLoading, setCommentLoading] = useState(false);
  const [commentError, setCommentError] = useState<string | null>(null);
  const [voteSummary, setVoteSummary] = useState<VoteSummary | null>(null);
  const [voteLoading, setVoteLoading] = useState(false);
  const [voteError, setVoteError] = useState<string | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [ttsError, setTtsError] = useState<string | null>(null);

  // Memoize callbacks to prevent unnecessary re-renders
  const handleMessageStart = useCallback((agentId: string, messageId: string) => {
    setStreamingMessageId(messageId);
    // Get participants from store directly to avoid stale closure
    const { participants: currentParticipants } = useConversationsStore.getState();
    const participant = currentParticipants.find((p) => p.agentId === agentId);
    if (participant) {
      setCurrentAgentName(participant.agent.name);
    }
  }, []);

  const handleMessageComplete = useCallback(() => {
    setStreamingMessageId(null);
    setCurrentAgentName(null);
  }, []);

  const handleTurnChange = useCallback((_agentId: string, agentName: string) => {
    setCurrentAgentName(agentName);
  }, []);

  const handleConversationComplete = useCallback(() => {
    useCreditsStore.getState().fetchBalance();
  }, []);

  const handleError = useCallback((code: string, message: string) => {
    console.error(`Error ${code}: ${message}`);
  }, []);

  // Set up streaming - use URL conversationId, not currentConversation.id
  const { isConnected, isWaitingForInput } = useConversationStream({
    conversationId: conversationId,
    onMessageStart: handleMessageStart,
    onMessageComplete: handleMessageComplete,
    onTurnChange: handleTurnChange,
    onConversationComplete: handleConversationComplete,
    onError: handleError,
  });

  // Fetch conversation on mount
  useEffect(() => {
    fetchConversation(conversationId);
    fetchBalance();
  }, [conversationId, fetchConversation, fetchBalance]);

  useEffect(() => {
    if (currentConversation?.isPublic) {
      conversationsApi
        .listComments(conversationId)
        .then((data) => setComments(data.comments))
        .catch(() => {});
    }
  }, [conversationId, currentConversation?.isPublic]);

  useEffect(() => {
    if (currentConversation?.status === 'completed' && currentConversation.mode === 'debate') {
      conversationsApi
        .getVotes(conversationId, token || undefined)
        .then((data) => setVoteSummary(data.summary))
        .catch(() => {});
    }
  }, [conversationId, currentConversation?.status, currentConversation?.mode, token]);

  // Track if user is scrolled near the bottom
  const handleScroll = useCallback(() => {
    const container = messagesContainerRef.current;
    if (!container) return;
    const threshold = 100;
    isNearBottomRef.current =
      container.scrollHeight - container.scrollTop - container.clientHeight < threshold;
  }, []);

  // Auto-scroll only if user is near the bottom
  useEffect(() => {
    if (isNearBottomRef.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handlePause = async () => {
    try {
      await pauseConversation(conversationId);
    } catch (err) {
      console.error('Failed to pause:', err);
    }
  };

  const handleResume = async () => {
    try {
      await resumeConversation(conversationId);
    } catch (err) {
      console.error('Failed to resume:', err);
    }
  };

  const handleInterject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!interjectionText.trim()) return;

    try {
      await addInterjection(conversationId, interjectionText.trim());
      setInterjectionText('');
    } catch (err) {
      console.error('Failed to interject:', err);
    }
  };

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCommentError(null);
    if (!commentText.trim()) return;
    if (!token) {
      router.push('/login');
      return;
    }
    setCommentLoading(true);
    try {
      const result = await conversationsApi.createComment(
        token,
        conversationId,
        commentText.trim()
      );
      setComments((prev) => [result.comment, ...prev]);
      setCommentText('');
    } catch (err) {
      setCommentError(err instanceof Error ? err.message : 'Failed to post comment');
    } finally {
      setCommentLoading(false);
    }
  };

  const handleVote = async (agentId: string) => {
    if (!token) {
      router.push('/login');
      return;
    }
    setVoteError(null);
    setVoteLoading(true);
    try {
      const result = await conversationsApi.vote(token, conversationId, agentId);
      setVoteSummary(result.summary);
    } catch (err) {
      setVoteError(err instanceof Error ? err.message : 'Failed to record vote');
    } finally {
      setVoteLoading(false);
    }
  };

  const handleSpeak = () => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      setTtsError('Text-to-speech is not supported in this browser.');
      return;
    }
    setTtsError(null);
    const synth = window.speechSynthesis;
    synth.cancel();
    const narration = messages
      .filter((msg) => msg.role !== 'system')
      .map((msg) => {
        if (msg.role === 'user') return `Moderator says: ${msg.content}`;
        const participant = participants.find((p) => p.agentId === msg.agentId);
        const name = participant?.agent.name || 'Agent';
        return `${name} argues: ${msg.content}`;
      });

    if (narration.length === 0) return;

    let index = 0;
    setIsSpeaking(true);

    const speakNext = () => {
      if (index >= narration.length) {
        setIsSpeaking(false);
        return;
      }
      const utterance = new SpeechSynthesisUtterance(narration[index]);
      utterance.rate = 1.05;
      utterance.pitch = 0.9;
      utterance.onend = () => {
        index += 1;
        speakNext();
      };
      utterance.onerror = () => {
        setIsSpeaking(false);
      };
      synth.speak(utterance);
    };

    speakNext();
  };

  const handleStopSpeak = () => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  };

  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  if (isLoading && !currentConversation) {
    return (
      <div className="h-full flex items-center justify-center">
        <p className="text-sm text-white/50">loading conversation...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto space-y-8">
        <Link
          href="/conversations"
          className="text-xs text-white/50 hover:text-white/70 transition-colors"
        >
          &larr; back to conversations
        </Link>
        <div className="border border-red-500/50 bg-red-500/10 p-8 text-center">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      </div>
    );
  }

  if (!currentConversation) {
    return (
      <div className="max-w-2xl mx-auto space-y-8">
        <Link
          href="/conversations"
          className="text-xs text-white/50 hover:text-white/70 transition-colors"
        >
          &larr; back to conversations
        </Link>
        <div className="border border-white/10 p-8 text-center">
          <p className="text-sm text-white/50">conversation not found</p>
        </div>
      </div>
    );
  }

  const isActive = currentConversation.status === 'active';
  const isPaused = currentConversation.status === 'paused';
  const isCompleted = currentConversation.status === 'completed';

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      {/* Header */}
      <div className="flex-shrink-0 pb-4 mb-4">
        <div className="flex items-center justify-between mb-3">
          <Link
            href="/conversations"
            className="text-xs text-white/40 hover:text-white/70 transition-colors"
          >
            &larr; back
          </Link>
          <div className="flex items-center gap-2">
            <button
              onClick={isSpeaking ? handleStopSpeak : handleSpeak}
              className="px-2.5 py-1 text-[10px] border border-white/10 text-white/50 hover:text-white hover:border-white/30 transition-colors"
            >
              {isSpeaking ? 'stop audio' : 'listen'}
            </button>
            <button
              onClick={async () => {
                if (shareUrl) {
                  navigator.clipboard.writeText(shareUrl);
                  setShareCopied(true);
                  setTimeout(() => setShareCopied(false), 2000);
                  return;
                }
                if (!token) return;
                try {
                  const result = await conversationsApi.createShareLink(token, conversationId);
                  setShareUrl(result.shareUrl);
                  navigator.clipboard.writeText(result.shareUrl);
                  setShareCopied(true);
                  setTimeout(() => setShareCopied(false), 2000);
                } catch {
                  // ignore
                }
              }}
              className="px-2.5 py-1 text-[10px] border border-white/10 text-white/50 hover:text-white hover:border-white/30 transition-colors"
            >
              {shareCopied ? 'copied!' : shareUrl ? 'copy link' : 'share'}
            </button>
            <div className="flex items-center gap-1.5 px-2.5 py-1 border border-white/10 bg-white/5">
              <span className="text-[10px] text-white/40">spent</span>
              <span className="text-xs font-medium">
                ${(currentConversation.totalCostCents / 100).toFixed(2)}
              </span>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 border border-orange-500/20 bg-orange-500/5">
              <span className="text-[10px] text-white/40">balance</span>
              <span className="text-xs font-medium text-orange-500">{formatCents(totalCents)}</span>
            </div>
          </div>
        </div>

        <h1 className="text-lg font-bold">
          {currentConversation.title || 'Untitled Conversation'}
        </h1>
        {ttsError && (
          <p className="text-xs text-red-400 mt-2">{ttsError}</p>
        )}

        <div className="flex items-center gap-3 mt-2">
          <span className="text-[10px] px-2 py-0.5 border border-white/20 uppercase tracking-wider text-white/60">
            {currentConversation.mode}
          </span>
          {currentConversation.mode === 'debate' && currentConversation.totalRounds && (
            <span className="text-xs text-white/40">
              Round {currentConversation.currentRound}/{currentConversation.totalRounds}
            </span>
          )}
          <span
            className={`text-xs flex items-center gap-1.5 ${
              isActive
                ? 'text-green-400'
                : isWaitingForInput
                ? 'text-orange-400'
                : isPaused
                ? 'text-yellow-400'
                : isCompleted
                ? 'text-white/40'
                : 'text-white/50'
            }`}
          >
            {isConnected && isActive && !isWaitingForInput && (
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
            )}
            {isWaitingForInput && (
              <span className="w-1.5 h-1.5 bg-orange-500 rounded-full" />
            )}
            {isWaitingForInput ? 'your turn' : currentConversation.status}
          </span>
        </div>

        {/* Participants bar */}
        <div className="flex items-center gap-3 mt-3 pt-3 border-t border-white/[0.06]">
          {participants.map((participant, index) => (
            <div key={participant.id} className="flex items-center gap-1.5">
              <div
                className="w-6 h-6 flex items-center justify-center text-[10px] font-bold rounded-full flex-shrink-0"
                style={{ backgroundColor: participant.agent.avatarColor }}
                title={participant.agent.name}
              >
                <span className="text-black/80">{participant.agent.name.charAt(0).toUpperCase()}</span>
              </div>
              <span className="text-xs text-white/60">{participant.agent.name}</span>
              {index < participants.length - 1 && (
                <span className="text-white/20 mx-1 text-xs">→</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Messages */}
      <div ref={messagesContainerRef} onScroll={handleScroll} className="flex-1 overflow-y-auto pr-2 -mx-2 px-2">
        <MessageList
          messages={messages}
          participants={participants}
          streamingMessageId={streamingMessageId}
        />
        <div ref={messagesEndRef} />
      </div>

      {/* Status bar */}
      {currentAgentName && isActive && !isWaitingForInput && (
        <div className="flex-shrink-0 py-2.5 text-xs text-white/50 border-t border-white/[0.06] mt-2">
          <span className="animate-pulse flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />
            {currentAgentName} is typing...
          </span>
        </div>
      )}
      {isWaitingForInput && (
        <div className="flex-shrink-0 py-2.5 text-xs border-t border-orange-500/20 mt-2 bg-orange-500/5 -mx-6 px-6">
          <span className="text-orange-400 flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-orange-500 rounded-full" />
            round complete — send a message or click resume to continue
          </span>
        </div>
      )}

      {/* Controls */}
      <div className="flex-shrink-0 pt-4 mt-2 border-t border-white/[0.06]">
        {isCompleted ? (
          <div className="space-y-4">
            <div className="text-center py-6 border border-white/[0.06] bg-white/[0.02]">
              <p className="text-sm text-white/50">conversation completed</p>
              <p className="text-xs text-white/30 mt-1">
                Total cost: ${(currentConversation.totalCostCents / 100).toFixed(2)}
              </p>
            </div>

            {currentConversation.mode === 'debate' && (
              <div className="border border-white/10 bg-white/5 p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs text-white/60 font-medium">vote for the winner</h3>
                  <span className="text-xs text-white/30">
                    {voteSummary?.totalVotes ?? 0} votes
                  </span>
                </div>
                {voteError && (
                  <div className="border border-red-500/30 bg-red-500/10 p-2 text-xs text-red-400 mb-3">
                    {voteError}
                  </div>
                )}
                <div className="grid gap-2 sm:grid-cols-2">
                  {participants.map((participant) => {
                    const count = voteSummary?.results.find(
                      (result) => result.agentId === participant.agentId
                    )?.count ?? 0;
                    const isSelected = voteSummary?.userVote === participant.agentId;
                    return (
                      <button
                        key={participant.id}
                        onClick={() => handleVote(participant.agentId)}
                        disabled={voteLoading}
                        className={`flex items-center justify-between border px-3 py-2 text-xs transition-colors ${
                          isSelected
                            ? 'border-orange-500/60 text-orange-400 bg-orange-500/10'
                            : 'border-white/10 text-white/60 hover:border-orange-500/40'
                        }`}
                      >
                        <span>{participant.agent.name}</span>
                        <span className="text-[10px] text-white/40">{count} votes</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {/* Interjection Form */}
            <form onSubmit={handleInterject} className="flex gap-2">
              <input
                type="text"
                value={interjectionText}
                onChange={(e) => setInterjectionText(e.target.value)}
                placeholder={isWaitingForInput ? "Type your response to continue..." : "Add your input to the conversation..."}
                maxLength={5000}
                disabled={isCompleted}
                className={`flex-1 bg-white/5 border px-4 py-2.5 text-sm placeholder:text-white/30 focus:outline-none transition-colors disabled:opacity-50 ${
                  isWaitingForInput
                    ? 'border-orange-500/30 focus:border-orange-500/50'
                    : 'border-white/10 focus:border-orange-500/50'
                }`}
              />
              <button
                type="submit"
                disabled={!interjectionText.trim() || isCompleted}
                className="bg-orange-500 text-black px-5 py-2.5 text-sm font-medium hover:bg-orange-400 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                send
              </button>
            </form>

            {/* Control Buttons */}
            <div className="flex items-center justify-between">
              <div className="flex gap-2">
                {isActive && !isWaitingForInput && (
                  <button
                    onClick={handlePause}
                    className="px-3 py-1.5 text-xs border border-white/10 text-white/50 hover:border-white/30 hover:text-white/70 transition-colors"
                  >
                    pause
                  </button>
                )}
                {isPaused && (
                  <button
                    onClick={handleResume}
                    className="px-4 py-1.5 text-xs font-medium bg-orange-500 text-black hover:bg-orange-400 transition-colors"
                  >
                    ▶ resume
                  </button>
                )}
              </div>
              {currentConversation.mode === 'collaborate' && !isCompleted && currentConversation.status !== 'force_agreement' && (
                <button
                  className="px-3 py-1.5 text-xs border border-purple-500/30 text-purple-400 hover:bg-purple-500/10 transition-colors"
                  onClick={async () => {
                    try {
                      await startForceAgreement(conversationId);
                    } catch (err) {
                      console.error('Failed to start force agreement:', err);
                    }
                  }}
                >
                  force agreement
                </button>
              )}
              {currentConversation.status === 'force_agreement' && (
                <span className="px-3 py-1.5 text-xs text-purple-400">
                  force agreement in progress...
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {currentConversation.isPublic && (
        <div className="flex-shrink-0 mt-4 border-t border-white/[0.06] pt-4">
          <div className="border border-white/10 bg-white/5 p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs text-white/60 font-medium">comments</h3>
              <span className="text-xs text-white/30">{comments.length}</span>
            </div>

            {comments.length === 0 ? (
              <p className="text-xs text-white/50 mb-3">no comments yet. add the first take.</p>
            ) : (
              <div className="space-y-3 max-h-48 overflow-y-auto pr-2 mb-3">
                {comments.map((comment) => (
                  <div key={comment.id} className="border border-white/10 p-3 bg-black/30">
                    <div className="flex items-center gap-2 mb-1 text-xs text-white/40">
                      <div className="w-6 h-6 bg-orange-500/80 flex items-center justify-center text-[10px] font-bold text-black overflow-hidden">
                        {comment.user.avatarUrl ? (
                          <img src={comment.user.avatarUrl} alt="" className="w-full h-full object-cover" />
                        ) : (
                          (comment.user.username || 'U').charAt(0).toUpperCase()
                        )}
                      </div>
                      <span>{comment.user.username || 'anonymous'}</span>
                      <span>• {new Date(comment.createdAt).toLocaleDateString()}</span>
                    </div>
                    <p className="text-sm text-white/80 whitespace-pre-wrap">{comment.content}</p>
                  </div>
                ))}
              </div>
            )}

            <form onSubmit={handleCommentSubmit} className="space-y-2">
              {commentError && (
                <div className="border border-red-500/30 bg-red-500/10 p-2 text-xs text-red-400">
                  {commentError}
                </div>
              )}
              <textarea
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="add a comment..."
                maxLength={2000}
                rows={3}
                className="w-full bg-black/40 border border-white/10 px-3 py-2 text-sm focus:outline-none focus:border-orange-500/50 resize-none"
              />
              <button
                type="submit"
                disabled={commentLoading || !commentText.trim()}
                className="bg-orange-500 text-black px-4 py-2 text-xs font-medium hover:bg-orange-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {commentLoading ? 'posting...' : 'post comment'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
