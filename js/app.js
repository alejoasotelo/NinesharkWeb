//<![CDATA[
$(window).load(function(){

    jQuery.ajaxSetup({async:true});

    // Last FM
    var api_key = '8644433e4336ea22d26e66dc0510ce2d';
    var lastFM = new LastFM(api_key);
    var $header = $('#header');
    var $mainbody = $('#mainbody');
    var $footer = $('#footer');
    var $sidebarLeft = $('#sidebarLeft');
    var $r = $('#results');
    var $playQueue = $('#playQueue');
    var $busy = $('#busy');
    var $txtQuery = $('#txtQuery');
    var $selectType = $('#selectType');
    var $btnQuery = $('#btnQuery');
    var $noResults = $('#noResults');
    var player;
    var $progressBar = $('#progressBar');
    var $progressTrack = $('#progressTrack');
    var $durationTrack = $('#durationTrack');
    var videoplayerState = 0;
    var $active = null;
    var $play = $('#controls .play');
    var $prev = $('#controls .prev');
    var $next = $('#controls .next');
    var $redesSociales = $('#redesSociales');
    var $wikipedia = $('#wikipedia');

    var FB_app_id = '468368906586776';
    var FB_app_secret = '0b38496b85ee23fcf80ac17d6deadad9';
    var FB_access_token = '';

    function search(query, type, callback) {

        query = query.trim();
        if (query.length <= 0){
          return;
      }

      console.log('http://ws.audioscrobbler.com/2.0/?method=' + type + '.search&' + type + '=' + query + '&api_key=' + api_key + '&format=json');

      $.get('http://ws.audioscrobbler.com/2.0/?method=' + type + '.search&' + type + '=' + query + '&api_key=' + api_key + '&format=json',
        function (data)
        {
            if (data.results['opensearch:totalResults'] > 0) {

                var rendered;

                if(typeof(data.results.trackmatches) !='undefined')
                {
                    data.results.trackmatches.image1 = function () {
                        return this.image && this.image.length > 2 ? this.image[1]["#text"] : '';
                    };
                    data.results.trackmatches.json = function(){return JSON.stringify(this);};

                    $.get($('#tpl-track-list').attr('src'), function(template){
                        rendered = Mustache.render(template, data.results.trackmatches);

                        $r.html(rendered);

                        if (typeof (callback) == 'function')
                            callback(data, data.results['opensearch:totalResults']);

                    })/*.fail(function(r){

                        if (typeof (callback) == 'function')
                            callback(null);
                    });*/
                }
                else if(typeof(data.results.albummatches) != 'undefined')
                {

                    data.results.albummatches.image1 = function () {
                        return this.image && this.image.length > 2 ? this.image[2]["#text"] : '';
                    };
                    data.results.albummatches.json = function(){return JSON.stringify(this);};

                    $.get($('#tpl-album-list').attr('src'), function(template){

                        rendered = Mustache.render(template, data.results.albummatches);

                        $r.html(rendered);

                        if (typeof (callback) == 'function')
                            callback(data, data.results['opensearch:totalResults']);

                    })/*.fail(function(r){

                        if (typeof (callback) == 'function')
                            callback(null);
                    });*/
                }
            }

        });

}

function addSongToPlayer($song)
{
    var data = $song.data('json');
    data.image1 = function () {
        return this.image && this.image.length > 2 ? this.image[1]["#text"] : '';
    };
    data.artistIsObject = function(){
        return typeof(this.artist) =='object';
    };
    $.get($('#tpl-track-item-player').attr('src'), function(template){

        var rendered = Mustache.render(template, data);

        $playQueue.append(rendered);

        bindPlayerItem(data.mbid);
    });
}

function addAllSongsToPlayer($songs)
{
    for(var i=0; i < $songs.length; i++)
        addSongToPlayer($($songs[i]));
}

function getTracksByAlbums($album, callback){

    var data = $album.data('json');

    var url = 'http://ws.audioscrobbler.com/2.0/?method=album.getinfo&api_key=8644433e4336ea22d26e66dc0510ce2d&format=json';

    if(data.mbid.length>0)
        url += '&mbid='+data.mbid;
    else
        url += '&artist='+data.artist+'&album='+data.name;

    $.get(url, function(data){

        data = data.album;
        var image =data.image;

        data.image2 = function () {return this.image && this.image.length > 3 ? this.image[3]["#text"] : '';};

        data.image1 = function () {return this.image && this.image.length > 2 ? this.image[1]["#text"] : '';};
        data.json = function(){
            this.image = image;
            return JSON.stringify(this);
        };
        $.get($('#tpl-album-tracks-list').attr('src'), function(template){

            var rendered = Mustache.render(template, data);

            $r.html(rendered);

            bindListItems();

            if(typeof(callback) == 'function')
                callback(data);

        });
    });
}

function bindPlayerItem(id){
    $('.list-item[data-player-mbid="'+id+'"]').click(function(){
        $active = $(this);

        if($(this).hasClass('active'))
        {
            if(videoplayerState == YT.PlayerState.PAUSED)
                playVideo();
            else
                pauseVideo();
        }
        else
        {
            stopVideo();

            $('.list-item.active').removeClass('active');
            $(this).addClass('active');

            getVideo($(this).find('h2').text(), $(this).find('h3').text(),
                function(result){
                    if(player && result.items.length > 0)
                    {
                        var videoId = result.items[0].id.videoId;
                        player.loadVideoById(videoId, 0, 'large');

                        getArtistInfoByName($active.find('h3').text(), function(data){
                            if(typeof(data.artist.bio.summary) != 'undefined'){

                                var html = '';

                                if(typeof(data.artist.image) != 'undefined'){
                                    if(data.artist.image.length > 4)
                                        html += '<p><img src="'+data.artist.image[4]['#text']+'" class="img-responsive"/></p>';
                                }

                                html += '<p>'+data.artist.bio.summary+'</p>';

                                $wikipedia.html(html);
                                $wikipedia.find('a').attr('target','_blank');
                            }
                        });

                    //getArtistInfoByMbid($active.data('player-mbid'), function(data){
                        getArtistSocialInfoByName($active.find('h3').text(), function(data){

                            if(data == null){
                                return;
                            }

                            var url_facebook = data.external_links['facebook'];
                            var url_twitter = data.external_links['twitter'];
                            var url_wikipedia = data.external_links['wikipedia'];

                            $redesSociales.text('');

                            if(url_facebook.length > 0){
                                var tmp = url_facebook.split('/');
                                FB.api('/'+tmp[tmp.length-1]+'/feed', {access_token: FB_access_token}, function(r){

                                    if(r.data.length > 0){
                                        for(var i=0; i < r.data.length; i++)
                                        {
                                            var post = r.data[i];

                                            if(typeof(post.message) != 'undefined' && post.message.length > 0)
                                                $redesSociales.append('<hr><p>'+post.message+'<p>');
                                        }
                                    }
                                    $redesSociales
                                });
                            }


                            //getWikipediaContentByUrl(url_wikipedia, function(content){
                            //    $wikipedia.html("<h2>"+title+"</h2><p>"+content+"</p>");
                            //});
                        });
                    }
                });
            }
        });

    $('.list-item[data-player-mbid="'+id+'"] .remove').click(function(){
        $(this).parent().parent().parent().remove();
    });
}

function bindListItems(){

    var $track = $('.list-item.track');

    $track.click(function(){
        var $o = $(this);
        addSongToPlayer($o);
    });

    var $album = $('.list-item.album');

    $album.click(function(){
        $r.addClass('hidden');
        $noResults.addClass('hidden');
        $busy.removeClass('hidden');
        getTracksByAlbums($(this), function(r){
            $busy.addClass('hidden');

            if(r.tracks.track.length == 0)
                $noResults.removeClass('hidden');
            else
                $r.removeClass('hidden');
        });
    });

    var $btnAddAll = $('.list-item.addAll');
    $btnAddAll.click(function(){
        addAllSongsToPlayer($track);
    })


}

$btnQuery.click(function () {
    $r.addClass('hidden');
    $noResults.addClass('hidden');
    $busy.removeClass('hidden');

    lastFM.search($txtQuery.val(), $selectType.val(), function (data) {
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

                $.get($('#tpl-track-list').attr('src'), function(template){
                    rendered = Mustache.render(template, data.results.trackmatches);

                    $r.html(rendered);

                    n = data.results['opensearch:totalResults'];

                    if (n == 0){
                        $noResults.removeClass('hidden');
                    }
                    else{
                        bindListItems();
                        $r.removeClass('hidden');
                    }

                }).fail(function(r){
                        $noResults.removeClass('hidden');
                    });
                }
            else if(typeof(data.results.albummatches) != 'undefined')
            {
                data.results.albummatches.image1 = function () {
                    return this.image && this.image.length > 2 ? this.image[2]["#text"] : '';
                };
                data.results.albummatches.json = function(){return JSON.stringify(this);};

                $.get($('#tpl-album-list').attr('src'), function(template){

                    rendered = Mustache.render(template, data.results.albummatches);

                    $r.html(rendered);

                    n = data.results['opensearch:totalResults'];

                    if (n == 0){
                        $noResults.removeClass('hidden');
                    }
                    else{
                        bindListItems();
                        $r.removeClass('hidden');
                    }

                }).fail(function(r){
                        $noResults.removeClass('hidden');
                });
            }
        }
    });
});

