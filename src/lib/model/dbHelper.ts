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
    static async getTradeValues(ports: number[], startDateInput: Date, endDateInput: Date) {
        let startDate = DateTime.fromJSDate(new Date(startDateInput));
        let endDate = DateTime.fromJSDate(new Date(endDateInput));
        let totalSum = 0;
        let totalPreviousSum = 0;
        /**
         * Translates port name to Trade Port Code - ("San Ysidro" -> 2404)
         */
        const translationObject = {
            'San Ysidro': 2404,
            Andrade: 2502,
            'Calexico East': 2507,
            'Calexico West': 2503,
            'Otay Mesa': 2506,
            Tecate: 2505
        };
        /**
         *  @type [{date : string}] 
         */
        const lastDateRows = await dbConnector.query("SELECT date FROM tradenums ORDER BY date DESC LIMIT 1;  ");
        const lastDateUpdated: DateTime = DateTime.fromJSDate(new Date(lastDateRows.rows[0]['date']));
        if (lastDateUpdated <= endDate) {
            endDate = lastDateUpdated;
            if (startDate >= lastDateUpdated.minus({ years: 1 })) {
                startDate = lastDateUpdated.minus({ years: 1 });
            }
            
        };
        // if 
        for await (const portID of ports ) {
            console.log(`SELECT SUM(sum) FROM tradenums WHERE date <= '${endDate.year}-${endDate.month}-01' AND date >= '${startDate.year}-${startDate.month}-01' AND port_id=${portID};`);
            const totalQueried = await dbConnector.query(`SELECT SUM(sum) FROM tradenums WHERE date <= '${endDate.year}-${endDate.month}-01' AND date >= '${startDate.year}-${startDate.month}-01' AND port_id=${portID}`);
            const previousQueried = await dbConnector.query(`SELECT SUM(sum) FROM tradenums WHERE date <= '${endDate.year - 1}-${endDate.month}-01' AND date >= '${startDate.year - 1}-${startDate.month}-01' AND port_id=${portID}`);
            const totalSumPort = Number(await totalQueried.rows[0]['sum']);
            // console.log(totalSumPort, "SUM BY PORT");
            // console.log(totalSumPort, "SUM BY PORT");
            const totalPreviousSumPort = Number(previousQueried.rows[0]['sum']);
            totalSum += totalSumPort;
            totalPreviousSum += totalPreviousSumPort;
            // console.log(totalSum, "TOTAL SUM ")
        }

        // console.log("EHLLOOIOO")
        // console.log(totalSum);
        // console.log(totalPreviousSum);
        return {
            currentTrade : totalSum, 
            percentChange : Math.round(((totalSum - totalPreviousSum) / totalPreviousSum) * 100)
        }

        // // END VARIABLE DEFINING SECTION

        // // LETS LOOP THROUGH THE SELECTED PORTS
        // for (let port of selectedPortNames) {
        // 	console.log(lastDateUpdated, 'LAST DATE UPDATE PORTS');
        // 	console.log(port);
        // 	/**
        // 	 * There's no date between in this api :(, we must loop through every month from start date to end date
        // 	 */
        // 	for (let dt = startDate; dt <= endDate; dt = dt.plus({ months: 1 })) {
        // 		const query = `https://data.bts.gov/resource/ku5b-t97n.json?$$app_token=wUg7QFry0UMh97sXi8iM7I3UX&$limit=100000&year=${dt.year}&month=${dt.month}&depe=${translationObject[port]}`;
        // 		console.log(query);
        // 		const data = await (await fetch(query)).json();
        // 		const sum = data.reduce((accumulator: any, object: { value: any }) => {
        // 			return accumulator + Number(object.value);
        // 		}, 0);
        // 		console.log(sum);
        // 		totalSum += sum;
        // 		/**
        // 		 * Let's go back a year from when this query happened for some comparison
        // 		 */
        // 		const previousQuery = `https://data.bts.gov/resource/ku5b-t97n.json?$$app_token=wUg7QFry0UMh97sXi8iM7I3UX&$limit=100000&year=${
        // 			dt.year - 1
        // 		}&month=${dt.month}&depe=${translationObject[port]}`;
        // 		const previousData = await (await fetch(previousQuery)).json();
        // 		const previousSum = previousData.reduce((accumulator: any, object: { value: any }) => {
        // 			return accumulator + Number(object.value);
        // 		}, 0);
        // 		console.log(sum);
        // 		totalPreviousSum += previousSum;
        // 	}
        // }

        // totalTrade = {
        // 	currentTrade: totalSum,
        // 	percentChange: Helper.calculatePercentDifference(totalSum, totalPreviousSum)
        // };
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


