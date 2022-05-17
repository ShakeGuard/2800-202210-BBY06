"use strict";

const UpdateButton = document.getElementById("Update-Button");
const FullNameInput = document.getElementById("FullName");
const EmailInput = document.getElementById("Email");
const PasswordInput = document.getElementById("Password");
const AvatarInput = document.getElementById("Upload-Avatar");
const Pen1 = document.getElementById("Pen-1");
const Pen2 = document.getElementById("Pen-2");
const Pen3 = document.getElementById("Pen-3");
const UserFeedbackFile = document.getElementById("Upload-Avatar-FileName");
const EditProfile = document.querySelector("#Expand-Profile-Form");
const CancelProfileChanges = document.querySelector("#Cancel-Profile-Form");
const hiddenElements = document.querySelectorAll('.toggle');

const createKitButton = document.querySelector('#create-kit-button');
const kitOptionsFormTemplate = document.querySelector('#kit-options');

// Add the logged in user's name to the profile welcome message
/** @type HTML span */
const WelcomeMessage = document.querySelector(".user-name-welcome");

// Toggle the profile form when user clicks on "Edit profile"
function toggleProfileForm() {
	hiddenElements.forEach(element => {
		element.classList.toggle('toggle');
	});
	EditProfile.classList.toggle('toggle');
}
EditProfile.addEventListener('click', toggleProfileForm);
CancelProfileChanges.addEventListener('click', toggleProfileForm);

let userName = FullNameInput.value;
let userEmail = EmailInput.value

let errors = 0;
const errorFlags = {
	FullName: 1,
	Email: 2,
	Password: 4,
	Avatar: 8
}

const logoutButton = document.getElementById("Button-Logout");

logoutButton.addEventListener('click', async function() {
    const response = await fetch('/logout', {
        method: 'POST'
    });

    const status = await response.text();
    switch (status) {
        case 'logoutSuccessful':
			window.location.href = "./";
            break;
        default:
            break;
    }
});


const getProfileDetails = async() => {
	const response = await fetch('/profile-details');
	const responseJson = await response.json();
	FullNameInput.value = responseJson.name;
	EmailInput.value = responseJson.email;
	userName = FullNameInput.value;
	userEmail = EmailInput.value;
	WelcomeMessage.innerText = FullNameInput.value;
}

const getAvatar = async() => {
	const response = await fetch('/avatar')
	const responseJson = await response.json();
	let base64 = responseJson.data;
	base64 = `data:${responseJson.mimeType};base64,${base64}`;
	document.getElementById("Base-Container-ProfilePicture").src = base64;
}

async function executeUpdate(){
	checkForInvalidInput(FullNameInput);
	checkForInvalidInput(PasswordInput);
	checkForInvalidInput(EmailInput);

	const error = document.getElementById("Update-Error");
	if(errors) {
		error.innerText = "Please address above errors.";
		error.style.color = "red";
		return;
	} else {
		error.innerText = "";
	}

	const payload = {};
	if(!FullNameInput.disabled) {
		payload['name'] = FullNameInput.value;
	}
	if(!EmailInput.disabled) {
		payload['email'] = EmailInput.value;
	}
	if(!PasswordInput.disabled) {
		payload['pwd'] = PasswordInput.value;
	}
	if(AvatarInput.files[0]) {
		// Make the POST call seperatly
		const formData = new FormData();
		formData.append('avatar', AvatarInput.files[0])
		const response = await fetch("/avatar", {
			method: "POST",
			body: formData
		})
	}


    const response = await fetch("/profile", {
        method: "PATCH",
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify(payload)
    })

    const ResponseText = await response.text(); 
	const feedback = document.getElementById("Update-Error");
    switch(ResponseText){
        case "userUpdated":
            // Successfully updated
			feedback.innerText = "Successfully Updated Profile";
			feedback.style.color = "green";
			toggleProfileForm();
            break;
        case "emailInUse":
            // Email already in use.
			feedback.innerText = "That email is already in use";
			feedback.style.color = "red";
            break;
        default:
            feedback.innerText = "There was an issue on the server";
			feedback.style.color = "red";
    }

	UserFeedbackFile.innerHTML = '';

	getAvatar();
	getProfileDetails();
}

function clearInput(x){
    x.value = '';
}

function editFullName(){
    if (FullNameInput.disabled){
        FullNameInput.disabled= false; 
        FullNameInput.focus();
        FullNameInput.onfocus = clearInput(FullNameInput);
    } else {
        FullNameInput.disabled= true; 
        FullNameInput.value = userName;
    }
}
function editEmail(){
    if (EmailInput.disabled){
        EmailInput.disabled= false; 
        EmailInput.focus();
        EmailInput.onfocus = clearInput(EmailInput);
    } else {
        EmailInput.disabled= true;
        EmailInput.value = userEmail;
    }
}
function editPasswordInput(){
    if (PasswordInput.disabled){
        PasswordInput.disabled= false; 
        PasswordInput.focus();
        PasswordInput.onfocus = clearInput(PasswordInput);
    } else {
        PasswordInput.disabled= true; 
        PasswordInput.value = "12345" 
    }
}

function checkForInvalidInput(input) {
	const error = document.getElementById(input.id + "-Error");
	if(input.value.length === 0) {
		error.innerText = "Can't be empty"
		errors = errors | errorFlags[input.id];
	} else if (input.value.length > 50) {
		error.innerText = "Can't be over 50 characters"
		errors = errors | errorFlags[input.id];
	} else {
		error.innerText = "";
		errors = errors & ~(errorFlags[input.id]);
	}
}

AvatarInput.addEventListener("input", function(e) {
	const file = this.files[0];
	const error = document.getElementById("Avatar-Error");
	if(file && file.size > 8 * 1024 * 1024) {
		// Don't allow files larger than 8MB
		error.innerText = "Max file size is 8MB";
		errors = errors | errorFlags.Avatar;
	} else {
		error.innerText = "";
		errors = errors & ~(errorFlags.Avatar);
	}	

	UserFeedbackFile.innerHTML = file ? file.name : '';

})
getAvatar();
getProfileDetails();
UpdateButton.addEventListener("click", executeUpdate, false);
Pen1.addEventListener("click",editFullName,false);
Pen2.addEventListener("click",editEmail,false);
Pen3.addEventListener("click",editPasswordInput,false);


function closeKitForm() {
	document.querySelector("#kit-options-form").remove();
	document.querySelector('.form-overlay').remove();
}
function createKitOptionsForm() {
	const form = kitOptionsFormTemplate.content.cloneNode(true).firstElementChild;
	const cancelButton = form.querySelector('[type="button"');
	cancelButton.addEventListener('click', closeKitForm);
	// Create the overlay to darken the contents of the screen
    const overlay = document.createElement('div');
    overlay.setAttribute('class', 'form-overlay');
    document.body.appendChild(overlay);
	document.body.appendChild(form);
}

function createEmptyKitMessage() {
	const kitMessageContainer = document.querySelector('.empty-kit-message');
	// Create the message
	const message = document.createElement('p');
	message.innerText = "You don't have a kit. Let's change that!";
	message.id = "user-kits-message";
	kitMessageContainer.appendChild(message);
}

async function getKits() {
	const response = await fetch('/kits');
	const responseJSON = await response.json();
	console.log(responseJSON);
	if (responseJSON.length === 0 || responseJSON.length === undefined || responseJSON.length === null) {
		createEmptyKitMessage();
	}
}

createKitButton.addEventListener('click', createKitOptionsForm);
getKits();