import dbConnector from "./dbConnector";
import { DateTime } from "luxon";
export class dbHelper extends dbConnector {
    /**
     * 
     * @param port_num Port Number
     * @returns Latest Wait Times
     */
    static async mostRecentByPort(port_num: number) {

        const q = `SELECT lane_type, daterecorded, delay_seconds from rss_times WHERE port_num = ${port_num} AND daterecorded IS NOT NULL ORDER BY daterecorded DESC limit 40;     
        `
        const { rows } = await dbConnector.query(q);
        return rows;
    };
    /**
     * 
     * @param ports Array of Ports in numeric form - Eg. [2504, 2505, 2302, 2301]
     * @param startDateInput This is the input start date for the query
     * @param endDateInput This is the input end date for the query
     * @returns Total Trade object which contains the total trade for the selected time period, the percent change since a year previous, and the last date recorded in the db (which means the last date updated)
     */
    static async getTradeValues(ports: number[], startDateInput: Date, endDateInput: Date) {
        const startDate = DateTime.fromJSDate(new Date(startDateInput));
        let endDate = DateTime.fromJSDate(new Date(endDateInput));
        let totalSum = 0;
        let totalPreviousSum = 0;
        /**
         *  @type [{date : string}] 
         */
        const lastDateRows = await dbConnector.query("SELECT date FROM tradenums ORDER BY date DESC LIMIT 1;  ");
        const lastDateUpdated: DateTime = DateTime.fromJSDate(new Date(lastDateRows.rows[0]['date']));
        if (lastDateUpdated <= endDate) {
            endDate = lastDateUpdated;
        };
        /**
         * This is the string for query that has ports - Eg. ("port_id = 'San Ysidro' OR port_id = 'Tecate")
         */
        let portQ = ``;
        for (let i = 0; i < ports.length; i++) {
                            
                if (i == ports.length - 1) {
                    portQ +=  ` port_id=${ports[i]}`
                }
                else {
                    portQ += ` port_id=${ports[i]} OR`
                }
                
            }
            console.log(`SELECT SUM(sum) FROM tradenums WHERE date <= '${endDate.year}-${endDate.month}-01' AND date >= '${startDate.year}-${startDate.month}-01' AND (${portQ});`);
            console.log(`SELECT SUM(sum) FROM tradenums WHERE date <= '${endDate.year - 1}-${endDate.month}-01' AND date >= '${startDate.year - 1}-${startDate.month}-01' AND (${portQ})`);
            const totalQueried = await dbConnector.query(`SELECT SUM(sum) FROM tradenums WHERE date <= '${endDate.year}-${endDate.month}-01' AND date >= '${startDate.year}-${startDate.month}-01' AND (${portQ})`);
            const previousQueried = await dbConnector.query(`SELECT SUM(sum) FROM tradenums WHERE date <= '${endDate.year - 1}-${endDate.month}-01' AND date >= '${startDate.year - 1}-${startDate.month}-01' AND (${portQ})`);
            const totalSumPort = Number(await totalQueried.rows[0]['sum']);
            const totalPreviousSumPort = Number(previousQueried.rows[0]['sum']);
            totalSum += totalSumPort;
            totalPreviousSum += totalPreviousSumPort;
        return {
            totalTrade : totalSum, 
            percentChange : Math.round(((totalSum - totalPreviousSum) / totalPreviousSum) * 100),
            lastDate : `${endDate}`
        }
    };

