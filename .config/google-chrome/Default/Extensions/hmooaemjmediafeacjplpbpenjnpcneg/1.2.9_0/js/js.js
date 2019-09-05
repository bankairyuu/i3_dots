(function() {
Ext = {
	'keys' 			: {},
	'interval'		: 1000 * 60, // Default interval
	'timer'			: false,
	'lastUserEvent' : 0,

    'port': null,

	'initialize' : function() {
		this.addEvents();
		this.send({
			'action' : 'state'
		});

		return this;
	},

	'addEvents'		: function() {

        // Sent using chrome.tabs.sendmessage
        chrome.runtime.onMessage.addListener(function (message) {

            if (message['page.refresh.interval'] !== undefined) {
                Ext.setInterval(message['page.refresh.interval']);
                return;
            }

            if (message.remove) {
                Ext.remove(true);
            }

        });

        this.port = chrome.runtime.connect({'name': 'Page Refresh'});

        this.port.onMessage.addListener(function(message) {

            if (message.state === true) {

                if (message.interval) {
                    Ext.interval = parseInt(message.interval);
                }

                if (message.scrollTop || message.scrollLeft) {

                    window.adddEventListener('DOMContentLoaded', function () {

                        if (message.scrollTop) {
                            document.body.scrollTop = message.scrollTop;
                        }

                        if (message.scrollleft) {
                            document.body.scrollLeft = message.scrollLeft;
                        }

                    });

                }

                Ext.add(true);

            }

            if (message.getInterval) {
                port.postMessage({ 'getInterval': Ext.interval} );
            }

        });

		window.addEventListener('keydown', function(event) {

            if (event.shiftKey && (event.metaKey || event.ctrlKey)) {
                if (event.keyCode === 14 || event.keyCode === 82) {
                    event.preventDefault();
                    event.stopPropagation();
                    Ext.toggle();
                }
            }

            Ext.restart();
		});

		window.addEventListener('mousedown', function(event) {
			Ext.restart();
		});

		return this;
	},

	setInterval		: function (interval) {

		Ext.interval 		= interval;
		return this.add().restart();
	},

	restart			: function() {

		if (!this.isRunning)	 {
			return;
		}

		this.lastUserEvent = new Date().getTime();

		if(this.timer) {
			clearTimeout(this.timer);
		}

		this.isRunning = true;

		if(this.interval) {
			this.timer = setTimeout(this.reload, this.interval);
		}

        // Notify the controller
        this.send({
            'action'    : 'restart',
            'started'   : +new Date()
        });

		return this;
	},

	add				: function (skipSend) {

		if (this.interval) {
			this.timer = setTimeout(this.reload, this.interval);

            this.send({
                'action': 'reloaded',
                'started': Date.now()
            });
		}

		this.isRunning 	= true;


		if (!skipSend) {
			this.send({
				'action' 	: 'add',
				'interval'	: this.interval,
                'started'   : +new Date()
			});
		}
		return this;
	},

	remove			: function(dontSend) {

		if(this.timer) {
			clearTimeout(this.timer);
		}

		this.isRunning = false;

        if (!dontSend) {
		  this.send({
		  	'action' : 'remove'
		  });
        }

		return this;
	},


	toggle			: function() {
		return this[this.isRunning == true ? 'remove' : 'add']();
	},

	reload			: function() {
		Ext.send({
			'action' 		: 'reload',
			'scrollTop'		: document.body.scrollTop,
			'scrollLeft'	: document.body.scrollLeft
		});

		window.location.href = window.location.href;
	},

	send			: function(obj) {
        this.port.postMessage(obj)
		return this;
	},

	load			: function() {
		if (localStorage['data']) {
			this.data = JSON.parse(localStorage['data']);
		} else {
			this.data = {
				'tab'		: null, // Current tab.id
				'options'	: null,	// Hold options (in the futute)
				'tabs'		: null	// Hold tab related structures.
			}
		}
		return this;
	},

	save			: function() {

		if(this.data) {
			localStorage['data'] = JSON.stringify(this.data);
		}

		return this;
	}

}


Ext.initialize();


})();
