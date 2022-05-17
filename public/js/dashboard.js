"use strict";
import toastQueue from "./toasts.mjs";
window.toastQueue = toastQueue;

/** @type HTMLElement */
const userListEl = document.getElementById("user-list");

/** @type HTMLTemplateElement */
const userRowTemplate = document.getElementById("user-row");

/** @type HTMLTemplateElement */
const addAdminButton = document.querySelector('#add-admin-button');

/** @type HTMLTemplateElement */
const adminFormTemplate = document.querySelector('#new-admin');

/** @type {string} - Default avatar path */
const defaultAvatar = '/images/Default-Profile-Picture.jpg';

// Some JSDoc Record Types:
/**
 * @typedef {
 *     {
 *     "$date": {
 *     "$numberLong": string
 *     } 
 * }} MongoDate
 * @typedef {{
 *      _id: string,
 *      name: string,
 *      emailAddress: string,
 *      avatar: string,
 *      dateJoined: MongoDate,
 *      achievements: Array<string>,
 *      admin: boolean
 *      }} UserDoc
 */

/**
 * Creates a <li> element representing an input UserDoc record.
 * @param {UserDoc} userDoc 
 * @returns {HTMLLIElement}
 */
function makeUserRow(userDoc) {
    /** @type HTMLLIElement */
    // Deep copy the contents of the template:
    const row = userRowTemplate.content.cloneNode(true).firstElementChild;
    row.querySelector(".admin-name").value = userDoc.name;
    row.setAttribute('data-user-id', userDoc._id);
    // Fill in other stuff, too?
    // The profile pictures
    const userAvatar = row.getElementsByClassName('profile-picture').item(0);
    if (userDoc.avatar !== defaultAvatar && userDoc.avatar !== null) {
        userAvatar.setAttribute('data', userDoc.avatar);
        let base64 = userDoc.avatar.data;
        base64 = `data:${userDoc.avatar.mimeType};base64,${base64}`;
        userAvatar.src = base64;
    }

    /** @type HTMLButtonElement */
    const deleteButton = row.getElementsByClassName('delete-button').item(0);
    deleteButton.addEventListener("click", deleteAction(userDoc._id));

    /** @type HTMLButtonElement */
    const editButton = row.getElementsByClassName('edit-button').item(0);
    editButton.addEventListener("click", editAction(userDoc._id));

    return row;
}

/**
 * Function that makes a "delete this userID" function
 * for use in click handlers.
 * @param {string} userID - a user ID to delete
 * @returns an async function that performs the delete operation for the given userID
 */
function deleteAction(userID) {
    return async function () {
        let data = {
            '_id': userID
        };
        const response = await fetch('/delete-admin', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });
        const status = await response.text();
        serverMessages(status);
    }
}

/** 
 * Checks if the user wrote a valid name in the form.
 * If invalid, send toast.
 * @param {HTMLInputElement} input - the name field in the form
 * @returns a boolean
 */
function validNameInput(input) {
    const checkInput = input.value;
    if (checkInput == undefined || checkInput == null || checkInput.trim().length == 0) {
        toastQueue.queueToasts([
            { message: `Please enter a valid name`, classes: ["toast-error"] }
        ]);
        return false;
    }
    return true;
}

// Click on edit button to enable the editing on admin name input
// Pencil icon changes to checkmark icon
// TODO: add limits to form??
function editAction(userID) {
    return async function() {
        /** @type HTMLButtonElement */
        const userListItem = document.querySelector(`[data-user-id="${userID}"]`);
        const userInput = userListItem.querySelector('.admin-name');
        const editButton = userListItem.querySelector('.edit-button');

        if (userInput.disabled) {
            userInput.disabled = false;
            userInput.focus();
            userListItem.classList.remove('inactive-input');
            userListItem.classList.add('active-input');
            // Change the button's icon to editing mode
            editButton.innerHTML = `<span class="material-symbols-outlined teal">done</span>`;
            // Implementing Katy's cool toast queue feature
            toastQueue.queueToasts([
                { message: `Editing "${userInput.value}"`, classes: ["toast-info"] }
            ]);
            return;
        }
        
        if (validNameInput(userInput)) {
            userInput.disabled = true;
            userListItem.classList.remove('active-input');
            userListItem.classList.add('inactive-input');
            editButton.innerHTML = `<span class="material-symbols-outlined teal">edit</span>`;

            let data = {
                '_id': userID,
                'name': userInput.value
            };

            try {
                await fetch('/edit-admin', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(data)
                });

                toastQueue.queueToasts([
                    { message: `Saved "${userInput.value}"`, classes: ["toast-success"] }
                ]);

                refreshUsers(fetch('profiles'));
                getProfileDetails();
                return;
                
            } catch (err) {
                toastQueue.queueToasts([
                    { message: `Network error!`, classes: ["toast-error"] }
                ]);
                throw err;
            }
        }
    }
}


function closeForm() {
    document.querySelector('#add-admin-form').remove();
    document.querySelector('.form-overlay').remove();
}

function cancelCreateAdmin() {
    toastQueue.queueToasts([
        { message: `Admin was not created`, classes: ["toast-warning"] }
    ]);
    closeForm();
}

