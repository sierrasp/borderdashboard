
import { DateTime } from "luxon";
import { dev } from '$app/env';
import { Helper } from "./btsHelper";
export default class waitTimes {
    portNum = 250401;
    storageID = "";
    constructor(portNum: number) {
        this.portNum = portNum;
    };
    async getCurrentWaitTimes() {
        console.log("HELLOO?>>");
        /**
         * I need to identify which ports are closed
         */
        //  const laneClosedReg = /((Ready|Sentri|General) Lanes: {2}Lanes Closed)/gm
        //  const openLanesRegex = /(General|Ready|Sentri).(.*?)delay/gm;

        // delay : delay,
        // average : average,
        // percentChange : percentDiff,
        let returnObj: { lastUpdateTime: string, found: { laneName : string, delay: number, average: number, percentChange: number }[], missing: { laneName : string, reason : string }[] } = {
            lastUpdateTime: "",
            found: [],
            missing: [],
        };
        let lastWaitTimeURI = ``;
        let averageWaitTimeURI = ``;
        lastWaitTimeURI = `https://borderdashboard.com/controller/getLastWaitTimes/${this.portNum}`;
        averageWaitTimeURI = `https://borderdashboard.com/controller/getAverageWaitTimes/${this.portNum}`;
        console.log(averageWaitTimeURI);
        if (dev == true) {
            lastWaitTimeURI = `http://localhost:5173/controller/getLastWaitTimes/${this.portNum}`;
            averageWaitTimeURI = `http://localhost:5173/controller/getAverageWaitTimes/${this.portNum}`;
            console.log(averageWaitTimeURI);
        };

        try {

            console.log(lastWaitTimeURI);
            const lastWaitTimes = await this.getMostRecentDates(lastWaitTimeURI);
            console.log(lastWaitTimes);
            const averageWaitTimes : { found: { avg: string, lane_type: number }[], missing: number[] } = await (await fetch(averageWaitTimeURI)).json()
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
                        laneName : "General",
                        delay: delay,
                        average: average,
                        percentChange: percentDiff,
                    });
                }
                if (element.lane_type == 1) {
                    returnObj.found.push({
                        laneName : "Sentri",
                        delay: delay,
                        average: average,
                        percentChange: percentDiff,
                    });
                }
                if (element.lane_type == 2) {
                    returnObj.found.push({
                        laneName : "Ready",
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
                        laneName : "General",
                        reason : "Lane Closed"
                    });
                }
                if (element == 1) {
                    returnObj.missing.push({
                        laneName : "Sentri",
                        reason : "Lane Closed"
                    });
                }
                if (element == 2) {
                    returnObj.missing.push({
                        laneName : "Ready",
                        reason : "Lane Closed"
                    });
                }
            });
            returnObj["lastUpdateTime"] = returnString;
            console.log(returnObj);
            this.storageID = `${Helper.getCurrentDate().toISO()}`;
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
    // checkPortClosed(averageWaitTimes : {avg : string, lane_type : number}[]) {
    //     let missing: {avg : string, lane_type : number}[] = [];
    //     for (let i = 0; i <= 3; i++) {
    //         if (averageWaitTimes.indexOf(i) == -1) {
    //             missing = [...missing, averageWaitTimes[i]];
    //         };
    //     } ;   

    //     console.log("HELELEOEOEOEOE?????")
    //     return {
    //         averageWaitTimes : averageWaitTimes, 
    //         missing : missing
    //     }     
    // };

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
    async getMostRecentDates(URI: string) {
        console.log(URI);
        let arrayFinalObjects: { lane_type: number, daterecorded: string, delay_seconds: number }[] = [];
        const rows: { lane_type: number, daterecorded: string, delay_seconds: number }[] = await (await fetch(URI)).json();
        let generalLaneArr: { lane_type: number, daterecorded: string, delay_seconds: number }[] = [];
        let sentriLaneArr: { lane_type: number, daterecorded: string, delay_seconds: number }[] = [];
        let readyLaneArr: { lane_type: number, daterecorded: string, delay_seconds: number }[] = [];
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

        // console.log(rows);
        // let arrayFinalObjects : {lane_type: number, daterecorded: string, delay_seconds : number}[] = [];
        // const generalLane = rows.filter(el => {
        //     return el.lane_type = 0;
        // });
        // console.log(generalLane);
        // const sentriLane = rows.filter(el => {
        //     return el.lane_type = 1;
        // });
        // const readyLane = rows.filter(el => {
        //     return el.lane_type = 2;
        // });
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