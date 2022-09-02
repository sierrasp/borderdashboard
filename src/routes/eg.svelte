<script lang="ts">
	import { lineChart } from '$lib/helpers/lineChart';
	import { onMount } from 'svelte';
	import { Helper } from '$lib/helpers/btsHelper';
	// import { Datepicker } from 'svelte-calendar';
	import waitTimes from '$lib/helpers/waitTimeHelper';
	import { easepick, RangePlugin, LockPlugin, AmpPlugin, PresetPlugin } from '@easepick/bundle';
	import { DateTime as EasePickDateTime } from '@easepick/bundle';
	import { DateTime } from 'luxon';

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
		{ value: 250301, label: 'Calexico East' },
		{value : 0, label : "Cali Baja"}
	];
	/**
	 * These are all of the crossing ports for California
	*/
	const CALIPORTS = ["Andrade", "Calexico", "Calexico East", "Otay Mesa", "San Ysidro", "Tecate", "Cross Border Xpress", "Otay Mesa"];
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

	/** I'm going to use the constants given above to create a default for the btsObject so the program doesn't throw an error on load*/

	let btsObject: { [key: string]: { currentCount: number; percentChange: number } } = {};
	for (const key in mergedObject) {
		btsObject[key] = {
			currentCount: 0,
			percentChange: 0
		};
	}
	$: btsObject;
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
	// OK THE NEXT SECTION WILL HAVE CONFUSING VARIABLE NAMES - IM SORRY 🗑️
	/**
	 * Selected Port Number - Default : San Ysidro
	 */
	let selectedPortNumber: number;
	/**
	 * Selected Port Name - Default : San Ysidro - This name works for the Wait Times section
	 */
	let selectedWaitTimePortName : string;
	/**
	 * Selected Port Names - This is the array of ports that the BTS section will take - Eg. ["San Ysidro"] or ["Tecate", "Otay Mesa"]
	 */
	let selectedPortNames : string[];
	/**
	 * Unlike the wait times selection which can't take an array because it needs to be a singular port, the dropper name area can take a merge name like "CaliBaja"
	 */
	let dropperPortName : string;
	// Let's make all of those variable names reactive and set them to defaults

	$: dropperPortName = "Cali Baja";
	$: selectedPortNumber = 250401;
	$: selectedWaitTimePortName = `San Ysidro`;
	$: selectedPortNames = CALIPORTS;
