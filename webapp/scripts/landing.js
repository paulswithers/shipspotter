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
        .landing-container {
            display: flex;
            flex-wrap: wrap;
            align-items: stretch;
            justify-content: center;
        }
        .landing-tile {
            margin: 5px;
            font-weight: bold;
            font-size: 30px;
            color: light-dark(var(--primary-color-dark), var(--primary-color));
            background-image: radial-gradient(circle at center, light-dark(var(--landing-tile-start),var(--landing-tile-start-dark)) 15%, light-dark(var(--landing-tile-end),var(--landing-tile-end-dark)) 100%);
            height: 200px;
            width: 200px;
            box-shadow: inset 0 0 2px 2px light-dark(var(--border-color-primary),var(--border-color-primary-dark));
            border-radius: 10px;
            flex-grow: 1;
            text-align: center;
            align-content: center;
            cursor: pointer;
        }
    </style>
    <div id="landing-container" class="landing-container">
    </div>
`;

export default class Landing extends HTMLElement {
    /**
     * Construct and render
     */

    constructor() {
        super();
        this.root = this.attachShadow({ mode: "closed" });
        let clone = template.content.cloneNode(true);
        this.root.append(clone);
        this.connected = false;
    }

    connectedCallback() {
        console.log("landing connected");
        this.render();
        this.connected = true;
    }

    get allTiles() {
        return JSON.parse(this.getAttribute("allTiles"));
    }

    set allTiles(value) {
        this.setAttribute("allTiles", value);
    }

    render() {
        console.log("Creating tiles");

        const landing_container = this.root.getElementById("landing-container");
        this.allTiles.forEach(element => {
            const tile = document.createElement("div");
            tile.id = `tile-${element.id}`;
            tile.className = "landing-tile";
            const span = document.createElement("p");
            span.className = "landing-anchor";
            span.innerHTML = element.label;
            tile.appendChild(span);
            tile.addEventListener("click", (event) => {
                console.log("Firing event for " + element.id);
                event.preventDefault();
                this.fireClickEvent(element.id, element.focus);
            })
            landing_container.appendChild(tile);
        });
    }

    fireClickEvent = (sectionId, focusField) => {
        const event = new CustomEvent("changeView", {
            bubbles: true,
            detail: {
                viewName: sectionId,
                focusField: focusField,
                style: "block"
            }
        })
        this.dispatchEvent(event);
    }
}

customElements.define("landing-elem", Landing);