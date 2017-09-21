(function(window){

    window.stDevice = {

          isDeviceOk : function(callback) {
              if (!isLoad){
                  loadAppConfig();
              }
              var ret = {};
              ret.status = false;
              if (appConfig.device) {
                    ret.status = true;
                    ret.device = appConfig.device;
              }
              if (typeof callback === "function"){
                  callback(ret);
              }
          },

          addDevice : function(device){
                if (!isLoad){
                    loadAppConfig();
                }
                window.appConfig.device = device;
                saveAppConfig();
          },

          removeDevice : function(){
              if (!isLoad){
                  loadAppConfig();
              }
              window.appConfig.device = null;
              saveAppConfig();
          }
    }

})(window);
