
var layout; // all the "global" type stuff should at least be contained in a big layout class (until we come up with a good design)

//Class definitions:
//TODO: Methods should go on the prototypes

function MapLayout(){
	this.sideBar = new SideBar(this,"resultlist");
	this.mapPane = new MapPane(this, new google.maps.LatLng(40.00651985589961, -105.2630627155304), 18, "map_canvas");
	this.databaseService = new DatabaseService(this,this.mapPane);
}

function DatabaseService(layout,mapPane){
	this.layout = layout;
	this.mapPane = mapPane;
	//this one is for searching
	this.places_service = new google.maps.places.PlacesService(this.mapPane.map);
	//this one is temporary
	this.pretend_database = [];
	//add public interface functions here	
	this.nearbySearch = function(searchString, callback){
		
		this.places_service.nearbySearch({
			location: this.mapPane.map.getCenter(),
			radius: 2000,
			keyword: searchString
		},
			function (results, status) {
				if (status == google.maps.places.PlacesServiceStatus.OK) {
					var places = [];			
					$.each(results,function(index, result){
						var newPlace = new Place({
							name : result.name,
							address : result.vicinity,
							location : result.geometry.location,
							icon : result.icon,
							id : result.id,
							reference : result.reference,
							types : result.types,
							events : result.events
						});
						places.push(newPlace);
					});
	
					callback(places,status);
					
	    		}else{
	    			
	    			callback([],status);
	    			
	    		}
	    	}
    	);
	}
	
	this.addPlace = function(place){
		var str = "Pretending to store a place that looks like: \n";
		for(key in place){
			str+= (key+" : "+place[key]+"\n");
		}
		alert(str);
	}
}

function MapPane(layout, location, zoom, DIVid){
	this.layout = layout;
	this.DIVid = DIVid;
	this.infoWindow = null;
	this.mapOptions = {
		center : location,
		zoom :zoom,
		mapTypeId : google.maps.MapTypeId.ROADMAP
	};
	
	this.map = new google.maps.Map(document.getElementById(this.DIVid), this.mapOptions);

	this.openInfo = function(latLng,content){
		if(this.infoWindow){
			this.infoWindow.close();
		}
		
		this.infoWindow = new google.maps.InfoWindow({
			content: content,
			position: latLng
		});
		
		this.infoWindow.open(this.map);
	}

	// google.maps.event.addListener(this.map,"rightclick",function(mouseEvent){
		// // add_place(mouseEvent.latLng,"Test Location 9","store");
	// });


};
	
function Place(opts){
	this.location = null;
	this.name = null;
	this.description = '';
	this.types = [];
	this.events = [];
	this.id = null;
	
	this.marker = null;
	this.placeForm = null; //TODO: Eliminate this direction of reference?
	this.summary = null; //TODO: Eliminate this direction of reference?
	
	for(key in opts){
		if(opts[key]!=undefined){
			this[key]=opts[key];
		}
	}
	
}

function Event(place, opts){
	this.place = place;
	this.name = 'New Event';
	this.address = place.address;
	this.description = '';
	this.types = [];
	this.members = [];
	this.organizer = '';
	
	for(key in opts){
		this[key]=opts[key];
	}
}

function PlaceMarker(layout, place){
	
}



