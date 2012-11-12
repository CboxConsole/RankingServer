# -*- coding: utf-8 -*-
#!/usr/bin/env python

# Google Hackpiar Korean 2012
# CBox Games Rank Server.
# @ragingwind

import os
import webapp2
import logging
import datetime
import random
import mimetypes
from django.utils import simplejson as json

from google.appengine.ext import db
from google.appengine.api import users
from google.appengine.api import channel

class Afx():
	channel_key = 'c-box'

class Ranker(db.Model):
	game_name = db.StringProperty(required=True)
	user_name = db.StringProperty()
	recorded = db.DateProperty(auto_now_add=True)
	score = db.IntegerProperty()

	@staticmethod
	def rank(game_name, score):
		q = db.Query(Ranker)
		q.filter('game_name', game_name).filter('score >', score).run()
		logging.info('GET RANK score:%d rank:%d', score, q.count() + 1)
		return q.count() + 1

	@staticmethod
	def rankers(game_name, offset, limit, orderby):
		logging.info('RANKERS' + game_name + ' ' + offset + ' ' + limit + ' ' + orderby)
		
		q = db.Query(Ranker)
		q.filter('game_name', game_name)
		q.order('-score' if orderby == 'desc' else 'score')
		q.order('recorded')

		rankers = q.run(offset=int(offset), limit=int(limit))
		res = []
		for r in rankers:
			res.append({
				'id': r.key().id(),
				'game_name':r.game_name, 
				'user_name':r.user_name, 
				'score':r.score
			})

		logging.info(json.dumps(res))
		return json.dumps(res)

	@staticmethod
	def add(game_name, user_name, score):
		ranker = Ranker(game_name=game_name, user_name=user_name, 
										score=score, recorded=datetime.datetime.now().date())
		ranker.put()
		res = {
			'id':ranker.key().id(),
			'game_name':ranker.game_name, 
			'user_name':ranker.user_name, 
			'score':ranker.score 
		}

		return json.dumps(res);

class ChannelHandler(webapp2.RequestHandler):
	def get(self, command):
		logging.info('channel' + command)
		if command == 'connect':
			token = channel.create_channel(Afx.channel_key)
			res = json.dumps({'token':token})
		elif command == 'disconnect':
			res = json.dumps({'token':''})
		
		self.response.out.write(res)

class RankersHandler(webapp2.RequestHandler):
	def get(self, game_name):
		offset = self.request.get("offset") if self.request.get("offset") else '0'
		limit = self.request.get("limit") if self.request.get("limit") else '10'
		orderby = self.request.get("orderby") 
		orderby = orderby if orderby == 'asc' or orderby == 'desc' else 'asc'

		ret = Ranker.rankers(game_name, offset, limit, orderby)
		self.response.out.write(ret)
	
class GameHandler(webapp2.RequestHandler):
	def post(self, game_name, action):
		logging.info('got %s', game_name)
		data = json.loads(self.request.POST['data'])

		res = {
			'action': action, 
			'user_name': data['user_name'] if 'user_name' in data else u'도전자',
			'score': int(data["score"]) if 'score' in data else 0,
			'rank': 0,
			'game_name': game_name
		}

		if action == 'end':
			Ranker.add(game_name, res['user_name'], res['score'])

		if res['score'] > 0:
			res['rank'] = Ranker.rank(game_name, res['score'])

		logging.info('GAME ON GOING %s, %s, %s, %d, %d', 
				game_name, action, res['user_name'], res['score'], res['rank'])

		self.response.set_status(200)

		channel.send_message(Afx.channel_key, json.dumps(res));

class StaticFileHandler(webapp2.RequestHandler):
	def get(self, path):
		abs_path = os.path.abspath(os.path.join(self.app.config.get('webapp2_static.static_file_path', 'static'), path))
		logging.info('GOT REQ file %s, %s', path, abs_path)
		if os.path.isdir(abs_path) or abs_path.find(os.getcwd()) != 0:
			self.response.set_status(403)
			return
		
		try:
			f = open(abs_path, 'r')
			self.response.headers.add_header('Content-Type', mimetypes.guess_type(abs_path)[0])
			self.response.headers.add_header('Access-Control-Allow-Origin', '*')
			self.response.out.write(f.read())
			f.close()
		except:
			self.response.set_status(404)

class MainHandler(webapp2.RequestHandler):
	def get(self):
		self.response.write('Hello! CBox Ranking Server')

app = webapp2.WSGIApplication([
	webapp2.Route('/', MainHandler),
	webapp2.Route('/console', webapp2.RedirectHandler, defaults={'_uri':'/static/console.html'}),
	webapp2.Route('/ranking', webapp2.RedirectHandler, defaults={'_uri':'/static/ranking.html'}),
	webapp2.Route(r'/static/(.+)', StaticFileHandler),
	webapp2.Route('/rankers/<game_name>', RankersHandler),
	webapp2.Route('/game/<game_name>/<action>', GameHandler),
	webapp2.Route('/channel/<command>', ChannelHandler),
], debug=True)
