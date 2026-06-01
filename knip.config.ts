import base from "@repo/knip-config/base" with { type: "json" };
import type { KnipConfig } from "knip";

// knip 6 은 config `extends` 를 지원하지 않으므로, 공유 preset(@repo/knip-config/base)을
// root config 로 re-export 해 단일 진입점으로 소비한다. preset 이 SoT.
export default base as KnipConfig;