    /**
     * 
     * @param measureObj This object includes all the potential measures on the current dashboard
     * @param ports All of the selected ports
     * @param startDateInput Start Date for query 
     * @param endDateInput End Date for query
     * @returns An object of all group measures with their relevant trade count and percent change
     */
    static async getBTSValues(measureObj : {
        Pedestrians: string[],
        Vehicles: string[],
        Passengers: string[],
        Trucks: string[],
    }, ports : string[], startDateInput: Date, endDateInput: Date) {
        const startDate = DateTime.fromJSDate(new Date(startDateInput));
        let endDate = DateTime.fromJSDate(new Date(endDateInput));
        console.log(ports)
        /**
         *  @type [{date : string}] 
         */
        const lastDateRows = await dbConnector.query("SELECT date FROM btsnums ORDER BY date DESC LIMIT 1;  ");
        const lastDateUpdated: DateTime = DateTime.fromJSDate(new Date(lastDateRows.rows[0]['date']));
        if (lastDateUpdated <= endDate) {
            endDate = lastDateUpdated;
        }; 
        let objectToBeReturned: { lastDate : Date, [key: string]: { currentCount: number; percentChange: number } } = {
            lastDate: lastDateUpdated.toJSDate()
        };

		for (const [key, value] of Object.entries(measureObj)) {
			let currentCount = 0;
			let previousCount = 0;
            let portQ = ``;
            let measureQ = ``;
            for (let i = 0; i < ports.length; i++) {
                            
            if (ports[i] == 'Calexico West') {
                ports[i] = 'Calexico';
            }
                if (i == ports.length - 1) {
                    portQ +=  ` port_name = '${ports[i]}'`
                }
                else {
                    portQ += ` port_name = '${ports[i]}' OR`
                }
                
            }
            for (let i = 0; i < value.length; i++) {
                if (i == value.length - 1) {
                    measureQ +=  ` measure = '${value[i]}'`
                }
                else {
                    measureQ += ` measure = '${value[i]}' OR`
                }
                
            }
            console.log(portQ, "PORT Q");
            console.log(`SELECT SUM(value) FROM btsnums WHERE date <= '${endDate.year - 1}-${endDate.month}-01' AND date >= '${startDate.year - 1}-${startDate.month}-01' AND (${portQ}) AND (${measureQ})`)
            const totalQueried = await dbConnector.query(`SELECT SUM(value) FROM btsnums WHERE date <= '${endDate.year}-${endDate.month}-01' AND date >= '${startDate.year}-${startDate.month}-01' AND (${portQ}) AND (${measureQ})`);
            const previousQueried = await dbConnector.query(`SELECT SUM(value) FROM btsnums WHERE date <= '${endDate.year - 1}-${endDate.month}-01' AND date >= '${startDate.year - 1}-${startDate.month}-01' AND (${portQ}) AND (${measureQ})`);
            currentCount += Number(await totalQueried.rows[0]['sum']);
            previousCount += Number(await previousQueried.rows[0]['sum']);

            const percentChange = Math.round(((currentCount - previousCount) / previousCount) * 100);
			objectToBeReturned[key] = {
				currentCount: currentCount,
				percentChange: percentChange,
			};
			if (isNaN(currentCount) || isNaN(percentChange)) {
				objectToBeReturned[key] = {
					currentCount: 0,
					percentChange: 0
				};
			}
			console.log(objectToBeReturned);
		};
        // objectToBeReturned['lastDate'] = lastDateUpdated;
        return objectToBeReturned;
    };


    static async averageWaitTimeByPort(port_num: number) {
        const dayOfWeek = DateTime.now().weekday;
        const hour = DateTime.now().hour;
        const q = `select AVG(delay_seconds), lane_type from rss_times where port_num = ${port_num} AND daterecorded IS NOT NULL AND extract(hour from daterecorded) = ${hour} AND extract(isodow from daterecorded) = ${dayOfWeek} GROUP BY lane_type;`;
        console.log(q);
        // console.log(q);
        const { rows } = await dbConnector.query(q);
        const lanes = [0, 1, 2];
        let found: any[] = [];
        // let missing = [];
        if (rows.length < 3) {
            rows.forEach(x => {
                if (lanes.includes(x.lane_type)) {
                    found = [...found, x.lane_type];
                }
            })
        }
        let missing: number[] = [];
        if (rows.length < 3) {
            missing = lanes.filter(x => !found.includes(x));
        }
        return {
            found: rows,
            missing: missing
        }
    };
}


