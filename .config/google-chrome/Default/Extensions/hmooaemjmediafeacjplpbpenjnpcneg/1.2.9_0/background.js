DEBUG			= true;
tabs 			= {};
canvas          = {};
CURRENTTABID	= null;

displaySecondsIfLessThan = 30;

data 			= localStorage['data'] ? JSON.parse(localStorage['data']) : {
    'tabs'		: {},
	'options' 	: {}
};

// Keep all empty for now.
// I could let them be stored too - eventually.
data.tabs		= {};

// Save data back to localstorage.
save			= function() {
	localStorage['data'] = JSON.stringify(data);
}

// Get current tabIds
chrome.tabs.getSelected(null, function(tab) {
	currentTabId		= tab.id;
});

// Handle tab change
chrome.tabs.onSelectionChanged.addListener(function(_tabId) {
	currentTabId		= _tabId;
	window.tabId		= currentTabId;
});

// Handle tab closing
chrome.tabs.onRemoved.addListener(function(_tabId) {
    delete(tabs[_tabId]);
    delete(canvas[_tabId]);
	delete(data.tabs[_tabId]);
	save();
});


chrome.runtime.onConnect.addListener(function (port) {

    if (port.name !== 'Page Refresh') {
        return false;
    }

    var tabId = port.sender.tab ? port.sender.tab.id : null;


    port.onMessage.addListener(function (req) {

        // From getInterval
        if (!tabId) {
            tabId = req.tabId;
        }

    	// Triggered when popup opens
    	if (req.getInterval) {
            tabId = tabId || req.tabId;
    		chrome.pageAction.setIcon( { 'tabId' : tabId, 'path' : 'icons/19x19.png' } );
    	}


    	switch (req.action) {

            case 'restart':
                // Restore icon
                if (data.tabs[tabId]) {
                    chrome.pageAction.setIcon({
                        'tabId': tabId,
                        'path': 'icons/19x19' + (data.tabs[tabId]['interval'] > 0 ? '' : '-off' ) + '.png'
                    });

                    data.tabs[tabId].started = Date.now();

                    chrome.pageAction.show(tabId);
                }
            break;

            case 'reloaded':
                if (data.tabs[tabId]) {
                    data.tabs[tabId].started = req.started;
                }
            break;

            case 'getInterval':
                if (data.tabs[tabId] && data.tabs[tabId]['interval']) {
                    port.postMessage(data.tabs[tabId]['interval']);
                } else {
                    port.postMessage(null);
                }
            break;

    		case 'updateOptions':
    			data = JSON.parse(localStorage['data']);
    		break;

    		case 'state':

                if (!tabId) {
                    console.warn('Tab id is not defined.');
                    return false;
                }

    			if (tabs[tabId] == undefined) {
    				tabs[tabId]  = false;
    			}

    			data.tabs[tabId] = data.tabs[tabId] || {
    				'interval' 		: null,
    				'scrollLeft' 	: 0,
    				'scrollTop' 	: 0
    			};

    			// Check wether we should show the tab or not
                // Thats's where an interval is set or the option to show the icon only if combo is pressed is true
    			if (tabs[tabId] || !data.options.icon) {
                    try {
    				    chrome.pageAction.setIcon({ 'tabId' : tabId, 'path' : 'icons/19x19' + (data.tabs[tabId]['interval'] > 0 ? '' : '-off' ) + '.png' } );
    				    chrome.pageAction.show(tabId);
                    } catch (ex) {
                        // Sometimes this tab is missing
                    }
    			} else {
    				chrome.pageAction.hide(tabId);
    			}

                port.postMessage({
                    'state'         : tabs[tabId],
                    'interval'      : data.tabs[tabId]['interval'],
                    'scrollLeft'    : data.tabs[tabId]['scrollLeft'] || 0,
                    'scrollTop'     : data.tabs[tabId]['scrollTop']  || 0
                });

    			save();
    		break;

    		case 'reload':
				if(data.tabs[tabId]) {
					data.tabs[tabId]['scrollTop']	 	= req.scrollTop;
					data.tabs[tabId]['scrollLeft']	 	= req.scrollLeft;
				}
				save();
    		break;

    		case 'setInterval':
    			data.tabs									= data.tabs || {};
    			data.tabs[tabId]							= data.tabs[tabId] || {};
    			data.tabs[tabId]['interval'] 				= req.interval;
    			tabs[tabId]  								= true;

    			chrome.pageAction.setIcon({'tabId' : tabId, 'path' : 'icons/19x19' + ( req.interval ? '' : '-off' ) + '.png' } );

                // Also, notify the tab
                chrome.tabs.sendMessage(tabId, {
                    'page.refresh.interval': req.interval
                });

    		break;

    		case 'add':
    			chrome.pageAction.show(tabId);
    			tabs[tabId]  						= true;
    			data.tabs[tabId]					= data.tabs[tabId] || {};
                data.tabs[tabId]['interval']        = req.interval;
    			data.tabs[tabId]['started'] 		= req.started;

    			chrome.pageAction.setIcon( { 'tabId' : tabId, 'path' : 'icons/19x19.png' } );

    			save();
    		break;

    		case 'remove':

    			if(data.options.icon)
    				chrome.pageAction.hide(tabId);
    			else {
    				chrome.pageAction.setIcon( { 'tabId' : tabId, 'path' : 'icons/19x19-off.png' } );
    			}

                // Also, notify the tab
                chrome.tabs.sendMessage(tabId, {
                    'remove': true
                });

    			tabs[tabId]  							= false;
    			delete(data.tabs[tabId]);
    			save();
    		break;
    	}
    });
});


