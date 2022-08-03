import type { IBtsData } from "./BtsHelperTypes";
import parse from 'rss-to-json';
// import {dbHelper} from './dbHelper'
// const { parse } = rss_package;
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
        const currentDate = new Date();
        return {
            year: currentDate.getFullYear(),
            month: currentDate.getMonth() + 1,
            day: currentDate.getDate()
        };
    };
    /**
     * 
     * @param port Port needs to represent cbp number of port - Eg. San Ysidro port num = 250401
     * @returns An object containing the last updated time (formatted) - Eg. Today at 10:00 pm. Also returns duration in minutes.
     */
    static async getCurrentWaitTimes(port_num : number, lane_type : number) {
        // const dbConnect = new dbHelper()
        // dbConnect.mostRecentByPort(port_num, lane_type);
        // It's time for some REGEX.  
        // const data = await parse(`https://bwt.cbp.gov/api/bwtRss/rssbyportnum/HTML/POV/${port_num}`);
        // const raw_data = JSON.stringify(data['items'][0]['description']);
        // const description = data['items'][0]['description']['$text'];
        // console.log(description);
        // const durationReg = /\d{1,3} (min)/gm;
        // const laneClosedReg = /((Ready|Sentri|General) Lanes: {2}Lanes Closed)/gm
        // const noonReg = /Noon PDT/gm
        // const midnightReg = /Midnight PDT/gm
        // const timestampReg = /\d{1,3}:\d{2} (am|pm)/gm
        // const durationFound = description.match(durationReg);
        // const updatePendingReg = /((Ready|Sentri|General) Lanes: {2}Update Pending)/gm;
        // const updatePendingFound = description.match(updatePendingReg);
        // let timestampFound = description.match(timestampReg);
        // let laneClosedFound = description.match(laneClosedReg);
        // if (timestampFound == null) {
        //   timestampFound = [];
        // };
        // if (laneClosedFound == null) {
        //   laneClosedFound = [];
        // };
        // console.log(laneClosedFound);
        // const noonFound = description.match(noonReg);
        // const midnightFound = description.match(midnightReg);
        // if (midnightFound != null) {
        //   for (let i = 0; i < midnightFound.length; i++) {
        //     timestampFound.push('12:00 am');
        //   }
        // }
        // if (noonFound != null) {
        //   for (let i = 0; i < noonFound.length; i++) {
        //     timestampFound.push('12:00 pm');
        //   }
        // };
        // console.log(durationFound);
        // console.log(laneClosedFound);
        // console.log(updatePendingFound);

        // console.log(date_recorded)
        // if (laneClosedFound != null) {
        //   laneClosedFound.forEach(element => {
        //     let firstWord = /^[^\s]+/gm;
        //     let matchedWord = element.match(firstWord);
        //     if (matchedWord == 'Ready') {
        //       q = `INSERT INTO update_pending(port_num, raw_json, date_recorded, lane_type, reason) VALUES (${port_num}, '${raw_data}', ${date_recorded}, 2, 'Lane Closed');`
        //     }
        //     if (matchedWord == 'Sentri') {
        //       q = `INSERT INTO update_pending(port_num, raw_json, date_recorded, lane_type, reason) VALUES (${port_num}, '${raw_data}', ${date_recorded}, 1, 'Lane Closed');`
        //     };
        //     if (matchedWord == 'General') {
        //       q = `INSERT INTO update_pending(port_num, raw_json, date_recorded, lane_type, reason) VALUES (${port_num}, '${raw_data}', ${date_recorded}, 0, 'Lane Closed');`
        //     };
        //     // console.log(q);
        //   });
        // };
        // console.log(updatePendingFound);
        // if (updatePendingFound != null) {
        //   updatePendingFound.forEach(element => {
        //     let firstWord = /^[^\s]+/gm;
        //     let matchedWord = element.match(firstWord);
        //     if (matchedWord == 'Ready') {
        //       q = `INSERT INTO update_pending(port_num, raw_json, date_recorded, lane_type, reason) VALUES (${port_num}, '${raw_data}', ${date_recorded}, 2, 'Update Pending');`
        //     }
        //     if (matchedWord == 'Sentri') {
        //       q = `INSERT INTO update_pending(port_num, raw_json, date_recorded, lane_type, reason) VALUES (${port_num}, '${raw_data}', ${date_recorded}, 1, 'Update Pending');`
        //     };
        //     if (matchedWord == 'General') {
        //       q = `INSERT INTO update_pending(port_num, raw_json, date_recorded, lane_type, reason) VALUES (${port_num}, '${raw_data}', ${date_recorded}, 0, 'Update Pending');`
        //     };
        //     // console.log(q);
        //   });
        // };
        // if (durationFound != null) {
        //   for (let i = 0; i < durationFound.length; i++) {
        //     const year = new Date().getFullYear();
        //     const month = ('0' + (new Date().getMonth() + 1)).slice(-2)
        //     const day = ('0' + (new Date().getDate())).slice(-2);
        //     const update_time = new Date(`${year}-${month}-${day} ${timestampFound[i]}`);
        //     /**
        //      * Duration in minutes
        //      */
        //     let duration = Number(durationFound[i].match(/\d{1,3}/gm)[0]);
        //     let dateTime = DateTime.now().setZone('America/Los_Angeles');
        //     let dateInsert = `TO_TIMESTAMP('${dateTime.year}-${dateTime.month}-${dateTime.day} ${update_time.getHours()}:00:00.000000000', 'YYYY-MM-DD HH24:MI:SS.FF')`;
           
        //     // let dateInsert = `TO_TIMESTAMP('${year}-${month}-${day} ${update_time.getHours()}:00:00.000000000', 'YYYY-MM-DD HH24:MI:SS.FF')`;
        //     console.log(dateInsert);
        //     q += `${bpsql}`
        //     q += `${dateInsert},`
        //     q += `'${i}',`
        //     q += `${duration * 60},`;
        //     q += `${port_num},`;
        //     q += `${date_recorded},`;
        //     q += `'${raw_data}'`;
        //     q += endbp;
        //   }
        // };
        // // console.log(q)
        // // await this.query(q, "CBP Table");
        // return {
        //     /**
        //      * updateTime is an array of update times formatted based on general, sentri, and ready lanes.
        //      */
        //     updateTimes: lastUpdate,
        //     /**
        //      * Wait Times Array is an array of all durations based on general, sentri, and ready lanes.
        //      */
        //     waitTimesArray: waitTimesArray
        // };
    }

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