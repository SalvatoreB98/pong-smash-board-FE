export enum DATA {
  WINS = 'WINS',
  WINRATE = 'WINRATE',
}

export enum MSG_TYPE {
  ERROR = 'ERROR',
  SUCCESS = 'SUCCESS',
  WARNING = 'WARNING',
}

export enum BADGES {
  MAX_TOTAL = "Giocolone",
  MAX_LOSSES = "Perdente",
  MAX_WIN_STREAK = "Max Combo",
  CHAMPION_OF_THE_MONTH = "Campione del mese",
}

export enum BADGES_IMAGES {
  MAX_TOTAL = '<img src="/juggler.png">',
  MAX_LOSSES = '<img src="/looser.png">',
  MAX_WIN_STREAK = '<img src="/win-streak.webp">',
  CHAMPION_OF_THE_MONTH = '<img src="/trophy-month.png">',
}

export const MONTH_MAP: Record<string, string> = {
  "01": "Gennaio",
  "02": "Febbraio",
  "03": "Marzo",
  "04": "Aprile",
  "05": "Maggio",
  "06": "Giugno",
  "07": "Luglio",
  "08": "Agosto",
  "09": "Settembre",
  "10": "Ottobre",
  "11": "Novembre",
  "12": "Dicembre",
  "Gennaio": "1",
  "Febbraio": "2",
  "Marzo": "3",
  "Aprile": "4",
  "Maggio": "5",
  "Giugno": "6",
  "Luglio": "7",
  "Agosto": "8",
  "Settembre": "9",
  "Ottobre": "10",
  "Novembre": "11",
  "Dicembre": "12",
};

export const MODALS: { [key: string]: string } = {
  ADD_MATCH: 'addMatchModal',
  SHOW_MATCH: 'showMatchModal',
  ADD_COMPETITION: 'addCompetitionModal',
  ADD_PLAYERS: 'addPlayersModal',
};

export enum UserProgressStateEnum {
  PROFILE_NOT_COMPLETED = 'profile_not_completed',
  PROFILE_COMPLETED = 'profile_completed',
  WITHOUT_COMPETITION = 'without_competition',
}