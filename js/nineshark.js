var Nineshark = function(){

	var s = this;

	/** APIS **/
	var LASTFM_api_key = '8644433e4336ea22d26e66dc0510ce2d';
	s.lastFM = new LastFM(LASTFM_api_key);

	var FB_app_id = '468368906586776';
	var FB_app_secret = '0b38496b85ee23fcf80ac17d6deadad9';
	var FB_access_token = '';
	s.fb = new FBManager(FB_app_id, FB_app_secret);

	var YT_api_key = 'AIzaSyB1OJS5M3c5PIbKiXPubHwdsiUoFmy-zOs';
	s.yt = new YTManager(YT_api_key);

	/** DOM **/
	var $mainbody = $('#mainbody');
	var $rightContent = $mainbody.find('.right');

	// Search
    var $busy = $('#busy');
    var $results = $('#results');
    var $noResults = $('#noResults');
	var $txtQuery = $('#txtQuery');
	var $selectType = $('#selectType');
	var $btnQuery = $('#btnQuery');

	// Controls Player
	var $playQueue = $('#playQueue');
	var $progressBar = $('#progressBar');
	var $progressTrack = $('#progressTrack');
	var $durationTrack = $('#durationTrack');
	var $play = $('#controls .play');
	var $prev = $('#controls .prev');
	var $next = $('#controls .next');


	s.load = function(cb){

		s.yt.load(function(){
			s.fb.load(function(access_token){

				s.yt.events.onPlayerStateChange = s.onPlayerStateChange;

				// Cargo el player de youtube (funcion sincronica)
				s.yt.loadPlayer('videoplayer');

				$play.click(function(){
					if(s.yt.videoPlayerState == YT.PlayerState.PLAYING)
						s.yt.pauseVideo();
					else
						s.yt.playVideo();
				});

				$next.click(function(){s.yt.nextTrack();});
				$prev.click(function(){s.yt.prevTrack();});

				s.linkSearchDOM();

			})
		});

	};

	var playerTimer = null;
	s.onPlayerStateChange = function(event){
		if(event.data == YT.PlayerState.ENDED)
		{
			clearInterval(playerTimer);
			nextTrack();
		}
		else if(event.data == YT.PlayerState.PLAYING)
		{

			$progressBar.show();
			$progressBarChildren = $progressBar.find('.progress-bar');

			var playerTotalTime = player.getDuration();
			var durationTrackFormatted = playerTotalTime.toString().toHHMMSS();
			$durationTrack.text(playerTotalTime < 3600 ? durationTrackFormatted.substr(3) : durationTrackFormatted);

			playerTimer = setInterval(function() {

				var playerCurrentTime = player.getCurrentTime();

				var playerTimeDifference = (playerCurrentTime / playerTotalTime) * 100;

				var progressBarWidth = playerTimeDifference * $progressBar.width() / 100;

				$progressBarChildren.animate({ width: progressBarWidth });

				var progressTrackFormatted = playerCurrentTime.toString().toHHMMSS();
				$progressTrack.text(playerCurrentTime < 3600 ? progressTrackFormatted.substr(3) : progressTrackFormatted);

			}, 1000);

			$play.removeClass('glyphicon-play').addClass('glyphicon-pause');
		}
		else
		{
			clearInterval(playerTimer);
			$play.removeClass('glyphicon-pause').addClass('glyphicon-play');
		}
	}

	s.linkSearchDOM = function(){

		$btnQuery.click(function () {

			s.search($txtQuery.val(), $selectType.val(), function(data){

			});
		});

		$txtQuery.keypress(function (e) {

			if (e.keyCode == 13)
				s.search($txtQuery.val(), $selectType.val(), function(data){});

		});
	}

	s.search = function(query, type, cb){

		$results.addClass('hidden');
	    $noResults.addClass('hidden');
	    $busy.removeClass('hidden');

        s.lastFM.search(query, type, function (data) {
            $busy.addClass('hidden');

            var n = 0;

            if (data.results['opensearch:totalResults'] > 0) {

                var rendered;

                if(typeof(data.results.trackmatches) !='undefined')
                {
                    data.results.trackmatches.image1 = function () {
                        return this.image && this.image.length > 2 ? this.image[1]["#text"] : '';
                    };
                    data.results.trackmatches.json = function(){return JSON.stringify(this);};

                    $.get('templates/track-list.html', function(template){
                        rendered = Mustache.render(template, data.results.trackmatches);

                        $results.html(rendered);

                        n = data.results['opensearch:totalResults'];

                        if (n == 0)
                        {
                            $noResults.removeClass('hidden');
                        }
                        else
                        {
                            //bindListItems();
                            $results.removeClass('hidden');
                        }

                        if(typeof(cb) == 'function')
	                        cb(data);

                    }).fail(function(r){
                        $noResults.removeClass('hidden');

                        if(typeof(cb) == 'function')
	                        cb(false);
                    });
                }
                else if(typeof(data.results.albummatches) != 'undefined')
                {
                    data.results.albummatches.image1 = function () {
                        return this.image && this.image.length > 2 ? this.image[2]["#text"] : '';
                    };
                    data.results.albummatches.json = function(){return JSON.stringify(this);};

                    $.get('templates/album-list.html', function(template){

                        rendered = Mustache.render(template, data.results.albummatches);

                        $results.html(rendered);

                        n = data.results['opensearch:totalResults'];

                        if (n == 0)
                        {
                            $noResults.removeClass('hidden');
                        }
                        else
                        {
                            //bindListItems();
                            $results.removeClass('hidden');
                        }

                        if(typeof(cb) == 'function')
	                        cb(false);

                    }).fail(function(r){
                    	$noResults.removeClass('hidden');
                    });
                }
            }
        });

	};

};

$(window).load(function(){

	var ns = new Nineshark();
	ns.load(function(){});

});