function EventForm(layout, eventData){
	this.layout = layout;
	this.eventData = eventData;
	
	this.generateHTML = function(){
		var me = this;
		
		var fields = {
			"name" : $("<input>").attr("type","text").attr("class","event_form_input").attr("value",eventData.name),
			"description" : $("<input>").attr("type","text").attr("class","event_form_input").attr("value",eventData.description),
			"organizer" : $("<input>").attr("type","text").attr("class","event_form_input").attr("value",eventData.organizer)
		};
		
		var labels = {
			"name" : "Name:",
			"description" : "Description:",
			"organizer" : "Contact:"
		};
		
		var jq = $("<div>").attr("class","event_form_div");
		jq.append(
			$("<p>").attr("class","event_form_name").append(eventData.name)
		);
		
		$.each(fields,function(property, input){
			var thing = $("<p>").attr("class","event_form_field").append(
				$("<p>").attr("class","event_form_field_label").append(labels[property]),
				input
			);
			jq.append(thing);
		});
		
		jq.append(
			$("<p>").attr("class","event_button_row").append(
				$("<a>").attr("class","event_cancel_button").attr("href","#").append("").data("eventData",me.eventData).click(function(){
					var eventData = $(this).data("eventData");
					var summary = new PlaceSummary(me.layout,eventData.place);
					me.layout.mapPane.openInfo(eventData.place.location,summary.generateHTML());
				}),
				$("<a>").attr("class","event_okay_button").attr("href","#").append("").data("eventData",me.eventData).click(function(){
					var eventData = $(this).data("eventData");
					$.each(fields,function(property, input){
						eventData[property] = input.val();
					});
					if(eventData.place.events.indexOf(eventData)==-1){
						eventData.place.events.push(eventData);
					}
					var summary = new PlaceSummary(me.layout,eventData.place);
					var contents = summary.generateHTML();
					me.layout.mapPane.openInfo(eventData.place.location,contents);
					me.layout.sideBar.generateHTML();
				})
			)
		
		);
		
		return jq.get(0);
	}
	
}

function PlaceSummary(layout, place){
	this.layout = layout;
	this.place = place;
	
	// this just returns a new LI, whereas SideBar's similarly named function actually puts it on the DOM. This is confusing and it might be better if the actual DOM LI was an instance variable in PlaceSummary and could be updated directly
	this.generateHTML = function(){
		var me = this;
		
		var jq = $("<div>").attr("class","result_div").append(
			$("<p>").attr("class","result_name").append(
				$("<a>").attr("class","result_name_link").attr("href","#").append(this.place.name).data("place",me.place).click(
					function(){
						var place = $(this).data("place");
						//place.placeForm = new PlaceForm(me.layout,place);//does this really belong here? probably not
						//me.layout.mapPane.openInfo(place.location,place.placeForm.generateHTML());
						me.layout.mapPane.openInfo(place.location,me.generateHTML());
					}
				)
			),
			$("<p>").attr("class","result_address").append(place.address),
			$("<p>").attr("class","result_events_header").append("Events:")
		);
		
		var eventList = $("<ul>").attr("class","result_events_ul");

		$.each(me.place.events,function(index,eventData){
			var summary = (new EventSummary(me.layout,eventData))
			eventList.append(
				$("<li>").attr("class","result_events_li").append(summary.generateHTML())
			);
		}),
		
		eventList.append(
			$("<li>").attr("class","result_events_li").append(
				$("<a>").attr("class","event_add_button").attr("href","#").append("").data("place",me.place).click(
					function(){
						var place = $(this).data("place");
						var form = new EventForm(me.layout, new Event(place,{}));
						me.layout.mapPane.openInfo(place.location,form.generateHTML());
					}
				)
			)
		);
		
		jq.append(eventList);
		
		return jq.get(0);
	}
}

function EventSummary(layout, eventData){
	this.layout = layout;
	this.eventData = eventData;
	
	this.generateHTML = function(){
		var me = this;
		
		var jq = $("<div>").attr("class","event_summary").append(
			$("<p>").attr("class","event_summary_name").append(
				$("<a>").attr("class","event_remove_button").attr("href","#").append("").data("eventData",me.eventData).click(
					function(){
						var eventData = $(this).data("eventData");
						var eventArray = eventData.place.events;
						var index = eventArray.indexOf(eventData);
						if(index!=-1){
							eventArray.splice(index,1);
						}
						var form = new PlaceSummary(me.layout, eventData.place);
						me.layout.mapPane.openInfo(eventData.place.location,form.generateHTML());
						me.layout.sideBar.generateHTML();
					}
				),
				$("<a>").attr("class","event_name_link").attr("href","#").append(me.eventData.name).data("eventData",me.eventData).click(
					function(){
						var eventData = $(this).data("eventData");
						var form = new EventForm(me.layout,eventData);
						me.layout.mapPane.openInfo(eventData.place.location,form.generateHTML());
					}
				)
			)
		);
		
		return jq.get(0);
	}
	
}

