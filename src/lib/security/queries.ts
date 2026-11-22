import { queryOptions } from "@tanstack/react-query";
import { readSecurityWorkspace } from "./workspace.functions";
export const securityQuery = (userId: string) => queryOptions({ queryKey: ["security-workspace", userId], queryFn: () => readSecurityWorkspace(), staleTime: 0 });