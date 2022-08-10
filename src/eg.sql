select * from rss_times where daterecorded IS NOT NULL AND daterecorded >= '01-01-2020' AND daterecorded <= '01-01-2021';

CREATE TABLE update_pending (
	wait_id serial PRIMARY KEY,
    port_num INT NOT NULL,
    raw_json VARCHAR NOT NULL,
    date_recorded TIMESTAMP
);

 wait_id |        date         | lane_type | delay_seconds | port_num |    daterecorded     |  


 SELECT * from rss_times WHERE port_num = 250401 AND lane_type = 0 AND daterecorded IS NOT NULL ORDER BY daterecorded DESC;


 SELECT date, delay_seconds from rss_times WHERE port_num = 250401 AND lane_type = 0 AND daterecorded IS NOT NULL ORDER BY daterecorded DESC limit 1;

 select delay_seconds as "Average Delay", extract(dow from daterecorded) as "Day of Week" from rss_times where port_num = 250401 AND lane_type = 0 AND daterecorded IS NOT NULL AND daterecorded >= '01-09-2021' AND daterecorded <= '01-04-2022'  GROUP BY daterecorded;
 
 
 select AVG(delay_seconds) as "Average Delay", extract(isodow from daterecorded) as "Day of Week", lane_type   from rss_times 
 where port_num = 250601 AND daterecorded IS NOT NULL AND extract(hour from daterecorded) = 0 AND extract(isodow from daterecorded) = 7 
   GROUP BY "Day of Week" , lane_type
   ORDER BY "Day of Week" DESC;


   select lane_type,  extract(hour from daterecorded), extract(isodow from daterecorded), AVG(delay_seconds) as "Average_Delay" from  rss_times where port_num = 250601 and daterecorded IS NOT NULL GROUP BY daterecorded, lane_type;

    select AVG(delay_seconds) as "Average Delay", extract(hour from daterecorded) as "hour", extract(isodow from daterecorded) as "Day of Week", lane_type   from rss_times 
 where port_num = 250601 AND daterecorded IS NOT NULL
   GROUP BY daterecorded , lane_type
   ORDER BY "hour" DESC;


 select AVG(delay_seconds) as "Average_Delay", extract(isodow from daterecorded) as "Day_of_Week", extract(hour from daterecorded), lane_type from rss_times 
        where port_num = 250401 AND daterecorded IS NOT NULL AND extract(hour from daterecorded) = 22 AND extract(isodow from daterecorded) = 2 
          GROUP BY "Day_of_Week" , lane_type, daterecorded
          ORDER BY "Day_of_Week" DESC;



select lane_type from rss_times where port_num = 250601 AND daterecorded IS NOT NULL AND extract(hour from daterecorded) = 2 AND extract(isodow from daterecorded) = 2;