function uploadFileFeedback() {
    if (validFileType(this.files)) {
        const UserFeedbackFile = document.getElementById("Upload-Avatar-FileName-Admin");
        UserFeedbackFile.innerHTML = this.files[0].name;
        toastQueue.queueToasts([
            { message: "File selected", classes: ["toast-info"] }
        ]);
    }
}

// Code snippet from Mozilla
// https://developer.mozilla.org/en-US/docs/Web/Media/Formats/Image_types
async function validFileType(file) {
    const fileTypes = [
        "image/jpeg",
        "image/png",
    ];
    return fileTypes.includes(file.type);
}

// Load form for admin to fill out, create a new admin in db
function makeAdminForm() {
    // Clone the contents of the add-admin-form template
    const form = adminFormTemplate.content.cloneNode(true).firstElementChild;
    const cancelButton = form.querySelector('#admin-form-cancel-button');
    const formImage = form.querySelector('#Upload-Admin-Avatar');

    // Create the overlay to darken the contents of the screen
    const overlay = document.createElement('div');
    overlay.setAttribute('class', 'form-overlay');

    // Make the buttons do things
    formImage.addEventListener('change', uploadFileFeedback);
    form.addEventListener('submit', submitAdminForm);
    cancelButton.addEventListener('click', cancelCreateAdmin);

    document.body.appendChild(form);
    document.body.insertBefore(overlay, form);
}

addAdminButton.addEventListener('click', makeAdminForm);


// Submit form contents
async function submitAdminForm(event) {
    event.preventDefault();
    const adminForm = event.currentTarget;
    const formInputName = adminForm.querySelector('#admin-form-input-name');
    const formInputEmail = adminForm.querySelector('#admin-form-input-email');
    const formInputPassword = adminForm.querySelector('#admin-form-input-password');
    /** @type HTMLInputElement */
    const formImage = adminForm.querySelector('#Upload-Admin-Avatar');

    // Create an empty form data object to manually add the input
    // Don't specify headers when POSTing
    const formData = new FormData();
    if (formImage.files == undefined || formImage.files.length == 0) {
        toastQueue.queueToasts([
            { message: "Please upload a png or jpg file", classes: ["toast-info"] }
        ]);
    } else {
        formData.append('name', formInputName.value.trim() || 'New Admin');
        formData.append('emailAddress', formInputEmail.value);
        formData.append('pwd', formInputPassword.value);
        formData.append('avatar', formImage.files[0]);
        formData.append('admin', true);
        const response = await fetch("/create-user", {
            method: "POST",
            body: formData
        })

        const status = await response.text();
        serverMessages(status);

        if (!response.ok) {
            return;
        }

        refreshUsers(fetch('profiles'));
        return;
    }
}


// Compiling messages here
function serverMessages(status) {
    switch (status) {
        case 'userUpdated':
            toastQueue.queueToasts([
                { message: "Saved changes", classes: ["toast-success"] }
            ]);
            refreshUsers(fetch('profiles'));
            break;
        case 'deleteAdminSuccessful':
            toastQueue.queueToasts([
                { message: "Successfully deleted admin", classes: ["toast-success"] }
            ]);
            refreshUsers(fetch('profiles'));
            break;
        case 'deleteAdminFailed':
            
            toastQueue.queueToasts([
                { message: "Cannot delete yourself", classes: ["toast-error"] }
            ]);
            break;
        case 'createdUserSuccess':
            toastQueue.queueToasts([
                { message: `Successfully added admin`, classes: ["toast-success"] }
            ]);
            refreshUsers(fetch('profiles'));
            closeForm();
            break;
        case 'duplicateKey':
            toastQueue.queueToasts([
                { message: "That email is already in use", classes: ["toast-error"] }
            ]);
            break;
        case 'serverIssue':
            toastQueue.queueToasts([
                { message: "Server error", classes: ["toast-error"] }
            ]);
            break;
        default:
            toastQueue.queueToasts([
                { message: "Unknown error", classes: ["toast-error"] }
            ]);
            break;
    }
}

// TODO: Pagination?
/**
 * Replace the children of the input user list with a fresh batch of <li> elements 
 * generated from the result of the input fetch() Promise.
 * @param {Promise<Response>} toFetch - Promise, usually from fetch(…).
 * @returns {Number} - how many records were inserted into the list.
 */
async function refreshUsers(toFetch) {
    // TODO: Error handling!
    /** @type {Array<UserDoc>} */
    const results = (await (await toFetch).json()).result;

    console.dir(
        results.map(makeUserRow).map(el => el.toString())
    )

    userListEl.replaceChildren(
        ...results.map(makeUserRow)
    )

    return results.length;
}

async function subscribeToChanges() {
    // In production, use `wss://`.
    const socket = new WebSocket(`ws://${location.hostname}:8000/changes`, 'profileChanges');
    socket.onmessage = console.dir;
}

subscribeToChanges();
refreshUsers(fetch('profiles'));


const logoutButton = document.getElementById("Button-Logout");

logoutButton.onclick = async () => {
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

};
