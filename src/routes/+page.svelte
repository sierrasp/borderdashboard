<script lang="ts">
	/******************************* IMPORTS ***********************************/
	import { onMount } from 'svelte';
	import { Helper } from '$lib/helpers/btsHelper';
	import waitTimes from '$lib/helpers/waitTimeHelper';
	import { DateTime } from 'luxon';
	import Flatpickr from 'flatpickr';
	import monthSelectPlugin from 'flatpickr/dist/plugins/monthSelect/index.js';
	import 'flatpickr/dist/flatpickr.css';
	import 'flatpickr/dist/plugins/monthSelect/style.css';
	import { Moon } from 'svelte-loading-spinners';
	import { dev } from '$app/env';

	/**
	 * Svelte Strap doesn't work with svelte kit, so I had to use this workaround - npm i git+https://github.com/laxadev/sveltestrap.git
	 */
	import {
		Tooltip,
		Dropdown,
		DropdownItem,
		DropdownMenu,
		DropdownToggle,
		Label,
		Collapse,
		NavbarBrand,
		NavItem,
		NavLink,
		NavbarToggler,
		Navbar,
		Nav
	} from 'sveltestrap';
	import type { Instance } from 'flatpickr/dist/types/instance';

	/*************************** CONSTANTS AND GLOBAL VARIABLE DEFINING ****************************/
	/**
	 * Port association with name and number
	 */
	const PORTS = {
		'San Ysidro': [250401],
		'Otay Mesa': [250601],
		'Calexico East': [250301],
		Andrade: [250201],
		Tecate: [250501],
		'Calexico': [250302]
	};
	/**
	 * We want to do everything once the dom has loaded
	 */
	let pageLoaded = false;
	/**
	 * This variable is for the nav bar and the collapse menu if the display is small width
	 */
	let isOpen = false;

	/**
	 * These are all of the crossing ports for California in numerical form
	 */
	let CALIPORTS: number[] = [];
	Object.entries(PORTS).forEach(([key, value]) => {
		CALIPORTS = [...CALIPORTS, value[0]];
	});
	/**
	 * These are the crossing ports for california in string form
	 */
	let CALINAMES: string[] = [];
	Object.entries(PORTS).forEach(([key, value]) => {
		CALINAMES = [...CALINAMES, key];
	});
	console.log(CALIPORTS);

	/**
	 * Available ports with CRON script that other repo is executing
	 */
	const dropperPorts = [
		{ label: 'Calexico East', value: PORTS['Calexico East'] },
		{ label: 'San Ysidro', value: PORTS['San Ysidro'] },
		{ label: 'Otay Mesa', value: PORTS['Otay Mesa'] },
		{ label: 'Cali-Baja', value: CALIPORTS }
	];

	const PASSENGERS = ['Personal Vehicle Passengers', 'Train Passengers', 'Bus Passengers'];
	const VEHICLES = ['Personal Vehicles', 'Buses', 'Trains'];
	const PEDESTRIANS = ['Pedestrians'];
	const TRUCKS = ['Trucks'];
	/**
	 * This object includes all the potential measures on the current dashboard
	 */
	const mergedObject = {
		Pedestrians: PEDESTRIANS,
		Vehicles: VEHICLES,
		Passengers: PASSENGERS,
		Trucks: TRUCKS
	};
	/*************************** END CONSTANT VARIABLE DEFINING ****************************/

	/*************************** FLEXIBLE VARIABLE DEFINING ****************************/

	/** BTS Object - Eg. - {Pedestrians: {10000,-10}}*/

	let btsObject: {
		lastDate: Date;
		[key: string]: { currentCount: number; percentChange: number };
	} = {
		lastDate: DateTime.now()
	};
	for (const key in mergedObject) {
		btsObject[key] = {
			currentCount: 0,
			percentChange: 0
		};
	}
	/**
	 * Wait Times Obj
	 */
	let waitTimesObj: {
		lastUpdateTime: string;
		found: { laneName: string; delay: number; average: number; percentChange: number }[];
		missing: { laneName: string; reason: string }[];
	} = {
		lastUpdateTime: '',
		found: [
			{ laneName: 'General', average: 0, delay: 0, percentChange: 0 },
			{ laneName: 'Sentri', average: 0, delay: 0, percentChange: 0 },
			{ laneName: 'Ready', average: 0, delay: 0, percentChange: 0 }
		],
		missing: []
	};
	$: btsObject;
	$: waitTimesObj;
	/**
	 * When data was last updated in database - Eg. "Today at 10:00pm"
	 */
	let lastUpdate: string;
	$: lastUpdate;
	$: console.log(lastUpdate, 'LAST UPDATE');
	// OK THE NEXT SECTION WILL HAVE CONFUSING VARIABLE NAMES - IM SORRY 🗑️
	/**
	 * Selected Port Name - Default : San Ysidro - This name works for the Wait Times section
	 * The reason why we need to do this is because if one of our options is an array of ports, we need to be able to maintain one port for the wait times section
	 */
	let selectedWaitTimePortName: string;
	/**
	 * Selected Port Names - This is the array of ports that the BTS section will take - Eg. ["San Ysidro"] or ["Tecate", "Otay Mesa"]
	 */
	let selectedPortNames: string[] = CALINAMES;
	/**
	 * Unlike the wait times selection which can't take an array because it needs to be a singular port, the dropper name area can take a merge name like "CaliBaja"
	 */
	let dropperPortName: string;
	$: dropperPortName = 'Cali-Baja';
	// Let's make all of those variable names reactive and set them to defaults
	let selectedPorts: number[] = CALIPORTS;
	/**
	 * Calendar
	 */
	let calendarStart: Instance;
	let calendarEnd: Instance;
	/**
	 * Total Trade Object
	 */
	// let totalTrade: { totalTrade: number; percentChange: number; lastDate: string } = {
	// 	totalTrade: 0,
	// 	percentChange: 0,
	// 	lastDate: '2022-02-01T00:00:00.000-08:00'
	// };
	// $: totalTrade;

	/*************************** END FLEXIBLE VARIABLE DEFINING ****************************/

	/*************************** SVELTE REACTIVITY DEFINING ****************************/
	$: {
		onDateChange(endDate, startDate);
	}
	function onDateChange(...args) {
		if (pageLoaded) {
			setCalendar();
		}
	}

	/*************************** END SVELTE REACTIVITY DEFINING ****************************/

	/*************************** START DATES SEGMENT ****************************/
	/**
	 * Actual CURRENT DATE - not last update
	 */
	const CurrentDate = DateTime.local().setZone('America/Tijuana');
	/**
	 * Global end date for number generation. Eg. "2021-01-01"
	 */
	let endDate: string;
	/**
	 * This is the global starting date subtracted a year, this is for the percent calculation
	 */
	let previousStartDate: string;

	/**
	 * This is the global ending date subtracted a year, this is for the percent calculation
	 */
	let previousEndDate: string;
	/**
	 * Global starting date for number generation. Eg. "2020-01-01"
	 */
	let startDate: string;

	$: endDate = `${DateTime.now().year}-${('0' + DateTime.now().month).slice(-2)}-01`;
	$: console.log(endDate);

	/**
	 * This is the end date but in luxon format
	 */
	$: endDateLuxon = DateTime.fromSQL(endDate);
	$: startDate = `${DateTime.now().year - 1}-${('0' + DateTime.now().month).slice(-2)}-01`;
	/**
	 * This is the start date but in luxon format
	 */
	$: startDateLuxon = DateTime.fromSQL(startDate);
	$: previousEndDate = Helper.calculatePreviousDate(endDate);
	$: previousStartDate = Helper.calculatePreviousDate(startDate);
	$: previousStartDateLuxon = DateTime.fromSQL(previousStartDate);
	$: previousEndDateLuxon = DateTime.fromSQL(previousEndDate);
	/**
	 * This is the max date for Trade Data
	 *  - I'm setting it for now to the end date minus a year @var previousEndDate but this will change once my date function is called
	 */
	$: lastTradeDateLuxon = DateTime.fromSQL(previousEndDate);

	/**
	 * This is the max date for BTS Data
	 *   - I'm setting it for now to the end date minus a year @var previousEndDate but this will change once my date function is called
	 */
	$: lastBTSDateLuxon = DateTime.fromSQL(previousEndDate);

	/**
	 * This boolean is to see if the maximum date that bts gives us for trade is smaller than the date selected by the user
	 * If it's smaller, than set @var maxDateTrade to true - if it's not, it remains false
	 */
	let maxDateTrade = false;
	$: maxDateTrade = Helper.isDateSmaller(lastTradeDateLuxon, endDateLuxon);
	/**
	 * This boolean is to see if the maximum date that bts gives us for trade is smaller than the date selected by the user
	 * If it's smaller, than set @var maxDateBTS to true - if it's not, it remains false
	 */
	let maxDateBTS = false;
	$: maxDateBTS = Helper.isDateSmaller(lastBTSDateLuxon, endDateLuxon);

	/**
	 * This variable is to tell if the BTS data has loaded yet
	 */

	let btsLoaded = false;
	$: btsLoaded;

	/*************************** END DATES SEGMENT ****************************/

	/*************************** ON MOUNT SECTION  ****************************/
	onMount(async () => {
		pageLoaded = true;
		// Let's set the last wait times and get the bts data, which will in turn get the trade data
		await setLastUpdate();
		await getBtsGroup(mergedObject);
		setCalendar();
	});
	// });
	/*************************** DATE SELECTOR ****************************/
	/**
	 * Create Date Range Picker using dom acccess. We're using current last updated dates, so the calendar will be updated consistently
	 */
	function setCalendar() {
		let valueStart = '';
		let valueEnd = '';
		let elementStart = document.getElementById('dateCalendarStart')!;
		let elementFinish = document.getElementById('dateCalendarEnd')!;
		calendarStart = Flatpickr(elementStart, {
			onValueUpdate: (selectedDates, dateStr, instance) => {
				if (valueStart != dateStr) {
					startDate = dateStr;
				}
				console.log('change', dateStr);

				valueStart = dateStr;

				if (valueStart == '') console.log('clear');
			},
			defaultDate: startDate,
			plugins: [
				monthSelectPlugin({
					shorthand: false, //defaults to false
					dateFormat: 'Y-m-d', //defaults to "F Y"
					altFormat: 'F j, Y',
					theme: 'dark' // defaults to "light"
				})
			]
		});
		calendarEnd = Flatpickr(elementFinish, {
			minDate: startDate,
			onValueUpdate: (selectedDates, dateStr, instance) => {
				if (valueEnd != dateStr) {
					endDate = dateStr;
				}
				// onValueUpdate fired even if no change happend
				console.log('change', dateStr);
				valueEnd = dateStr;
				if (valueEnd == '') console.log('clear');
			},
			defaultDate: endDate,
			plugins: [
				monthSelectPlugin({
					dateFormat: 'Y-m-d', //defaults to "F Y"
					altFormat: 'F j, Y',
					theme: 'dark' // defaults to "light"
				})
			]
		});
	}
	/**
	 * Open Calendar - Workaround for Flatpickr's terrible calendar opening (clicking on the element apparently doesn't work normally)
	 * @param start Is the Calendar for the Start date or for the end date?
	 */
	function openCalendar(start: boolean) {
		setTimeout(function () {
			if (start) {
				calendarStart.open();
			} else {
				calendarEnd.open();
			}
		}, 5);
	}
	function submitCalendar() {
		getBtsGroup(mergedObject);
	}
	/*************************** END DATE SELECTOR ****************************/

	/*************************** DOM FUNCTIONS HANDLING BTS DATA ****************************/
	/**
	 * So this function takes in an object of whatever subgroups I want to calculate for - Eg. If I want to calculate for the pedestrians and a subset of measures called "Vehicles",
	 *
	 * @param obj I can pass in {"Pedestrians" : PEDESTRIANS, "Vehicles" : VEHICLES} for example
	 * @param portNames An array of all the port numbers I want to accumulate for - Eg. [250401, 250601, 250602] (Correlating to port names)
	 * @returns This updates the global btsObject variable with the count of each measure and the percent of change since the previous date calculated above
	 */
	async function getBtsGroup(obj: Record<string, string[]>) {
		btsLoaded = false;
		/**
		 * Let's wait for our dates to be generated - Remember, these aren't the current dates but dates generated off when BTS has last updated their data
		 */
		// await setDates();
		/**
		 * Ok now that our dates have been generated, let's get at the data collection
		 */
		// await getTradeValue();

		/**
		 * This is the object with all the data posted to the server for handling
		 */
		let postOBJ = {
			functionName: 'getBTSValues',
			ports: selectedPortNames,
			measureObj: obj,
			startDate: startDateLuxon,
			endDate: endDateLuxon
		};
		// force www?
		const URI = (dev) ? 'http://localhost:5173/controller/' : 'https://www.borderdashboard.com/controller/'
		btsObject = await (
			await fetch(URI, {
				method: 'POST',
				body: JSON.stringify(postOBJ),
				mode: 'cors',
			})
		).json();
		
		lastBTSDateLuxon = DateTime.fromJSDate(new Date(btsObject.lastDate));
		btsLoaded = true;
	}
	// /**

	//  * @property Possible Measures - ["Pedestrians", "Trains", "Buses", "Personal Vehicle Passengers", "Personal Vehicles", "Trucks", "Train Passengers", "Bus Passengers"]
	//  * @param measures - Input an array of measures for BTS -  Eg. ["Pedestrians", "Trains", etc]
	//  * @param startDate  Date Format - "Year-Month-Day", Eg. "2019-01-01"
	//  * @param endDate  Date Format - "Year-Month-Day", Eg. "2019-01-01"
	//  * @param port_name Port of Entry, Eg. "San Ysidro"
	//  * @returns Returns the sum of each measure for the given time period in an object based on the measures inputted, Eg. {"Pedestrians" : 20000, "Train Passengers" : 5, etc...}
	//  */
	// async function getCrossingsObject(
	// 	measures: string[],
	// 	startDate: string,
	// 	endDate: string,
	// 	port_name?: string
	// ) {
	// 	let instance = new Helper(startDate, endDate, port_name);
	// 	let calculatedCrossingsObject = await instance.calculateCrossings(measures);
	// 	return calculatedCrossingsObject;
	// }

	/*************************** END DOM  FUNCTIONS HANDLING BTS DATA ****************************/

	/*************************** DOM FUNCTIONS HANDLING BTS DATA ****************************/
	// /**
	//  * When was the BTS data last updated - this is the date formatted
	//  */
	// let lastUpdateDateBts: DateTime = DateTime.local().setZone('America/Tijuana');
	// /**
	//  * This is the date above but in object format
	//  */
	// let lastUpdateDateObject: Date = new Date('2021-01-01');
	// /**
	//  * This is previous date ( 1 year prior)
	//  */
	// let lastUpdatePreviousDateObject: Date = new Date('2021-01-01');
	// /**
	//  * This is the formatted version of the date object above ("2020-01-01")
	//  */
	// let lastUpdateDateFormatted: string = '2021-01-01';
	// let lastUpdatePreviousDateFormatted: string = '2020-01-01';
	// /**
	//  * Let's set the initial dates based on exactly when BTS has last updated its data...
	//  */
	// async function setDates() {
	// 	lastUpdateDateBts = await Helper.getLastDate();
	// 	lastUpdateDateObject = new Date(lastUpdateDateBts.year, lastUpdateDateBts.month - 1, 1);
	// 	lastUpdatePreviousDateObject = new Date(
	// 		lastUpdateDateBts.year - 1,
	// 		lastUpdateDateBts.month - 1,
	// 		1
	// 	);
	// 	lastUpdateDateFormatted = Helper.dateFormatGenerator(lastUpdateDateObject);
	// 	lastUpdatePreviousDateFormatted = Helper.dateFormatGenerator(lastUpdatePreviousDateObject);
	// 	// lastUpdatedTrade = H
	// }
	/*************************** END DATES GENERATION SECTION  ****************************/

	/*************************** TRADE VALUE SECTION  ****************************/


	/*************************** END TRADE VALUE SECTION  ****************************/

	/*************************** PORT SELECTION  ****************************/
	/**
	 * Handle port selection
	 * @param event
	 */
	function handleSelect(value: number[], label: string) {
		selectedPorts = value;
		dropperPortName = label;
		setPortNames(value);
	}
	/**
	 * This function takes the value of the bootstrap dropper (the array of port numbers), converts this array to an array of port names
	 * @param portArray The array of port numbers
	 */
	function setPortNames(portArray: number[]) {
		selectedPortNames = [];
		for (const portNum of portArray) {
			selectedPortNames = [
				...selectedPortNames,
				Object.keys(PORTS).find((key) => PORTS[key][0] === portNum)!
			];
		}
		/**
		 * If the ports are updated, these functions need to be called
		 */
		getBtsGroup(mergedObject);
		setLastUpdate();
	}
	/**
	 * Set last update on wait times column. Eg. 75 minutes - Last update: Today at 10:00 am.
	 * @param port port number relating to rss feed of cbp. Eg. San Ysidro port number is 250401
	 */
	async function setLastUpdate() {
		/**
		 * If passed port is 0, that means CaliBaja is being served. Default to San Ysidro Wait Times in that case
		 */
		let port = selectedPorts;
		if (port.length > 1) {
			/**
			 * If there's more than one port, set it to San Ysidro
			 */
			port = [250401];
			selectedWaitTimePortName = 'San Ysidro';
		}
		selectedWaitTimePortName = selectedPortNames[0];
		let waitTimeClass = new waitTimes(port[0]);

		try {
			let { returnObj } = await waitTimeClass.getCurrentWaitTimes();
			waitTimesObj = returnObj;
		} catch (error) {
			console.log("ERROR!");
			
		}

		
		
	}

	/*************************** END SELECTION  ****************************/
