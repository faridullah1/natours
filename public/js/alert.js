export const hideAlert = () => {
	const alertElem = document.querySelector('.alert');
	if (alertElem) document.parentElement.removeChild(alertElem);
}

export const showAlert = (type, msg) => {
	hideAlert();

	const markup = `<div class="alert alert--${type}">${msg}</div>`;
	document.querySelector('body').insertAdjacentHTML('afterbegin', markup);

	// hide all alerts after 5 seconds;
	setTimeout(() => {
		hideAlert();
	}, 5000);
}