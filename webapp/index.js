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
import MockService from "./scripts/services/mockService.js";
import DominoService from "./scripts/services/dominoService.js";
import Landing from "./scripts/landing.js";
import Ship from "./scripts/ship.js";
import Spot from "./scripts/spot.js";
import Port from "./scripts/port.js";
import ShipSpot from "./scripts/shipSpotsObj.js";
import Trips from "./scripts/trips.js";

const spaSections = ["credentials", "landing", "new-spot", "spot-search", "ship-search", "trips"];

const allTiles=[
    {id: "new-spot", label: "New Spot", "focus": "spot-ship-name"},
    {id: "spot-search", label: "Find Spot", "focus": ""},
    {id: "ship-search", label: "Find Ship", "focus": "ship-name"},
    {id: "trips", label: "Trips", "focus": ""}
];

const login = async (user, pwd) => {
	// Set as mocking only
	if (user === "John Doe") {
		window.dataService = new MockService();
	} else {
		window.dataService = new DominoService();
	}
	const result = await window.dataService.login(user, pwd);
	if (result === "success") {
		const landing = document.querySelector("#landing");
		const landingContainer = document.createElement("landing-elem");
		landingContainer.allTiles = JSON.stringify(allTiles);
		landing.append(landingContainer);
		toggleSPA("landing", "block");
	} else {
		statusError(result);
	}
};

const formLogin = () => {
	addMask();
	const username = document.getElementById("username-input").value;
	const password = document.getElementById("password-input").value;
	login(username, password).then(() => {
		removeMask();
	});
};

const switchTheme = (switchTheme) => {
	// localStorage is only a string
	let hasSetDarkMode = localStorage.getItem("shipSpotterLightDark");
	let darkMode = hasSetDarkMode === "true";
	if (hasSetDarkMode === null) {
		if (window.matchMedia) {
			const themeQuery = window.matchMedia('(prefers-color-scheme: dark)');
			if (themeQuery.matches) {
				localStorage.setItem("shipSpotterLightDark", "true");
				darkMode = true;
			}
		}
	}
	if (switchTheme) {
		darkMode = !darkMode;
		localStorage.setItem("shipSpotterLightDark", darkMode);
	}
	const toggle = document.getElementById("themeToggle");
	if (darkMode) {
		document.documentElement.classList.add("dark-mode");
		document.documentElement.classList.remove("light-mode");
		toggle.innerText = "light_mode";
	} else {
		document.documentElement.classList.add("light-mode");
		document.documentElement.classList.remove("dark-mode");
		toggle.innerText = "dark_mode";
	}
};

const statusMsg = (statusText) => {
	document.getElementById("message").innerText = statusText;
	document.getElementById("message").style =
		"color: light-dark(var(--message), var(--success-message-dark))";
	document.getElementById("status-message").style =
		"background-color: light-dark(var(--success-message-dark), var(--message))";
	setTimeout(clearMsg, 3000);
};

const statusError = (err) => {
	document.getElementById("message").innerText = err;
	document.getElementById("message").style =
		"color: light-dark(var(--message), var(--error-message-dark))";
	document.getElementById("status-message").style =
		"background-color: light-dark(var(--error-message-dark), var(--message))";
	setTimeout(clearMsg, "3000");
};

const clearMsg = () => {
	document.getElementById("message").innerText = "";
	document.getElementById("status-message").removeAttribute("style");
};

const addMask = () => {
	document.querySelector(".container").classList.add("container-mask");
}

const removeMask = () => {
	document.querySelector(".container").classList.remove("container-mask");
}

const bootstrap = () => {
	const themeSwitcher = document.getElementById("themeToggle");
	themeSwitcher.addEventListener("click", function () {
		switchTheme(true);
	});
	switchTheme(false);
	captureClickEvent("login-btn", formLogin);
	const password_field = document.getElementById("password-input");
		password_field.addEventListener("keydown", (event) => {
			if (event.key == "Enter") {
				formLogin();
			}
		})
	captureClickEvent("ship-search-back", (event) => {
		toggleSPA("landing", "block");
		const element = document.getElementById("ship-search");
		const ship = element.querySelector("ship-elem");
		ship.reset();
	});
	captureClickEvent("spot-search-back", (event) => {
		toggleSPA("landing", "block");
	});
	captureClickEvent("spot-back", (event) => {
		toggleSPA("landing", "block");
		const element = document.getElementById("new-spot");
		const spot = element.querySelector("spot-elem");
		spot.reset();
	});
	captureClickEvent("trip-back", (event) => {
		toggleSPA("landing", "block");
	});
	const countryElem = document.createElement("country-elem");
	document.querySelector('#header').append(countryElem);
	captureClickEvent("ship-country-action", function() {
		countryElem.show();
	})
	captureClickEvent("spot-country-action", function() {
		countryElem.show();
	})
	const portElem = document.createElement("port-elem");
	document.querySelector("#header").append(portElem);
	captureClickEvent("spot-port-action", function() {
		portElem.show();
	})
	registerCustomEvents();
	toggleSPA("credentials", "block");
};

