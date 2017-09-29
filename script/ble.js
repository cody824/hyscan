(function(window){
  var __bluetooth ;

  window.bleInit = function(callback) {
      window.ble = api.require('spp');
      __bluetooth = __bleUtil.loadConfig();

      ble.initManager(function(ret) {
        console.log(JSON.stringify(ret));
          __bluetooth.state = ret.state;
          __bluetooth.show = __bluetooth.show || {};
          switch (ret.state) {
            case 'poweredOn':
              __bluetooth.show.state = "设备已开启";
              break;
            case 'poweredOff':
              __bluetooth.show.state = "设备已关闭";
              break;
            case 'resetting':
              __bluetooth.show.state = "正在重置";
              break;
            case 'unauthorized':
              __bluetooth.show.state = "设备未授权";
              break;
            case 'unknown':
              __bluetooth.show.state = "初始化中";
              break;
            case 'unsupported':
              __bluetooth.show.state = "状态不支持";
              break;
            default:
             break;
          }
          if (typeof callback === "function"){
              window.bluetooth = __bluetooth;
              callback(__bluetooth);
          }
      });
  }

  /**
   * 扫描设备
   * @param autoStop 自动停止扫描时间 单位second
   */
  window.scanDevice = function(autoStop, foundFunc){
    ble.isScanning(function(ret) {
        if (!ret.status) {
            ble.scan({
            }, function(ret, err) {
                if (ret.status) {
                    console.log('开始扫描');
                    api.toast({
                        msg: '开始扫描',
                        duration: 2000,
                        location: 'top'
                    });
                    updateDevices(foundFunc);
                }
            });
        } else {
            console.log('已经在扫描');
        }
    });
    if (autoStop > 0)
        setTimeout(stopScanDevice, 1000 * stop);
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
          console.log(JSON.stringify(ret));
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
      ble.stopScan();
      if (devicesListener != null) {
        clearInterval(devicesListener);
        devicesListener = null;
      }
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
    ble.isConnected({
      peripheralUUID: uuid
    }, function(ret) {
        console.log(JSON.stringify(ret));
        if (ret.status) {
            api.toast({
                msg: '已经连接',
                duration: 2000,
                location: 'top'
            });
        } else {
          disconnectDevice(uuid, function(){
            console.log("连接设备：" + uuid);
            api.showProgress({
               animationType: 'fade',
               title: '',
               text: '连接中……',
               modal: false
             });
            ble.connect({
              peripheralUUID: uuid
            }, function(ret, err) {
              api.hideProgress();
                if (ret.status) {
                    api.toast({
                        msg: '连接成功',
                        duration: 1000,
                        location: 'middle'
                    });
                    bluetooth.device = bluetooth.devices[uuid];
                    bleUtil.saveConfig(bluetooth);
                    stopScanDevice();
                } else {
                    var msg;
                    console.log(JSON.stringify(err));
                    switch (err.code) {
                      case 1:
                        msg = "uuid为空";
                        break;
                      case 2:
                        msg = "未搜索到该蓝牙设备，请重新扫描";
                        break;
                      case 3:
                        msg = "该设备已经连接";
                        break;
                      default:
                         msg = "未知错误，请重试";
                    }
                    api.alert({msg: msg});
                }
            });
          });
        }
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
