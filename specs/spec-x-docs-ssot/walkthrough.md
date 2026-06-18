# Walkthrough: spec-x-docs-ssot

> 문서 SSOT 정책 명문화 + 정리.

## 📌 결정 기록

| 이슈 | 선택지 | 결정 | 이유 |
|---|---|---|---|
| SSOT 정책 위치 | 새 문서 / CONVENTIONS 확장 | **CONVENTIONS §2.5** | 규약의 SSOT — 정책도 한 곳 |
| 루트 ARCHITECTURE.md | 완전 삭제 / pointer 전용 / 원칙+포인터 | **§0 엔지니어링 원칙 유지 + 구조는 reference 안내** | §0(TS-first·"설치버전=SoT")은 ADR-0002/0004·FRONT.md 가 참조하는 *고유 정본* — 삭제하면 referrer 깨짐. §1~3(구조)만 제거(reference 중복) |
| 정본 architecture | 루트 / docs/reference | **docs/reference/architecture.md** | 이미 현행·matklad 스타일 |
| 카운트 표기 | 숫자 유지 / 제거 | **제거(코드/index 참조)** | 카운트는 drift 원천 (ADR 20→26, 패키지 48 등 이미 stale였음) |

## 💬 사용자 협의
- "문서 위치가 중요, SSOT 정책 만들고 정리" → SSOT 정책 명문화 중심으로 재정의.
- 초기 "ARCHITECTURE.md 재작성"으로 봤으나, 조사 결과 **docs/reference/architecture.md 가 이미 정본**이고 루트가 stale 중복임을 확인 → "정본 일원화"로 reframe.

## 🧪 검증 결과
- 비-ADR stale grep(web-vite/web-next/fastify/Node22) → ADR 본문(point-in-time) 외 정리 완료.
- 루트 ARCHITECTURE.md: 구조 중복 본문 제거(-205줄), §0 원칙만 유지(Node 24 최신화).
- index.md: ADR 0021~0026 + RCA-003 등재(누락이었음).

## 🔍 발견 사항
- `docs/reference/architecture.md` 가 멀티테넌시/RLS·인증 권위 모드·배포(k8s) 누락 → 보강.
- index.md ADR 목록이 0020 에서 멈춰 6개 누락.
- README "ADR 20개/패키지 48개" stale.
- ADR 본문(0025/0021/0016)의 web-vite/Fastify 언급은 **point-in-time 기록이라 보존**(SSOT 규약).

## 🚧 이월 항목 (Icebox 기록)
- turbo generator `vite` 앱 옵션 drift (템플릿 부재) — 코드.
- `ci-verify-gate.md` explainer 의 web-vite 잔재 — explainer 갱신 필요.
