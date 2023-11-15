// Define the extent for the continental United States
var continentalUSExtent = [-126, 22, -40, 50];

// Create a base map layer
var baseLayer = new ol.layer.Tile({
  source: new ol.source.OSM(),
});

// Create an OpenLayers map
var map = new ol.Map({
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

// Create a popup overlay for the forecast data
var forecastPopup = new ol.Overlay({
  element: document.getElementById("forecast-popup"),
  autoPan: true,
  autoPanAnimation: {
    duration: 250,
  },
});
map.addOverlay(forecastPopup);

// Create a popup overlay for "no-data-content"
var noDataPopup = new ol.Overlay({
  element: document.getElementById("no-data-popup"),
  autoPan: true,
  autoPanAnimation: {
    duration: 250,
  },
});
map.addOverlay(noDataPopup);

// Create a function to clear the popup's content
function clearPopupContent() {
  var popupContent = document.getElementById("popup-content");
  popupContent.innerHTML = "";

  var noDataContent = document.getElementById("no-data-content");
  noDataContent.innerHTML = "";
}

// Add a click event handler to capture coordinates and send them to the server
map.on("click", function (event) {
  clearPopupContent(); // Clear the previous content
  var clickedCoordinate = ol.proj.toLonLat(event.coordinate);
  // Check if the clicked coordinate is within the continental U.S. extent
  if (
    clickedCoordinate[0] >= continentalUSExtent[0] &&
    clickedCoordinate[0] <= continentalUSExtent[2] &&
    clickedCoordinate[1] >= continentalUSExtent[1] &&
    clickedCoordinate[1] <= continentalUSExtent[3]
  ) {
    // Send the clicked coordinates to the server and handle the response
    var url = "/fetch-analyze-forecast";
    var data = {
      latitude: clickedCoordinate[1],
      longitude: clickedCoordinate[0],
    };
    fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    })
      .then(function (response) {
        return response.json();
      })
      .then(function (forecastData) {
        if (forecastData.length) {
          // Create the content for the popup
          var popupContent = document.getElementById("popup-content");
          popupContent.innerHTML = "";

          forecastData.forEach(function (period) {
            var periodDiv = document.createElement("div");
            periodDiv.className = "forecast-period";

            // Add the image
            var img = document.createElement("img");
            img.className = "forecast-period-image";
            img.src = period.img_icon;

            periodDiv.appendChild(img);

            // Create a div for the text content
            var textDiv = document.createElement("div");
            textDiv.className = "forecast-text"; // Add this class

            // Center align the first line of text
            textDiv.innerHTML += `<div class="centered-text"><b>${period.name}</b></div><br>Temperature: ${period.temp}<br>Forecast: ${period.details}`;

            periodDiv.appendChild(textDiv);
            popupContent.appendChild(periodDiv);
          });

          // Set the position of the popup and display it
          forecastPopup.setPosition(event.coordinate);
        } else {
          // Display a unique popup to show no data
          var noDataContent = document.getElementById("no-data-content");
          noDataContent.innerHTML =
            "No data available. Try again or select another area.";
          noDataContent.className = "no-data-content";
          noDataPopup.setPosition(event.coordinate);
        }
      })
      .catch(function (error) {
        console.error("An error occurred:", error);
      });
  }
});
