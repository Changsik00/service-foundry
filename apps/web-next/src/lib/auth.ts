// SDK 교체 지점 — 이 파일의 import 1줄만 변경하면 Provider 교체 완료.
//
// Mock SDK 사용 시:
//   import { createMockAuthSDK } from "@repo/frontend-auth-testing";
//   export const authSDK = createMockAuthSDK();
//
// Firebase 사용 시:
//   import { createFirebaseAuthSDK } from "@repo/frontend-auth-firebase";
//   import { initializeApp } from "firebase/app";
//   const firebaseApp = initializeApp({ ... });
//   export const authSDK = createFirebaseAuthSDK(firebaseApp);
//
// Supabase 사용 시:
//   import { createSupabaseAuthSDK } from "@repo/frontend-auth-supabase";
//   export const authSDK = createSupabaseAuthSDK({ url: "...", anonKey: "..." });

import { createHttpAuthSDK } from "./http-auth-sdk";

export const authSDK = createHttpAuthSDK("http://localhost:3001");
