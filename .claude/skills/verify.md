---
name: verify
description: 코드 품질 검증 - 타입체크 + 테스트 + 빌드 + 파일 크기 확인
user_invocable: true
---

# 코드 검증

다음을 순서대로 실행하고 결과를 보고하세요:

1. **TypeScript**: `npx tsc --noEmit` — 에러 0건 확인
2. **테스트**: `npx jest --no-cache` — 전체 통과 확인
3. **빌드**: `npx next build` — 성공 확인
4. **파일 크기 검사**: 300줄 초과 컴포넌트 파일 확인
   ```
   find src/components -name "*.tsx" -exec sh -c 'wc -l "$1" | awk "{if(\$1>300) print}"' _ {} \;
   ```
5. **console.log 검사**: 클라이언트 컴포넌트에 console.log가 있는지 확인
   ```
   grep -rn "console\." src/components/ --include="*.tsx" | grep -v "// eslint"
   ```
6. **결과 요약**: 각 항목의 통과/실패를 테이블로 보고

하나라도 실패하면 "배포 불가" 판정을 내리고 수정 방안을 제시합니다.