const captureClickEvent = (elementId, processFunction) => {
	const element = document.getElementById(elementId);
	if (element) {
	  element.addEventListener('click', (event) => {
		event.preventDefault();
		processFunction();
	  });
	} else {
	  console.error(`Element ${elementId} not found`);
	}
  };

const toggleSPA = (showme, how) => {
	spaSections.forEach((s) => {
		const display = showme === s ? how : "none";
		document.getElementById(s).style.display = display;
	});
};

// BEGIN CUSTOM EVENT ACTIONS
const registerCustomEvents = () => {
	document.addEventListener("changeView", changeView);
	document.addEventListener("sendUserMessage", bubbleMessage);
	document.addEventListener("mask", showHideMask);
	document.addEventListener("saveShip", saveShip);
	document.addEventListener("saveShipSpot", saveShipSpot);
	document.addEventListener("save-country", saveCountry);
	document.addEventListener("save-port", savePort);
	document.addEventListener("save-trip", saveTrip);
	document.addEventListener("loadSpots", loadSpots);
	document.addEventListener("clearSpots", clearSpots);
	document.addEventListener("loadSpotsByDate", loadSpotsByDate);
	document.addEventListener("showShip", showShip);
	document.addEventListener("showSpot", showSpot);
}

const changeView = (event) => {
	toggleSPA(event.detail.viewName, event.detail.style);
	if (event.detail.focusField != "") {
		const page = document.getElementById(event.detail.viewName);
		const field = page.querySelector(`#${event.detail.focusField}`);
		if (field) field.focus();
	}
}

const bubbleMessage = (event) => {
	if (event.detail.type === "error") {
		statusError(event.detail.message);
		removeMask();
	} else if (event.detail.type === "confirm") {
		statusMsg(event.detail.message);
	} else {
		console.log("Unexpected message type: " + event.detail.type);
	}
}

const showHideMask = (event) => {
	if (event.detail.show) {
		addMask();
	} else {
		removeMask();
	}
}

const saveShip = async (event) => {
	const shipElem = event.detail.shipElem;
	await saveSpotShipObj(shipElem);
	shipElem.setAttribute("actionbutton", "Edit");
	shipElem.reset();
	removeMask();
}

async function saveSpotShipObj(shipSpotElem) {
	let shipObj = shipSpotElem.shipObj;
	const unid = (shipObj.hasOwnProperty("@meta")) ? shipObj["@meta"].unid : "";
	const ships = JSON.parse(window.localStorage.getItem("ships"));
	const spotObj = shipSpotElem.spotObj;
	if (shipSpotElem.saveShip) {
		const nameResults = ships.filter(obj => shipObj.Ship.toLowerCase() === obj.Ship.toLowerCase() && obj["@meta"].unid != unid);
		const callsignResults = ships.filter(obj => obj.CallSign === shipObj.CallSign && obj["@meta"].unid != unid);
		if (nameResults.length > 0) {
			statusError("A Ship with this name already exists");
			removeMask();
			return false;
		}
		if (callsignResults.length > 0) {
			statusError("A Ship with this callsign already exists");
			removeMask()
			return false;
		}
		window.localStorage.setItem("ships", JSON.stringify(ships));
	}
	if (window.isMock) {
		if (shipSpotElem.saveSpot === undefined) {
			shipSpotElem.setAttribute("actionbutton", "Edit");
		}
		statusMsg("Successfully saved " + shipObj.Ship);
		if (shipSpotElem.saveSpot) {
			window.localStorage.setItem("savedSpot", JSON.stringify(spotObj));
			statusMsg("Successfully saved spot");
		}
		shipSpotElem.reset();
	} else {
		if (shipSpotElem.saveShip) {
			const response = await window.dataService.saveDoc(shipObj);
			if (typeof(response) === "object") {
				shipObj = response;
				statusMsg("Successfully saved " + shipObj.Ship);
				if (unid != "") {
					ships.map((ship) => {
						if (ship["@meta"].unid === unid) {
							ship.Ship = shipObj.Ship;
							ship.CallSign = shipObj.CallSign;
							ship.Type = shipObj.Type;
							ship.Line = shipObj.Line;
							ship.Flag = shipObj.Flag;
							ship.YearBuilt = shipObj.YearBuilt;
							ship.Size = shipObj.Size;
						}
					});
				} else {
					ships.push(shipObj);
				}
				updateShips(ships);
				if (shipSpotElem.saveSpot) {
					spotObj.ShipUNID = shipObj["@meta"].unid;
					const spotResponse = await window.dataService.saveDoc(spotObj);
					if (typeof(spotResponse) === "object") {
						statusMsg("Successfully saved spot");
						shipSpotElem.reset();
					} else {
						statusError("Failed to save spot: " + spotResponse);
						return false;
					}
				}
			} else {
				statusError("Failed to save " + shipObj.Ship + ": " + response);
				return false;
			}
		} else {
			spotObj.ShipUNID = shipObj["@meta"].unid;
			const spotResponse = await window.dataService.saveDoc(spotObj);
			if (typeof(spotResponse) === "object") {
				statusMsg("Successfully saved spot");
				shipSpotElem.reset();
				return true;
			} else {
				statusError("Failed to save spot: " + spotResponse);
				return false;
			}
		}
	}
}

