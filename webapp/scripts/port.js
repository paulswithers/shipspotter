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
    <dialog id="port-dialog" style="width: 60%; pointer-events: all; z-index: 999">
        <span id="port-dialog-save" class="material-icons material-button md-24" title="Save"
        role="img" aria-label="Save" style="float:right">save</span>
        <span id="port-dialog-close" class="material-icons material-button md-24" title="Close"
        role="img" aria-label="Close" style="float:right">cancel</span>
        <h2>New Port</h2>
        <div class="col dialog" style="width: 95%">
            <input type="text" autofocus class="form-control" placeholder="Port" aria-label="Port" id="port-name"/>
            <select type="text" class="form-control" aria-label="Country" id="port-country">
                <option value="" disabled selected>Country</option>
            </select>
        </div>
    </dialog>
`

export default class Port extends HTMLElement {

    constructor() {
        super();
        this._countries = [];
        this.connected = false;
    }

    connectedCallback() {
        console.log("port connected");
        this.render();
        this.connected = true;
    }

    get countries() {
        return this._countries;
    }

    set countries(value) {
        this._countries = value;
        const countrySelect = this.querySelector("#port-country");
        countrySelect.options.length = 1;
        value.forEach((value) => {
            const option = document.createElement("option");
            option.value = value.Country;
            option.innerHTML = value.Country;
            countrySelect.append(option);
        });
    }

    render() {
        console.log("rendering port elem");
        let dialogClone = template.content.cloneNode(true);
        this.append(dialogClone);
        this.addEventListeners();
    }

    show() {
        this.dispatchEvent(new CustomEvent("mask", { bubbles: true, detail: {show: true}}));
        const dialog = this.querySelector("#port-dialog");
        dialog.open = true;
        dialog.show();
        dialog.querySelector("#port-name").focus();
    }

    close() {
        const dialog = this.querySelector("#port-dialog");
        dialog.open = false;
        dialog.close();
        this.dispatchEvent(new CustomEvent("mask", { bubbles: true, detail: {show: false}}));
    }

    reset() {
        this.querySelector("#port-name").value = "";
        this.querySelector("#port-country").value = "";
    }

    addEventListeners() {
        const closeButton = this.querySelector("#port-dialog-close");
        closeButton.addEventListener('click', (event) => {
            this.close();
        });
        const saveButton = this.querySelector("#port-dialog-save");
        saveButton.addEventListener('click', (event) => {
            const saveEvent = new CustomEvent("save-port", {
                bubbles: true,
                detail: {
                    portElem: this,
                    port: {
                        Port: this.querySelector("#port-name").value,
                        Country: this.querySelector("#port-country").value,
                        Abbreviation: this.getAbbreviation(this.querySelector("#port-country").value)
                    }
                }
            })
            this.dispatchEvent(saveEvent);
        });
    }

    getAbbreviation = (country) => {
        const results = this._countries.filter(obj => obj.Country === country);
        return results[0].Abbreviation;
    }
}

customElements.define("port-elem", Port);