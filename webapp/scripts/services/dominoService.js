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
import BaseService from "./baseService.js";

const baseUrl = "https://YOUR_DOMINO_SERVER/api/v1";
const scope = "shipspot";
const urls = {
	login: "/auth",
	countries: `/lists/vwCountries?dataSource=${scope}&meta=false`,
	ports: `/lists/vwPorts?dataSource=${scope}&meta=false`,
	shipTypes: `/lists/%28luKeys%29?dataSource=${scope}&key=Ship Types&meta=false`,
	shipLines: `/lists/vwShipsByLine?dataSource=${scope}&scope=categories&meta=false`,
	ships: `/lists/vwShipsByName?dataSource=${scope}&documents=true`,
	trips: `/lists/vwTrips?dataSource=${scope}`,
	doc: `/document?dataSource=${scope}`,
	docExisting: `/document/UNID?dataSource=${scope}&mode=default`,
	spotsByShip: `/lists/%28luSpotsByShipUNID%29?dataSource=${scope}&meta=false&key=`,
	spotsByDate: `/query?dataSource=${scope}&action=execute`
};

export default class DominoService extends BaseService {
	constructor() {
		super(baseUrl, urls);
	}

	async login(user, pwd) {
		return await fetch(baseUrl + urls.login, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({ username: user, password: pwd })
		})
		.then((response) => response.json())
		.then((json) => {
			if (json.hasOwnProperty("status")) {
				return json.message;
			}
			if (this.extractCredentials(json)) {
				super.loadSessionData();
				return "success";
			}
		})
		.catch((err) => {
			return err.message;
		});
	}

	extractCredentials(json) {
		if (json.bearer) {
			let bearer = json.bearer;
			this.token = bearer;
			this.bubbleMessage("confirm", "Login successful");
			return true;
		} else {
			this.bubbleMessage("error", "Login failed");
			return false;
		}
	}

	async saveDoc(docObj, mode) {
		let docMethod = "POST";
		let url = urls.doc;
		if (docObj.hasOwnProperty("@meta")) {
			docMethod = "PUT";
			url = urls.docExisting.replace("UNID", docObj["@meta"].unid);
		} else if (docObj.hasOwnProperty("@unid")) {
			docMethod = "PUT";
			url = urls.docExisting.replace("UNID", docObj["@unid"]);
		}
		if (mode) {
			url = url + "&mode=" + mode;
		}
		return await fetch(baseUrl + url, {
			method: docMethod,
			headers: {
				"Content-Type": "application/json",
				"Authorization": `Bearer ${this.token}`
			},
			body: JSON.stringify(docObj)
		})
		.then((response) => response.json())
		.then((json) => {
			if (json.hasOwnProperty("status")) {
				return json.message;
			} else {
				console.log(json);
				return json;
			}
		})
		.catch((err) => {
			const failedDocs = JSON.parse(window.localStorage.getItem("failedDocs")) || [];
			failedDocs.push(shipObj);
			window.localStorage.setItem("failedDocs", JSON.stringify(failedDocs));
			return err.message;
		});
	}

	async saveDocAndMessage(docObj, label, mode) {
		const response = await window.dataService.saveDoc(docObj, mode);
		if (typeof(response) === "object") {
			this.bubbleMessage("confirm", "Successfully saved " + label);
		} else {
			this.bubbleMessage("error", "Failed to save " + label + ": " + response);
		}
	}

	async getSpotsForShip(shipunid) {
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
		return await fetch(baseUrl + this.urls.spotsByShip + shipunid, getParams)
			.then(response => response.json())
			.then(json => {
				if (json.hasOwnProperty("status")) {
					return json.message;
				} else {
					console.log(json);
					return json;
				}
			})
			.catch((err) => this.bubbleMessage("error", err.message))
	}

	async getSpotsByDate(startDate, endDate) {
		const headers = {
			"Accept": "application/json",
			"Content-Type": "application/json"
		};
		if (this.token != "") {
			headers.Authorization = `Bearer ${this.token}`;
		}
		const bodyObj = `{
			"forms": [
    "Spot"
  ],
  "includeFormAlias": true,
  "maxScanDocs": 500000,
  "maxScanEntries": 200000,
  "mode": "dql",
  "noViews": false,
  "query": "@Created >= @dt('${startDate}') and @Created <= @dt('${endDate}')",
  "timeoutSecs": 300,
  "viewRefresh": true
		}`;
		const getParams = {
			method: "POST",
			headers: headers,
			body: bodyObj
		};
		return await fetch(this.baseUrl + this.urls.spotsByDate, getParams)
			.then((response) => response.json())
			.then(json => {
				if (json.hasOwnProperty("status")) {
					return json.message;
				} else {
					console.log(json);
					return json;
				}
			})
			.catch((err) => this.bubbleMessage("error", err.message))
	}
}
