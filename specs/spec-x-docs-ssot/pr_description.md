# docs(spec-x-docs-ssot): document location / SSOT policy + cleanup

## 📋 Summary

### 배경 및 목적
문서 위치/정본(SSOT) 규칙이 루트↔docs/ 경계에 없어 루트 `ARCHITECTURE.md` 가 정본(`docs/reference/architecture.md`)의 stale 중복이 돼 있었다. SSOT 정책을 명문화하고 그에 맞춰 중복 제거 + drift 정정.

### 주요 변경 사항
- [x] **SSOT 정책** — `docs/CONVENTIONS.md` §2.5: 루트↔docs 경계 + topic→정본 표 + "중복 금지" 규칙
- [x] **루트 `ARCHITECTURE.md`** — 구조 중복 본문 제거(-205줄), §0 엔지니어링 원칙(TS-first·"설치버전=SoT", Node 24 최신화)만 유지 + 구조는 reference 안내
- [x] **`docs/reference/architecture.md`** — 멀티테넌시/RLS·인증 권위 모드·배포(k8s) 보강, 카테고리 카운트 제거(drift 방지)
- [x] **drift 정정** — index.md ADR 0021~0026 + RCA-003 등재, README 카운트 제거, turborepo-rules Fastify/Vite→NestJS

## 🎯 Key Review Points
1. **SSOT 핵심**: 주제별 정본 1곳, 나머지는 링크. 시스템 구조 정본 = `docs/reference/architecture.md`; 엔지니어링 원칙 정본 = 루트 `ARCHITECTURE.md` §0(ADR들이 참조).
2. **ADR 본문 보존**: 0025/0021/0016 의 web-vite/Fastify 언급은 point-in-time 기록이라 의도적 유지.
3. **카운트 제거**: 숫자(ADR 20·패키지 48)는 drift 원천 → index/코드 참조로 대체.

## 🧪 Verification
```bash
grep -rniE 'web-vite|web-next|fastify|Node 22' README.md ARCHITECTURE.md docs/ | grep -v docs/adr/
```
- 비-ADR stale 정리 완료 (잔여는 point-in-time review/notes + 일반 capability 언급).

## 📦 Files Changed
- `docs/CONVENTIONS.md`(+SSOT §2.5), `ARCHITECTURE.md`(-205), `docs/reference/architecture.md`, `docs/index.md`, `README.md`, `docs/turborepo-rules.md`, `backlog/queue.md`

## ⚠️ 이월 (Icebox)
- turbo generator `vite` 앱 옵션 drift (템플릿 부재)
- `ci-verify-gate.md` explainer web-vite 잔재

## ✅ Definition of Done
- [x] SSOT 정책 + 루트 ARCHITECTURE 일원화 + reference 최신화 + drift 정정
- [ ] PR CI 그린
