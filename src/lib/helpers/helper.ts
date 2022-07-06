import type { IBtsData } from "./HelperTypes";
export class Helper {
    // **** **** **** **** **** **** **** **** **** **** **** **** **** **** **** ****
    // Date Format - "Year-Month-Day"
    // Eg. "2019-01-01"
    // **** **** **** **** **** **** **** **** **** **** **** **** **** **** **** ****
    startDate = "2019-01-01";
    endDate = "2020-12-01";
    URI = "";
    storageID = "";
        /**
     * 
     * @param startDate Date Format - "Year-Month-Day", Eg. "2019-01-01"
     * @param endDate Date Format - "Year-Month-Day", Eg. "2019-01-01"
     * @param storageID ID for Local Storage, Eg. "mexicoBorderID"
     * @param portName Optional - Port Name, Eg. "San Ysidro"
     * @param state   Optional - State, Eg. "California"
     * @param measure  Optional - The type of transportation, Eg. "Bus" or "Pedestrians"
     * @returns a generated request string for the implementation of the Helper object. 
     */
    constructor(startDate: string, endDate: string, storageID: string, portName? : string, state? : string, measure? : string) {
        // Instead of Callback hell, I've opted for a more streamline approach. 
        // Create objects using the helper class that have these important variables built in.
        let URI = Helper.constructBtsRequest(startDate, endDate, portName, state, measure);
        console.log(URI);
        this.startDate = startDate;
        this.endDate = endDate;
        this.storageID = storageID;
        this.URI = URI;
    }
    /**
     * 
     * @param startDate Date Format - "Year-Month-Day", Eg. "2019-01-01"
     * @param endDate Date Format - "Year-Month-Day", Eg. "2019-01-01"
     * @param portName Port Name, Eg. "San Ysidro"
     * @param state  State, Eg. "California"
     * @param measure The type of transportation, Eg. "Bus" or "Pedestrians"
     * @returns a generated request string for the implementation of the Helper object. 
     */
    static constructBtsRequest(startDate: string, endDate: string, portName? : string, state?: string, measure?: string) {
        /**
         * Unreadable ternary check! 😊 
         * If the callback is not null, set the string to something for the SODA api to recognize. Other wise, set it to nothing
         */
        let portString = (portName != null) ? `&port_name=${portName}` : ``;
        let stateString = (state != null) ? `&state=${state}` : ``;
        let measureString = (measure != null) ? `&measure=${measure}` : ``;
        return `https://data.transportation.gov/resource/keg4-3bc2.json?$limit=100000&$where=date between '${startDate}T00:00:00.000' and '${endDate}T00:00:00.000'&border=US-Mexico Border${stateString}${measureString}${portString}`
    }
    async fetchBTS() {
        /** Formulate URI for request*/
        if (this.checkStored() == false) {
            let rows: IBtsData[] = await (await fetch(this.URI)).json();
            this.store(rows);
        }
        return this.retrieveStored();
    }
    async filterCrossingsPorts() {
        let data = await this.fetchBTS();
        return data;
    }
    store(data: {}[]) {
        let valueStringified = JSON.stringify(data);
        localStorage.setItem(this.storageID, valueStringified);
    }
    checkStored() {
        let value = localStorage.getItem(this.storageID);
        if (value != null) {
            return true;
        }
        return false;
    }
    retrieveStored() {
        if (this.checkStored() == true) {
            let storedData = localStorage.getItem(this.storageID);
            let rows = JSON.parse(storedData || '{}');
            return rows;
        }
    }
}