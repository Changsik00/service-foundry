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

import { type AdminOrg, adminQueries } from "./queries";

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
}

export function OrgTable() {
  const [search, setSearch] = useState("");
  const [cursor, setCursor] = useState<string | undefined>(undefined);
  const [allOrgs, setAllOrgs] = useState<AdminOrg[]>([]);
  const skipReset = useRef(true);

  const debouncedSearch = useDebounce(search, 300);

  const { data, isPending, isError } = useQuery(
    adminQueries.orgs({
      ...(debouncedSearch && { search: debouncedSearch }),
      ...(cursor && { cursor }),
    }),
  );

  useEffect(() => {
    if (skipReset.current) {
      skipReset.current = false;
      return;
    }
    setAllOrgs([]);
    setCursor(undefined);
  }, [debouncedSearch]);

  useEffect(() => {
    if (!data?.orgs) return;
    if (cursor === undefined) {
      setAllOrgs(data.orgs);
    } else {
      setAllOrgs((prev) => {
        const existingIds = new Set(prev.map((o) => o.id));
        const fresh = data.orgs.filter((o) => !existingIds.has(o.id));
        return [...prev, ...fresh];
      });
    }
  }, [data, cursor]);

  if (isPending && allOrgs.length === 0) {
    return <div className="h-24 animate-pulse rounded-lg bg-accent" />;
  }
  if (isError && allOrgs.length === 0) {
    return (
      <p role="alert" className="text-sm text-error-text">
        조직 목록을 불러오지 못했습니다. 잠시 후 다시 시도해주세요
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <Input
        placeholder="조직 이름·슬러그 검색"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="max-w-xs"
      />

      {allOrgs.length === 0 ? (
        <p className="text-sm text-muted-foreground">표시할 조직이 없습니다</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>이름</TableHead>
              <TableHead>슬러그</TableHead>
              <TableHead>타입</TableHead>
              <TableHead>조직 ID</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {allOrgs.map((o) => (
              <TableRow key={o.id}>
                <TableCell className="font-medium">{o.name}</TableCell>
                <TableCell className="text-muted-foreground">{o.slug}</TableCell>
                <TableCell>{o.isPersonal ? "개인" : "팀"}</TableCell>
                <TableCell className="tnum text-muted-foreground">{o.id}</TableCell>
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
