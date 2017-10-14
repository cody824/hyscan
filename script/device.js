(function(window) {

    window.stDevice = {
        /**
         *  ret
            {
              status://【0：设备OK， 1：需要更新设备信息 ，2：需要定标, -2:设备连接失败 -1：没有设备】
            }

         */
        isDeviceOk: function(callback) {
            callback = callback || function(ret) {
                console.log(JSON.stringify(ret));
            };
            if (!isLoad) {
                loadAppConfig();
            }
            var ret = {};
            ret.status = 0;
            if (appConfig.device) {
                ret.device = appConfig.device;
                sppUtil.connectDevice(appConfig.device.address, function(connectRet) {
                    if (connectRet.err) {
                        console.log(connectRet.err);
                        ret.status = -2;
                        ret.err = connectRet.err
                    } else {
                        if (!ret.device.model) {
                            ret.status = 1;
                        } else if (!ret.device.darkCurrent || !ret.device.whiteboardData) {
                            ret.status = 2;
                        }
                    }
                    callback(ret);
                });
            } else {
                ret.status = -1;
                callback(ret);
            }
        },

        readDeviceInfo : function(address, callback){
            hyCmd.receive(address,  {
                batteryInfo : function(data){
                  if (typeof callback == "function")
                    callback(data);
                },
                deviceInfo : function(data){
                  var model = data.substr(0, 4);
                  var serial = data.substr(4, 8);
                  var firmware = data.substr(12, 4);
                  if (appConfig.device) {
                      appConfig.device.model = model;
                      appConfig.device.serial = serial;
                      appConfig.device.firmware = firmware;
                      getDCRecord(address, function(ret){
                          if (ret.status && ret.dc && ret.dc.length == 2){
                              appConfig.device.darkCurrent = ret.dc[0];
                              appConfig.device.whiteboardData = ret.dc[1];
                          }
                          saveAppConfig();
                          loadAppConfig();//读取全局配置信息
                          hyCmd.batteryInfo(address);
                      });
                    }
                }
            });
            hyCmd.deviceInfo(address);
        }
    }

    function getDCRecord(address, callback){
        api.readFile({
            path: 'fs://dc/' + address
        }, function(ret, err){
            var funcRet = {};
            if( ret.status ){
                 var dc = JSON.parse(ret.data);
                 funcRet.status = true;
                 funcRet.dc = dc;
                 if (typeof callback == "function")
                    callback(funcRet);
            } else {
              funcRet.status = true;
              funcRet.err = err;
              if (typeof callback == "function")
                 callback(funcRet);
            }
        });

    }

    var __hyCmd = {

        collect: function(address, callback) {
            var spp = api.require("spp");
            spp.send({
                address: address,
                isHex: true,
                sendData: '55CC090010013B0000',
            }, function(ret) {
                if (typeof callback == "function") {
                    callback(ret);
                }
            })
        },

        collectOne: function(address, callback) {
          var spp = api.require("spp");
            spp.send({
                address: address,
                isHex: true,
                sendData: '55CC090010023C0000',
            }, function(ret) {
                if (typeof callback == "function") {
                    callback(ret);
                }
            })
        },

        stopCollect: function(address, callback) {
          var spp = api.require("spp");
            spp.send({
                address: address,
                isHex: true,
                sendData: '55CC090010003A0000',
            }, function(ret) {
                if (typeof callback == "function") {
                    callback(ret);
                }
            })
        },

        periodSetup: function(address, data,callback) {
          if (data > 255) data = 255;
          if (data < 1) data = 1;
          var period = data.toString(16);
          var base = 315//13B 55 + cc + 9 + 11;
          var crc = (base + data).toString(16);
          if (crc.length > 2){
              crc = crc.substring(crc.length - 2);
          }
          var sendData = "55CC090011" + period + crc + "0000";
          var spp = api.require("spp");
            spp.send({
                address: address,
                isHex: true,
                sendData: sendData.toUpperCase(),
            }, function(ret) {
                if (typeof callback == "function") {
                    callback(ret);
                }
            })
        },

        lightOn: function(address, callback) {
          var spp = api.require("spp");
            spp.send({
                address: address,
                isHex: true,
                sendData: '55CC090012114D0000',
            }, function(ret) {
                if (typeof callback == "function") {
                    callback(ret);
                }
            })
        },

        lightOff: function(address, callback) {
          var spp = api.require("spp");
            spp.send({
                address: address,
                isHex: true,
                sendData: '55CC090012104C0000',
            }, function(ret) {
                if (typeof callback == "function") {
                    callback(ret);
                }
            })
        },

        deviceInfo: function(address, callback) {
            spp = spp || api.require("spp");
            spp.send({
                address: address,
                isHex: true,
                sendData: '55CC090020004A0000',
            }, function(ret) {
                if (typeof callback == "function") {
                    callback(ret);
                }
            })
        },

        batteryInfo: function(address, callback) {
          var spp = api.require("spp");
            spp.send({
                address: address,
                isHex: true,
                sendData: '55CC090021004B0000',
            }, function(ret) {
                if (typeof callback == "function") {
                    callback(ret);
                }
            })
        }

    }

    __hyCmd.receive = function(address, handler) {
        var spp = api.require("spp");
        var remainData = "";
        spp.receive({
            address: address,
            isHex: true
        }, function(ret) {
            if (ret.data) {
                var data = remainData + ret.data.toLocaleUpperCase();
                var cmds = parseCmd(data);
                if (cmds.length == 2) {
                    cmdHandler(cmds[0], handler);
                    remainData = cmds[1];
                } else {
                    remainData = cmds[0];
                }
            } else {
                console.log(JSON.stringify(ret));
            }

        });
    }

    function parseCmd(data) {
        var cmds = [];
        var beginIndex = data.indexOf('55CC');
        if (beginIndex < 0) {
            cmds.push(data);
        } else {
            var lengthL = data.substr(beginIndex + 4, 2);
            var lengthH = data.substr(beginIndex + 6, 2);
            var dataLength = parseInt(lengthH + lengthL, 16);
            var beforeCmd = data.substring(0, data.indexOf('55CC') - 1);
            var afterCmd = data.substring(data.indexOf('55CC'));
            var leftStr = null;
            var cmd = null;
            if (afterCmd.length >= dataLength * 2) {
                cmd = afterCmd.substr(0, dataLength * 2);
                if(appConfig.sppDebug) {
                    console.log("cmd返回开始:" + cmd.substr(0, 8));
                    console.log("cmd返回长度:" + beginIndex + ":" + lengthH + ":" + lengthL + ":" + dataLength);
                    console.log("cmd返回结束:" + cmd.substr(cmd.length - 4));
                }
                var reg = /(^55CC)[0123456789ABCDEF]+(0000$)/i;
                leftStr = afterCmd.substr(dataLength * 2);
                if (reg.test(cmd)) {
                    cmds.push(cmd);
                    cmds.push(leftStr);
                } else {
                    console.log("=====cmd返回无效======");
                    cmds.push(leftStr);
                }
            } else {
                cmds.push(afterCmd);
            }
        }
        return cmds;
    }

    function cmdHandler(cmd, handler) {
        handler = handler || {};
        var remain = "";
        if (cmd.length < 18) {
            remain = cmd;
        } else if (cmd.indexOf('55CC') == 0 && cmd.substring(cmd.length - 4) == "0000") {
            var lengthL = cmd.substr(4, 2);
            var lengthH = cmd.substr(6, 2);
            var dataLength = parseInt(lengthH + lengthL, 16);
            var cmdType = null;
            var data = null;
            if (cmd.length != dataLength * 2) {
                console.log("数据长度不正确:记录长度[" + dataLength + "],实际长度[" + cmd.length + "]");
                remain = cmd;
            } else {
                cmdType = cmd.substr(8, 2);
                data = cmd.substr(10, cmd.length - 16);
                if (cmdType == "10") {
                    doWithCollect(data, handler.collect, handler.stopCollect);
                } else if (cmdType == "11") {
                    returnFormPeriodSetup(data, handler.periodSetup);
                } else if (cmdType == "12") {
                    returnLightSwitch(data, handler.lightSwitch);
                } else if (cmdType == "20") {
                    returnModelInfo(data, handler.deviceInfo);
                } else if (cmdType == "21") {
                    returnBatteryInfo(data, handler.batteryInfo);
                } else {
                    console.log("不支持的命令");
                }
            }
        } else {
            remain = cmd;
            console.log("无效的数据返回:" + cmd);
        }
        return remain;
    }

    function doWithCollect(data, handler, stopHandler) {
        handler = handler || function() {};
        stopHandler = stopHandler || function() {};
        if (data.length == 2) {
            stopHandler();
            return;
        }
        var range = appConfig.device.spectralRange;
        var labels = [],
            datas = [],
            hexData = [];
        var index = 0;
        for (var i = 0; i < data.length; i++) {
            var pos = i % 4;
            if (pos == 0) {
                var numStr = data[i + 2] + data[i + 3] + data[i] + data[i + 1];
                hexData[index++] = parseInt(numStr, 16);
            }
        }
        for (var i = range[0]; i <= range[1]; i++) {
            labels.push(1.9799 * i - 934.5831);
            datas.push(hexData[i]);
        }
        handler(datas, labels);
    }

    function returnFormPeriodSetup(data, handler) {
        console.log("曝光时间:" + data);
        handler = handler || function() {};
        handler(data);
    }

    function returnLightSwitch(data, handler) {
        console.log("开关灯光:" + data);
        handler = handler || function() {};
        handler(data);
    }

    function returnModelInfo(data, handler) {
        console.log("型号信息:" + data);
        handler = handler || function() {};
        handler(data);
    }

    function returnBatteryInfo(data, handler) {
        console.log("电池电量:" + data);
        handler = handler || function() {};
        var d = parseInt(data, 16);
        appConfig.device.batteryInfo = d;
        saveAppConfig();
        handler(data);
    }

    window.hyCmd = __hyCmd;

})(window);
