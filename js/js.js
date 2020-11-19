// Set two variables street and sattelite aa tile layers for the respective maps using mapbox layers
var street = L.tileLayer('https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token={accessToken}', {
        attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
        maxZoom: 18,
        minZoom: 2,
        id: 'mapbox/streets-v11',
        tileSize: 512,
        zoomOffset: -1,
        accessToken: 'pk.eyJ1IjoibXlsZXNraW5nIiwiYSI6ImNraDY5aHF1MDA4bXMycG81NXdydDIwNW8ifQ.LiVIW0kbaS-7qDJc4S9IyQ'
}),
    sattelite = L.tileLayer('https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token={accessToken}', {
        attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
        maxZoom: 18,
        minZoom: 2,
        id: 'mapbox/satellite-v9',
        tileSize: 512,
        zoomOffset: -1,
        accessToken: 'pk.eyJ1IjoibXlsZXNraW5nIiwiYSI6ImNraDY5aHF1MDA4bXMycG81NXdydDIwNW8ifQ.LiVIW0kbaS-7qDJc4S9IyQ'
});
/*
// Create a geoJson layer to be used to add information if the user so wishes
var earthquakes = L.geoJson([], {
    // Use onEachFeature so that a popup can be added to each marker, which can be clicked to show information
    onEachFeature: function (feature, layer) {
      var props = feature.properties;

      // Create the popup content to be added to each feature using the features properties 
      layer.bindPopup('<table><tr><td colspan="2"><b>' + capitalizeFirstLetter(props.type) + ' - ' + timestamp(props.time) + '</b></td></tr><tr><td colspan="2">Magnitude: ' + props.mag + '</td></tr><tr><td colspan="2">' + props.place + '</td></tr><tr><td colspan="2">More info: <a href="' + props.url + '" target="_blank">earthquake.usgs.gov</a></td></tr></table>');
    },
    pointToLayer: function (feature, latlng) {
      var color,
          mag,
          radius;

      // Set radius and color to vary depending on the magintude of the earthquake detected
      mag = feature.properties.mag;
      if (mag === null) {
        color = '#fff';
        radius = 2;
      } else {
        color = '#00f';
        radius = 2 * Math.max(mag, 1);
      }

      if (feature.properties.type === 'quarry blast') {
        color = '#f00';
      }

      // Use a circle marker so the user can easily see the difference in size of earthquakes
      return L.circleMarker(latlng, {
        color: color,
        radius: radius
      });
    },
});

// Use ajax, PHP and cURL to fetch the data and add to the geoJSON variable
$.ajax({
    url: "php/quake.php",
    type: 'POST',
    dataType: 'json',
    success: function(quakeinfo) {
        earthquakes.addData(quakeinfo);
    },
    // Error section if ajax request fails, a very similar error is used on all ajax calls using same error function
    error: function(jqXHR, exception){

        // Use a function to display the error thrown
        errorajx(jqXHR, exception);
        // Log to the console the request error type so it can be more eaily debuggd
        console.log('quakes');
    }
}); */

// Set mymap as a global variable and add street layer as the default
var mymap = L.map('mapid', {
    layers: [street, earthquakes] 
});

// Set variables for the base layers and overlays so the layer the user wants to use can bew selected
var baseLayers = {
	"Streets Map": street,
	"Sattelite Map": sattelite
};

var overlays = {
    "Recent Earthquake Data": earthquakes
};

// Add the controls to the app
L.control.layers(baseLayers, overlays).addTo(mymap);

// Add custom marker icon to show users location
var pericon = L.icon({
    iconUrl: './css/location.png',
    iconSize: [40,40],
    iconAnchor:  [20,40]
});

// Call the navigator.geolocation when document loads to get users location
$(document).ready(function() {
    navigator.geolocation.getCurrentPosition( geolocationCallback );  
});

//Write their callback function for the navigator.geolocation function
function geolocationCallback( position ){
    
    // Set variable lat and lng for the users current latitude and longitude
    var lat = position.coords.latitude;
    var lng = position.coords.longitude;

    //set variable latlng as the users coordinates using the geolocation function
    latlng = new L.LatLng(lat, lng);
 
    //set the starting view of the map as the users location at zoom level 5
    mymap = mymap.setView(latlng, 5);


    //add a marker to the users position to easily find on a zoomed out map
    L.marker(latlng, {title: 'Your Location', icon: pericon}).addTo(mymap);

    // Get ISO 2 country code using users current position lat and long
    $.ajax({
        url: "php/latlngtocc.php?lat=" + lat + "&lng=" + lng,
        type: 'POST',
        dataType: 'json',
        success: function(result) {

            // Send data to functions which will get and display more data from different APIs and set the users local currency
            ccData(result['countryCode']);
            localCur(result['countryCode']);

        },
        error: function(jqXHR, exception){
            errorajx(jqXHR, exception);
            console.log("latitude and longitude to country code");
        }
    }); 

};

