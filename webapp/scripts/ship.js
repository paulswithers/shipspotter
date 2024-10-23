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
import Country from "./country.js";
import Spots from "./spotsObj.js";

const template = document.createElement("template");
template.innerHTML = `
<style>
    .line-help {
        background-color: light-dark(var(--form-background-color), var(--form-background-color-dark));
        padding: 2px;
        margin: 2px;
    }
</style>
    <div class="input-group">
        <input type="text" class="form-control" placeholder="Name" aria-label="Name" id="ship-name"/>
        <input type="text" class="form-control" placeholder="Call Sign" aria-label="Call Sign"
        autocapitalize="characters" id="ship-call-sign"/>
        <select type="text" class="form-control" aria-label="Ship Type" id="ship-type">
            <option value="" disabled selected>Ship Type<option>
        </select>
        <p style="margin: 0">
            <input type="text" class="form-control" placeholder="Line" aria-label="Line" id="ship-line" style="min-width:250px"></input>
            <span id="ship-lines-help" style="float:right" class="material-icons help"
                title="Help" role="img" aria-label="Show lines">help</span>
        </p>
    </div>
    <div class="input-group">
        <select type="text" class="form-control" aria-label="Flag" id="ship-flag">
            <option value="" disabled selected>Flag</option>
        </select>
        <input type="number" inputmode="numeric" class="form-control" placeholder="Year Built" aria-label="Year Built" id="ship-year-built"></input>
        <div>
            <input type="number" inputmode="numeric" step="0.01" class="form-control size" 
                placeholder="Length" aria-label="Length" id="ship-length"></input>
            x 
            <input type="number" inputmode="numeric" step="0.01" class="form-control size" 
                placeholder="Breadth" aria-label="Breadth" id="ship-breadth"></input>
        </div>
    </div>
`
const helpDialog = document.createElement("template");
helpDialog.innerHTML = `
    <dialog id="help-lines-dialog" style="width: 80%; z-index: 999">
        <button id="help-close" type="button" style="float:right">Close</button>
        <h2>Current Lines</h2>
        <div id="help-dialog-body" style="display: flex; flex-flow: row wrap">
        </div>
    </dialog>
`

const shipsDialog = document.createElement("template");
shipsDialog.innerHTML = `
    <dialog id="ships-options-dialog" style="width: 80%;; z-index: 999; pointer-events: all">
        <button id="ships-options-close" type="button" style="float:right">Close</button>
        <h2>Matching Ships</h2>
        <div id="ships-options-dialog-body" style="display:flex; flex-flow: row wrap">
            <div class="col" id="ships-dialog-col-left" style="flex-grow: 6">
            </div>
            <div class="col" id="ships-dialog-col-right" style="flex-grow: 6">
            </div>
        </div>
    </dialog>
`

export default class Ship extends HTMLElement {
    /**
     * Construct and render
     */

    watchFields = false;
    shipOptions = [];
    shipObj = {};
    ships = {};
    defaultActionButton = "";

    constructor() {
        super();
        /* By running in constructor rather than render, component is created
        before actionbutton attribute is observed, so updateButton has a
        component to act upon. If this is in render, we need to call 
        updateButton() at the end */
        const clone = template.content.cloneNode(true);
        if (this.prefix != "") {
            const matches = clone.querySelectorAll("[id^='ship']");
            matches.forEach(value => {
                value.id = this.prefix + value.id;
            })
        }
        this.append(clone);
        if (this.showspots === "true") {
            const spotsElem = document.createElement("spots-elem");
            spotsElem.style = "grid-column: 1 / -1;"
            this.appendChild(spotsElem);
        }
        const shipResetButton = document.getElementById(`${this.prefix}ship-search-clear`);
        shipResetButton.addEventListener("click", event => {
            event.preventDefault();
            this.reset();
        })
        let dialogClone = helpDialog.content.cloneNode(true);
        if (this.prefix != "") {
            const matches = dialogClone.querySelectorAll("[id^='help']");
            matches.forEach(value => {
                value.id = this.prefix + value.id;
            })
        }
        this.append(dialogClone);
        let shipOptionsDialogClone = shipsDialog.content.cloneNode(true);
        if (this.prefix != "") {
            const matches = shipOptionsDialogClone.querySelectorAll("[id^='ships']");
            matches.forEach(value => {
                value.id = this.prefix + value.id;
            })
        }
        this.append(shipOptionsDialogClone);
        const linesBtn = this.querySelector(`#${this.prefix}help-close`);
        linesBtn.addEventListener("click", (event) => {
            event.preventDefault();
            const dlg = this.querySelector(`#${this.prefix}help-lines-dialog`);
            dlg.open = false;
            dlg.close();
        });
        const shipOptionsButton = this.querySelector(`#${this.prefix}ships-options-close`);
        shipOptionsButton.addEventListener("click", (event) => {
            event.preventDefault();
            const dlg = this.querySelector(`#${this.prefix}ships-options-dialog`);
            dlg.open = false;
            dlg.close();
            this.dispatchEvent(new CustomEvent("mask", { bubbles: true, detail: {show: false}}));
        });
        this.connected = false;
        this._types = [];
        this._lines = [];
        this._flags = [];
    }

