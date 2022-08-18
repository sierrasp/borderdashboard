<script lang="ts">
	import { lineChart } from '$lib/helpers/lineChart';
	import { onMount } from 'svelte';
	import { Helper } from '$lib/helpers/btsHelper';
	// import { Datepicker } from 'svelte-calendar';
	import waitTimes from '$lib/helpers/waitTimeHelper';
	import {
		easepick,
		RangePlugin,
		LockPlugin,
		AmpPlugin,
		PresetPlugin,
		DateTime
	} from '@easepick/bundle';
	/**
	 * Svelte Strap doesn't work with svelte kit, so I had to use this workaround - npm i git+https://github.com/laxadev/sveltestrap.git
	 */
	import { Tooltip } from 'sveltestrap';
	import Select from 'svelte-select';

	/*************************** CONSTANTS AND GLOBAL VARIABLE DEFINING ****************************/
	/**
	 * Although I would love to stick with my capitalized constant naming convention, the npm package requires this naming
	 */
	const theme = {
		calendar: {
			width: '30vw',
			maxWidth: '100vw',
			legend: {
				height: '45px'
			},
			shadow: '0px 10px 26px rgba(0, 0, 0, 0.25)',
			colors: {
				text: {
					primary: '#333',
					highlight: '#fff'
				},
				background: {
					primary: '#fff',
					highlight: '#eb7400',
					hover: '#eee'
				},
				border: '#eee'
			},
			font: {
				regular: '1.5em',
				large: '10em'
			},
			grid: {
				disabledOpacity: '.35',
				outsiderOpacity: '.6'
			}
		}
	};

	const PORTS = [
		{ value: 250401, label: 'San Ysidro' },
		{ value: 250601, label: 'Otay Mesa' },
		{ value: 250301, label: 'Calexico East' }
	];
	const PASSENGERS = ['Personal Vehicle Passengers', 'Train Passengers', 'Bus Passengers'];
	const VEHICLES = ['Personal Vehicles', 'Buses', 'Trains'];
	const PEDESTRIANS = ['Pedestrians'];
	const TRUCKS = ['Trucks'];
	const mergedArray = {
		Pedestrians: PEDESTRIANS,
		Vehicles: VEHICLES,
		Passengers: PASSENGERS,
		Trucks: TRUCKS
	};

	/** I'm going to use the constants given above to create a default for the btsObject so the program doesn't throw an error on load*/

	let btsObject: { [key: string]: { currentCount: number; percentChange: number } } = {};
	for (const key in mergedArray) {
		btsObject[key] = {
			currentCount: 0,
			percentChange: 0
		};
	}
	$: btsObject;
	let waitTimesObj : { lastUpdateTime: string, found: { laneName : string, delay: number, average: number, percentChange: number }[], missing: { laneName : string, reason : string }[] } = {
		lastUpdateTime : "",
		found : [
			{laneName : "General", average : 0, delay : 0, percentChange : 0},
			{laneName : "Sentri", average : 0, delay : 0, percentChange : 0},
			{laneName : "Ready", average : 0, delay : 0, percentChange : 0}
		],
		missing : []
	};
	$: waitTimesObj;
	$: console.log(waitTimesObj);
	/**
	 * We want to do everything once the dom has loaded
	 */
	let pageLoaded = false;
	/**
	 * When data was last updated in database - Eg. "Today at 10:00pm"
	 */
	let lastUpdate: string;
	$: lastUpdate;
	/**
	 * General Lane Duration
	 */
	let lastUpdateDurationGeneral: number;
	/**
	 * General Lane Duration
	 */
	let lastUpdateDurationSentri: number;
	/**
	 * General Lane Duration
	 */
	let lastUpdateDurationReady: number;
	/**
	 * Selected Port Number - Default : San Ysidro
	 */
	let selectedPortNumber: number;
	/**
	 * Selected Port Name - Default : San Ysidro
	 */
	let selectedPortName: string;
	$: selectedPortNumber = 250401;
	$: selectedPortName = `San Ysidro`;
	/**
	 * If port number has changed.
	 */
	$: {
		if (pageLoaded) {
			setLastUpdate(selectedPortNumber);
			getBtsGroup(mergedArray);
			// console.log("EHHHELELELIOISHFJLHASDJLHSDJHL");
		}
	}

	/**
	 * Global starting date for number generation. Eg. "2020-01-01"
	 */
	let startDate: string;
	$: startDate = pastDateFormatted;
	/**
	 * Global end date for number generation. Eg. "2021-01-01"
	 */
	let endDate: string;
	$: endDate = currentDateFormatted;

	/**
	 * Updating previous dates based on changes in dates based on date selector
	 */
	$: {
		previousEndDate = Helper.calculatePreviousDate(endDate);
		previousStartDate = Helper.calculatePreviousDate(startDate);
		if (pageLoaded) {
			getBtsGroup(mergedArray);
		}
	}

	/**
	 * This is the global starting date subtracted a year, this is for the percent calculation
	 */
	let previousStartDate: string;
	// $: previousStartDate = "2020-01-01";

	/**
	 * This is the global ending date subtracted a year, this is for the percent calculation
	 */
	let previousEndDate: string;
	// $: previousEndDate = "2020-01-01";

	/**
	 * Dropdown Ports with Label and Port code as value
	 */
	const DropdownItems: { value: number; label: string }[] = PORTS;
	const DropdownDefault = { value: 250401, label: 'San Ysidro' };

	/*************************** ON MOUNT SECTION  ****************************/
	onMount(async () => {
		createDateRangePicker();
		pageLoaded = true;
	});
	/*************************** DATE SELECTOR ****************************/
	/**
	 * Create Date Range Picker using dom acccess. We're using current dates, so the calendar will be updated consistently
	 */
	function createDateRangePicker() {
		new easepick.create({
			element: document.getElementById('dateRange')!,
			css: ['https://cdn.jsdelivr.net/npm/@easepick/bundle@1.2.0/dist/index.css'],
			zIndex: 10,
			PresetPlugin: {
				position: 'right'
			},
			plugins: [AmpPlugin, RangePlugin, LockPlugin, PresetPlugin],
			RangePlugin: {
				tooltip: true,
				startDate: new DateTime(PreviousDateObject),
				endDate: new DateTime(CurrentDateObject),
				delimiter: '-'
			},
			format: 'DD MMM YYYY',
			setup(picker) {
				picker.on('select', (e) => {
					const startdate: Date = e.detail.start;
					const enddate: Date = e.detail.end;
					startDate = Helper.dateFormatGenerator(startdate);
					endDate = Helper.dateFormatGenerator(enddate);
				});
			}
		});
	}
	/**
	 * So this function takes in an object of whatever subgroups I want to calculate for - Eg. If I want to calculate for the pedestrians and a subset of measures called "Vehicles",
	 *
	 * @param obj I can pass in {"Pedestrians" : PEDESTRIANS, "Vehicles" : VEHICLES} for example
	 * @returns This updates the global btsObject variable with the count of each measure and the percent of change since the previous date calculated above
	 */
	async function getBtsGroup(obj: Record<string, string[]>) {
		/**
		 * This object will be sommething like -
		 * 	"Vehicles" : {currentCount : 100000, percentChange : 10%}
		 */
		let objectToBeReturned: { [key: string]: { currentCount: number; percentChange: number } } = {};
		for (const key in obj) {
			let currentObj = await getCrossingsObject(obj[key], startDate, endDate, selectedPortName);
			let previousObj = await getCrossingsObject(
				obj[key],
				previousStartDate,
				previousEndDate,
				selectedPortName
			);
			let currentCount = Object.values(currentObj).reduce((a, b) => a + b);
			let previousCount = Object.values(previousObj).reduce((a, b) => a + b);
			let percentChange = Helper.calculatePercentDifference(currentCount, previousCount);
			objectToBeReturned[key] = {
				currentCount: currentCount,
				percentChange: percentChange
			};
			console.log(objectToBeReturned);
		}
		btsObject = objectToBeReturned;
		// console.log(btsObject);
	}

	/*************************** DOM FUNCTIONS HANDLING BTS DATA ****************************/

	/**
	 
	 * @property Possible Measures - ["Pedestrians", "Trains", "Buses", "Personal Vehicle Passengers", "Personal Vehicles", "Trucks", "Train Passengers", "Bus Passengers"]
	 * @param measures - Input an array of measures for BTS -  Eg. ["Pedestrians", "Trains", etc]
	 * @param startDate  Date Format - "Year-Month-Day", Eg. "2019-01-01"
	 * @param endDate  Date Format - "Year-Month-Day", Eg. "2019-01-01"
	 * @param port_name Port of Entry, Eg. "San Ysidro"
	 * @returns Returns the sum of each measure for the given time period in an object based on the measures inputted, Eg. {"Pedestrians" : 20000, "Train Passengers" : 5, etc...}
	 */
	async function getCrossingsObject(
		measures: string[],
		startDate: string,
		endDate: string,
		port_name?: string
	) {
		let instance = new Helper(startDate, endDate, port_name);
		let calculatedCrossingsObject = await instance.calculateCrossings(measures);
		return calculatedCrossingsObject;
	}
	const CurrentDate = Helper.getCurrentDate();
	/**
	 * These dates are for the Svelte Calendar start and end generation
	 */
	const CurrentDateObject = new Date(CurrentDate.year, CurrentDate.month - 1, 1);
	/**
	 * These dates are for the Svelte Calendar start and end generation
	 */
	const PreviousDateObject = new Date(CurrentDate.year - 1, CurrentDate.month - 1, 1);
	// console.log(PreviousDateObject);

	/**
	 * This is the current date
	 */
	let currentDateFormatted = Helper.dateFormatGenerator(CurrentDateObject);
	/**
	 * This is the date a year ago relative to the current date
	 */
	let pastDateFormatted = Helper.dateFormatGenerator(PreviousDateObject);

	/*************************** PORT SELECTION  ****************************/
	/**
	 * Handle port selection
	 * @param event
	 */
	function handleSelect(event: { detail: any }) {
		console.log('selected item', event.detail);
		selectedPortNumber = event.detail.value;
		selectedPortName = event.detail.label;
	}
	/**
	 * Set last update on wait times column. Eg. 75 minutes - Last update: Today at 10:00 am.
	 * @param port port number relating to rss feed of cbp. Eg. San Ysidro port number is 250401
	 */
	async function setLastUpdate(port = 250401) {
		let waitTimeClass = new waitTimes(port);
		let {returnObj} = await waitTimeClass.getCurrentWaitTimes();
		waitTimesObj = returnObj;
	}
	/*************************** FETCHING POSTGRES DATA ****************************/
	async function fetchData() {
		const res = await fetch('./controller.json');
		const { rows } = await res.json();

		if (res.ok) {
			console.log(rows);
			return rows;
		} else {
			throw new Error(rows);
		}
	}