// Global variable to be used for the exchange feature which sets data for users local currency 
homeCurrency = '';

// Function to fetch data about users local currency information, seperate php routine run as to not exceed max API use per second
function localCur(cc) {
    $.ajax({
        url: "php/rest.php?cc=" + cc,
        type: 'POST',
        dataType: 'json',
        success: function(response) {
            homeCurrency = response['currencies'];
        },
        error: function(jqXHR, exception){
            errorajx(jqXHR, exception);
            console.log("home currency");
        }
    });
};

// Fill the select option with available countries from the border data file
$.ajax({
    url: "php/select.php",
    type: 'POST',
    dataType: 'json',
    success: function(response) {

        // For each data set append the select with id country with an option html element
        // with a value of the ISO code and name of the country name
        $.each(result.data, function(index) {
        
            $('#country').append($("<option>", {
                value: result.data[index].code,
                text: result.data[index].name
            })); 
}); 

    },
    error: function(jqXHR, exception){
        errorajx(jqXHR, exception);
        console.log("Option select");
    }
}); 

// Create feature groups for each of the data sets to match a button or information group. These are set so they can be cleared when selecting a different country as to not clutter the page
var weatherGroup = L.featureGroup([]);
var wikiGroup = L.featureGroup([]);
var currencyGroup = L.featureGroup([]);
var coronaGroup = L.featureGroup([]);
var borderGroup = L.featureGroup([]);
var forecastGroup = L.featureGroup([]);
var neswGroup = L.featureGroup([]);
var quakeGroup = L.featureGroup([]);

