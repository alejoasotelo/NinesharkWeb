
console.log('musicbrainz');

searchArtist = function (query, callback) {

    query = encodeURIComponent(query).replace(/([.*+?^=!:${}()|\[\]\/\\])/g, "\\$1");

    console.log('searchArtist: ' + query + '...');
    $.ajax({
        type: 'GET',
        url: 'http://www.musicbrainz.org/ws/2/artist/?fmt=json&query=artist:' + query + '&limit=1',
        success: function (body) {

            console.log(body);

            callback(body, JSON.stringify(body));
        }

    }).fail(function(){
        callback(null, null);
    });

}

getArtistInfo = function (id, callback) {

    console.log('getArtistInfo: ' + id + '...');
    $.ajax({
        type: 'GET',
        url: 'http://musicbrainz.org/ws/2/artist/' + id + '?inc=url-rels&fmt=json',
        success: function (body) {
            callback(body, JSON.stringify(body));
        }
    }).fail(function(){
        callback(null, null);
    });
}

getArtist = function (query, callback) {
    console.log('getArtist');

    var s = this;

    s.artista = {
        id: '',
        name: '',
        type: '',
        external_links: []
    };

    searchArtist(query, function (r, body)
    {
        if (body != null)
        {
            if (r.artists.length == 0)
                return callback(null, 'Artist null');

            s.artista.id = r.artists[0].id;
            s.artista.name = r.artists[0].name;

            getArtistInfo(s.artista.id, function (r2, body2) {
                if (body2 != null)
                {
                    s.artista.type = r2.type;
                    var l = r2.relations.length;

                    s.artista.external_links = {};

                    for (var i = 0; i < l; i++)
                    {
                        if(r2.relations[i].type == 'social network')
                        {
                            if(r2.relations[i].url.resource.indexOf('facebook') > 0)
                                s.artista.external_links['facebook'] = r2.relations[i].url.resource;
                            else if(r2.relations[i].url.resource.indexOf('twitter') > 0)
                                s.artista.external_links['twitter'] = r2.relations[i].url.resource;
                        }
                        else
                            s.artista.external_links[r2.relations[i].type] = r2.relations[i].url.resource;

                        console.log(r2.relations[i].type);
                    }

                    if (s.artista != null)
                    {
                        /*if (s.artista.external_links['wikipedia'] != null) {

                            $.get(s.artista.external_links['wikipedia'], function (summary) {

                                s.artista.external_links['wikipedia'] = {
                                    url: s.artista.external_links['wikipedia'],
                                    content: summary
                                };

                                //http://es.wikipedia.org/w/api.php?action=parse&page=Los_Cafres&format=json&prop=text&section=0

                                callback(s.artista, JSON.stringify(s.artista));
                            });

                        }
                        else {*/
                            callback(s.artista, JSON.stringify(s.artista));
                        //}
                    }
                    else
                        callback(null, 'Artist null');
                }
                else {
                    console.log('error: ' + r2);
                    callback(null, r2);
                }
            });
}
});
}
