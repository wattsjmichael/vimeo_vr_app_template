


function krpanoplugin() {
  
  const local = this;
  let krpano = null;
  let plugin = null;
  let app_version = null;

  


  local.registerplugin = function(krpanointerface, pluginpath, pluginobject) {
      krpano = krpanointerface;
      plugin = pluginobject;
      plugin.showvid = showvid;
      plugin.registerattribute("resize_overlay", resize_overlay);
      plugin.registercontentsize(window.innerWidth, window.innerHeight);
      app_version = krpano.get('app_version');
      
  };

  local.unloadplugin = function() {
      plugin = null;
      krpano = null;
  };

  local.onresize = function(width, height) {
      plugin.sprite.style.width = '100%';
      plugin.sprite.style.height = '100%';
      return true;
  };

  function resize_overlay() {
      plugin.sprite.style.width = '100%';
      plugin.sprite.style.height = '100%';
      plugin.registercontentsize(window.innerWidth, window.innerHeight);
      return true;
  }

  // const asl = [
  //   {
  //       title: "Program-Specific Videos",
  //       videos: [
  //         { url: "evac_video", title: "Evacuation", id: "347119375" },
  //         { url: "shelter_ip_video", title: "Shelter-in-Place", id: "347119375" },
  //         { url: "mobility_video", title: "Mobility Impaired Procedures", id: "347119375" }
  //     ]
  //   },
  //   {
  //       title: "Core Response Procedures",
  //       videos: [
  //           { url: "evac_video", title: "Evacuation", id: "347119375" },
  //           { url: "shelter_ip_video", title: "Shelter-in-Place", id: "347119375" },
  //           { url: "mobility_video", title: "Mobility Impaired Procedures", id: "347119375" }
  //       ]
  //   },
  //   {
  //       title: "Emergency Scenarios",
  //       videos: [
  //           { url: "disc_fire_vid", title: "If You Discover A Fire", id: "347119375" },
  //           { url: "sprinkler_vid", title: "Sprinklers", id: "347119375" },
  //           { url: "earthquake_vid", title: "Earthquake", id: "347119375" },
  //           { url: "med_em_vid", title: "Medical Emergency", id: "347119375" },
  //           { url: "bomb_vid", title: "Bomb Threat", id: "347119375" },
  //           { url: "shoot_vid", title: "Active Shooter", id: "347119375" }
  //       ]
  //   },
  //   {
  //       title: "Floor Warden",
  //       videos: [
  //           { url: "fw_vid", title: "Floor Warden Duties", id: "347119375" },
  //           { url: "search_vid", title: "Searching & Clearing A Floor", id: "347119375" }
  //       ]
  //   }
  // ];
  
  function generateVideoList() {
      
      let vid_list = '<div id="vid_list" style="text-align:center;">';

      bsvl.forEach(section => {
        vid_list += `<b><span style="font-size:1.4em">${section.title}</span></b><br>`;
        section.videos.forEach(video => {
            vid_list += `<a class="vid_link" data-url="${video.url}">${video.title}</a><br>`;
        });
      vid_list += '</br>'
      });
     asl.forEach(section => {
          vid_list += `<b><span style="font-size:1.4em">${section.title}</span></b><br>`;
          section.videos.forEach(video => {
              vid_list += `<a class="vid_link" data-url="${video.url}">${video.title}</a><br>`;
          });
          vid_list += '<br>';
      });
      vid_list += '</div>';
      console.log(vid_list);
      return vid_list;
  }

  let vid_lib = generateVideoList();

  function show_video(videoId) {
    hide_overlay();
    current_type = "video";
    plugin.visible = true;

    let videoData = null;
  
    [...asl, ...bsvl].forEach(section => {
      section.videos.forEach(video => {
          if (video.id === videoId) {
              videoData = video;
          }
      });
  });

    if (!videoData) {
        console.error("Video data not found for ID:", videoId);
        return;
    }

    console.log(videoId);

    var container = document.createElement("div");
    container.innerHTML = `<div id="overlay-content" style="display: flex; justify-content: center; align-items: center; ">
        <div class="flex-container animated fadeIn bg-gradient">
            <div class="row">  
                    <div id="vimeo-player" ></div>
                    <div class="flex-item" style="text-align:center">
                        <img src="../` + app_version + `/skin/ak/close_but.png" id="close_but" />
                    </div>
                </div>
            </div>
        </div>`;

    plugin.sprite.appendChild(container);
    let close_but = document.getElementById("close_but");
    close_but.onpointerup = function () {
        hide_overlay();
    }

    // Initialize Vimeo Player with the provided video ID
    var player = new Vimeo.Player('vimeo-player', {
        id: videoId,
        width: 640,
        autoplay: true
    });

    player.on('ended', function () {
        hide_overlay();
    });
}

  function showvid() {
      hide_overlay();
      current_type = "html";
      plugin.visible = true;
      var container = document.createElement("div");
      container.setAttribute("id", "overlay-content");
      container.innerHTML = `
          <div id="vid_lib" class="flex-container animated fadeIn bg-overlay">
              <div class="row">
                  <div class="flex-item">${vid_lib}</div>
                  <div class="flex-item" style="text-align:center">
                      <img id="close_but" style="cursor:pointer;padding-top:1em" src="../${app_version}/skin/ak/close_but.png" width="60" height="60" />
                  </div>
              </div>
          </div>`;
      plugin.sprite.appendChild(container);

      Array.from(document.getElementsByClassName("vid_link")).forEach(element => {
          element.onpointerup = () => {
            const videoData = [...asl.flatMap(section => section.videos), ...bsvl.flatMap(section => section.videos)]
            .find(video => video.url === element.dataset.url);
              
              if (videoData) {
                  show_video(videoData.id);
              } else {
                  console.error("Video data not found for:", element.dataset.url);
              }
          };
      });

      let close_but = document.getElementById("close_but");
      if (close_but) {
          close_but.onpointerup = hide_overlay;
      }
      plugin.visible = true;
  }

  function hide_overlay() {
      krpano.set('layer[cc].visible', false);
      plugin.visible = false;
      plugin.sprite.innerHTML = "";
      current_type = null;
  }
}

export default krpanoplugin;