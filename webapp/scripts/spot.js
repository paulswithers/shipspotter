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
import Ship from "./ship.js";

const template = document.createElement("template");
template.innerHTML = `
    <div class="input-group">
        <input type="text" autocomplete="spot-location" class="form-control" placeholder="Location" aria-label="Location" id="spot-location"/>
    </div>
    <div class="input-group">
        <select type="text" class="form-control" aria-label="Port of Origin" id="spot-port-from">
            <option value="" disabled selected>Port of Origin</option>
        </select>
        <select type="text" class="form-control" aria-label="Destination Port" id="spot-port-to">
            <option value="" disabled selected>Destination Port</option>
        </select>
    </div>
`

export default class Spot extends Ship {
    
    spotObj = {};
    saveShip = false;
    requiredFields = ["spot-location","ship-name","ship-call-sign","ship-type","ship-flag"]

    constructor() {
        super();
        /* By running in constructor rather than render, component is created
        before actionbutton attribute is observed, so updateButton has a
        component to act upon. If this is in render, we need to call 
        updateButton() at the end */
        this.baseSearch = this.doSearch;
        this.doSearch = () => {
            this.baseSearch();
        }
        let clone = template.content.cloneNode(true);
        if (this.prefix != "") {
            const matches = clone.querySelectorAll("[id^='spot']");
            matches.forEach(value => {
                value.id = this.prefix + value.id;
            })
        }
        this.append(clone);
        this.connected = false;
        this._ports = [];
    }

    connectedCallback() {
        console.log("spot connected");
        this.render();
        this.connected = true;
    }

    get searchid() {
        return this.getAttribute("searchid");
    }

    set searchid(value) {
        this.setAttribute("searchid", value);
    }

    get ports() {
        return this._ports;
    }

    set ports(value) {
        this._ports = value;
        const portFromSelect = this.querySelector(`#${this.prefix}spot-port-from`);
        const portToSelect = this.querySelector(`#${this.prefix}spot-port-to`);
        portFromSelect.options.length = 1;
        portToSelect.options.length = 1;
        this._ports.forEach((value) => {
            const fromOption = document.createElement("option");
            fromOption.value = value.Port;
            fromOption.innerHTML = value.Port;
            portFromSelect.append(fromOption);
            const toOption = document.createElement("option");
            toOption.value = value.Port;
            toOption.innerHTML = value.Port;
            portToSelect.append(toOption);
        });
        if (this.spotObj.PortFrom) {
            portFromSelect.value = this.spotObj.PortFrom;
        }
        if (this.spotObj.PortTo) {
            portToSelect.value = this.spotObj.PortTo;
        }
    }

    enableDisable(disableType) {
        super.enableDisable(disableType);
        const disableFields = disableType === "all";
        this.querySelector(`#${this.prefix}spot-location`).disabled = disableFields;
        this.querySelector(`#${this.prefix}spot-port-from`).disabled = disableFields;
        this.querySelector(`#${this.prefix}spot-port-to`).disabled = disableFields;
    }

    reset() {
        super.reset();
        this.spotObj = {};
        this.populateSpot();
    }
    
    updateButton() {
        const actionButton = document.querySelector(this.actionid);
        const newActionButton = actionButton.cloneNode(true);
        actionButton.parentNode.replaceChild(newActionButton, actionButton);
        const shipNameInput = this.querySelector(`#${this.prefix}ship-name`);
        const callSignInput = this.querySelector(`#${this.prefix}ship-call-sign`);
        const linesHelp = this.querySelector(`#${this.prefix}ship-lines-help`);
        switch(this.getAttribute("actionbutton")) {
            case "Edit":
                this.enableDisable("all");
                newActionButton.title = "Edit";
                newActionButton.ariaLabel = "Edit";
                newActionButton.innerText = "edit";
                newActionButton.addEventListener("click", this.doEdit, {once: true});
                try {
                    shipNameInput.removeEventListener("keydown", this.checkEnterDoSearch);
                    callSignInput.removeEventListener("keydown", this.checkEnterDoSearch);
                    linesHelp.removeEventListener("click", this.showLinesHelpDialog);
                } catch (error) {
                    // No eventlistener, no action
                }
                break;
            case "Save":
                this.enableDisable("none");
                newActionButton.title = "Save";
                newActionButton.ariaLabel = "Save";
                newActionButton.innerText = "save";
                newActionButton.addEventListener("click", this.doSave, {once: true});
                try {
                    shipNameInput.addEventListener("keydown", this.checkEnterDoSearch);
                    callSignInput.addEventListener("keydown", this.checkEnterDoSearch);
                    linesHelp.addEventListener("click", this.showLinesHelpDialog);
                    this.lines = this.lines;
                } catch (error) {
                    // No eventlistener, no action
                }
        }
    }
    
