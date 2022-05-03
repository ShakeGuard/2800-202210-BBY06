const changeResponseText = (response) => {
	const text = document.getElementById("responseText")
	text.innerText = response.msg;
	text.classList.add(response.status);
	if (response.status === "success") {
		text.classList.remove("fail")
	} else {
		text.classList.remove("success");
	}
}

const setupEventListeners = () => {
	document.getElementById("createButton").addEventListener("click", e => {
		e.preventDefault();
		fetch('/create-person', {
			method: "POST",
			headers: {
				'Content-Type' : 'application/json'
			},
			body: JSON.stringify({
				name: document.getElementById("createName").value,
				email: document.getElementById("createEmail").value,
			})
		})
			.then(response => response.json())
			.then(jsonData => {
				changeResponseText(jsonData);
				getPeople();
			})
	})

	document.getElementById("updateButton").addEventListener("click", e => {
		e.preventDefault();
		fetch('/change-name', {
			method: "POST",
			headers: {
				'Content-Type' : 'application/json'
			},
			body: JSON.stringify({
				name: document.getElementById("updateName").value,
				email: document.getElementById("updateEmail").value,
			})
		})
			.then(response => response.json())
			.then(jsonData => {
				changeResponseText(jsonData);
				getPeople();
			})
	})

	document.getElementById("deleteButton").addEventListener("click", e => {
		e.preventDefault();
		fetch('/delete-person', {
			method: "POST",
			headers: {
				'Content-Type' : 'application/json'
			},
			body: JSON.stringify({
				name: document.getElementById("deleteName").value,
				email: document.getElementById("deleteEmail").value,
			})
		})
			.then(response => response.json())
			.then(jsonData => {
				changeResponseText(jsonData);
				getPeople();
			})
	})
}

const getPeople = () => {
	fetch('/people')
		.then(response => response.json())
		.then(data => {
			console.log(data);
			const container = document.getElementById("container");
			while (container.firstChild) {
				container.removeChild(container.firstChild);
			}
			data.forEach(element => {
				const h2 = document.createElement("h2");
				h2.innerText = element;
				container.appendChild(h2);
			});
		})
}

setupEventListeners();
getPeople();