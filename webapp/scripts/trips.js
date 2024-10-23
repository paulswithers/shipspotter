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
import Trip from "../scripts/trip.js";

const template = document.createElement("template");
template.innerHTML = `
    <style>
        .trips-container {
            margin-top: 5px;
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
            column-gap: 5px;
            row-gap: 5px;
        }
        .tripsCell {
            font-size: 16px;
            padding: 5px;
            flex-grow: 1;
            border: 1px solid var(--border-color-primary);
            border-radius: 5px;
            box-shadow: 1px 2px var(--border-color-primary);
        }
        .active {
            background-color: light-dark(var(--active), var(--active-dark));
        }
    </style>
    <div id="trips-container" class="trips-container">
    </div>    
`

export default class Trips extends HTMLElement {
    dateOptions = {
        dateStyle: 'medium'
    };

    constructor() {
        super();
        this.connected = false;
    }

    get addbutton() {
        return this.getAttribute("addbutton");
    }

    set addbutton(value) {
        this.setAttribute("addbutton", value);
    }

    connectedCallback() {
        console.log("Trips connected");
        this.addEventListener("load-trips", this.loadTrips);
        this.render();
    }

    render() {
        const clone = template.content.cloneNode(true);
        const addButton = document.getElementById(this.addbutton);
        if (addButton) {
            addButton.addEventListener("click", this.showTrip);
            addButton.tripObj = {};
            addButton.tripsElem = this;
        }
        this.append(clone);
    }

    showTrip(event) {
        let tripDlg = this.querySelector("trip-elem");
        if (!tripDlg) {
            tripDlg = document.createElement("trip-elem");
            event.currentTarget.tripsElem.appendChild(tripDlg);
        }
        tripDlg.loadTrip(event.currentTarget.tripObj);
        tripDlg.show();
    }

    loadTrips() {
        const trips = JSON.parse(sessionStorage.getItem("trips"));
        const trips_container = this.querySelector("#trips-container");
        trips_container.innerHTML = "";
        if (trips.length === 0) return;
        trips.forEach((trip, index) => {
            const div = document.createElement("div");
            div.id = `trip-div-${index}`;
            div.classList.add("tripsCell");
            if (trip.Active === "Yes") {
                div.classList.add("active");
            }
            div.addEventListener("click", this.showTrip);
            div.tripsElem = this;
            div.tripObj = trip;
            trips_container.appendChild(div);
            const name = document.createElement("h3");
            name.innerText = trip.TripName;
            div.appendChild(name);
            const startDate = new Date(trip.StartDate);
            const localStart = Intl.DateTimeFormat("en-GB", this.dateOptions).format(startDate);
            const endDate = new Date(trip.EndDate);
            const localEnd = Intl.DateTimeFormat("en-GB", this.dateOptions).format(endDate);
            const p = document.createElement("p");
            p.innerText = `${localStart} - ${localEnd}`;
            div.appendChild(p);
        });
    }

}

customElements.define("trips-elem", Trips);