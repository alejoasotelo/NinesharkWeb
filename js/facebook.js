var FBManager = function(app_id, app_secret){

	var s = this;

	s.FB_app_id = app_id;
	s.FB_app_secret = app_secret;
	s.FB_access_token = '';

	s.cb_onload = function(){};

	s.getFBToken = function(app_id, app_secret, callback){
		$.get('https://graph.facebook.com/oauth/access_token?grant_type=client_credentials&client_id='+app_id+'&client_secret='+app_secret, callback);
	}

	s.load = function(cb){

		s.cb_onload = cb;

		$.getScript('//connect.facebook.net/es_LA/sdk.js', function(){
            FB.init({
              appId: s.FB_app_id,
              version: 'v2.3' // or v2.0, v2.1, v2.0
          });
            //FB.getLoginStatus(updateStatusCallback);
        });
	}

    window.fbAsyncInit = function(){
        s.getFBToken(s.FB_app_id, s.FB_app_secret, function(access_token){
            s.FB_access_token = access_token.replace('access_token=','');
            s.cb_onload(s.FB_access_token);
        });
    }
}