import type { AuthResult, MfaChallenge } from "@repo/auth-contracts";
import { startAuthentication } from "@simplewebauthn/browser";
import { useCallback, useState } from "react";

type MfaSdk = {
  verifyMfaTotp(mfaChallengeToken: string, code: string): Promise<AuthResult>;
  fetchPasskeyAuthOptions(): Promise<{ challengeToken: string; options: object }>;
  verifyPasskeyAuth(
    challengeToken: string,
    credentialId: string,
    credential: unknown,
  ): Promise<AuthResult>;
};

export function useMfaChallenge(challenge: MfaChallenge, sdk: MfaSdk) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submitTotp = useCallback(
    async (code: string): Promise<AuthResult> => {
      setIsLoading(true);
      setError(null);
      try {
        const result = await sdk.verifyMfaTotp(challenge.challengeId, code);
        return result;
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        setError(message);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [challenge.challengeId, sdk],
  );

  const authenticatePasskey = useCallback(async (): Promise<AuthResult> => {
    setIsLoading(true);
    setError(null);
    try {
      const { challengeToken, options } = await sdk.fetchPasskeyAuthOptions();
      const credential = await startAuthentication({ optionsJSON: options as never });
      const result = await sdk.verifyPasskeyAuth(challengeToken, credential.id, credential);
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [sdk]);

  return { isLoading, error, submitTotp, authenticatePasskey };
}
