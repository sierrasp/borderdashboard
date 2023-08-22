// import db from '$lib/db';
// /** @type {import('@sveltejs/kit').RequestHandler} */
import { dbHelper } from '$lib/model/dbHelper';
import { dev } from '$app/env';
export async function POST({ request }) {


    const allowedOrigin = (dev) ? 'http://localhost:5173' : 'https://borderdashboard.com/'
  const CORS_CONFIG = {
    allowedOrigins: allowedOrigin,
    allowedMethods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    allowedHeaders: 'Content-Type, Authorization',
  };

  



  const addHeaders = async (/** @type {Response} */ response) => {
    response.headers.append('Access-Control-Allow-Origin', CORS_CONFIG.allowedOrigins); 
    response.headers.append('Access-Control-Allow-Methods', CORS_CONFIG.allowedMethods);
    
    response.headers.append('Access-Control-Allow-Headers', CORS_CONFIG.allowedHeaders);

    console.log(response);
    
    return response;
      }

      if (request.method === 'OPTIONS') {
        const response = new Response();
        const HEADERED_RESPONSE = addHeaders(response);
        return HEADERED_RESPONSE;
      }
  const createResponse = async (data) => {
    const response = new Response(JSON.stringify(data));
    const HEADERED_RESPONSE = addHeaders(response);
    return HEADERED_RESPONSE;
    
  }

  const createErrorResponse = async (data) => {
    const response = new Response(String("Error"));
    const HEADERED_RESPONSE = addHeaders(response);
    return HEADERED_RESPONSE;
    
  }

  const params = await request.json();


    if (params.functionName == "getLastWaitTimes") {
    let rows = await dbHelper.mostRecentByPort(params.ports[0]);
    const response = await createResponse(rows);
    return response;
    
  };
  if (params.functionName == "getAverageWaitTimes") {
    let rows = await dbHelper.averageWaitTimeByPort(params.ports[0]);
    const response = await createResponse(rows);
    return response;

  }
  if (params.functionName == "getTradeValues") {
    let rows = await dbHelper.getTradeValues(params.ports, params.startDate, params.endDate);
    const response = await createResponse(rows);
    return response;
  }
  if (params.functionName == "getBTSValues") {
    let rows = await dbHelper.getBTSValues(params.measureObj, params.ports, params.startDate, params.endDate);
    const response = await createResponse(rows);
    return response;
  
  }
  else {
    const response =  await createErrorResponse();
    return response;
  };





}
// export async function POST({params}) {
//   console.log(params)
// let json = params.jsonStringified;



