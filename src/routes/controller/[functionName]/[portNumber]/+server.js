// import db from '$lib/db';
// /** @type {import('@sveltejs/kit').RequestHandler} */

import { dbHelper } from '$lib/model/dbHelper';
export async function GET({params}) {
  console.log(params)
let portNumber = Number(params.portNumber);
  if (params.functionName == "getLastWaitTimes") {
    let rows = await dbHelper.mostRecentByPort(portNumber);
    console.log(rows);
    return new Response(String(JSON.stringify(rows)))
    
  };
  if (params.functionName == "getAverageWaitTimes") {
    let rows = await dbHelper.averageWaitTimeByPort(portNumber);
    return new Response(String(JSON.stringify(rows)))
  }
  return new Response(String("Error"))
}


