#!/bin/sh
# 로컬 dev 용 app_runtime role 프로비저닝 (spec-17-07).
#
# app_runtime 은 비-슈퍼유저 런타임 role — RLS 테넌트 격리가 *실제로* 적용되는 주체.
# (owner/superuser 는 RLS 를 우회하므로 앱 런타임 접속을 이 role 로 분리한다.)
#
# 이 스크립트는 postgres 컨테이너 *최초 init* 시 1회 실행되어 role 만 만든다.
# 테이블 GRANT 는 `pnpm db:migrate` 의 0012 마이그레이션이 owner 로 적용한다.
# 비밀번호는 APP_RUNTIME_PASSWORD (기본 dev 값) — 운영은 별도 시크릿으로 ALTER ROLE.
set -e

PW="${APP_RUNTIME_PASSWORD:-app_runtime_dev}"

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" \
  -c "DO \$\$ BEGIN IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'app_runtime') THEN CREATE ROLE app_runtime LOGIN PASSWORD '${PW}'; END IF; END \$\$;"
