<script lang="ts">
	import { lineChart } from '$lib/helpers/lineChart';
	import { onMount } from 'svelte';
	import { Helper } from '$lib/helpers/btsHelper';
	import { Datepicker } from 'svelte-calendar';
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
	const PASSENGERS = ['Personal Vehicle Passengers', 'Train Passengers', 'Bus Passengers'];
	const VEHICLES = ['Personal Vehicle', 'Buses', 'Trains'];
	onMount(async () => {
		console.log(
			await getCrossingsObject(PASSENGERS, pastDateFormatted, currentDateFormatted, 'San Ysidro')
		);
		new lineChart('chartItem');
	});
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
	const currentDate = Helper.getCurrentDate();
	/**
	 * This is the current date
	 */
	let currentDateFormatted = Helper.dateFormatGenerator(
		currentDate.year,
		currentDate.month,
		currentDate.day
	);
	/**
	 * This is the date a year ago relative to the current date
	 */
	let pastDateFormatted = Helper.dateFormatGenerator(
		currentDate.year - 1,
		currentDate.month,
		currentDate.day
	);

	let calendarDates = {
		crossingPeopleStart : pastDateFormatted,
		crossingPeopleEnd : currentDateFormatted,
		crossingGoodStart : pastDateFormatted,
		crossingGoodEnd : currentDateFormatted
	}
	
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
<div class="container mt-3" style="height: 75vh; ">
	<div class="row" style="height: 75vh;">
		<div class="col container-md">
			<div class="card text-center" style="height: 75vh;">
				<div class="card-header bg-primary">
					<h1 class="text-white">Crossings of People</h1>
				</div>
				<div class="card-body">
					<div class="d-inline-flex justify-items-center align-items-center">
						<Datepicker {theme} />

						<h4 class="p-2">to</h4>

						<Datepicker start={calendarDates.crossingPeopleStart} {theme} />
					</div>

					<h5 class="card-title">Special title treatment</h5>
					<p class="card-text">
						With supporting text below as a natural lead-in to additional content.
					</p>
					<a href="#" class="btn btn-primary">Go somewhere</a>
				</div>
				<div class="card-footer text-muted">2 days ago</div>
			</div>
		</div>
		<div class="col container-md">
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
</style>
