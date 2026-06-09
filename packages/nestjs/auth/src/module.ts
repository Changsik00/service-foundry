import { type DynamicModule, type FactoryProvider, Module } from "@nestjs/common";
import { Reflector } from "@nestjs/core";

import { AuthGuard, NESTJS_AUTH_OPTIONS, type NestjsAuthOptions } from "./auth.guard.js";
import { RolesGuard } from "./roles.guard.js";
import { ACCESS_TOKEN_VERIFIER, NativeVerifier } from "./verifier.js";

export interface NestjsAuthAsyncOptions {
  imports?: DynamicModule["imports"];
  inject: NonNullable<FactoryProvider["inject"]>;
  // biome-ignore lint/suspicious/noExplicitAny: NestJS factory injects typed args but signature must be flexible
  useFactory: (...args: any[]) => Promise<NestjsAuthOptions> | NestjsAuthOptions;
}

@Module({})
export class NestjsAuthModule {
  static forRoot(opts: NestjsAuthOptions): DynamicModule {
    return {
      module: NestjsAuthModule,
      providers: [
        { provide: NESTJS_AUTH_OPTIONS, useValue: opts },
        { provide: ACCESS_TOKEN_VERIFIER, useValue: new NativeVerifier(opts) },
        Reflector,
        AuthGuard,
        RolesGuard,
      ],
      exports: [AuthGuard, RolesGuard, NESTJS_AUTH_OPTIONS, ACCESS_TOKEN_VERIFIER],
    };
  }

  static forRootAsync(asyncOpts: NestjsAuthAsyncOptions): DynamicModule {
    return {
      module: NestjsAuthModule,
      imports: asyncOpts.imports ?? [],
      providers: [
        {
          provide: NESTJS_AUTH_OPTIONS,
          inject: asyncOpts.inject,
          useFactory: asyncOpts.useFactory,
        },
        {
          provide: ACCESS_TOKEN_VERIFIER,
          inject: [NESTJS_AUTH_OPTIONS],
          useFactory: (opts: NestjsAuthOptions) => new NativeVerifier(opts),
        },
        Reflector,
        AuthGuard,
        RolesGuard,
      ],
      exports: [AuthGuard, RolesGuard, NESTJS_AUTH_OPTIONS, ACCESS_TOKEN_VERIFIER],
    };
  }
}
