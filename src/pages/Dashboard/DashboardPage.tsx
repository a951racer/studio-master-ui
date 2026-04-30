import { useNavigate } from 'react-router-dom';
import { useDashboard } from '../../api/dashboard';

export default function DashboardPage() {
  const { data, isLoading, isError, error } = useDashboard();
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20 text-gray-500">
        Loading dashboard…
      </div>
    );
  }

  if (isError) {
    return (
      <div className="rounded bg-red-50 border border-red-200 p-4 text-red-700">
        Failed to load dashboard.{' '}
        {error instanceof Error ? error.message : 'Unknown error'}
      </div>
    );
  }

  if (!data) return null;

  const { activeStages, completedStage, totalActive, totalCompleted } = data;

  const handleStageClick = (stageId: string) => {
    navigate(`/projects?workflowStageId=${stageId}`);
  };

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">
          Overview of project activity across workflow stages.
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="rounded-lg border border-studio-orange/30 bg-studio-cream p-5">
          <p className="text-sm font-medium text-studio-orange">Total Active</p>
          <p className="mt-1 text-3xl font-bold text-studio-brown-dark">
            {totalActive}
          </p>
        </div>
        <div className="rounded-lg border border-studio-olive/30 bg-studio-olive/10 p-5">
          <p className="text-sm font-medium text-studio-olive">Completed</p>
          <p className="mt-1 text-3xl font-bold text-studio-olive">
            {totalCompleted}
          </p>
        </div>
      </div>

      {/* Active stages grid */}
      <section>
        <h2 className="text-lg font-semibold text-gray-800 mb-3">
          Active Stages
        </h2>
        {activeStages.length === 0 ? (
          <p className="text-sm text-gray-500">No active stages.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeStages.map((stage) => (
              <button
                key={stage.stageId}
                type="button"
                onClick={() => handleStageClick(stage.stageId)}
                className="rounded-lg border border-gray-200 bg-white p-5 text-left shadow-sm hover:shadow-md hover:border-studio-orange/50 transition-all cursor-pointer"
              >
                <p className="text-sm font-medium text-gray-500 capitalize">
                  {stage.stageName}
                </p>
                <p className="mt-1 text-2xl font-bold text-gray-900">
                  {stage.count}
                </p>
                <p className="mt-1 text-xs text-gray-400">
                  {stage.count === 1 ? 'project' : 'projects'}
                </p>
              </button>
            ))}
          </div>
        )}
      </section>

      {/* Completed stage */}
      <section>
        <h2 className="text-lg font-semibold text-gray-800 mb-3">
          Completed
        </h2>
        <button
          type="button"
          onClick={() =>
            completedStage.stageId &&
            handleStageClick(completedStage.stageId)
          }
          disabled={!completedStage.stageId}
          className="rounded-lg border border-studio-olive/30 bg-white p-5 text-left shadow-sm hover:shadow-md hover:border-studio-olive/50 transition-all cursor-pointer disabled:cursor-default disabled:opacity-60 w-full sm:w-auto sm:min-w-[200px]"
        >
          <p className="text-sm font-medium text-studio-olive capitalize">
            {completedStage.stageName || 'Complete'}
          </p>
          <p className="mt-1 text-2xl font-bold text-gray-900">
            {completedStage.count}
          </p>
          <p className="mt-1 text-xs text-gray-400">
            {completedStage.count === 1 ? 'project' : 'projects'}
          </p>
        </button>
      </section>
    </div>
  );
}
