// import db from '$lib/db';
// /** @type {import('@sveltejs/kit').RequestHandler} */
import { dbHelper } from '$lib/model/dbHelper';
export async function POST({ request }) {
  const params = await request.json();
  console.log(params);
    if (params.functionName == "getLastWaitTimes") {
    let rows = await dbHelper.mostRecentByPort(params.ports[0]);
    console.log(rows);
    return new Response(String(JSON.stringify(rows)))
    
  };
  if (params.functionName == "getAverageWaitTimes") {
    let rows = await dbHelper.averageWaitTimeByPort(params.ports[0]);
    return new Response(String(JSON.stringify(rows)))
  }
  if (params.functionName == "getTradeValues") {
    let rows = await dbHelper.getTradeValues(params.ports, params.startDate, params.endDate);
    console.log(rows);
    return new Response(String(JSON.stringify(rows)))
  }
  if (params.functionName == "getBTSValues") {
    let rows = await dbHelper.getBTSValues(params.measureObj, params.ports, params.startDate, params.endDate);
    return new Response(String(JSON.stringify(rows)));
  }
  return new Response(String("Error"))

}
// export async function POST({params}) {
//   console.log(params)
// let json = params.jsonStringified;



