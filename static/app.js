define([
	'text!tmpl/app.tmpl',	
	'text!tmpl/ranking.tmpl',  
	'text!tmpl/ranking.table.tmpl', 
	'backbone', 'hogan'],
	function(t$app, t$ranking, t$rankingTable) {

	'use strict';

	var Ranking = Backbone.Collection.extend({
		initialize: function(models, options) {
			this.url = this.query(options.params);
		},
		query: function(params) {
			!params || (this.params = params);
			return ['/rankers/', this.params.game_name, '?offset=', this.params.offset, 
							'&limit=', this.params.limit, '&orderby=', this.params.orderby].join('');
		}
	});

	var PopupView = Backbone.View.extend({
		id:'popup',
		className:'unpop',
		initialize: function() {
		},
		render: function () {
			this.$el.append('<p id="message">' + this.options.msg + '</p>');
			this.$el.css('-webkit-animation', 'popup ' + this.options.interval + 's linear 0s 1 alternate');
			return this;
		}
	});

	var RankingView = Backbone.View.extend({
		className:'ranking',
		events: {
		},
		initialize: function() {
			var params = {
				game_name:this.options.game.name, 
				offset:0, 
				limit:10, 
				orderby:'desc'
			};

			this.collection = new Ranking([], {params:params});
			this.collection.on('reset', this.reset, this);

			this.on('top100', function() {
				this.collection.fetch();
			}, this);
		},
		remoteFirstItem:  function() {
			var c = this.$el.children('ul').children('li:first-child');
			$(c).addClass('remove');
			setTimeout(function() {
				c.remove();
			}, 500);
		},
		reset: function(rankers, options) {
			var $ul = this.$el.children('ul');
			!($ul.children().length > 0) || $ul.children().remove();
			var rank = 1;
			_.each(rankers.models, function(m) {
				$ul.append(Hogan.compile(t$rankingTable).render({
					rank:rank++, user_name:m.attributes.user_name, score:m.attributes.score
				}));
			});

			this.grow(this.$el.find('ul').children());
		},
		grow: function(childrens) {
			setTimeout(function() {
				var velocity = 1;
				_.each(childrens, function(c) {
					setTimeout(function() {
						$(c).removeClass('reduct');
						c = null;
					}, 300 * velocity++);
				});
				childrens = null;
			}, 100);
		},
		render: function() {
			this.$el.append(Hogan.compile(t$ranking).render());
			return this;
		},
		top: function() {
			if (this.collection.length > 0) {
				this.reset(this.collection);
			}
			else
				this.collection.fetch();
		},
		refresh: function() {
			this.collection.fetch();
		},
		disappear: function(cb) {
			// remove al list?
			this.$el.animate({opacity:0}, 1000, function() {
				$(this).hide(cb);
			});
		},
		appear: function() {
			this.$el.css('opacity', 1).show();
		}
	});

	var App = Backbone.Router.extend({
		games: [
			{idx: 0, name:'mong-adventure'},
			{idx: 1, name:'breakout'},
			{idx: 2, name:'candypang'},
		],
		routes: {
			'/': 'render',
		},
		_rotator: -1,
		_rotateInterval: 5000,
		initialize: function() {
			_.bindAll(this, 'rotate', 'onmessage', 'onclose');
			
			// bind event with channel events
			this.on('start', this.gameStarted, this);
			this.on('score', this.userScored, this);
			this.on('end', this.gameEnded, this);

			ranking.connect(this);
			this.render();
			Backbone.history.start({});
		},
		render: function() {
			var $app = $(Hogan.compile(t$app).render());
			_.each(this.games, function(g) {
				g.view = new RankingView({id:g.name, game:g}).render();
				$app.append(g.view.$el);
			}, this);
			$('body').append($app);

		},
		cleartimer: function() {
			!this._rotateTimer || clearTimeout(this._rotateTimer);
			this._rotateTimer = undefined;
		},
		pop: function(msg, interval) {
			!this.popup || this.popup.remove();
			this.popup = new PopupView({msg:msg, interval:interval}).render();
			$('body').append(this.popup.$el);
		},
		onopen:function() {
			this.delegate.rotate();
			this.delegate.pop('서버에 접속', 3);
		},
		onerror:function() {
			console.error('channel give error', arguments);
			ranking.connect(this.delegate);
		},
		onmessage:function(args) {
			var data = JSON.parse(args.data);
			this.trigger(data.action, data);
		},
		onclose: function() {
			this.cleartimer();
		},
		gameStarted: function(data) {
			this.fix(data.game_name);

			var msg = [data.user_name, '님<br/>새로운 도전'].join('');
			this.pop(msg, 10);
		},
		userScored: function(data) {
			this.fix(data.game_name);

			var msg = [data.user_name, '님 득점<br/>순위는 ', data.rank, '등<br>점수는 ', data.score, '점'].join('');
			this.pop(msg, 5);
		},
		gameEnded: function(data) {
			if (this._rotateTimer) {
				console.error('game does not started');
				return;
			}

			var msg = ['축하합니다.<br/>', data.user_name, '님<br/>', data.rank, '등입니다'].join('')
				,	sec = 10;
			this.pop(msg, sec);
			data.rank > 10 || this.games[this._rotator].view.refresh();
			setTimeout(this.rotate, 1000 * sec);
		},
		fix: function(game_name) {
			var prev = this.games[this._rotator];
			if (prev.name != game_name) {
				var rotator = _.find(this.games, function(g) {return g.name == game_name});
				this.rotating(rotator, prev, false);
				this._rotator = rotator.idx;
			}
			this.cleartimer();
		},
		rotating: function(rotator, prev, timer) {
			var rotation = function() {
				rotator.view.appear();
				rotator.view.top();		
			};

			(prev) ? prev.view.disappear(rotation) : rotation();
			(!timer) || (this._rotateTimer = setTimeout(this.rotate, this._rotateInterval));
		},
		rotate: function() {
			var prev = this.games[this._rotator];
			(++this._rotator < this.games.length) || (this._rotator = 0);
			this.rotating(this.games[this._rotator], prev, true);
		}
	});

	return App;
});
