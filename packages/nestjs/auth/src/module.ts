import { type DynamicModule, type FactoryProvider, Module } from "@nestjs/common";
import { Reflector } from "@nestjs/core";

import { AuthGuard, NESTJS_AUTH_OPTIONS, type NestjsAuthOptions } from "./auth.guard.js";
import { RolesGuard } from "./roles.guard.js";

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
        Reflector,
        AuthGuard,
        RolesGuard,
      ],
      exports: [AuthGuard, RolesGuard, NESTJS_AUTH_OPTIONS],
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
        Reflector,
        AuthGuard,
        RolesGuard,
      ],
      exports: [AuthGuard, RolesGuard, NESTJS_AUTH_OPTIONS],
    };
  }
}
