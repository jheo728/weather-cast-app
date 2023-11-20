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

// Add a click event handler to capture coordinates and send them to the server
map.on("singleclick", function (event) {
  const clickedCoordinate = ol.proj.toLonLat(event.coordinate);
  // Check if the clicked coordinate is within the continental U.S. extent
  if (
    clickedCoordinate[0] >= continentalUSExtent[0] &&
    clickedCoordinate[0] <= continentalUSExtent[2] &&
    clickedCoordinate[1] >= continentalUSExtent[1] &&
    clickedCoordinate[1] <= continentalUSExtent[3]
  ) {
    // Send the clicked coordinates to the server and handle the response
    const url = "/fetch-analyze-forecast";
    const data = {
      latitude: clickedCoordinate[1],
      longitude: clickedCoordinate[0],
    };
    console.log("Fetching data from weather API...");
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
          const popupContent = document.getElementById("popup-content");
          popupContent.innerHTML = "";

          // Create a single row for forecast periods
          const row = document.createElement("div");
          row.className = "row";

          forecastData.forEach(function (period) {
            const periodDiv = document.createElement("div");
            // Add Bootstrap column classes as needed
            periodDiv.className = "col-3"; // Adjust the column size as needed

            // Add the image
            const img = document.createElement("img");
            img.className = "forecast-period-image";
            img.src = period.img_icon;
            periodDiv.appendChild(img);

            // Create a div for the text content
            const textDiv = document.createElement("div");
            textDiv.className = "forecast-text"; // Add this class

            // Center align the first line of text
            textDiv.innerHTML += `<div class="centered-text"><b>${period.name}</b></div><br>Temperature: ${period.temp}<br><br>Forecast: ${period.details}`;

            periodDiv.appendChild(textDiv);
            row.appendChild(periodDiv);
          });

          // Append the row to the popup content
          popupContent.appendChild(row);

          // Display the modal with updated title
          $("#forecastModalLabel").text(
            `Forecast Details: 
            ${clickedCoordinate[1].toFixed(6)}, 
            ${clickedCoordinate[0].toFixed(6)}`
          );

          // Set the position of the popup and display it
          $("#forecastModal").modal("show");
          console.log(
            "Successfully pulled data with contents in popup window."
          );
        } else {
          console.log("No data available or API could not retrieve data.");
          // Display a unique popup to show no data
          const noDataContent = document.getElementById("no-data-content");
          noDataContent.innerHTML =
            "No data available. Try again or select another area.";
          noDataContent.className = "no-data-content";

          $("#noDataModalLabel").text(
            `No Data Available: 
            ${clickedCoordinate[1].toFixed(6)}, 
            ${clickedCoordinate[0].toFixed(6)}`
          );

          // Display the Bootstrap no-data modal
          $("#noDataModal").modal("show");
        }
      })
      .catch(function (error) {
        console.error("An error occurred:", error);
      });
  } else {
    console.log("Invalid area, select another area for weather data forecast.");
  }
});
