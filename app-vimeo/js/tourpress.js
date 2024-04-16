/*

    URL vars 
    start_floor : specify the fkloor to start, if not provided will start at the building spawn point (most likely the lobby of top floor)
    startscene  : specify the Pano ID you wish to load
    mode        : 'tour' oe 'explore' Default is explore


*/
const ismobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
const startfloor = getUrlParam('startfloor', null);
const mode = getUrlParam('mode', false);
const tour = getUrlParam('tour', false);
const originating_floor = getUrlParam('originatingfloor', false);
let tenant = getUrlParam('t', false);

if (!sessionStorage.getItem("mode")) {
    sessionStorage.setItem("mode", mode || 'explore');
}

if (!sessionStorage.getItem("startfloor")) {
    sessionStorage.setItem("startfloor", null);
}

if (!sessionStorage.getItem("originatingfloor")) {
    sessionStorage.setItem("originatingfloor", null);
}

if (originating_floor) {
    sessionStorage.setItem("originatingfloor", originating_floor);
}
if (startfloor) {
    sessionStorage.setItem("startfloor", startfloor);
}

if (mode) {
    sessionStorage.setItem("mode", mode);
}

sessionStorage.setItem("search_item", null);

if (!sessionStorage.getItem("tour_history")) {
    sessionStorage.setItem("tour_history", "");
}

if (!sessionStorage.getItem("welcome")) {
    sessionStorage.setItem("welcome", "no");
}

if (!sessionStorage.getItem("auto_nav")) {
    sessionStorage.setItem("auto_nav", "on");
}

if (!sessionStorage.getItem("current_query")) {
    sessionStorage.setItem("current_query", null);
}
if (!sessionStorage.getItem("paused")) {
    sessionStorage.setItem("paused", "no");
}
if (!sessionStorage.getItem("tour")) {
    sessionStorage.setItem("tour", tour || 'default');

}
if (!sessionStorage.getItem("accomp")) {
    sessionStorage.setItem("accomp", "");

}
if (tour) {
    sessionStorage.setItem("tour", tour);
}

if(tenant) {
    sessionStorage.setItem("tenant", tenant);
} else {
    if (sessionStorage.getItem("tenant")) {
        tenant = sessionStorage.getItem("tenant");
    }
}

if (!sessionStorage.getItem("timer")) {
    sessionStorage.setItem("timer", new Date().getTime());
}

// let timer = new Date();
// console.log("hello");
let timer;

function msToTime(s) {

    // Pad to 2 or 3 digits, default is 2
    function pad(n, z) {
      z = z || 2;
      return ('00' + n).slice(-z);
    }
  
    var ms = s % 1000;
    s = (s - ms) / 1000;
    var secs = s % 60;
    s = (s - secs) / 60;
    var mins = s % 60;
    var hrs = (s - mins) / 60;
  
    return pad(hrs) + ':' + pad(mins) + ':' + pad(secs) + '.' + pad(ms, 3);
  }

setInterval(function() {
    // console.log(new Date().getTime());
    // console.log(new Date().getTime() - Number(sessionStorage.getItem("timer")))
    timer = new Date().getTime() - Number(sessionStorage.getItem("timer"));

    // console.log(msToTime(timer)); 
    // console.log(timer);
},250)

//I Need to do Ipad test here and probably ios then pass it is a var
function isIpadOS() {
	return navigator.maxTouchPoints &&
	  navigator.maxTouchPoints > 2 &&
	  /MacIntel/.test(navigator.platform);
}

function isiOS() {
    return [
      'iPad Simulator',
      'iPhone Simulator',
      'iPod Simulator',
      'iPad',
      'iPhone',
      'iPod'
    ].includes(navigator.platform)
    // iPad on iOS 13 detection
    || (navigator.userAgent.includes("Mac") && "ontouchend" in document)
  }
// krpano.set('global.ios', isIpadOS() || krpano.get('device.ios'));
// alert(krpano.get('ios'));

function ochange() {
    krpano.call('resize_components()');

}

  
window.addEventListener('orientationchange', ochange);
// console.log(tenant);
embedpano({
   
    xml: (tenant) ? tenant + ".xml" : "all.xml",
    initvars: {
        maps:'./maps/',
        skin: 'ak',
        app_version: 'app-vimeo',
        startfloor: startfloor,
        ios: isIpadOS() || isiOS(),
        mode: sessionStorage.getItem("mode"),
        tour: sessionStorage.getItem("tour"),
        nav3d: localStorage.getItem("nav3d"),
        debug: localStorage.getItem("debug")
    },
    target: "pano",
    html5: "only",
    mobilescale: 1.0,
    ismobile: ismobile,
    passQueryParameters: true,
    consolelog: true
});
var krpano = document.getElementById("krpanoSWFObject");


let tp = window.tourpress = {};
tp.angle = function (cx, cy, ex, ey) {
    var dy = ey - cy;
    var dx = ex - cx;
    var a = Math.atan2(dx, dy);
    a = a * (180 / Math.PI);
    return Math.round(a);
}

function getUrlVars() {
    var vars = {};
    var parts = window.location.href.replace(/[?&]+([^=&]+)=([^&]*)/gi, function (m, key, value) {
        vars[key] = value;
    });
    return vars;
} // var mytext = getUrlVars()["text"];

function getUrlParam(parameter, defaultvalue) {
    var urlparameter = defaultvalue;
    if (window.location.href.indexOf(parameter) > -1) {
        urlparameter = getUrlVars()[parameter];
    }
    return urlparameter;
} //var mytext = getUrlParam('game','null');


