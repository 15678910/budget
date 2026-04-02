'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

interface PolicyChatbotProps {
  regionType: string;
  regionName: string;
}

export function PolicyChatbot({ regionType, regionName }: PolicyChatbotProps) {
  const [showPolicyChat, setShowPolicyChat] = useState(false);
  const [chatMessages, setChatMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const chatScrollRef = useRef<HTMLDivElement>(null);

  const handlePolicyChat = useCallback(async (question: string) => {
    if (!question.trim() || chatLoading) return;
    const userMsg = { role: 'user' as const, content: question.trim() };
    setChatMessages(prev => [...prev, userMsg]);
    setChatInput('');
    setChatLoading(true);
    try {
      const history = chatMessages.map(m => ({
        role: m.role === 'user' ? 'user' as const : 'model' as const,
        parts: [{ text: m.content }],
      }));
      const res = await fetch('/api/chat/policy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: question.trim(), regionType, regionName, history }),
      });
      if (res.ok) {
        const data = await res.json();
        setChatMessages(prev => [...prev, { role: 'assistant', content: data.answer }]);
      } else {
        setChatMessages(prev => [...prev, { role: 'assistant', content: 'AI 응답 오류가 발생했습니다. 잠시 후 다시 시도해주세요.' }]);
      }
    } catch {
      setChatMessages(prev => [...prev, { role: 'assistant', content: '네트워크 오류가 발생했습니다.' }]);
    } finally {
      setChatLoading(false);
    }
  }, [chatMessages, chatLoading, regionType, regionName]);

  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [chatMessages, chatLoading]);

  return (
    <div id="ai-advisor" className="border-t border-gray-700/50 pt-4">
      <button
        onClick={() => setShowPolicyChat(!showPolicyChat)}
        className="flex items-center gap-2 text-sm text-cyan-400 hover:text-cyan-300 transition-colors"
      >
        <span className="text-base">💬</span>
        {showPolicyChat ? '정책 AI 어드바이저 닫기' : '정책 AI 어드바이저에게 질문하기'}
      </button>

      {showPolicyChat && (
        <div className="mt-3 border border-cyan-500/20 rounded-xl bg-gray-900/80 overflow-hidden">
          {/* Chat header */}
          <div className="bg-cyan-500/10 px-4 py-2 border-b border-cyan-500/20">
            <p className="text-xs text-cyan-300">
              💡 정책에 대해 자유롭게 질문하세요. 현재 지역({regionName}) 재정 데이터를 기반으로 답변합니다.
            </p>
          </div>

          {/* Messages */}
          <div ref={chatScrollRef} className="max-h-80 overflow-y-auto p-4 space-y-3">
            {chatMessages.length === 0 && (
              <div className="text-center py-4 space-y-3">
                <p className="text-sm text-gray-500">질문 예시:</p>
                <div className="flex flex-wrap gap-2 justify-center">
                  {[
                    '이 지역에 가장 적합한 정책은?',
                    '노란봉투법이 이 지역에 미치는 영향',
                    '재정자립도를 높이려면 어떤 정책이 필요한가요?',
                    '공공은행 도입의 장단점',
                  ].map(q => (
                    <button
                      key={q}
                      onClick={() => handlePolicyChat(q)}
                      className="text-xs px-3 py-1.5 bg-cyan-500/10 text-cyan-300 rounded-full hover:bg-cyan-500/20 transition-colors"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {chatMessages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                  msg.role === 'user'
                    ? 'bg-cyan-600 text-white'
                    : 'bg-gray-800 text-gray-200 border border-gray-700/30'
                }`}>
                  <div className="whitespace-pre-wrap">{msg.content}</div>
                </div>
              </div>
            ))}

            {chatLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-800 border border-gray-700/30 rounded-lg px-3 py-2">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full border-2 border-cyan-500 border-t-transparent animate-spin" />
                    <span className="text-sm text-gray-400">AI가 분석 중...</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <div className="border-t border-gray-700/30 p-3">
            <div className="flex gap-2">
              <input
                type="text"
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handlePolicyChat(chatInput)}
                placeholder="정책에 대해 질문하세요..."
                className="flex-1 bg-gray-800 border border-gray-700 text-gray-200 text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-cyan-500 placeholder:text-gray-600"
              />
              <button
                onClick={() => handlePolicyChat(chatInput)}
                disabled={chatLoading || !chatInput.trim()}
                className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 disabled:bg-gray-700 text-white text-sm rounded-lg transition-colors whitespace-nowrap"
              >
                전송
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
