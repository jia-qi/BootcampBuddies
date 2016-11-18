var map;
var gmarkers = [];
var myVM;

var yelpAuth = {
                //
                // Update with your auth tokens.
                //
    consumerKey: "CYIw0EYo7t4MxnbzgeXGwA", 
    consumerSecret: "FesnqFQwQ2XldfAoYdCd4KZ0WHw",
    accessToken: "9-HRKj_YfATgLgKR1piSAb7CTfMSH_QH",
    accessTokenSecret: "j0NGfSG6BzIbCme1h3YByKbEPt0"
        };

// function initMap() {
//     var myLatLng = {lat: 37.7423, lng: -122.473823};
//     map = new google.maps.Map(document.getElementById('map'), {
//               zoom: 15,
//               center: myLatLng,
//               mapTypeId: google.maps.MapTypeId.ROADMAP
//             });
//     google.maps.event.addDomListener(window, "resize", function() {
//         var center = map.getCenter();
//         google.maps.event.trigger(map, "resize");
//         map.setCenter(center); 
//     });

//     myVM = new ViewModel();
//     ko.applyBindings(myVM, document.getElementById("locations"));
// };

function initMap() {
    findMiddle();
};

var Locations = [
    {
        name: 'Guerra Quality Meats',
        lat:  37.743461,
        lng: -122.471199,
        address: '490 Taraval St, San Francisco',
        index: 0,
        yelpID: 'guerra-quality-meats-san-francisco',
        reviewCount: 0,
        imageUrl: null,
        ratingImageUrl: '',
        snippet: ''

    }
]

var Location = function(map, data){
	var marker;

	this.name = ko.observable(data.name);
	this.lat = ko.observable(data.lat);
	this.lng = ko.observable(data.lng);
	this.address = ko.observable(data.address);
	this.yelpID = ko.observable(data.yelpID);
	this.index = ko.observable(data.index);
	this.reviewCount = ko.observable(data.reviewCount);
    this.imageUrl = ko.observable(data.imageUrl);
    this.ratingImageUrl = ko.observable(data.ratingImageUrl);
    this.snippet = ko.observable(data.snippet);

	marker = new google.maps.Marker({
		position: new google.maps.LatLng(data.lat, data.lng),
		animation: google.maps.Animation.DROP,
		icon: 'http://maps.google.com/mapfiles/ms/icons/red-dot.png'
	});

          
	var infowindow = new google.maps.InfoWindow({
          content: "<strong>" + data.name + "</strong>" + "<br>" + data.address
        });

	google.maps.event.addListener(marker, 'click', function() {
        infowindow.open(map, this);
        clicked_item = myVM.locationList()[data.index];
        locationClick(marker,clicked_item);
    
    });

    google.maps.event.addListener(marker, 'mouseover', function() {
    	infowindow.open(map, this);
    });

    google.maps.event.addListener(marker, 'mouseout', function() {
    	infowindow.close();
    });

	this.isVisible = ko.observable(false);

	this.isVisible.subscribe(function(currentState){
		if (currentState) {
			marker.setMap(map);
		} else {
			marker.setMap(null);
		}
	});

	this.isVisible(true);
	gmarkers.push(marker);
}


var ViewModel = function(){

    var self = this;
    this.markerList = ko.observableArray([]);
    this.query = ko.observable('');
    this.currentLoc = ko.observable('');
    this.errorMsg = ko.observable('');


    this.locationList = ko.observableArray([]);
    Locations.forEach(function(locItem){
    	self.locationList.push(new Location(map, locItem));
    });

    this.selectedItem = ko.observable('');

    // location filter is used for the search field
    self.filteredLocations = ko.computed(function () {
        var filter = self.query().toLowerCase();
        var match;

        if (!filter) {
        	match = self.locationList();
        	match.forEach(function(item){
    			item.isVisible(true);
    		});
            return match
        } else {
            var isSelected;
            return ko.utils.arrayFilter(self.locationList(), function (item) {
                match = item.name().toLowerCase().indexOf(filter) !== -1;
                item.isVisible(match);
                self.selectedItem('');
                self.currentLoc('');
                toggleMarkers(null);
                return match;
            });
        }
    });

    this.hilightItem = function(item){
        self.selectedItem(item.name());
    };

    this.changeCurrentLoc = function(item){
        self.currentLoc(item);
    };

    this.onClick = function(item){
        locationClick(gmarkers[item.index()], item);
    };

}

