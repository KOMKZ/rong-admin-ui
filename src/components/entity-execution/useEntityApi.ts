/**
 * Build REST paths for agent vs team entities (shared debug / test-run panels).
 */
export function useEntityApi(entityType: 'agent' | 'team') {
  const baseUrl = entityType === 'agent' ? '/api/agents' : '/api/teams'
  return {
    baseUrl,
    getById: (id: number) => `${baseUrl}/${id}`,
    getRuns: (id: number) => `${baseUrl}/${id}/runs`,
    getTestRuns: (id: number) => `${baseUrl}/${id}/test-runs`,
    /** POST body: test run (singular segment) */
    getTestRun: (id: number) => `${baseUrl}/${id}/test-run`,
    getGraph: (id: number) => `${baseUrl}/${id}/graph`,
  }
}