$txtQuery.keypress(function (e) {

    if (e.keyCode == 13)
    {
        $r.addClass('hidden');
        $noResults.addClass('hidden');
        $busy.removeClass('hidden');

        lastFM.search($txtQuery.val(), $selectType.val(), function (data) {
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

                    $.get($('#tpl-track-list').attr('src'), function(template){
                        rendered = Mustache.render(template, data.results.trackmatches);

                        $r.html(rendered);

                        n = data.results['opensearch:totalResults'];

                        if (n == 0){
                            $noResults.removeClass('hidden');
                        }
                        else{
                            bindListItems();
                            $r.removeClass('hidden');
                        }

                    }).fail(function(r){
                            $noResults.removeClass('hidden');
                        });
                    }
                else if(typeof(data.results.albummatches) != 'undefined')
                {
                    data.results.albummatches.image1 = function () {
                        return this.image && this.image.length > 2 ? this.image[2]["#text"] : '';
                    };
                    data.results.albummatches.json = function(){return JSON.stringify(this);};

                    $.get($('#tpl-album-list').attr('src'), function(template){

                        rendered = Mustache.render(template, data.results.albummatches);

                        $r.html(rendered);

                        n = data.results['opensearch:totalResults'];

                        if (n == 0){
                            $noResults.removeClass('hidden');
                        }
                        else{
                            bindListItems();
                            $r.removeClass('hidden');
                        }

                    }).fail(function(r){
                            $noResults.removeClass('hidden');
                    });
                }
            }
        });
    }

});

