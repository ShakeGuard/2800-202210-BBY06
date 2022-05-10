"use strict";

/** @type HTMLElement */
const userListEl = document.getElementById("user-list");

/** @type HTMLTemplateElement */
const userRowTemplate = document.getElementById("user-row");

// Deep copy the contents of the template

/** @type HTMLDivElement */
const exampleRow = userRowTemplate.content.cloneNode(true);

/** @type HTMLParagraphElement */
const nameParagraphEl = exampleRow.getElementById("admin-name");

nameParagraphEl.textContent = "Tracy Ly";

userListEl.appendChild(exampleRow);