function SideBar(layout, ULid){
	this.layout = layout;
	this.ULid = ULid;
	
	this.placeSummaries = [];
	// this.places = [];
	
	this.showPlaces = function(places){
		this.placeSummaries = [];
		var me = this;
		$.each(places,function(index,place){
			me.addPlace(place);
		});
		this.generateHTML();
	}
	
	this.addPlace = function(place){
		this.placeSummaries.push(new PlaceSummary(this.layout,place));
	}
	
	this.addPlaceSummary = function(summary){
		this.placeSummaries.push(summary);
	}
	
	this.generateHTML = function(){
		$("ul#"+this.ULid).empty();
		var me = this;
		$.each(this.placeSummaries, function(index,summary){
			$("ul#"+me.ULid).append($("<li>").attr("class","result_li").append(summary.generateHTML()));
		});
	}
}


//junk code:
//this is how I would expect to add a place to the database, but there's all that JSONP trouble
add_place = function(latLng,name,type){
	var request = {
			type: 'POST',
			url:"https://maps.googleapis.com/maps/api/place/add/json?sensor=false&key=AIzaSyBLSBTaFr11MIh8otpdIPyT1xlTBAuBsi0",
			datatype:'json',
			data:{
				"location": {
					"lat": latLng.lat(),
					"lng": latLng.lng()
				},
				"accuracy": 50,
				"name": name,
				"types": [type],
				"language": "en-US"
			},
			success: function(respond,textStatus,jqXHR){
				alert("in respond!");
				if(respond){
					alert(respond);
					alert(respond["status"]);
					alert(respond["reference"]);
					alert(respond["id"]);
					open_info(latLng, respond["id"]);
				}else{
					alert("something wrong with response");
				}
			},
			error: function(jqXHR,textStatus,errorThrown){
				alert("error!");
				alert(textStatus);
				alert(errorThrown);
			}
		};
	$.ajax(request);
}

//"main method"		
$(document).ready(function() {
		
	layout = new MapLayout();
	
	$("input#search_input").keypress(function(e){
		
		if(e.which == 13){
			layout.databaseService.nearbySearch(
				$("input#search_input").val(),
				function(places, status){
					var summary = new PlaceSummary(layout,places[0]);
					layout.mapPane.openInfo(places[0].location, summary.generateHTML());
					layout.sideBar.showPlaces(places);
			});
			
			return false; //this "absorbs" the keypress and prevents it from being sent down to other listeners or the default action
		}
	});
		
		













// function PlaceForm(layout, place){
	// this.layout = layout;
	// this.place = place;
// 	
	// this.generateHTML = function(){
		// var me = this;
// 		
		// var fields = {
			// "name" : $("<input>").attr("type","text").attr("width",400),
			// "description" : $("<input>").attr("type","text").attr("width",400)
		// }
// 		
		// for(key in fields){
			// if(place[key] != null){
				// $(fields[key]).attr("value",place[key]);
			// } 
		// }
// 		
		// var div = $("<div>").attr("class","place_form_div").append(
// 			
			// $("<p>").attr("class","place_form_name").append(this.place.name),
// 			
			// $("<p>").append("location: "+this.place.location.toString()), //we will give everything CSS classes later
// 			
			// $("<p>").append(
				// "name: ",
				// fields["name"]
			// ),
			// $("<p>").append(
				// "description: ",
				// fields["description"]
			// ),
// 			
			// $("<a>").attr("href","#").attr("class","place_form_add").append("Add place").data("place", place).data("fields",fields).click(function(){
				// $.each(fields,function(key,field){
					// place[key] = field.val();
				// });
				// me.layout.databaseService.addPlace($(this).data("place"));	//when this is real we will need to deal with MORE callbacks		
			// })
// 			
		// );
// 
		// return div.get(0); //convert from jquery object to DOM object
	// }
// }	
});