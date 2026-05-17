# ADR-001: AI-First 모노레포의 Linting / Formatting / 코드 품질 전략

* 상태: 채택됨
* 날짜: 2026-05-17
* 담당: Platform / Frontend / Backend
* 스코프: 모노레포 (Frontend + Backend + Shared Packages)

---

# 배경

본 저장소는 AI-first 개발 환경으로 설계되었다.

주요 특성:

* 모노레포 아키텍처
* `pnpm` workspace
* `Turborepo`
* frontend/backend 간 공유 패키지
* AI 코딩 에이전트의 적극적 활용

  * Claude Code
  * Codex
  * Cursor
  * Windsurf
* 다음 항목에 높은 비중을 둠:

  * DX (Developer Experience)
  * 빠른 이터레이션
  * 일관된 코드 생성
  * 낮은 유지보수 부담
  * CI 속도
  * 아키텍처 일관성

전통적인 엔터프라이즈 linting 전략은 거대한 룰셋과 복잡한 정적 분석 파이프라인으로 인간의 실수를 통제하는 데 초점을 두어 왔다.

그러나 AI 보조 개발에서는 지배적 리스크의 양상이 바뀌었다.

현재의 주요 문제는 다음과 같다:

* dead code 생성
* 부분적으로만 끝난 마이그레이션
* 의존성 drift
* 아키텍처 경계 위반
* 중복 추상화
* circular imports
* AI가 만들어내는 과도한 엔지니어링
* 느린 피드백 루프

따라서 본 저장소는 다음에 최적화된 툴링 전략이 필요하다:

* 빠른 피드백
* 낮은 설정 복잡도
* 강력한 아키텍처 안전성
* AI 호환성
* 자동화된 정리/탐지

전통적 엔터프라이즈 스타일 단속이 아니라.

---

# 결정

본 저장소는 다음 전략을 채택한다:

```txt
Biome
+ TypeScript strict mode
+ Knip
+ dependency-cruiser
+ CI-based architectural validation
```

향후 명시적 요구가 생기지 않는 한, 무겁게 커스터마이즈된 ESLint 생태계는 도입하지 않는다.

---

# 세부 결정

## 1. Formatter + Base Linter

### 결정

다음을 사용한다:

```txt
Biome
```

주 formatter 및 경량 linter로.

### 이유

Biome는 다음을 제공한다:

* 극도로 빠른 실행
* 최소한의 설정
* 안정적인 auto-fix 동작
* 일관된 formatting
* 뛰어난 AI 에이전트 호환성
* 의존성 복잡도 감소
* 플러그인 유지보수 부담 감소

다음과 비교했을 때:

```txt
ESLint + Prettier + multiple plugins
```

Biome는 다음을 크게 줄인다:

* 설정 drift
* 플러그인 충돌
* 파서 비호환
* auto-fix 불안정성
* AI가 유발하는 lint 루프

이는 에이전트가 파일을 지속적으로 수정하는 AI 보조 워크플로에서 특히 중요하다.

### 명시적 Non-Goal

본 저장소는 다음을 최적화 대상으로 삼지 않는다:

* 큰 스타일 룰 생태계
* 광범위한 커스텀 AST 룰
* 레거시 ESLint 호환성
* 매우 세밀한 formatting 선호

스타일 강제는 아키텍처 무결성 및 정리 자동화보다 낮은 우선순위로 본다.

---

# 2. 타입 안전성

## 결정

전역적으로 TypeScript strict 설정을 활성화한다.

### 설정

```json
{
  "compilerOptions": {
    "strict": true
  }
}
```

### 이유

TypeScript strict 모드는 다음을 제공한다:

* 강한 정적 보장
* 더 나은 AI 생성 코드 검증
* 더 빠른 이슈 탐지
* 런타임 버그 감소
* 더 예측 가능한 리팩토링

strict 타이핑은 과도한 lint 룰 확장보다 가치 있다고 본다.

---

# 3. Dead Code 탐지

## 결정

다음을 채택한다:

```txt
Knip
```

미사용 코드 및 의존성 분석용으로.

### 이유

AI가 생성한 코드는 자주 다음을 만들어낸다:

* 미사용 유틸리티
* 미사용 타입
* 고아 hook
* 중복 추상화
* 부분 마이그레이션
* dead exports

