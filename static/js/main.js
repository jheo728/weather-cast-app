// Define the extent for the continental United States
const continentalUSExtent = [-126, 22, -40, 50];

// Create a base map layer
const baseLayer = new ol.layer.Tile({
  source: new ol.source.OSM(),
});

// Create an OpenLayers map
const map = new ol.Map({
  target: "map",
  layers: [baseLayer],
  view: new ol.View({
    center: ol.proj.fromLonLat([-98, 39]), // Center the view on the U.S.
    zoom: 5, // Set an initial zoom level
    extent: ol.proj.transformExtent(
      continentalUSExtent,
      "EPSG:4326",
      "EPSG:3857"
    ),
    minZoom: 5,
  }),
});

// Function to check if the clicked coordinate is within the continental U.S. extent
function isWithinUSExtent(coordinate) {
  return (
    coordinate[0] >= continentalUSExtent[0] &&
    coordinate[0] <= continentalUSExtent[2] &&
    coordinate[1] >= continentalUSExtent[1] &&
    coordinate[1] <= continentalUSExtent[3]
  );
}

// Function to send coordinates to the server and handle the response
function fetchDataFromServer(latitude, longitude) {
  const url = "/fetch-analyze-forecast";
  const data = { latitude, longitude };

  console.log("Fetching data from weather API...");

  return fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  })
    .then((response) => response.json())
    .catch((error) => {
      console.error("An error occurred:", error);
      throw error; // Propagate the error to the next catch block
    });
}

// Function to create a forecast period element from the template
function createForecastPeriodElement(period) {
  const forecastPeriodTemplate = document.getElementById(
    "forecastPeriodTemplate"
  );

  // Activate the template and get a reference to the content
  const templateContent = forecastPeriodTemplate.content.cloneNode(true);

  // Customize the cloned template with period data
  templateContent.querySelector("[data-id='periodName']").textContent =
    period.name;
  templateContent.querySelector("[data-id='imgIcon']").src = period.img_icon;
  templateContent.querySelector("[data-id='tempPrecip']").innerHTML = `${
    period.temp
  } ${period.precip_chance ?? 0}`;
  templateContent.querySelector("[data-id='shortForecast']").textContent =
    period.short_forecast;
  templateContent.querySelector("[data-id='details']").textContent =
    period.details;

  const seeDetailsBtn = templateContent.querySelector(
    "[data-id='seeDetailsBtn']"
  );
  const detailsDiv = templateContent.querySelector("[data-id='details']");

  seeDetailsBtn.addEventListener("click", function () {
    // Toggle the visibility of the details
    detailsDiv.style.display =
      detailsDiv.style.display === "none" ? "block" : "none";
    // Update button text based on current text
    this.textContent =
      this.textContent.trim() === "See Details" ? "Collapse" : "See Details";
  });

  return templateContent;
}

// Function to handle the forecast data and update the UI
function handleForecastData(clickedCoordinate, forecastData) {
  const popupContent = document.getElementById("popup-content");
  popupContent.innerHTML = "";

  forecastData.forEach(function (period) {
    // Create a forecast period element from the template
    const periodElement = createForecastPeriodElement(period);

    // Append the customized period element to the popup content
    popupContent.appendChild(periodElement);
  });

  // Display the Tailwind CSS modal with updated title
  document.getElementById(
    "forecastModalLabel"
  ).textContent = `Forecast Details: 
      ${clickedCoordinate[1].toFixed(6)}, 
      ${clickedCoordinate[0].toFixed(6)}`;
  document.getElementById("forecastModal").classList.remove("hidden");

  // Add event listener for the close button
  document
    .getElementById("closeForecastModalBtn")
    .addEventListener("click", function () {
      document.getElementById("forecastModal").classList.add("hidden");
    });

  console.log("Successfully pulled data with contents in popup window.");
}

// Function to handle the case when no data is available
function handleNoData(clickedCoordinate) {
  console.log("No data available or API could not retrieve data.");

  // Display a unique popup to show no data
  const noDataContent = document.getElementById("no-data-content");
  noDataContent.innerHTML = "Try again or select another area.";
  noDataContent.classList.remove("hidden");

  // Set the label for the no-data modal
  document.getElementById("noDataModalLabel").textContent = `No Data Available: 
      ${clickedCoordinate[1].toFixed(6)}, 
      ${clickedCoordinate[0].toFixed(6)}`;

  // Display the Tailwind CSS no-data modal
  document.getElementById("noDataModal").classList.remove("hidden");

  // Add event listener for the close button in the No Data Modal
  document
    .getElementById("closeNoDataModalBtn")
    .addEventListener("click", function () {
      document.getElementById("noDataModal").classList.add("hidden");
    });
}

// Function to show the loading overlay
function showLoadingOverlay() {
  document.getElementById("loadingOverlay").classList.remove("hidden");
}

// Function to hide the loading overlay
function hideLoadingOverlay() {
  document.getElementById("loadingOverlay").classList.add("hidden");
}

// Add a click event handler to capture coordinates and initiate the process
map.on("singleclick", function (event) {
  const clickedCoordinate = ol.proj.toLonLat(event.coordinate);

  if (isWithinUSExtent(clickedCoordinate)) {
    showLoadingOverlay();

    fetchDataFromServer(clickedCoordinate[1], clickedCoordinate[0])
      .then((forecastData) => {
        hideLoadingOverlay();

        if (forecastData.length) {
          handleForecastData(clickedCoordinate, forecastData);
        } else {
          handleNoData(clickedCoordinate);
        }
      })
      .catch((error) => {
        hideLoadingOverlay();
        console.error("An error occurred:", error);
      });
  } else {
    console.log("Invalid area, select another area for weather data forecast.");
  }
});
