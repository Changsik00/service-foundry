"use client";

import {
  Badge,
  Button,
  Input,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@repo/frontend-ui";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";

import { orgQueries } from "./queries";

const ROLE_VARIANT = { owner: "brand", admin: "success", member: "default" } as const;

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
}

export function MemberTable() {
  const [search, setSearch] = useState("");
  const [role, setRole] = useState<string>("all");
  const [cursor, setCursor] = useState<string | undefined>(undefined);
  const [allMembers, setAllMembers] = useState<
    Array<{
      userId: string;
      orgId: string;
      role: string;
      email: string;
      displayName: string | null;
    }>
  >([]);
  const skipReset = useRef(true);

  const debouncedSearch = useDebounce(search, 300);
  const activeRole = role === "all" ? undefined : role;

  const { data, isPending, isError } = useQuery(
    orgQueries.members({
      ...(debouncedSearch && { search: debouncedSearch }),
      ...(activeRole && { role: activeRole }),
      ...(cursor && { cursor }),
    }),
  );

  // 검색/필터 변경 시 누적 목록 초기화 (첫 렌더 제외)
  useEffect(() => {
    if (skipReset.current) {
      skipReset.current = false;
      return;
    }
    setAllMembers([]);
    setCursor(undefined);
  }, [debouncedSearch, activeRole]);

  // 새 데이터 로드 시 누적
  useEffect(() => {
    if (!data?.members) return;
    if (cursor === undefined) {
      setAllMembers(data.members);
    } else {
      setAllMembers((prev) => {
        const existingIds = new Set(prev.map((m) => m.userId));
        const fresh = data.members.filter((m) => !existingIds.has(m.userId));
        return [...prev, ...fresh];
      });
    }
  }, [data, cursor]);

  if (isPending && allMembers.length === 0) {
    return <div className="h-24 animate-pulse rounded-lg bg-accent" />;
  }
  if (isError && allMembers.length === 0) {
    return (
      <p role="alert" className="text-sm text-error-text">
        멤버 목록을 불러오지 못했습니다. 잠시 후 다시 시도해주세요
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-3">
        <Input
          placeholder="이메일로 검색"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
        />
        <select
          value={role}
          onChange={(e) => setRole(e.target.value)}
          className="rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
        >
          <option value="all">전체 역할</option>
          <option value="owner">Owner</option>
          <option value="admin">Admin</option>
          <option value="member">Member</option>
        </select>
      </div>

      {allMembers.length === 0 ? (
        <p className="text-sm text-muted-foreground">아직 표시할 멤버가 없습니다</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>이메일</TableHead>
              <TableHead>역할</TableHead>
              <TableHead>사용자 ID</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {allMembers.map((m) => (
              <TableRow key={m.userId}>
                <TableCell className="font-medium">{m.email}</TableCell>
                <TableCell>
                  <Badge variant={ROLE_VARIANT[m.role as keyof typeof ROLE_VARIANT] ?? "default"}>
                    {m.role}
                  </Badge>
                </TableCell>
                <TableCell className="tnum text-muted-foreground">{m.userId}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {data?.nextCursor && (
        <Button variant="secondary" onClick={() => setCursor(data.nextCursor ?? undefined)}>
          더 보기
        </Button>
      )}
    </div>
  );
}
