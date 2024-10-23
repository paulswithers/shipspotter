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
<dialog id="trip-dialog" style="width: 60%; pointer-events: all; z-index: 999">
    <span id="trip-dialog-save" class="material-icons material-button md-24" title="Save"
    role="img" aria-label="Save" style="float:right">save</span>
    <span id="trip-dialog-close" class="material-icons material-button md-24" title="Close"
    role="img" aria-label="Close" style="float:right">cancel</span>
    <h2></h2>
    <div class="col dialog" style="width: 95%">
        <input type="text" autofocus class="form-control" placeholder="Name" aria-label="Name" id="trip-name" />
        <input type="date" class="form-control" placeholder="Start Date" aria-label="Start Date" id="trip-start" />
        <input type="date" class="form-control" placeholder="End Date" aria-label="End Date" id="trip-end" />
        <input type="checkbox" class="checkbox" id="trip-active" />
    </div>
</dialog>
`

export default class Trip extends HTMLElement {
    tripObj = {};

    constructor() {
        super();
        this.connected = false;
    }

    connectedCallback() {
        console.log("trip connected");
        this.render();
        this.connected = true;
    }

    render() {
        console.log("rendering port elem");
        let dialogClone = template.content.cloneNode(true);
        this.append(dialogClone);
        this.addEventListeners();
    }

    show() {
        this.dispatchEvent(new CustomEvent("mask", { bubbles: true, detail: {show: true}}));
        const dialog = this.querySelector("#trip-dialog");
        dialog.open = true;
        dialog.show();
        dialog.querySelector("#trip-name").focus();
    }

    close() {
        const dialog = this.querySelector("#trip-dialog");
        dialog.open = false;
        dialog.close();
        this.dispatchEvent(new CustomEvent("mask", { bubbles: true, detail: {show: false}}));
    }

    loadTrip(tripObj) {
        this.tripObj = tripObj;
        if (tripObj.TripName) {
            this.querySelector("#trip-name").value = tripObj.TripName;
            this.querySelector("#trip-start").value = tripObj.StartDate.substring(0,10);
            this.querySelector("#trip-end").value = tripObj.EndDate.substring(0,10);
            if (tripObj.Active === "Yes") {
                this.querySelector("#trip-active").checked = true;
            }
        }
    }

    addEventListeners() {
        const closeButton = this.querySelector("#trip-dialog-close");
        closeButton.addEventListener('click', (event) => {
            this.close();
        });
        const saveButton = this.querySelector("#trip-dialog-save");
        saveButton.addEventListener('click', (event) => {
            const active = (this.querySelector("#trip-active").value === "on") ? "Yes" : "No";
            const saveEvent = new CustomEvent("save-trip", {
                bubbles: true,
                detail: {
                    tripElem: this,
                    trip: {
                        TripName: this.querySelector("#trip-name").value,
                        StartDate: this.querySelector("#trip-start").value,
                        EndDate: this.querySelector("#trip-end").value,
                        Active: active
                    }
                }
            })
            this.dispatchEvent(saveEvent);
        });
    }
}

customElements.define("trip-elem", Trip);