</script>

<nav class="navbar navbar-light bg-light">
	<div class="container">
		<!-- svelte-ignore a11y-invalid-attribute -->
		<a class="navbar-brand" href="#">
			<img
				src="/images/smartborder.png"
				width="30"
				height="30"
				class="d-inline-block align-top me-3"
				alt=""
			/>
			Smart Border Coalition
		</a>
		<button class="btn me-0 btn-primary"> Border Wait Time Graph </button>
	</div>
</nav>

<div class="container-fluid py-2" style="border: 1px solid black;">
	<div class="row align-items-center justify-content-center">
		<div class="col ">
			<div class="d-flex justify-content-center">
				<div class="w-50">
					<div class="d-inline-flex justify-content-center align-items-center">
						<h5 class="my-0 me-2">Port Selected:</h5>
						<Select items={DropdownItems} value={DropdownDefault} on:select={handleSelect} />
					</div>
					<!-- Select port: <Select {items} {value} on:select={handleSelect} /> -->
					<!-- Port Selected: <Select {items} {value} on:select={handleSelect}></Select> -->
				</div>
			</div>
		</div>
		<div class="col text-center">
			Dates Selected: <input class="" id="dateRange" />
		</div>
	</div>
</div>
<!-- Crossing of goods, people, wait times-->
<div class="container mt-3" style="height: 75vh; ">
	<div class="row d-flex justify-content-start" style="height: 75vh;">
		<!-- Crossing of goods-->
		<div class="col-lg-4" style="">
			<div class="card" style="height: 75vh;">
				<div class="card-header text-center bg-green">
					<h1 class="text-white">Crossing of People</h1>
				</div>
				<div class="card-body">
					<div class="container-fluid">
						<div class="row align-items-center">
							<div class="d-flex flex-column bd-highlight mb-3">
								<div class="p-2 bd-highlight">Vehicles Crossed:</div>
								<!-- <div class="p-2 bd-ate">Flex item 2</div> -->
								<div class="d-flex flex-row bd-highlight mb-3 align-items-center">
									<div class="p-2 bd-highlight">
										{btsObject.Vehicles.currentCount}
									</div>
									<div class="p-2 bd-highlight">
										<i
											class="fa fa-arrow-up float-right fa-2xl "
											style="color: green;"
											aria-hidden="true"
										/>
										{btsObject.Vehicles.percentChange}%
									</div>
									<!-- <div class="p-2 bd-highlight">Flex item 3</div> -->
								</div>
							</div>
							<!-- <div class="col">
								<h3 class="card-title text-bold pt-3 mb-0" />
								<h5 class="card-title pt-0">Pedestrians</h5>
							</div> -->
							<!-- <div class="col d-flex justify-content-end">
								<i
									class="fa fa-arrow-up float-right fa-2xl "
									style="color: green;"
									aria-hidden="true"
								/>
							</div> -->
						</div>
						<div class="d-flex flex-column bd-highlight mb-3">
							<div class="p-2 bd-highlight">Pedestrians Crossed:</div>
							<!-- <div class="p-2 bd-highlight">Flex item 2</div> -->
							<div class="d-flex flex-row bd-highlight mb-3 align-items-center">
								<div class="p-2 bd-highlight">
									{btsObject.Pedestrians.currentCount}
								</div>
								<div class="p-2 bd-highlight">
									<i
										class="fa fa-arrow-up float-right fa-2xl "
										style="color: green;"
										aria-hidden="true"
									/>
									{btsObject.Pedestrians.percentChange}%
								</div>
								<!-- <div class="p-2 bd-highlight">Flex item 3</div> -->
							</div>
						</div>
						<div class="d-flex flex-column bd-highlight mb-3">
							<div class="p-2 bd-highlight">Passengers</div>
							<!-- <div class="p-2 bd-highlight">Flex item 2</div> -->
							<div class="d-flex flex-row bd-highlight mb-3 align-items-center">
								<div class="p-2 bd-highlight">
									{btsObject.Passengers.currentCount}
								</div>
								<div class="p-2 bd-highlight">
									<i
										class="fa fa-arrow-up float-right fa-2xl "
										style="color: green;"
										aria-hidden="true"
									/>
									{btsObject.Passengers.percentChange}%
								</div>
								<!-- <div class="p-2 bd-highlight">Flex item 3</div> -->
							</div>
						</div>
					</div>

					<!-- svelte-ignore a11y-invalid-attribute -->
					<!-- <a href="" class="btn btn-primary">Go somewhere</a> -->
				</div>
				<div class="card-footer text-muted">https://bwt.cbp.gov/details</div>
			</div>
		</div>
		<!-- Crossing of People-->
		<div class="col-lg-4" style="">
			<div class="card" style="height: 75vh;">
				<div class="card-header text-center bg-blue">
					<h1 class="text-white">Crossing of Goods</h1>
				</div>
				<div class="card-body">
					<div class="container-fluid">
						<div class="row align-items-center">
							<div class="d-flex flex-column bd-highlight mb-3">
								<div class="d-flex flex-column bd-highlight mb-3">
									<div class="p-2 bd-highlight">Vehicles Crossed:</div>
									<!-- <div class="p-2 bd-ate">Flex item 2</div> -->
									<div class="d-flex flex-row bd-highlight mb-3 align-items-center">
										<div class="p-2 bd-highlight">
											{btsObject.Trucks.currentCount}
										</div>
										<div class="p-2 bd-highlight">
											<i
												class="fa fa-arrow-up float-right fa-2xl "
												style="color: green;"
												aria-hidden="true"
											/>
											{btsObject.Trucks.percentChange}%
										</div>
										<!-- <div class="p-2 bd-highlight">Flex item 3</div> -->
									</div>
								</div>
							</div>
							<div class="d-flex flex-column bd-highlight mb-3">
								<div class="p-2 bd-highlight">Pedestrians Crossed:</div>
								<!-- <div class="p-2 bd-highlight">Flex item 2</div> -->
								<div class="d-flex flex-row bd-highlight mb-3 align-items-center">
									<div class="p-2 bd-highlight">
										<!-- {#await getCrossingPeople()}
											...Loading
										{:then object}
											<h2>{object.Pedestrians}</h2>
										{:catch error}
											System error: {error.message}.
										{/await} -->
									</div>
									<div class="p-2 bd-highlight">
										<i
											class="fa fa-arrow-up float-right fa-2xl "
											style="color: green;"
											aria-hidden="true"
										/> 10%
									</div>
									<!-- <div class="p-2 bd-highlight">Flex item 3</div> -->
								</div>
							</div>

							<div class="d-flex flex-column bd-highlight mb-3">
								<div class="p-2 bd-highlight">Pedestrians Crossed:</div>
								<!-- <div class="p-2 bd-highlight">Flex item 2</div> -->
								<div class="d-flex flex-row bd-highlight mb-3 align-items-center">
									<div class="p-2 bd-highlight">
										<!-- {#await getCrossingPeople()}
											...Loading
										{:then object}
											<h2>{object.Pedestrians}</h2>
										{:catch error}
											System error: {error.message}.
										{/await} -->
									</div>
									<div class="p-2 bd-highlight">
										<i
											class="fa fa-arrow-up float-right fa-2xl "
											style="color: green;"
											aria-hidden="true"
										/> 10%
									</div>
									<!-- <div class="p-2 bd-highlight">Flex item 3</div> -->
								</div>
							</div>
						</div>
					</div>

					<!-- svelte-ignore a11y-invalid-attribute -->
					<!-- <a href="" class="btn btn-primary">Go somewhere</a> -->
				</div>
				<div class="card-footer text-muted">https://bwt.cbp.gov/details</div>
			</div>
		</div>
		<!-- Wait Times -->
		<div class="col-lg-4" style="">
			<div class="card">
				<div class="card-header text-center bg-purple ">
					<h1 class="text-white">Current Wait Times</h1>
					<i class="fa-solid fa-circle-info fa-xl" id="waitTimesAbout" style="color: white" />
					<Tooltip target={'waitTimesAbout'} placement="right"
						>The percent of the right signifies the average recorded wait time of all accumulated {CurrentDate.weekdayLong}'s
						at {CurrentDate.toFormat('hh:mm a')}</Tooltip
					>
				</div>
				<div class="card my-2">
					<div class="card-body">
						<h5 class="card-title">Last Updated: {waitTimesObj.lastUpdateTime}</h5>

						<!-- <p class="card-text">With supporting text below as a natural lead-in to additional content.</p> -->
						<!-- <a href="#" class="btn btn-primary">Go somewhere</a> -->
					</div>
				</div>
				{#each waitTimesObj.found as laneFound}
				<div class="card my-2">
					<div class="card-body">
						<h3 class="card-title">{laneFound.delay} minutes</h3>
						<h5 class="text-end">
							{#if laneFound.percentChange < 0}
								<i
									class="fa fa-arrow-down float-right fa-xl "
									style="color: red;"
									aria-hidden="true"
								/>
								{laneFound.percentChange}%
							{:else}
								<i
									class="fa fa-arrow-up float-right fa-xl "
									style="color: green;"
									aria-hidden="true"
								/>
								{laneFound.percentChange}%
							{/if}
						</h5>
						<p class="card-text">{selectedPortName} {laneFound.laneName} Traffic Lane</p>
					</div>
				</div>
				{/each}
				{#each waitTimesObj.missing as laneMissing}
				<div class="card my-2">
					<div class="card-body">
						<h3 class="card-title">Lane Closed</h3>
						<p class="card-text">{selectedPortName} {laneMissing.laneName} Traffic Lane</p>
					</div>
				</div>
				{/each}

				<!-- <div class="card-body">
					<h5 class="card-title" style="border: 1px solid black">
						Last Updated: {waitTimesObj.lastUpdateTime}
					</h5>
					<div class="container-fluid">
						<div class="row align-items-center">
							<div class="d-flex flex-column bd-highlight mb-3">
								<div class="p-2 bd-highlight">{selectedPortName} All Traffic Lane</div>
								<div class="d-flex flex-row bd-highlight mb-3 align-items-center">
									<div class="p-2 bd-highlight">
										<h1>{waitTimesObj.waitTimes.generalLane.delay} minutes</h1>
										A {waitTimesObj.waitTimes.generalLane.percentChange}% percent change from an
										average of {waitTimesObj.waitTimes.generalLane.average} minutes over 2022 Apr 1 to
										{CurrentDate.toFormat('yyyy LLL dd')}
									</div>
									<div class="p-2 bd-highlight">
										<i
											class="fa fa-arrow-up float-right fa-2xl "
											style="color: green;"
											aria-hidden="true"
										/> 10%
									</div>
									<div class="px-0 bd-highlight" />
								</div>
							</div>
							<div class="d-flex flex-column bd-highlight mb-3">
								<div class="p-2 bd-highlight">{selectedPortName} Sentri Lane</div>
								 <div class="p-2 bd-highlight">Flex item 2</div> 
								<div class="d-flex flex-row bd-highlight mb-3 align-items-center">
									<div class="p-2 bd-highlight">
										<h1>{waitTimesObj.waitTimes.sentriLane.delay} minutes</h1>
										A {waitTimesObj.waitTimes.sentriLane.percentChange}% percent change from an
										average of {waitTimesObj.waitTimes.sentriLane.average} minutes over 2022 Apr 1 to
										{CurrentDate.toFormat('yyyy LLL dd')}
									</div>
									<div class="p-2 bd-highlight">
										<i
											class="fa fa-arrow-up float-right fa-2xl "
											style="color: green;"
											aria-hidden="true"
										/> 10%
									</div>
									
								</div>
							</div>
							<div class="d-flex flex-column bd-highlight mb-3">
								<div class="p-2 bd-highlight">{selectedPortName} Ready Lane</div>
								<div class="d-flex flex-row bd-highlight mb-3 align-items-center">
									<div class="p-2 bd-highlight">
										<h1>{waitTimesObj.waitTimes.readyLane.delay} minutes</h1>
										A {waitTimesObj.waitTimes.sentriLane.percentChange}% percent change from an
										average of {waitTimesObj.waitTimes.sentriLane.average} minutes over 2022 Apr 1 to
										{CurrentDate.toFormat('yyyy LLL dd')}
									</div>
									<div class="p-2 bd-highlight">
										<i
											class="fa fa-arrow-up float-right fa-2xl "
											style="color: green;"
											aria-hidden="true"
										/> 10%
									</div>
								</div>
							</div>
						</div>
					</div>

				</div> -->
				<div class="card-footer text-muted">https://bwt.cbp.gov/details</div>
			</div>
		</div>
	</div>
</div>

<div class="navbar fixed-bottom bg-light text-center">
	<div class="container-fluid justify-content-center">
		<span class="text-muted">2022, Smart Border Coalition</span>
	</div>
</div>

<style>
	@import url('https://cdn.jsdelivr.net/npm/bootstrap@5.0.2/dist/css/bootstrap.min.css');
	@import url('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.1.1/css/all.min.css');
	.bg-purple {
		background-color: purple;
	}
	.bg-green {
		background-color: green;
	}
	.bg-blue {
		background-color: blue;
	}
</style>