// Function to fetch more data from different APIs
function ccData(cc) {

    // Clears layers so that when a new country is selected all popups and markers are deleted so app does not get cluttered
    weatherGroup.clearLayers();
    wikiGroup.clearLayers();
    currencyGroup.clearLayers();
    coronaGroup.clearLayers();
    borderGroup.clearLayers();
    forecastGroup.clearLayers();
    neswGroup.clearLayers();
    quakeGroup.clearLayers();

    // Get information from restcountries API so this data can be used in fetching other API data
    $.ajax({
        url: "php/rest.php?cc=" + cc,
        type: 'POST',
        dataType: 'json',
        success: function(reply) {

            // ajax function calling to a php cURL function that uses geonames API to obtain data
            $.ajax({
                url: "php/geoNames.php?cc=" + reply['alpha2Code'],
                type: 'POST',
                dataType: 'json',
                success: function(result) {

                    // Popup used to show information to user using results from ajax call
                    var genPopup = L.popup({className: 'gen'}).setContent(
                        "<table>" +
                            "<tr>" +
                                "<td colspan='2'>" + "<img src=" + result[1]['flag'] + " id='flag' ></img></td>" + 
                            "</tr>" +
                            "<tr>" +
                                "<td colspan='2'>" + "<b> " + result[1]['name'] +  " (" + result[1]['alpha2Code'] + ")" + " </b>" + "</td>" + 
                            "</tr>" + 
                            "<tr>" +
                                "<td> Native Name: </td>" + 
                                "<td>" + result[1]['nativeName'] + "</td>" +
                            "</tr>" + 
                            "<tr>" +
                                "<td> Capital: </td>"  + 
                                "<td>" + result[1]['capital'] +  "</td>" + 
                            "</tr>" + 
                            "<tr>" + 
                                "<td> Continent: </td>"  + 
                                "<td>" + result[1]['region'] +
                            "</tr>" + 
                            "<tr>" + 
                                "<td> Subregion: </td>"  + 
                                "<td>" + result[1]['subregion'] +  "</td>" + 
                            "</tr>" + 
                            "<tr>" + 
                                "<td> Language: </td>"  + 
                                "<td> " + result[1]['languages'][0]['name'] + "</td>" +
                            "</tr>" +
                            "<tr>" +
                                "<td> Population: </td>"  + 
                                "<td>" + commas(result[1]['population']) + "</td>" +
                            "</tr>" +
                            "<tr>" +
                                "<td> Area: </td>" + 
                                "<td>" + commas(Math.round(result[1]['area'])) + " Km"+ '&#178' + "</td>" +
                            "</tr>" + 
                            "<tr>" +
                                "<td> Calling Code: </td>" + 
                                "<td> +" + result[1]['callingCodes'] + "</td>" +
                            "</tr>" +
                            "<tr>" +
                                "<td> Top Level Domain: </td>" + 
                                "<td>" + result[1]['topLevelDomain'] + "</td>" +
                            "</tr>" + 
                        "</table>"
                    ).setLatLng(result[1]['latlng']);

                    function exchpop(amount) {
                        var exchangePopup = L.popup({className: 'currency'}).setContent(
                            "<table>" +
                            "<tr>" +
                                "<td colspan='2'><b>" + result[1]['currencies'][0]['name'] + " </b></td>" +
                            "</tr>" + 
                            "<tr>" +
                                "<td> Symbol: </td>" + 
                                "<td>" + result[1]['currencies'][0]['symbol'] + "</td>" +
                            "</tr>" + 
                            "<tr>" +
                                "<td> Currency Code: </td>" + 
                                "<td>" + result[1]['currencies'][0]['code'] + "</td>" +
                            "</tr>" + 
                            "<tr>" +
                                amount +
                            "</tr>" + 
                        "</table>"
                        ).setLatLng(result[1]['latlng']).addTo(currencyGroup);
                    };

                    // Ajax call to php routine for border data to show border and to populate drop-down menu with available countries
                    // async is turned off so this layer lloads first onto the map then all others are loaded after so they can be selected
                    $.ajax({
                        url: "php/border.php?code=" + result['geonames'][0]['isoAlpha3'],
                        type: 'POST',
                        dataType: 'json',
                        async: false,
                        success: function(response) {
                        
                            // Create a custom style for the border highlight using the geoJson data
                            var myStyle = {
                                color: '#4497b2',
                                opacity: 1,
                                fillOpacity: 0.4,
                                fillColor: '#b04d8f',
                                dashArray: '20, 10'
                            };
                            // Add the result to a feature group so that it can be added to the map and cleared and rewritten if another country is selected
                            L.geoJson(response['data']['borders'], {
                                style: myStyle
                            }).addTo(borderGroup);
                            // Add the border and popup to the map so country is highlighted and general information shown
                            borderGroup.bindPopup(genPopup).addTo(mymap);
                            // Add function to display wikipedia points of interest over the country if clicked on and easybutton pressed
                            borderGroup.on('click', onMapClick);
                            // Map is also centered after call so the country border is centered and zoomed to the right level after it is selected
                            mymap.fitBounds(borderGroup.getBounds()).openPopup(genPopup);

                        },
                        error: function(jqXHR, exception){
                            errorajx(jqXHR, exception);
                            console.log("border");
                        }
                    }); 

                    // ajax call to get exchange information and display in a popup set to its feature group
                    $.ajax({
                        url: "php/exchange.php?currency=" + result[1]['currencies'][0]['code'] + "&base=" + homeCurrency[0]['code'],
                        type: 'POST',
                        dataType: 'json',
                        success: function(response) {
                            
                            // String variable which is table row containing the exchange information if available
                            string = "<td> Conversion: </td><td>" + homeCurrency[0]['symbol'] + "1.00 : " + result[1]['currencies'][0]['symbol'] + (response['amount']).toFixed(2) + "</td>";
                            exchpop(string);
                        },
                        error: function(jqXHR, exception){
                            errorajx(jqXHR, exception);
                            console.log("exchange error most likely currency cannot be accepted by API.");
                            // String variable which is table row containing the exchange information if the data is not available
                            string = "<td colspan='2'> Sorry this country has no conversion data available. </td>";
                            exchpop(string);
                        }
                    });


                    // Ajax call to php routine for city data using geonames country  North, East, South and West data
                    $.ajax({
                        url: "php/nesw.php?north=" + result['geonames'][0]['north'] + "&south=" + result['geonames'][0]['south'] + "&east=" + result['geonames'][0]['east'] + "&west=" + result['geonames'][0]['west'],
                        type: 'POST',
                        dataType: 'json',
                        success: function(neswres) {

                            neswarray = neswres['cities']['geonames'];

                            // Use if statement to display message in a popup if no city in formation is avaialable 
                            if (neswarray === undefined ) {
                                var noCity = L.popup().setLatLng(result[1]['latlng']).setContent('Sorry This country has no city information.').addTo(neswGroup);
                            } else {

                                // Create empty array which will store features
                                var feature = []; 

                                // Use for loop to itterate through data and assign each data set a circle marker relative to city population
                                for (j=0; j < neswarray.length; j++) {

                                    // Set pop variable equal to <10,000 if data is below that variable as it can be returned as 0 from source
                                    if (neswarray[j]['population'] < 10000) {
                                        pop = ' < 10,000';
                                    } else {
                                        // Use commas function which adds a comma after every 3 digits to make the number more human readable
                                        pop = commas(neswarray[j]['population']);
                                    };

                                    // Conditional if statement used to show wikipedia page for city or town if there is one available
                                    if ((neswarray[j]['wikipedia']).includes("wikipedia")) {
                                        wiki = "<td colspan='2'>Wikipedia Page: </td></tr><tr><td colspan='2'><a href='https://" + neswarray[j]['wikipedia'] + "' target='_blank'>" + neswarray[j]['wikipedia'] + "</a></td>";
                                    } else {
                                        // some of the cities displayed in smaller countries have no wikipedia page so this function stops errors
                                        wiki = "<td colspan='2'> There is no wikipedia information for this town. </td>";
                                    };

                                    // Create a variable to set content for the popups for each circle marker, which displays data when clicked
                                    var data = L.popup({className: 'nesw'}).setContent(
                                        "<table>" + 
                                            "<tr>" + 
                                                "<td colspan='2'><b>" + neswarray[j]['name'] + "</b></td>" + 
                                            "</tr>" + 
                                            "<tr>" + 
                                                "<td>Population: </td> <td>" + pop + "</td>" + 
                                            "</tr>" + 
                                            "<tr>" + 
                                                wiki + 
                                            "</tr>" + 
                                        "</table>"
                                    );
                                    
                                    //.setLatLng([neswarray[j]['lat'],neswarray[j]['lng']]).addTo(neswData);
                                    var cityHold = {
                                        "type": "Feature",
                                        "properties": {
                                            "popupContent": data,
                                            "population": pop
                                            },
                                        "geometry": {
                                            "type": "Point",
                                            "coordinates": [neswarray[j]['lng'], neswarray[j]['lat']]
                                        }
                                    };

                                    // Add to the feature array using the push method and the data in the holding variable
                                    feature.push(cityHold);
                                };  
                                
                                // Create the geoJson data using city information
                                var citydata = { "type": "FeatureCollection", "features": feature};

                                // Create the city geoJson where a circle marker represent the location with a radius proportional to the population of the town/city
                                var citygeoJSON = L.geoJson([], {
                                    onEachFeature: function (cityFeature, layer) {

                                    layer.bindPopup(cityFeature.properties.popupContent);
                                    },
                                    pointToLayer: function (cityFeature, latlng) {
                                        
                                        var color,
                                            radius,
                                            pop;
   
                                        // pop uses the population. the replace feature is used to make the value into an integer as it could have the 
                                        // value of < 10,000 so " " , and < must be replaced with "" to make pop an integer through the parseInt which
                                        // converts it from a string to an int. This number is then divided by a million as some of the largest citiest 
                                        // have populations over billions. The value is then rounded up so smaller populated places go to a value of one.
                                        // The square is then taken so the difference between the much larger cities and smaller is not so different as
                                        // the gradient of y=sqrt(x) is less steep than y=x. the value is then multiplied by five so it can be seen by user
                                        pop = 5*Math.sqrt(Math.ceil(parseInt(cityFeature.properties.population.replace(/,|<| /g, ''))/1000000));
                                        color = 'black';
                                        radius = pop;
                                        
                                        return L.circleMarker(latlng, {
                                            color: color,
                                            radius: radius
                                        });
                                            
                                    }
                                });

                                // The geoJSOn then has the data added to it and it is added to the layer so it can be shown/hidden by user
                                citygeoJSON.addData(citydata);
                                neswGroup.addLayer(citygeoJSON);
                            };

                            // Plot Earthquakes as a circle with radius proportional to magnitude
                            var earthData = neswres['earth']['earthquakes'];

                            // Use if statement to show data if avaialble or show mesage to say there is no data available if not
                            if ((neswres['earth']['earthquakes']).length === 0) {
                                var noQuake = L.popup().setLatLng(result[1]['latlng']).setContent('Sorry This country has no earthquake information.').addTo(quakeGroup);
                            } else {
                                
                                // Variable with empty array that will have features for geoJson pushed in
                                var feature = [];

                                // Use for loop to itterate through data and add features to array
                                for(i=0; i < earthData.length; i++) {

                                    // Use slice function to make popup more readable using the given formatting of data
                                    var time = earthData[i]['datetime'].slice(11,19);
                                    var date = earthData[i]['datetime'].slice(8,10) + "-" + earthData[i]['datetime'].slice(5,7) + "-" + earthData[i]['datetime'].slice(0,4);

                                    var rumbly = L.popup({className: 'quake'}).setContent(
                                        "<table>" + 
                                            "<tr>" + 
                                                "<td colspan='2'><b>" + date + "</b></td>" + 
                                            "</tr>" + 
                                            "<tr>" + 
                                                "<td colspan='2'>" + time + "</td>" + 
                                            "</tr>" +
                                            "<tr>" + 
                                                "<td>Magnitude: </td>" +
                                                "<td>" + earthData[i]['magnitude'] + "</td>" + 
                                            "</tr>" + 
                                        "</table>"
                                    );

                                    var hold = {
                                        "type": "Feature",
                                        "properties": {
                                            "popupContent": rumbly,
                                            "mag": earthData[i]['magnitude']
                                            },
                                        "geometry": {
                                            "type": "Point",
                                            "coordinates": [earthData[i]['lng'], earthData[i]['lat']]
                                        }
                                    };

                                    feature.push(hold);
                                };
                                
                                // Create geoJson data using features
                                localquakes = { "type": "FeatureCollection", "features": feature };
                                
                                // Create geoJson of the earthquake data with radius proportional to earthquake magnitude
                                var earthgeoJSON = L.geoJson([], {
                                    onEachFeature: function (feature, layer) {
                                
                                    layer.bindPopup(feature.properties.popupContent);
                                    },
                                    pointToLayer: function (feature, latlng) {
                                        var color,
                                            mag,
                                            radius;
                                        
                                        mag = feature.properties.mag;
                                        if (mag === null) {
                                            color = '#fff';
                                            radius = 2;
                                        } else {
                                            color = '#f00';
                                            radius = 2 * Math.max(mag, 1);
                                        }
                                        
                                        return L.circleMarker(latlng, {
                                            color: color,
                                            radius: radius
                                        });
                                    }
                                });
                                
                                // The geoJSOn then has the data added to it and it is added to the layer so it can be shown/hidden by user
                                earthgeoJSON.addData(localquakes);
                                quakeGroup.addLayer(earthgeoJSON);

                            };
                        },
                        error: function(jqXHR, exception){
                            errorajx(jqXHR, exception);
                            console.log("nesw");
                        }
                    }); 
                    
                    // Set the popup content with results from the previous ajax call and add to its own group so the popup can be toggled and rewritten
                    var coronaPopup = L.popup({className: 'corona'}).setContent(
                        "<table>" +
                            "<tr>" + 
                                "<td colspan='2'><b>Corona Virus Data <b></td>" + 
                            "</tr>" +
                            "<tr>" + 
                                "<td>Confirmed cases: </td>" + 
                                "<td>" + commas(result[0][0]['confirmed']) + "</td>" + 
                            "</tr>" +
                            "<tr>" + 
                                "<td>Critical cases: </td>" + 
                                "<td>" + commas(result[0][0]['critical']) + "</td>" + 
                            "</tr>" +
                            "<tr>" + 
                                "<td>Deaths: </td>" + 
                                "<td>" + commas(result[0][0]['deaths']) + "</td>" + 
                            "</tr>" +
                        "</table>"
                    ).setLatLng([result[0][0]['latitude'],result[0][0]['longitude']]).addTo(coronaGroup);


                    // Ajax call to php routine that utilises curl to get information from APIs about weather and wikipedia points
                    $.ajax({
                    url: "php/weather.php?ltd=" + result[0][0]['latitude'] + "&lgd=" + result[0][0]['longitude'],
                    type: 'POST',
                    dataType: 'json',
                    success: function(response) {

                        // Set the popup content using the weather data 
                        var weatherPopup = L.popup({className: 'weather'}).setContent(
                            "<table>" +
                                "<tr>" + 
                                    "<td colspan='2'><img id='mainWeathIcon' src='http://openweathermap.org/img/wn/" + response['weather'][0]['icon'] + "@2x.png'></img></td>" + 
                                "</tr>" + 
                                "<tr>" + 
                                    "<td colspan='2'><b>" + response['weather'][0]['main'] + "</b></td>" + 
                                "</tr>" + 
                                "<tr>" + 
                                    "<td colspan='2'>" + response['weather'][0]['description'] + "</td>" + 
                                "</tr>" +
                                "<tr>" + 
                                    "<td> Cloud cover: </td><td>" + response[0]['daily'][0]['clouds'] + "%" + "</td>" + 
                                "</tr>" +
                                "<tr>" + 
                                    "<td> Temperature: </td><td>" + (response['main']['temp'] - 273.15).toFixed(1) + "&#8451" + "</td>" + 
                                "</tr>" +
                                "<tr>" + 
                                    "<td> Feels like: </td><td>" + (response['main']['temp'] - 273.15).toFixed(1) + "&#8451" + "</td>" + 
                                "</tr>" +
                                "<tr>" + 
                                    "<td> Max: </td><td>" + (response['main']['temp_max'] - 273.15).toFixed(1) + "&#8451" + "</td>" + 
                                "</tr>" +
                                "<tr>" + 
                                    "<td> Min: </td><td>" + (response['main']['temp_min'] - 273.15).toFixed(1) + "&#8451" + "</td>" + 
                                "</tr>" +
                                "<tr>" + 
                                    "<td> Pressure: </td><td>" + response['main']['pressure'] + " mbar" + "</td>" + 
                                "</tr>" +
                                "<tr>" + 
                                    "<td> Humidity: </td><td>" + response['main']['humidity'] + "%" + "</td>" + 
                                "</tr>" +
                                "<tr>" + 
                                    "<td> Wind speed: </td><td>" + response['wind']['speed'] + "m/s" + "</td>" + 
                                "</tr>" +
                                "<tr>" + 
                                    "<td> Wind direction: </td><td>" + response['wind']['deg'] + '\u00B0' + "</td>" + 
                                "</tr>" +
                                // Timestamp function is used to convert the unix timestamnp to a more human readable format
                                "<tr>" + 
                                    "<td> Sunrise: </td><td>" + timestamp(response['sys']['sunrise']) + "</td>" + 
                                "</tr>" +
                                "<tr>" + 
                                    "<td> Sunset: </td><td>" + timestamp(response['sys']['sunset']) + "</td>" + 
                                "</tr>" +
                            "</table>"
                        );

                        // Forecast popup set using same API as weather
                        var forecastPopup = L.popup({className: 'forecast'}).setContent(
                            "<table>" +
                                "<tr>" + 
                                    "<td><b>" + date(response[0]['daily'][0]['dt']).substring(0,3) + "</b></td>" + 
                                    "<td><b>" + date(response[0]['daily'][1]['dt']).substring(0,3) + "</b></td>" + 
                                    "<td><b>" + date(response[0]['daily'][2]['dt']).substring(0,3) + "</b></td>" + 
                                    "<td><b>" + date(response[0]['daily'][3]['dt']).substring(0,3) + "</b></td>" + 
                                    "<td><b>" + date(response[0]['daily'][4]['dt']).substring(0,3) + "</b></td>" + 
                                    "<td><b>" + date(response[0]['daily'][5]['dt']).substring(0,3) + "</b></td>" + 
                                    "<td><b>" + date(response[0]['daily'][6]['dt']).substring(0,3) + "</b></td>" + 
                                "</tr>" +
                                "<tr>" + 
                                    "<td><img id='weathIcon' src='http://openweathermap.org/img/wn/" + response[0]['daily'][0]['weather'][0]['icon'] + "@2x.png'></img></td>" + 
                                    "<td><img id='weathIcon' src='http://openweathermap.org/img/wn/" + response[0]['daily'][1]['weather'][0]['icon'] + "@2x.png'></img></td>" + 
                                    "<td><img id='weathIcon' src='http://openweathermap.org/img/wn/" + response[0]['daily'][2]['weather'][0]['icon'] + "@2x.png'></img></td>" + 
                                    "<td><img id='weathIcon' src='http://openweathermap.org/img/wn/" + response[0]['daily'][3]['weather'][0]['icon'] + "@2x.png'></img></td>" + 
                                    "<td><img id='weathIcon' src='http://openweathermap.org/img/wn/" + response[0]['daily'][4]['weather'][0]['icon'] + "@2x.png'></img></td>" + 
                                    "<td><img id='weathIcon' src='http://openweathermap.org/img/wn/" + response[0]['daily'][5]['weather'][0]['icon'] + "@2x.png'></img></td>" + 
                                    "<td><img id='weathIcon' src='http://openweathermap.org/img/wn/" + response[0]['daily'][6]['weather'][0]['icon'] + "@2x.png'></img></td>" + 
                                "</tr>" +
                                "<tr>" + 
                                    "<td><b>" + response[0]['daily'][0]['weather'][0]['main'] + "</b></td>" + 
                                    "<td><b>" + response[0]['daily'][1]['weather'][0]['main'] + "</b></td>" +
                                    "<td><b>" + response[0]['daily'][2]['weather'][0]['main'] + "</b></td>" +
                                    "<td><b>" + response[0]['daily'][3]['weather'][0]['main'] + "</b></td>" +
                                    "<td><b>" + response[0]['daily'][4]['weather'][0]['main'] + "</b></td>" +
                                    "<td><b>" + response[0]['daily'][5]['weather'][0]['main'] + "</b></td>" +
                                    "<td><b>" + response[0]['daily'][6]['weather'][0]['main'] + "</b></td>" +
                                "</tr>"  +
                                "<tr>" + 
                                    "<td>" + response[0]['daily'][0]['weather'][0]['description'] + "</td>" +
                                    "<td>" + response[0]['daily'][1]['weather'][0]['description'] + "</td>" +
                                    "<td>" + response[0]['daily'][2]['weather'][0]['description'] + "</td>" +
                                    "<td>" + response[0]['daily'][3]['weather'][0]['description'] + "</td>" +
                                    "<td>" + response[0]['daily'][4]['weather'][0]['description'] + "</td>" +
                                    "<td>" + response[0]['daily'][5]['weather'][0]['description'] + "</td>" +
                                    "<td>" + response[0]['daily'][6]['weather'][0]['description'] + "</td>" +
                                "</tr>" +
                            "</table>");
                        
                        // Popups set to relevant feature groups so they can be added/removed and rewritten when another country is selected 
                        weatherPopup.setLatLng([result[0][0]['latitude'], result[0][0]['longitude']]).addTo(weatherGroup);
                        forecastPopup.setLatLng([result[0][0]['latitude'], result[0][0]['longitude']]).addTo(forecastGroup);

                    },
                    error: function(jqXHR, exception){
                        errorajx(jqXHR, exception);
                        console.log("weather and forecast");
                    }
                });
                },
                error: function(jqXHR, exception){
                    errorajx(jqXHR, exception);
                    console.log("GeoNames");
                }
            });
        },
        error: function(jqXHR, exception){
            errorajx(jqXHR, exception);
            console.log("homecurr");
        }
    });
};

