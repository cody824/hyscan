(function(window) {

    window.gotoMain = function() {
        api.openDrawerLayout({
            name: 'main',
            url: 'main.html',
            animation: {
                type: "curl", //动画类型（详见动画类型常量）
                subType: "from_left", //动画子类型（详见动画子类型常量）
                duration: 300 //动画过渡时间，默认300毫秒
            },
            progress: {
                title: "加载中", //type为default时显示的加载框标题
                text: "……",
            },
            leftPane: {
                edge: api.winWidth * 0.4,
                name: 'slider',
                url: 'slider.html'
            }
        });
    }

    window.gotoMap = function(){
      api.openWin({
          name: 'map',
          url: 'map.html'
      });
    }

    window.gotoMe = function(){
        api.openWin({
            bounces : true,
            allowEdit : true,
            reload : true,
            name: 'my',
            url: 'my.html'
        });
    }

    window.beginCollect = function(){
        api.openWin({
            reload : true,
            name: 'collect',
            url: './collect.html'
        });
    }

    window.gotoScanDevice = function(){
        api.openWin({
            name: 'connect',
            url: 'connect.html'
        });
    }

    window.gotoRevise = function(){
      api.openWin({
          reload : true,
          name: 'revise',
          url: './revise.html'
      });
    }

    window.gotoResult = function(datas, labels) {
  		api.openWin({
            reload : true,
  			name: 'result',
  			url: './result.html',
  			pageParam: {
  				datas: datas,
  				labels: labels
  			}
  		});
  	}

    window.gotoTaskInfo = function(task, back) {
  		api.openWin({
            reload : true,
  			name: 'taskInfo',
  			url: './taskInfo.html',
  			pageParam: {
  				task: task,
                back : back
  			}
  		});
  	}



})(window);
