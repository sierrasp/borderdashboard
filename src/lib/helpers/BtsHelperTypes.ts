// I before variable name denotes Interface typing
export interface IBtsData {
    port_name: string;
    state: string;
    date: string;
    port_code: string;
    value: string;
    measure: string;
    border: string;
};
export interface IWaitTimesObj {
    lastUpdateTime : string, 
    waitTime : {
        generalLane : {
            delay : null | number, 
            average : 
        }
    }
}


// let waitTimesObj = {
//     lastUpdateTime: '',
//     waitTimes: {
//         generalLane: {
//             delay: 0,
//             average: 0,
//             percentChange: 0
//         },
//         sentriLane: {
//             delay: 0,
//             average: 0,
//             percentChange: 0
//         },
//         readyLane: {
//             delay: 0,
//             average: 0,
//             percentChange: 0
//         }
//     }
// };