function updateShips(ships) {
	const shipElems = document.getElementsByTagName("ship-elem");
	for (let i = 0; i < shipElems.length; i++) {
		shipElems[i].ships = ships;
	}
	const spotElems = document.getElementsByTagName("spot-elem");
	for (let i = 0; i < spotElems.length; i++) {
		spotElems[i].ships = ships;
	}
}

const saveShipSpot = async (event) => {
	const shipElem = event.detail.spotElem;
	await saveSpotShipObj(shipElem);
	shipElem.setAttribute("actionbutton", "Save");
	removeMask();
}

const saveCountry = async (event) => {
	addMask();
	const countryDoc = event.detail.country;
	const countries = JSON.parse(window.sessionStorage.getItem("countries"));
	const results = countries.filter(obj => obj.Country === countryDoc.Country);
	if (results.length > 0) {
		statusError("A Country with this name already exists");
		removeMask();
		return false;
	}
	let newIndex = 0
	countries.every((value, index) => {
		if (value.Country.localeCompare(countryDoc.Country) > 0) {
			newIndex = index;
			return false;
		}
		return true;
	})
	window.sessionStorage.setItem("countries", JSON.stringify(countries));
	if (window.isMock) {
		countries.splice(newIndex, 0, countryDoc);
		statusMsg("Successfully saved " + countryDoc.Country);
	} else {
		countryDoc.Form = "Admin_Country"
		const countryResponse = await window.dataService.saveDoc(countryDoc);
		if (typeof(countryResponse) === "object") {
			statusMsg("Successfully saved " + countryDoc.Country);
			countries.splice(newIndex, 0, countryDoc);
		} else {
			statusError("Failed to save " + countryDoc.country + ": " + success);
			return false;
		}
	}
	const shipElems = document.getElementsByTagName("ship-elem");
	for (let i = 0; i < shipElems.length; i++) {
		shipElems[i].flags = countries;
	}
	const portElem = document.getElementsByTagName("port-elem");
	for (let i = 0; i < portElem.length; i++) {
		portElem[i].countries = countries;
	}
	event.detail.countryElem.close();
	event.detail.countryElem.reset();
	removeMask();
}

const savePort = async (event) => {
	addMask();
	const portDoc = event.detail.port;
	const ports = JSON.parse(window.sessionStorage.getItem("ports"));
	const results = ports.filter(obj => obj.Port === portDoc.Port);
	if (results.length > 0) {
		statusError("A Port with this name already exists");
		removeMask();
		return false;
	}
	let newIndex = 0
	ports.every((value, index) => {
		if (value.Port.localeCompare(portDoc.Port) > 0) {
			newIndex = index;
			return false;
		}
		return true;
	})
	ports.splice(newIndex, 0, portDoc);
	window.sessionStorage.setItem("ports", JSON.stringify(ports));
	if (window.isMock) {
		statusMsg("Successfully saved " + portDoc.Port);
	} else {
		portDoc.Form = "Admin_Port"
		const portResponse = await window.dataService.saveDoc(portDoc);
		if (typeof(portResponse) === "object") {
			statusMsg("Successfully saved " + portDoc.Port);
		} else {
			statusError("Failed to save " + portDoc.Port + ": " + success);
			return false;
		}
	}
	const spotElems = document.getElementsByTagName("spot-elem");
	for (let i = 0; i < spotElems.length; i++) {
		spotElems[i].ports = ports;
	}
	event.detail.portElem.close();
	event.detail.portElem.reset();
	removeMask();
}