// Function which will show wikipedia points of interest if user selects easy button and clicks on map
function onMapClick(e) {
    points(e.latlng);
};

mymap.on('click', onMapClick);

// Function which takes the lat and lang of the click location and returns the wiki pedia points of interest close to it
function points(latlng) {
    // Clear wiki layer is also here so every time that a location is selected the previous data gets cleared as to not 
    // crowd the window with wikipedia points of interest.
    wikiGroup.clearLayers();
    
    $.ajax({
        url: "php/interest.php?lat=" + latlng['lat'] + "&lng=" + latlng['lng'],
        type: 'POST',
        dataType: 'json',
        success: function(wiki) {

            // Empty array for features to be added to
            var feature = [];
            var wikiData = wiki['wiki']['geonames'];

            // Loop through data and add each one to feature array
            for(i=0; i < wikiData.length; i++) {

                var wikiPopup = L.popup({className: 'wiki'}).setContent( 
                    "<b>" + wikiData[i]['title'] + "</b> </br>" +
                    wikiData[i]['summary'] + "</br>" +
                    "latitude: " + (wikiData[i]['lat']).toFixed(2) + ", " +
                    "longitude: " + (wikiData[i]['lng']).toFixed(2) + "</br>" +
                    "Wikipedia link: <a href='https://" + wikiData[i]['wikipediaUrl'] + "' target='_blank'>" + wikiData[i]['wikipediaUrl'] + "</a>"
                );

                var hold = {
                    "type": "Feature",
                    "properties": {
                        "popupContent": wikiPopup,
                    },
                    "geometry": {
                        "type": "Point",
                        "coordinates": [wikiData[i]['lng'], wikiData[i]['lat']]
                    }
                };

                // Add to feature array
                feature.push(hold);
                };
                                
                wikigeoJSON = { "type": "FeatureCollection", "features": feature };
                                
                var wikistuff = L.geoJson([], {
                onEachFeature: function (feature, layer) {
                                
                layer.bindPopup(feature.properties.popupContent);
                },
                pointToLayer: function (feature, latlng) {                        
                    return L.circleMarker(latlng, {
                        color: '#44a6c6'
                    });
                }
            });   
            // Add data to the geoJson and add that to the wiki layer so it can be toggled by user                      
            wikistuff.addData(wikigeoJSON);
            wikiGroup.addLayer(wikistuff);        
        },
        error: function(jqXHR, exception){
            errorajx(jqXHR, exception);
            console.log("interest");
        }
    }); 
}; 

