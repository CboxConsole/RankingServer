(function() {
	
	// ranking client to retrieving raning data.
	// @ragingwind

	var ranking = {
		host: undefined,
		baseurl: function() {
			return ranking.host ? ranking.host : 'http://cbox-console.appspot.com/';
		},
		rankers: function(game_name, offset, limit, orderby, cb) {
			var query = ['rankers/', game_name, '?offset=', offset, 
									'&limit=', limit, '&orderby=', orderby];
			$.ajax({
				type: 'get',
			  url: this.baseurl() + '/' + query.join(''),
				success: function(data) {cb(true, data)},
				error: function(xhr) {cb(false, xhr)},
			});
		},
		connect: function(delegate) {
			$.ajax({
				type: 'get',
		  	url: this.baseurl() + '/channel/connect',
				success: function(data) {
					ranking.channel = new goog.appengine.Channel(JSON.parse(data).token);
					ranking.socket = ranking.channel.open();
		    	ranking.socket.onopen = delegate.onopen;
		    	ranking.socket.onmessage = delegate.onmessage;
		    	ranking.socket.onerror = delegate.onerror;
		    	ranking.socket.onclose = delegate.onclose;
		    	ranking.socket.delegate = delegate
				},
				error: function(xhr) {
					delegate.onerror(xhr);
				}
			});
		},
		trigger: function(game_name, action, game_data, cb) {
			console.log('trigger event', action, 'score', game_data.score);
			$.ajax({
				type: 'post',
			  url: [this.baseurl(), '/game/', game_name, '/', action].join(''),
			  data:{'data': JSON.stringify(game_data)},
				success: function(data) {!cb || cb(true, data)},
				error: function(xhr) {!cb || cb(false, xhr)},
			});
		},
		start: function(game_name, user_name, score, cb) {
			this.trigger(game_name, 'start', {score:score, user_name:user_name}, cb);
		},
		score: function(game_name, user_name, score, cb) {
			this.trigger(game_name, 'score', {score:score, user_name:user_name}, cb);
		},
		end: function(game_name, user_name, score, cb) {
			this.trigger(game_name, 'end', {score:score, user_name:user_name}, cb);
		}
	}

	window.ranking = ranking;
})(window);