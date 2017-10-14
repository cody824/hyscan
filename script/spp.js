(function(window) {
    var __bluetooth;
    var spp;

    var __sppUtil = {};

    __sppUtil.init = function(opts, callback) {
        spp = api.require('spp');

        if (typeof opts == "function") {
            callback = opts;
            opts = {};
        }
        opts = opts || {}
        var open = opts.open || false;

        var me = this;

        __bluetooth = {};
        spp.init({
            open: open
        }, function(ret) {
            __bluetooth.status = ret.status;
            __bluetooth.show = {};
            switch (ret.status) {
                case 'poweredOn':
                    __bluetooth.show.status = "设备已开启";
                    break;
                case 'poweredOff':
                    __bluetooth.show.status = "设备已关闭";
                    break;
                case 'resetting':
                    __bluetooth.show.status = "正在重置";
                    break;
                case 'unauthorized':
                    __bluetooth.show.status = "设备未授权";
                    break;
                case 'unknown':
                    __bluetooth.show.status = "初始化中";
                    break;
                case 'unsupported':
                    __bluetooth.show.status = "状态不支持";
                    break;
                default:
                    break;
            }
            if (typeof callback === "function") {
                callback(__bluetooth);
            }
        });
    }

    /**
     * 扫描设备
     * @param autoStop 自动停止扫描时间 单位second
     */
    __sppUtil.scanDevice = function(autoStop, foundFunc) {
        console.log("开始扫描蓝牙设备");
        spp.scan({}, function(ret, err) {
            if (ret.status == "BLUTTOOTH_DISABLED") {
                api.alert({
                    title: '错误',
                    msg: '蓝牙未启用，请启用蓝牙设备',
                });
            } else if (ret.status == "FOUND") {
                console.log("发现新设备：" + ret.device);
                var device = JSON.parse(ret.device);
                if (typeof foundFunc == "function")
                    foundFunc(device);
            } else if (ret.status == "DISCOVERY_FINISHED") {
                console.log("扫描完成，共发现" + ret.devicesNum + "个设备");
            } else if (ret.status == "DISCOVERY_STARTED") {
                console.log("开始扫描");
            }
        });
        if (autoStop > 0)
            setTimeout(__sppUtil.stopScanDevice, 1000 * autoStop);
    }

    /**
     *停止扫描设备
     */
    __sppUtil.stopScanDevice = function() {
        console.log("停止扫描蓝牙设备");
        spp.stopScan();
    }

    /**
     * 断开连接
     * @param address 设备地址
     * @param callback 回调
     */
    __sppUtil.disconnectDevice = function(address, callback) {
        spp.disconnect({
            address: address
        }, function(ret) {
            if (typeof callback === "function") {
                callback(ret);
            }
        });
    }

    /**
     *连接设备
     * @param address 设备地址
     * @param callback 回调
     */
    __sppUtil.connectDevice = function(address, callback) {
        spp.connect({
            address: address
        }, function(ret, err) {
            if (ret.err) {
                console.log("连接蓝牙设备【" + address + "】失败：" + ret.err);
                if (typeof callback == "function") {
                    callback(ret);
                }
            } else if (ret.device) {
                console.log("连接蓝牙设备【" + address + "】成功");
                if (typeof callback == "function") {
                    callback(JSON.parse(ret.device));
                }
            }
        });
    }

    window.sppUtil = __sppUtil;
    window.spp = spp;
})(window);
