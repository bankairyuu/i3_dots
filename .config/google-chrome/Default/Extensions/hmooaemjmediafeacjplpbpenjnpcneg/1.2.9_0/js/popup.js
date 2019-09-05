(function () {

var tabId     = 0,
    interval  = 60000, // Default
    intervals = [ [0, 2, 5, 10,  30], [1, 2, 3, 5, 8], [10, 15, 20, 30/*, 'rnd' */] ],
    tabId,
    port      = chrome.runtime.connect({name: 'Page Refresh'});

// Get current tabId first
chrome.tabs.query({active: true, currentWindow: true}, function (tabs) {

  if (tabs[0]) {
      tabId = tabs[0].id;
      getInterval();
  } else {
    console.warn('Sorry, unable to get current Tab id.');
  }
})


function getInterval () {

  var struct = {
    tabId:  tabId,
    action: 'getInterval'
  };

  port.onMessage.addListener(function (response) {
    interval = response;
    render();
  });

  port.postMessage(struct);

  // Note: using chrome.runtime.sendMessage will require onMessage on the other side
  // and will get a response.

  /*
  chrome.runtime.sendMessage({'getInterval':  true, 'tabId': tabId}, function (response) {
    console.log(response);

    if (response !== null) {
      interval = response;
    }

    render();
  });
  */
}

function render () {

  if (window._rendered) {
    return false;
  }

  window._rendered = true;

  var html    = [];

  intervals.forEach(function (group, groupIndex) {

    var metric      = groupIndex === 0 ? 'second' : 'minute';
    var metricString  = '';
    var thisInterval;
    var className     = '';

    html.push('<ol>');

    group.forEach(function(item, index) {

      var title,
          thisInterval = groupIndex == 0 ? item * 1000 : item * 1000 * 60,
          className    = thisInterval == interval ? ' class="selected"' : '';

      metricString =  metric;

      if(item > 1  )  {
        metricString += 's';
      }

      title = item  + ' ' + metricString;

      // Canceler
      if(item == 0) {
        title   = 'don\'t refresh';
        className = className.indexOf('"') != -1 ? className.replace(/"$/,' zero"') : ' class="zero"';
      }

      if(item === 'rnd') {
        title = 'random';
      }

      html.push('<li'+className+' data-interval="' + thisInterval + '">' + title +'</li>');
    });

    html.push('</ol>')
  });

  document.getElementById('wrapper').innerHTML = html.join('');
}

function set (element, interval) {

  var currentElement = document.querySelector('.selected');

  interval = parseInt(interval);

  if (!port) {
    console.warn('Port is not found. Bailing out.');
    return;
  }

  if (currentElement) {
      if (currentElement === element) {
        return false;
      } else {
        currentElement.classList.remove('selected');
      }
  }

  if (interval === 0) {
    return unset();
  }

  port.postMessage({
    'tabId':    tabId,
    'action':   'setInterval',
    'interval': interval
  });

  element.classList.add('selected');

  window.close();
}

function unset () {

  if (!port) {
    console.warn('Port is not found. Bailing out.');
    return;
  }

  port.postMessage({
    'tabId':  tabId,
    'action': 'remove'
  });

  window.close();
}

// Global click event
document.getElementById('wrapper').addEventListener('click', function (event) {

  var t = event.target, targetInerval;

  if (t.nodeName !== 'LI') {
    return false;
  }

  targetInterval = t.dataset.interval;

  set(t, targetInterval);
});

}());






















































// // Get tabInterval from current window (tab)
// chrome.tabs.query({'active': true, 'currentWindow': true}, function (tabs) {

//   chrome.tabs.sendMessage(tabs[0].id, { getInterval: true, tabId: tabs[0].id }, function (response) {
//       interval = response.getInterval;
//       render();
//     });
// });

// function set () {

//   if (!Ext.previousIntervalElement) {
//     Ext.previousIntervalElement = document.body.querySelector('.selected');
//   }

//   if (interval == 0 ) {
//     Ext.Popup.remove(tabId)
//     return;
//   }

//   // No change, bail out.
//   if (Ext.previousIntervalElement === element) {
//     return this;
//   }

//   if(element) {
//     Ext.previousIntervalElement.className     = '';
//     element.className               = 'selected';
//     Ext.previousIntervalElement         = element;
//   }

//   //document.body.innerHTML = interval;
//   //return

//   chrome.tabs.sendRequest(tabId, {
//     'page.refresh.interval'   : interval,
//     'tabId'           : tabId
//   });

//   element && window.close();
// }

// function render () {

//   if (window._rendered) {
//     return false;
//   }

//   window._rendered = true;

//   var html    = [];

//   intervals.forEach(function(group, groupIndex) {
//     var metric      = groupIndex === 0 ? 'second' : 'minute';
//     var metricString  = '';
//     var thisInterval;
//     var className     = '';
//     html.push('<ol>');
//     group.forEach(function(item, index) {
//       var title;

//       var thisInterval = groupIndex == 0 ? item * 1000 : item * 1000 * 60;
//       className    = thisInterval == interval ? ' class="selected"' : '';

//       metricString =  metric;
//       if(item > 1  )  {
//         metricString += 's';
//       }

//       title = item  + ' ' + metricString;
//       if(item == 0) {
//         title   = 'don\'t refresh';
//         className = className.indexOf('"') != -1 ? className.replace(/"$/,' zero"') : ' class="zero"';
//       }

//       if(item === 'rnd') {
//         title = 'random';
//       }

//       html.push('<li'+className+' onclick="Ext.Popup.setInterval(this, '+thisInterval+', tabId)">' + title +'</li>');
//     });
//     html.push('</ol>')
//   });
//   document.getElementById('wrapper').innerHTML = html.join('');

// }

// set(document.body.querySelector('.selected'), interval);

// // // chrome.runtime.onConnect.addListener(function (port) {

// // //   var tabId;

// // //   if (port.name !== 'Page Refresh') {
// // //       return false;
// // //   }

// // //   if (!port.sender || !port.sender.tab || !port.sender.tab.id) {
// // //       console.warn('Sorry, unable to find tab here', port);
// // //       return false;
// // //   }

// // //   tabId = port.sender.tab.id;

// // //   port.onMessage.addListener(function (req) {
// // //     interval  = req.getInterval;
// // //     render();
// // //   });

// // // });














// // render = function() {

// //   if (window._rendered) {
// //     return false;
// //   }

// //   window._rendered = true;

// //   var html    = [];

// //   intervals.forEach(function(group, groupIndex) {
// //     var metric      = groupIndex === 0 ? 'second' : 'minute';
// //     var metricString  = '';
// //     var thisInterval;
// //     var className     = '';
// //     html.push('<ol>');
// //     group.forEach(function(item, index) {
// //       var title;

// //       var thisInterval = groupIndex == 0 ? item * 1000 : item * 1000 * 60;
// //       className    = thisInterval == interval ? ' class="selected"' : '';

// //       metricString =  metric;
// //       if(item > 1  )  {
// //         metricString += 's';
// //       }

// //       title = item  + ' ' + metricString;
// //       if(item == 0) {
// //         title   = 'don\'t refresh';
// //         className = className.indexOf('"') != -1 ? className.replace(/"$/,' zero"') : ' class="zero"';
// //       }

// //       if(item === 'rnd') {
// //         title = 'random';
// //       }

// //       html.push('<li'+className+' onclick="Ext.Popup.setInterval(this, '+thisInterval+', tabId)">' + title +'</li>');
// //     });
// //     html.push('</ol>')
// //   });
// //   document.getElementById('wrapper').innerHTML = html.join('');
// // }



// // !('chrome' in window) && (window.onload = render);


// //  //Ext.Popup.setInterval( document.body.querySelector('.selected'), interval );





// // Ext.Popup = {

// //   remove  : function(tabId) {

// //     chrome.tabs.sendMessage(tabId, {
// //       'remove'  : true,
// //       'tabId'   : tabId
// //     });

// //     try { window.close(); } catch(ex) { }

// //     return this;
// //   },


// //   getInterval : function(tabId) {

// //     chrome.tabs.sendMessage(tabId, {

// //       'getInterval'   : true,
// //       'tabId'     : tabId
// //     });


// //     return this;
// //   },

// //   setInterval : function(element, interval) {
// //   }

// // }
