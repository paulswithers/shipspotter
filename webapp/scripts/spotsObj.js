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
const template = document.createElement("template");
template.innerHTML = `
    <style>
        .spots-container {
            margin-top: 5px;
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
            column-gap: 5px;
            row-gap: 5px;
        }
        .spotsCell {
            font-size: 16px;
            padding: 5px;
            flex-grow: 1;
            border: 1px solid var(--border-color-primary);
            border-radius: 5px;
            box-shadow: 1px 2px var(--border-color-primary);
        }
    </style>
    <div id="spots-container" class="spots-container">
    </div>
`;

export default class Spots extends HTMLElement {
    /**
     * Construct and render
     */

    dateOptions = {
        dateStyle: 'full',
        timeStyle: 'long',
    };

    constructor() {
        super();
        this.root = this.attachShadow({ mode: "closed" });
        this.connected = false;
    }

    connectedCallback() {
        console.log("landing connected");
        this.render();
        this.connected = true;
    }

    populateSpots(value) {
        const spots_container = this.root.getElementById("spots-container");
        spots_container.innerHTML = "";
        if (!value || value.length === 0) {
            const p = document.createElement("p");
            p.innerHTML = "No spots found";
            spots_container.appendChild(p)
        } else {
            value.forEach((spot, index) => {
                const div = document.createElement("div");
                div.id = spot.ShipUNID;
                spots_container.appendChild(div);
                const createdDate = new Date(spot.Created);
                const localDate = Intl.DateTimeFormat("en-GB", this.dateOptions).format(createdDate);
                div.id = `spot-div-${index}`;
                div.classList.add("spotsCell");
                const created = document.createElement("p");
                created.id = `spots-created-${index}`;
                created.innerHTML = `Created: ${localDate}`;
                div.appendChild(created);
                const details = document.createElement("p");
                this.createDetails(details, index, spot)
                div.appendChild(details);
            });
        }
    }

    createDetails(details, index, spot) {
        details.id = `spots-details-${index}`;
        if (spot.PortFrom != "" && spot.PortTo != "") {
            details.innerHTML = `From ${spot.PortFrom} to ${spot.PortTo}`;
        } else if (spot.PortFrom != "") {
            details.innerHTML = `From ${spot.PortFrom}, destination port not known`;
        } else if (spot.PortTo != "") {
            details.innerHTML = `Going to ${spot.PortTo}, origin port not known`;
        }
    }

    render() {
        console.log("Loading spots");
        const clone = template.content.cloneNode(true);
        this.root.append(clone);
    }

}

customElements.define("spots-elem", Spots);