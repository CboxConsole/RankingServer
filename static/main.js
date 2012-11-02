require.config({
	paths: {
		'jquery': 'libs/jquery', 
		'underscore': 'libs/underscore', 
		'backbone': 'libs/backbone',
		'text': 'libs/text',
		'hogan': 'libs/hogan'
	},
			
	shim: {
		backbone: {deps: ['underscore']}
	}
});

require(['app'], function(App) {
	window.app = new App();
});