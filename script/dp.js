(function(window) {
    window.DPTool = {

        labels: [],

        datas: [],

        dataLength: 1,

        initData: function() {
            if (appConfig.globalConfig)
                DPTool.dataLength = appConfig.globalConfig.collectNum || DPTool.dataLength;
            DPTool.datas = [];
        },

        addData: function(datas) {
            var rnum = DPTool.datas.length - DPTool.dataLength + 1;
            if (rnum > 1) {
                for (var i = 0; i < rnum; i++) {
                    DPTool.datas.shift();
                }
            }
            DPTool.datas.push(datas);
        },

        isDataOk: function() {
            return DPTool.datas.length >= DPTool.dataLength;
        },

        getFinallyData: function() {
            if (DPTool.datas.length == 0)
                return null;

            var finallyData = [];
            for (var j = 0; j < DPTool.datas[0].length; j++) {
                finallyData[j] = 0;
            }
            for (var i = 0; i < DPTool.datas.length; i++) {
                for (var j = 0; j < DPTool.datas[i].length; j++) {
                    finallyData[j] = finallyData[j] + DPTool.datas[i][j];
                }
            }
            for (var i = 0; i < finallyData.length; i++) {
                finallyData[i] = finallyData[i] / DPTool.datas.length;
            }
            return finallyData;
        },

        setXAxis: function(labels) {
            DPTool.labels = labels;
        },

        getXAxis: function() {
            var labels = [];
            for (var i = 0; i < DPTool.labels.length; i++){
                labels[i] = parseFloat(DPTool.labels[i]).toFixed(2);
            }
            return labels;
        },

        getRadiance: function(datas, ra, rb) {
            var ra = ra || appConfig.device.radianceA;
            var rb = rb || appConfig.device.radianceB;
            var newData = [];
            for (i = 0; i < datas.length; i++) {
                var data = ra * datas[i] + rb;
                newData.push(data);
            }
            return newData;
        },

        getReflectivity: function(datas, dc, wd) {
            var dc = dc || appConfig.device.darkCurrent;
            var wd = wd || appConfig.device.whiteboardData;
            var newData = [];
            for (i = 0; i < datas.length; i++) {
                var data = 0;
                if (wd[i] - dc[i] != 0) {
                    data = 1.0 * (datas[i] - dc[i]) / (wd[i] - dc[i]);
                }
                newData.push(data);
            }
            return newData;
        },

        getRmPacketLine: function(datas, dc, wd) {
            var m_x = DPTool.getXAxis();
            var m_y = DPTool.getReflectivity(datas,  dc, wd);
            var count = m_x.length; //波段数

            var m_curverX = []; //记录包络线上的值
            var m_curverY = [];
            var CurCount = 0; // 记录包络线上的波段数
            var rm; //交点的纵坐标
            var x0, y0, x1, y1;

            var m_baoluoy = [];
            var result = [];

            var j, m;
            //将包络线赋初值求取上包络线
            m_curverX[0] = m_x[0];
            m_curverY[0] = m_y[0];
            CurCount++;

            var crosscounter = 0;

            for (var i = 0; i < count; i++) {
                x0 = m_x[i];
                y0 = m_y[i];
                //j=i+1;
                for (j = i + 1; j < count; j++) { //连接左边点DN（i，j，1）和右边点DN（i，j，m）生成直线Line（1，m）
                    x1 = m_x[j];
                    y1 = m_y[j]; //准备求j点是否为包络线上的点
                    crosscounter = 0;
                    for (m = 0; m < count; m++) {
                        rm = (m_x[m] - x0) * (y1 - y0) / (x1 - x0) + y0;
                        if (rm >= m_y[m]) {
                            //   在下方
                            crosscounter++;
                        } else {
                            break;
                        }
                    } //for m

                    if (crosscounter == count) { //j是包络线上的点
                        m_curverX[CurCount] = m_x[j];
                        m_curverY[CurCount] = m_y[j];
                        CurCount++;
                        i = j - 1;
                        break;
                    }
                } //for j
            } // for i

            //+++++++++++++++++++++++++++++++++++++++++包络线去除+++++++++++++++++++++++++++++++++++++++++++++++

            var Sposition = 0;
            for (var i = 0; i < CurCount; i++) {

                for (j = 0; j < count; j++) {
                    if (j >= Sposition) {
                        if (m_x[j] != m_curverX[i]) {
                            //如果不是包罗线上的点，则要插值
                            var xx1, xx2, yy1, yy2;
                            xx1 = m_curverX[i];
                            xx2 = m_curverX[i - 1];
                            yy1 = m_curverY[i];
                            yy2 = m_curverY[i - 1];
                            m_baoluoy[j] = (m_x[j] - xx1) * (yy2 - yy1) / (xx2 - xx1) + yy1;
                            m_y[j] = m_y[j] / m_baoluoy[j];

                        } else {
                            //   如果找到包络线上的点
                            m_y[j] = 1;
                            Sposition = j + 1;
                            break;
                        }

                    } //for if;
                } //forj
            } //for i

            for (j = 0; j < count; j++) {
                if (m_y[j] > 1) {
                    m_y[j] = 1;
                }

            }
            for (var i = 0; i < count; i++) {
                result[i] = m_y[i];
            }
            return result;
        }
    }

})(window);
