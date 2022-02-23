import axios from 'axios';

export const login = async (email, password) => {
	axios.defaults.withCredentials = true

	try {
		const res = await axios({
			method: 'POST',
			url: '/api/v1/users/login',
			withCredentials: true,  // Don't forget to specify this if you need cookies
			credentials: 'include',
			data: {
				email,
				password
			},
		});

		if (res.data.status === 'success') {
			alert('Successfully logged in');
			setTimeout(() => {
				location.assign('/');
			}, 1500);
		}
	
		console.log(res.data);

	} catch(err) {
		alert(err.response.data.message);
	}
};