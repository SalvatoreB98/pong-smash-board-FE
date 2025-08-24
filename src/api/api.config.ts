import { environment } from "../environments/environment";

export const API_PATHS = {
  userState: '/api/user-state',
  getCompetitions: '/api/get-competitions',
  getRanking: '/api/get-ranking',
  getMatches: '/api/get-matches',
  addMatch: '/api/add-match',
}

export const API_AUTH_CONFIG: Record<string, { needsAuth: boolean; methods?: string[] }> = {
  [API_PATHS.userState]: { needsAuth: true },
  [API_PATHS.getCompetitions]: { needsAuth: false },
  [API_PATHS.getRanking]: { needsAuth: false },
  [API_PATHS.getMatches]: { needsAuth: false },
  [API_PATHS.addMatch]: { needsAuth: true, methods: ['POST'] },
};

export function findApiConfig(url: string, method: string) {
  const cleanUrl = url.replace(environment.apiUrl, '');
  const config = API_AUTH_CONFIG[cleanUrl] ?? { needsAuth: false };

  if (config.methods && !config.methods.includes(method.toUpperCase())) {
    return undefined;
  }
  return config;
}
