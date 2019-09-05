// Load
var port;

data = localStorage['data'] ? JSON.parse(localStorage['data']) : {};

document.getElementById('options-icon').checked = !!data.options.icon;
document.getElementById('options-icon').addEventListener('change', function () {
  save();
});


function save() {

  port = port || chrome.runtime.connect({'name': 'Page Refresh'});

  data.options = {
    'icon' : !!document.getElementById('options-icon').checked
  };

  localStorage['data'] = JSON.stringify(data);

  port.postMessage({
    action: 'updateOptions'
  });
}