// Function to change the unix timecode to hours, minutes and seconds human readable format 
function timestamp(timestamp) {

        // Times the unix timestamp by 1000 to get milliseconds and assing it to a new date
        var date = new Date(timestamp * 1000);
        // Get the hours
        var hours = date.getHours();
        // Get the minutes
        var minutes = "0" + date.getMinutes();
        // Get the seconds
        var seconds = "0" + date.getSeconds();
        // Format into one variabale to be returned and used
        var time = hours + ':' + minutes.substr(-2) + ':' + seconds.substr(-2);
        return time;
            
};

// function to convert unix timestamp into day, date and month human readable format
function date(timestamp) {
    
    // Get milliseconds by multiplying timestamp by 1000
    const milliseconds = timestamp * 1000 
    // Assing this value as a date
    const dateObject = new Date(milliseconds)
    // put into variable that can be returned with the day, date and month
    const humanDateFormat = dateObject.toLocaleString("en-US", {weekday: "long"}) + "</br>" + dateObject.toLocaleString("en-US", {month: "long"}) +  " " + dateObject.toLocaleString("en-US", {day: "numeric"});
    return humanDateFormat
}

// Function to add commmas to long n umbers to make more  human readable
function commas(x) {
    // regex uses positive lookahead assertion to look for a point with 3 digits in a row after it,
    // the negative makes sure the point has exactly 3 digits ahead of it and the replace puts a comma there
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

// Function to get first letter of string then capitalise it then add the rest of the string using the slice method
function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
  }

