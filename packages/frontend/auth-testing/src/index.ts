import type {
  AuthResult,
  AuthSDK,
  Session,
  SignInInput,
  SignUpInput,
  User,
} from "@repo/auth-contracts";

export interface MockAuthState {
  currentUser: User | null;
  signInResult: AuthResult;
  signUpResult: AuthResult;
  refreshResult: Session | null;
}

export interface MockAuthCalls {
  signIn: SignInInput[];
  signUp: SignUpInput[];
  signOutCount: number;
  getCurrentUserCount: number;
  refreshCount: number;
}

export interface MockControls {
  _state: MockAuthState;
  _calls: MockAuthCalls;
  _reset(): void;
}

export type MockAuthSDK = AuthSDK & MockControls;

export const DEFAULT_STATE: MockAuthState = {
  currentUser: null,
  signInResult: { success: false, reason: "invalid_credentials" },
  signUpResult: { success: false, reason: "invalid_credentials" },
  refreshResult: null,
};

function makeInitialCalls(): MockAuthCalls {
  return {
    signIn: [],
    signUp: [],
    signOutCount: 0,
    getCurrentUserCount: 0,
    refreshCount: 0,
  };
}

export function createMockAuthSDK(initial?: Partial<MockAuthState>): MockAuthSDK {
  const state: MockAuthState = { ...DEFAULT_STATE, ...initial };
  let calls = makeInitialCalls();

  return {
    async signIn(input: SignInInput): Promise<AuthResult> {
      calls.signIn.push(input);
      const result = state.signInResult;
      if (result.success) state.currentUser = result.user;
      return result;
    },

    async signUp(input: SignUpInput): Promise<AuthResult> {
      calls.signUp.push(input);
      const result = state.signUpResult;
      if (result.success) state.currentUser = result.user;
      return result;
    },

    async signOut(): Promise<void> {
      calls.signOutCount++;
      state.currentUser = null;
    },

    async getCurrentUser(): Promise<User | null> {
      calls.getCurrentUserCount++;
      return state.currentUser;
    },

    async refresh(): Promise<Session | null> {
      calls.refreshCount++;
      return state.refreshResult;
    },

    async verifyMfaTotp(): Promise<AuthResult> {
      throw new Error("not implemented in mock");
    },

    async fetchPasskeyRegisterOptions(): Promise<{ challengeToken: string; options: object }> {
      throw new Error("not implemented in mock");
    },

    async verifyPasskeyRegister(): Promise<void> {
      throw new Error("not implemented in mock");
    },

    async fetchPasskeyAuthOptions(): Promise<{ challengeToken: string; options: object }> {
      throw new Error("not implemented in mock");
    },

    async verifyPasskeyAuth(): Promise<AuthResult> {
      throw new Error("not implemented in mock");
    },

    get _state() {
      return state;
    },

    get _calls() {
      return calls;
    },

    _reset() {
      state.currentUser = DEFAULT_STATE.currentUser;
      state.signInResult = DEFAULT_STATE.signInResult;
      state.signUpResult = DEFAULT_STATE.signUpResult;
      state.refreshResult = DEFAULT_STATE.refreshResult;
      calls = makeInitialCalls();
    },
  };
}
