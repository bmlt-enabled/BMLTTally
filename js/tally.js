function Tally(sources) {
    var self = this;
    this.sources = sources;
    this.meetingsCount = 0;
    this.knownTotal = 70065;
    this.mapObject = null;
    this.mapMarkers = [];
    this.calculatedMarkers = [];
    this.whatADrag = false;
    this.inDraw = false;
    this.markersDisplayedCheckbox = null;
    this.regionalAffiliationCheckbox = null;
    this.m_icon_image_single = new google.maps.MarkerImage ( "images/NAMarkerB.png", new google.maps.Size(22, 32), new google.maps.Point(0,0), new google.maps.Point(12, 32) );
    this.m_icon_image_multi = new google.maps.MarkerImage ( "images/NAMarkerR.png", new google.maps.Size(22, 32), new google.maps.Point(0,0), new google.maps.Point(12, 32) );
    this.m_icon_shadow = new google.maps.MarkerImage( "images/NAMarkerS.png", new google.maps.Size(43, 32), new google.maps.Point(0,0), new google.maps.Point(12, 32) );
    this.meetings = [];

    document.getElementById('tallyKnownTotal').innerHTML = this.knownTotal;
    var template = Handlebars.compile(document.getElementById("tally-table-template").innerHTML);
    document.getElementById("tally").innerHTML = template(sources);
    var max = sources.length;
    for (var i = 0; i < max; i++) {
        document.getElementById("tallySSL_Data_" + sources[i].id).innerHTML = sources[i].rootURL.substring(0, 5) === 'https' ? "Y" : "N";
        $.getJSON(sources[i].rootURL + 'client_interface/jsonp/?switcher=GetServiceBodies&callback=?', { id: sources[i]['id'] }, function(service_bodies) {
            var qs = getUrlVars(this.url);
            var regions = 0;
            var areas = 0;

            for ( var i = 0; i < service_bodies.length; i++ ) {
                service_bodies[i].type === 'RS' ? regions++ : areas++;
            }

            document.getElementById("tallyRegion_Data_" + qs['id']).innerHTML = regions.toString();
            document.getElementById("tallyArea_Data_" + qs['id']).innerHTML = areas.toString();

            $.getJSON(self.getSourceUrl(qs['id']) + 'client_interface/jsonp/?switcher=GetServerInfo&callback=?', { id: qs['id'] }, function(serverInfo) {
                var qs = getUrlVars(this.url);
                document.getElementById("tallyVersion_Data_" + qs['id']).innerHTML = serverInfo[0].version;
                document.getElementById("tallySemanticAdmin_Data_" + qs['id']).innerHTML = serverInfo[0].semanticAdmin === "1" ? "Y" : "N";
                $.getJSON(self.getSourceUrl(qs['id']) + 'client_interface/jsonp/?switcher=GetSearchResults&callback=?', { id: qs['id'] }, function (meetings) {
                    var qs = getUrlVars(this.url);

                    if (self.getSourceUrl(qs['id']).indexOf("virtual") < 0) {
                        self.meetings = self.meetings.concat(meetings);
                        document.getElementById("tallyTotal").innerHTML = self.meetings.length.toString();
                        document.getElementById('tallyPctTotal').innerHTML = Math.floor((self.meetings.length / self.knownTotal) * 100).toString();

                    }

                    document.getElementById("tallyMeetings_Data_" + qs['id']).innerHTML = meetings.length;
                });
            });
        });
    }
}

Tally.prototype.setUpMapControls = function ( ) {
    if ( this.mapObject ) {
        this.markersDisplayedCheckbox = this.createCheckboxItem ( "Show Meeting Markers", "marker_checkbox", "marker_checkbox", true, this.selectOrDeselectDisplayMarkersCallback );
        this.regionalAffiliationCheckbox = this.createCheckboxItem ( "Show Regional Affiliation", "regional_checkbox", "regional_checkbox", false, this.selectOrDeselectDisplayMarkersCallback );

        var centerControlDiv = document.createElement ( 'div' );
        centerControlDiv.id = "centerControlDiv";
        centerControlDiv.className = "centerControlDiv";
        centerControlDiv.appendChild ( this.markersDisplayedCheckbox );
        centerControlDiv.appendChild ( this.regionalAffiliationCheckbox );

        var toggleButton = document.createElement ( 'input' );
        toggleButton.type = 'button';
        toggleButton.value = "Show Table Display";
        toggleButton.className = "showTableButton";
        toggleButton.addEventListener ( 'click', this.showTable );
        centerControlDiv.appendChild ( toggleButton );

        this.mapObject.controls[google.maps.ControlPosition.TOP_CENTER].push ( centerControlDiv );
    }
};

