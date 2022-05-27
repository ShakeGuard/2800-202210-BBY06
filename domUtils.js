import {readFile} from "node:fs/promises";
import {JSDOM} from "jsdom";

/**
 * Uses {@link loadHTMLComponent} to load header and footer into their respective tags given a JSDOM object.
 * @param {JSDOM} baseDOM - the DOM object to template onto.
 * @returns {JSDOM} The original DOM object, with header and footer attached.
 */
export async function loadHeaderFooter(baseDOM){
    // Add the header
    baseDOM = await loadHTMLComponent(baseDOM, "header", "header", "./templates/header.html");
    // Add the footer
    baseDOM = await loadHTMLComponent(baseDOM, "footer", "footer", "./templates/footer.html");

    return baseDOM;
}

/**
 * Load a HTML component.
 * Selectors should be formatted as they would with `querySelector()`.
 * @param { JSDOM }  baseDOM 				- Initial DOM to insert the HTML template component into.
 * @param { string } placeholderSelector 	- Selector for the placeholder to replace in the initial DOM.
 * @param { string } componentSelector 		- Selector for the content to insert from the template.
 * @param { string } componentLocation 		– Path to the component to load, for example `./html/header.html`.
 */
export async function loadHTMLComponent (baseDOM, placeholderSelector, componentSelector, componentLocation){
    const document = baseDOM.window.document;
    const placeholder = document.querySelector(placeholderSelector);
    const html = await readFile(componentLocation, "utf8");
    const componentDOM = new JSDOM(html);
    placeholder.innerHTML = componentDOM.window.document.querySelector(componentSelector).innerHTML;
    return baseDOM;
}

/**
 * Hide the logout/login buttons as appropriate, based on whether the user
 * has an active session.
 * @param  {JSDOM} baseDOM
 * @param  {Request} req
 */
export function changeLoginButton(baseDOM, req) {
    const document = baseDOM.window.document;
    if (!req.session || !req.session.loggedIn) {
        document.getElementById("Button-Logout").style.display = "none";
        document.getElementById("Kit-Button").style.display = "none";
    } else {
        document.getElementById("Button-Login-Nav").style.display = "none";
    }
    return baseDOM;
}

/**
 * Serve the specified HTML file with the specified templates applied in sequence.
 * @param { string }     path       - The input HTML file path.
 * @param { Function[] } templates  - Functions that take a JSDOM object, applied in sequence to the input file.
 * @returns {(function(*, *): Promise<void>)|*}
 */
export function getPathWithTemplates(path, templates) {
    return async function (req, res) {
        try {
            const baseDOM = new JSDOM(await readFile(path, "utf-8"));
            for (const template of templates) {
                await template(baseDOM);
            }
        } catch {
            res.sendStatus(404);
            return;
        }
        res.send(baseDOM.serialize());
    }
}