jQuery(document).ready(function($){
  var interpolate = google.maps.geometry.spherical.interpolate;
  var computeHeading = google.maps.geometry.spherical.computeHeading;
  var mor = {};
  var berkeley = new google.maps.LatLng(48.89655, 2.34666);
  var sv = new google.maps.StreetViewService();
  var map;
  var checkaround = 50;
  var directionsService = new google.maps.DirectionsService();
  var points;
  var count = 0;
  var refreshingTime = 1000;
  var origin = '600, Chiayi City, West District, Zhongshan Road, 325號';
  var destination = 'Yuejingang Riverside Park, Tainan City, 737';
  var stop = true;
  var densityFactor = 8;
  
  mor.isMobile = (/Android|webOS|CUPCAKE|BB10|froyo|iPhone|iPad|iPod|webmate|dream|incognito|BlackBerry|bada|s8000|IEMobile/i.test(navigator.userAgent)) ? true:false;
  
  mor.do_x = mor.do_y = mor.do_z = mor.do_pitch = 0;
  mor.portait = window.orientation == 0 ? true : false;
  mor.landscape1 = window.orientation == 90 ? true : false;
  mor.landscape2 = window.orientation == -90 ? true : false;
  mor.schema = 0; // 1 or 2
  
  mor.menu = $('#menu');
  mor.menu_items = mor.menu.find('.menu_item');
  
  mor.allow_orientation = true;
  if( mor.allow_orientation ) $(this).addClass('active');
  
  mor.map_wrapper = $('#map_wrapper');
  mor.map_wrapper.css({opacity:0,display:'none'});
  mor.map_wrapper.bind({
	  'click' : function(){
		  if(stop) {
			  stop = false;
			  generate();
		  } else {
			  stop = true;
		  }
	  }
  });

  mor.menu_items.bind({
    'click' : function(){
      this_item = $(this).find('.faicon');
      
      if( this_item.hasClass('icon-fs') ){
		  route();
      }
      
      if( this_item.hasClass('icon-switch') ){
        mor.allow_orientation = mor.allow_orientation ? false:true;
        if( mor.allow_orientation ) $(this).addClass('active');
        else $(this).removeClass('active');
      }
      
      if( this_item.hasClass('icon-zoomin') ){
        
        //mor.allow_orientation = mor.allow_orientation ? false:true;
        mor.pano.setZoom( mor.pano.getZoom() +1 );
		mor.pano2.setZoom( mor.pano2.getZoom() +1 );
      }
      
      if( this_item.hasClass('icon-zoomout') ){
        
        mor.pano.setZoom( mor.pano.getZoom() -1 );
        mor.pano2.setZoom( mor.pano2.getZoom() -1 );
        //mor.allow_orientation = mor.allow_orientation ? false:true;
      }
	  
	  if( this_item.hasClass('icon-map') ){
		  // var timeoutID = window.setTimeout(generate, 2000);
		  mor.pano = new google.maps.StreetViewPanorama( document.getElementById('map-canvas'), mor.gmap_options );
		  mor.pano2 = new google.maps.StreetViewPanorama( document.getElementById('map-canvasDual'), mor.gmap_options );
		  document.getElementById("menu").style.visibility = "hidden";
		  stop = false;
		  generate();
		  mor.map_wrapper.css({opacity:0,display:''});
	  }
    }
  })
  
  sv.getPanoramaByLocation(berkeley, 50, processSVData);
  
  function generate(){
	  if(stop)	return;
	  loc = points[count++];
	  setTimeout(function(){sv.getPanoramaByLocation(loc, 50, processSVData)}, refreshingTime);
  }
  
  function processSVData(data, status) {
	  // alert('After: '+data.location.latLng.lat()+', '+data.location.latLng.lng());
  	if (status == google.maps.StreetViewStatus.OK){
		
		mor.pano.setPano( data.location.pano ); // map key
		mor.pano2.setPano( data.location.pano ); // map key
        // mor.pano.setPov({heading: count>1?computeHeading(points[count-2], points[count-1]):270, pitch: -1.62});
        // mor.pano2.setPov({heading: count>1?computeHeading(points[count-2], points[count-1]):270, pitch: -1.62});
        mor.pano.setVisible(true);
		mor.pano2.setVisible(true);
		berkeley = data.location.latLng;
		
  	}
	if(stop || count == points.length)
		return;
	loc = points[count++];
	setTimeout(function(){sv.getPanoramaByLocation(loc, 50, processSVData)}, refreshingTime);
  }
  
  function route(){
      getDirection(origin, destination, function(response){
          processDirection(response);
      }, function(error){
      	
      });
  }
  function processDirection(response) {
      var lat = 40.7711329;
      var lng = -73.9741874;
      var mapOptions = {
        center: new google.maps.LatLng(lat, lng),
        zoom: 14,
        mapTypeId: google.maps.MapTypeId.ROADMAP
      };
	  map = new google.maps.Map(document.getElementById("map-canvas"), mapOptions);
      var rendererOptions = {
        map: map,
        suppressMarkers: true
      }
	  directionsDisplay = new google.maps.DirectionsRenderer(rendererOptions);
      directionsDisplay.setDirections(response);
      densify(response.routes[0].overview_path);
  }
  function densify(latlons){
      var res = [];
      for(var i=1; i<latlons.length; i++){
          var npoints = [];
          for (var j=0; j<densityFactor; j++){
              res.push(interpolate(latlons[i-1], latlons[i], j/densityFactor))
          }
      }
      points = res;
	  mor.pano = new google.maps.StreetViewPanorama( document.getElementById('map-canvas'), mor.gmap_options );
	  mor.pano2 = new google.maps.StreetViewPanorama( document.getElementById('map-canvasDual'), mor.gmap_options );
	  document.getElementById("map-canvas").style.display = "";
	  document.getElementById("map-canvasDual").style.display = "";
	  // alert(points.length);
  }
  function getDirection(origin, destination, cb_success, cb_failure){
      var request = {
            origin: origin,
            destination: destination,
          travelMode: google.maps.DirectionsTravelMode.DRIVING
      };
      directionsService.route(request, function(response, status){
          if (status == google.maps.DirectionsStatus.OK) {
              cb_success(response);
          } else {
              cb_failure(response);
          }
      });
  }
  
  
  //mor.log.text( window.orientation );
  
  mor.gmap_options={
    addressControl:false,
    clickToGo:true,
    disableDefaultUI:false,
    scrollwheel:true,
    linksControl:false,
    panControl:false,
    // panControlOptions:{position:google.maps.ControlPosition.RIGHT_TOP},
    zoomControl:false,
    zoomControlOptions:{style:google.maps.ZoomControlStyle.SMALL,position:google.maps.ControlPosition.LEFT_TOP},
    enableCloseButton:false,
    pov: {
      heading: 15, // 360 rotation degree
      pitch: -8  // 0 = horizontal axis ( -90 +90 )
    },
    zoom: 0,
    	mode:detectMode()
  };
  
  if(mor.isMobile) {
  	mor.gmap_options={ 
  		  addressControl:false,
  		  clickToGo:true,
  		  disableDefaultUI:false,
  		  scrollwheel:true,
  		  linksControl:true,
  		  panControl:false,
  		  zoomControl:false,
  		  zoomControlOptions:{style:google.maps.ZoomControlStyle.SMALL,position:google.maps.ControlPosition.LEFT_TOP},
  		  enableCloseButton:false,
  		  pov: {
  			heading: 15, // 360 rotation degree
  			pitch: -8  // 0 = horizontal axis ( -90 +90 )
  		  },
  		  zoom: 0,
  	    	  mode:detectMode()
  	 };
  }
	
  
	
  document.getElementById("map-canvas").style.display = "none";
  document.getElementById("map-canvasDual").style.display = "none";
  if(mor.isMobile)
    setupMobileViewing(mor);
	
}) // end jQuery wrapper