Tally.prototype.selectOrDeselectDisplayMarkersCallback = function ( checkboxElement ) {
    if ( checkboxElement.checked ) {
        if ( checkboxElement === checkboxElement.context.markersDisplayedCheckbox.checkbox ) {
            checkboxElement.context.regionalAffiliationCheckbox.checkbox.checked = false;
        } else {
            if ( checkboxElement === checkboxElement.context.regionalAffiliationCheckbox.checkbox ) {
                checkboxElement.context.markersDisplayedCheckbox.checkbox.checked = false;
            } else {
                checkboxElement.context.regionalAffiliationCheckbox.checkbox.checked = false;
            }
        }
    }

    checkboxElement.context.redrawResultMapMarkers();
};

Tally.prototype.showTable = function() {
    document.getElementById ( "tallyMap" ).style.display = 'none';
    document.getElementById ( "tallyMan" ).style.display = 'block';
};

Tally.prototype.createCheckboxItem = function ( in_label_text, in_class, in_id, in_selected, inCallback ) {
    var containerElement = document.createElement ( 'div' );
    if ( containerElement ) {
        var checkboxElement = document.createElement ( 'input' );
        if ( checkboxElement ) {
            checkboxElement.type = 'checkbox';
            checkboxElement.baseClassName = in_class + '_checkbox';
            checkboxElement.className = checkboxElement.baseClassName + '_checkbox' + (in_selected ? '_selected' : '' );
            checkboxElement.id = in_id + '_checkbox';
            checkboxElement.checked = in_selected;
            checkboxElement.context = this;
            containerElement.checkbox = checkboxElement;
            var handler = function ( checkboxElement ) {
                checkboxElement.className = checkboxElement.baseClassName + '_checkbox' + (in_selected ? '_selected' : '' );
                inCallback(checkboxElement);
            };

            checkboxElement.addEventListener ( 'click', function () { handler(this); } );

            containerElement.appendChild ( checkboxElement );

            var labelElement = document.createElement ( 'label' );
            if ( labelElement ) {
                labelElement.htmlFor = checkboxElement.id;
                labelElement.innerHTML = in_label_text;
                containerElement.appendChild ( labelElement );

                return containerElement;
            }
        }
    }

    return null;
};

Tally.prototype.displayTallyMap = function() {
    document.getElementById ( "tallyMan" ).style.display = 'none';
    document.getElementById ( "tallyMap" ).style.display = 'block';
    this.loadMap();
};

Tally.prototype.displayMeetingMarkers = function( meetings ) {
    if ( this.mapObject && this.mapObject.getBounds() ) {
        if ( !this.calculatedMarkers.length ) {
            this.calculatedMarkers = this.sMapOverlappingMarkers ( meetings );
        }

        while(this.mapMarkers.length) { this.mapMarkers.pop().setMap(null); }

        if ( !this.whatADrag && !this.inDraw ) {
            for ( var c = 0; this.calculatedMarkers && (c < this.calculatedMarkers.length); c++ ) {
                var objectItem = this.calculatedMarkers[c];
                var marker = this.displayMeetingMarkerInResults ( objectItem.matches );
                if ( marker ) {
                    this.mapMarkers.push(marker);
                }
            }
        }
    }
}