const saveTrip = async (event) => {
	addMask();
	const tripElem = event.detail.tripElem;
	const tripDoc = event.detail.trip;
	const tripObj = tripElem.tripObj;
	let newActive = tripDoc.Active;
	const allTrips = JSON.parse(sessionStorage.getItem("trips"));
	if (tripObj.hasOwnProperty("@unid") && newActive) {
		newActive = tripObj["@unid"] != sessionStorage.getItem("activeTrip");
	}
	if (newActive) {
		allTrips.forEach(trip => {
			if (trip.Active === "Yes") {
				trip.Form = "Admin_Trip";
				trip.Active = "No";
				if (!window.isMock) window.dataService.saveDocAndMessage(trip, trip.TripName);
			}
		});
	}
	tripObj.Form = "Admin_Trip"
	tripObj.TripName = tripDoc.TripName;
	tripObj.StartDate = tripDoc.StartDate;
	tripObj.EndDate = tripDoc.EndDate;
	tripObj.Active = tripDoc.Active;
	const isNew = !tripObj.hasOwnProperty("@unid");
	if (window.isMock) {
		if (!tripObj.hasOwnProperty("@unid")) {
			tripObj["@unid"] = "1234567890";
		}
	} else {
		const tripResponse = await window.dataService.saveDoc(tripObj);
		if (typeof(tripResponse) === "object") {
			statusMsg("Successfully saved " + tripObj.TripName);
			tripObj["@unid"] = tripResponse["@meta"].unid;
		} else {
			statusError("Failed to save " + tripObj.TripName + ": " + success);
			return false;
		}
	}
	if (newActive) {
		sessionStorage.setItem("activeTrip", tripObj["@unid"]);
	}
	if (isNew) {
		allTrips.unshift(tripObj);
	} else {
		allTrips.forEach((trip, index) => {
			if (trip["@unid"] === tripObj["@unid"]) {
				allTrips.splice(index, 1, tripObj);
			}
		});
	}
	sessionStorage.setItem("trips", JSON.stringify(allTrips));
	const loadTripsEvent = new CustomEvent("load-trips", {
		bubbles: true,
		composed: true
	});
	tripElem.dispatchEvent(loadTripsEvent);	// dispatch event from Trip, which is in Trips, so it can bubble
	tripElem.close();	// No need to reset
	removeMask();
}

const loadSpots = async (event) => {
	const shipElem = event.detail.shipElem;
	const spotsObjs = shipElem.getElementsByTagName("spots-elem");
	if (spotsObjs.length === 1) {
		const spotsObj = spotsObjs[0];
		const json = await window.dataService.getSpotsForShip(event.detail.shipunid);
		spotsObj.populateSpots(json);
	}
}

const clearSpots = (event) => {
	const shipElem = event.detail.shipElem;
	const spotsObjs = shipElem.getElementsByTagName("spots-elem");
	if (spotsObjs.length === 1) {
		const spotsObj = spotsObjs[0];
		spotsObj.populateSpots("");
	}
}

const loadSpotsByDate = async (event) => {
	const shipSpotElem = event.detail.shipSpotElem;
	console.log("Getting spots between " + shipSpotElem.startDate + " and " + shipSpotElem.endDate);
	const endDate = shipSpotElem.endDate + "T23:59:00Z"
	const json = await window.dataService.getSpotsByDate(shipSpotElem.startDate, endDate);
	if (typeof(json) === "object") {
		json.sort((a,b) => {
			if (a.Created < b.Created) return -1;
			if (a.Created > b.Created) return 1;
			return 0;
		});
		shipSpotElem.populateSpots(json);
	} else {
		statusError("Error getting spots: " + success);
		return false;
	}
}

const showShip = (event) => {
	const shipObj = event.detail.shipObj;
	toggleSPA("ship-search", "block");
	const shipSearchSection = document.getElementById("ship-search");
	const shipSearchElem = shipSearchSection.querySelector("ship-elem");
	shipSearchElem.setAttribute("actionbutton", "Edit");
	shipSearchElem.populateShip(shipObj);
}

const showSpot = (event) => {
	const shipObj = event.detail.shipObj;
	const spotObj = event.detail.spotObj;
	toggleSPA("new-spot", "block");
	const newSpotSection = document.getElementById("new-spot");
	const newSpotElem = newSpotSection.querySelector("spot-elem");
	newSpotElem.setAttribute("actionbutton", "Edit");
	if (shipObj != null) newSpotElem.populateShip(shipObj);
	newSpotElem.populateSpot(spotObj);
}

// END CUSTOM EVENT ACTIONS

if (document.readyState != "loading") {
	bootstrap();
} else {
	document.addEventListener("DOMContentLoaded", bootstrap);
}
