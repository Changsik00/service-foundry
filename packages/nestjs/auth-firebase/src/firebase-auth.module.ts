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
    const credential =
      typeof opts.serviceAccount === "string"
        ? cert(opts.serviceAccount)
        : cert(opts.serviceAccount);
    const appOptions = opts.projectId ? { credential, projectId: opts.projectId } : { credential };
    const app = initializeApp(appOptions);
    return {
      module: NestjsFirebaseAuthModule,
      providers: [
        { provide: FIREBASE_ADMIN_APP, useValue: app },
        FirebaseVerifier,
        { provide: ACCESS_TOKEN_VERIFIER, useExisting: FirebaseVerifier },
      ],
      exports: [ACCESS_TOKEN_VERIFIER, FIREBASE_ADMIN_APP],
    };
  }
}
