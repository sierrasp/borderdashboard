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
    constructor(startDate?: string, endDate?: string, portName?: string, state?: string, measure?: string) {
        // Instead of Callback hell, I've opted for a more streamline approach. 
        // Create objects using the helper class that have these important variables built in.
        const URI = Helper.constructBtsRequest(startDate, endDate, portName, state, measure);
        this.startDate = `${startDate}`;
        this.endDate = `${endDate}`;
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
    static constructBtsRequest(startDate?: string, endDate?: string, portName?: string, state?: string, measure?: string) {
        /**
         * Unreadable ternary check! 😊 
         * If the callback is not null, set the string to something for the SODA api to recognize. Other wise, set it to nothing
         */
        const portString = (portName != null) ? `&port_name=${portName}` : ``;
        const stateString = (state != null) ? `&state=${state}` : ``;
        const measureString = (measure != null) ? `&measure=${measure}` : ``;
        console.log(`https://data.transportation.gov/resource/keg4-3bc2.json?$limit=100000&$where=date between '${startDate}T00:00:00.000' and '${endDate}T00:00:00.000'&border=US-Mexico Border${stateString}${measureString}${portString}`);
        return `https://data.transportation.gov/resource/keg4-3bc2.json?$limit=100000&$where=date between '${startDate}T00:00:00.000' and '${endDate}T00:00:00.000'&border=US-Mexico Border${stateString}${measureString}${portString}`
    }
    // static cacheData(startDate : string, endDate : string) {
    //     return 
    // }
    /**
     * 
     * @param year Eg. 2021
     * @param month Eg. 7
     * @param day Eg. 1 - Using splice for any digits under 10, so don't worry about that
     * @returns A date string for class generation, Eg. "2019-01-01"
     */
    static dateFormatGenerator(date: Date) {

        const year = date.getFullYear();
        const month = date.getMonth() + 1;
        const day = date.getDate();
        const slicedMonth = ('0' + month).slice(-2);
        const slicedDay = ('0' + day).slice(-2); // '11'
        return `${year}-${slicedMonth}-${slicedDay}`;
    };
    /**
 * A function to get the current date object
 * @returns An object with current year, current month, and current day. Eg, {year : 2022, month : 9, day : 1}
 */

    static async getLastDate() {
        const data: IBtsData[] = await (await fetch('https://data.bts.gov/id/keg4-3bc2.json?$limit=100000&$where=date%20between%20%272021-09-01T00:00:00.000%27%20and%20%272022-09-01T00:00:00.000%27&border=US-Mexico%20Border')).json();
        let dates: any[] = [];
        data.forEach(el => {
            dates = [...dates, new Date(el.date)]
        });
        // const maxDate=new Date(Math.max.apply(null,dates));
        const maxDate = new Date(Math.max(...dates));
        // return maxDate;
        return DateTime.fromJSDate(maxDate).setZone("America/Tijuana").plus({ months: 1 });

    };
    /**
     * 
     * @param date A formatted date string 
     * @returns A formatted date string with the year prior
     */
    static calculatePreviousDate(date: string) {
        const luxonDate = DateTime.fromFormat(date, 'yyyy-MM-dd');
        const slicedMonth = ('0' + luxonDate.month).slice(-2);
        const slicedDay = ('0' + luxonDate.day).slice(-2);
        return `${luxonDate.year - 1}-${slicedMonth}-${slicedDay}`
    };
    static calculatePercentDifference(newNumber: number, oldNumber: number) {
        return Math.round(((newNumber - oldNumber) / oldNumber) * 100);
    };
    /**
     * 
     * @param x Number
     * @returns Number seperated by commas, Eg. 10000 => 10,000
     */
    static numberWithCommas(x: number) {
        return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    };
    /**
     * 
     * @param port Port needs to represent cbp number of port - Eg. San Ysidro port num = 250401
     * @returns An object containing the last updated time (formatted) - Eg. Today at 10:00 pm. Also returns duration in minutes.
     */
    async fetchBTS() {
        /** Formulate URI for request*/
        if (this.checkStored() == false) {
            const data: IBtsData[] = await (await fetch(this.URI)).json();
            this.store(data);
        }
        return this.retrieveStored();
        // return data;
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

        });;
        return measureObject;
    }
    store(data: IBtsData[]) {
        const valueStringified = JSON.stringify(data);
        try {
            localStorage.setItem(this.storageID, valueStringified);
        }
        catch (err) {
            if (this.isQuotaExceededError(err)) {
                localStorage.clear();
                localStorage.setItem(this.storageID, valueStringified);
            }

        }
    }
    isQuotaExceededError(err: unknown) {
        return (
            err instanceof DOMException &&
            // everything except Firefox
            (err.code === 22 ||
                // Firefox
                err.code === 1014 ||
                // test name field too, because code might not be present
                // everything except Firefox
                err.name === "QuotaExceededError" ||
                // Firefox
                err.name === "NS_ERROR_DOM_QUOTA_REACHED")
        );
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