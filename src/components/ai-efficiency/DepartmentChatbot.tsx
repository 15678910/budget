'use client';

import React, { useState, useRef, useEffect } from 'react';
import type { DepartmentId } from '@/lib/data/ai-efficiency-data';
import { DEPARTMENT_NAME_MAP, DEPARTMENT_ACCENT_MAP } from '@/lib/data/ai-efficiency-data';
import { DEPARTMENT_QA_MAP, findBestMatch } from '@/lib/data/chatbot-qa-data';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  source?: 'rule' | 'ai';
}

export function DepartmentChatbot({ departmentId }: { departmentId: DepartmentId }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const departmentName = DEPARTMENT_NAME_MAP[departmentId];
  const accentColor = DEPARTMENT_ACCENT_MAP[departmentId];
  const suggestedQuestions = DEPARTMENT_QA_MAP[departmentId]?.slice(0, 4) ?? [];

  // 부처 변경 시 대화 초기화
  useEffect(() => {
    setMessages([]);
    setInput('');
  }, [departmentId]);

  // 새 메시지 시 스크롤
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  async function handleSend(question: string) {
    if (!question.trim()) return;

    const userMsg: ChatMessage = { role: 'user', content: question.trim() };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    // 1) 규칙 기반 매칭 시도
    const match = findBestMatch(departmentId, question);
    if (match) {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: match.answer, source: 'rule' },
      ]);
      setLoading(false);
      return;
    }

    // 2) Claude API 폴백 시도
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question, departmentId }),
      });

      if (res.ok) {
        const data = await res.json();
        setMessages((prev) => [
          ...prev,
          { role: 'assistant', content: data.answer, source: 'ai' },
        ]);
      } else {
        const errData = await res.json().catch(() => ({}));
        const isNoKey = res.status === 503;
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: isNoKey
              ? `이 질문에 대한 사전 답변이 없습니다. 추천 질문을 선택하시거나, AI 답변을 위해 .env.local에 ANTHROPIC_API_KEY를 설정해주세요.`
              : errData.error || '답변을 생성하지 못했습니다. 다시 시도해주세요.',
            source: 'rule',
          },
        ]);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: '네트워크 오류가 발생했습니다. 추천 질문을 선택해주세요.',
          source: 'rule',
        },
      ]);
    }

    setLoading(false);
  }

  return (
    <div className="border border-border rounded overflow-hidden">
      {/* Toggle Header */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between px-4 py-3 hover:bg-muted/50 transition-colors text-left`}
      >
        <span className={`text-sm md:text-base font-semibold uppercase tracking-widest ${accentColor}`}>
          {departmentName} AI 질문하기
        </span>
        <span className="text-muted-foreground text-lg leading-none">{isOpen ? '−' : '+'}</span>
      </button>

      {isOpen && (
        <div className="border-t border-border">
          {/* 추천 질문 */}
          {messages.length === 0 && (
            <div className="px-4 py-3 space-y-2">
              <div className="text-xs text-muted-foreground/60 uppercase tracking-wider">추천 질문</div>
              <div className="flex flex-wrap gap-2">
                {suggestedQuestions.map((qa) => (
                  <button
                    key={qa.question}
                    onClick={() => handleSend(qa.question)}
                    className="px-3 py-1.5 text-sm border border-border rounded-full hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {qa.question}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 대화 영역 */}
          {messages.length > 0 && (
            <div
              ref={scrollRef}
              className="px-4 py-3 space-y-3 max-h-80 overflow-y-auto"
            >
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-[85%] px-3 py-2 rounded-lg text-sm leading-relaxed ${
                      msg.role === 'user'
                        ? 'bg-muted text-foreground'
                        : 'border border-border text-muted-foreground'
                    }`}
                  >
                    {msg.content}
                    {msg.role === 'assistant' && msg.source && (
                      <span
                        className={`ml-2 inline-block text-[10px] px-1.5 py-0.5 rounded ${
                          msg.source === 'ai'
                            ? 'bg-blue-900/50 text-blue-400'
                            : 'bg-muted text-muted-foreground/60'
                        }`}
                      >
                        {msg.source === 'ai' ? 'AI' : '데이터'}
                      </span>
                    )}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="px-3 py-2 border border-border rounded-lg text-sm text-muted-foreground/60">
                    답변 생성 중...
                  </div>
                </div>
              )}

              {/* 대화 중 추천 질문 */}
              {!loading && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {suggestedQuestions
                    .filter((qa) => !messages.some((m) => m.content === qa.question))
                    .slice(0, 3)
                    .map((qa) => (
                      <button
                        key={qa.question}
                        onClick={() => handleSend(qa.question)}
                        className="px-2.5 py-1 text-xs border border-border rounded-full hover:bg-muted/50 text-muted-foreground/60 hover:text-muted-foreground transition-colors"
                      >
                        {qa.question}
                      </button>
                    ))}
                </div>
              )}
            </div>
          )}

          {/* 입력 영역 */}
          <div className="border-t border-border px-4 py-3 flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !loading && handleSend(input)}
              placeholder={`${departmentName} AI 효율화에 대해 질문하세요...`}
              disabled={loading}
              className="flex-1 bg-muted/30 border border-border rounded px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-muted-foreground/50 disabled:opacity-50"
            />
            <button
              onClick={() => handleSend(input)}
              disabled={loading || !input.trim()}
              className={`px-4 py-2 text-sm font-medium rounded border border-border ${accentColor} hover:bg-muted/50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors`}
            >
              전송
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
