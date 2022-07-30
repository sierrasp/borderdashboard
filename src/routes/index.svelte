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
	
	let selectedPortNumber : number;
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
	const PASSENGERS = ['Personal Vehicle Passengers', 'Train Passengers', 'Bus Passengers'];
	const VEHICLES = ['Personal Vehicle', 'Buses', 'Trains'];

	/*************************** ON MOUNT SECTION  ****************************/
	onMount(async () => {
		createDateRangePicker();
		setLastUpdate(selectedPortNumber);
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

	async function getCrossingPeople() {
		let crossingsPeopleMeasures = PASSENGERS.concat(VEHICLES).concat(['Pedestrians']);
		return await getCrossingsObject(
			crossingsPeopleMeasures,
			pastDateFormatted,
			currentDateFormatted,
			'San Ysidro'
		);
	};
	
	function handleSelect(event: { detail: any }) {
		console.log('selected item', event.detail);
		selectedPortNumber = event.detail.value;
	};
	/**
	 * Set last update on wait times column. Eg. 75 minutes - Last update: Today at 10:00 am.
	 * @param port port number relating to rss feed of cbp. Eg. San Ysidro port number is 250401
	 */
	async function setLastUpdate (port = 250401) {
		let { updateTimes, waitTimesArray } = await Helper.getCurrentWaitTimes(port);
		lastUpdate = updateTimes[0];
		lastUpdateDuration = waitTimesArray[0];
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
	};
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

<div class="container-fluid " style="border: 1px solid red;">
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
					<div class="d-inline-flex p-2 bd-highlight">
						<!-- <div class="row text-center"> -->
						<div class="">
							<span>In</span>
							<!-- <Datepicker {theme} selected={previousDateObject} end={currentDateObject}/> -->
							<!-- <h4 class="p-2 fs-4">to</h4> -->
							<!-- {#await getPe	destrianValue()} -->
						</div>
						<div class="">
							<h4 class="p-2 fs-4">May, 2021</h4>
						</div>
						<div class="">
							<!-- <h4 class="p-2 fs-4">to</h4> -->
							<Datepicker {theme} selected={CurrentDateObject} />
						</div>
						<!-- </div> -->
					</div>
					<div class="container-fluid">
						<div class="row align-items-center">
							<div class="col">
								{#await getCrossingPeople()}
									...Loading
								{:then object}
									{object.Pedestrians}
								{:catch error}
									System error: {error.message}.
								{/await}
								<h3 class="card-title text-bold pt-3 mb-0" />
								<span class="card-title pt-0">Pedestrians</span>
							</div>
							<div class="col d-flex justify-content-end">
								<i
									class="fa fa-arrow-up float-right fa-2xl "
									style="color: green;"
									aria-hidden="true"
								/>
							</div>
						</div>
					</div>

					<!-- svelte-ignore a11y-invalid-attribute -->
					<a href="" class="btn btn-primary">Go somewhere</a>
				</div>
				<div class="card-footer text-muted">2 days ago</div>
			</div>
		</div>

		<div class="col-lg-4" style="">
			<div class="card" style="height: 75vh;">
				<div class="card-header text-center bg-blue">
					<h1 class="text-white">Crossing of People</h1>
				</div>
				<div class="card-body">
					<div class="d-inline-flex p-2 bd-highlight">
						<!-- <div class="row text-center"> -->
						<div class="">
							<span>In</span>
							<!-- <Datepicker {theme} selected={previousDateObject} end={currentDateObject}/> -->
							<!-- <h4 class="p-2 fs-4">to</h4> -->
							<!-- {#await getPe	destrianValue()} -->
						</div>
						<div class="">
							<h4 class="p-2 fs-4">May, 2021</h4>
						</div>
						<div class="">
							<!-- <h4 class="p-2 fs-4">to</h4> -->
							<Datepicker {theme} selected={CurrentDateObject} />
						</div>
						<!-- </div> -->
					</div>
					<div class="container-fluid">
						<div class="row align-items-center">
							<div class="col">
								{#await getCrossingPeople()}
									...Loading
								{:then object}
									{object.Pedestrians}
								{:catch error}
									System error: {error.message}.
								{/await}
								<h3 class="card-title text-bold pt-3 mb-0" />
								<span class="card-title pt-0">Pedestrians</span>
							</div>
							<div class="col d-flex justify-content-end">
								<i
									class="fa fa-arrow-up float-right fa-2xl "
									style="color: green;"
									aria-hidden="true"
								/>
							</div>
						</div>
					</div>

					<!-- svelte-ignore a11y-invalid-attribute -->
					<a href="" class="btn btn-primary">Go somewhere</a>
				</div>
				<div class="card-footer text-muted">2 days ago</div>
			</div>
		</div>
		<div class="col-lg-4" style="">
			<div class="card" style="height: 75vh;">
				<div class="card-header text-center bg-purple">
					<h1 class="text-white">Wait Times</h1>
					<h4 class="text-white">{lastUpdateDuration} minutes - Last update: {lastUpdate}</h4>
				</div>
				<div class="card-body">
					<div class="d-inline-flex p-2 bd-highlight">
						<!-- <div class="row text-center"> -->
						<div class="">
							<span>In</span>
							<!-- <Datepicker {theme} selected={previousDateObject} end={currentDateObject}/> -->
							<!-- <h4 class="p-2 fs-4">to</h4> -->
							<!-- {#await getPe	destrianValue()} -->
						</div>
						<div class="">
							<h4 class="p-2 fs-4">May, 2021</h4>
						</div>
						<div class="">
							<!-- <h4 class="p-2 fs-4">to</h4> -->
							<Datepicker {theme} selected={CurrentDateObject} />
						</div>
						<!-- </div> -->
					</div>
					<div class="container-fluid">
						<div class="row align-items-center">
							<div class="col">
								{#await getCrossingPeople()}
									...Loading
								{:then object}
									{object.Pedestrians}
								{:catch error}
									System error: {error.message}.
								{/await}
								<h3 class="card-title text-bold pt-3 mb-0" />
								<span class="card-title pt-0">Pedestrians</span>
							</div>
							<div class="col d-flex justify-content-end">
								<i
									class="fa fa-arrow-up float-right fa-2xl "
									style="color: green;"
									aria-hidden="true"
								/>
							</div>
						</div>
					</div>

					<!-- svelte-ignore a11y-invalid-attribute -->
					<a href="" class="btn btn-primary">Go somewhere</a>
				</div>
				<div class="card-footer text-muted">2 days ago</div>
			</div>
		</div>
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
