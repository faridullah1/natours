const locations = JSON.parse(document.getElementById('map').dataset.locations);

mapboxgl.accessToken = 'pk.eyJ1IjoiZmFyaWR1bGxhaDEyMyIsImEiOiJja3prcjR0NXU0eXJ2Mm5waGM0M2RoMGcwIn0.DdE_WegVZ-UCoV8tiJq3Jg';
var map = new mapboxgl.Map({
	container: 'map',
	style: 'mapbox://styles/faridullah123/ckzkrlzun00ej14l9v1ueo5jc',
	// center: [73.0479, 33.6844],
	// zoom: 8
});

const bounds = new mapboxgl.LngLatBounds();

locations.forEach(loc => {
	// Create Marker
	const el = document.createElement('div');
	el.className = 'marker';

	// Add Marker
	new mapboxgl.Marker({
		element: el,
		anchor: 'bottom',
	}).setLngLat(loc.coordinates).addTo(map);

	// Popup
	new mapboxgl.Popup({
		offset: 30
	}).setLngLat(loc.coordinates)
		.setHTML(`<p>Day ${loc.day}: ${loc.description}</p>`)
		.addTo(map);
	
	bounds.extend(loc.coordinates);
});

map.fitBounds(bounds, {
	padding: {
		top: 200,
		bottom: 150,
		left: 100,
		right: 100
	}
});