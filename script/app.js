(function(window) {

    window.isDev = true;

    var __config = {};

    //辐亮度定标参数
    __config.radianceParams = {
        "0105": [5, 2]
    }

    //光谱范围
    __config.spectralRange = {
        "0105": [648, 1012]
    }

    __config.serverUrl = "http://192.168.125.120:9090/";

    __config.login = {
        qq : false,
        wechat : false,
        weibo : true
    }

    window.globalConfig = __config;

    window.isLoad = false;

    window.loadAppConfig = function() {
        var __appConfig = $api.getStorage('appConfig');
        if (!__appConfig) {
            __appConfig = {};
            __appConfig.device = null;
            __appConfig.user = null;
            __appConfig.task = [];
            // $api.setStorage('appConfig', __appConfig);
        }
        __appConfig.globalConfig = __appConfig.globalConfig || {};
        __appConfig.globalConfig.collectNum = __appConfig.globalConfig.collectNum || 1;
        if (__appConfig.device && __appConfig.device.model) {
            var radiances = window.globalConfig.radianceParams[__appConfig.device.model];
            if (radiances && radiances.length == 2) {
                __appConfig.device.radianceA = radiances[0];
                __appConfig.device.radianceB = radiances[1];
            } else {
                console.log(__appConfig.device.model + "辐亮度配置不存在或者配置错误");
            }
            var spectralRange = window.globalConfig.spectralRange[__appConfig.device.model];
            if (spectralRange) {
                __appConfig.device.spectralRange = spectralRange;
            } else {
                console.log(__appConfig.device.model + "光谱坐标范围配置不存在");
            }
        }
        window.appConfig = __appConfig;
        window.isLoad = true;
        if (appConfig.globalConfig.serverIp && isDev)
            globalConfig.serverUrl = "http://" + appConfig.globalConfig.serverIp + ":9090/"
    }

    window.saveAppConfig = function(config) {
        appConfig = config || appConfig;
        $api.setStorage('appConfig', appConfig);
    }

    window.login = function(userName, password, callback) {
        var ret = {},
            err = {};
        ret.status = true;
        if (userName.length <= 0 || userName.length > 16) {
            err.msg = "用户名长度在0-16之间";
            ret.status = false;
            if (typeof callback == "function") {
                callback(ret, err);
            }
        } else {
            api.showProgress({
                title: '登录中...',
                text: '请稍后...',
                modal: true
            });
            api.ajax({
                url: globalConfig.serverUrl + "security/auth/getToken",
                method: 'post',
                headers : {
                    "Content-Type" : 'application/json'
                },
                data: {
                    body : {
                        username : userName,
                        password : password
                    }
                }
            },function(ret, err){
                if (ret) {
                    appConfig.token = ret.token;
                    getUserDetails(ret.token, function(ud, err){
                        api.hideProgress();
                        if (ud) {
                            appConfig.isLogin = true;
                            appConfig.loginName = ud.fullName;
                            appConfig.user = ud;
                            saveAppConfig();
                            if (typeof callback == "function") {
                                ud.status = true;
                                callback(ud);
                            }
                        }  else {
                            console.log(JSON.stringify(err));
                            if (typeof callback == "function") {
                                callback(ret, err);
                            }
                        }

                    })
                } else {
                    console.log(JSON.stringify(err));
                    if (typeof callback == "function") {
                        err.msg = "用户名或者密码错误";
                        callback(ret, err);
                    }
                    api.hideProgress();
                }
            });
        }
    }

    window.tpaLogin = function(type, userInfo, callback){
        console.log(JSON.stringify(userInfo));
        api.showProgress({
            title: '登录中...',
            text: '请稍后...',
            modal: true
        });
        api.ajax({
            url: globalConfig.serverUrl + "security/auth/getToken/" + type,
            method: 'post',
            headers : {
                "Content-Type" : 'application/json'
            },
            data: {
                body : userInfo
            }
        },function(ret, err){
            if (ret) {
                appConfig.token = ret.token;
                getUserDetails(ret.token, function(ud, err){
                    api.hideProgress();
                    if (ud) {
                        appConfig.isLogin = true;
                        appConfig.loginName = ud.fullName;
                        appConfig.user = ud;
                        saveAppConfig();
                        if (typeof callback == "function") {
                            ud.status = true;
                            callback(ud);
                        }
                    }  else {
                        console.log(JSON.stringify(err));
                        if (typeof callback == "function") {
                            callback(ret, err);
                        }
                    }

                })
            } else {
                console.log(JSON.stringify(err));
                if (typeof callback == "function") {
                    callback(ret, err);
                }
                api.hideProgress();
            }
        });
    }

    window.getUserDetails = function(token, callback){
        api.ajax({
            url: globalConfig.serverUrl + "security/ud/loginInfo",
            method: 'get',
            headers : {
                hytoken : 'hyscan' + token,
                Accept : 'application/json'
            }
        },function(ret, err){
            callback(ret, err)
        });

    }

    window.logout = function(callback) {
        var ret = {},
            err = {};
        appConfig.isLogin = false;
        appConfig.loginName = null;
        appConfig.user = null;
        appConfig.token = null;
        saveAppConfig();
        if (typeof callback == "function") {
            callback(ret, err);
        }
        api.ajax({
            url: globalConfig.serverUrl + "security/auth/getToken",
            method: 'delete',
            headers : {
                Accept : 'application/json'
            }
        },function(ret, err){
            //callback(ret, err)
        });
    }
    if (!isLoad) loadAppConfig();
})(window);
