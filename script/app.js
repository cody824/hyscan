(function(window){

    window.isLoad = false;

    window.loadAppConfig = function(){
        var __appConfig = $api.getStorage('appConfig');
        if (!__appConfig){
          __appConfig = {};
          __appConfig.device = null;
          __appConfig.user = null;
          __appConfig.task = [];
          $api.setStorage('appConfig', __appConfig);
        }
        window.appConfig = __appConfig;
        window.isLoad = true;
    }

    window.saveAppConfig = function(config){
        appConfig = config || appConfig;
        $api.setStorage('appConfig', appConfig);
    }

    window.login = function(userName, password, callback){
        var ret = {}, err = {};
        ret.status = true;
        if (userName.length <= 0 || userName.length > 16) {
            err.msg = "用户名长度在0-16之间";
            ret.status = false;
        }  else {
            appConfig.isLogin = true;
            appConfig.loginName = userName;
            saveAppConfig();
        }
        if (typeof callback == "function") {
            callback(ret, err);
        }
    }

    window.logout = function(callback){
        var ret = {}, err = {};
        appConfig.isLogin = false;
        appConfig.loginName = null;
        saveAppConfig();
        if (typeof callback == "function") {
            callback(ret, err);
        }
    }
    if (!isLoad)loadAppConfig();
})(window);
