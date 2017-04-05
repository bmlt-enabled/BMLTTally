/********************************************************************************************//**
*                                         MAIN FUNCTION                                         *
************************************************************************************************/

function BMLTTally(inSourceList) {
    var tallyManTotal = 0;
    var tallyDone = 0;
    var tallyManDiv = document.getElementById ( "tallyMan" );
    var tallyLogRows = Array();
    var sourceList = inSourceList;
    
    /****************************************************************************************//**
    *   \brief Updates the log of events.                                                      *
    ********************************************************************************************/
    updateTallyLog = function ( )
    {
        for ( i = 0; i < sourceList.length; i++ ) {
            var tallyTable = document.getElementById ( 'tallyLogTable' );
            var sourceObject = sourceList[i];
            if ( tallyLogRows.length < (i + 1) ) {
                var tableRow = document.createElement ( 'tr' );
                if ( i % 2 ) {
                    tableRow.className = 'odd';
                };
                tallyLogRows[i] = document.createElement ( 'td' );
                tableRow.appendChild(tallyLogRows[i]);
                tallyTable.appendChild(tableRow);
            };
            
            if ( !sourceObject.stage ) {
                sourceObject.stage = 0;
            };
            
            var innerElement = '';
            tallyLogRows[i].className = 'in-progress-' + sourceObject.stage.toString();
            
            switch ( sourceObject.stage ) {
                case 0:
                    innerElement = sourceObject.name + ' -Fetching Service Bodies.';
                    break;
                
                case 1:
                    innerElement = sourceObject.name + ' -Fetching Server Version.';
                    break;
                
                case 2:
                    innerElement = sourceObject.name + ' -Fetching Meetings.';
                    break;
                    
                default:
                    innerElement = sourceObject.name + ' -Done.';
                    break;
            };
            
            tallyLogRows[i].innerHTML = innerElement;
        };
            
    };
    
    /****************************************************************************************//**
    *   \brief Increments the tally meter.                                                      *
    ********************************************************************************************/
    incrementTallyMeter = function ( )
    {
        var tallyMeter = document.getElementById ( "tallyMeter" );
        var tallyMeterFill = document.getElementById ( "tallyMeterFill" );
        var percentage = tallyDone / tallyManTotal;
        tallyMeterFill.style.width = (percentage * 100).toString() + "%";
        if ( tallyDone == tallyManTotal ) {
            this.displayResults ( );
        };
        this.updateTallyLog();
    };
    
    /****************************************************************************************//**
    *   \brief Sorting Handler.                                                                 *
    ********************************************************************************************/
    sortResults = function ( a, b ) {
        var ret = a.meetings.length - b.meetings.length;
        if ( 0 == ret ) {
            ret = a.numRegions - b.numRegions;
            if ( 0 == ret ) {
                ret = a.numASCs - b.numASCs;
            };
        };
        
        return -ret;
    };
    
    /****************************************************************************************//**
    *   \brief Increments the tally meter.                                                      *
    ********************************************************************************************/
    displayResults = function ( )
    {
        var tallyTable = document.getElementById ( 'tallyLogTable' );
        var tableContainer = document.getElementById ( 'tallyHo' );
        var tableBody = document.getElementById ( 'tallyBody' );
        tableBody.innerHTML = '';
        var tallyMeter = document.getElementById ( "tallyMeter" );
        tallyMeter.style.display = 'none';
        tallyTable.innerHTML = '';
        
        sourceList.sort ( this.sortResults );
        
        var totalRegions = 0;
        var totalAreas = 0;
        var totalMeetings = 0;
        
        for ( i = 0; i < sourceList.length; i++ ) {
            var sourceObject = sourceList[i];
            
            totalRegions += sourceObject.numRegions;
            totalAreas += sourceObject.numASCs;
            totalMeetings += sourceObject.meetings.length;
            
            var tableRow = document.createElement ( 'tr' );
            
            if ( i % 2 ) {
                tableRow.className = 'odd';
            };
            
            var tableAnchor = document.createElement ( 'a' );
            tableAnchor.href = sourceObject.rootURL;
            tableAnchor.className = 'tallyClick';
            tableAnchor.target = "_blank";
            tableAnchor.appendChild ( document.createTextNode ( sourceObject.name ) );

            var tableCellName = document.createElement ( 'td' );
            tableCellName.className = 'tallyName';
            tableCellName.appendChild ( tableAnchor );
            
            var semURL = sourceObject.semanticURL;
            
            if ( !semURL ) {
                semURL = sourceObject.rootURL.toString() + "/semantic";
            };
            
            var semanticAnchor = document.createElement ( 'a' );
            semanticAnchor.href = semURL.toString();
            semanticAnchor.className = 'tallySemanticClick';
            semanticAnchor.target = "_blank";
            semanticAnchor.appendChild ( document.createTextNode ( 'Semantic Workshop Link' ) );

            tableCellName.appendChild ( document.createTextNode ( ' (' ) );
            tableCellName.appendChild ( semanticAnchor );
            tableCellName.appendChild ( document.createTextNode ( ')' ) );
            
            tableRow.appendChild ( tableCellName );
            
            var tableCellSSL = document.createElement ( 'td' );
            tableCellSSL.className = 'tallySSL' + ((sourceObject.rootURL.toString().substring(0, 5) === 'https') ? ' validSSL' : ' inValidSSL');
            tableCellSSL.appendChild ( document.createTextNode ( (sourceObject.rootURL.toString().substring(0, 5) === 'https') ? "YES" : "NO" ) );
            tableRow.appendChild ( tableCellSSL );
            
            var tableCellVersion = document.createElement ( 'td' );

            var serverVersion = parseInt ( sourceObject.versionInt );
            
            if ( (sourceObject.rootURL.toString().substring(0, 5) === 'https') && (serverVersion >= 2008012) ) {
                tableCellVersion.className = 'tallyVersion validServer';
            } else {
                tableCellVersion.className = 'tallyVersion';
            };
            tableCellVersion.appendChild ( document.createTextNode ( sourceObject.serverVersion.toString() ) );
            tableRow.appendChild ( tableCellVersion );
            
            var tableCellRegions = document.createElement ( 'td' );
            tableCellRegions.className = 'tallyRegion';
            tableCellRegions.appendChild ( document.createTextNode ( sourceObject.numRegions.toString() ) );
            tableRow.appendChild ( tableCellRegions );
            
            var tableCellAreas = document.createElement ( 'td' );
            tableCellAreas.className = 'tallyArea';
            tableCellAreas.appendChild ( document.createTextNode ( sourceObject.numASCs.toString() ) );
            tableRow.appendChild ( tableCellAreas );
            
            var tableCellMeetings = document.createElement ( 'td' );
            tableCellMeetings.className = 'tallyMeeting';
            tableCellMeetings.appendChild ( document.createTextNode ( sourceObject.meetings.length.toString() ) );
            tableRow.appendChild ( tableCellMeetings );
            
            tableBody.appendChild ( tableRow );
        };
        
        var totalRow = document.createElement ( 'tr' );
        
        totalRow.className = 'tallyTotal';

        var tableCellName = document.createElement ( 'td' );
        tableCellName.className = 'tallyName';
        tableCellName.colSpan = '3';
        tableCellName.appendChild ( document.createTextNode ( 'TOTAL' ) );
        totalRow.appendChild ( tableCellName );
        
        var tableCellRegions = document.createElement ( 'td' );
        tableCellRegions.className = 'tallyRegion';
        tableCellRegions.appendChild ( document.createTextNode ( totalRegions.toString() ) );
        totalRow.appendChild ( tableCellRegions );
        
        var tableCellAreas = document.createElement ( 'td' );
        tableCellAreas.className = 'tallyArea';
        tableCellAreas.appendChild ( document.createTextNode ( totalAreas.toString() ) );
        totalRow.appendChild ( tableCellAreas );
        
        var tableCellMeetings = document.createElement ( 'td' );
        tableCellMeetings.className = 'tallyMeeting';
        tableCellMeetings.appendChild ( document.createTextNode ( totalMeetings.toString() ) );
        totalRow.appendChild ( tableCellMeetings );
        
        tableBody.appendChild ( totalRow );
            
        tableContainer.style.display = 'table';
        
        document.getElementById ( "tallyMo" ).style.display = 'block';
    };
    
    /****************************************************************************************//**
    *   \brief AJAX callback for Meetings                                                 *
    ********************************************************************************************/
    ajax_callback_meetings = function ( in_req,        ///< The HTTPRequest object for this call.
                                      in_extra_data  ///< Any refCon that was attached.  
                                    )
    {
        var responseText = in_req.responseText;
        var source = in_req.extra_data;
        eval('var results = ' + responseText + ';' );
        source.meetings = Array();
        for ( var i = 0; i < results.length; i++ ) {
            var location = {"longitude":results[i].longitude,"latitude":results[i].latitude};
            source.meetings.push ( location );
        };
        source.stage = 3;
        tallyDone++;
        this.incrementTallyMeter();
    };

    /****************************************************************************************//**
    *   \brief AJAX callback for The Version                                                 *
    ********************************************************************************************/
    ajax_callback_version = function ( in_req,        ///< The HTTPRequest object for this call.
                                      in_extra_data  ///< Any refCon that was attached.  
                                    )
    {
        var responseText = in_req.responseText;
        var source = in_req.extra_data;
        eval('source.serverVersion = \'' + responseText.toString() + '\';' );
        var versionArray = source.serverVersion.split('.');
        source.versionInt = (parseInt ( versionArray[0] ) * 1000000) + (parseInt ( versionArray[1] ) * 1000) + parseInt ( versionArray[2] );
        source.stage = 2;
        tallyDone++;
        this.incrementTallyMeter();
        
        var uri = "index.php?GetMeetings&callURI=" + encodeURIComponent ( source.rootURL );
        Simple_AjaxRequest ( uri, this.ajax_callback_meetings, 'GET', source );
    };

    /****************************************************************************************//**
    *   \brief AJAX callback for Service bodies                                                 *
    ********************************************************************************************/
    ajax_callback_services = function ( in_req,        ///< The HTTPRequest object for this call.
                                      in_extra_data  ///< Any refCon that was attached.  
                                    )
    {
        var responseText = in_req.responseText;
        var source = in_req.extra_data;
        eval('var serviceBodies = ' + responseText + ';' );
        var regions = 0;
        var areas = 0;
    
        for ( i = 0; i < serviceBodies.length; i++ ) {
            var serviceBody = serviceBodies[i];
        
            if ( serviceBody.type == 'RS' ) {
                regions++;
            } else {
                areas++;
            };
        };
    
        source.numRegions = regions;
        source.numASCs = areas;
        source.stage = 1;
        tallyDone++;
        this.incrementTallyMeter();
    
        var uri = "index.php?GetVersion&callURI=" + encodeURIComponent ( source.rootURL );
        Simple_AjaxRequest ( uri, this.ajax_callback_version, 'GET', source );
    };

    /****************************************************************************************//**
    *   \brief Start your engines                                                               *
    ********************************************************************************************/
    start_tally = function() {
        var tableContainer = document.getElementById ( 'tallyHo' );
        tableContainer.style.display = 'none';
        
        var count = sourceList.length;
        tallyManTotal = count * 3;
        this.incrementTallyMeter();
        var tallyMeter = document.getElementById ( "tallyMeter" );
        tallyMeter.style.display = 'block';
    
        for ( i = 0; i < count; i++ ) {
            var source = sourceList[i];
            if ( source.rootURL ) {
                source.stage = 0;
                var uri = "index.php?callURI=" + encodeURIComponent ( source.rootURL );
                source.context = self;
                Simple_AjaxRequest ( uri, this.ajax_callback_services, 'GET', source );
            };
        };
    };
    
    /****************************************************************************************//**
    *   \brief MAIN CONTEXT                                                                     *
    ********************************************************************************************/
    this.start_tally();
};

