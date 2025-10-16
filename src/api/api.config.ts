import { join } from "path";
import { environment } from "../environments/environment";

export const API_PATHS = {
  userState: '/api/user-state',
  getCompetitions: '/api/get-competitions',
  getRanking: '/api/get-ranking',
  getMatches: '/api/get-matches',
  getGroups: '/api/get-groups',
  addMatch: '/api/add-match',
  updateProfile: '/api/update-profile',
  addCompetition: '/api/add-competition',
  joinCompetition: '/api/join-competition',
  getPlayers: '/api/get-players',
  addPlayers: '/api/add-players',
  deleteCompetition: '/api/delete-competition',
  updateActiveCompetition: '/api/update-active-competition',
  deletePlayer: '/api/delete-player',
  getNextMatches: '/api/get-next-matches',
  getCompetitionView: '/api/get-competition-view',
  getKnockout: '/api/get-knockout',
}

export const API_AUTH_CONFIG: Record<string, { needsAuth: boolean; methods?: string[] }> = {
  [API_PATHS.userState]: { needsAuth: true },
  [API_PATHS.getCompetitions]: { needsAuth: true },
  [API_PATHS.getRanking]: { needsAuth: false },
  [API_PATHS.getMatches]: { needsAuth: false },
  [API_PATHS.getGroups]: { needsAuth: false },
  [API_PATHS.addMatch]: { needsAuth: true, methods: ['POST'] },
  [API_PATHS.updateProfile]: { needsAuth: true, methods: ['POST'] },
  [API_PATHS.addCompetition]: { needsAuth: true, methods: ['POST'] },
  [API_PATHS.getPlayers]: { needsAuth: true },
  [API_PATHS.addPlayers]: { needsAuth: true, methods: ['POST'] },
  [API_PATHS.deleteCompetition]: { needsAuth: true, methods: ['DELETE'] },
  [API_PATHS.updateActiveCompetition]: { needsAuth: true, methods: ['POST'] },
  [API_PATHS.deletePlayer]: { needsAuth: true, methods: ['DELETE'] },
  [API_PATHS.joinCompetition]: { needsAuth: true, methods: ['POST'] },
  [API_PATHS.getNextMatches]: { needsAuth: false },
  [API_PATHS.getCompetitionView]: { needsAuth: false },
  [API_PATHS.getKnockout]: { needsAuth: false },
};

export function findApiConfig(url: string, method: string) {
  const cleanUrl = url.replace(environment.apiUrl, '');
  const config = API_AUTH_CONFIG[cleanUrl] ?? { needsAuth: false };

  if (config.methods && !config.methods.includes(method.toUpperCase())) {
    return undefined;
  }
  return config;
}