/**
 * Reactivity Section 
*/
	$: {
		if (pageLoaded) {
			setLastUpdate(selectedPortNumber);
			getBtsGroup(mergedObject);
			// console.log("EHHHELELELIOISHFJLHASDJLHSDJHL");
		}

	}

	/**
	 * Global starting date for number generation. Eg. "2020-01-01"
	 */
	let startDate: string;
	$: startDate = pastDateFormatted;
	$: console.log(startDateLuxon);
	$: startDateLuxon = DateTime.fromSQL(startDate);
	/**
	 * Global end date for number generation. Eg. "2021-01-01"
	 */
	let endDate: string;
	$: endDate = currentDateFormatted;
	$: endDateLuxon = DateTime.fromSQL(endDate);
	$: previousStartDateLuxon = DateTime.fromSQL(previousStartDate);
	$: previousEndDateLuxon = DateTime.fromSQL(previousEndDate)

	/**
	 * Updating previous dates based on changes in dates based on date selector
	 */
	$: {
		previousEndDate = Helper.calculatePreviousDate(endDate);
		previousStartDate = Helper.calculatePreviousDate(startDate);
		if (pageLoaded) {
			getBtsGroup(mergedObject);
					// If dropper port name is changed, the bts data needs an update
		dropperPortName, getBtsGroup(mergedObject);
		// if the selected wait time port has changed ( not the dropper name ) we need an update in the wait times
		selectedWaitTimePortName, setLastUpdate(selectedPortNumber);
		};
	};

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
			css: [
				'https://cdn.jsdelivr.net/npm/@easepick/bundle@1.2.0/dist/index.css',
				'https://easepick.com/css/customize_sample.css'
			],
			zIndex: 1000,
			PresetPlugin: {
				position: 'right'
			},
			plugins: [AmpPlugin, RangePlugin, LockPlugin, PresetPlugin],
			RangePlugin: {
				tooltip: true,
				startDate: new EasePickDateTime(PreviousDateObject),
				endDate: new EasePickDateTime(CurrentDateObject),
				delimiter: ' to '
			},
			format: 'MMM DD YYYY',
			setup(picker) {
				picker.on('select', (e) => {
					const startdate: Date = e.detail.start;
					const enddate: Date = e.detail.end;
					startDate = Helper.dateFormatGenerator(startdate);
					endDate = Helper.dateFormatGenerator(enddate);
					getBtsGroup(mergedObject);
				});
			}
		});
	}
	/**
	 * So this function takes in an object of whatever subgroups I want to calculate for - Eg. If I want to calculate for the pedestrians and a subset of measures called "Vehicles",
	 *
	 * @param obj I can pass in {"Pedestrians" : PEDESTRIANS, "Vehicles" : VEHICLES} for example
	 * @param portNames An array of all the port numbers I want to accumulate for - Eg. [250401, 250601, 250602] (Correlating to port names)
	 * @returns This updates the global btsObject variable with the count of each measure and the percent of change since the previous date calculated above
	 */
	async function getBtsGroup(obj: Record<string, string[]>) {
		/**
		 * This object will be sommething like -
		 * 	"Vehicles" : {currentCount : 100000, percentChange : 10%}
		 */
		let objectToBeReturned: { [key: string]: { currentCount: number; percentChange: number } } = {};
		for (const key in obj) {
			let currentCount = 0; 
			let previousCount = 0;
			console.log(selectedPortNames, "SELECTED PORT NAMES")
			for (const port of selectedPortNames) {
				let currentObj = await getCrossingsObject(obj[key], startDate, endDate, port);
			let previousObj = await getCrossingsObject(
				obj[key],
				previousStartDate,
				previousEndDate,
				port
			);
			currentCount += Object.values(currentObj).reduce((a, b) => a + b);
			previousCount += Object.values(previousObj).reduce((a, b) => a + b);
			}

			console.log(previousCount, "PREVIOUS COUNT")
			let percentChange = Helper.calculatePercentDifference(currentCount, previousCount);
			objectToBeReturned[key] = {
				currentCount: currentCount,
				percentChange: percentChange
			};
			if (isNaN(currentCount) || isNaN(percentChange)) {
				objectToBeReturned[key] = {
					currentCount: 0,
					percentChange: 0
				};
			}
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
	function handleSelect(value: number, label: string) {
		selectedPortNumber = value;
		selectedWaitTimePortName = label;
		selectedPortNames = [`${label}`];
		dropperPortName = label;
		if (label == "Cali Baja") {
			selectedPortNames = CALIPORTS;
			dropperPortName = "Cali Baja";
			selectedWaitTimePortName = "San Ysidro";
			selectedPortNumber = 250401;
		};
	}
	// function handleSelect(event: { detail: any }) {
	// 	console.log('selected item', event.detail);
	// 	selectedPortNumber = event.detail.value;
	// 	selectedWaitTimePortName = event.detail.label;
	// }
	/**
	 * Set last update on wait times column. Eg. 75 minutes - Last update: Today at 10:00 am.
	 * @param port port number relating to rss feed of cbp. Eg. San Ysidro port number is 250401
	 */
	async function setLastUpdate(port = 250401) {
		/**
		 * If passed port is 0, that means CaliBaja is being served. Default to San Ysidro Wait Times in that case
		*/
		if (port == 0) {
			port = 250401;
		};
		console.log(port, "PORTT");
		let waitTimeClass = new waitTimes(port);
		
		let { returnObj } = await waitTimeClass.getCurrentWaitTimes();
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
	let isOpen = false;
	function handleUpdate(event) {
		isOpen = event.detail.isOpen;
	}
</script>

<div class="responsiveHeight">
	<Navbar class="h-100" color="dark" style="background-color: #C7203B !important;" dark expand="md">
		<NavbarBrand style="position: absolute; left: 50%;  transform: translateX(-50%);" href="/">
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
						{#each PORTS as port}
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
							>{selectedWaitTimePortName}</DropdownToggle
						>
						<DropdownMenu>
							{#each PORTS as port}
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
	<Navbar class="h-100" color="secondary" dark expand="md" style="z-index: 99 !important; background-color: #2f5bbc !important;">
		<NavbarBrand
			class="w-50"
			style="position: absolute; left: 50%;  transform: translateX(-50%);"
			href="/"
		>
			<div class="d-inline-flex justify-content-center w-100">
				<h5 class="my-0 me-2">Date Selector:</h5>
				<input class="w-50  h-50 text-center" style="border: none; " id="dateRange" />
			</div>
		</NavbarBrand>
	</Navbar>
</div>
<div
	class="card mx-auto my-2"
	style="width: 18rem;background: rgb(0,242,96);
background: linear-gradient(90deg, rgba(0,242,96,1) 0%, rgba(5,117,230,1) 100%); border: none;"
>
	<!-- <div class="card-body text-center">
		<h5 class="card-title" style="color: white">Date Selector</h5>
		<h6 class="card-subtitle mb-2 text-muted">
			<input class="w-100 text-center" style="border: none; " id="dateRange" />
		</h6>
	</div> -->
</div>
<!-- Crossing of goods, people, wait times-->
<div class="container mt-3" style="height: 100vh; overflow: visible;">
	<div class="row d-flex justify-content-start" style="height: 75vh; overflow: visible;">
		<!-- Crossing of goods-->
		<div class="col-lg-4">
			<div class="card" style="">
				<div class="card-header text-center bg-green ">
					<h1 class="text-white">Crossing of People</h1>
				</div>
				<div class="card my-2"  style="border: none;">
					<div class="card-body p-0">
						<div class="d-inline-flex container-fluid justify-content-between">
							<div class="w-25">
								<h6 class="my-0">From {startDateLuxon.toFormat('LLL dd yyyy')} to {endDateLuxon.toFormat('LLL dd yyyy')}</h6>
							</div>
							<div class="w-25">
								<h6 class="my-0 text-end">Compared to {previousStartDateLuxon.toFormat('LLL dd yyyy')} to {previousEndDateLuxon.toFormat('LLL dd yyyy')}</h6>
							</div>

						</div>
					</div>
				</div>
				<div class="card my-2" style="border: none;">
					<div class="card-body">
						<h3 class="card-title">
							{Helper.numberWithCommas(btsObject.Pedestrians.currentCount)}
						</h3>
						<h5 class="text-end">
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
						</h5>
						<p class="card-text">PEDESTRIANS</p>
					</div>
				</div>
				<div class="card my-2" style="border: none;">
					<div class="card-body">
						<h3 class="card-title">
							{Helper.numberWithCommas(btsObject.Vehicles.currentCount)}
						</h3>
						<h5 class="text-end">
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
						</h5>
						<p class="card-text">
							VEHICLES <i
								class="fa-solid fa-circle-info"
								id={`Vehicles`}
								style="color: black"
							/>
						</p>

						<Tooltip target={`Vehicles`} placement="right"
							>Total Vehicles includes Personal Vehicles, Buses, and Trains crossed</Tooltip
						>
					</div>
				</div>
				<div class="card my-2" style="border: none;">
					<div class="card-body">
						<h3 class="card-title">
							{Helper.numberWithCommas(btsObject.Passengers.currentCount)} 
						</h3>
						<h5 class="text-end">
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
						</h5>
						<p class="card-text">
							PASSENGERS <i
								class="fa-solid fa-circle-info"
								id={`Passengers`}
								style="color: black"
							/>
						</p>

						<Tooltip target={`Passengers`} placement="right"
							>Total Passengers includes Passengers in Personal Vehicles, Buses, and Trains crossed</Tooltip
						>
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
					<h1 class="text-white">Crossing of Goods</h1>
				</div>
				<div class="card my-2" style="border: none;">
					<div class="card-body">
						<div class="d-inline-flex align-items-center">
							<div class="card-title mx-2 my-0">
								<h4 class="my-0">Dates Selected:</h4>
							</div>
							<h6 class="my-0">
								{startDateLuxon.toFormat('LLL dd yyyy')} to {endDateLuxon.toFormat('LLL dd yyyy')}
							</h6>
						</div>
					</div>
				</div>
				<div class="card my-2" style="border: none;">
					<div class="card-body">
						<h3 class="card-title">
							{Helper.numberWithCommas(btsObject.Trucks.currentCount)} 
						</h3>
						<h5 class="text-end">
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
						</h5>
						<p class="card-text">TRUCKS</p>
					</div>
				</div>
				<div class="card-footer text-muted" style="font-size: 0.7rem;">
					https://data.bts.gov/Research-and-Statistics/Border-Crossing-Entry-Data/keg4-3bc2/data
				</div>
			</div>
		</div>

		<!-- Wait Times -->
		<div class="col-lg-4" style="overflow: visible;">
			<div class="card" style="	 overflow: visible;">
				<div class="card-header text-center bg-purple ">
					<h1 class="text-white">Current Wait Times</h1>
				</div>
				<div class="card my-2" style="border: none;">
					<div class="card-body">
						<h5 class="card-title">Last Updated: {waitTimesObj.lastUpdateTime}</h5>

						<!-- <p class="card-text">With supporting text below as a natural lead-in to additional content.</p> -->
						<!-- <a href="#" class="btn btn-primary">Go somewhere</a> -->
					</div>
				</div>
				{#each waitTimesObj.found as laneFound}
					<div class="card my-2" style="border: none;">
						<div class="card-body">
							<h3 class="card-title">{laneFound.delay} minutes</h3>
							<h5 class="text-end">
								{#if laneFound.percentChange < 0}
									<i
										class="fa fa-angle-double-down float-right fa-xl "
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
										>This percentage is calculated by comparing the current wait time to the average
										wait time for the {laneFound.laneName}
										lane on a {CurrentDate.weekdayLong}
										at {CurrentDate.toFormat('h:00 a')}</Tooltip
									>
								{:else}
									<i
										class="fa fa-angle-double-up float-right fa-xl "
										style="color: green;"
										aria-hidden="true"
									/>
									{laneFound.percentChange}%
									<i
										class="fa-solid fa-circle-info "
										id={`${laneFound.laneName}_Tag`}
										style="color: black"
									/>
									<Tooltip
										style="z-index: 1000"
										target={`${laneFound.laneName}_Tag`}
										placement="right"
										>This percentage is calculated by comparing the current wait time to the average
										wait time for the {laneFound.laneName}
										lane on a {CurrentDate.weekdayLong}
										at {CurrentDate.toFormat('h:00 a')}</Tooltip
									>
								{/if}
							</h5>
							<p class="card-text">{selectedWaitTimePortName} {laneFound.laneName} Traffic Lane</p>
						</div>
					</div>
				{/each}
				{#each waitTimesObj.missing as laneMissing}
					<div class="card my-2" style="border: none;">
						<div class="card-body">
							<h3 class="card-title">Lane Closed</h3>
							<p class="card-text">{selectedWaitTimePortName} {laneMissing.laneName} Traffic Lane</p>
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
		<span class="text-muted">2022, Smart Border Coalition</span>
	</div>
</div>
<div class="responsiveHeight" />

<style>
	@import url('https://cdn.jsdelivr.net/npm/bootstrap@5.0.2/dist/css/bootstrap.min.css');
	@import url('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.1.1/css/all.min.css');
	@import url('https://fonts.googleapis.com/css2?family=Raleway&display=swap');
	.bg-purple {
		background: rgb(95, 114, 190);
	}
	.bg-green {
		background: rgb(99, 212, 113, 1);
	}
	.bg-blue {
		background: rgb(249, 72, 74, 1);
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
