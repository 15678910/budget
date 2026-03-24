'use client';

import { useState, useCallback } from 'react';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ShareModal({ isOpen, onClose }: ShareModalProps) {
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [copiedEmbed, setCopiedEmbed] = useState(false);
  const [savingImage, setSavingImage] = useState(false);

  const handleCopyUrl = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2000);
    } catch {
      // fallback
    }
  }, []);

  const handleSaveImage = useCallback(async () => {
    setSavingImage(true);
    try {
      const html2canvas = (await import('html2canvas')).default;
      const main = document.querySelector('main');
      if (!main) return;
      const canvas = await html2canvas(main as HTMLElement, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#09090b',
        logging: false,
      });
      const link = document.createElement('a');
      link.download = `마을살림_나라살림-${document.title.split('|')[0].trim()}-${new Date().toISOString().split('T')[0]}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (error) {
      void error;
    } finally {
      setSavingImage(false);
    }
  }, []);

  const handleCopyEmbed = useCallback(async () => {
    const embedCode = `<iframe src="${window.location.href}" width="100%" height="600" frameborder="0" style="border:none;border-radius:8px;"></iframe>`;
    try {
      await navigator.clipboard.writeText(embedCode);
      setCopiedEmbed(true);
      setTimeout(() => setCopiedEmbed(false), 2000);
    } catch {
      // fallback
    }
  }, []);

  const handleNativeShare = useCallback(async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: document.title,
          url: window.location.href,
        });
      } catch {
        // user cancelled
      }
    }
  }, []);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
        <div
          className="bg-card border border-border rounded-xl shadow-2xl w-full max-w-sm p-5 space-y-3"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-foreground">공유하기</h2>
            <button
              onClick={onClose}
              className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          {/* Option 1: URL Copy */}
          <button
            onClick={handleCopyUrl}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg border border-border hover:bg-muted transition-colors text-left"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-400 shrink-0">
              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
            </svg>
            <div className="flex-1">
              <div className="text-sm font-medium text-foreground">URL 복사</div>
              <div className="text-xs text-muted-foreground">현재 페이지 링크를 클립보드에 복사</div>
            </div>
            {copiedUrl && <span className="text-xs text-emerald-400">복사됨!</span>}
          </button>

          {/* Option 2: Image Save */}
          <button
            onClick={handleSaveImage}
            disabled={savingImage}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg border border-border hover:bg-muted disabled:opacity-50 transition-colors text-left"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-400 shrink-0">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <polyline points="21 15 16 10 5 21" />
            </svg>
            <div className="flex-1">
              <div className="text-sm font-medium text-foreground">
                {savingImage ? '이미지 생성 중...' : '이미지로 저장'}
              </div>
              <div className="text-xs text-muted-foreground">현재 화면을 PNG 이미지로 다운로드</div>
            </div>
          </button>

          {/* Option 3: Embed Code */}
          <button
            onClick={handleCopyEmbed}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg border border-border hover:bg-muted transition-colors text-left"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-400 shrink-0">
              <polyline points="16 18 22 12 16 6" />
              <polyline points="8 6 2 12 8 18" />
            </svg>
            <div className="flex-1">
              <div className="text-sm font-medium text-foreground">임베드 코드 복사</div>
              <div className="text-xs text-muted-foreground">웹사이트에 삽입할 수 있는 iframe 코드</div>
            </div>
            {copiedEmbed && <span className="text-xs text-emerald-400">복사됨!</span>}
          </button>

          {/* Option 4: Native Share (only if available) */}
          {typeof navigator !== 'undefined' && 'share' in navigator && (
            <button
              onClick={handleNativeShare}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg border border-border hover:bg-muted transition-colors text-left"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-violet-400 shrink-0">
                <circle cx="18" cy="5" r="3" />
                <circle cx="6" cy="12" r="3" />
                <circle cx="18" cy="19" r="3" />
                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
              </svg>
              <div className="flex-1">
                <div className="text-sm font-medium text-foreground">SNS 공유</div>
                <div className="text-xs text-muted-foreground">카카오톡, 메시지 등으로 공유</div>
              </div>
            </button>
          )}
        </div>
      </div>
    </>
  );
}
