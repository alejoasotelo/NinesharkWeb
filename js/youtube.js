var YTManager = function(api_key){

	var s = this;

	s.YT_api_key = api_key;

	s.player;
	s.videoPlayerState = 0;

	s.callback_onload = function(){};

	s.events = {
		onPlayerReady: function(){},
		onPlayerStateChange: function(){},
	};

	s.load = function(callback_onload){

		s.callback_onload = callback_onload;

		gapi.client.setApiKey(api_key);

		gapi.client.load('youtube', 'v3', function (){
			var tag = document.createElement('script');
			tag.src = "http://www.youtube.com/iframe_api?onload=onYouTubeIframeAPIReady";
			var firstScriptTag = document.getElementsByTagName('script')[0];
			firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
		});

	}

	window.onYouTubeIframeAPIReady = function() {
		s.callback_onload();
    }

    s.loadPlayer = function(id){

        s.player = new YT.Player(id/*'videoplayer'*/, {
            width: '420',
            height: '315',
            suggestedQuality: '',
            playerVars: {
                'rel': 1,
                'controls': 0,
                'showInfo': 0,
                'iv_load_policy': 0,
                'modestbranding': 1,
            },
            //videoId: 'M7lc1UVf-VE',
            events: {
                'onReady': s.onPlayerReady,
                'onStateChange': s.onPlayerStateChange
            }
        });

    }

    s.onPlayerReady = function(event){
    	$(event.target.getIframe()).addClass('embed-responsive-item');
        event.target.playVideo();
    	s.events.onPlayerReady(event);
    };

    s.onPlayerStateChange = function(event){
    	s.events.onPlayerStateChange(event);
        s.videoPlayerState = event.data;
    };


    s.playVideo = function() {
        if(s.player)
            s.player.playVideo();
    }

    s.stopVideo = function() {
        if(s.player)
            s.player.stopVideo();
    }

    s.pauseVideo = function() {
        if(s.player)
            s.player.pauseVideo();
    }
}