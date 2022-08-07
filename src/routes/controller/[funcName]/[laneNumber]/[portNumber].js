// import db from '$lib/db';
// /** @type {import('@sveltejs/kit').RequestHandler} */

import { dbHelper } from '$lib/model/dbHelper';
export async function get({params}) {
  console.log(params)
  if (params.funcName == "getLastWaitTime") {
    
    let portNumber = Number(params.portNumber);
    let laneNumber = Number(params.laneNumber);
    console.log(portNumber);
    console.log(laneNumber);
    let rows = await dbHelper.mostRecentByPort(portNumber, laneNumber);
    console.log(rows);
    // dbHelper.mostRecentByPort(portNumber, laneNumber);
    return  {
        body: rows
    }
    
  };
  return {
    status: 404
  };
}

//src/routes/controller/[function]
