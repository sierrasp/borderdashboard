import dbConnector from "./dbConnector";

export class dbHelper extends dbConnector {
    static async mostRecentByPort(port_num: number) {

        const q =  `SELECT lane_type, daterecorded, delay_seconds from rss_times WHERE port_num = ${port_num} AND daterecorded IS NOT NULL ORDER BY daterecorded DESC limit 3;     
        `
        console.log(q);
        const { rows } = await dbConnector.query(q);
        console.log(rows);
        // console.log(`SELECT date, delay_seconds from rss_times WHERE port_num = ${port_num} AND lane_type = ${lane_type} AND daterecorded IS NOT NULL ORDER BY daterecorded DESC limit 1;`)
        return rows; 
    };
}

// SELECT lane_type, daterecorded, delay_seconds from rss_times WHERE port_num = 250401 AND daterecorded IS NOT NULL ORDER BY daterecorded DESC limit 3;