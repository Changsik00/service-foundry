# docs(spec-14-08): 지식베이스 문서 환각 전수 검증

## 📋 Summary

### 배경 및 목적
spec-14-07(#91)의 지식베이스 문서(reference 48 + explainer 37 + README 52)는 Sonnet 서브에이전트가 대량 저술했고 소켓 중단·glob 누락 사고가 있었다. 구조 검증(docs-lint)만 거쳤고 **내용 정확성(소스 대조)은 미검증** — "권위 있어 보이는 틀린 문서" 위험. 본 spec 은 모든 노트를 실제 소스와 1:1 대조해 환각을 탐지·수정한다.

### 주요 변경 사항
- [x] reference 52 + architecture + stack — export 표·시그니처·의존·경로를 실제 `src/index.ts` 와 대조 (11 수정)
- [x] explainer 23(auth12+backend11) — 동작 서술·mermaid·이벤트명·컬럼명을 소스와 대조 (10 수정)
- [x] README 52 — import·시그니처·버전 정정 (6 수정)
- [x] **합계 27 환각/불일치 수정**, docs-lint 회귀 0
- [x] Opus grep 스포트체크 11건 — 서브에이전트 허위검증 0 확인

### Phase 컨텍스트
- **Phase**: `phase-14`
- **역할**: 지식베이스(spec-14-07) 정확성 보증 → main 승격(phase-ship) 적격화. AI 대량 저술 문서의 환각 리스크를 검증으로 차단.

## 🎯 Key Review Points
1. **CSRF 미배선 발견(🔒 보안)**: 문서 검증 부산물로 실제 코드 결함 발견 — `auth-rate-limit/csrf.ts` 구현됐으나 `apps/api` 미배선. **코드 미수정**(범위 외), Icebox 등록. cookie-strategy 과장 서술은 수정.
2. **검증 방법**: 서브에이전트 대조 + Opus grep 재검증(허위검증 차단) — `verification-report.md` 참조.
3. 코드 변경 0 — 문서를 소스에 맞춤(소스 무수정).

## 🧪 Verification
```bash
bash tooling/scripts/docs-lint.sh   # ✅ PASS (링크/frontmatter/fence 0)
```
- 내용 정확성: 27 수정, Opus 스포트체크 11/11 일치.

## 📦 Files Changed
- 🛠 reference/explainer/README ~33 문서 수정
- 🆕 `specs/spec-14-08-docs-verification/verification-report.md`
- 🛠 `backlog/queue.md` (Icebox: CSRF 보안 발견 + RCA-002 링크)

## ✅ Definition of Done
- [x] reference/explainer/README 전수·표본 대조 완료
- [x] verification-report 작성 + Opus 스포트체크
- [x] docs-lint PASS
- [x] walkthrough/pr_description ship

## 🔗 관련 자료
- Phase: `backlog/phase-14.md`
- 검증 대상: spec-14-07 (#91)
- 리포트: `specs/spec-14-08-docs-verification/verification-report.md`
- 보안 발견: `backlog/queue.md` Icebox (CSRF 배선)
