-- 외부 노출 불투명 식별자 생성기 (ADR-0028, spec-26-02).
-- prefix + '_' + Crockford base32(16바이트 랜덤, 26자). @repo/backend-id.publicId() 와 동일 포맷.
-- 랜덤원: gen_random_uuid()(core, PG13+) — pgcrypto 확장 비의존.
-- VOLATILE: ADD COLUMN 시 기존 행도 행별 평가되어 백필됨.
CREATE OR REPLACE FUNCTION gen_public_id(prefix text) RETURNS text AS $$
DECLARE
  alphabet constant text := '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
  bytes bytea := decode(replace(gen_random_uuid()::text, '-', ''), 'hex');
  result text := '';
  acc bigint := 0;
  bits int := 0;
  i int;
BEGIN
  FOR i IN 0..15 LOOP
    acc := (acc << 8) | get_byte(bytes, i);
    bits := bits + 8;
    WHILE bits >= 5 LOOP
      bits := bits - 5;
      result := result || substr(alphabet, ((acc >> bits) & 31)::int + 1, 1);
    END LOOP;
    acc := acc & ((1 << bits) - 1);
  END LOOP;
  IF bits > 0 THEN
    result := result || substr(alphabet, ((acc << (5 - bits)) & 31)::int + 1, 1);
  END IF;
  RETURN prefix || '_' || result;
END;
$$ LANGUAGE plpgsql VOLATILE;
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "public_id" text DEFAULT gen_public_id('usr') NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_public_id_unique" UNIQUE("public_id");
