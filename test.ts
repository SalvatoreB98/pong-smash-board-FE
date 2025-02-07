import { Injectable } from '@angular/core';
import { LoaderComponent } from '../components/loader/loader.component';
import { MSG_TYPE } from '../utils/enum';
import mockData from '../utils/mock.json';
import { environment } from '../environments/environment';
import { IMatchResponse } from '../interfaces/responsesInterfaces';

@Injectable({
  providedIn: 'root'
})
export class DataService {
  private loader!: LoaderComponent;

  setLoader(loader: LoaderComponent): void {
    this.loader = loader;
  }

  async fetchDataAndCalculateStats(): Promise<IMatchResponse> {
    console.log("Fetching data...");
    try {
      this.loader?.startLoader(); // 🟢 Show loader before request

      let data: IMatchResponse;

      if (!environment.production) {
        console.log("Using mock data.");
        data = mockData as IMatchResponse;
      } else {
        const response = await fetch(`${environment.apiUrl}/api/get-matches`);

        if (!response.ok) {
          throw new Error(`Failed to fetch data: ${response.statusText}`);
        }

        data = await response.json();
      }

      return data;
    } catch (error) {
      console.error("Error fetching data:", error);
      this.loader?.showToast(`Server Error. Using mock data.`, 5000, MSG_TYPE.ERROR);

      return mockData as IMatchResponse;
    } finally {
      this.loader?.stopLoader(); // 🟢 Hide loader after request
    }
  }

  async addMatch(data: any): Promise<void> {
    console.log("Adding match:", data);
    try {
      this.loader?.startLoader(); // 🟢 Show loader

      const response = await fetch(`${environment.apiUrl}/api/add-match`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      this.loader?.showToast("Match saved successfully!", 3000, MSG_TYPE.SUCCESS);
      console.log("Success:", await response.json());
    } catch (error) {
      this.loader?.showToast(`Error adding match: ${error}`, 5000, MSG_TYPE.ERROR);
    } finally {
      this.loader?.stopLoader(); // 🟢 Hide loader
    }
  }
}
