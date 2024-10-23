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
    <dialog id="country-dialog" style="width: 60%; pointer-events: all; z-index: 999">
        <span id="country-dialog-save" class="material-icons material-button md-24" title="Save"
        role="img" aria-label="Save" style="float:right">save</span>
        <span id="country-dialog-close" class="material-icons material-button md-24" title="Close"
        role="img" aria-label="Close" style="float:right">cancel</span>
        <h2>New Country</h2>
        <div class="col dialog" style="width: 95%">
            <input type="text" autofocus class="form-control" placeholder="Country" aria-label="Country" id="country-name"/>
            <input type="text" class="form-control" placeholder="Abbreviation" aria-label="Abbreviation"
            autocapitalize="characters" id="country-abbreviation"/>
        </div>
    </dialog>
`

export default class Country extends HTMLElement {

    constructor() {
        super();
        this.connected = false;
    }

    connectedCallback() {
        console.log("country connected");
        this.render();
        this.connected = true;
    }

    render() {
        console.log("rendering country elem");
        let dialogClone = template.content.cloneNode(true);
        this.append(dialogClone);
        this.addEventListeners();
    }

    show() {
        this.dispatchEvent(new CustomEvent("mask", { bubbles: true, detail: {show: true}}));
        const dialog = this.querySelector("#country-dialog");
        dialog.open = true;
        dialog.show();
        dialog.querySelector("#country-name").focus();
    }

    close() {
        const dialog = this.querySelector("#country-dialog");
        dialog.open = false;
        dialog.close();
        this.dispatchEvent(new CustomEvent("mask", { bubbles: true, detail: {show: false}}));
    }

    reset() {
        this.querySelector("#country-name").value = "";
        this.querySelector("#country-abbreviation").value = "";
    }

    addEventListeners() {
        const closeButton = this.querySelector("#country-dialog-close");
        closeButton.addEventListener('click', (event) => {
            this.close();
        });
        const saveButton = this.querySelector("#country-dialog-save");
        saveButton.addEventListener('click', (event) => {
            const saveEvent = new CustomEvent("save-country", {
                bubbles: true,
                detail: {
                    countryElem: this,
                    country: {
                        Country: this.querySelector("#country-name").value,
                        Abbreviation: this.querySelector("#country-abbreviation").value
                    }
                }
            })
            this.dispatchEvent(saveEvent);
        });
    }
}

customElements.define("country-elem", Country);