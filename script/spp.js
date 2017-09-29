(function(window){
  var __bluetooth ;

  window.bleInit = function(callback) {
    window.SPP = api.require("btsppiot");
    SPP.INIT({
        //isToast:true
    },function(ret, err){
        var status = ret.status;
        if(status == 1)api.toast({ msg: "本机没有蓝牙设备"});
        if(status == 2)api.toast({ msg: "本机蓝牙没有开启"});

        __bluetooth = __bleUtil.loadConfig();

        __bluetooth.state = ret.state;
        __bluetooth.show = __bluetooth.show || {};
        if (typeof callback === "function"){
            window.bluetooth = __bluetooth;
            callback(__bluetooth);
        }
    });

    SPP.autoConnect();
  }

  /**
   * 扫描设备
   * @param autoStop 自动停止扫描时间 单位second
   */
  window.scanDevice = function(autoStop, foundFunc){
      SPP.scan({
          isDialog:false,
          //isToast:false
      },function(ret, err){
          console.log(JSON.stringify(ret));
          var status = ret.status;
        if(status == 1)api.toast({ msg: "本机没有蓝牙设备"});
        if(status == 2)api.toast({ msg: "本机蓝牙没有开启"});
        var bondState = ret.bondState;
        if(bondState == 1)api.toast({ msg: "取消配对"});
        if(bondState == 2)api.toast({ msg: "已经配对"});
        if(bondState == 3)api.toast({ msg: "正在配对"});
        var scanState = ret.scanState;
        if(scanState == 1)api.toast({ msg: "扫描开始"});
        if(scanState == 2)api.toast({ msg: "扫描完成"});
        if(scanState == 3)api.toast({ msg: "发现设备"});
        if(scanState == 4)api.toast({ msg: "配对改变"});
        var scanArray = ret.scanArray;
        if (scanArray){
          var deviceStrArray = scanArray.split(',');
         for(var i in deviceStrArray){
             var dev = {};
             var deviceStr = deviceStrArray[i];
             if (deviceStr.indexOf('[') == 0)
               deviceStr = deviceStr.substring(1);
             if (deviceStr.indexOf(']') == deviceStr.length - 1)
               deviceStr = deviceStr.substring(0, deviceStr.length - 1);
             var infoArray = deviceStr.split('\n');
             console.log("name:" + infoArray[0]);
             console.log("uuid:" + infoArray[1]);
             dev.uuid = infoArray[1];
             dev.name = infoArray[0];
             if (typeof foundFunc == "function")
               foundFunc(dev);
             }
        }

         if(scanArray.length != 0)
        console.log(scanArray);
      });
  }


  var devicesListener = null;

  /**
   *更新扫描设备
   *@param foundFunc 发现新设备的回调
   */
  function updateDevices(foundFunc){
      var newDevices = {};
     devicesListener = setInterval(function () {
        ble.getPeripheral(function(ret) {
          if (ret && ret.peripherals) {
              var i;
              for(i = 0; i < ret.peripherals.length; i++){
                var dev = ret.peripherals[i];
                if (!newDevices[dev.uuid]){
                    console.log("发现新设备：" + dev.uuid);
                    newDevices[dev.uuid] = dev;
                    if (typeof foundFunc == "function")
                      foundFunc(dev);
                }
              }
          }
        });
      }, 1000);
  }

  /**
   *停止扫描设备
   */
  window.stopScanDevice = function () {
      console.log("停止扫描蓝牙设备");
    //  SPP.paired();
  }

  /**
   * 断开连接
   * @param uuid 设备uuid
   * @param callback 回调
   */
  function disconnectDevice(uuid, callback) {
      ble.disconnect({
          peripheralUUID: uuid
      }, function(ret, err) {
          console.log(JSON.stringify(err));
          if (ret.status) {
              api.toast({
                  msg: '断开连接成功',
                  duration: 2000,
                  location: 'top'
              });
              bluetooth.device = null;
              bleUtil.saveConfig(bluetooth);
          }
          if (typeof callback === "function"){
              callback(ret);
          }
      });
  }

  /**
   *连接设备
   */
  window.connectDevice = function(uuid){
    SPP.connect({
      sppMac:uuid
    }, function(ret, err){
        console.log(JSON.stringify(ret));
    });
    SPP.autoConnect();
  }

  window.sendData = function(data, callback){
      SPP.send({
        sendData:"55CC090010013B0000"
      });
  }


  var __bleUtil = {};

  __bleUtil.loadConfig = function(){
      var bluet = $api.getStorage('bluetooth');
      if (bluet == null) {
          bluet = {};
          bluet.show = {};
      }
      return bluet;
  }

  __bleUtil.saveConfig = function(bluet){
      $api.setStorage('bluetooth', bluet);
  }
  window.bleUtil = __bleUtil;

})(window);
