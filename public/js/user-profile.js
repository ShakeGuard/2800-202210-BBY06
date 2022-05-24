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
const kitList = document.querySelector('#user-kit-list');
const kitListItemTemplate = document.querySelector('#individual-kit-item-row');
const kitRowTemplate = document.getElementById("user-kit-row");
const kitMessageContainer = document.querySelector('.empty-kit-message');
const addItemFormTemplate = document.querySelector('#add-item');
let selectedTemplate = 'Home';
let userKits;
const deleteKitConfirmationTemplate = document.querySelector('#delete-confirmation');
// Store the kit item HTML that the user wants to edit
let customItem;

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

	if(Object.keys(payload).length === 0 && !AvatarInput.files[0]) {
		error.innerText = "Nothing to update."
		error.style.color = "blue";
		return;
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
	AvatarInput.value = null;
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

// Code snippet from Mozilla
// https://developer.mozilla.org/en-US/docs/Web/Media/Formats/Image_types
function validFileType(file) {
    const fileTypes = [
        "image/jpeg",
        "image/png",
    ];
    return fileTypes.includes(file.type);
}

AvatarInput.addEventListener("input", function(e) {
	const file = this.files[0];
	const error = document.getElementById("Avatar-Error");
	if(file && file.size > 8 * 1024 * 1024) {
		// Don't allow files larger than 8MB
		error.innerText = "Max file size is 8MB";
		errors = errors | errorFlags.Avatar;
	} else if (!validFileType(file)) {
		// Don't allow non jpg/png files
		error.innerText = "File must be a jpg or png";
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


function closeForm(formID) {
	document.querySelector(formID).remove();
	document.querySelector('.form-overlay').remove();
}
function createFormOverlay(formElement) {
	// Create the overlay to darken the contents of the screen
	const overlay = document.createElement('div');
	overlay.setAttribute('class', 'form-overlay');
	document.body.appendChild(overlay);
	document.body.appendChild(formElement);
}
function createKitOptionsForm() {
	const form = kitOptionsFormTemplate.content.cloneNode(true).firstElementChild;
	const cancelButton = form.querySelector('[type="button"');
	cancelButton.addEventListener('click', () => {
		closeForm("#kit-options-form");
	});
	
	createFormOverlay(form);
	// Add event handlers for submission
	const homeKitTemplate = document.querySelector("#kit-1");
	const grabAndGoKitTemplate = document.querySelector("#kit-2");
	homeKitTemplate.addEventListener('click', e => {
		selectedTemplate = 'Home';
		homeKitTemplate.classList.toggle('selected-kit');
		grabAndGoKitTemplate.classList.remove('selected-kit');
	})
	grabAndGoKitTemplate.addEventListener('click', e => {
		selectedTemplate = 'Grab-and-Go';
		grabAndGoKitTemplate.classList.toggle('selected-kit');
		homeKitTemplate.classList.remove('selected-kit');
	})
	form.addEventListener('submit', createKitSubmissionHandler);
}
function createAddItemForm(kitIndex) {
	const form = addItemFormTemplate.content.cloneNode(true).firstElementChild;
	const cancelButton = form.querySelector('[type="button"');
	cancelButton.addEventListener('click', () => {
		closeForm("#add-item-form");
	});
	createFormOverlay(form);
	// Add event handlers for submission
	form.addEventListener('submit', e => {
		e.preventDefault();
		addItemSubmissionHandler(kitIndex);
	});
}
function createEmptyKitMessage() {
	// Create the message
	const message = document.createElement('p');
	message.innerText = "You don't have a kit. Let's change that!";
	message.id = "user-kits-message";
	kitMessageContainer.appendChild(message);
}


// TODO: figure out how to calculate the progress and store
let kitProgress = '0';


// Listens for event click, then changes the checkcircle's style
async function toggleCheckCircle(e) {
	const kitIndex = e.target.dataset.kitIndex;
	const itemIndex = e.target.dataset.itemIndex;
	if (e.target.innerText == 'check_circle') {
		// Deselect
		e.target.innerText = 'radio_button_unchecked';
		e.target.style.color = 'rgb(180, 180, 180)';
		await markItemCompleted(false, kitIndex, itemIndex);
	} else {
		// Select
		e.target.innerText = 'check_circle';
		e.target.style.color = 'rgb(18, 210, 164)';
		await markItemCompleted(true, kitIndex, itemIndex);
	}
	updateKitProgress(kitIndex);
}

function updateKitProgress(kitIndex) {
	const total = userKits[kitIndex].kit.length;
	const completed = userKits[kitIndex].kit.reduce((prev, curr) => {return curr.completed ? prev+1 : prev}, 0);
	const kitProgress = (completed / total * 100).toFixed(2);
	document.getElementById(userKits[kitIndex]._id).querySelector(".kit-progress span").innerText = `${kitProgress}%`;
}

async function markItemCompleted(completed, kitIndex, itemIndex) {
	const response = await fetch('/kits', {
		method: 'PATCH',
		headers: {'Content-Type':'application/json'},
		body: JSON.stringify({
			"_id": userKits[kitIndex]._id,
			"name": userKits[kitIndex].kit[itemIndex].name,
			"itemId": userKits[kitIndex].kit[itemIndex]._id,
			"completed": completed
		})
	})
	await getKits();

	// TODO: Error Handling
}

// Get kit data from the session user on load on page from templates
async function loadKit() {
	await getKits();
	
	if (userKits.length === 0) {
		createEmptyKitMessage();
	} else {
		userKits.forEach((element, kitIndex) => {
			
			// This is each kit that the user has
			const row = kitRowTemplate.content.cloneNode(true).firstElementChild;
			row.id = element._id;
			row.querySelector('.kit-name').innerText = element.name;
			// Make sure the appropriate icon represents the kit
			switch (element.name) {
				case 'Home':
					row.querySelector('span').innerText = "cottage";
					break;
				case 'Grab-and-Go':
					row.querySelector('span').innerText = "airport_shuttle";
					break;
			}
					
			const kitItemArray = element.kit;
			if (kitItemArray.length > 0) {
				// Store the number of items to calculate progress
				let completedItems = 0;
				let kitProgress = 0;
				kitItemArray.forEach((item, itemIndex) => {
					// This is each item in the kit
					({ completedItems, kitProgress } = addItemKit(item, kitIndex, itemIndex, completedItems, kitItemArray.length, kitProgress, row));
				});
			}
			// Set data attribute on <ul> for easy access when adding custom items
			row.querySelector(".all-kit-items-list").dataset.kitIndex = kitIndex;
			// After loading all the kit contents, hide the kit contents
			const listOfItemsInAKit = row.querySelector('.all-kit-items-list');
			listOfItemsInAKit.style.overflow = 'hidden';

			const deleteKitButton = row.querySelector('.delete-kit');
			deleteKitButton.addEventListener('click', createDeleteConfirmation);

			const addCustomItemButton = row.querySelector('.add-custom-item');
			addCustomItemButton.addEventListener('click', () => createAddItemForm(kitIndex));
			addCustomItemButton.dataset.kitIndex = kitIndex;

			const expandKitButton = row.querySelector('.expand-kit');
			expandKitButton.addEventListener('click', () => {
				toggleExpand(listOfItemsInAKit);
				addCustomItemButton.classList.toggle('hidden');
			});

			kitList.appendChild(row);
		});
	}
}

function toggleExpand(element) {
	if (element.style.maxHeight) {
		element.style.maxHeight = null;
	} else {
		element.style.maxHeight = element.scrollHeight + 'px';
	}
}

function addItemKit(item, kitIndex, itemIndex, completedItems, totalKitItems, kitProgress, row, imgUrl) {
	const itemRow = kitListItemTemplate.content.cloneNode(true).firstElementChild;
	// Get the image binary data
	let base64 = imgUrl ? null : `data:${item.image.contentType};base64,${item.image.data.$binary.base64}`;
	itemRow.querySelector('img').src = base64 ?? URL.createObjectURL(imgUrl);
	itemRow.querySelector('.item-name').value = item.name;
	itemRow.querySelector('.item-quantity').value = item.quantity;
	itemRow.querySelector('.item-description').innerText = item.description;
	// Checkbox functions
	const itemCheckcircle = itemRow.querySelector('.checkcircle');
	itemCheckcircle.dataset.kitIndex = kitIndex;
	itemCheckcircle.dataset.itemIndex = itemIndex;
	itemCheckcircle.addEventListener('click', toggleCheckCircle);
	// Calculate the number of acquired items
	if (item.completed === true) {
		completedItems++;
		// Change the checkcircle to "checked" style/state
		itemCheckcircle.innerText = 'check_circle';
		itemCheckcircle.style.color = 'rgb(18, 210, 164)';
	}
	if (totalKitItems > 0) {
		kitProgress = completedItems / totalKitItems * 100;
		kitProgress = kitProgress.toFixed(2);
	} else {
		kitProgress = 0;
	}
	row.querySelector('.kit-progress span').innerText = `${kitProgress}%`;

	// Custom items will have yellow background and will be editable
	if (!item.required) {
		itemRow.classList.add('custom-item');
		// TODO: edit and delete item functionality
		const editItemButton = itemRow.querySelector('span.edit');
		customItem = itemRow;
		editItemButton.dataset.kitIndex = kitIndex;
		editItemButton.dataset.itemIndex = itemIndex;
		editItemButton.addEventListener('click', editItemSubmissionHandler);
		const deleteItemButton = itemRow.querySelector('.edit-button-group .delete');
		deleteItemButton.dataset.kitIndex = kitIndex;
		deleteItemButton.dataset.itemIndex = itemIndex;
		deleteItemButton.addEventListener('click', deleteItemSubmissionHandler);
	} else {
		itemRow.querySelector('.edit-button-group').remove();
	}

	row.querySelector('ul').appendChild(itemRow);
	return { completedItems, totalKitItems, kitProgress };
}

async function createKit(templateName) {
	const response = await fetch('/kits', {
		method: 'POST',
		headers: {'Content-Type':'application/json'},
		body: JSON.stringify({
			name: templateName
		})
	});
	// TODO: Handle error 
}

async function createKitSubmissionHandler(e) {
	e.preventDefault();
	await createKit(selectedTemplate);
	clearKitsOnScreen();
	loadKit();
	closeForm("#kit-options-form");
}

async function addItem(kitIndex) {
	if(userKits) {
		
		const updateKitId = userKits[kitIndex]._id;
		const newItemProps = {
			name: document.querySelector("#add-item-name").value,
			quantity: document.querySelector("#add-item-quantity").value,
			description: document.querySelector("#add-item-description").value,
			required: false,
			completed: false
		}

		const formData = new FormData();
		const imageFile = document.querySelector("#add-item-image").files[0];
		formData.append("_id", updateKitId);
		// TODO: Check that an image file exists and show some error if it doesn't
		formData.append("image", imageFile);
		formData.append("itemProps", JSON.stringify(newItemProps));

		const response = await fetch('/add-item', {
			method: 'POST',
			body: formData
		})
		const responseText = await response.text();
		// TODO: Handle errors
		if(response.ok) {
			await getKits();
			// Add item to DOM
			const completedItems = userKits[kitIndex].kit.reduce(
				(prev, current) => current.completed ? prev++ : prev, 0
			);
			const kitItemList = document.querySelector(`ul[data-kit-index="${kitIndex}"]`);
			const totalItems = kitItemList.childElementCount + 1;
			const kitProgress = (completedItems / totalItems * 100).toFixed(2);
			const row = document.getElementById(`${userKits[kitIndex]._id}`);
			addItemKit(newItemProps, kitIndex, totalItems - 1, completedItems, totalItems, kitProgress, row, imageFile);
			kitItemList.style.maxHeight = kitItemList.scrollHeight + 'px';
		} 
	}
}

async function addItemSubmissionHandler(kitIndex) {
	await addItem(kitIndex);
	closeForm("#add-item-form");
}


// TODO: Better styling for inputs
function toggleItemEditing(customItem) {
	// console.log('custom item', customItem);
	const input = customItem.querySelectorAll('input, textarea');
	input.forEach(inputField => {
		if (inputField.disabled) {
			inputField.disabled = false;
			inputField.classList.add('active-input');
			inputField.focus();
			// TODO: Validate input
		} else {
			inputField.disabled = true;
			inputField.classList.remove('active-input');
			// TODO: Validate input
		}
	});
}

async function editItemSubmissionHandler(e) {
	e.preventDefault();
	const kitIndex = e.target.dataset.kitIndex;
	const itemIndex = e.target.dataset.itemIndex;
	const row = e.target.parentElement.parentElement;
	// Change icon in the button to the appropriate one
	if (e.target.innerText === 'done') {
		e.target.innerText = 'edit'
		await editItem(kitIndex, itemIndex, row);
	} else {
		e.target.innerText = 'done';
	}

	toggleItemEditing(customItem);
}

async function editItem(kitIndex, itemIndex, row) {
	const response = await fetch('/edit-item', {
		method: "PATCH",
		headers: {'Content-Type':'application/json'},
		body: JSON.stringify({
			"_id": userKits[kitIndex]._id,
			"itemProps": {
				"_id": userKits[kitIndex].kit[itemIndex]._id,
				"name": row.querySelector(".item-name").value,
				"quantity": row.querySelector(".item-quantity").value,
				"description": row.querySelector(".item-description").value,
				"image": userKits[kitIndex].kit[itemIndex].image,
				"required": false,
				"completed": userKits[kitIndex].kit[itemIndex].completed,
			}
		})
	})
	// TODO: Handle errors
}

async function deleteItemSubmissionHandler(e) {
	e.preventDefault();
	const kitIndex = e.target.dataset.kitIndex;
	const itemIndex = e.target.dataset.itemIndex;
	const row = e.target.parentElement.parentElement;
	await deleteItem(kitIndex, itemIndex);
	row.remove();
}

async function deleteItem(kitIndex, itemIndex) {
	const response = await fetch('/delete-item', {
		method: "DELETE",
		headers: {'Content-Type':'application/json'},
		body: JSON.stringify({
			"_id": userKits[kitIndex]._id,
			"itemId": userKits[kitIndex].kit[itemIndex]._id
		})
	})
	// TODO: Handle errors
}

// Delete a kit
let requestedKitID = "";
async function createDeleteConfirmation(e) {
	requestedKitID = e.target.parentElement.id;
	
	const form = deleteKitConfirmationTemplate.content.cloneNode(true).firstElementChild;
	const cancelButton = form.querySelector('[type="button"');
	cancelButton.addEventListener('click', () => {
		closeForm("#delete-confirmation-form");
	});
	createFormOverlay(form);
	form.addEventListener('submit', deleteKitSubmissionHandler);
}

async function deleteKit(kitID) {
	const response = await fetch('/kits', {
		method: 'DELETE',
		headers: {'Content-Type':'application/json'},
		body: JSON.stringify({
			'_id': kitID
		})
	});

	// TO DO: error handling and add UI feedback, import the toasts?
}

// TO DO: refresh kits after delete
async function deleteKitSubmissionHandler(e) {
	e.preventDefault();
	await deleteKit(requestedKitID);
	closeForm("#delete-confirmation-form");
}

// Hacky way to refresh the kit list without reloading page
function clearKitsOnScreen() {
	const kitsOnScreen = kitList.querySelectorAll('.user-kit-list-item');
	kitsOnScreen.forEach(item => {item.remove()});

	// If there's an empty message
	if (kitMessageContainer.querySelector('p')) {
		kitMessageContainer.querySelector('p').remove();
	}
}

async function getKits() {
	const response = await fetch('/kits');
	userKits = await response.json();
}

createKitButton.addEventListener('click', createKitOptionsForm);
loadKit();