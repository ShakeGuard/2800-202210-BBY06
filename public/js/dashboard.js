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
 *      avatarURL: string,
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
    // TODO: Profile pictures!

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

// Click on edit button to enable the editing on admin name input
// Pencil icon changes to checkmark icon
// TODO: add limits to form??
function editAction(userID) {
    return async function() {
        /** @type HTMLButtonElement */
        const userListItem = document.querySelector(`[data-user-id="${userID}"]`);
        const userInput = userListItem.querySelector('.admin-name');
        const editButton = userListItem.querySelector('.edit-button');

        // Check if input is disabled...
        if (userInput.disabled) {
            userInput.disabled = false;
            userInput.focus();
            editButton.innerHTML = `<span class="material-icons teal">done</span>`;
            // Implementing Katy's cool toast queue feature
            toastQueue.queueToasts([
                { message: `Editing "${userInput.value}"`, classes: ["toast-info"] }
            ]);
        } else {
            toastQueue.queueToasts([
                { message: `Saved "${userInput.value}"`, classes: ["toast-success"] }
            ]);

            userInput.disabled = true;
            editButton.innerHTML = `<span class="material-icons teal">edit</span>`;
            let data = {
                '_id': userID,
                'name': userInput.value
            };
            await fetch('/edit-admin', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });
        }
    }
}


function closeForm() {
    document.querySelector('#add-admin-form').remove();
    document.querySelector('.form-overlay').remove();
}


// Load form for admin to fill out, create a new admin in db
function makeAdminForm() {
    // Clone the contents of the add-admin-form template
    const form = adminFormTemplate.content.cloneNode(true).firstElementChild;
    const cancelButton = form.querySelector('#admin-form-cancel-button');

    // Create the overlay to darken the contents of the screen
    const overlay = document.createElement('div');
    overlay.setAttribute('class', 'form-overlay');

    // Make the buttons do things
    form.addEventListener('submit', submitAdminForm);
    cancelButton.addEventListener('click', () => {
        toastQueue.queueToasts([
            { message: `Admin was not created`, classes: ["toast-warning"] }
        ]);
        closeForm();
    });

    document.body.appendChild(form);
    document.body.insertBefore(overlay, form);
}

// Submit form contents
// TODO: make image uploadable
// 
async function submitAdminForm(event) {
    event.preventDefault();
    const adminForm = event.currentTarget;
    const formInputName = adminForm.querySelector('#admin-form-input-name');
    const formInputEmail = adminForm.querySelector('#admin-form-input-email');
    const formInputPassword = adminForm.querySelector('#admin-form-input-password');

    const data = {
        'name': formInputName.value.trim() || 'New Admin',
        'emailAddress': formInputEmail.value,
        'pwd': formInputPassword.value,
        'avatarURL': '/avatar/<filename>.png',
        'dateJoined': new Date(),
        'achievements': [ 'gettingStarted', 'planKit', 'finishKit' ],
        'admin': true
    };
    const response = await fetch('/create-user', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
    });

    const status = await response.text();
    serverMessages(status);

}

addAdminButton.addEventListener('click', makeAdminForm);


// Compiling messages here
function serverMessages(status) {
    switch (status) {
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

refreshUsers(fetch('profiles'));