전통적인 linting으로는 저장소 전반의 dead code 누적을 충분히 탐지하지 못한다.

Knip은 AI 보조 저장소에서 특히 가치 있는데, 다음을 탐지하기 때문이다:

* 미사용 파일
* 미사용 exports
* 미사용 의존성
* 미사용 스크립트

이는 장기적인 저장소 엔트로피를 줄여 준다.

---

# 4. 아키텍처 경계 강제

## 결정

다음을 채택한다:

```txt
dependency-cruiser
```

의존성 그래프 검증용으로.

### 이유

AI 에이전트는 국소적 패턴 생성에는 능하지만 전역적 아키텍처 제약을 보존하는 데에는 약하다.

흔한 AI 유발 이슈:

* 레이어 위반
* 공유 패키지 누수
* 순환 의존성
* 도메인 간 cross import
* infra/domain 결합

dependency-cruiser는 다음과 같은 명시적 아키텍처 룰을 가능하게 한다:

```txt
frontend -> backend import forbidden
infra -> domain forbidden
apps cannot bypass shared contracts
circular imports forbidden
```

이는 장기적인 모노레포 유지보수성을 보호한다.

---

# 5. CI 철학

## 결정

CI 파이프라인은 다음을 우선해야 한다:

```txt
Fast feedback
```

철저한 스타일 강제보다.

### 이유

AI-first 저장소에서는:

* 코드 생성 비용이 낮다
* 정리 비용이 높다

따라서:

* 빠른 검증
* 즉각적 피드백
* 구조적 무결성
* dead code 탐지

가 다음보다 가치 있다:

* formatting 마이크로매니징
* 네이밍 컨벤션 강제
* 과도한 스타일 lint 룰

---

# 6. 명시적으로 거부한 접근

## 거부: 무거운 엔터프라이즈 ESLint 스택

예시:

```txt
eslint
@typescript-eslint/*
eslint-plugin-import
eslint-plugin-react
eslint-plugin-unicorn
eslint-plugin-sonarjs
custom AST rules
complex flat config
```

### 거부 이유

* 높은 유지보수 비용
* 느린 CI
* 플러그인 파편화
* AI auto-fix 불안정
* 증가한 설정 복잡도
* 더 큰 온보딩 부담
* 잦은 파서/플러그인 버전 충돌

본 저장소 전략 기준으로는 비용/편익 비율이 정당화되지 않는다.

---

# 7. AI-First 엔지니어링 철학

본 저장소는 다음을 전제한다:

```txt
AI will generate a large amount of code.
```

따라서 시스템은 다음에 최적화된다:

```txt
Detecting bad code quickly
```

이것보다는:

```txt
Preventing humans from writing bad code manually
```

아키텍처는 다음을 우선한다:

* 정리 자동화
* 경계 강제
* 빠른 이터레이션
* 예측 가능한 툴링
* 저장소 확장성
* AI 워크플로 안정성

전통적인 룰 중심 거버넌스 모델보다.

---

# 결과

## 장점

* 더 빠른 개발 사이클
* 더 나은 AI 통합
* 단순한 온보딩
* 낮은 유지보수 부담
* 빠른 CI
* 더 깨끗한 모노레포 경계
* 더 나은 dead-code 관리
* lint/설정 피로 감소

## 단점

* ESLint보다 작은 플러그인 생태계
* 더 세밀한 lint 커스터마이징 불가
* 레거시 호환성 감소
* 일부 고급 semantic linting 불가
* 요구가 바뀔 경우 향후 마이그레이션 비용 가능

---

# 재검토 기준

다음 경우 본 ADR을 재검토해야 한다:

* 저장소가 고급 semantic linting을 요구할 때
* 프레임워크 특화 ESLint 통합이 필수가 될 때
* 보안/컴플라이언스 정책이 더 엄격한 정적 분석을 요구할 때
* AI 툴링 패턴이 크게 진화할 때
* Biome 생태계 성숙도가 크게 바뀔 때

---

# 최종 전략 요약

```txt
Formatting:
  Biome

Type Safety:
  TypeScript strict mode

Dead Code Detection:
  Knip

Architecture Enforcement:
  dependency-cruiser

CI Philosophy:
  Fast feedback over style micromanagement

Primary Goal:
  AI-friendly scalable monorepo maintenance
```
