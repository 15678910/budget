'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

const SUGGESTED_QUESTIONS = [
  '2026년 국방 예산은 얼마인가요?',
  '교육 분야 예산이 가장 많은 부처는?',
  '올해 복지 예산은 전년 대비 얼마나 늘었나요?',
  '과학기술 R&D 예산 현황을 알려주세요',
];

const AVAILABLE_YEARS = [2023, 2024, 2025, 2026];

export function BudgetChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [year, setYear] = useState(2026);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to latest message
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleSend = useCallback(async (question: string) => {
    if (!question.trim() || loading) return;

    const userMsg: ChatMessage = { role: 'user', content: question.trim() };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/chat/budget', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: question.trim(), year }),
      });

      if (res.ok) {
        const data = await res.json();
        setMessages((prev) => [
          ...prev,
          { role: 'assistant', content: data.answer },
        ]);
      } else {
        const isNoKey = res.status === 503;
        const errData = await res.json().catch(() => ({}));
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: isNoKey
              ? 'AI 챗봇을 사용하려면 관리자에게 문의하세요.'
              : errData.error || '답변을 생성하지 못했습니다. 다시 시도해주세요.',
          },
        ]);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: '네트워크 오류가 발생했습니다. 다시 시도해주세요.',
        },
      ]);
    }

    setLoading(false);
  }, [loading, year]);

  return (
    <>
      {/* Floating Chat Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg flex items-center justify-center transition-all hover:scale-105 active:scale-95"
          aria-label="예산 챗봇 열기"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 w-[350px] max-sm:w-[calc(100%-2rem)] max-sm:right-4 max-sm:left-4 h-[500px] bg-card text-card-foreground border border-border rounded-xl shadow-2xl flex flex-col overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/30">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full" />
              <span className="text-sm font-semibold">예산 AI 챗봇</span>
            </div>
            <div className="flex items-center gap-2">
              {/* Year selector */}
              <select
                value={year}
                onChange={(e) => setYear(Number(e.target.value))}
                className="text-xs bg-muted border border-border rounded px-2 py-1 text-foreground focus:outline-none focus:ring-1 focus:ring-blue-500"
                aria-label="연도 선택"
              >
                {AVAILABLE_YEARS.map((y) => (
                  <option key={y} value={y}>
                    {y}년
                  </option>
                ))}
              </select>
              {/* Close button */}
              <button
                onClick={() => setIsOpen(false)}
                className="text-muted-foreground hover:text-foreground transition-colors p-1"
                aria-label="챗봇 닫기"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
          </div>

          {/* Messages Area */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
            {/* Suggested questions when no messages */}
            {messages.length === 0 && !loading && (
              <div className="space-y-3">
                <p className="text-xs text-muted-foreground/60 uppercase tracking-wider">
                  추천 질문
                </p>
                <div className="flex flex-wrap gap-2">
                  {SUGGESTED_QUESTIONS.map((q) => (
                    <button
                      key={q}
                      onClick={() => handleSend(q)}
                      className="px-3 py-1.5 text-sm border border-border rounded-full hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors text-left"
                    >
                      {q}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground/40 mt-2">
                  {year}년 정부 예산 데이터 기반으로 답변합니다.
                </p>
              </div>
            )}

            {/* Chat messages */}
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] px-3 py-2 rounded-lg text-sm leading-relaxed whitespace-pre-wrap ${
                    msg.role === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-muted text-foreground'
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}

            {/* Loading indicator */}
            {loading && (
              <div className="flex justify-start">
                <div className="px-3 py-2 bg-muted rounded-lg text-sm text-muted-foreground">
                  <span className="inline-flex gap-1">
                    <span className="animate-bounce" style={{ animationDelay: '0ms' }}>.</span>
                    <span className="animate-bounce" style={{ animationDelay: '150ms' }}>.</span>
                    <span className="animate-bounce" style={{ animationDelay: '300ms' }}>.</span>
                  </span>
                  {' '}답변 생성 중
                </div>
              </div>
            )}

            {/* Inline suggested questions after conversation starts */}
            {messages.length > 0 && !loading && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {SUGGESTED_QUESTIONS
                  .filter((q) => !messages.some((m) => m.content === q))
                  .slice(0, 2)
                  .map((q) => (
                    <button
                      key={q}
                      onClick={() => handleSend(q)}
                      className="px-2.5 py-1 text-xs border border-border rounded-full hover:bg-muted/50 text-muted-foreground/60 hover:text-muted-foreground transition-colors"
                    >
                      {q}
                    </button>
                  ))}
              </div>
            )}
          </div>

          {/* Input Area */}
          <div className="border-t border-border px-4 py-3 flex gap-2">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.nativeEvent.isComposing && !loading) {
                  handleSend(input);
                }
              }}
              placeholder="예산에 대해 질문하세요..."
              disabled={loading}
              className="flex-1 bg-muted/30 border border-border rounded px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-blue-500 disabled:opacity-50"
            />
            <button
              onClick={() => handleSend(input)}
              disabled={loading || !input.trim()}
              className="px-4 py-2 text-sm font-medium rounded bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              전송
            </button>
          </div>
        </div>
      )}
    </>
  );
}
