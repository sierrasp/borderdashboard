<script lang="ts">
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

<div class="jumbotron jumbotron-fluid vertical-center">
	<div class="container my-auto">
		<div class="d-flex flex-row ms-5">
			<div>
				<h1 class="display-4">Smart Border Dashboard</h1>
				<p>The</p>
			</div>
			
		  </div>
		  		<div class="d-flex flex-row-reverse justify-content-around">
			<div>
				<a class="btn btn-primary" href="#" role="button">Link</a>
			</div>
			
		  </div>
	</div>

  </div>
<style>
	@import url("/static/app.css");
	@import url("https://cdn.jsdelivr.net/npm/bootstrap@5.0.2/dist/css/bootstrap.min.css");
	.jumbotron {
  color: white;
  background-image: url("https://www.tripsavvy.com/thmb/19fDMX7_4rJfsohIVeneDCp_Fjk=/2119x1415/filters:fill(auto,1)/Baja-California-Mexico-574c84565f9b5851655ac79c.jpg");
  background-position: center;
  background-repeat: no-repeat;
  background-size: cover;
  height: 100vh;
	}
	.vertical-center {
  min-height: 100%;  /* Fallback for browsers do NOT support vh unit */
  min-height: 100vh; /* These two lines are counted as one :-)       */

  display: flex;
  align-items: center;
}

</style>
