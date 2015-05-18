var LastFM = function(API_KEY){

	var s = this;

	var api_key = API_KEY;

	s.search = function(query, type, callback) {

		if(query.trim)
			query = query.trim();

		if (query.length <= 0){
			callback(false);
			return;
		}

		$.get('http://ws.audioscrobbler.com/2.0/?method=' + type + '.search&' + type + '=' + query + '&api_key=' + api_key + '&format=json', callback);
	}

	s.getAlbumInfo = function(artist, album, callback){

		if(artist.trim){
			artist = artist.trim();
			album = album.trim();
		}

		if(artist.length == 0 || album.length == 0){
			callback(false);
			return;
		}

		var url = 'http://ws.audioscrobbler.com/2.0/?method=album.getinfo&api_key='+api_key+'&format=json';

		url += '&artist='+artist+'&album='+name;

		$.get(url, callback);
	}


	s.getArtistInfo = function(name, callback)
	{
		if(name.trim)
			name = name.trim();

		if (name.length == 0){
			callback(false);
			return false;
		}

		var url = 'http://ws.audioscrobbler.com/2.0/?method=artist.getinfo&artist='+name+'&lang=es&api_key='+api_key+'&format=json';

		$.get(url, callback);
	}

}