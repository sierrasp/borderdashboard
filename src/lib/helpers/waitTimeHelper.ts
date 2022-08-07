
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
            let fetchUrl = ``;
            fetchUrl = `https://borderdashboard.com/controller/getLastWaitTime/0/${this.portNum}`
            if (dev == true) {
                fetchUrl = `http://localhost:3000/controller/getLastWaitTime/0/${this.portNum}`
            }
            const data: { daterecorded: string, delay_seconds: number, lane_type: number }[] = await (await (await fetch(fetchUrl)).json())
            const newDate = DateTime.fromISO(`${data[0].daterecorded}`, { zone: 'America/Los_Angeles' });
            let returnString = ``;
            if (Helper.getCurrentDate().day == newDate.day) {
                console.log(Helper.getCurrentDate().day, "hello")
                returnString = `Today at ${this.toAPM(newDate)}`
            }
            // console.log(newDate.day)
            else if (newDate.day == Helper.getCurrentDate().day - 1) {
                console.log(newDate.day, "HELLOOOO")
                returnString = `Yesterday at ${this.toAPM(newDate)}`
            }
            else {
                returnString = `${newDate.toSQLDate()}`
            }
            /**
             * INDEX 0 = GENERAL LANE
             * INDEX 1 = SENTRI LANE
             * INDEX 2 = READY LANE
             */
            this.storageID = `${Helper.getCurrentDate().toISO()}`
            return {
                lastUpdateTime: returnString,
                waitTimes: {
                    generalLane: Math.round(Number(data[0].delay_seconds / 60)),
                    sentriLane: Math.round(Number(data[1].delay_seconds / 60)),
                    readyLane: Math.round(Number(data[2].delay_seconds / 60))
                }
            }
        } catch (error) {
            return {
                lastUpdateTime: `Error`,
                waitTimes: {
                    generalLane: 0,
                    sentriLane: 0,
                    readyLane: 0,
                }
            }
        }
    }
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