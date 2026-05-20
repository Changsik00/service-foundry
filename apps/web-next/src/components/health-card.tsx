// stub — Green 단계에서 구현. props 시그니처만 박음.

export interface HealthData {
  status: string;
  uptime: number;
  version: string;
}

export interface HealthCardProps {
  data?: HealthData;
  error?: string;
}

export function HealthCard(_props: HealthCardProps): React.ReactNode {
  throw new Error("not implemented");
}
