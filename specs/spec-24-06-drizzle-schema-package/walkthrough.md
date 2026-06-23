
## 📌 결정 기록 (auto)

| 이슈 | 결정 | 근거 |
|---|---|---|
| E2 스키마 패키지 경계 | 스키마 소스만 @repo/backend-schema 로, migrations+drizzle.config 는 apps/api 잔류 | 마이그레이션은 app/deploy 관심사·저널 정합 유지; 스키마 def 만 재사용 대상 |
