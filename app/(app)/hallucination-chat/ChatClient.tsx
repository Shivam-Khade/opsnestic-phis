'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Bot, User, Send, CheckCircle2, XCircle, RefreshCw, AlertTriangle, Search, RotateCcw, History, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '@/components/ui/Toast';

type Message = { role: 'user' | 'assistant'; content: string };
type ChatHistory = {
  id: number;
  query: string;
  response: string;
  was_hallucinated: number;
  user_decision: string | null;
  is_correct: number | null;
  created_at: Date;
  user_reasoning?: string | null;
};

export default function ChatClient({ history }: { history: ChatHistory[] }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [wasHallucinated, setWasHallucinated] = useState<boolean | null>(null);
  const [step, setStep] = useState<'chat' | 'evaluate' | 'result'>('chat');
  const [chunks, setChunks] = useState<string[]>([]);
  const [chunkEvaluations, setChunkEvaluations] = useState<{decision: 'hallucination' | 'factual' | null, reasoning: string}[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resultData, setResultData] = useState<{ label: 'Correct' | 'Partial' | 'Incorrect', scoreText: string, chunkResults: { text: string, actualHallucination: boolean, userCorrect: boolean, decisionCorrect: boolean, reasoningCorrect: boolean, feedback: string }[] } | null>(null);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedSession, setSelectedSession] = useState<ChatHistory | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { error: toastError } = useToast();
  const router = useRouter();

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  useEffect(() => { scrollToBottom(); }, [messages, step]);

  const handleGenerateSuggestions = async () => {
    if (isLoadingSuggestions) return;
    setIsLoadingSuggestions(true);
    setSuggestions([]);
    try {
      const res = await fetch('/api/hallucination-chat/suggestions');
      const data = await res.json();
      if (data.suggestions && Array.isArray(data.suggestions)) {
        setSuggestions(data.suggestions);
      }
    } catch (err) {
      toastError('Failed to generate', 'Could not get suggestions. Please try again.');
    } finally {
      setIsLoadingSuggestions(false);
    }
  };

  const handleSendQuery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    const userMsg = input.trim();
    setInput('');
    const newMessages: Message[] = [...messages, { role: 'user', content: userMsg }];
    setMessages(newMessages);
    setIsLoading(true);
    try {
      const res = await fetch('/api/hallucination-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages })
      });
      if (!res.ok) throw new Error('Failed to fetch response');
      const data = await res.json();
      setMessages(prev => [...prev, { role: 'assistant', content: data.response }]);
      setWasHallucinated(data.was_hallucinated);
      const parsedChunks = (data.response || '').split(/\n\n+/).filter((c: string) => c.trim().length > 0);
      setChunks(parsedChunks);
      setChunkEvaluations(parsedChunks.map(() => ({ decision: null, reasoning: '' })));
      setStep('evaluate');
    } catch {
      toastError('Request failed', 'Could not get an AI response. Please try again.');
      setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, I encountered an error. Please try again.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitDecision = async () => {
    // Check if all chunks have a decision and reasoning
    const isComplete = chunkEvaluations.every(e => e.decision && e.reasoning.trim().length > 0);
    if (!isComplete) return;

    setIsSubmitting(true);
    try {
      const lastUserMsg = [...messages].reverse().find(m => m.role === 'user')?.content || '';
      
      const payloadChunks = chunks.map((text, i) => ({
        text,
        user_decision: chunkEvaluations[i].decision,
        user_reasoning: chunkEvaluations[i].reasoning
      }));

      const res = await fetch('/api/hallucination-chat/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: lastUserMsg, chunks: payloadChunks, was_hallucinated: wasHallucinated })
      });
      if (!res.ok) throw new Error('Failed to submit decision');
      const data = await res.json();
      setResultData({
        label: data.label,
        scoreText: data.scoreText,
        chunkResults: data.chunkResults
      });
      setStep('result');
      router.refresh();
    } catch {
      toastError('Submission failed', 'Error saving your evaluation. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setMessages([]); setInput(''); setWasHallucinated(null); setStep('chat');
    setChunks([]); setChunkEvaluations([]); setResultData(null);
  };

  const handleContinue = () => {
    setWasHallucinated(null); setStep('chat');
    setChunks([]); setChunkEvaluations([]); setResultData(null);
  };

  /* ── Shared glass styles ── */
  const glassPanel = {
    background: 'var(--bg-card)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    border: '1px solid var(--border-glass)',
    borderRadius: '20px',
    boxShadow: 'var(--shadow-card)',
  } as React.CSSProperties;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', maxHeight: '100vh', maxWidth: '1200px', margin: '0 auto', padding: '1.5rem 2rem' }}>
      {/* Header */}
      <div style={{ marginBottom: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: '0 0 0.25rem', letterSpacing: '-0.025em' }}>
            <span style={{ background: 'var(--accent-gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>AI Chat</span>
            <span style={{ color: 'var(--text-primary)' }}> Training</span>
          </h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', margin: 0 }}>
            The AI has a 75% chance of hallucinating (sometimes subtly, sometimes completely). Ask a factual question, then fact-check!
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          {step === 'result' && (
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button className="btn-ghost" onClick={handleReset} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <RotateCcw size={14} /> Clear Chat
              </button>
              <button className="btn-primary" onClick={handleContinue} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', fontSize: '0.875rem' }}>
                Continue Chat
              </button>
            </div>
          )}
          <button className="btn-ghost" onClick={() => setShowHistoryModal(true)} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <History size={16} /> View History
          </button>
        </div>
      </div>
      {/* Main layout  */}
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', gap: '1.25rem' }}>
        {/* Chat panel */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', ...glassPanel, overflow: 'hidden' }}>
          {/* Messages */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {messages.length === 0 && (
              <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', opacity: 0.6 }}>
                <div style={{ width: '56px', height: '56px', background: 'var(--accent-primary-10)', border: '1px solid var(--accent-primary-20)', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.25rem' }}>
                  <Search size={24} style={{ color: 'var(--accent-primary)' }} />
                </div>
                <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 0.5rem' }}>Fact-Checking Challenge</h3>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', margin: 0, maxWidth: '340px', lineHeight: 1.6 }}>
                  Ask a specific historical, scientific, or factual question. The AI might weave in a subtle lie. Verify the response!
                </p>
              </div>
            )}

            <AnimatePresence>
              {messages.map((msg, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  style={{ display: 'flex', gap: '0.875rem', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start', alignItems: 'flex-start' }}>
                  {msg.role === 'assistant' && (
                    <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'var(--accent-gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 4px 12px rgba(79,70,229,0.3)' }}>
                      <Bot size={16} color="#fff" />
                    </div>
                  )}
                  {msg.role === 'assistant' ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxWidth: '78%' }}>
                      {msg.content.split(/\n\n+/).filter(c => c.trim().length > 0).map((chunkText, chunkIdx) => (
                        <div key={chunkIdx} style={{ background: 'var(--bg-base)', border: '1px solid var(--border-default)', borderRadius: '16px', padding: '1rem 1.25rem', color: 'var(--text-primary)', boxShadow: 'var(--shadow-sm)' }}>
                           <p style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--accent-primary)', margin: '0 0 0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Chunk {chunkIdx + 1}</p>
                           <p style={{ whiteSpace: 'pre-wrap', lineHeight: 1.65, margin: 0, fontSize: '0.9375rem' }}>{chunkText}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ maxWidth: '78%', borderRadius: '16px', padding: '0.875rem 1.125rem', background: 'var(--accent-gradient)', color: '#fff', boxShadow: '0 4px 12px rgba(79,70,229,0.3)' }}>
                      <p style={{ whiteSpace: 'pre-wrap', lineHeight: 1.65, margin: 0, fontSize: '0.9375rem' }}>{msg.content}</p>
                    </div>
                  )}
                  {msg.role === 'user' && (
                    <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'var(--border-default)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <User size={16} style={{ color: 'var(--text-secondary)' }} />
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>

            {isLoading && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: 'flex', gap: '0.875rem', alignItems: 'flex-start' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'var(--accent-gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 4px 12px rgba(79,70,229,0.3)' }}>
                  <Bot size={16} color="#fff" />
                </div>
                <div style={{ background: 'var(--bg-base)', border: '1px solid var(--border-default)', borderRadius: '16px', padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', gap: '0.375rem', boxShadow: 'var(--shadow-sm)' }}>
                  {[0, 150, 300].map((delay) => (
                    <div key={delay} style={{ width: '8px', height: '8px', background: 'var(--accent-primary)', borderRadius: '50%', animation: 'bounce 1s ease-in-out infinite', animationDelay: `${delay}ms` }} />
                  ))}
                </div>
              </motion.div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div style={{ padding: '1rem 1.25rem', borderTop: '1px solid var(--border-glass)', background: 'var(--bg-glass)', backdropFilter: 'blur(12px)' }}>
            
            {messages.length === 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1rem' }}>
                <button
                  type="button"
                  onClick={handleGenerateSuggestions}
                  disabled={isLoadingSuggestions}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: '0.5rem', alignSelf: 'flex-start',
                    padding: '0.375rem 0.75rem', fontSize: '0.8125rem', background: 'var(--bg-hover)',
                    border: '1px solid var(--border-default)', borderRadius: '8px', color: 'var(--text-secondary)',
                    cursor: isLoadingSuggestions ? 'not-allowed' : 'pointer', opacity: isLoadingSuggestions ? 0.7 : 1,
                  }}
                >
                  <RefreshCw size={14} style={isLoadingSuggestions ? { animation: 'spin 1s linear infinite' } : {}} />
                  {isLoadingSuggestions ? 'Generating ideas...' : 'Suggest Prompts'}
                </button>

                <AnimatePresence>
                  {suggestions.length > 0 && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0, y: -5 }} 
                      animate={{ opacity: 1, height: 'auto', y: 0 }}
                      exit={{ opacity: 0, height: 0, y: -5 }}
                      style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', overflow: 'hidden' }}
                    >
                      {suggestions.map((suggestion, idx) => (
                        <button
                          key={idx}
                          type="button"
                          className="suggestion-btn"
                          onClick={() => setInput(suggestion)}
                        >
                          {suggestion}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            <form onSubmit={handleSendQuery} style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
              <input
                type="text" value={input} onChange={e => setInput(e.target.value)}
                disabled={step !== 'chat' || isLoading}
                placeholder="Ask a complex factual question to begin…"
                className="input-field"
                style={{ flex: 1 }}
              />
              <button type="submit" disabled={!input.trim() || step !== 'chat' || isLoading}
                style={{ width: '44px', height: '44px', background: 'var(--accent-gradient)', color: '#fff', border: 'none', borderRadius: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(79,70,229,0.4)', transition: 'all 0.2s', flexShrink: 0, opacity: (!input.trim() || step !== 'chat' || isLoading) ? 0.5 : 1 }}>
                <Send size={16} />
              </button>
            </form>
          </div>
        </div>

        {/* Evaluation panel */}
        <AnimatePresence>
          {step !== 'chat' && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
              style={{ width: '420px', display: 'flex', flexDirection: 'column', gap: '1rem', flexShrink: 0, height: '100%', overflowY: 'auto', paddingRight: '0.5rem' }}>
              {step === 'evaluate' && (
                <>
                  <div style={{ ...glassPanel, padding: '1.25rem', position: 'sticky', top: 0, zIndex: 10, background: 'var(--bg-glass)', backdropFilter: 'blur(20px)' }}>
                     <h3 style={{ margin: '0 0 0.5rem', fontSize: '1.125rem' }}>Evaluate the Response</h3>
                     <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', margin: 0 }}>Review each chunk carefully. Some parts might be true while others are hallucinations!</p>
                  </div>

                  {chunks.map((chunk, idx) => {
                    const evalState = chunkEvaluations[idx];
                    return (
                      <div key={idx} style={{ ...glassPanel, padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                        <h4 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span style={{ color: 'var(--accent-primary)' }}>Chunk</span> {idx + 1}
                        </h4>
                        
                        {/* Decision Radios */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                          {[
                            { value: 'factual' as const, label: "It's Factual", icon: CheckCircle2, color: '#10b981', bg: 'rgba(16,185,129,0.08)', border: 'rgba(16,185,129,0.25)' },
                            { value: 'hallucination' as const, label: 'It Hallucinated', icon: AlertTriangle, color: '#ef4444', bg: 'rgba(239,68,68,0.08)', border: 'rgba(239,68,68,0.25)' },
                          ].map((opt) => {
                            const Icon = opt.icon;
                            const selected = evalState.decision === opt.value;
                            return (
                              <label key={opt.value} style={{ display: 'flex', alignItems: 'center', padding: '0.875rem 1rem', border: `1.5px solid ${selected ? opt.border : 'var(--border-default)'}`, borderRadius: '12px', cursor: 'pointer', background: selected ? opt.bg : 'transparent', transition: 'all 0.2s' }}>
                                <input type="radio" name={`decision-${idx}`} value={opt.value} className="sr-only" style={{ display: 'none' }}
                                  onChange={() => {
                                    const newEvals = [...chunkEvaluations];
                                    newEvals[idx].decision = opt.value;
                                    setChunkEvaluations(newEvals);
                                  }} 
                                />
                                <Icon size={18} style={{ marginRight: '0.75rem', color: selected ? opt.color : 'var(--text-muted)', flexShrink: 0 }} />
                                <span style={{ fontWeight: 600, fontSize: '0.9rem', color: selected ? opt.color : 'var(--text-primary)' }}>{opt.label}</span>
                              </label>
                            );
                          })}
                        </div>
                        
                        {/* Reasoning */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                          <label style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Reasoning / Proof</label>
                          <textarea 
                            value={evalState.reasoning}
                            onChange={e => {
                              const newEvals = [...chunkEvaluations];
                              newEvals[idx].reasoning = e.target.value;
                              setChunkEvaluations(newEvals);
                            }}
                            placeholder="e.g. I checked Wikipedia and..."
                            style={{ width: '100%', background: 'var(--bg-base)', border: '1px solid var(--border-default)', borderRadius: '12px', padding: '0.75rem', fontSize: '0.875rem', color: 'var(--text-primary)', resize: 'none', height: '80px', outline: 'none', transition: 'border-color 0.2s', boxSizing: 'border-box' }}
                            onFocus={e => (e.target.style.borderColor = 'var(--accent-primary)')}
                            onBlur={e => (e.target.style.borderColor = 'var(--border-default)')}
                          />
                        </div>
                      </div>
                    );
                  })}
                  
                  <button className="btn-primary" style={{ width: '100%', padding: '1rem', marginTop: '0.5rem', position: 'sticky', bottom: 0, zIndex: 10, boxShadow: '0 -10px 20px rgba(0,0,0,0.1)' }}
                    onClick={handleSubmitDecision} 
                    disabled={chunkEvaluations.some(e => !e.decision || !e.reasoning.trim()) || isSubmitting}>
                    {isSubmitting ? 'Submitting…' : 'Submit All Evaluations'}
                  </button>
                </>
              )}

              {step === 'result' && resultData && (
                <div style={{ ...glassPanel, padding: '1.75rem', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '1rem', borderColor: resultData.label === 'Correct' ? 'rgba(16,185,129,0.25)' : resultData.label === 'Partial' ? 'rgba(234,179,8,0.25)' : 'rgba(239,68,68,0.25)' }}>
                  <div style={{ width: '64px', height: '64px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: resultData.label === 'Correct' ? 'rgba(16,185,129,0.1)' : resultData.label === 'Partial' ? 'rgba(234,179,8,0.1)' : 'rgba(239,68,68,0.1)', boxShadow: `0 0 0 8px ${resultData.label === 'Correct' ? 'rgba(16,185,129,0.06)' : resultData.label === 'Partial' ? 'rgba(234,179,8,0.06)' : 'rgba(239,68,68,0.06)'}` }}>
                    {resultData.label === 'Correct' ? <CheckCircle2 size={32} style={{ color: '#10b981' }} /> :
                     resultData.label === 'Partial' ? <AlertTriangle size={32} style={{ color: '#eab308' }} /> :
                     <XCircle size={32} style={{ color: '#ef4444' }} />}
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 0.5rem', letterSpacing: '-0.02em' }}>
                      {resultData.label}!
                    </h3>
                    <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.6 }}>
                      {resultData.scoreText}
                    </p>
                  </div>
                  
                  <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '0.75rem', textAlign: 'left', marginTop: '0.5rem' }}>
                    {resultData.chunkResults.map((res, i) => (
                       <div key={i} style={{ padding: '1rem', background: 'var(--bg-hover)', borderRadius: '12px', border: `1px solid ${res.userCorrect ? 'rgba(16,185,129,0.3)' : (res.decisionCorrect ? 'rgba(234,179,8,0.3)' : 'rgba(239,68,68,0.3)')}` }}>
                          <p style={{ fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-primary)', margin: '0 0 0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span style={{ color: 'var(--accent-primary)' }}>Chunk {i + 1}</span>
                            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>- {res.userCorrect ? '✅ Perfect' : (res.decisionCorrect ? '⚠️ Right decision, flawed reasoning' : '❌ Incorrect')}</span>
                          </p>
                          <p style={{ fontSize: '0.875rem', color: res.actualHallucination ? '#ef4444' : '#10b981', margin: '0 0 0.5rem', display: 'flex', alignItems: 'center', gap: '0.375rem', fontWeight: 600 }}>
                            {res.actualHallucination ? <AlertTriangle size={14} /> : <CheckCircle2 size={14} />}
                            {res.actualHallucination ? 'Actual Hallucination' : 'Factual'}
                          </p>
                          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5, background: 'rgba(0,0,0,0.1)', padding: '0.5rem', borderRadius: '8px' }}>
                            <strong style={{color: 'var(--text-primary)'}}>AI Judge:</strong> {res.feedback}
                          </p>
                       </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* History Modal */}
      {showHistoryModal && (
        <div onClick={() => setShowHistoryModal(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '2rem', animation: 'fadeIn 0.2s ease-out' }}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: 'var(--bg-base)', borderRadius: '20px', width: '100%', maxWidth: '900px', maxHeight: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative', boxShadow: '0 25px 60px rgba(0,0,0,0.25), 0 8px 20px rgba(0,0,0,0.15)', border: '1px solid var(--border-glass)' }}>
            {/* Header */}
            <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border-glass)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-glass)' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                {selectedSession && (
                  <button onClick={() => setSelectedSession(null)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '0.25rem' }}>
                    <RotateCcw size={16} style={{ transform: 'scaleX(-1)' }} />
                  </button>
                )}
                {selectedSession ? 'Session Details' : 'Session History'}
              </h2>
              <button onClick={() => { setShowHistoryModal(false); setSelectedSession(null); }} style={{ background: 'var(--bg-hover)', border: 'none', color: 'var(--text-secondary)', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s' }}>
                <X size={16} />
              </button>
            </div>
            
            {/* Body */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem' }}>
              {selectedSession ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  <div style={{ padding: '1.25rem', background: 'var(--bg-surface)', borderRadius: '12px', border: '1px solid var(--border-default)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                      <h3 style={{ margin: 0, fontSize: '1.125rem', color: 'var(--text-primary)' }}>User Query</h3>
                      <span className="badge" style={{ background: selectedSession.is_correct === 1 ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)', color: selectedSession.is_correct === 1 ? '#10b981' : '#ef4444' }}>
                        {selectedSession.is_correct === 1 ? '✓ Correct' : '✗ Incorrect'}
                      </span>
                    </div>
                    <p style={{ fontSize: '1rem', color: 'var(--text-secondary)', margin: 0 }}>{selectedSession.query}</p>
                  </div>
                  
                  <h4 style={{ fontSize: '1rem', color: 'var(--text-primary)', margin: '0.5rem 0 0', paddingLeft: '0.25rem' }}>Chunk Breakdown</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {(() => {
                      let parsedChunks = [];
                      try {
                        if (selectedSession.user_reasoning) {
                          parsedChunks = JSON.parse(selectedSession.user_reasoning);
                        }
                      } catch (e) {
                        return <p style={{ color: 'var(--text-muted)' }}>Could not load detailed evaluation data.</p>;
                      }
                      
                      if (!Array.isArray(parsedChunks) || parsedChunks.length === 0) {
                         return <p style={{ color: 'var(--text-muted)' }}>No detailed evaluation data available for this session.</p>;
                      }

                      return parsedChunks.map((res: any, i: number) => (
                        <div key={i} style={{ padding: '1.25rem', background: 'var(--bg-card)', borderRadius: '12px', border: `1px solid ${res.userCorrect ? 'rgba(16,185,129,0.2)' : (res.decisionCorrect ? 'rgba(234,179,8,0.2)' : 'rgba(239,68,68,0.2)')}`, boxShadow: 'var(--shadow-sm)' }}>
                           <p style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', margin: '0 0 0.75rem' }}>Chunk {i + 1} - {res.userCorrect ? '✅ Perfect' : (res.decisionCorrect ? '⚠️ Right decision, flawed reasoning' : '❌ Incorrect')}</p>
                           <p style={{ fontSize: '0.9rem', color: 'var(--text-primary)', margin: '0 0 1rem', lineHeight: 1.6 }}>{res.text}</p>
                           <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                             <span style={{ fontSize: '0.8125rem', padding: '0.25rem 0.5rem', borderRadius: '6px', background: res.actualHallucination ? 'rgba(239,68,68,0.1)' : 'rgba(16,185,129,0.1)', color: res.actualHallucination ? '#ef4444' : '#10b981', display: 'flex', alignItems: 'center', gap: '0.375rem', fontWeight: 600 }}>
                               {res.actualHallucination ? <AlertTriangle size={14} /> : <CheckCircle2 size={14} />}
                               Actual: {res.actualHallucination ? 'Hallucination' : 'Factual'}
                             </span>
                           </div>
                           {res.feedback && res.feedback !== 'The AI judge could not evaluate this specific chunk.' && (
                             <div style={{ padding: '0.875rem', background: 'var(--bg-base)', borderRadius: '8px', border: '1px solid var(--border-default)', display: 'flex', gap: '0.5rem' }}>
                               <Bot size={16} style={{ color: 'var(--accent-primary)', flexShrink: 0, marginTop: '2px' }} />
                               <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
                                 <strong style={{color: 'var(--text-primary)'}}>AI Judge:</strong> {res.feedback}
                               </p>
                             </div>
                           )}
                        </div>
                      ));
                    })()}
                  </div>
                </div>
              ) : history.length === 0 ? (
                <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                  <History size={48} style={{ opacity: 0.5, marginBottom: '1rem' }} />
                  <p>No chat history yet. Start exploring!</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {history.map((h) => (
                    <div key={h.id} onClick={() => setSelectedSession(h)} className="history-card" style={{ padding: '1.25rem', border: '1px solid var(--border-glass)', borderRadius: '12px', background: 'var(--bg-card)', display: 'flex', flexDirection: 'column', gap: '0.75rem', cursor: 'pointer', transition: 'all 0.2s' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
                        <div style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                          <span style={{ color: 'var(--text-muted)', fontWeight: 700, marginRight: '0.5rem' }}>Q:</span>
                          {h.query}
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
                          {h.is_correct === 1 ? (
                            <span className="badge badge-success">✓ Correct</span>
                          ) : (
                            <span className="badge badge-danger">✗ Incorrect</span>
                          )}
                        </div>
                      </div>
                      
                      <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.6, padding: '0.75rem', background: 'var(--bg-base)', borderRadius: '8px', border: '1px solid var(--border-default)' }}>
                        <span style={{ color: 'var(--text-muted)', fontWeight: 700, marginRight: '0.5rem' }}>A:</span>
                        {h.response.length > 200 ? h.response.substring(0, 200) + '...' : h.response}
                      </div>
                      
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.25rem' }}>
                        <div style={{ display: 'flex', gap: '1rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          <span>Actual: <strong style={{ color: h.was_hallucinated === 1 ? '#ef4444' : '#10b981' }}>{h.was_hallucinated === 1 ? 'Hallucination' : 'Factual'}</strong></span>
                          <span>You guessed: <strong style={{ color: 'var(--text-primary)', textTransform: 'capitalize' }}>{h.user_decision}</strong></span>
                        </div>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          {new Date(h.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes bounce {
          0%, 100% { transform: translateY(0); opacity: 0.4; }
          50% { transform: translateY(-5px); opacity: 1; }
        }
        @media (max-width: 900px) {
          div[style*="flex-direction: row"] { flex-direction: column !important; }
          div[style*="width: 360px"] { width: 100% !important; }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .suggestion-btn {
          background: var(--bg-hover);
          border: 1px solid var(--border-default);
          border-radius: 16px;
          padding: 0.5rem 0.875rem;
          font-size: 0.8125rem;
          color: var(--text-secondary);
          cursor: pointer;
          transition: all 0.2s;
          text-align: left;
          max-width: 100%;
        }
        .suggestion-btn:hover {
          border-color: var(--accent-primary);
          color: var(--text-primary);
          background: var(--bg-base);
        }
        .history-card:hover {
          border-color: var(--accent-primary);
          transform: translateY(-2px);
          box-shadow: var(--shadow-md);
        }
      `}</style>
    </div>
  );
}
