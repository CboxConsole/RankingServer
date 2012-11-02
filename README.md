# CHROME GAMES RANKING SERVER
Google Hackpair에 출품작인 Chrome Games Ranking Server 소스입니다. 

# HOW TO USE
클라이언트에서는 직접 URL을 사용하거나 static/ranking.js파일을 include 하여 'ranker' object를 사용하면 됩니다. API테스트와 소스의 사용법은 [콘솔페이지](http://cg-ranking.appspot.com/console)에서 참고 할 수 있습니다.

## 랭킹 페이지 들어가기
[랭킹페이지](http://cg-ranking.appspot.com/ranking)

## 콘솔 사이트 들어가기
[콘솔페이지](http://cg-ranking.appspot.com/console)

## 라이브러리리 참고하기
```
<script type="text/javascript" src="http://cg-ranking.appspot.com/libs/ranking.js"></script>
```

## 게임클라이언트에서 사용하기
게임에서는 랭킹서버에 현재 게임의 상태를 알려줘서 반영시킬수 있습니다. 게임의 상태는 '시작(start)', '점수획득(score)' 그리고 종료('end')로 나뉩니다. 시작/점수획득시에는 데이터베이스에는 반영되지 않으며 현재 Cbox채널에 접속되어 있는 랭킹클라이언트에게 게임정보와 점수가 전달됩니다. 사용자의 접수를 기록하기 위해서는 반드시 종료이벤트를 보내야 합니다. ranking.js에서는 아래와 같은 함수를 사용합니다.

### ranking.trigger
ranking.trigger함수는 이벤트의 종류와 인자값을 직접 넘겨서 에빈트를 보내줄 수 있습니다. 인자는 json이며 score, user_name입니다. 

```
// 게임 시작시, 점수는 0이며 게이머 이름은 기본으로 사용을 권장합니다.
ranking.trigger('game_name', 'start', {user_name:'도전자', score:0}, function(res, opt) {
	!res || throw 'error'
});

// 점수 갱신, 반드시 점수는 올라가야겠죠? 주기는 클라이언트에서 마음대로 하시면 됩니다.
ranking.trigger('game_name', 'score', {user_name:'도전자', score:100}, function(res, opt) {
	!res || throw 'error'
});

// 게임 종료, 최종 점수와 실제 기록될 사용자의 이름을 입력 하세요
ranking.trigger('game_name', 'end', {user_name:'아무개씨', score:1920}, function(res, opt) {
	!res || throw 'error'
});
```

### ranking.start/score/end
인자값을 미리 정의하여 사용하는 함수입니다.

```
// 게임 시작시, 점수는 0이며 게이머 이름은 기본으로 사용을 권장합니다.
ranking.start('game_name', '도전자', 0, function(res, opt) {
	!res || throw 'error'
});

// 점수 갱신, 반드시 점수는 올라가야겠죠? 주기는 클라이언트에서 마음대로 하시면 됩니다.
ranking.score('game_name', '도전자', 0, function(res, opt) {
	!res || throw 'error'
});

// 게임 종료, 최종 점수와 실제 기록될 사용자의 이름을 입력 하세요
ranking.end('game_name', '도전자', 0, function(res, opt) {
	!res || throw 'error'
});
```

## 랭킹 클라이언트에서 사용하기
랭킹 클라이언트 페이지에서 랭킹정보는 보거나 채널에 접속하는 방법입니다. 아래 두가지 함수를 통해서 사용됩니다.

### 랭킹정보 받아오기
랭킹정보는 게임당 offset/limit 인자를 통해서 범위값을 설정하고 orderby인자로 정렬 순서를 기준으로 가져옵니다. 리턴되는 값은 리스트의 형태이며 json타입으로 들어옵니다. 아래 예제를 참고하세
```
var offset = 0
	,	limit = 100
	, orderby = asc || desc;

ranking.rankers('game_name', offset, limit, orderby, function(res, data) {
	res || throw 'error';

	data = JSON.parse(data);
	$.each(data, function(i, v) {
		console.log(v.id, v.game_name, v.user_name, v.score);
	});
});
```