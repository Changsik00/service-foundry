# Walkthrough: spec-13-04 — transactional outbox

> dual-write 이벤트 유실 회피. `@repo/backend-outbox` (포트 + memory + at-least-once relay). phase-13 마지막 spec.

## 📌 결정 기록
| 이슈 | 선택지 | 결정 | 이유 |
|---|---|---|---|
| 신뢰성 모델 | at-least-once / exactly-once | **at-least-once** | publish→mark; 소비자 멱등(13-02)으로 중복 보완 |
| store | 포트+memory / drizzle 포함 | **포트 + memory** | core framework-agnostic, 라이브 DB 없이 로직 검증 |
| publish 대상 | queue 직결 / 콜백 주입 | **콜백 주입** | queue·notification 디커플 |
| 발행 실패 처리 | skip / 중단 | **중단 후 미마킹** | 순서 보존 + 다음 runOnce 재시도 |

### ADR 승격
- [ ] 후보 `outbox-at-least-once` — phase 머지 시점에 판단(미강제).

## 🧪 검증 결과
### 단위
- `@repo/backend-outbox` ✅ 6 passed
  - store: add→fetchUnpublished 포함 · markPublished 후 제외 · limit
  - relay: 전부 발행+마킹(재호출 0) · **publish 실패 시 미마킹→재시도** · batchSize
- typecheck: turbo 전체 PASS (pre-commit 게이트)

## 🔍 발견 사항
- relay 의 publish 실패 시 **중단(break)** — 이벤트 순서를 보존하며 부분 진행분만 마킹. 실패 이벤트와 그 뒤는 다음 폴에서 재시도(at-least-once).
- `add(event, tx?)` 의 `tx` 파라미터로 "동일 트랜잭션 적재" 의도를 포트에 명시 — memory 는 무시하나 drizzle 어댑터가 채울 확장점.

## 🚧 이월 항목
- **drizzle-backed OutboxStore + 실제 트랜잭션 적재** — 라이브 DB 검증 필요. 성공 기준 5 는 포트/relay 로직으로 충족, DB 배선 후속.
- 폴링 데몬(`runOnce` 루프) — apps/worker 배선 후속.
- exactly-once(멱등 소비자) — 13-02 와 조합 후속.

## 🔗 관련
- 관련 phase: `backlog/phase-13.md` (성공 기준 5 충족)
- 의존: spec-12-02 (queue, publish 대상), spec-13-02 (idempotency)

## 📅 메타
| 항목 | 값 |
|---|---|
| 작성자 | Agent + dennis |
| 작성일 | 2026-05-31 |
| 커밋 | docs 1 + test 1 + feat 1 + ship 1 |
