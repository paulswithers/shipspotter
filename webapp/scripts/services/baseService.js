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
export default class BaseService {
	constructor(baseUrl, urls) {
		this._baseUrl = baseUrl;
		this._urls = urls;
		this._token = "";
	}

	get baseUrl() {
		return this._baseUrl;
	}

	get urls() {
		return this._urls;
	}

	get token() {
		return this._token;
	}

	set token(value) {
		this._token = value;
	}

	async loadSessionData() {
		const headers = {
			Accept: "application/json",
		};
		if (this.token != "") {
			headers.Authorization = `Bearer ${this.token}`;
		}
		const getParams = {
			method: "GET",
			headers: headers,
		};
		const responses = Promise.all([
			fetch(this.baseUrl + this.urls.countries, getParams)
				.then((response) => response.json())
				.catch((err) => this.bubbleMessage("error", err.message)),
			fetch(this.baseUrl + this.urls.ports, getParams)
				.then((response) => response.json())
				.catch((err) => this.bubbleMessage("error", err.message)),
			fetch(this.baseUrl + this.urls.shipTypes, getParams)
				.then((response) => response.json())
				.catch((err) => this.bubbleMessage("error", err.message)),
			fetch(this.baseUrl + this.urls.shipLines, getParams)
				.then((response) => response.json())
				.catch((err) => this.bubbleMessage("error", err.message)),
			fetch(this.baseUrl + this.urls.ships, getParams)
				.then((response) => response.json())
				.catch((err) => this.bubbleMessage("error", err.message)),
			fetch(this.baseUrl + this.urls.trips, getParams)
				.then((response) => response.json())
				.catch((err) => this.bubbleMessage("error", err.message))
		]).then((responses) => {
			const countries = responses[0];
			sessionStorage.setItem("countries", JSON.stringify(countries));
            this.bubbleMessage("confirm", "Loaded countries");
			const ports = responses[1];
			sessionStorage.setItem("ports", JSON.stringify(ports));
            this.bubbleMessage("confirm", "Loaded ports");
			const shipTypes = responses[2][0].Values;
			const jsonLines = responses[3];
			const linesArray = jsonLines.map((lineEnt) => lineEnt.Line);
			sessionStorage.setItem("lines", JSON.stringify(linesArray));
            this.bubbleMessage("confirm", "Loaded lines");
            const ships = responses[4];
			localStorage.setItem("ships", JSON.stringify(ships));
            this.bubbleMessage("confirm", "Loaded ships");
			const trips = responses[5];
			sessionStorage.setItem("trips", JSON.stringify(trips));
			getActiveTrip(trips);
			this.bubbleMessage("confirm", "Loaded trips");
			const shipElems = document.getElementsByTagName("ship-elem");
			for (let i = 0; i < shipElems.length; i++) {
				shipElems[i].types = shipTypes;
				shipElems[i].lines = linesArray;
				shipElems[i].flags = countries;
                shipElems[i].ships = ships;
			}
			const spotElems = document.getElementsByTagName("spot-elem");
			for (let i = 0; i < spotElems.length; i++) {
				spotElems[i].types = shipTypes;
				spotElems[i].lines = linesArray;
				spotElems[i].flags = countries;
                spotElems[i].ships = ships;
				spotElems[i].ports = ports;
			}
			const portElem = document.getElementsByTagName("port-elem");
			for (let i = 0; i < portElem.length; i++) {
				portElem[i].countries = countries;
			}
			const tripsElem = document.getElementsByTagName("trips-elem");
			for (let i = 0; i < tripsElem.length; i++) {
				tripsElem[i].loadTrips();
			}
		});

		window.onbeforeunload = function () {
			window.localStorage.removeItem("ships");
		};
	}

	bubbleMessage(type, message) {
		const messageObj = {
			"type": type,
			"message": message
		};
		document.dispatchEvent(new CustomEvent("sendUserMessage", { bubbles: true, detail: messageObj}));
		
	}
}

const getActiveTrip = (trips) => {
	const active = trips.filter(obj => obj.Active === "Yes");
	sessionStorage.setItem("activeTrip", active[0]["@unid"]);
}
