"use client";

import {
  Badge,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@repo/frontend-ui";
import { useQuery } from "@tanstack/react-query";

import { orgQueries } from "./queries";

const ROLE_VARIANT = { owner: "brand", admin: "success", member: "default" } as const;

export function MemberTable() {
  const { data, isPending, isError } = useQuery(orgQueries.members());

  if (isPending) {
    return <div className="h-24 animate-pulse rounded-lg bg-accent" />;
  }
  if (isError) {
    return (
      <p role="alert" className="text-sm text-error-text">
        멤버 목록을 불러오지 못했습니다. 잠시 후 다시 시도해주세요
      </p>
    );
  }
  if (data.members.length === 0) {
    return <p className="text-sm text-muted-foreground">아직 표시할 멤버가 없습니다</p>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>이메일</TableHead>
          <TableHead>역할</TableHead>
          <TableHead>사용자 ID</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.members.map((m) => (
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
  );
}