function toggleFullScreen(){
  if(!document.fullscreenElement&&!document.mozFullScreenElement&&!document.webkitFullscreenElement&&!document.msFullscreenElement){
    if(document.documentElement.requestFullscreen){
		document.documentElement.requestFullscreen();
    }else if(document.documentElement.mozRequestFullScreen){
		document.documentElement.mozRequestFullScreen();
    }else if(document.documentElement.webkitRequestFullscreen){
		document.documentElement.webkitRequestFullscreen(Element.ALLOW_KEYBOARD_INPUT);
    }else if(document.documentElement.msRequestFullscreen){
		document.body.msRequestFullscreen();
    }
    //document.addEventListener("mozfullscreenchange",fullscreenEvent,false);
    //document.addEventListener("webkitfullscreenchange",fullscreenEvent,false);
    //document.addEventListener("msfullscreenchange",fullscreenEvent,false)
  }else{
    if(document.CancelFullScreen){
		document.CancelFullScreen();
    }else if(document.mozCancelFullScreen){
		document.mozCancelFullScreen();
    }else if(document.webkitCancelFullScreen){
		document.webkitCancelFullScreen();
    }else if(document.msExitFullscreen){
		document.msExitFullscreen();
	}
  }
  google.maps.event.trigger(panorama,"resize");
  // pov_changed();
}
  

function supportsCanvas(){var e=document.createElement("canvas");return!(!e.getContext||!e.getContext("2d"))}

function supportsWebGL(){if(!window.WebGLRenderingContext)return!1;var e=document.createElement("canvas"),t=["webgl","experimental-webgl","moz-webgl","webkit-3d"];for(var n in t)if(gl=e.getContext(t[n]))return!0;return!1}

function detectMode(){return supportsCanvas()?supportsWebGL()?"webgl":"html5":"html4"}

