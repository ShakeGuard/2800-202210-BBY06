import {open, readFile} from "node:fs/promises";
import {JSDOM} from "jsdom";
import {changeLoginButton, getPathWithTemplates, loadHeaderFooter} from "./domUtils.js";

export async function getResource(req, res) {

	// TODO Put into an actual JSON file and into the database!
    /* Array here to determine how many cards to create*/
    const CallAPI = [{
        "{cardLink}": "/resource_page1",
        "{cardImage}": "/images/Resource1.jpg",
        "{cardTitle}": "Government of British Columbia",
        "{cardDesc}": "PreparedBC is an earthquake resource prepared by the Government of British Columbia for disaster preparation in BC",
        "{cardTopic}": "Disaster Preparation Knowledge"
    }, {
        "{cardLink}": "/resource_page2",
        "{cardImage}": "/images/Resource2.jpg",
        "{cardTitle}": "City of Vancouver",
        "{cardDesc}": "A general guide on disaster readiness made by the City of Vancouver.",
        "{cardTopic}": "Kit Preparation"
    }, {
        "{cardLink}": "/resource_page3",
        "{cardImage}": "/images/Resource3.jpg",
        "{cardTitle}": "Emergency Kit vs Grab-and-Go Bag",
        "{cardDesc}": "Learn about the differences between the two Kits and why you may need one over the other.",
        "{cardTopic}": "Kit Preparation"
    }, {
        "{cardLink}": "/resource_page4",
        "{cardImage}": "/images/Resource4.jpg",
        "{cardTitle}": "Pacific Northwest Seismic Network",
        "{cardDesc}": "In-depth discussion on the Cascadia Subduction Zone that stretchs from Northern Vancouver Island to Cape Mendocino California.",
        "{cardTopic}": "Earthquake Knowledge"
    }, {
        "{cardLink}": "/resource_page5",
        "{cardImage}": "/images/Resource5.jpg",
        "{cardTitle}": "Canadian Red Cross",
        "{cardDesc}": "The Canadian Red Cross details the procudures to take before, during, and after an Earthquake.",
        "{cardTopic}": "Disaster Preparation Knowledge"
    }, {
        "{cardLink}": "/resource_page6",
        "{cardImage}": "/images/Resource6.jpg",
        "{cardTitle}": "ShakeOut",
        "{cardDesc}": "ShakeOut is an annual event that aims to spread awareness about earthquake preparedness in BC. Click here to read more on instructions on how to run an Earthquake Drill.",
        "{cardTopic}": "Disaster Preparation Knowledge"
    }]

    let resourceDoc = await readFile("./html/resource.html", "utf-8");
    const baseDOM = new JSDOM(resourceDoc);
    let resource = await loadHeaderFooter(baseDOM);

    resource = changeLoginButton(resource, req);

    let cardDoc = await readFile("./templates/card.html", "utf-8");
    const cardDOM = new JSDOM(cardDoc);
    const cardTemplate = cardDOM.window.document.getElementsByClassName("Component").item(0);

    for (const element of CallAPI) {
        const cardEl = cardTemplate.cloneNode(true);
        if (cardEl) {
            cardEl.querySelector("#Card-Link").setAttribute("href", element["{cardLink}"]);
            cardEl.querySelector("#Card-Image").setAttribute("src", element["{cardImage}"]);
            cardEl.querySelector("#Card-Title").textContent = element["{cardTitle}"];
            cardEl.querySelector("#Card-Description").textContent = element["{cardDesc}"];
            cardEl.querySelector("#Description-Author").textContent = element["{cardTopic}"];
            resource.window.document.getElementById("Base-Container").appendChild(cardEl);
        }
    }

    res.send(resource.serialize());
}

export async function getResourcePage(req, res) {
    const filename = `./html/resource_page${req.params.pageNum}.html`;
    let file;
    try {
        file = await open(filename)
    } catch (e) {
        res.sendStatus(404);
        return;
    }
    await file.close();
    getPathWithTemplates(filename, [loadHeaderFooter])(req, res);
}