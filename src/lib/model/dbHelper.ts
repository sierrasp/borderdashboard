import dbConnector from "./dbConnector";

export class dbHelper extends dbConnector {
    static async mostRecentByPort(port_num: number, lane_type: number) {
        const { rows } = await dbConnector.query(`SELECT date, delay_seconds from rss_times WHERE port_num = ${port_num} AND lane_type = ${lane_type} AND daterecorded IS NOT NULL ORDER BY daterecorded DESC limit 1;`);
        console.log(`SELECT date, delay_seconds from rss_times WHERE port_num = ${port_num} AND lane_type = ${lane_type} AND daterecorded IS NOT NULL ORDER BY daterecorded DESC limit 1;`)
        return rows; 
    };
}