// Accomplishemnts API
// let accomploStrings = {
//     drill_video: "drill_video",
//     n_stair: "n_stair",
//     s_stair: "s_stair",
//     stair_1: "stair_1",
//     stair_2: "stair_2",
//     stair_3: "stair_3",
//     stair_4: "stair_4",
//     stair_5: "stair_5",
//     stair_6: "stair_6",
//     assembly_area: "assembly_area",
//     ext_use: "extinguisher_use",
//     relo_floor: "relo_floor",
//     started_tour: "started_tour",
//     completed_tour: "completed_tour",
//     defib: "defib"
// };

function sendAccomp(n) {

    // console.log(window.accomploStrings[n]);
    try {
        let buildingCode = location.pathname.split("/")[2];   // = “ric”
        let userStr = localStorage[buildingCode + '_user'];

        let userObj = JSON.parse(userStr);
        let userId = userObj.userId;
        let accomplishmentName = window.accomploStrings[n]; //'extinguisher_video_on_floor12_complete'


        if (accomplishmentName) {
            fetch('/api2/accomplishment/' + userId + '/' + accomplishmentName)
                .catch(err => console.warn('Oops, there was an error' + err));
            // .then(result => console.log('Wrote Accomplishment successfully'))
        }
    } catch (error) {
        //if (window.accomploStrings[n]) {
            console.log("Accomplishment to send: " + window.accomploStrings[n]);
        //}
    }
}

//MICHAEL CODE 6/30/22
// function sendInventory(n) {

//     console.log(window.inventoryStrings[n]);
//     try {
//         let buildingCode = location.pathname.split("/")[2];   // = “ric”
//         let userStr = localStorage[buildingCode + '_user'];

//         let userObj = JSON.parse(userStr);
//         let userId = userObj.userId;
//         let inventoryName = window.inventoryStrings[n]; //'extinguisher_video_on_floor12_complete'


//         if (inventoryName) {
//             fetch('/api2/inventory/' + userId + '/' + inventoryName)
//                 .catch(err => console.warn('Oops, there was an error' + err));
//             // .then(result => console.log('Wrote inventory successfully'))
//         }
//     } catch (error) {
//         //if (window.inventoryStrings[n]) {
//             console.log("inventory to send: " + window.inventoryStrings[n]);
//         //}
//     }
// }

 
// Preload images
function preloadImage(url) {
    var img = new Image();
    img.src = url;
}



/*!
 * amp-playlists - Playlists for Azure Media Player
 * v0.1.0
 * 
 * copyright Antonio Laguna, Ori Ziv 2017
 * MIT License
*/
/*!
 * amp-playlists - Playlists done right for Videojs
 * v0.2.0
 * 
 * copyright Antonio Laguna, Ori Ziv 2016
 * MIT License
*/
/**
**************************************************** 
********************* EXAMPLE **********************
****************************************************
**/

// In order to initialize playList you need to pass an array of videos with this structure:
/*
var videos = [
 {
   src : [
     'http://amssamples.streaming.mediaservices.windows.net/91492735-c523-432b-ba01-faba6c2206a2/AzureMediaServicesPromo.ism/manifest'
   ],
   poster : '',      // Optional
   title : 'Title1', // Optional
   timeRange:{       // Optional
     start : 0,
     end : 432
   },
   token : "bearer eTRsdfsdf12124...." //Optional
 },
 {
   src : [
   'http://amssamples.streaming.mediaservices.windows.net/91492735-c523-432b-ba01-faba6c2206a2/AzureMediaServicesPromo.ism/manifest'
   ],
   poster : 'http://www.videojs.com/img/poster.jpg',
   title : 'Ocean'
 }
];
player.playlist(videos);
*/
// AMP playlist plugin

(function() {
    // Define a basic playlist object
    function VimeoPlaylist(playerId, videos) {
        this.playerId = playerId;
        this.videos = videos;
        this.currentIndex = 0;
        this.player = null;

        // Initialize the first video
        this.init();
    }

    // Initialize the Vimeo player with the first video
    VimeoPlaylist.prototype.init = function() {
        var self = this;
        var options = {
            id: this.videos[this.currentIndex],
            width: 640
        };

        this.player = new Vimeo.Player(this.playerId, options);
        
        // Setup event listener for when the video finishes
        this.player.on('ended', function() {
            self.next();
        });
    };

    // Play the next video in the playlist
    VimeoPlaylist.prototype.next = function() {
        if (this.currentIndex < this.videos.length - 1) {
            this.currentIndex++;
            this.player.loadVideo(this.videos[this.currentIndex]).then(function() {
                // Video is loaded and ready to play
            }).catch(function(error) {
                // An error occurred
                console.error(error);
            });
        } else {
            // Reached the end of the playlist
            console.log('End of playlist');
        }
    };

    // Play the previous video in the playlist
    VimeoPlaylist.prototype.prev = function() {
        if (this.currentIndex > 0) {
            this.currentIndex--;
            this.player.loadVideo(this.videos[this.currentIndex]).then(function() {
                // Video is loaded and ready to play
            }).catch(function(error) {
                // An error occurred
                console.error(error);
            });
        } else {
            // Reached the beginning of the playlist
            console.log('Start of playlist');
        }
    };

    // Example usage
    var myPlaylist = new VimeoPlaylist('vimeo-player', ['347119375', 'another_video_id']);
})();