Tally.prototype.loadMap = function() {
    if ( !this.mapObject ) {
        var myOptions = {
            'center': new google.maps.LatLng ( 0, 0 ),
            'zoom': 3,
            'mapTypeId': google.maps.MapTypeId.ROADMAP,
            'mapTypeControlOptions': { 'style': google.maps.MapTypeControlStyle.DROPDOWN_MENU },
            'zoomControl': true,
            'mapTypeControl': true,
            'scaleControl' : true
        };

        myOptions.zoomControlOptions = { 'style': google.maps.ZoomControlStyle.LARGE };

        this.mapObject = new google.maps.Map ( document.getElementById ( "tallyMap" ), myOptions );

        if ( this.mapObject ) {
            google.maps.event.addListener(this.mapObject, 'zoom_changed', function(inEvent) { tally.recalculateOverlaps(); });
            google.maps.event.addListener(this.mapObject, 'bounds_changed', function(inEvent) { tally.redrawResultMapMarkers(); });
            google.maps.event.addListener(this.mapObject, 'dragstart', function(inEvent) { tally.whatADrag = true; });
            google.maps.event.addListener(this.mapObject, 'idle', function(inEvent) { tally.handleIdle(); });
            this.setUpMapControls();
        }
    }
};

Tally.prototype.handleIdle = function() {
    if ( this.mapObject && this.mapObject.getBounds() ) {
        if ( this.whatADrag ) {
            tally.whatADrag = false;
            this.redrawResultMapMarkers();
        }
    }

    tally.whatADrag = false;
};

Tally.prototype.recalculateOverlaps = function() {
    if ( this.mapObject && this.mapObject.getBounds() ) {
        this.calculatedMarkers = [];
        this.redrawResultMapMarkers();
    }
};

Tally.prototype.redrawResultMapMarkers = function() {
    this.displayMeetingMarkers(this.meetings);
};

Tally.prototype.sMapOverlappingMarkers = function (meetings) {
    var tolerance = 10;	/* This is how many pixels we allow. */
    var tmp = [];

    for ( var c = 0; c < meetings.length; c++ ) {
        tmp[c] = {};
        tmp[c].matched = false;
        tmp[c].matches = null;
        tmp[c].object = meetings[c];
        tmp[c].coords = this.sFromLatLngToPixel ( new google.maps.LatLng ( tmp[c].object.latitude, tmp[c].object.longitude ), this.mapObject );
    }

    for ( var c = 0; c < meetings.length; c++ ) {
        if ( !tmp[c].matched ) {
            tmp[c].matched = true;
            tmp[c].matches = new Array ( tmp[c].object );

            for ( var c2 = 0; c2 < meetings.length; c2++ ) {
                if ( !tmp[c2].matched && tmp[c] && tmp[c2] ) {
                    var outer_coords = tmp[c].coords;
                    var inner_coords = tmp[c2].coords;

                    if ( outer_coords && inner_coords ) {
                        var xmin = outer_coords.x - tolerance;
                        var xmax = outer_coords.x + tolerance;
                        var ymin = outer_coords.y - tolerance;
                        var ymax = outer_coords.y + tolerance;

                        /* We have an overlap. */
                        if ( (inner_coords.x >= xmin) && (inner_coords.x <= xmax) && (inner_coords.y >= ymin) && (inner_coords.y <= ymax) ) {
                            tmp[c].matches[tmp[c].matches.length] = tmp[c2].object;
                            tmp[c2].matched = true;
                        }
                    }
                }
            }
        }
    }

    var ret = Array ();

    for ( var d = 0; d < meetings.length; d++ ) {
        if ( tmp[d].matches ) {
            ret.push ( tmp[d] );
        }
    }

    return ret;
};

Tally.prototype.sFromLatLngToPixel = function (in_Latng) {
    var	ret = null;

    if ( this.mapObject ) {
        var	lat_lng_bounds = this.mapObject.getBounds();
        if ( lat_lng_bounds ) {
            // We measure the container div element.
            var	div = this.mapObject.getDiv();

            if ( div ) {
                var	pixel_width = div.offsetWidth;
                var	pixel_height = div.offsetHeight;
                var north_west_corner = new google.maps.LatLng ( lat_lng_bounds.getNorthEast().lat(), lat_lng_bounds.getSouthWest().lng() );
                var lng_width = lat_lng_bounds.getNorthEast().lng()-lat_lng_bounds.getSouthWest().lng();
                var	lat_height = lat_lng_bounds.getNorthEast().lat()-lat_lng_bounds.getSouthWest().lat();

                // We do this, so we have the largest values possible, to get the most accuracy.
                var	pixels_per_degree = (( pixel_width > pixel_height ) ? (pixel_width / lng_width) : (pixel_height / lat_height));

                // Figure out the offsets, in long/lat degrees.
                var	offset_vert = north_west_corner.lat() - in_Latng.lat();
                var	offset_horiz = in_Latng.lng() - north_west_corner.lng();

                ret = new google.maps.Point ( Math.round(offset_horiz * pixels_per_degree),  Math.round(offset_vert * pixels_per_degree) );
            }
        }
    }

    return ret;
};

