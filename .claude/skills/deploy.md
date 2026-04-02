---
name: deploy
description: 빌드 검증 → 테스트 → 커밋 → 푸시 자동 배포 파이프라인
user_invocable: true
---

# 배포 파이프라인

다음 순서로 실행하세요:

1. **TypeScript 검증**: `npx tsc --noEmit` 실행. 에러 있으면 수정 후 재실행.
2. **테스트 실행**: `npx jest src/lib/data/__tests__/standard-costs.test.ts --no-cache` 실행. 실패 시 수정.
3. **빌드**: `npx next build` 실행. 실패 시 에러 수정.
4. **변경사항 확인**: `git status -s`와 `git diff --stat`으로 변경 내용 확인.
5. **커밋**: 변경 내용에 맞는 한국어 커밋 메시지 작성. Co-Authored-By 포함.
6. **푸시**: `git push origin main` 실행.
7. **결과 보고**: 배포된 커밋 해시와 변경 파일 수를 사용자에게 보고.

모든 단계가 성공해야 다음 단계로 진행합니다. 실패 시 즉시 중단하고 사용자에게 보고합니다.
