import { useQuery } from '@tanstack/react-query';
import apiClient from './client';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface StageSummary {
  stageId: string;
  stageName: string;
  count: number;
}

export interface DashboardData {
  activeStages: StageSummary[];
  completedStage: StageSummary;
  totalActive: number;
  totalCompleted: number;
}

// ---------------------------------------------------------------------------
// Query-key helpers
// ---------------------------------------------------------------------------

const dashboardKeys = {
  all: ['dashboard'] as const,
};

// ---------------------------------------------------------------------------
// Hooks
// ---------------------------------------------------------------------------

/** Fetch dashboard summary: project counts grouped by workflow stage. */
export function useDashboard() {
  return useQuery({
    queryKey: dashboardKeys.all,
    queryFn: async () => {
      const { data } = await apiClient.get<DashboardData>('/api/dashboard');
      return data;
    },
  });
}
