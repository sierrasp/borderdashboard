import dbConnector from "./dbConnector";
import { DateTime } from "luxon";
export class dbHelper extends dbConnector {
    static async mostRecentByPort(port_num: number) {

        const q = `SELECT lane_type, daterecorded, delay_seconds from rss_times WHERE port_num = ${port_num} AND daterecorded IS NOT NULL ORDER BY daterecorded DESC limit 40;     
        `
        const { rows } = await dbConnector.query(q);
         return rows;
    };
    static async averageWaitTimeByPort(port_num: number) {
        const dayOfWeek = DateTime.now().weekday;
        const hour = DateTime.now().hour;
        const q = `select AVG(delay_seconds), lane_type from rss_times where port_num = ${port_num} AND daterecorded IS NOT NULL AND extract(hour from daterecorded) = ${hour} AND extract(isodow from daterecorded) = ${dayOfWeek} GROUP BY lane_type;`;
          console.log(q);
        // console.log(q);
        const { rows } = await dbConnector.query(q);
        const lanes = [0,1,2];
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
            found : rows, 
            missing : missing
        }
    };
}


