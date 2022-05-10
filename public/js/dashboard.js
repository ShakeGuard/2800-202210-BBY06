"use strict";

/** @type HTMLElement */
const userListEl = document.getElementById("user-list");

/** @type HTMLTemplateElement */
const userRowTemplate = document.getElementById("user-row");

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
    row.querySelector("#admin-name").textContent = userDoc.name;
    row.setAttribute('data-user-id', userDoc._id);
    // Fill in other stuff, too?
    // TODO: Profile pictures!
    return row;
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