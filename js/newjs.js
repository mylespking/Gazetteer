// Set variables for layers to be put onto map including street and sattelite aa tile layers for the respective maps using mapbox layers
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
}),
    // Layer to add country major city information
    citygeoJSON = L.geoJson([], {
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
            pop = 5 * Math.sqrt(Math.ceil(parseInt(cityFeature.properties.population.replace(/,|<| /g, ''))/1000000));
            color = 'black';
            radius = pop;
            
            return L.circleMarker(latlng, {
                color: color,
                radius: radius
            });
                
        }
}),
    // Layer to show historical country earthquake data
    earthgeoJSON = L.geoJson([], {
        // Create geoJson of the earthquake data with radius proportional to earthquake magnitude
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

// Set mymap as a global variable and add street layer as the default
var mymap = L.map('mapid', {
    layers: [street, citygeoJSON] 
});

// Set variables for the base layers and overlays so the layer the user wants to use can bew selected
var baseLayers = {
	"Streets Map": street,
	"Satellite Map": sattelite
};
var overlays = {
    "Major Cities": citygeoJSON,
    "Local Historical Earthquakes": earthgeoJSON
};

// Add the controls to the app
L.control.layers(baseLayers, overlays).addTo(mymap);

// Add custom marker icon to show users location
var pericon = L.icon({
    iconUrl: './css/location.png',
    iconSize: [40,40],
    iconAnchor:  [20,40]
});

// Create variable to store users home currency to be used for exchange information
homeCurrency = '';

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
    var latlng = new L.LatLng(lat, lng);
 
    //set the starting view of the map as the users location at zoom level 5
    mymap = mymap.setView(latlng, 5);

    //add a marker to the users position to easily find on a zoomed out map
    L.marker(latlng, {title: 'Your Location', icon: pericon}).addTo(mymap);

    // Get ISO 2 country code using users current position lat and long
    $.ajax({
        url: "php/latlngtocc.php",
        type: 'POST',
        dataType: 'json',
        data: {
            lat: lat,
            lng: lng,
        },
        success: function(result) {
            
            // Set users home currency
            homeCurrency = result['data']['currency'];
            // Send data to functions which will get and display more data from different APIs and set the users local currency
            getData(result['data']['country']); 
        },
        // Error section uses an error function which  logs to console the error
        // each error uses this function and has it owns log of where the error is
        error: function(jqXHR, exception){
            errorajx(jqXHR, exception);
            console.log("latitude and longitude to country code");
        }
    }); 

};

// Fill the select option with available countries from the border data file
$.ajax({
    url: "php/select.php",
    type: 'POST',
    dataType: 'json',
    success: function(result) {
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

// Create an empty feature group which is used to add and remove border data about selected
// countries which is then added to the map to show their borders
var borderGroup = L.featureGroup([]);

// Set options for the spinner which is displayed when data is loading from ajax call
// as well as set the target for the spinner (map) and set the spinner variable using 
// the leaflet spinner package
var opts = {
    lines: 12, // The number of lines to draw
    length: 38, // The length of each line
    width: 17, // The line thickness
    radius: 45, // The radius of the inner circle
    scale: 0.75, // Scales overall size of the spinner
    corners: 1, // Corner roundness (0..1)
    speed: 1, // Rounds per second
    rotate: 0, // The rotation offset
    animation: 'spinner-line-fade-quick', // The CSS animation name for the lines
    direction: 1, // 1: clockwise, -1: counterclockwise
    color: '#b24496', // CSS color or array of colors
    fadeColor: 'transparent', // CSS color or array of colors
    top: '50%', // Top position relative to parent
    left: '50%', // Left position relative to parent
    shadow: '0 0 1px transparent', // Box-shadow for the lines
    zIndex: 2000000000, // The z-index (defaults to 2e9)
    className: 'spinner', // The CSS class to assign to the spinner
    position: 'absolute', // Element positioning
    },
    target = document.getElementById('mapid'),
    spinner = new Spin.Spinner(opts).spin(target);

// Function to fetch data for country when a new country is selected
function getData(code) {
    $.ajax({
        url: "php/data.php",
        type: 'POST',
        dataType: 'json',
        data: {
            iso: code,
            currency: homeCurrency
        },
        // As the ajax loads start a spinner so the user knows something is happening
        beforeSend: function () {
            spinner.spin(target);
        },
        success: function(response) {
            
            var rest = response['data']['rest'];

            // Set the select to current country
            document.getElementById('country').value = rest['alpha3Code'];

            // Clear data for city and country earthquakes so only new data is shown when another country is selected.
            // Same for border data and daily earthquake geoJSON file then fill with more up to date data
            citygeoJSON.clearLayers();
            earthgeoJSON.clearLayers();
            borderGroup.clearLayers();

            // Conditional statement if Capital is unavailable to display alternate message, this was needed as Antartica has no capital or subregion
            var cap;
            if (rest['capital'] == "") {
                cap = ("<tr><td class='right'> Capital: </td><td class='left'> Not Available</td></tr>");
            } else {
                cap = ("<tr><td class='right'> Capital: </td><td class='left'>" + rest['capital'] +  "</td></tr>");
            };

            // Conditional statement if Continetn Subregion is unavailable to display alternate message
            var sub;
            if (rest['subregion'] == "") {
                sub = ("<tr><td class='right'> Subregion: </td><td class='left'> Not Available</td></tr>");
            } else {
                sub = ("<tr><td class='right'> Subregion: </td><td class='left'>" + rest['subregion'] +  "</td></tr>");
            };
            
            // Popup used to show information to user using results from ajax call
            var genPopup = L.popup({className: 'gen'}).setContent(
                "<table>" +
                    "<tr>" +
                        "<td colspan='2' id='space'>" + "<img src=" + rest['flag'] + " id='flag' ></img></td>" + 
                    "</tr>" +
                    "<tr>" +
                        "<td colspan='2' id='space'>" + "<b> " + rest['name'] +  " (" + rest['alpha2Code'] + ")" + " </b>" + "</td>" + 
                    "</tr>" + 
                    "<tr>" +
                        "<td class='right'> Native name: </td>" + 
                        "<td class='left'>" + rest['nativeName'] + "</td>" +
                    "</tr>" + 
                    "<tr>" +
                        cap + 
                    "</tr>" + 
                    "<tr>" + 
                        "<td class='right'> Continent: </td>"  + 
                        "<td class='left'>" + rest['region'] +
                    "</tr>" + 
                    "<tr>" + 
                        sub + 
                    "</tr>" + 
                    "<tr>" + 
                        "<td class='right'> Language: </td>"  + 
                        "<td class='left'> " + rest['languages'][0]['name'] + "</td>" +
                    "</tr>" +
                    "<tr>" +
                        "<td class='right'> Population: </td>"  + 
                        "<td class='left'>" + commas(rest['population']) + "</td>" +
                    "</tr>" +
                    "<tr>" +
                        "<td class='right'> Area: </td>" + 
                        "<td class='left'>" + commas(Math.round(rest['area'])) + " Km"+ '&#178' + "</td>" +
                    "</tr>" + 
                    "<tr>" +
                        "<td class='right'> Calling Code: </td>" + 
                        "<td class='left'> +" + rest['callingCodes'] + "</td>" +
                    "</tr>" +
                    "<tr>" +
                        "<td class='right'> Top Level Domain: </td>" + 
                        "<td class='left'>" + rest['topLevelDomain'] + "</td>" +
                    "</tr>" + 
                "</table>"
            ).setLatLng(rest['latlng']);

            // Create a custom style for the border highlight using the geoJson data
            var myStyle = {
                color: '#4497b2',
                opacity: 1,
                fillOpacity: 0.4,
                fillColor: '#b04d8f',
                dashArray: '6, 4',
                weight: 2
            };
            
            // Add the result to a feature group so that it can be added to the map and cleared and rewritten if another country is selected
            L.geoJson(response['data']['borders'], {
                style: myStyle
            }).addTo(borderGroup);
            // Add the border and popup to the map so country is highlighted and general information shown
            borderGroup.bindPopup(genPopup).addTo(mymap);
            // Map is also centered after call so the country border is centered and zoomed to the right level after it is selected
            mymap.fitBounds(borderGroup.getBounds()).openPopup(genPopup);

            neswarray = response['data']['city']['data'];
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

                // Create a variable to set content for the popups for each circle marker, which displays data when clicked
                var data = L.popup({className: 'nesw'}).setContent(
                    "<table>" + 
                        "<tr>" + 
                            "<td colspan='2'><b>" + neswarray[j]['name'] + "</b></td>" + 
                        "</tr>" + 
                        "<tr>" + 
                            "<td class='right'>Population: </td>" +
                            "<td class='left'>" + pop + "</td>" + 
                        "</tr>" + 
                        "<tr>" + 
                            "<td class='right'>Timezone: </td>" +
                            "<td class='left'>" + neswarray[j]['timezone'] + "</td>" + 
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
                        "coordinates": [neswarray[j]['longitude'], neswarray[j]['latitude']]
                    }
                };

                // Add to the feature array using the push method and the data in the holding variable
                feature.push(cityHold);
            };

            // Create the geoJson data using city information
            var citydata = { "type": "FeatureCollection", "features": feature};

            // The geoJSOn then has the data added to it and it is added to the layer so it can be shown/hidden by user
            citygeoJSON.addData(citydata);

            // Plot Earthquakes as a circle with radius proportional to magnitude
            var earthData = response['data']['localQuake']['earthquakes'];

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
                            "<td class='right'>Magnitude: </td>" +
                            "<td class='left'>" + earthData[i]['magnitude'] + "</td>" + 
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
            
            // The geoJSOn then has the data added to it and it is added to the layer so it can be shown/hidden by user
            earthgeoJSON.addData(localquakes);

            // Set a variable to use  after check on exchange data
            var rate;
            
            // Conditional statement to set value of exchange to N/A if not available
            // or to take number to 2 decimal points if data is avaialble
            if (isNaN(response['data']['exchange'])) {
                rate = response['data']['exchange'];
            } else {
                rate = (response['data']['exchange']).toFixed(2);
            };
            
            // Set variable for exchange content to be put in the bootstrap modal
            $('#exchange1').empty().append(rest['currencies'][0]['name']);
            var pub = '1.00 ' + homeCurrency + ' : ' + rest['currencies'][0]['symbol'] + rate;
            $('#exchange2').empty().append(pub);
            $('#exchange3').empty().append(rest['currencies'][0]['code']);
            $('#exchange4').empty().append(rest['currencies'][0]['symbol']);

            // Set variable for corona data to be put in the bootstrap modal
            $('#corona1').empty().append(commas(response['data']['corona']['confirmed']));
            $('#corona2').empty().append(commas(response['data']['corona']['critical']));
            $('#corona3').empty().append(commas(response['data']['corona']['deaths']));

            // Set variable for weather information to be put in the bootstrap modal
            $('#weather1').empty().append('<img id="mainWeathIcon" src="https://openweathermap.org/img/wn/' + response['data']['forecast']['daily'][0]['weather'][0]['icon'] + '@2x.png"></img>');
            $('#weather2').empty().append(response['data']['forecast']['daily'][0]['weather'][0]['main']);
            $('#weather3').empty().append(capitalizeFirstLetter(response['data']['forecast']['daily'][0]['weather'][0]['description']));
            $('#weather4').empty().append(response['data']['forecast']['daily'][0]['clouds'] + '%');
            $('#weather5').empty().append((response['data']['forecast']['daily'][0]['temp']['morn'] - 273.15).toFixed(1) + '&#8451;');
            $('#weather6').empty().append((response['data']['forecast']['daily'][0]['feels_like']['day'] - 273.15).toFixed(1) + '&#8451;');
            $('#weather7').empty().append((response['data']['forecast']['daily'][0]['temp']['max'] - 273.15).toFixed(1) + '&#8451;');
            $('#weather8').empty().append((response['data']['forecast']['daily'][0]['temp']['min'] - 273.15).toFixed(1) + '&#8451;');
            $('#weather9').empty().append(response['data']['forecast']['daily'][0]['pressure'] + ' mbar');
            $('#weather10').empty().append(response['data']['forecast']['daily'][0]['humidity'] + '%');
            $('#weather11').empty().append(response['data']['forecast']['daily'][0]['wind_speed'] + 'm/s');
            $('#weather12').empty().append(response['data']['forecast']['daily'][0]['wind_deg'] + '\u00B0');
            $('#weather13').empty().append(timestamp(response['data']['forecast']['daily'][0]['sunrise']));
            $('#weather14').empty().append(timestamp(response['data']['forecast']['daily'][0]['sunset']));
            
            // Set variable for forecast to be put in the bootstrap modal
            $('#forecast1').empty().append('<b>' + day(response['data']['forecast']['daily'][1]['dt']).substring(0,3) + '</b>');
            $('#forecast2').empty().append('<img id="weathIcon" src="https://openweathermap.org/img/wn/' + response['data']['forecast']['daily'][1]['weather'][0]['icon'] + '@2x.png"></img');
            $('#forecast3').empty().append((response['data']['forecast']['daily'][1]['feels_like']['day'] - 273.15).toFixed(1) + '&#8451;');
            $('#forecast4').empty().append(capitalizeFirstLetter(response['data']['forecast']['daily'][1]['weather'][0]['description']));
            $('#forecast5').empty().append('<b>' + day(response['data']['forecast']['daily'][2]['dt']).substring(0,3) + '</b>');
            $('#forecast6').empty().append('<img id="weathIcon" src="https://openweathermap.org/img/wn/' + response['data']['forecast']['daily'][2]['weather'][0]['icon'] + '@2x.png"></img');
            $('#forecast7').empty().append((response['data']['forecast']['daily'][2]['feels_like']['day'] - 273.15).toFixed(1) + '&#8451;');
            $('#forecast8').empty().append(capitalizeFirstLetter(response['data']['forecast']['daily'][2]['weather'][0]['description']));
            $('#forecast9').empty().append('<b>' + day(response['data']['forecast']['daily'][3]['dt']).substring(0,3) + '</b>');
            $('#forecast10').empty().append('<img id="weathIcon" src="https://openweathermap.org/img/wn/' + response['data']['forecast']['daily'][3]['weather'][0]['icon'] + '@2x.png"></img');
            $('#forecast11').empty().append((response['data']['forecast']['daily'][3]['feels_like']['day'] - 273.15).toFixed(1) + '&#8451;');
            $('#forecast12').empty().append(capitalizeFirstLetter(response['data']['forecast']['daily'][3]['weather'][0]['description']));
            $('#forecast13').empty().append('<b>' + day(response['data']['forecast']['daily'][4]['dt']).substring(0,3) + '</b>');
            $('#forecast14').empty().append('<img id="weathIcon" src="https://openweathermap.org/img/wn/' + response['data']['forecast']['daily'][4]['weather'][0]['icon'] + '@2x.png"></img');
            $('#forecast15').empty().append((response['data']['forecast']['daily'][4]['feels_like']['day'] - 273.15).toFixed(1) + '&#8451;');
            $('#forecast16').empty().append(capitalizeFirstLetter(response['data']['forecast']['daily'][4]['weather'][0]['description']));
            $('#forecast17').empty().append('<b>' + day(response['data']['forecast']['daily'][5]['dt']).substring(0,3) + '</b>');
            $('#forecast18').empty().append('<img id="weathIcon" src="https://openweathermap.org/img/wn/' + response['data']['forecast']['daily'][5]['weather'][0]['icon'] + '@2x.png"></img');
            $('#forecast19').empty().append((response['data']['forecast']['daily'][5]['feels_like']['day'] - 273.15).toFixed(1) + '&#8451;');
            $('#forecast20').empty().append(capitalizeFirstLetter(response['data']['forecast']['daily'][5]['weather'][0]['description']));
            $('#forecast21').empty().append('<b>' + day(response['data']['forecast']['daily'][6]['dt']).substring(0,3) + '</b>');
            $('#forecast22').empty().append('<img id="weathIcon" src="https://openweathermap.org/img/wn/' + response['data']['forecast']['daily'][6]['weather'][0]['icon'] + '@2x.png"></img');
            $('#forecast23').empty().append((response['data']['forecast']['daily'][6]['feels_like']['day'] - 273.15).toFixed(1) + '&#8451;');
            $('#forecast24').empty().append(capitalizeFirstLetter(response['data']['forecast']['daily'][6]['weather'][0]['description']));
            $('#forecast25').empty().append('<b>' + day(response['data']['forecast']['daily'][7]['dt']).substring(0,3) + '</b>');
            $('#forecast26').empty().append('<img id="weathIcon" src="https://openweathermap.org/img/wn/' + response['data']['forecast']['daily'][7]['weather'][0]['icon'] + '@2x.png"></img');
            $('#forecast27').empty().append((response['data']['forecast']['daily'][7]['feels_like']['day'] - 273.15).toFixed(1) + '&#8451;');
            $('#forecast28').empty().append(capitalizeFirstLetter(response['data']['forecast']['daily'][7]['weather'][0]['description']));
        
        },
        // Set spinner to stop loading when the data has been acquired
        complete: function (){
            spinner.stop();
        },
        error: function(jqXHR, exception){
            errorajx(jqXHR, exception);
            console.log("Data");
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
function day(timestamp) {
                
    // Get milliseconds by multiplying timestamp by 1000
    const milliseconds = timestamp * 1000 
    // Assing this value as a date
    const dateObject = new Date(milliseconds)
    // put into variable that can be returned with the day, date and month
    const humanDateFormat = dateObject.toLocaleString("en-US", {weekday: "long"}) + "</br>" + dateObject.toLocaleString("en-US", {month: "long"}) +  " " + dateObject.toLocaleString("en-US", {day: "numeric"});
    return humanDateFormat
};

// Function to add commmas to long n umbers to make more  human readable
function commas(x) {

    // regex uses positive lookahead assertion to look for a point with 3 digits in a row after it,
    // the negative makes sure the point has exactly 3 digits ahead of it and the replace puts a comma there
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
};

// Function to get first letter of string then capitalise it then add the rest of the string using the slice method
function capitalizeFirstLetter(string) {

    return string.charAt(0).toUpperCase() + string.slice(1);
};

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

// Function to create easy buttons to bring up the modal with user requested data
function easyButton(name, icon) {
    L.easyButton({
        states:[
          {
            icon: icon,
            title: name + ' Data',
            onClick: function modal(){
    
                switch(name) {
                    case 'Weather':
                        $('#weather-modal').modal('show');
                        break;
                    case 'Forecast':
                        $('#forecast-modal').modal('show');
                        break;
                    case 'Currency':
                        $('#exchange-modal').modal('show');
                        break;
                      case 'Coronavirus':
                        $('#corona-modal').modal('show');
                        break;
                  };
            }
          }
        ]
    }).addTo(mymap);
};

weatherEasy = new easyButton('Weather', '&#x1F326');
forecastEasy = new easyButton('Forecast', '&#55');
weatherEasy = new easyButton('Currency', '&#128181');
forecastEasy = new easyButton('Coronavirus', '&#129440');
