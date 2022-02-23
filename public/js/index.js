import '@babel/polyfill';
import { login } from './login';
import { displayMap } from './mapBox';

// DOM Elements
const loginFormElem = document.querySelector('.form');
const mapElem = document.getElementById('map');

// Delegation
if (mapElem) {
	const locations = JSON.parse(mapElem.dataset.locations);
	displayMap(locations);
}

if (loginFormElem) {
	loginFormElem.addEventListener('submit', e => {
		e.preventDefault();
	
		const email = document.getElementById('email').value;
		const password = document.getElementById('password').value;
	
		login(email, password)
	});
}