    doSave = () => {
        this.dispatchEvent(new CustomEvent("mask", { bubbles: true, detail: {show: true}}));
        if (!this.isValid()) {
            this.dispatchEvent(new CustomEvent("sendUserMessage", { bubbles: true, detail: {type: "error", message: "The fields marked are required"}}));
            this.dispatchEvent(new CustomEvent("mask", { bubbles: true, detail: {show: false}}));
            return;
        }
        if (!this.shipObj.hasOwnProperty("@meta")) {
            this.shipObj.Form = "Ship";
        }
        this.checkNoChange() ? this.saveShip = false : this.saveShip = true;
        this.updateShipObj();
        if (!this.spotObj.hasOwnProperty("@meta")) {
            this.spotObj.Form = "Spot";
        }
        this.checkNoSpotChange() ? this.saveSpot = false : this.saveSpot = true;
        // Update JSON object
        this.spotObj.Location = this.querySelector(`#${this.prefix}spot-location`).value;
        this.spotObj.PortFrom = this.querySelector(`#${this.prefix}spot-port-from`).value;
        this.spotObj.PortTo = this.querySelector(`#${this.prefix}spot-port-to`).value;
        this.spotObj.tripUNID = sessionStorage.getItem("activeTrip");
        // Need to get shipUnid
        this.dispatchEvent(new CustomEvent("saveShipSpot", { bubbles: true, detail: {spotElem: this}}));
    }

    isValid() {
        let uncompletedFields = [];
        this.requiredFields.forEach(field => {
            const fieldName = `#${this.prefix}${field}`;
            const input = this.querySelector(fieldName);
            input.classList.remove("required");
            if (input.value === "") {
                uncompletedFields.push(field);
                input.classList.add("required");
            }
        });
        return uncompletedFields.length === 0;
    }

    checkNoSpotChange() {
        return this.spotObj.Location === this.querySelector(`#${this.prefix}spot-location`).value &&
        this.spotObj.PortFrom === this.querySelector(`#${this.prefix}spot-port-from`).value && 
        this.spotObj.portTo === this.querySelector(`#${this.prefix}spot-port-to`).value;
    }
    
    populateSpot(spotObj) {
        if (spotObj) {
            this.querySelector(`#${this.prefix}spot-location`).value = spotObj.Location;
            this.querySelector(`#${this.prefix}spot-port-from`).value = spotObj.PortFrom;
            this.querySelector(`#${this.prefix}spot-port-to`).value = spotObj.PortTo;
        } else {
            this.querySelector(`#${this.prefix}spot-location`).value = "";
            this.querySelector(`#${this.prefix}spot-port-from`).value = "";
            this.querySelector(`#${this.prefix}spot-port-to`).value = "";
        }
    }

    render() {
        const actionButton = document.querySelector(this.searchid);
        actionButton.addEventListener("click", this.doSearch);
        const shipNameInput = this.querySelector(`#${this.prefix}ship-name`);
        const callSignInput = this.querySelector(`#${this.prefix}ship-call-sign`);
        shipNameInput.addEventListener("keydown", this.checkEnterDoSearch);
        callSignInput.addEventListener("keydown", this.checkEnterDoSearch);
        console.log("Loading Spot")
    }
}

customElements.define("spot-elem", Spot);