/********************************************************************************************//**
*                                       AJAX HANDLER                                            *
************************************************************************************************/

/********************************************************************************************//**
*   \brief A simple, generic AJAX request function.                                             *
*                                                                                               *
*   \returns a new XMLHTTPRequest object.                                                       *
************************************************************************************************/
    
function Simple_AjaxRequest (   url,        ///< The URI to be called
                                callback,   ///< The success callback
                                method,     ///< The method ('get' or 'post')
                                extra_data  ///< If supplied, extra data to be delivered to the callback.
                                )
{
    /****************************************************************************************//**
    *   \brief Create a generic XMLHTTPObject.                                                  *
    *                                                                                           *
    *   This will account for the various flavors imposed by different browsers.                *
    *                                                                                           *
    *   \returns a new XMLHTTPRequest object.                                                   *
    ********************************************************************************************/
    
    function createXMLHTTPObject()
    {
        var XMLHttpArray = [
            function() {return new XMLHttpRequest()},
            function() {return new ActiveXObject("Msxml2.XMLHTTP")},
            function() {return new ActiveXObject("Msxml2.XMLHTTP")},
            function() {return new ActiveXObject("Microsoft.XMLHTTP")}
            ];
            
        var xmlhttp = false;
        
        for ( var i=0; i < XMLHttpArray.length; i++ )
            {
            try
                {
                xmlhttp = XMLHttpArray[i]();
                }
            catch(e)
                {
                continue;
                };
            break;
            };
        
        return xmlhttp;
    };
    
    var req = createXMLHTTPObject();
    req.finalCallback = callback;
    var sVars = null;
    method = method.toString().toUpperCase();
    var drupal_kludge = '';
    
    // Split the URL up, if this is a POST.
    if ( method == "POST" )
        {
        var rmatch = /^([^\?]*)\?(.*)$/.exec ( url );
        url = rmatch[1];
        sVars = rmatch[2];
        // This horrible, horrible kludge, is because Drupal insists on having its q parameter in the GET list only.
        var rmatch_kludge = /(q=admin\/settings\/bmlt)&?(.*)/.exec ( rmatch[2] );
        if ( rmatch_kludge && rmatch_kludge[1] )
            {
            url += '?'+rmatch_kludge[1];
            sVars = rmatch_kludge[2];
            };
        };
    if ( extra_data )
        {
        req.extra_data = extra_data;
        };
    req.open ( method, url, true );
	if ( method == "POST" )
        {
        req.setRequestHeader("Method", "POST "+url+" HTTP/1.1");
        req.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
        };
    req.onreadystatechange = function ( )
        {
        if ( req.readyState != 4 ) return;
        if( req.status != 200 ) return;
        callback ( req, req.extra_data );
        req = null;
        };
    req.send ( sVars );
    
    return req;
};