Tally.prototype.displayMeetingMarkerInResults = function(in_mtg_obj_array) {
    if ( in_mtg_obj_array && in_mtg_obj_array.length ) {
        var bounds = this.mapObject.getBounds();
        var main_point = new google.maps.LatLng ( in_mtg_obj_array[0].latitude, in_mtg_obj_array[0].longitude );

        if ( bounds.contains ( main_point ) ) {
            var displayed_image = (in_mtg_obj_array.length === 1) ? this.m_icon_image_single : this.m_icon_image_multi;

            var marker_html = '';

            if ( this.mapObject.getZoom() > 8 ) {
                marker_html = '<div><dl>';
            }

            var new_marker = new google.maps.Marker (
                {
                    'position':     main_point,
                    'map':		    this.mapObject,
                    'shadow':		this.m_icon_shadow,
                    'icon':			displayed_image,
                    'clickable':    this.mapObject.getZoom() > 8
                } );

            var id = this.m_uid;
            new_marker.meeting_id_array = [];
            new_marker.meeting_obj_array = in_mtg_obj_array;

            // We save all the meetings represented by this marker.
            for ( var c = 0; c < in_mtg_obj_array.length; c++ ) {
                if ( marker_html ) {
                    var weekdays = ['ERROR', 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
                    marker_html += '<dt><strong>';
                    marker_html += in_mtg_obj_array[c]['meeting_name'];
                    marker_html += '</strong></dt>';
                    marker_html += '<dd><em>';
                    marker_html += weekdays[parseInt ( in_mtg_obj_array[c]['weekday_tinyint'] )];
                    var time = in_mtg_obj_array[c]['start_time'].toString().split(':');
                    var hour = parseInt ( time[0] );
                    var minute = parseInt ( time[1] );
                    var pm = 'AM';
                    if ( hour >= 12 ) {
                        pm = 'PM';

                        if ( hour > 12 ) {
                            hour -= 12;
                        }
                    }

                    hour = hour.toString();
                    minute = (minute > 9) ? minute.toString() : ('0' + minute.toString());
                    marker_html += ' ' + hour + ':' + minute + ' ' + pm;
                    marker_html += '</em></dd>';
                    var source = in_mtg_obj_array[c].source;
                    if ( source ) {
                        var url = source.semanticURL;

                        if ( !url ) {
                            url = source.rootURL + 'semantic';
                        };

                        marker_html += '<dd><em><a href="' + url + '">';
                        marker_html += source.name;
                        marker_html += '</a></em></dd>';
                    }
                }

                new_marker.meeting_id_array[c] = in_mtg_obj_array[c]['id_bigint'];
            }

            if ( marker_html ) {
                marker_html += '</dl></div>';
                var infowindow = new google.maps.InfoWindow ( { content: marker_html });
                new_marker.addListener ( 'click', function() { infowindow.open ( this.mapObject, new_marker ); });
            }

            return new_marker;
        }
    }

    return null;
};


Tally.prototype.getSourceUrl = function(id) {
    return this.sources.getArrayItemByObjectKeyValue('id', id)['rootURL'];
};

function getUrlVars(url)
{
    var vars = {}, hash;
    var hashes = url.slice(url.indexOf('?') + 1).split('&');
    for(var i = 0; i < hashes.length; i++)
    {
        hash = hashes[i].split('=');
        vars[hash[0]] = hash[1];
    }

    return vars;
}

Array.prototype.getArrayItemByObjectKeyValue = function(key, value) {
    for (var i = 0; i < this.length; i++) {
        if (this[i][key] === value) {
            return this[i];
        }
    }
};
