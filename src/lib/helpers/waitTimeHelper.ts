
import { DateTime } from "luxon";
import { dev } from '$app/env';
import { Helper } from "./btsHelper";
import type { IWaitTime } from "./waitTimeHelperTypes";
export default class waitTimes {
    portNum = 250401;
    storageID = "";
    URI = "http://localhost:5173/controller"
    constructor(portNum: number) {
        this.portNum = portNum;
        if (dev == false) {
            this.URI = "https://borderdashboard.com/controller";
        }
    };
    async getCurrentWaitTimes() {
        let returnObj: { lastUpdateTime: string, found: { laneName: string, delay: number, average: number, percentChange: number }[], missing: { laneName: string, reason: string }[] } = {
            lastUpdateTime: "",
            found: [],
            missing: [],
        };
        /**
         * JSON object to be posted to server API 
         */
        const lastWaitJson: { functionName: string, ports: number[] } = { functionName: "getLastWaitTimes", ports: [this.portNum] };
        const averageWaitTimeJson: { functionName: string, ports: number[] } = { functionName: "getAverageWaitTimes", ports: [this.portNum] };
        try {
            const lastWaitTimes = await this.getMostRecentDates(lastWaitJson);
            const averageWaitTimes: { found: { avg: string, lane_type: number }[], missing: number[] } = await (await fetch(this.URI, { method: 'POST', body: JSON.stringify(averageWaitTimeJson) })).json();
            console.log(`${lastWaitTimes[0].daterecorded}`);
            const newDate = DateTime.fromISO(`${lastWaitTimes[0].daterecorded}`).setZone('America/Tijuana');
            console.log(newDate);
            const currentDate = DateTime.local();
            let returnString = ``;
            if (currentDate.day == newDate.day) {
                returnString = `Today at ${this.toAPM(newDate)}`;
            }
            else if (newDate.day == currentDate.day - 1) {
                returnString = `Yesterday at ${this.toAPM(newDate)}`;
            }
            else {
                returnString = `${newDate.toSQLDate()}`;
            };
            console.log(returnString);

            averageWaitTimes.found.forEach((element) => {
                let average = 0;
                let delay = 0;
                let percentDiff = 0;
                if (Number(element.avg) != 0) {
                    average = Math.round(Number(element.avg) / 60);
                    delay = Math.round(Number(lastWaitTimes[element.lane_type].delay_seconds) / 60);
                    percentDiff = Helper.calculatePercentDifference(delay, average);
                }
                if (element.lane_type == 0) {
                    returnObj.found.push({
                        laneName: "General",
                        delay: delay,
                        average: average,
                        percentChange: percentDiff,
                    });
                }
                if (element.lane_type == 1) {
                    returnObj.found.push({
                        laneName: "Sentri",
                        delay: delay,
                        average: average,
                        percentChange: percentDiff,
                    });
                }
                if (element.lane_type == 2) {
                    returnObj.found.push({
                        laneName: "Ready",
                        delay: delay,
                        average: average,
                        percentChange: percentDiff,
                    });
                }
            });
            console.log(averageWaitTimes);
            averageWaitTimes.missing.forEach((element) => {
                if (element == 0) {
                    returnObj.missing.push({
                        laneName: "General",
                        reason: "Lane Closed"
                    });
                }
                if (element == 1) {
                    returnObj.missing.push({
                        laneName: "Sentri",
                        reason: "Lane Closed"
                    });
                }
                if (element == 2) {
                    returnObj.missing.push({
                        laneName: "Ready",
                        reason: "Lane Closed"
                    });
                }
            });
            returnObj["lastUpdateTime"] = returnString;
            console.log(returnObj);
            this.storageID = `${currentDate.toISO()}`;
            await console.log(returnObj);
            return {
                returnObj
            };
        }
        catch (error) {
            console.log(error);
            return {
                lastUpdateTime: `Error`,
                found: {
                    General: {
                        delay: 0,
                        average: 0,
                        percentChange: 0,
                    },
                    Sentri: {
                        delay: 0,
                        average: 0,
                        percentChange: 0,
                    },
                    Ready: {
                        delay: 0,
                        average: 0,
                        percentChange: 0,
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
    async getMostRecentDates(jsonObject: { functionName: string, ports: number[] }) {
        let arrayFinalObjects: IWaitTime[] = [];
        const rows: IWaitTime[] = await (await fetch(this.URI, { method: 'POST', body: JSON.stringify(jsonObject),   mode: 'no-cors',
        headers: {
          'Content-Type': 'application/json',
        }, })).json();
        let generalLaneArr: IWaitTime[] = [];
        let sentriLaneArr: IWaitTime[] = [];
        let readyLaneArr: IWaitTime[] = [];
        rows.forEach(x => {
            if (x.lane_type == 0) {
                generalLaneArr = [...generalLaneArr, x];
            }
            if (x.lane_type == 1) {
                sentriLaneArr = [...sentriLaneArr, x];
            }
            if (x.lane_type == 2) {
                readyLaneArr = [...readyLaneArr, x];
            }
        });
        const latestGeneralDate = generalLaneArr.reduce((a, b) => {
            return new Date(a.daterecorded) > new Date(b.daterecorded) ? a : b;
        });
        arrayFinalObjects = [...arrayFinalObjects, latestGeneralDate];
        const latestSentriDate = sentriLaneArr.reduce((a, b) => {
            return new Date(a.daterecorded) > new Date(b.daterecorded) ? a : b;
        });
        arrayFinalObjects = [...arrayFinalObjects, latestSentriDate];
        const latestReadyDate = readyLaneArr.reduce((a, b) => {
            return new Date(a.daterecorded) > new Date(b.daterecorded) ? a : b;
        });
        arrayFinalObjects = [...arrayFinalObjects, latestReadyDate];
        return arrayFinalObjects;
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