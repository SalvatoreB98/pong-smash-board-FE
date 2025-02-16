import { Injectable } from '@angular/core';
import { MSG_TYPE } from "../app/utils/enum";
import mockData from '../app/utils/mock.json';
import { environment } from '../environments/environment';
import { IMatch } from '../app/interfaces/matchesInterfaces';
import { IMatchResponse } from '../app/interfaces/responsesInterfaces';
import { LoaderComponent } from '../app/utils/components/loader/loader.component';

interface MatchData extends IMatchResponse {
  matches: IMatch[];
  wins: Record<string, number>;
  totPlayed: Record<string, number>;
  points: any;
  players: string[];
  monthlyWinRates: Record<string, number>;
  badges: Record<string, any>;
  giocatore1Score: number;
  giocatore2Score: number;
}


@Injectable({
  providedIn: 'root'
})
export class DataService {
  matches: IMatch[] = [];
  wins: Record<string, number> = {};
  totPlayed: Record<string, number> = {};
  raw: any = {};
  monthlyWinRates: Record<string, number> = {};
  badges: Record<string, any> = {};
  players: string[] = [];
  loader!: LoaderComponent;
  points: any;
  setLoader(loader: LoaderComponent): void {
    this.loader = loader;
  }

  async fetchDataAndCalculateStats(): Promise<IMatchResponse> {
    console.log("Fetching data...");
    try {
      this.loader?.startLoader(); // 🟢 Show loader before request
      if (environment.mock) {
        console.log("Using mock data in local environment.");
        this.assignData(mockData);
      } else {
        const response = await fetch(`${environment.apiUrl}/api/get-matches`, {
          headers: {},
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch data: ${response.statusText}`);
        }

        const data: IMatchResponse = await response.json();
        this.assignData(data);
      }

      return this.generateReturnObject();
    } catch (error) {
      console.error("Error fetching data:", error);
      this.loader?.showToast(`Server Error. Using mock data.`, 5000, MSG_TYPE.ERROR);

      // Fallback to mock data
      this.assignData(mockData);

      return this.generateReturnObject();
    } finally {
      this.loader?.stopLoader(); // 🟢 Hide loader after request
    }
  }

  private assignData(data: any): void {
    this.raw = data;
    this.matches = data.matches || [];
    this.wins = data.wins || {};
    this.totPlayed = data.totPlayed || {};
    this.points = data.points || {};
    this.players = data.players || [];
    this.monthlyWinRates = data.monthlyWinRates || {};
    this.badges = data.badges || {};
  }

  private generateReturnObject(): MatchData {
    return {
      matches: this.matches,
      wins: this.wins,
      totPlayed: this.totPlayed,
      points: this.points,
      players: this.players,
      monthlyWinRates: this.monthlyWinRates,
      badges: this.badges,
      id: this.raw.id || '',
      data: this.raw.data || '',
      giocatore1: this.raw.giocatore1 || '',
      giocatore2: this.raw.giocatore2 || '',
      giocatore1Score: this.raw.giocatore1Score || 0,
      giocatore2Score: this.raw.giocatore2Score || 0,
      p1: this.raw.p1 || '',
      p2: this.raw.p2 || '',
      setsPoints: this.raw.setsPoints || []
    };
  }

  async addMatch(data: { p1Score: number; p2Score: number;[key: string]: any }): Promise<void> {
    console.log(data);
    if ((data.p1Score !== undefined) && (data.p2Score !== undefined)) {
      try {
        const response = await fetch(`${environment.apiUrl}/api/add-match`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const responseData = await response.json();
        this.loader?.showToast("Salvato con successo!", 5000, MSG_TYPE.SUCCESS);
        console.log("Success:", responseData);
      } catch (error) {
        this.loader?.showToast(`Match data not found ${error}`, 5000, MSG_TYPE.ERROR);
        this.loader?.showToast(`Errore durante l'aggiunta del match ${error}`, 5000, MSG_TYPE.ERROR);
        throw error;
      }
    } else {
      return Promise.reject("Invalid data");
    }
  }
  getLoggedInPlayerId(): number | null {
    const userData = localStorage.getItem('loggedInPlayer'); // Example storage
    return userData ? JSON.parse(userData).playerid : null;
  }
  setLoggedInPlayer(player: { playerid: number, name: string }) {
    localStorage.setItem('loggedInPlayer', JSON.stringify(player));
  }
  logout() {
    localStorage.removeItem('loggedInPlayer');
  }
}
