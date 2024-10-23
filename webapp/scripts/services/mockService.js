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

const mockUrls = {
	countries: "data/countries.json",
	ports: "data/ports.json",
	shipTypes: "data/shipTypes.json",
	shipLines: "data/shipLines.json",
	ships: "data/ships.json",
	trips: "data/trips.json",
	spotsByShip: "data/spotsByShip.json",
	spotsByDate: "data/spotsByDate.json"
};

export default class MockService extends BaseService {
	constructor() {
		super("", mockUrls);
	}

	async login(user, pwd) {
		window.isMock = true;
		this.bubbleMessage("confirm", "Login successful");
		super.loadSessionData();
		return "success";
	}

	async getSpotsForShip(shipunid) {
		const headers = {
			Accept: "application/json",
		};
		const getParams = {
			method: "GET",
			headers: headers,
		};
		return await fetch(this.baseUrl + this.urls.spotsByShip, getParams)
			.then((response) => response.json())
			.then(json => {
				const matchingJson = json.filter(obj => obj.ShipUNID === shipunid);
				return matchingJson;
			})
			.catch((err) => this.bubbleMessage("error", err.message))
	}

	async getSpotsByDate(startDate, endDate) {
		const startDt = new Date(startDate);
		const endDt = new Date(endDate);
		endDt.setDate(endDt.getDate() + 1);
		const headers = {
			Accept: "application/json",
		};
		const getParams = {
			method: "GET",
			headers: headers,
		};
		return await fetch(this.baseUrl + this.urls.spotsByDate, getParams)
			.then((response) => response.json())
			.then(json => {
				return json.filter(obj => {
					const dt = new Date(obj.Created);
					return dt >= startDt && dt <= endDt;
				})
			})
			.catch((err) => this.bubbleMessage("error", err.message))
	}
}
