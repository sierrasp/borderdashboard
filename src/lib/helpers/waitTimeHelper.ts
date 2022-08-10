
import { DateTime } from "luxon";
import { dev } from '$app/env';
import { Helper } from "./btsHelper";
export default class waitTimes {
    portNum = 250401;
    storageID = "";
    constructor(portNum: number) {
        this.portNum = portNum;
    }
    async getCurrentWaitTimes() {
        // let storageID = 
        try {
            let lastWaitTimeURI = ``;
            let averageWaitTimeURI = ``;
            lastWaitTimeURI = `https://borderdashboard.com/controller/getLastWaitTimes/${this.portNum}`;
            averageWaitTimeURI = `https://borderdashboard.com/controller/getAverageWaitTimes/${this.portNum}`;
            if (dev == true) {
                lastWaitTimeURI = `http://localhost:3000/controller/getLastWaitTimes/${this.portNum}`;
                averageWaitTimeURI = `http://localhost:3000/controller/getAverageWaitTimes/${this.portNum}`;
            };

            const lastWaitTimes: { daterecorded: string, delay_seconds: number, lane_type: number }[] = await (await (await fetch(lastWaitTimeURI)).json());
            const averageWaitTimes : {Average_Delay : string, Day_of_Week : number,  lane_type : number}[] = await (await (await fetch(averageWaitTimeURI)).json());
            const newDate = DateTime.fromISO(`${lastWaitTimes[0].daterecorded}`, { zone: 'America/Los_Angeles' });
            let returnString = ``;
            if (Helper.getCurrentDate().day == newDate.day) {
                returnString = `Today at ${this.toAPM(newDate)}`;
            }
            else if (newDate.day == Helper.getCurrentDate().day - 1) {
                returnString = `Yesterday at ${this.toAPM(newDate)}`;
            }
            else {
                returnString = `${newDate.toSQLDate()}`;
            };
            console.log(returnString);
            // let's have some variable spam
            const generalDelay = Math.round(Number(lastWaitTimes[0].delay_seconds) / 60); 
            const generalAverage = Math.round(Number(averageWaitTimes[0].Average_Delay) / 60);
            const generalPercentChange = Helper.calculatePercentDifference(generalDelay, generalAverage);
            const sentriDelay = Math.round(Number(lastWaitTimes[1].delay_seconds) / 60); 
            const sentriAverage = Math.round(Number(averageWaitTimes[1].Average_Delay) / 60);
            const sentriPercentChange = Helper.calculatePercentDifference(sentriDelay, sentriAverage);
            const readyDelay = Math.round(Number(lastWaitTimes[2].delay_seconds) / 60); 
            const readyAverage = Math.round(Number(averageWaitTimes[2].Average_Delay) / 60);
            const readyPercentChange = Helper.calculatePercentDifference(readyDelay, readyAverage);
            /**
             * INDEX 0 = GENERAL LANE
             * INDEX 1 = SENTRI LANE
             * INDEX 2 = READY LANE
             */
            this.storageID = `${Helper.getCurrentDate().toISO()}`;
            console.log(returnString);
            return {
                lastUpdateTime: returnString,
                waitTimes: {
                    generalLane: {
                        delay : generalDelay,
                        average : generalAverage,
                        percentChange : generalPercentChange,
                },
                sentriLane : {
                    delay : sentriDelay,
                    average : sentriAverage,
                    percentChange : sentriPercentChange,
                },
                readyLane : {
                    delay : readyDelay,
                    average : readyAverage,
                    percentChange : readyPercentChange,
                }
            }
        };
    }
    catch (error) {
        console.log(error);
        return {
            lastUpdateTime: `Error`,
            waitTimes: {
                generalLane: {
                    delay : 0,
                    average : 0,
                    percentChange : 0,
            },
            sentriLane : {
                delay : 0,
                average : 0,
                percentChange : 0,
            },
            readyLane : {
                delay : 0,
                average : 0,
                percentChange : 0,
            }
        }
        }
    }
};
    toAPM(date: DateTime) {
        let hours = Number(date.hour)
        const minutes = Number(date.minute)
        const ampm = hours >= 12 ? 'pm' : 'am';

        hours = hours % 12;
        hours = hours ? hours : 12; // the hour '0' should be '12'

        const minutesString = minutes < 10 ? '0' + minutes : minutes;
        const strTime = hours + ':' + minutesString + ' ' + ampm;

        return strTime
    };
    // For now, these are useless
    store(data: any) {
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
            const rows = JSON.parse(storedData || '{}');
            return rows;
        }
    }
}