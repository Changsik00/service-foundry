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
import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";

import { type AdminUser, adminQueries } from "./queries";

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
}

export function UserTable() {
  const [search, setSearch] = useState("");
  const [cursor, setCursor] = useState<string | undefined>(undefined);
  const [allUsers, setAllUsers] = useState<AdminUser[]>([]);
  const skipReset = useRef(true);

  const debouncedSearch = useDebounce(search, 300);

  const { data, isPending, isError } = useQuery(
    adminQueries.users({
      ...(debouncedSearch && { search: debouncedSearch }),
      ...(cursor && { cursor }),
    }),
  );

  useEffect(() => {
    if (skipReset.current) {
      skipReset.current = false;
      return;
    }
    setAllUsers([]);
    setCursor(undefined);
  }, [debouncedSearch]);

  useEffect(() => {
    if (!data?.users) return;
    if (cursor === undefined) {
      setAllUsers(data.users);
    } else {
      setAllUsers((prev) => {
        const existingIds = new Set(prev.map((u) => u.id));
        const fresh = data.users.filter((u) => !existingIds.has(u.id));
        return [...prev, ...fresh];
      });
    }
  }, [data, cursor]);

  if (isPending && allUsers.length === 0) {
    return <div className="h-24 animate-pulse rounded-lg bg-accent" />;
  }
  if (isError && allUsers.length === 0) {
    return (
      <p role="alert" className="text-sm text-error-text">
        유저 목록을 불러오지 못했습니다. 잠시 후 다시 시도해주세요
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <Input
        placeholder="이메일·이름 검색"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="max-w-xs"
      />

      {allUsers.length === 0 ? (
        <p className="text-sm text-muted-foreground">표시할 유저가 없습니다</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>이메일</TableHead>
              <TableHead>이름</TableHead>
              <TableHead>글로벌 역할</TableHead>
              <TableHead>유저 ID</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {allUsers.map((u) => (
              <TableRow key={u.id}>
                <TableCell className="font-medium">{u.email}</TableCell>
                <TableCell className="text-muted-foreground">{u.displayName ?? "—"}</TableCell>
                <TableCell>{u.role}</TableCell>
                <TableCell className="tnum text-muted-foreground">{u.id}</TableCell>
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
