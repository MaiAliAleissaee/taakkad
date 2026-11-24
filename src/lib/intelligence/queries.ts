import { queryOptions } from "@tanstack/react-query";
import { readIntelligence } from "./intelligence.functions";
export const intelligenceQuery = (userId: string) => queryOptions({ queryKey: ["analyst-intelligence", userId], queryFn: () => readIntelligence(), staleTime: 0 });
