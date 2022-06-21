<script>
	async function fetchData() {
		const res = await fetch('./data.json');
		const { rows } = await res.json();

		if (res.ok) {
			console.log(rows);
			return rows;
		} else {
			throw new Error(rows);
		}
	}
</script>

<div class="w3-top">
	<div class="w3-bar w3-white w3-card" id="myNavbar">
		<a href="#home" class="w3-bar-item w3-button w3-wide">BD</a>
		<!-- Right-sided navbar links -->
		<div class="w3-right w3-hide-small">
			<a href="#about" class="w3-bar-item w3-button">ABOUT</a>
			<a href="#team" class="w3-bar-item w3-button"><i class="fa fa-user" /> TEAM</a>
			<a href="#work" class="w3-bar-item w3-button"><i class="fa fa-th" /> WORK</a>
			<a href="#pricing" class="w3-bar-item w3-button"><i class="fa fa-usd" /> PRICING</a>
			<a href="#contact" class="w3-bar-item w3-button"><i class="fa fa-envelope" /> CONTACT</a>
		</div>
		<!-- Hide right-floated links on small screens and replace them with a menu icon -->
	</div>
</div>

<header class="bgimg-1 w3-display-container w3-grayscale-min" id="home">
	<div class="w3-display-left w3-text-white" style="padding:48px">
		<span class="w3-jumbo w3-hide-small">The Border Dashboard</span><br />
		<span class="w3-xxlarge w3-hide-large w3-hide-medium">Let's test something</span><br />
		<span class="w3-large">Let's test something.</span>
		<p>
			<a
				href="#about"
				class="w3-button w3-white w3-padding-large w3-large w3-margin-top w3-opacity w3-hover-opacity-off"
				>Test</a
			>
		</p>
		{#await fetchData()}
			<p>loading</p>
		{:then items}
			{#each items as item}
				<h3>
					Wait time ID: {item.wait_id} + Delay Seconds {item.delay_seconds} + Date {item.date}
				</h3>
			{/each}
		{:catch error}
			<p style="color: red">{error.message}</p>
		{/await}
	</div>
	<div class="w3-display-bottomleft w3-text-grey w3-large" style="padding:24px 48px">
		<i class="fa fa-facebook-official w3-hover-opacity" />
		<i class="fa fa-instagram w3-hover-opacity" />
		<i class="fa fa-snapchat w3-hover-opacity" />
		<i class="fa fa-pinterest-p w3-hover-opacity" />
		<i class="fa fa-twitter w3-hover-opacity" />
		<i class="fa fa-linkedin w3-hover-opacity" />
	</div>
</header>

<style>
	@import url('https://www.w3schools.com/w3css/4/w3.css');
	@import url('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css');
	.bgimg-1 {
		background-position: center;
		background-size: cover;
		background-image: url('https://media.cntraveler.com/photos/612664f0793b47b6bd201b7f/16:9/w_4368,h_2457,c_limit/The%20New%20Baja%20Road%20Trip_the%20tiny%20Isla%20San%20Francisco%20in%20the%20Sea%20of%20Cortez_Credit%20Ilan%20Rabchinskey_01_IslaSanFrancisco_SouthernBaja_IlanRabchinskey_MG_4647.jpg');
		min-height: 100vh;
	}
</style>
