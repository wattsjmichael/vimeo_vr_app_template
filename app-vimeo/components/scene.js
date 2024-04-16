/*
    krpano HTML5 Javascript Plugin Example
*/

function krpanoplugin() {
    let local = this;   // save the 'this' pointer from the current plugin object
    let krpano = null;  // the krpano and plugin interface objects
    let plugin = null;
    let floor_map;
    let street_map;
    let current_floor;
    let elevation = 0;
    let search_item = null;
    let curr_scene;
    let start_scene;
    let scenes;
    let scene_indexed = {};
    let floor_menu_name;
    
    

    // registerplugin - startup point for the plugin (required)
    local.registerplugin = function (krpanointerface, pluginpath, pluginobject) {

        // TODO pre compile floor scenes from window.path into floor map
        // for fast lookup when looping for whole floors


        // get the krpano interface and the plugin object
        krpano = krpanointerface;
        plugin = pluginobject;
        // add plugin action (the attribute needs to be lowercase!)
        plugin.set_elevations = set_elevations;
        plugin.change_floor = change_floor;
        plugin.get_spawn = get_spawn;
        plugin.floor_menu = floor_menu;
        plugin.floor_menu_two = floor_menu_two;
        // plugin.floor_menu_sort = floor_menu_sort;
        plugin.get_path_map = get_path_map;
        // plugin.get_path_map_c = get_path_map_c;
        // plugin.generate_path = generate_path;
        plugin.init_scene = init_scene;
        plugin.init_scene_tour = init_scene_tour;
        plugin.get_path_local = get_path_local;
        plugin.get_path_data = get_path_data;
        plugin.update_floor_map = update_floor_map;
        plugin.update_current_map = update_current_map;
        plugin.registerattribute("curr_floor", current_floor, current_floor_setter, current_floor_getter);
        // plugin.init_accomp = init_accomp;
        plugin.go_home = go_home;
        // plugin.check_stair = check_stair;
        plugin.generate_global_positions = generate_global_positions;
        plugin.registerattribute("current_elev", "current_elev");
        plugin.registerattribute("next_elev", "next_elev");
        try {
            floor_map = JSON.parse(krpano.get('data[floor_map].content'));
        } catch (e) {
            console.log("ERROR", "Error Parsing Scene JSON");
        }
        floor_menu_name = krpano.get('floor_menu_name');

        // generate the scenes
        generate_path();
        // generate_global_positions();


        current_floor = krpano.get('startfloor');
        if (current_floor != null) {
            if (floor_map[current_floor]) {
                krpano.set('startscene', floor_map[current_floor].spawn);
                krpano.call('startup()');
            } else {
                let result = krpano.get('scene').getArray();
                if (result) {
                    if (result.length > 0) {
                        current_floor = result[0].floor_id;
                    }
                }
                krpano.set('startscene', 0);
                krpano.call('startup()');
                krpano.set('startfloor', current_floor);
                sessionStorage.setItem('startfloor', current_floor);
            }
        } else {
            krpano.call('startup()');
            current_floor = krpano.get('startfloor');
        }


        start_scene = krpano.get('scene_name');
        curr_scene = start_scene;
        //get_path_local(start_scene);


        // load the map and change the floor
        change_floor(current_floor);
        let spawn = floor_map[current_floor].spawn;
        if (start_scene.toLowerCase() == spawn.toLowerCase()) {
            let o = floor_map[current_floor];
            krpano.set('view.hlookat', o.angle);
        }

        try {
            street_map = JSON.parse(krpano.get('data[street_map].content'));
            for (var i in street_map) {
                krpano.call('street_sign(' + street_map[i].name + ',' + street_map[i].ath + ')');
            }
        } catch (e) {
            console.log("ERROR", "Error Parsing street JSON");
        }

    }

    // unloadplugin - exit point for the plugin (optionally)
    local.unloadplugin = function () {
        trace(1, 'unload check');
        plugin = null;
        krpano = null;
    }

    // function init_accomp() {
    //     console.log("get accomp");
    // }

    function current_floor_setter(newvalue) {
        if (newvalue != current_floor) {
            current_floor = newvalue;
        }
    }

    function current_floor_getter() {
        return current_floor;
    }

    // function check_stair(id)
    // {
    //     let o = scenes[id].stair;
    //     if (o) {
    //         krpano.call('send_accomp(' + "stair_" + o + ')');
    //     }
    // }

    function go_home() {
        ofloor = sessionStorage.getItem("originatingfloor");
        window.location.href = document.location.origin + document.location.pathname + '?startfloor=' + ofloor;
    }

    // return only the paths on a the current floor (dsnmain)
    function get_path_subset() {

        let o = {};
        let a = scene_indexed[current_floor];
        if (a.length > 0) {
            for (let i = 0; i < a.length; i++) {
                o[a[i]] = scenes[a[i]];
            }
        }
        return o;
    }

    function get_path_data(domain) {
        if (!domain) {
            return scenes;
        } else {
            return get_path_subset();
        }
    }

    function generate_global_positions(cs) {
        let o = scenes;
        let p, tx, tz, ty;
        let l;
        let currentNode;
        let parentNode;
        let endNodes = [];
        let endNode;
        let segments = [];
        let segment;

        for (p in o) {
            l = o[p].children.length;
            if (o[p].parent == null) {
                parentNode = o[p];
                o[p].global_position = [0, 0, 0];
                o[p].local_position = [0, 0, 0];
            }
            if (l == 0) {
                endNodes.push(p);
            }
        }

        function get_next() {
            if (o[currentNode].parent != null) {
                currentNode = o[currentNode].parent;
                return true;
            } else {
                return false;
            }
        }

        // get each segemnt by following back from end
        for (var i = 0; i < endNodes.length; i++) {
            endNode = endNodes[i];
            segment = [];
            segment.push(endNode);
            currentNode = endNode;
            while (get_next()) {
                segment.push(currentNode);
            }
            segments.push(segment.reverse());
        }

        // loop each segment from the begining to add global positions
        for (var i = 0; i < segments.length; i++) {
            let x = segments[i];
            tx = 0;
            tz = 0;
            ty = 0;
            for (var j = 0; j < x.length; j++) {
                let s = o[x[j]];
                tx += s.local_position[0];
                tz += s.local_position[1];
                ty += s.local_position[2];

                s.global_position = [tx, tz, ty];
            }
        }

        krpano.call("set_initial_position(" + o[cs].global_position[0] + "," + o[cs].global_position[1] + "," + o[cs].global_position[2] + ")");
        // window.tour_path = o;
    }

    function get_path_local(cs) {
        let s = cs || curr_scene;
        let path = scenes;
        let current_node;
        let a;
        if (s) {
            current_node = path[s];
            window.current_position = [current_node.global_position[0].toString(), current_node.global_position[1].toString(), current_node.global_position[2].toString()];
        }
        let cp = window.current_position;
        let o, p, tx, tz, ty, c = true;
        let cnc;

        function angle(cx, cy, ex, ey) {
            return Math.round(Math.atan2(ex - cx, ey - cy) * (180 / Math.PI));
        }

        for (o in path) {

            p = path[o];
            c = p.children.length;

            tx = p.global_position[0] -= cp[0];
            tz = p.global_position[1] -= cp[1];
            ty = p.global_position[2] -= cp[2];

        }

        let parent_gp, children_gp;
        if (current_node.parent && !current_node.vparent) {
            parent_gp = path[current_node.parent].global_position;
            a = angle(current_node.global_position[0], current_node.global_position[1], parent_gp[0], parent_gp[1]);
            // krpano.call("make_floorspot(" + parent_gp[0] + "," + parent_gp[1] + "," + parent_gp[2] + "," + current_node.parent + "," + -1 + "," + a + ")");
            krpano.call("make_floorspot(" + parent_gp[0] + "," + parent_gp[1] + "," + parent_gp[2] + "," + current_node.parent + "," + -1 + "," + a + ","+ current_node.parent +")");

        }

        for (var i = 0; i < current_node.children.length; i++) {
            cnc = current_node.children[i];
            children_gp = path[cnc].global_position;
            a = angle(current_node.global_position[0], current_node.global_position[1], children_gp[0], children_gp[1]);
            if (current_node.bridge && path[cnc].bridge) {
                if (current_node.stairs.length < 2) {
                    krpano.call("make_vert_nav(" + children_gp[0] + "," + children_gp[1] + "," + children_gp[2] + "," + current_node.children[i] + ")");
                } else {
                    for (let stair of current_node.stairs) {
                        if (path[cnc].stairs.includes(stair)) {
                            krpano.call("make_vert_nav(" + children_gp[0] + "," + children_gp[1] + "," + children_gp[2] + "," + current_node.children[i] + "," + stair + ")");
                        }
                    }
                }
            } else {
            
            // Separately check if 'bridge_super' attribute is present and call make_vert_nav_super
            // This allows both conditions to be evaluated independently
            // if (current_node.bridge_super && path[cnc].bridge_super) {
            //     krpano.call("make_vert_nav_super(" + children_gp[0] + "," + children_gp[1] + "," + children_gp[2] + "," + current_node.children[i] + ")");}
            // else if (!path[cnc].bridge && !path[cnc].bridge_super) { // Ensure this hotspot does not belong to bridge or bridge_super
            // This block now only executes if neither 'bridge' nor 'bridge_super' conditions were met
                krpano.call("make_floorspot(" + children_gp[0] + "," + children_gp[1] + "," + children_gp[2] + "," + current_node.children[i] + "," + path[current_node.children[i]].children.length + "," + a + ")");
            }
        }
    }

    function generate_path() {
        let o = {};
        let c; // the current object
        let name;
        let xmlDoc;
        let bridge;
        // let bridge_super;

        function get_xml(n) {
            let sa = krpano.scene.getArray()[n];
            xmlDoc = (new DOMParser()).parseFromString('<xml>' + sa.content + '</xml>', "text/xml");
            name = sa.name;
            // stair moved to hotpsot
            //stair = sa.stair;
            bridge = Boolean(sa.bridge);
            // bridge_super = Boolean(sa.bridge_super)
            floor_id = sa.floor_id;
            tower_id = sa.tower_id; //Michael CODE 5.5.5
            
        }

        //set here but not updated as player has not moved
        window.current_position = null;

        for (var i = 0; i < krpano.scene.count; i++) {

            get_xml(i);
            
            if (scene_indexed[floor_id]) {
                scene_indexed[floor_id].push(name);
            } else {
                scene_indexed[floor_id] = [];
                scene_indexed[floor_id].push(name);
            }
            o[name] = {
              global_position: null,
              local_position: null,
              parent: null,
              children: [],
              items: [],
              vparent: false,
              stairs: [],
              bridge,
              floor: floor_id,
            };
            // console.log(o[name]);
        }
        for (var i = 0; i < krpano.scene.count; i++) {

            get_xml(i);
            let hotspots = xmlDoc.getElementsByTagName("hotspot") || false;
            let hotspot;
            let child;

            for (var j = 0; j < hotspots.length; j++) {

                let style = hotspots[j].getAttribute("style");
                hotspot = hotspots[j];

                if (style == "floorspot" || style == "vspot") {
                    child = hotspot.getAttribute("linkedscene").toLowerCase();
                    c = o[child];
                    if (c) {
                        c.parent = name;
                        c.local_position = [Number(hotspot.getAttribute("tx")), Number(hotspot.getAttribute("tz")), Number(hotspot.getAttribute("ty")) || 0];
                        if (style == "floorspot") {
                            o[name].children.push(child);
                        }
                        if (style == "vspot") {
                            c.vparent = true;
                        }
                    } else {
                        throw 'scene node "' + child + '" is not declared in tour.xml';
                    }
                } else {
                    child = hotspot.getAttribute("name");
                    let stair = hotspot.getAttribute("stair");
                    if (stair) {
                        o[name].stairs.push(stair);
                    }
                    if (hotspot.getAttribute("exit")) {
                        o[name].exit = hotspot.getAttribute("exit");
                    }
                    if (child != null) {
                        o[name].items.push(child);
                    }
                }
            }
        }

        window.tour_path = o;
        scenes = o;
        // console.log(scene_indexed);
    }

    // function get_path_map_c(n,sf) {

    //     // this method uses map center, no offset is needed

    // 		let path = scenes;
    // 		if (n) {
    // 			window.current_position = [path[n].global_position[0].toString(),path[n].global_position[1].toString(),path[n].global_position[2].toString()];
    // 		}
    // 		let cp = window.current_position;
    //         console.log(cp);
    // 		let o, p, tx, tz, ty, c = true, items = 0;
    // 		for (o in path) {


    //             p = path[o];
    // 			c = p.children.length;
    // 			//apply the first offset value here
    // 			tx = p.global_position[0];
    // 			tz = p.global_position[1];
    //             // this is always 0
    // 			//ty = p.global_position[2] -= cp[2];
    //             console.log(p.global_position);

    // 			if (sf) {

    //                 let map = floor_map[sf].map;
    //                 // offset *2 is because map is currentloy hardcoded at .5
    //                 // last *2 a holdover from the mapping where I mistakingly times scale by 2
    //                 tx = tx += ((map.offset_x)*map.scale);
    //                 tz = tz += ((map.offset_y)*map.scale);

    // 				if (sf == p.floor) {
    // 					krpano.call("make_mapspot("+tx+","+tz+","+0+","+String(o)+"," + p.items.length + ")");
    // 				}
    // 			} else {
    // 				krpano.call("make_mapspot("+tx+","+tz+","+0+","+String(o)+"," + p.items.length + ")");
    // 			}

    // 		}
    // }

    function get_path_map(n, sf) {

        let path = scenes;
        if (n) {
            window.current_position = [path[n].global_position[0].toString(), path[n].global_position[1].toString(), path[n].global_position[2].toString()];
        }
        let cp = window.current_position;
        let o, p, tx, tz, ty, c = true, items = 0;
        for (o in path) {


            p = path[o];
            c = p.children.length;
            //apply the first offset value here
            tx = p.global_position[0] -= cp[0];
            tz = p.global_position[1] -= cp[1];
            // this is always 0
            //ty = p.global_position[2] -= cp[2];

            if (sf) {

                let map = floor_map[sf].map;
                // offset *2 is because map is currentloy hardcoded at .5
                // last *2 a holdover from the mapping where I mistakingly times scale by 2
                tx = tx += (((map.offset_x * 2) * map.scale) * 2) * -1;
                tz = tz += ((map.offset_y * 2) * map.scale) * 2;

                if (sf == p.floor) {
                    krpano.call("make_mapspot(" + tx + "," + tz + "," + 0 + "," + String(o) + "," + p.items.length + ")");
                }
            } else {
                krpano.call("make_mapspot(" + tx + "," + tz + "," + 0 + "," + String(o) + "," + p.items.length + ")");
            }

        }
    }

    function get_spawn(floor_id) {
        // console.log(floor_id);
        //    plugin.is_spawn = Boolean(floor_map[a].elev);
    }



    function init_scene_tour() {
        curr_scene = krpano.get('scene_name');
    }

    function init_scene() {

        // check if its a stair and spin to stair nav unles there is a search item to point to
        curr_scene = krpano.get('scene_name');
        let search_item = sessionStorage.getItem("search_item");
        let auto_nav = sessionStorage.getItem("auto_nav");
        let stairwell = "stairwell";
        let exit_floor = "exit_floor";

        // console.log(scenes);
        scenes[curr_scene].items.forEach((x) => {
            let o = krpano.get('layer["' + x + '"]');
            if (o) {
                o.alpha = 1;
                o.enabled = true;
            }
        });

        if (search_item != 'null') {
            // krpano.call('looktohotspot(' + search_item + ',get(shoosh_fov),smooth(),true)');
            sessionStorage.setItem("search_item", null);
        } else {
            let curr_stair_names = scenes[curr_scene].stairs;
            if (curr_stair_names.length > 0) {
                for (let stair_name of curr_stair_names) {
                    krpano.call('send_accomp("' + 'stair_' + stair_name + '")');
                }
                // get the stairwell hotspot
                // let exit_check = krpano.get('hotspot[exit_button]');
                if (search_item != 'exit_floor') {
                    krpano.call('looktohotspot(' + stairwell + ',get(shoosh_fov),tween(easeoutquart,.5),true)');
                } else {
                    krpano.call('looktohotspot(' + exit_floor + ',get(shoosh_fov),tween(easeoutquart,.5),true)');
                }

            }
            // else if(auto_nav != 'off') {
            //     let chi = scenes[curr_scene].children;
            //     if (chi.length == 1) {
            //         krpano.call('lookto_worldspot(' + chi[0] + ')');
            //     }

            // }
        }

        if (scenes[curr_scene].stairs.length > 0) {
            krpano.call('set(layer[stair_vids].visible, true); set(layer[floor_vids].visible, false);');
        } else {
            krpano.call('set(layer[stair_vids].visible, false); set(layer[floor_vids].visible, true);');
        }

    }

    function set_elevations(a, b) {
        plugin.current_elev = Number(floor_map[a].elev);
        plugin.next_elev = Number(floor_map[b].elev);
    }

    function change_floor(floor_id ) {
        // console.log(floor_map);
        let o = floor_map[floor_id];
        
        plugin.current_elev = Number(floor_map[floor_id].elev);
        krpano.call('load_map("' + o.map.name + '","' + o.map.scale + '","' + (o.map.mm_oscale || 0.5) + '")');
        // krpano.set('layer[floor_text].html', "Floor " + floor_id);
       if (floor_menu_name == null)
       {
        krpano.set('layer[floor_text].html',  "Floor" + " " + floor_id);
       }
       else
       {
       krpano.set('layer[floor_text].html',  floor_menu_name + " " + floor_id);
       }
        current_floor = floor_id;
        krpano.call('offset_radar(' + o.map.offset_x + ',' + o.map.offset_y + ',' + o.map.mm_scale + ',' + o.map.scale + ')');
    }

    function update_floor_map(cs) {
        let floor = scenes[cs].floor;
        if (floor != current_floor) {
            generate_path();
            generate_global_positions(cs);
            krpano.call('make_sym_links()');
            change_floor(floor);
        }
    }
    function update_current_map(cs) {
        let floor = scenes[cs].floor;
            generate_path();
            generate_global_positions(cs);
            krpano.call('make_sym_links()');
            change_floor(floor);
    }

    // function floor_menu() {
    //     let html = '';
    //     let a = [];
    //     for (var o in floor_map) {
    //         a.unshift('<div class="floor_link" href="' + document.location.origin + document.location.pathname + '?startfloor=' + o + '">' + o + '</div>');
    //     }
    //     html = a.join("");
    //     krpano.call('layer[overlay].show_floor_menu(' + html + ')');
    // }

    function floor_menu() {
        let html = '';
        let a = [];
        for (var o in floor_map) {
            // Use o directly for the URL part
            let floorForURL = o;
    
            // Replace %20 with space for the display part
            let floorForDisplay = o.replace(/%20/g, ' ');
    
            // Create a div and set an onclick event to handle navigation
            let linkHTML = '<div class="floor_link" onclick="location.href=\'' + document.location.origin + document.location.pathname + '?startfloor=' + floorForURL + '\'">' + floorForDisplay + '</div>';
    
            if (floor_map[o].sort) {
                a[floor_map[o].sort] = linkHTML;
            } else {
                a.unshift(linkHTML);
            }
        }
        html = a.join("");
        krpano.call('layer[overlay].show_floor_menu(' + html + ')');
    }
    
    function floor_menu_two() {
        let html = '';
        let a = [];
        for (var o in floor_map) {
            // Use o directly for the URL part
            let floorForURL = o;
    
            // Replace %20 with space for the display part
            let floorForDisplay = o.replace(/%20/g, ' ');
    
            // Create a div and set an onclick event to handle navigation
            let linkHTML = '<div class="floor_link" onclick="location.href=\'' + document.location.origin + document.location.pathname + '?startfloor=' + floorForURL + '\'">' + floorForDisplay + '</div>';
    
            if (floor_map[o].sort) {
                a[floor_map[o].sort] = linkHTML;
            } else {
                a.unshift(linkHTML);
            }
        }
        html = a.join("");
        krpano.call('layer[overlay].show_floor_menu_two(' + html + ')');
    }
    
}