// Function which returns the error for an ajax call depending on the error number and log to console
function errorajx(jqXHR, exception) {
    var msg = '';
        if (jqXHR.status === 0) {
            msg = 'Not connect.\n Verify Network.';
        } else if (jqXHR.status == 404) {
            msg = 'Requested page not found. [404]';
        } else if (jqXHR.status == 500) {
            msg = 'Internal Server Error [500].';
        } else if (exception === 'parsererror') {
            msg = 'Requested JSON parse failed.';
        } else if (exception === 'timeout') {
            msg = 'Time out error.';
        } else if (exception === 'abort') {
            msg = 'Ajax request aborted.';
        } else {
            msg = 'Uncaught Error.\n' + jqXHR.responseText;
        }
        console.log(msg);
};

// Easy button prototype which is used for each easy button with a toggleable feature that shows and hides popups with data
function easyButton(icon, group, info) {
    toggle = L.easyButton({
        states: [{
          stateName: 'add-markers',
          icon: icon,
          title: 'Show' + info,
          onClick: function(control) {
            mymap.addLayer(group);
            control.state('remove-markers');
          }
        }, {
          icon: icon,
          stateName: 'remove-markers',
          onClick: function(control) {
            mymap.removeLayer(group);
            control.state('add-markers');
          },
          title: 'Hide' + info
        }]
      });
    toggle.addTo(mymap);
};

// variables which set the esy buttons using the easyButton prototype. Input variables are the button symbol and the feature group to use which sets the data
toggleWeather = new easyButton('&#x1F326', weatherGroup, ' Weather Data');
toggleForecast = new easyButton('&#55', forecastGroup, ' 7-Day Forecast');
toggleWiki = new easyButton('&#x57', wikiGroup, ' Wikipedia points of interest, click to show');
toggleExchange = new easyButton('&#128181', currencyGroup,' Currency Information');
toggleCorona = new easyButton('&#129440', coronaGroup, ' Coronavirus Data');
togglecity = new easyButton('&#x1F3E2', neswGroup, ' Major Cities');
togglequake = new easyButton('&#128200;', quakeGroup, ' Country Earthquake Data');

// Preloader function
$(window).on('load', function () {
    if($('#loader').length) {
        $('#loader').delay(100).fadeOut('slow', function() {
            $(this).remove();
        });
    }
});

