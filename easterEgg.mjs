import {JSDOM} from 'jsdom';

/**
 * Add the Tai Lopez Easter Egg stylesheet to a profile page DOM.
 * @param { JSDOM } dom
 * @returns { JSDOM }
 */
export default function applyEasterEggStyle(dom) {
    const geocitiesCSSEl = dom.window.document.createElement('link');
    geocitiesCSSEl.rel = 'stylesheet';
    geocitiesCSSEl.href = '/css/geocities.css';
    dom.window.document.head.appendChild(geocitiesCSSEl);
    return dom;
}