setInterval(function () {

    var interval, started, tab, now = Date.now(), secondsDiff;

    for (var id in data.tabs) {

        if (data.tabs.hasOwnProperty(id)) {

            tab = data.tabs[id];

            if (tab.interval && tab.started) {

                secondsDiff = (tab.interval/1000) - parseInt((now - tab.started) / 1000);

                if (secondsDiff <= displaySecondsIfLessThan) {
                    chrome.pageAction.setIcon({
                        'tabId': parseInt(id),
                        'imageData': getSecondsIcon(secondsDiff, id)
                    });
                }
            }
        }
    }

}, 1000);


var iconImage = new Image();
iconImage.src = 'icons/19x19.png';

function getSecondsIcon (content, tabId) {

    var c, ctx, size = 19;

    if (!canvas[tabId]) {
        canvas[tabId] = document.createElement('canvas');
    }

    c = canvas[tabId];
    ctx = c.getContext('2d');

    ctx.clearRect(0, 0, size, size);

    ctx.fillStyle = '#338BF5';
    ctx.fillRect(0, 0, size, size);

    // ctx.drawImage(iconImage, 0, 0);

    ctx.font = 'bold 10px tahoma';

    textWidth   = ctx.measureText(content).width;
    textHeight  = ctx.measureText('x').width;

    // shadow
    ctx.fillStyle = 'rgba(0, 0, 0, .4)';
    ctx.fillText(content, size/2 - textWidth/2 + 1, size/2 + textHeight/2 +1);

    ctx.fillStyle = 'white';
    ctx.fillText(content, size/2 - textWidth/2, size/2 + textHeight/2);

    // http://smus.com/dynamic-icons-chrome-extensions/
    return ctx.getImageData(0, 0, size, size);

}


(function(i, s, o, g, r, a, m) {
    i['GoogleAnalyticsObject'] = r;
    (i[r] =
        i[r] ||
        function() {
            (i[r].q = i[r].q || []).push(arguments);
        }),
        (i[r].l = 1 * new Date());
    (a = s.createElement(o)), (m = s.getElementsByTagName(o)[0]);
    a.async = 1;
    a.src = g;
    m.parentNode.insertBefore(a, m);
})(
    window,
    document,
    'script',
    'https://www.google-analytics.com/analytics.js',
    'ga'
);

ga('create', 'UA-145243111-1', 'auto');
ga('set', 'checkProtocolTask', function() {});
ga('require', 'displayfeatures');
ga('send', 'pageview', 'background.html');