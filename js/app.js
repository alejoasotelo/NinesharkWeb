//<![CDATA[
$(window).load(function(){

    // Last FM
    var api_key = '8644433e4336ea22d26e66dc0510ce2d';
    var $header = $('#header');
    var $mainbody = $('#mainbody');
    var $footer = $('#footer');
    var $r = $('#results');
    var $playQueue = $('#playQueue');
    var $busy = $('#busy');
    var $txtQuery = $('#txtQuery');
    var $selectType = $('#selectType');
    var $btnQuery = $('#btnQuery');
    var $noResults = $('#noResults');
    var player;
    var videoplayerState = 0;
    var $active = null;
    var $play = $('#controls .play');
    var $prev = $('#controls .prev');
    var $next = $('#controls .next');
    var $redesSociales = $('#redesSociales');
    var $wikipedia = $('#wikipedia');

    function search(query, type, callback) {

        query = query.trim();
        if (query.length <= 0) return;

        $.get('http://ws.audioscrobbler.com/2.0/?method=' + type + '.search&' + type + '=' + query + '&api_key=' + api_key + '&format=json', function (data) {


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
                    });
                }
                else if(typeof(data.results.albummatches) != 'undefined')
                {
                    console.log(data.results.albummatches);
                    data.results.albummatches.image1 = function () {
                        return this.image && this.image.length > 2 ? this.image[1]["#text"] : '';
                    };
                    data.results.albummatches.json = function(){return JSON.stringify(this);};

                    $.get($('#tpl-album-list').attr('src'), function(template){
                        rendered = Mustache.render(template, data.results.trackmatches);

                        $r.html(rendered);

                        if (typeof (callback) == 'function')
                            callback(data, data.results['opensearch:totalResults']);
                    });
                }
            }

        });

    }

    function addSongToPlayer($song){
        var data = $song.data('json');
        data.image1 = function () {
            return this.image && this.image.length > 2 ? this.image[1]["#text"] : '';
        };
        data.artistIsObject = function(){
            console.log(this);
            return typeof(this.artist) =='object';
        };
        $.get($('#tpl-track-item-player').attr('src'), function(template){

            var rendered = Mustache.render(template, data);

            $playQueue.append(rendered);

            bindPlayerItem(data.mbid);
        });
    }

    function getTracksByAlbums($album, callback){

        console.log('getTracksByAlbums');

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

                getVideo($(this).find('h2').text(), $(this).find('h3').text(), function(result){
                    if(player && result.items.length > 0){
                        var videoId = result.items[0].id.videoId;
                        player.loadVideoById(videoId, 0, 'large');

                        getArtistInfoByMbid($active.data('player-mbid'), function(data){

                            data = JSON.parse(data);

                            var url_facebook = '', url_twitter = '', url_wikipedia = '';

                            if(typeof(data.error) == 'undefined')
                            {
                                // Busco el link de wikipedia.
                                for(var i=0; i < data.relations.length; i++)
                                {
                                    var relation = data.relations[i];

                                    if(relation.type == 'wikipedia'){
                                        url_wikipedia = relation.url.resource
                                    }
                                    else if(relation.type == 'social network'){
                                        if(relation.url.resource.indexOf('facebook') > 0){
                                            url_facebook = relation.url.resource;
                                        }
                                        else if(relation.url.resource.indexOf('facebook') > 0){
                                            url_twitter = relation.url.resource;
                                        }
                                    }
                                }

                                getWikipediaContentByUrl(url_wikipedia, function(content){
                                    $wikipedia.html("<h2>"+title+"</h2><p>"+content+"</p>");
                                });

                                console.log(url_wikipedia);
                                console.log(url_facebook);
                                console.log(url_twitter);
                            }
                        });
    }
    });
    }
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
                $r.removeClass('hidden');
                $noResults.removeClass('hidden');
                $busy.addClass('hidden');
            });
        });


    }

    $btnQuery.click(function () {
        $r.addClass('hidden');
        $noResults.addClass('hidden');
        $busy.removeClass('hidden');

        search($txtQuery.val(), $selectType.val(), function (data, n) {
            $busy.addClass('hidden');
            if (n == 0){
                $noResults.removeClass('hidden');
            }
            else{
                bindListItems();
                $r.removeClass('hidden');
            }
        });

    });
    $txtQuery.keypress(function (e) {

        if (e.keyCode == 13) {
            $r.addClass('hidden');
            $noResults.addClass('hidden');
            $busy.removeClass('hidden');

            search($txtQuery.val(), $selectType.val(), function (data, n) {
                $busy.addClass('hidden');
                if (n == 0){
                    $noResults.removeClass('hidden');
                }
                else{
                    bindListItems();
                    $r.removeClass('hidden');
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
                console.log(response.result);
                if(typeof(callback) == 'function')
                    callback(response.result);
            });
        }

    }

    function getArtistInfoByMbid(mbid, callback)
    {
        console.log("getArtistInfoByMbid: "+mbid);
        var url = 'http://www.musicbrainz.org/ws/2/artist/'+mbid+'?inc=url-rels&fmt=json';
        $.get(url, function(r){

            console.log(r);
            callback(r);
        });
    }

    function getWikipediaContentByUrl(url, callback){

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

    console.log('GAPI: ' + typeof(gapi));
    console.log('GAPI.client: ' + typeof(gapi.client));


    gapi.client.setApiKey('AIzaSyB1OJS5M3c5PIbKiXPubHwdsiUoFmy-zOs');

    gapi.client.load('youtube', 'v3', function (){
        var tag = document.createElement('script');
        tag.src = "https://www.youtube.com/iframe_api?onload=onYouTubeIframeAPIReady";
        var firstScriptTag = document.getElementsByTagName('script')[0];
        firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

    });

    // 3. This function creates an <iframe> (and YouTube player)
    //    after the API code downloads.
    window.onYouTubeIframeAPIReady = function() {
        $mainbody.removeClass('hidden');
        $header.removeClass('hidden');
        $footer.removeClass('hidden');

        player = new YT.Player('videoplayer', {
            height: '390',
            width: '640',
            suggestedQuality: '',
            //videoId: 'M7lc1UVf-VE',
            events: {
                'onReady': onPlayerReady,
                'onStateChange': onPlayerStateChange
            }
        });
    }

    // 4. The API will call this function when the video player is ready.
    function onPlayerReady(event) {
        event.target.playVideo();
    }

    function onPlayerStateChange(event) {
        if(event.data == YT.PlayerState.ENDED){
            nextTrack();
        }
        else if(event.data == YT.PlayerState.PLAYING){
            $play.removeClass('glyphicon-play').addClass('glyphicon-pause');
        }
        else{
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
