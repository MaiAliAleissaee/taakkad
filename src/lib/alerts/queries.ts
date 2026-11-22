import { queryOptions } from "@tanstack/react-query";
import { listPublishedAlerts } from "./alerts.functions";
export const publishedAlertsQuery = queryOptions({ queryKey: ["published-security-alerts"], queryFn: () => listPublishedAlerts(), staleTime: 0 });