// import db from '$lib/db';
// /** @type {import('@sveltejs/kit').RequestHandler} */

import { dbHelper } from '$lib/model/dbHelper';
export async function get({params}) {
//   console.log(params)
let portNumber = Number(params.portNumber);
  if (params.functionName == "getLastWaitTimes") {
    let rows = await dbHelper.mostRecentByPort(portNumber);
    console.log(rows);
    return  {
        body: rows
    }
    
  };
  if (params.functionName == "getAverageWaitTimes") {
    let rows = await dbHelper.averageWaitTimeByPort(portNumber);
    return {
        body : rows
    }
  }
  return {
    status: 404
  };
}