    connectedCallback() {
        console.log("ship connected");
        this.render();
        this.connected = true;
    }

    static get observedAttributes() {
        return ["actionbutton"];
    }

    get prefix() {
        return this.getAttribute("prefix") || "";
    }

    set prefix(value) {
        return this.setAttribute("prefix", value);
    }

    get showspots() {
        return this.getAttribute("showspots") || false;
    }

    set showspots(value) {
        this.setAttribute("showspots", value);
    }

    get types() {
        return this._types;
    }

    set types(value) {
        this._types = value;
        const shipTypeSelect = this.querySelector(`#${this.prefix}ship-type`);
        shipTypeSelect.options.length = 1;
        value.forEach((value) => {
            const option = document.createElement("option");
            option.value = value;
            option.innerHTML = value;
            shipTypeSelect.append(option);
        });
        if (this.shipObj.Type) {
            shipTypeSelect.value = this.shipObj.Type;
        }
    }

    get lines() {
        return this._lines;
    }

    set lines(value) {
        this._lines = value;
        const dialogLines = this.querySelector(`#${this.prefix}help-dialog-body`);
        const shipElem = this;
        dialogLines.innerHTML = "";
        this.lines.forEach((value) => {
            if ("Save" === this.getAttribute("actionbutton")) {
                const lineLink = document.createElement("a");
                lineLink.className = "line-help";
                lineLink.href = "#";
                lineLink.innerText = value;
                lineLink.addEventListener("click", (event) => {
                    shipElem.querySelector(`#${this.prefix}ship-line`).value = lineLink.innerText;
                    const dialog = this.querySelector(`#${this.prefix}help-lines-dialog`);
                    dialog.open = false;
                    dialog.close();
                });
                dialogLines.append(lineLink);
            } else {
                const lineSpan = document.createElement("span");
                lineSpan.className = "line-help";
                lineSpan.innerText = value;
                dialogLines.append(lineSpan);
            }
        });
    }

    get flags() {
        return this._flags;
    }

    set flags(value) {
        this._flags = value;
        const flagSelect = this.querySelector(`#${this.prefix}ship-flag`);
        flagSelect.options.length = 1;
        value.forEach((value) => {
            const option = document.createElement("option");
            option.value = value.Abbreviation;
            option.innerHTML = value.Country;
            flagSelect.append(option);
        });
        if (this.shipObj.Flag) {
            flagSelect.value = this.shipObj.Flag;
        }
    }

    get search() {
        return this.getAttribute("search")|| false;
    }

    set search(value) {
        this.setAttribute("search", value.toLowerCase === "true");
    }

    get actionid() {
        return this.getAttribute("actionid");
    }

    set actionid(value) {
        this.setAttribute("actionid", value);
    }

    // Action, used to change what the button should do
    get actionbutton() {
        return this.getAttribute("actionButton");
    }

    set actionbutton(value) {
        this.setAttribute("actionButton", value);
    }

    attributeChangedCallback(name, oldValue, newValue) {
        switch (name) {
            case "actionbutton":
                if (this.defaultActionButton === "") this.defaultActionButton = newValue;
                this.updateButton();
                break;
        }
    }

    enableDisable(disableType) {
        const disableNameCallSign = disableType === "all";
        const disableOthers = disableType != "none";
        this.querySelector(`#${this.prefix}ship-name`).disabled = disableNameCallSign;
        this.querySelector(`#${this.prefix}ship-call-sign`).disabled = disableNameCallSign;
        this.querySelector(`#${this.prefix}ship-type`).disabled = disableOthers;
        this.querySelector(`#${this.prefix}ship-line`).disabled = disableOthers;
        this.querySelector(`#${this.prefix}ship-flag`).disabled = disableOthers;
        this.querySelector(`#${this.prefix}ship-year-built`).disabled = disableOthers;
        this.querySelector(`#${this.prefix}ship-length`).disabled = disableOthers;
        this.querySelector(`#${this.prefix}ship-breadth`).disabled = disableOthers;
    }