</script>

<div class="responsiveHeight">
	<Navbar class="h-100" color="dark" style="background-color: #C7203B !important;" dark expand="md">
		<NavbarBrand style="position: absolute; left: 5%;  transform: translateX(-20%);" href="/">
			<div class="bg-red">
				<img
					src="/images/smartbordercoalition-logo-white.png"
					class="d-inline-block "
					alt=""
					width="153.77"
					height="64"
				/>
			</div></NavbarBrand
		>
		<NavbarBrand style="position: absolute; left: 50%;  transform: translateX(-50%);" href="/">
			<h1>Cali-Baja Border Dashboard</h1></NavbarBrand
		>
		<NavbarToggler on:click={() => (isOpen = !isOpen)} />

		<Nav class="ms-auto d-none d-md-flex align-items-center pe-3" navbar>
			<NavItem>
				<NavLink href=""><h5 style="color: white;" class="my-0">Port Selected:</h5></NavLink>
			</NavItem>
			<NavItem>
				<Dropdown>
					<DropdownToggle nav style="color: white; font-size: 1.25rem" caret
						>{dropperPortName}</DropdownToggle
					>
					<DropdownMenu>
						{#each dropperPorts as port}
							<DropdownItem on:click={() => handleSelect(port.value, port.label)}
								>{port.label}</DropdownItem
							>
						{/each}
					</DropdownMenu>
				</Dropdown>
			</NavItem>
		</Nav>

		<Collapse {isOpen} navbar>
			<Nav navbar>
				<NavItem>
					<NavLink href=""><h5 style="color: white;" class="my-0">Port Selected:</h5></NavLink>
				</NavItem>
				<NavItem>
					<Dropdown>
						<DropdownToggle nav style="color: white; font-size: 1.25rem" caret
							>{dropperPortName}</DropdownToggle
						>
						<DropdownMenu>
							{#each dropperPorts as port}
								<DropdownItem on:click={() => handleSelect(port.value, port.label)}
									>{port.label}</DropdownItem
								>
							{/each}
						</DropdownMenu>
					</Dropdown>
				</NavItem>
			</Nav>
		</Collapse>
	</Navbar>
</div>
<div class="responsiveHeight d-none d-md-block">
	<Navbar
		class="h-100"
		color="secondary"
		dark
		expand="md"
		style="z-index: 99 !important; background-color:  !important;"
	>
		<NavbarBrand
			class="w-50"
			style="position: absolute; left: 50%;  transform: translateX(-50%);"
			href="/"
		>
			<div class="d-inline-flex justify-content-center w-100">
				<h5 class="my-0 me-2">Date Selector:</h5>
				<!-- <input class="w-50  h-50 text-center" style="border: none; " id="dateRange" /> -->
				<!-- <input class="" id="dateRange"> -->
				<input id="dateCalendarStart" class="me-2 m-0" on:click={() => openCalendar(true)} />
				to
				<input id="dateCalendarEnd" class="ms-2 m-0" on:click={() => openCalendar(false)} />

				<button
					class=" ms-2 btn "
					style="background-color: #10376f; color: white"
					on:click={() => submitCalendar()}>Submit</button
				>
				<!-- <Flatpickr {options} bind:value bind:formattedValue on:change={handleChange} name="date" /> -->
			</div>
		</NavbarBrand>
	</Navbar>
</div>
<div
	class="card mx-auto my-2"
	style="width: 18rem;background: rgb(0,242,96);
background: linear-gradient(90deg, rgba(0,242,96,1) 0%, rgba(5,117,230,1) 100%); border: none;"
/>
<!-- Crossing of goods, people, wait times-->
<div class="container mt-3" style="height: 100vh; overflow: visible;">
	<div class="row d-flex justify-content-start" style="height: 75vh; overflow: visible;">
		<!-- Crossing of goods-->
		<div class="col-lg-4">
			<div class="card" style="">
				<div class="card-header text-center bg-green ">
					<h2 class="text-white">Crossing of People</h2>
				</div>
				<div class="card my-2" style="border: none;">
					<div class="card-body p-0">
						<div class="d-inline-flex container-fluid justify-content-between">
							<div class="w-50">
								<h6 class="my-0">
									<b>{startDateLuxon.toFormat('LLL, yyyy')}</b> -
									{#if maxDateBTS}
										<b>{lastBTSDateLuxon.toFormat('LLL, yyyy')}</b>
									{:else}
										<b>{endDateLuxon.toFormat('LLL, yyyy')}</b>
									{/if}
									{#if maxDateBTS && btsLoaded}
										<i class="fa-solid fa-circle-info" id="maxDateBTS" />
										<Tooltip target={`maxDateBTS`} placement="right"
											>Range is limited to the maximum date in this dataset</Tooltip
										>
									{/if}
								</h6>
							</div>
							<div class="w-50">
								<h6 class="my-0 text-center">
									<div class="d-flex flex-column">
										Compared to

										<!-- <div class="d-inline-flex align-items-center text-end justify-content-between "> -->
										<p class="text-end">
											<b>{previousStartDateLuxon.toFormat('LLL, yyyy')}</b> -
											{#if maxDateBTS}
												<b>{lastBTSDateLuxon.minus({ years: 1 }).toFormat('LLL, yyyy')}</b>
											{:else}
												<b>{previousEndDateLuxon.toFormat('LLL, yyyy')}</b>
											{/if}
										</p>
										<!-- </div> -->
									</div>
								</h6>
							</div>
						</div>
					</div>
				</div>
				<div class="card my-2" style="border: none;">
					<div class="card-body">
						<div class="d-flex justify-content-between">
							<div class="d-flex flex-column">
								<h3>
									{#if !btsLoaded}
										<Moon size="60" color="#c7203b" unit="px" duration="1s" />
									{:else}
										{Helper.numberWithCommas(btsObject.Pedestrians.currentCount)}
									{/if}
								</h3>
								<p class="card-text">PEDESTRIANS</p>
							</div>
							{#if !btsLoaded}
								<Moon size="60" color="#c7203b" unit="px" duration="1s" />
							{:else}
								<div class="d-flex d-inline-flex align-items-center">
									<h4 class="p-0 m-0">
										{#if btsObject.Pedestrians.percentChange < 0}
											<i
												class="fa fa-angle-double-down float-right fa-xl "
												style="color: red;"
												aria-hidden="true"
											/>
											{btsObject.Pedestrians.percentChange}%
										{:else}
											<i
												class="fa fa-angle-double-up float-right fa-xl "
												style="color: green;"
												aria-hidden="true"
											/>
											{btsObject.Pedestrians.percentChange}%
										{/if}
									</h4>
								</div>
							{/if}
						</div>
					</div>
				</div>
				<div class="card my-2" style="border: none;">
					<div class="card-body">
						<div class="d-flex justify-content-between">
							<div class="d-flex flex-column">
								<h3>
									{#if !btsLoaded}
										<Moon size="60" color="#c7203b" unit="px" duration="1s" />
									{:else}
										{Helper.numberWithCommas(btsObject.Vehicles.currentCount)}
									{/if}
								</h3>
								<div class="d-flex d-inline-flex align-items-center">
									<p class="card-text py-0 pe-1 m-0">VEHICLES</p>
									<i class="fa-solid fa-circle-info" id={`Vehicles`} style="color: black" /><Tooltip
										target={`Vehicles`}
										placement="right"
										>Total Vehicles includes Personal Vehicles, Buses, and Trains crossed</Tooltip
									>
								</div>
							</div>
							{#if !btsLoaded}
								<Moon size="60" color="#c7203b" unit="px" duration="1s" />
							{:else}
								<div class="d-flex d-inline-flex align-items-center">
									<h4 class="p-0 m-0">
										{#if btsObject.Vehicles.percentChange < 0}
											<i
												class="fa fa-angle-double-down float-right fa-xl "
												style="color: red;"
												aria-hidden="true"
											/>
											{btsObject.Vehicles.percentChange}%
										{:else}
											<i
												class="fa fa-angle-double-up float-right fa-xl "
												style="color: green;"
												aria-hidden="true"
											/>
											{btsObject.Vehicles.percentChange}%
										{/if}
									</h4>
								</div>
							{/if}
						</div>
					</div>
				</div>
				<div class="card my-2" style="border: none;">
					<div class="card-body">
						<div class="d-flex justify-content-between">
							<div class="d-flex flex-column">
								<h3>
									{#if !btsLoaded}
										<Moon size="60" color="#c7203b" unit="px" duration="1s" />
									{:else}
										{Helper.numberWithCommas(btsObject.Passengers.currentCount)}
									{/if}
								</h3>
								<div class="d-flex d-inline-flex align-items-center">
									<p class="card-text py-0 pe-1 m-0">PASSENGERS</p>
									<i class="fa-solid fa-circle-info" id={`Passengers`} style="color: black" />
									<Tooltip target={`Passengers`} placement="right"
										>Total Passengers includes Passengers in Personal Vehicles, Buses, and Trains
										crossed</Tooltip
									>
								</div>
							</div>
							{#if !btsLoaded}
								<Moon size="60" color="#c7203b" unit="px" duration="1s" />
							{:else}
								<div class="d-flex d-inline-flex align-items-center m-0 p-0">
									<h4 class="p-0 m-0">
										{#if btsObject.Passengers.percentChange < 0}
											<i
												class="fa fa-angle-double-down float-right fa-xl "
												style="color: red;"
												aria-hidden="true"
											/>
											{btsObject.Passengers.percentChange}%
										{:else}
											<i
												class="fa fa-angle-double-up float-right fa-xl "
												style="color: green;"
												aria-hidden="true"
											/>
											{btsObject.Passengers.percentChange}%
										{/if}
									</h4>
								</div>
							{/if}
						</div>
					</div>
				</div>
				<div class="card-footer text-muted" style="font-size: 0.7rem;">
					https://data.bts.gov/Research-and-Statistics/Border-Crossing-Entry-Data/keg4-3bc2/data
				</div>
			</div>
		</div>
		<!-- Crossing of People-->
		<div class="col-lg-4">
			<div class="card" style="overflow: visible;">
				<div class="card-header text-center bg-blue ">
					<h2 class="text-white">Crossing of Goods</h2>
				</div>
				<div class="card my-2" style="border: none;">
					<div class="card-body p-0">
						<div class="d-inline-flex container-fluid justify-content-between">
							<div class="w-50">
								<h6 class="my-0">
									<b>{startDateLuxon.toFormat('LLL, yyyy')}</b> -
									{#if maxDateTrade}
										<b><i>{lastTradeDateLuxon.toFormat('LLL, yyyy')}</i></b>
									{:else}
										<b>{endDateLuxon.toFormat('LLL, yyyy')}</b>
									{/if}
									{#if maxDateTrade && btsLoaded}
										<i class="fa-solid fa-circle-info" id="maxDateTrade" />
										<Tooltip target={`maxDateTrade`} placement="right"
											>Range is limited to the maximum date in this dataset</Tooltip
										>
									{/if}
								</h6>
							</div>
							<div class="w-50">
								<h6 class="my-0 text-center">
									<div class="d-flex flex-column">
										Compared to

										<!-- <div class="d-inline-flex align-items-center text-end justify-content-between "> -->
										<p class="text-end">
											<b>{previousStartDateLuxon.toFormat('LLL, yyyy')}</b> -
											{#if maxDateTrade}
												<b>{lastTradeDateLuxon.minus({ years: 1 }).toFormat('LLL, yyyy')}</b>
											{:else}
												<b>{previousEndDateLuxon.toFormat('LLL, yyyy')}</b>
											{/if}
										</p>
										<!-- </div> -->
									</div>
								</h6>
							</div>
						</div>
					</div>
				</div>
				<!-- </div> -->
				<div class="card my-2" style="border: none;">
					<div class="card-body">
						<div class="d-flex justify-content-between">
							<div class="d-flex flex-column">
								<h3>
									{#if !btsLoaded}
										<Moon size="60" color="#c7203b" unit="px" duration="1s" />
									{:else}
										{Helper.numberWithCommas(btsObject.Trucks.currentCount)}
									{/if}
								</h3>
								<div class="d-flex d-inline-flex align-items-center">
									<p class="card-text py-0 pe-1 m-0">TRUCKS</p>
								</div>
							</div>
							{#if !btsLoaded}
								<Moon size="60" color="#c7203b" unit="px" duration="1s" />
							{:else}
								<div class="d-flex d-inline-flex align-items-center m-0 p-0">
									<h4 class="p-0 m-0">
										{#if btsObject.Trucks.percentChange < 0}
											<i
												class="fa fa-angle-double-down float-right fa-xl "
												style="color: red;"
												aria-hidden="true"
											/>
											{btsObject.Trucks.percentChange}%
										{:else}
											<i
												class="fa fa-angle-double-up float-right fa-xl "
												style="color: green;"
												aria-hidden="true"
											/>
											{btsObject.Trucks.percentChange}%
										{/if}
									</h4>
								</div>
							{/if}
						</div>
					</div>
				</div>
				<!-- <div class="card my-2" style="border: none;">
					<div class="card-body">
						<div class="d-flex justify-content-between">
							<div class="d-flex flex-column">
								<h3>
									{#if !btsLoaded}
										<Moon size="60" color="#c7203b" unit="px" duration="1s" />
									{:else}
										Undefined
									{/if}
								</h3>
								<div class="d-flex d-inline-flex align-items-center">
									<p class="card-text py-0 pe-1 m-0">TOTAL TRADE</p>
								</div>
							</div>
							{#if !btsLoaded}
								<Moon size="60" color="#c7203b" unit="px" duration="1s" />
							{:else}
								<div class="d-flex d-inline-flex align-items-center m-0 p-0">
									<h4 class="p-0 m-0">
										{#if totalTrade.percentChange < 0}
											<i
												class="fa fa-angle-double-down float-right fa-xl "
												style="color: red;"
												aria-hidden="true"
											/>
											{totalTrade.percentChange}%
										{:else}
											<i
												class="fa fa-angle-double-up float-right fa-xl "
												style="color: green;"
												aria-hidden="true"
											/>
											{totalTrade.percentChange}%
										{/if}
									</h4>
								</div>
							{/if}
						</div>
					</div>
				</div> -->
				<div class="card-footer text-muted" style="font-size: 0.7rem;">
					<div class="d-flex flex-column">
						<div class="p-2 bd-highlight">
							https://data.bts.gov/Research-and-Statistics/Border-Crossing-Entry-Data/keg4-3bc2/data
						</div>
						<div class="p-2 bd-highlight">https://data.bts.gov/resource/ku5b-t97n.json?</div>
					</div>
				</div>
			</div>
		</div>

		<!-- Wait Times -->
		<div class="col-lg-4" style="overflow: visible;">
			<div class="card" style="	 overflow: visible;">
				<div class="card-header text-center bg-purple ">
					<h2 class="text-white">Current Wait Times</h2>
				</div>
				<div class="card my-2" style="border: none;">
					<div class="card-body">
						<h5 class="card-title text-center">
							Last Updated: <b>{waitTimesObj.lastUpdateTime}</b>
						</h5>
					</div>
				</div>
				{#each waitTimesObj.found as laneFound}
					<div class="card my-2" style="border: none;">
						<div class="card-body">
							<div class="d-flex justify-content-between">
								<div class="d-flex flex-column">
									<h3>
										{laneFound.delay} minutes
									</h3>
									<div class="d-flex d-inline-flex align-items-center">
										<p class="card-text py-0 pe-1 m-0">
											{selectedWaitTimePortName}
											{laneFound.laneName}
										</p>
									</div>
								</div>
								<div class="d-flex d-inline-flex align-items-center m-0 p-0">
									<h6 class="p-0 m-0">
										{#if laneFound.percentChange < 0}
											<i
												class="fa fa-angle-double-down float-right fa-xl "
												style="color: green;"
												aria-hidden="true"
											/>
											{laneFound.percentChange}%
											<i
												class="fa-solid fa-circle-info"
												id={`${laneFound.laneName}_Tag`}
												style="color: black"
											/>
											<Tooltip target={`${laneFound.laneName}_Tag`} placement="right"
												>This percentage is calculated by comparing the current wait time to the
												average wait time for the {laneFound.laneName}
												lane on a {CurrentDate.weekdayLong}
												at {CurrentDate.toFormat('h:00 a')}</Tooltip
											>
										{:else}
											<i
												class="fa fa-angle-double-up float-right fa-xl "
												style="color: red;"
												aria-hidden="true"
											/>
											{laneFound.percentChange}%
											<i
												class="fa-solid fa-circle-info"
												id={`${laneFound.laneName}_Tag`}
												style="color: black"
											/>
											<Tooltip target={`${laneFound.laneName}_Tag`} placement="right"
												>This percentage is calculated by comparing the current wait time to the
												average wait time for the {laneFound.laneName}
												lane on a {CurrentDate.weekdayLong}
												at {CurrentDate.toFormat('h:00 a')}</Tooltip
											>
										{/if}
									</h6>
								</div>
							</div>
						</div>
					</div>
				{/each}
				{#each waitTimesObj.missing as laneMissing}
					<div class="card my-2" style="border: none;">
						<div class="card-body">
							<h3 class="card-title">Lane Closed</h3>
							<p class="card-text">
								{selectedWaitTimePortName}
								{laneMissing.laneName} Traffic Lane
							</p>
						</div>
					</div>
				{/each}
				<div class="card-footer text-muted" style="font-size: 0.7rem;">https://bwt.cbp.gov</div>
			</div>
		</div>
	</div>
</div>

<div class="navbar fixed-bottom bg-light text-center">
	<div class="container-fluid justify-content-center">
		<span class="text-muted">{CurrentDate.year}, Smart Border Coalition</span>
	</div>
</div>
<div class="responsiveHeight" />

<style>
	@import url('https://cdn.jsdelivr.net/npm/bootstrap@5.0.2/dist/css/bootstrap.min.css');
	@import url('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.1.1/css/all.min.css');
	@import url('https://fonts.googleapis.com/css2?family=Raleway:wght@400;700&display=swap');
	.bg-purple {
		background-color: #10376f;
	}
	.bg-green {
		background-color: #10376f;
	}
	.bg-blue {
		background-color: #10376f;
	}
	@media only screen and (min-width: 750px) {
		.responsiveHeight {
			height: 10vh !important;
			/* styles here */
		}
	}
	:global(body) {
		background-color: #f7fbfc !important;
		font-family: 'Raleway', sans-serif;
	}
</style>
