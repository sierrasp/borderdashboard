import type { IBtsData } from "./BtsHelperTypes";
import { DateTime } from "luxon";
import { dev } from '$app/env';
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
 * @param portName Optional - Port Name, Eg. "San Ysidro"
 * @param state   Optional - State, Eg. "California"
 * @param measure  Optional - The type of transportation, Eg. "Bus" or "Pedestrians"
 * @returns a generated request string for the implementation of the Helper object. 
 */
    constructor(startDate: string, endDate: string, portName?: string, state?: string, measure?: string) {
        // Instead of Callback hell, I've opted for a more streamline approach. 
        // Create objects using the helper class that have these important variables built in.
        const URI = Helper.constructBtsRequest(startDate, endDate, portName, state, measure);
        console.log(URI);
        this.startDate = startDate;
        this.endDate = endDate;
        this.storageID = `${startDate}_to_${endDate}_${portName}`;
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
    static constructBtsRequest(startDate: string, endDate: string, portName?: string, state?: string, measure?: string) {
        /**
         * Unreadable ternary check! 😊 
         * If the callback is not null, set the string to something for the SODA api to recognize. Other wise, set it to nothing
         */
        const portString = (portName != null) ? `&port_name=${portName}` : ``;
        const stateString = (state != null) ? `&state=${state}` : ``;
        const measureString = (measure != null) ? `&measure=${measure}` : ``;
        return `https://data.transportation.gov/resource/keg4-3bc2.json?$limit=100000&$where=date between '${startDate}T00:00:00.000' and '${endDate}T00:00:00.000'&border=US-Mexico Border${stateString}${measureString}${portString}`
    }
    /**
     * 
     * @param year Eg. 2021
     * @param month Eg. 7
     * @param day Eg. 1 - Using splice for any digits under 10, so don't worry about that
     * @returns A date string for class generation, Eg. "2019-01-01"
     */
    static dateFormatGenerator(year: number, month: number, day: number) {
        const slicedMonth = ('0' + month).slice(-2);
        const slicedDay = ('0' + day).slice(-2); // '11'
        return `${year}-${slicedMonth}-${slicedDay}`;
    }
    /**
 * A function to get the current date object
 * @returns An object with current year, current month, and current day. Eg, {year : 2022, month : 9, day : 1}
 */

    static getCurrentDate() {
        return DateTime.local().setZone("America/Tijuana");
    };
    /**
     * 
     * @param port Port needs to represent cbp number of port - Eg. San Ysidro port num = 250401
     * @returns An object containing the last updated time (formatted) - Eg. Today at 10:00 pm. Also returns duration in minutes.
     */
    static async getCurrentWaitTimes(port_num: number, lane_type: number) {
        try {
            let fetchUrl = ``;
            fetchUrl = `https://borderdashboard.com/controller/getLastWaitTime/${lane_type}/${port_num}`
            if (dev == true) {
                fetchUrl = `http://localhost:3000/controller/getLastWaitTime/${lane_type}/${port_num}`
            }
            const data: { date: string, delay_seconds: number }[] = await (await (await fetch(fetchUrl)).json())
            const newDate = DateTime.fromISO(`${data[0].date}`, { zone: 'America/Los_Angeles' });
            let returnString = ``;
            if (this.getCurrentDate().day == newDate.day) {
                console.log(this.getCurrentDate().day, "hello")
                returnString = `Today at ${this.toAPM(newDate)}`
            };
            if ((this.getCurrentDate().day - 1) == newDate.day) {
                returnString = `Yesterday at ${this.toAPM(newDate)}`
            }
            if (this.getCurrentDate().day != newDate.day) {
                returnString = `${newDate.toSQLDate()}`
            }
            return {
                lastUpdateTime: returnString,
                lastDelaySeconds: (Number(data[0].delay_seconds)),
            }
        } catch (error) {
            return {
                lastUpdateTime: `There was an error`,
                lastDelaySeconds: 0
            }
        }
    }
    static toAPM(date: DateTime) {
        let hours = Number(date.hour)
        const minutes = Number(date.minute)
        const ampm = hours >= 12 ? 'pm' : 'am';

        hours = hours % 12;
        hours = hours ? hours : 12; // the hour '0' should be '12'

        const minutesString = minutes < 10 ? '0' + minutes : minutes;
        const strTime = hours + ':' + minutesString + ' ' + ampm;

        return strTime
    };
    async fetchBTS() {
        /** Formulate URI for request*/
        if (this.checkStored() == false) {
            const data: IBtsData[] = await (await fetch(this.URI)).json();
            this.store(data);
        }
        return this.retrieveStored();
    };
    /**
    * @property Possible Measures - ["Pedestrians", "Trains", "Buses", "Personal Vehicle Passengers", "Personal Vehicles", "Trucks", "Train Passengers", "Bus Passengers"]
    * @param measureArray - Input an array of measures for BTS -  Eg. ["Pedestrians", "Trains", etc]
    * @returns An object with the measure as the key and the sum of crossings as the pair
    */
    async calculateCrossings(measureArray: string[]) {
        const data: IBtsData[] = await this.fetchBTS();
        const measureObject: { [key: string]: number; } = {};
        /**
         * I've opted for a more antiquated approach for the sake of readability.
         * Instead of using .reduce ES6 notation, I'm using a simple forEach.
         * It gets the job done. 
         */
        measureArray.forEach(measure => {
            const measureFiltered = data.filter((el: IBtsData) => {
                return el.measure == measure
            });
            let measureSum = 0;
            measureFiltered.forEach(element => {
                measureSum += Number(element.value);
            });
            measureObject[measure] = measureSum;

        });
        return measureObject;
    }
    store(data: IBtsData[]) {
        const valueStringified = JSON.stringify(data);
        localStorage.setItem(this.storageID, valueStringified);
    }
    checkStored() {
        const value = localStorage.getItem(this.storageID);
        if (value != null) {
            return true;
        }
        return false;
    }
    retrieveStored() {
        if (this.checkStored() == true) {
            const storedData = localStorage.getItem(this.storageID);
            const rows: IBtsData[] = JSON.parse(storedData || '{}');
            return rows;
        }
    }
}