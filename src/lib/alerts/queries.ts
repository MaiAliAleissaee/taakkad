import { queryOptions } from "@tanstack/react-query";
import { listPublishedAlerts, listSimulatedAwarenessAlerts } from "./alerts.functions";
export const publishedAlertsQuery = queryOptions({ queryKey: ["published-security-alerts"], queryFn: () => listPublishedAlerts(), staleTime: 0 });
export const simulatedAwarenessAlertsQuery = queryOptions({ queryKey: ["simulated-awareness-alerts"], queryFn: () => listSimulatedAwarenessAlerts(), staleTime: 0 });