import dbConnector from "./dbConnector";

export class dbHelper extends dbConnector {
    startDate = "";
    endDate = "";
    constructor(startDate : string, endDate : string) {
        super();
        this.startDate = startDate;
        this.endDate = endDate;
    }
    queryHelper(select : string, conditional : string) {
        return `SELECT ${select} FROM rss_times ${conditional}`;
    }
    selectRow () {
        let queriedResult = dbConnector.query(this.queryHelper("*", "limit 1"));
        
    }
    // constructor(startDate : string, endDate : string, )
}