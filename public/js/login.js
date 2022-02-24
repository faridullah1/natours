import axios from 'axios';
import { showAlert } from './alert';

export const login = async (email, password) => {
	axios.defaults.withCredentials = true

	try {
		const res = await axios({
			method: 'POST',
			url: '/api/v1/users/login',
			withCredentials: true,  // Don't forget to specify this if you need cookies
			data: {
				email,
				password
			},
		});

		if(res['data'].status === 'success') {
			showAlert('success', 'Successfully logged in');
			setTimeout(() => {
				location.assign('/');
			}, 1500);
		}
	} catch(err) {
		showAlert('error', err['response'].data.message);
	}
};