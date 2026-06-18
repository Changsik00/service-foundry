# Implementation Plan: spec-x-org-screens

## 🛑 사용자 검토 필요
> [!IMPORTANT]
> - [x] 스코프: #137 API 소비 화면 4종 (로드맵 합의 + "머지 완료" 진행 지시)
> - [x] "새 조직 만들기" 생략 — 생성 API 부재 (filler 금지)

## 🎯 핵심 전략

| 결정 | 선택 | 이유 |
|---|---|---|
| 전환 후 갱신 | `queryClient.invalidateQueries()` 전체 | ADR-0026 토큰 불변 — org 스코프 데이터 전부 무효화가 정확 |
| Table/Badge | frontend-ui fill-forward 생성 (TOKEN.md §6 스펙) | 멤버 화면이 첫 실수요 |
| 초대 폼 | 멤버 페이지 인라인 (RHF+Zod) | 모달 불필요 — DESIGN 단순성 |
| /invite/[token] | (auth) 골격 밖 독립 라우트 | 로그인/비로그인 양쪽 접근 (DESIGN §6.4) |

## 📂 Tasks
1. features/orgs(쿼리·뮤테이션) + TenantSwitcher + 사이드바 통합
2. /orgs 선택 화면 + frontend-ui Table·Badge + /members(목록+초대 폼)
3. /invite/[token] 수락 화면
4. e2e + ship

## 🧪 검증 — 단위 TDD + full-stack e2e + Audit Checklist
