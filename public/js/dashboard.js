"use strict";

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

    /** @type = HTMLButtonElement */
    const deleteButton = row.getElementsByClassName('delete-button').item(0);
    deleteButton.addEventListener("click", deleteAction(userDoc._id));

    /** @type = HTMLButtonElement */
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
        await fetch('/delete-admin', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });
        // UI confirmation code etc... goes here
    }
}

// Click on edit button to enable the editing on admin name input
// Pencil icon changes to checkmark icon
// TODO: responses and UI confirmations
function editAction(userID) {
    return async function() {
        /** @type = HTMLButtonElement */
        const userListItem = document.querySelector(`[data-user-id="${userID}"]`);
        const userInput = userListItem.querySelector('.admin-name');
        const editButton = userListItem.querySelector('.edit-button');

        // Check if input is disabled...
        if (userInput.disabled) {
            userInput.disabled = false;
            userInput.focus();
            editButton.innerHTML = `<span class="material-icons teal">done</span>`;
        } else {
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

// TODO: add "add admin" functionality
// Load form for admin to fill out, create a new admin in db
function makeAdminForm() {
    // Clone the contents of the add-admin-form template
    const form = adminFormTemplate.content.cloneNode(true).firstElementChild;
    const cancelButton = form.querySelector('#admin-form-cancel-button');
    const submitButton = form.querySelector('#admin-form-submit-button');

    // Create the overlay to darken the contents of the screen
    const overlay = document.createElement('div');
    overlay.setAttribute('class', 'overlay');

    // Make the buttons do things
    submitButton.addEventListener('click', submitAdminForm);
    cancelButton.addEventListener('click', function closeForm() {
        form.remove();
        overlay.remove();
    });

    document.body.appendChild(form);
    document.body.insertBefore(overlay, form);
}

// Should send the contents of the form to server
// TODO: connect to /create-admin
// TODO: make image uploadable
// 
function submitAdminForm() {
    console.log("submit button clicks");
    
}
addAdminButton.addEventListener('click', makeAdminForm);


/**
 * A Toast Queue – stores toast notifications and periodically displays new ones. 
 * TODO: refactor, move into its own file? May be shared by other pages.
 * @see {toastQueue} for the global ToastQueue singleton.
 * */
class ToastQueue {
    /**
     * @typedef {Object} ToastOptions
     * A {@link https://en.wikipedia.org/wiki/Command_pattern Command Pattern}
     * -style record type, encoding options for a Toast to be displayed.
     * @property {string} message - The message to display to the user.
     * @property {Array<string>} classes - The CSS classes to attach to the 
     *                                     toast element, when displaying it.
     */

    /** @constructor */
    constructor() {
        /** @readonly */
        /** @type {HTMLDivElement} */
        this.toastBoxEl = document.getElementById('dashboard-toasts');
        /** @readonly from non-ToastQueue code. */
        this.toasting = false;
        /** @private The internal toast queue. Alter externally at your own peril. */
        /** @type {Array<ToastOptions>} */
        this._queue = [];
        /** @type {?number} @private The internal interval handle for periodically dequeueing and displaying a toast. */
        this._refreshHandle = null;
    }


    /**
     * Create an interval handle, periodically dequeueing and displaying a toast.
     * @param {boolean} displayNow - Whether to display a toast right away, or to wait 
     *                               the refresh interval before the first display.
     * @param {number} [refreshInterval=1000] - In ms, how long to wait between each refresh. 
     *                                          Default: 5 seconds.
     * @returns {number} handle from the {@link setInterval setInterval} function.
     */
    makeRefreshHandle(displayNow, refreshInterval) {
        if (displayNow) {
            this.popToast();
        }
        refreshInterval = refreshInterval ?? 5000;
        return setInterval(this.popToast.bind(this), refreshInterval);
    }

    /** 
     * Helper function: sets `toasting` to `true` and makes the proper refresh handle for the
     * toasting to start.
     * @param {boolean} [displayNow=true] - Whether to start toasting immediately.
     */
    startToasting(displayNow) {
        this._refreshHandle = this.makeRefreshHandle(displayNow ?? true);
        this.toasting = true;
    }

    /**
     * Helper function: adds many Toasts to the end of the queue. 
     * Starts displaying them if they aren't being displayed already.
     * Toasts are added in the sequence provided, first element in the array is displayed first.
     * @param {ToastOptions[]} toasts 
     */
    queueToasts(toasts) {
        this._queue = this._queue.concat(toasts);
        if (!this.toasting) { this.startToasting(); }
    }

    /**
     * Add a toast to be displayed to the toast queue.
     * @param {ToastOptions} toast - The toast to enqueue.
     * @param {boolean} [shouldStart=true] - Whether the queue should start toasting right away. 
     */
    queueToast(toast, shouldStart) {
        this._queue.push(toast);
        // Start toasting, in case we aren't toasting already.
        if (!this.toasting) { this.startToasting(); }
    }
    /**
     * Make an {@link HTMLDivElement} based on the given {@link ToastOptions}.
     * @param {ToastOptions} options - The {@link ToastOptions} record to base the toast element on.
     * @returns {HTMLDivElement}
     */
    makeToastEl(options) {
        /** @type HTMLTemplateElement */
        const toastTemplate = document.getElementById('toast');
        const toastEl = toastTemplate.content.cloneNode(true).firstElementChild;
        toastEl.classList.add(...(options?.classes ?? []));
        toastEl.getElementsByClassName('toast-message').item(0).textContent = (options?.message ?? "");
        // TODO: document
        setTimeout(() => toastEl.classList.add('toast-slideup'), 100);
        return toastEl;
    }

    /**
     * Make a function that removes the given toast element from its parent element.
     * @param {HTMLDivElement} toastEl
     * @returns {() => void} A callback that removes the element.
     */
    removeToastElAction(toastEl) {
        return () => {
            toastEl.classList.remove('toast-slideup');
            setTimeout(() => toastEl.remove(), 100)
        }
    }

    /**
     * Dequeue and display a toast. 
     * @returns {boolean} - whether there are toasts left on the queue. 
     */
    popToast() {
        // Dequeue a toast. If there's nothing on the queue, do nothing.
        const toast = this._queue.shift();
        if (toast !== undefined) {
            // Display the toast!
            const toastEl = this.makeToastEl(toast);
            this.toastBoxEl.appendChild(toastEl);
            // TODO: factor magic delayMs number out into a constant/construction-time init variable.
            setTimeout(this.removeToastElAction(toastEl), 4000);
        }

        // If we just displayed the last toast, clear the handle.
        if (this._queue.length == 0) {
            this.stopToasting();
        }
    }

    /** 
     * Stop toasting - clear the refresh handle and set 
     * {@link ToastQueue._refreshHandle} to `null`,  set 
     * {@link ToastQueue.toasting} to `false`.
     */
    stopToasting() { 
        this.toasting = false;
        clearInterval(this._refreshHandle);
        this._refreshHandle = null;
    }
}

/** 
 * @global The ToastQueue {@link https://en.wikipedia.org/wiki/Singleton_pattern singleton} instance. 
 */
const toastQueue = new ToastQueue();

setTimeout(
    () => {
        toastQueue.queueToasts([
            { message: "Info: Test message!", classes: ["toast-info"] },
            { message: "Warning: Do you really want to do this?", classes: ["toast-warning"] },
            { message: "Error: Something went wrong!", classes: ["toast-error"] },
        ]);
    }, 100
)

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