<script lang="ts">
	import { lineChart } from '$lib/helpers/lineChart';
	import { onMount } from 'svelte';
	import { Helper } from '$lib/helpers/btsHelper';
	import { Datepicker } from 'svelte-calendar';
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
	import { ButtonDropdown, DropdownItem, DropdownMenu, DropdownToggle } from 'sveltestrap';
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
		{ value: 250302, label: 'Calexico West' }
]
	const PASSENGERS = ['Personal Vehicle Passengers', 'Train Passengers', 'Bus Passengers'];
	const VEHICLES = ['Personal Vehicle', 'Buses', 'Trains'];
	/**
	 * This is the last update string for the general lane - Formatted. Eg. Today at 10:00 am.
	 */


	let lastUpdate: string;
	$: lastUpdate;
	/**
	 * General Lane Duration
	 */
	let lastUpdateDuration: number;
	$: lastUpdateDuration;

	let selectedPortNumber: number;
	$: selectedPortNumber = 250401;
	$: {
		console.log(selectedPortNumber);
		setLastUpdate(selectedPortNumber);
	}
	/**
	 * Dropdown Ports with Label and Port code as value
	 */
	const DropdownItems: { value: number; label: string }[] = [
		{ value: 250401, label: 'San Ysidro' },
		{ value: 250601, label: 'Otay Mesa' },
		{ value: 250301, label: 'Calexico East' },
		{ value: 250302, label: 'Calexico West' }
	];
	const DropdownDefault = { value: 250401, label: 'San Ysidro' };

	/*************************** ON MOUNT SECTION  ****************************/
	onMount(async () => {
		createDateRangePicker();
		// setLastUpdate(selectedPortNumber);
	});

	/*************************** DOM FUNCTIONS HANDLING BTS DATA ****************************/

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
					var startdate = e.detail.start;
					var enddate = e.detail.end;
					console.log(startdate);
					console.log(enddate);
				});
			}
		});
	}
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
	console.log(PreviousDateObject);
	/**
	 * This is the current date
	 */
	let currentDateFormatted = Helper.dateFormatGenerator(
		CurrentDate.year,
		CurrentDate.month,
		CurrentDate.day
	);
	/**
	 * This is the date a year ago relative to the current date
	 */
	let pastDateFormatted = Helper.dateFormatGenerator(
		CurrentDate.year - 1,
		CurrentDate.month,
		CurrentDate.day
	);
	/**
	 * Get Crossings of People for San Ysidro port (Will update)
	 */
	async function getCrossingPeople() {
		let crossingsPeopleMeasures = PASSENGERS.concat(VEHICLES).concat(['Pedestrians']);
		return await getCrossingsObject(
			crossingsPeopleMeasures,
			pastDateFormatted,
			currentDateFormatted,
			'San Ysidro'
		);
	}
	/**
	 * Handle port selection
	 * @param event
	 */
	function handleSelect(event: { detail: any }) {
		console.log('selected item', event.detail);
		selectedPortNumber = event.detail.value;
	}
	/**
	 * Set last update on wait times column. Eg. 75 minutes - Last update: Today at 10:00 am.
	 * @param port port number relating to rss feed of cbp. Eg. San Ysidro port number is 250401
	 */
	async function setLastUpdate(port = 250401) {
		let { lastUpdateTime, lastDelaySeconds } = await Helper.getCurrentWaitTimes(port, 0);
		lastUpdate = lastUpdateTime;
		lastUpdateDuration = Math.round(lastDelaySeconds / 60);
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
		<div class="col-lg-4" style="">
			<div class="card" style="height: 75vh;">
				<div class="card-header text-center bg-green">
					<h1 class="text-white">Crossing of Goods</h1>
				</div>
				<div class="card-body">
					<div class="container-fluid">
						<div class="row align-items-center">
							<div class="d-flex flex-column bd-highlight mb-3">
								<div class="p-2 bd-highlight">Pedestrians Crossed:</div>
								<!-- <div class="p-2 bd-highlight">Flex item 2</div> -->
								<div class="d-flex flex-row bd-highlight mb-3 align-items-center">
									<div class="p-2 bd-highlight">
										{#await getCrossingPeople()}
											...Loading
										{:then object}
											<h2>{object.Pedestrians}</h2>
										{:catch error}
											System error: {error.message}.
										{/await}
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
									{#await getCrossingPeople()}
										...Loading
									{:then object}
										<h2>{object.Pedestrians}</h2>
									{:catch error}
										System error: {error.message}.
									{/await}
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
										{#await getCrossingPeople()}
											...Loading
										{:then object}
											<h2>{object.Pedestrians}</h2>
										{:catch error}
											System error: {error.message}.
										{/await}
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

					<!-- svelte-ignore a11y-invalid-attribute -->
					<!-- <a href="" class="btn btn-primary">Go somewhere</a> -->
				</div>
				<div class="card-footer text-muted">https://bwt.cbp.gov/details</div>
			</div>

		</div>
		<div class="col-lg-4" style="">
			<div class="card" style="height: 75vh;">
				<div class="card-header text-center bg-blue">
					<h1 class="text-white">Crossing of People</h1>
				</div>
				<div class="card-body">
					<div class="container-fluid">
						<div class="row align-items-center">
							<div class="d-flex flex-column bd-highlight mb-3">
								<div class="p-2 bd-highlight">Pedestrians Crossed:</div>
								<!-- <div class="p-2 bd-highlight">Flex item 2</div> -->
								<div class="d-flex flex-row bd-highlight mb-3 align-items-center">
									<div class="p-2 bd-highlight">
										{#await getCrossingPeople()}
											...Loading
										{:then object}
											<h2>{object.Pedestrians}</h2>
										{:catch error}
											System error: {error.message}.
										{/await}
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
										{#await getCrossingPeople()}
											...Loading
										{:then object}
											<h2>{object.Pedestrians}</h2>
										{:catch error}
											System error: {error.message}.
										{/await}
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
										{#await getCrossingPeople()}
											...Loading
										{:then object}
											<h2>{object.Pedestrians}</h2>
										{:catch error}
											System error: {error.message}.
										{/await}
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
					</div>

					<!-- svelte-ignore a11y-invalid-attribute -->
					<!-- <a href="" class="btn btn-primary">Go somewhere</a> -->
				</div>
				<div class="card-footer text-muted">https://bwt.cbp.gov/details</div>
			</div>
		</div>
		<div class="col-lg-4" style="">
			<div class="card" style="height: 75vh;">
				<div class="card-header text-center bg-purple">
					<h2 class="text-white">Current Wait Times - {lastUpdate}</h2>
				</div>
				<div class="card-body">
					<div class="container-fluid">
						<div class="row align-items-center">
							<div class="d-flex flex-column bd-highlight mb-3">
								<!-- <div class=" bd-highlight"><h3>{lastUpdateDuration} minutes</h3> </div> -->
								<div class=" bd-highlight">
									<div class="d-flex flex-row bd-highlight  align-items-center">
										<h3 class="w-100">{lastUpdateDuration} minutes</h3>
										<div class=" bd-highligh pt-3 mt-3">
											<i class="fa fa-arrow-up fa-2xl " style="color: green;" aria-hidden="true" /> 10%
										</div>
		
										<!-- <div class="p-2 bd-highlight">Flex item 3</div> -->
									</div>
									<div class=" bd-highlight"><h5>San Ysidro All</h5></div>
								</div>
							</div>
						</div>
						<div class="row align-items-center">
							<div class="d-flex flex-column bd-highlight mb-3">
								<!-- <div class=" bd-highlight"><h3>{lastUpdateDuration} minutes</h3> </div> -->
								<div class=" bd-highlight">
									<div class="d-flex flex-row bd-highlight  align-items-center">
										<h3 class="w-100">50 minutes</h3>
										<div class=" bd-highligh pt-3 mt-3">
											<i class="fa fa-arrow-up fa-2xl " style="color: green;" aria-hidden="true" /> 10%
										</div>
		
										<!-- <div class="p-2 bd-highlight">Flex item 3</div> -->
									</div>
									<div class=" bd-highlight"><h5>San Ysidro Ready</h5></div>
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
					</div>

					<!-- svelte-ignore a11y-invalid-attribute -->
					<!-- <a href="" class="btn btn-primary">Go somewhere</a> -->
				</div>
				<div class="card-footer text-muted">https://bwt.cbp.gov/details</div>
			</div>
		</div>

		<!-- </div> -->
		<!-- <div class="col container-md">
			<div class="card text-center" style="height: 75vh;">
				<div class="card-header bg-success  ">
					<h1 class="text-center text-white">Crossings of Goods</h1>
				</div>
				<div class="card-body">
					npm i -D svelte-calendar
					<h5 class="card-title">Special title treatment</h5>
					<p class="card-text ">
						With supporting text below as a natural lead-in to additional content.
					</p>
					<a href="#" class="btn btn-primary">Go somewhere</a>
				</div>
				<div class="card-footer text-muted">2 days ago</div>
			</div>
		</div>
		<div class="col container-md">
			<div class="card text-center" style="height: 75vh;">
				<div class="card-header bg-dark"><h1 class="text-white">Wait Times</h1></div>
				<div class="card-body">
					<h5 class="card-title">Special title treatment</h5>
					<p class="card-text">
						With supporting text below as a natural lead-in to additional content.
					</p>
					<a href="#" class="btn btn-primary">Go somewhere</a>
				</div>
				<div class="card-footer text-muted">2 days ago</div>
			</div>
		</div> -->
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
