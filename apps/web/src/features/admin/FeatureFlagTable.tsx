"use client";

import {
  Button,
  Input,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@repo/frontend-ui";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

import { type AdminFeatureFlag, featureFlagQueries } from "./queries";

export function FeatureFlagTable() {
  const qc = useQueryClient();
  const [newKey, setNewKey] = useState("");
  const [newDesc, setNewDesc] = useState("");

  const { data: flags, isPending, isError } = useQuery(featureFlagQueries.list());

  const invalidate = () => qc.invalidateQueries({ queryKey: ["admin", "feature-flags"] });

  const createMutation = useMutation({
    mutationFn: (body: { key: string; description?: string }) => featureFlagQueries.createFn(body),
    onSuccess: () => {
      setNewKey("");
      setNewDesc("");
      void invalidate();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ key, enabled }: { key: string; enabled: boolean }) =>
      featureFlagQueries.updateFn(key, enabled),
    onSuccess: () => invalidate(),
  });

  const removeMutation = useMutation({
    mutationFn: (key: string) => featureFlagQueries.removeFn(key),
    onSuccess: () => invalidate(),
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKey.trim()) return;
    createMutation.mutate({
      key: newKey.trim(),
      ...(newDesc.trim() && { description: newDesc.trim() }),
    });
  };

  if (isPending) {
    return <div className="h-24 animate-pulse rounded-lg bg-accent" />;
  }
  if (isError) {
    return (
      <p role="alert" className="text-sm text-error-text">
        피처플래그 목록을 불러오지 못했습니다. 잠시 후 다시 시도해주세요
      </p>
    );
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleCreate} className="flex gap-2">
        <Input
          placeholder="플래그 키 (예: new-dashboard)"
          value={newKey}
          onChange={(e) => setNewKey(e.target.value)}
          className="max-w-xs"
          aria-label="플래그 키"
        />
        <Input
          placeholder="설명 (선택)"
          value={newDesc}
          onChange={(e) => setNewDesc(e.target.value)}
          className="max-w-xs"
          aria-label="플래그 설명"
        />
        <Button type="submit" disabled={createMutation.isPending || !newKey.trim()}>
          추가
        </Button>
      </form>

      {!flags || flags.length === 0 ? (
        <p className="text-sm text-muted-foreground">등록된 피처플래그가 없습니다</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>키</TableHead>
              <TableHead>설명</TableHead>
              <TableHead>상태</TableHead>
              <TableHead>작업</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(flags as AdminFeatureFlag[]).map((flag) => (
              <TableRow key={flag.id}>
                <TableCell className="font-mono font-medium">{flag.key}</TableCell>
                <TableCell className="text-muted-foreground">{flag.description ?? "—"}</TableCell>
                <TableCell>
                  <span
                    className={
                      flag.enabled ? "text-success-text font-medium" : "text-muted-foreground"
                    }
                  >
                    {flag.enabled ? "활성" : "비활성"}
                  </span>
                </TableCell>
                <TableCell className="flex gap-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    disabled={updateMutation.isPending}
                    onClick={() => updateMutation.mutate({ key: flag.key, enabled: !flag.enabled })}
                  >
                    {flag.enabled ? "끄기" : "켜기"}
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    disabled={removeMutation.isPending}
                    onClick={() => removeMutation.mutate(flag.key)}
                  >
                    삭제
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
