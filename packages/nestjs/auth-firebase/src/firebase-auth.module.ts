import { type DynamicModule, Module } from "@nestjs/common";
import { ACCESS_TOKEN_VERIFIER } from "@repo/nestjs-auth";
import type { ServiceAccount } from "firebase-admin";
import { cert, initializeApp } from "firebase-admin/app";
import { FIREBASE_ADMIN_APP, FirebaseVerifier } from "./firebase-verifier.js";

export interface FirebaseAuthOptions {
  serviceAccount: ServiceAccount | string;
  projectId?: string;
}

@Module({})
export class NestjsFirebaseAuthModule {
  static forRoot(opts: FirebaseAuthOptions): DynamicModule {
    throw new Error("not implemented");
  }
}