function toggleMarkers(marker){
    for (i=0; i < gmarkers.length; i++){
            gmarkers[i].setIcon('http://maps.google.com/mapfiles/ms/icons/red-dot.png');
        }
    if (marker){
        marker.setIcon('http://maps.google.com/mapfiles/ms/icons/green-dot.png');
    }    
    
    };

function locationClick(marker, clicked_item){
    toggleMarkers(marker);
    myVM.hilightItem(clicked_item);
    getYelpData(clicked_item);
};
    
//Yelp functions bellow

function nonce_generate() {
        return (Math.floor(Math.random() * 1e12).toString());
    };

function getYelpData(item){
    var yelpID = item.yelpID();

    var yelp_url = 'https://api.yelp.com/v2/business/' + yelpID;

    var parameters = {

            oauth_consumer_key: yelpAuth.consumerKey,
            oauth_token: yelpAuth.accessToken,
            oauth_nonce: nonce_generate(),
            oauth_timestamp: Math.floor(Date.now()/1000),
            oauth_signature_method: 'HMAC-SHA1',
            callback: null       
        };

    var oauth_signature = oauthSignature.generate('GET', yelp_url, parameters, yelpAuth.consumerSecret, yelpAuth.accessTokenSecret);
    parameters.oauth_signature = oauth_signature; 

    $.ajax({
            'url' : yelp_url,
            'data' : parameters,
            'dataType' : 'jsonp',
            'jsonpCallback' : 'myCallback',
            'cache': true
    })
    .done(function(data, textStatus, jqXHR) {
        myVM.errorMsg('');
        
        item.reviewCount(JSON.stringify(data.review_count));
        
        // removing extra quotes from image URL
        var image_url = JSON.stringify(data.image_url);
        image_url = image_url.replace(/["]+/g, '')
        item.imageUrl(image_url);

        // removing extra quotes from image URL
        var rating_url = JSON.stringify(data.rating_img_url);
        rating_url = rating_url.replace(/["]+/g, '')
        item.ratingImageUrl(rating_url);

        item.snippet(JSON.stringify(data.snippet_text));

        myVM.changeCurrentLoc(item);

    })
    .fail(function(jqXHR, textStatus, errorThrown) {
        console.log('error[' + errorThrown + '], status[' + textStatus + '], jqXHR[' + JSON.stringify(jqXHR) + ']');
        myVM.errorMsg('Could not load Yelp reviews');
        myVM.changeCurrentLoc('');
    });

};

function findMiddle() {

    var geocoder = new google.maps.Geocoder();
    var firstAddress = "17059 albers street";
    var secondAddress = "8632 longden ave";
    var firstLatitude;
    var firstLongitude;
    var secondLatitude;
    var secondLongitude;

    geocoder.geocode( { 'address': firstAddress}, function(results, status) {

        if (status == google.maps.GeocoderStatus.OK) {
            firstLatitude = results[0].geometry.location.lat();
            firstLongitude = results[0].geometry.location.lng();
            console.log(firstLatitude);
            console.log(firstLongitude);
        }
    

    geocoder.geocode( { 'address': secondAddress}, function(results, status) {

        if (status == google.maps.GeocoderStatus.OK) {
            secondLatitude = results[0].geometry.location.lat();
            secondLongitude = results[0].geometry.location.lng();
            console.log(secondLatitude);
            console.log(secondLongitude);
        }


            console.log("can I still:" + firstLatitude);
            console.log("can I still:" + firstLongitude);

    var map = new google.maps.Map(document.getElementById('map'), {
        zoom: 9,
        center: new google.maps.LatLng(firstLatitude, firstLongitude),
        mapTypeId: google.maps.MapTypeId.ROADMAP
    });

    var infowindow = new google.maps.InfoWindow();

    var marker, i;


        marker = new google.maps.Marker({
            position: new google.maps.LatLng(firstLatitude, firstLongitude),
            map: map
        });

        google.maps.event.addListener(marker, 'click', (function(marker, i) {
            return function() {
                infowindow.setContent(firstAddress);
                infowindow.open(map, marker);
            }
        })(marker, i));
    

    var bound = new google.maps.LatLngBounds();

        bound.extend( new google.maps.LatLng(firstLatitude, firstLongitude) );
        bound.extend( new google.maps.LatLng(secondLatitude, secondLongitude) );

        marker = new google.maps.Marker({
            position: new google.maps.LatLng(secondLatitude, secondLongitude),
            map: map
        });

        // OTHER CODE
    

    console.log( "the center lat is: " + bound.getCenter().lat() + " the center long is: " + bound.getCenter().lng() );


        marker = new google.maps.Marker({
            position: new google.maps.LatLng(bound.getCenter().lat(), bound.getCenter().lng()),
            map: map
        });

    // getYelpCafes(bound.getCenter().lat(), bound.getCenter().lng());

    //var yelp_url = 'https://api.yelp.com/v2/search?category_filter=bars&cll=' + centerLat + ',' + centerLon;
    var yelp_url = 'http://api.yelp.com/v2/search';

    var parameters = {

            oauth_consumer_key: yelpAuth.consumerKey,
            oauth_token: yelpAuth.accessToken,
            oauth_nonce: nonce_generate(),
            oauth_timestamp: Math.floor(Date.now()/1000),
            oauth_signature_method: 'HMAC-SHA1',
            // oauth_signature: yelpAuth.accessTokenSecret,
            callback: 'JSON_CALLBACK',
            term: 'cafes',
            //location: '91316'
            ll: bound.getCenter().lat() + "," + bound.getCenter().lng(),
            limit: 10
        };

    var oauth_signature = oauthSignature.generate('GET', yelp_url, parameters, yelpAuth.consumerSecret, yelpAuth.accessTokenSecret);
    parameters.oauth_signature = oauth_signature; 

    $.ajax({
            'url' : yelp_url,
            'data' : parameters,
            'dataType' : 'jsonp',
            'jsonpCallback' : 'myCallback',
            'cache': true
    })
    .done(function(data, textStatus, jqXHR) {
        // myVM.errorMsg('');
        console.log(data.businesses);
        // item.reviewCount(JSON.stringify(data.review_count));
        
        // // removing extra quotes from image URL
        // var image_url = JSON.stringify(data.image_url);
        // image_url = image_url.replace(/["]+/g, '')
        // item.imageUrl(image_url);

        // // removing extra quotes from image URL
        // var rating_url = JSON.stringify(data.rating_img_url);
        // rating_url = rating_url.replace(/["]+/g, '')
        // item.ratingImageUrl(rating_url);

        // item.snippet(JSON.stringify(data.snippet_text));

        // myVM.changeCurrentLoc(item);
            var image = 'https://developers.google.com/maps/documentation/javascript/examples/full/images/beachflag.png';
            for (i=0; i < data.businesses.length; i++){
                console.log(i);
                console.log("position of result is: " + data.businesses[i].location.coordinate.latitude + "," + data.businesses[i].location.coordinate.longitude);
                console.log("title of result is: " + data.businesses[i].name + " , Rating: " + data.businesses[i].rating);
                marker = new google.maps.Marker({
                    position: new google.maps.LatLng(data.businesses[i].location.coordinate.latitude, data.businesses[i].location.coordinate.longitude),
                    title: data.businesses[i].name + " , Rating: " + data.businesses[i].rating,
                    map: map,
                    icon: image
                });
                Locations.push({
                    name: data.businesses[i].name,
                    lat:  data.businesses[i].location.coordinate.latitude,
                    lng: data.businesses[i].location.coordinate.longitude,
                    address: data.businesses[i].location.address[0],
                    index: i,
                    yelpID: data.businesses[i].id,
                    reviewCount: data.businesses[i].review_count,
                    imageUrl: data.businesses[i].image_url,
                    ratingImageUrl: data.businesses[i].rating_img_url,
                    snippet: data.businesses[i].snippet_text
                    });
            } 
            console.log("Locations are: " + Locations) 
                myVM = new ViewModel();
                ko.applyBindings(myVM, document.getElementById("locations"));

    })
    .fail(function(jqXHR, textStatus, errorThrown) {
        console.log('error[' + errorThrown + '], status[' + textStatus + '], jqXHR[' + JSON.stringify(jqXHR) + ']');
        myVM.errorMsg('Could not load Yelp reviews');
        myVM.changeCurrentLoc('');
    });


    // marker = new google.maps.Marker({
    //     position: new google.maps.LatLng(bound.getCenter().lat(),bound.getCenter().lng()),
    //     map: map
    // });

    });
    });


};