    reset() {
        this.shipObj = {};
        this.populateShip();
        this.actionbutton = this.defaultActionButton;
    }

    updateButton() {
        const actionButton = document.querySelector(this.actionid);
        const newActionButton = actionButton.cloneNode(true);
        actionButton.parentNode.replaceChild(newActionButton, actionButton);
        const shipNameInput = this.querySelector(`#${this.prefix}ship-name`);
        const callSignInput = this.querySelector(`#${this.prefix}ship-call-sign`);
        const linesHelp = this.querySelector(`#${this.prefix}ship-lines-help`);
        switch(this.getAttribute("actionbutton")) {
            case "Search":
                this.enableDisable("search");
                newActionButton.title="Search";
                newActionButton.ariaLabel = "Search";
                newActionButton.innerText = "search";
                newActionButton.addEventListener("click", this.doSearch);
                shipNameInput.addEventListener("keydown", this.checkEnterDoSearch);
                callSignInput.addEventListener("keydown", this.checkEnterDoSearch);
                try {
                    linesHelp.removeEventListener("click", this.showLinesHelpDialog);
                } catch (error) {
                    // No eventlistener, no action
                }
                break;
            case "Edit":
                this.enableDisable("all");
                newActionButton.title = "Edit";
                newActionButton.ariaLabel = "Edit";
                newActionButton.innerText = "edit";
                newActionButton.addEventListener("click", this.doEdit, {once: true});
                try {
                    shipNameInput.removeEventListener("keydown", this.checkEnterDoSearch);
                    callSignInput.removeEventListener("keydown", this.checkEnterDoSearch);
                    linesHelp.addEventListener("click", this.showLinesHelpDialog);
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

    doEdit = () => {
        this.setAttribute("actionbutton", "Save");
    }
    
    doSave = () => {
        this.dispatchEvent(new CustomEvent("mask", { bubbles: true, detail: {show: true}}));
        if (!this.shipObj.hasOwnProperty("@meta")) {
            this.shipObj.Form = "Ship";
        }
        if (this.checkNoChange()) {
            this.dispatchEvent(new CustomEvent("sendUserMessage", { bubbles: true, detail: {type: "error", message: "No change to ship, cancelling save"}}));
            this.dispatchEvent(new CustomEvent("mask", { bubbles: true, detail: {show: false}}));
            return;
        }
        this.updateShipObj();
        this.saveShip = true;
        this.dispatchEvent(new CustomEvent("saveShip", { bubbles: true, detail: {shipElem: this}}));
    }

    updateShipObj() {
        // Update JSON object
        this.shipObj.Ship = this.querySelector(`#${this.prefix}ship-name`).value;
        this.shipObj.CallSign = this.querySelector(`#${this.prefix}ship-call-sign`).value;
        this.shipObj.Type = this.querySelector(`#${this.prefix}ship-type`).value;
        this.shipObj.Line = this.querySelector(`#${this.prefix}ship-line`).value;
        this.shipObj.Flag = this.querySelector(`#${this.prefix}ship-flag`).value;
        this.shipObj.YearBuilt = this.querySelector(`#${this.prefix}ship-year-built`).value;
        this.shipObj.Size = this.querySelector(`#${this.prefix}ship-length`).value + " x "
            + this.querySelector(`#${this.prefix}ship-breadth`).value;
    }

    checkNoChange() {
        return this.shipObj.Ship === this.querySelector(`#${this.prefix}ship-name`).value &&
        this.shipObj.CallSign === this.querySelector(`#${this.prefix}ship-call-sign`).value &&
        this.shipObj.Type === this.querySelector(`#${this.prefix}ship-type`).value &&
        this.shipObj.Line === this.querySelector(`#${this.prefix}ship-line`).value &&
        this.shipObj.Flag === this.querySelector(`#${this.prefix}ship-flag`).value &&
        this.shipObj.YearBuilt === this.querySelector(`#${this.prefix}ship-year-built`).value &&
        this.shipObj.Size === this.querySelector(`#${this.prefix}ship-length`).value + " x "
        + this.querySelector(`#${this.prefix}ship-breadth`).value;
    }
    
    checkEnterDoSearch = (event) => {
        if (event.key == "Enter") {
            this.doSearch();
        }
    };

    showLinesHelpDialog = (event) => {
        event.preventDefault();
        const dlg = this.querySelector(`#${this.prefix}help-lines-dialog`);
        dlg.open = true;
        dlg.show();
    }

    doSearch = () => {
        this.shipOptions = [];
        const shipName = this.querySelector(`#${this.prefix}ship-name`).value;
        const pattern = new RegExp(shipName.toLowerCase());
        const callSign = this.querySelector(`#${this.prefix}ship-call-sign`).value;
        const results = this.ships.filter(obj => (shipName != "") ? pattern.test(obj.Ship.toLowerCase()) : obj.CallSign === callSign);
        if (results.length === 0) {
            this.dispatchEvent(new CustomEvent("sendUserMessage", { bubbles: true, detail: {type: "error", message: "No ships found matching criteria"}}));
        } else {
            if (results.length === 1) {
                this.populateShip(results[0]);
                this.shipObj = results[0];
                this.setAttribute("search", false);
                this.setAttribute("actionbutton", (this.prefix === "") ? "Edit" : "Save");
            } else {
                this.shipOptions = results;
                const shipOptionsDialog = this.querySelector(`#${this.prefix}ships-options-dialog`);
                const shipsColLeft = shipOptionsDialog.querySelector(`#${this.prefix}ships-dialog-col-left`);
                shipsColLeft.innerHTML = "";
                const shipsColRight = shipOptionsDialog.querySelector(`#${this.prefix}ships-dialog-col-right`);
                shipsColRight.innerHTML = "";
                results.forEach((ship, index) => {
                    const col = (index % 2 === 0) ? shipsColLeft : shipsColRight;
                    const a = document.createElement("a");
                    a.href = "#";
                    a.innerHTML = ship.Ship + " - " + ship.CallSign;
                    a.addEventListener("click", (event) => {
                        event.preventDefault();
                        this.populateShip(ship);
                        this.shipObj = ship;
                        const dialog = event.target.closest(`#${this.prefix}ships-options-dialog`);
                        dialog.open = false;
                        dialog.close();
                        this.setAttribute("search", false);
                        this.setAttribute("actionbutton", (this.prefix === "") ? "Edit" : "Save");
                        this.dispatchEvent(new CustomEvent("mask", { bubbles: true, detail: {show: false}}));
                    });
                    col.append(a);
                });
                this.dispatchEvent(new CustomEvent("mask", { bubbles: true, detail: {show: true}}));
                shipOptionsDialog.open = true;
                shipOptionsDialog.show();
            }
        }
    }
    
    populateShip(shipObj) {
        if (shipObj) {
            this.querySelector(`#${this.prefix}ship-name`).value = shipObj.Ship;
            this.querySelector(`#${this.prefix}ship-call-sign`).value = shipObj.CallSign;
            this.querySelector(`#${this.prefix}ship-type`).value = shipObj.Type;
            this.querySelector(`#${this.prefix}ship-line`).value = shipObj.Line;
            this.querySelector(`#${this.prefix}ship-flag`).value = shipObj.Flag;
            this.querySelector(`#${this.prefix}ship-year-built`).value = shipObj.YearBuilt;
            if (shipObj.Size != "") {
                const sizeArr = shipObj.Size.split("x");
                this.querySelector(`#${this.prefix}ship-length`).value = sizeArr[0].trim();
                this.querySelector(`#${this.prefix}ship-breadth`).value = sizeArr[1].trim();

            }
            if (this.showspots) {
                this.dispatchEvent(new CustomEvent("loadSpots", { bubbles: true, detail: {shipElem: this, shipunid: shipObj["@meta"].unid}}));
            }
        } else {
            this.querySelector(`#${this.prefix}ship-name`).value = "";
            this.querySelector(`#${this.prefix}ship-call-sign`).value = "";
            this.querySelector(`#${this.prefix}ship-type`).value = "";
            this.querySelector(`#${this.prefix}ship-line`).value = "";
            this.querySelector(`#${this.prefix}ship-flag`).value = "";
            this.querySelector(`#${this.prefix}ship-year-built`).value = "";
            this.querySelector(`#${this.prefix}ship-length`).value = "";
            this.querySelector(`#${this.prefix}ship-breadth`).value = "";
            if (this.showspots) {
                this.dispatchEvent(new CustomEvent("clearSpots", { bubbles: true, detail: {shipElem: this}}));
            }
        }
    }

    render() {
        console.log("creating ship");
    }
}

customElements.define("ship-elem", Ship);