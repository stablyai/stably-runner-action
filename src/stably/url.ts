export const getSuiteRunDashboardUrl = ({
  projectId,
  testSuiteRunId
}: {
  projectId: string;
  testSuiteRunId: string;
}) => `https://app.stably.ai/project/${projectId}/history/g_${testSuiteRunId}`;
