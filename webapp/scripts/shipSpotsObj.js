/*
Copyright 2024 Paul Withers

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/
import Spots from "./spotsObj.js";

const template = document.createElement("template");
template.innerHTML = `
    <style>
        .col {
            display: flex;
            flex-direction: row;
            flex-flow: row wrap;
            padding: 5px;
            margin: 0.5rem 0;
            gap: 0.5rem;
        }
        input[type="date"] {
            width: 120px;
            outline: 1px solid var(--border-color-primary);
            outline-offset: -1px;
            height: 1.75rem;
            padding: 0 0.5rem;
        }
        button {
            padding: 0 0.5rem;
            height: 1.75rem;
            margin-left: 50px;
        }
        .spots-container {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            row-gap: 5px;
            column-gap: 5px;
        }
    </style>
    <form>
    <div class="col" style="width: 95%">
        <div>
            <label for="spot-start">Start Date</label>
            <input type="date" class="form-control" placeholder="Start Date" aria-label="Start Date" id="spot-start" />
        </div>
        <div>
            <label for="spot-end">End Date</label>
            <input type="date" class="form-control" placeholder="End Date" aria-label="End Date" id="spot-end" />
        </div>
        <div>
            <button id="search-btn" aria-label="Search" type="button" class="btn-primary">Search</button>
        </div>
    </div>
    </form>
    <div id="spots-container" class="spots-container">
    </div>
`

export default class ShipSpot extends Spots {

    ships = {};

    constructor() {
        super();
        this.connected = false;
    }

    populateSpots(value) {
        this.ships = JSON.parse(localStorage.getItem("ships"));
        const spots_container = this.root.getElementById("spots-container");
        spots_container.innerHTML = "";
        if (value && value.length > 0) {
            value.forEach((spot, index) => {
                this.loadDiv(spot, index, spots_container);
            });
        }
        this.dispatchEvent(new CustomEvent("mask", { bubbles: true, detail: {show: false}}));
    }

    loadDiv(spot, index, div) {
        const shipUnid = spot.ShipUNID;
        const filtered = this.ships.filter(obj => obj["@meta"].unid === shipUnid);
        const shipDiv = document.createElement("div");
        shipDiv.id = `ship-${index}`;
        const a = document.createElement("a");
        a.href = "#";
        if (filtered.length === 0) {
            console.error(`Could not find matching ship ${shipUnid}`);
            a.innerText = "No matching ship";
        } else {
            if (filtered.length === 1) {
                a.innerHTML = filtered[0].Ship;
            } else {
                console.error(`${filtered.length} ships match ${shipUnid}`);
                a.innerHTML = filtered[0].Ship;
            }
            a.addEventListener("click", (event) => {
                this.dispatchEvent(new CustomEvent("showShip", { bubbles: true, detail: {shipObj: filtered[0]}}));
            })
        }
        shipDiv.append(a);

        const span = document.createElement("span");
        span.innerHTML = "&nbsp;spotted at&nbsp;"
        shipDiv.append(span);
        const locLink = document.createElement("a");
        locLink.href = "#";
        locLink.innerText = spot.Location;
        locLink.addEventListener("click", (event) => {
            if (filtered.length > 0) {
                this.dispatchEvent(new CustomEvent("showSpot", { bubbles: true, detail: {shipObj: filtered[0], spotObj: spot}}));
            } else {
                this.dispatchEvent(new CustomEvent("showSpot", { bubbles: true, detail: {shipObj: null, spotObj: spot}}));
            }
        })
        shipDiv.append(locLink);
        div.append(shipDiv);

        const createdDiv = document.createElement("div");
        const createdDate = new Date(spot.Created);
        const localDate = Intl.DateTimeFormat(undefined, this.dateOptions).format(createdDate);
        const created = document.createElement("div");
        created.id = `created-${index}`;
        created.innerText = `${localDate}`;
        createdDiv.append(created)
        div.appendChild(createdDiv);

        const details = document.createElement("div");
        this.createDetails(details, index, spot)
        div.appendChild(details);
    }

    render() {
        const clone = template.content.cloneNode(true);
        this.root.append(clone);
        const actionButton = this.root.querySelector("#search-btn");
        actionButton.addEventListener("click", this.doSearch);
    }

    doSearch = () => {
        this.startDate = this.root.querySelector("#spot-start").value;
        this.endDate = this.root.querySelector("#spot-end").value;
        if (this.startDate === "") {
            this.dispatchEvent(new CustomEvent("sendUserMessage", { bubbles: true, detail: {type: "error", message: "Start Date is required"}}));
            return;
        }
        if (this.endDate === "") {
            this.root.querySelector("#spot-end").value = this.startDate;
            this.endDate = this.startDate;
        }
        this.dispatchEvent(new CustomEvent("mask", { bubbles: true, detail: {show: true}}));
        this.dispatchEvent(new CustomEvent("loadSpotsByDate", { bubbles: true, detail: {shipSpotElem: this}}));
    }

}

customElements.define("ship-spots-elem", ShipSpot);