function prevTrack(){
    if($active == null)
        $active = $('.list-item.active');
    $active = $active.prev();
    $active.click();
}

function nextTrack(){
    if($active == null)
        $active = $('.list-item.active');
    $active = $active.next();
    $active.click();
}

function getVideo(name, artist, callback){
        // Search for a specified string.

        if(typeof(gapi) != 'undefined'){
            var q = name + " - " + artist;
            var request = gapi.client.youtube.search.list({
                q: q,
                part: 'snippet'
            });
            request.execute(function(response) {
                var str = JSON.stringify(response.result);
                if(typeof(callback) == 'function')
                    callback(response.result);
            });
        }

    }

    function getArtistInfoByMbid(mbid, callback)
    {
        var url = 'http://www.musicbrainz.org/ws/2/artist/'+mbid+'?inc=url-rels&fmt=json';
        $.get(url, function(r){
            callback(r);
        }).fail(function() {
            callback(null);
        });
    }

    function getArtistSocialInfoByName(name, callback)
    {
        getArtist(name, function(json, data){
            callback(json);
        });
    }

    function getArtistInfoByName(name, callback)
    {
        if(name.trim)
            name = name.trim();

        var url = 'http://ws.audioscrobbler.com/2.0/?method=artist.getinfo&artist='+name+'&lang=es&api_key='+api_key+'&format=json';

        $.get(url, function(data){
            callback(data);
        });
    }

    window.getWikipediaContentByUrl = function (url, callback){

        if(url.length > 0){

            var parts = url.split("/");
            var title = parts[parts.length-1];

            $.get('https://en.wikipedia.org/w/api.php?format=json&action=query&prop=extracts&exintro=&explaintext=&titles='+title, function(data){

                var title, content = "";

                for(p in data.query.pages){
                    if(typeof(data.query.pages[p].extract) != 'undefined')
                        content = data.query.pages[p].extract;

                    if(typeof(data.query.pages[p].title) != 'undefined')
                        title = data.query.pages[p].title;

                    if(title.length > 0 && content.length > 0){
                        callback(title, content);
                        break;
                    }
                }


            });
        }
    }

    $mainbody.addClass('hidden');
    $header.addClass('hidden');
    $footer.addClass('hidden');
    $sidebarLeft.addClass('hidden');

    gapi.client.setApiKey('AIzaSyB1OJS5M3c5PIbKiXPubHwdsiUoFmy-zOs');

    gapi.client.load('youtube', 'v3', function (){
        var tag = document.createElement('script');
        tag.src = "http://www.youtube.com/iframe_api?onload=onYouTubeIframeAPIReady";
        var firstScriptTag = document.getElementsByTagName('script')[0];
        firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

    });

    // 3. This function creates an <iframe> (and YouTube player)
    //    after the API code downloads.
    window.onYouTubeIframeAPIReady = function() {

        $.get('templates/player.html', function(template){

            var rendered = Mustache.render(template, {});
            $sidebarLeft.html(rendered);

            $playQueue = $('#playQueue');
            $progressBar = $('#progressBar');
            $progressTrack = $('#progressTrack');
            $durationTrack = $('#durationTrack');
            $play = $('#controls .play');
            $prev = $('#controls .prev');
            $next = $('#controls .next');

            $mainbody.removeClass('hidden');
            $header.removeClass('hidden');
            $footer.removeClass('hidden');
            $sidebarLeft.removeClass('hidden');
        });

        player = new YT.Player('videoplayer', {
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
                'onReady': onPlayerReady,
                'onStateChange': onPlayerStateChange
            }
        });


        $.getScript('//connect.facebook.net/es_LA/sdk.js', function(){
            FB.init({
              appId: FB_app_id,
              version: 'v2.3' // or v2.0, v2.1, v2.0
          });
            //FB.getLoginStatus(updateStatusCallback);
        });
    }

    function getFBToken(app_id, app_secret, callback){
        $.get('https://graph.facebook.com/oauth/access_token?grant_type=client_credentials&client_id='+app_id+'&client_secret='+app_secret, callback);
    }

    window.fbAsyncInit = function(){
        getFBToken(FB_app_id, FB_app_secret, function(access_token){
            FB_access_token = access_token.replace('access_token=','');
        });
    }

    // 4. The API will call this function when the video player is ready.
    function onPlayerReady(event) {
        $(event.target.getIframe()).addClass('embed-responsive-item');
        event.target.playVideo();
    }

    var playerTimer = null;

    function onPlayerStateChange(event) {
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

        videoplayerState = event.data;
    }

    function playVideo() {
        if(player)
            player.playVideo();
    }

    function stopVideo() {
        if(player)
            player.stopVideo();
    }

    function pauseVideo() {
        if(player)
            player.pauseVideo();
    }

    $play.click(function(){
        if(videoplayerState == YT.PlayerState.PLAYING)
            pauseVideo();
        else
            playVideo();
    });

    $next.click(function(){nextTrack();});
    $prev.click(function(){prevTrack();});
});//]]>
