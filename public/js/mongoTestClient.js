fetch('/people')
	.then(response => response.json())
	.then(data => {
		console.log(data);
		const container = document.getElementById("container");
		data.forEach(element => {
			const h2 = document.createElement("h2");
			h2.innerText = element;
			container.appendChild(h2);
		});
	})