(function(window) {
    var fs;

    var __task = {

        init: function() {
            fs = fs || api.require("fs");
        },


        addTask: function(data, result, position, name, imagePath, device, callback) {
            var now = new Date();
            var id = device.model + device.serial + dateFormat("yyyyMMddhhmmssS", now);
            var dc = [];
            dc[0] = device.darkCurrent;
            dc[1] = device.whiteboardData;
            delete device.darkCurrent;
            delete device.whiteboardData;

            var st = {
                result: result,
                position: position,
                name: name,
                imagePath: imagePath,
                device: device,
                isUpload: false,
                timestamp: now.getTime(),
                id: id
            };
            api.writeFile({
                path: 'fs://task/info/' + id,
                data: JSON.stringify(st)
            }, function(ret, err) {
                var funcRet = {};
                if (ret.status) {
                    api.writeFile({
                        path: 'fs://task/data/' + id,
                        data: JSON.stringify(data)
                    }, function(ret, err) {
                        if (ret.status) {
                            api.writeFile({
                                path: 'fs://task/dc/' + id,
                                data: JSON.stringify(dc)
                            }, function(ret, err) {
                                if (ret.status) {
                                    funcRet.status = true;
                                    st.data = {
                                        dn: data,
                                        darkCurrent: dc[0],
                                        whiteboardData: dc[1]
                                    }
                                    funcRet.task = st;
                                    var taskList = $api.getStorage('taskList') || [];
                                    taskList.push(st.id);
                                    $api.setStorage('taskList', taskList);


                                    if (typeof callback == "function")
                                        callback(funcRet);
                                } else {
                                    console.log(JSON.stringify(err));
                                    funcRet.status = false;
                                    funcRet.err = err;
                                    if (typeof callback == "function")
                                        callback(funcRet);
                                }
                            });
                        } else {
                            console.log(JSON.stringify(err));
                            funcRet.status = false;
                            funcRet.err = err;
                            if (typeof callback == "function")
                                callback(funcRet);
                        }
                    });
                } else {
                    console.log(JSON.stringify(err));
                    funcRet.status = false;
                    funcRet.err = err;
                    if (typeof callback == "function")
                        callback(funcRet);
                }
            });
        },

        updateTaskInfo: function(task, callback) {
            delete task.dc; //不保存dc和data信息
            delete task.data;
            api.writeFile({
                path: 'fs://task/info/' + task.id,
                data: JSON.stringify(task)
            }, function(ret, err) {
                var funcRet = {};
                if (ret.status) {
                    funcRet = ret;
                } else {
                    console.log(JSON.stringify(err));
                    funcRet.status = false;
                    funcRet.err = err;
                }
                if (typeof callback == "function")
                    callback(funcRet);
            });
        },

        getTask: function(id, containData, callback) {
            api.readFile({
                path: "fs://task/info/" + id
            }, function(ret, err) {
                var funcRet = {};
                if (ret.status) {
                    var data = ret.data;
                    var task = JSON.parse(data);
                    if (containData) {
                        api.readFile({
                            path: "fs://task/data/" + id
                        }, function(ret, err) {
                            if (ret.status) {
                                var data = ret.data;
                                task.data = JSON.parse(data);
                                api.readFile({
                                    path: "fs://task/dc/" + id
                                }, function(ret, err) {
                                    if (ret.status) {
                                        var dc = ret.data;
                                        task.dc = JSON.parse(dc);
                                        if (typeof callback == "function") {
                                            callback({
                                                status: true,
                                                task: task
                                            });
                                        }
                                    } else {
                                        if (typeof callback == "function") {
                                            callback({
                                                status: false,
                                                err: err
                                            });
                                        }
                                    }
                                })
                            } else {
                                if (typeof callback == "function") {
                                    callback({
                                        status: false,
                                        err: err
                                    });
                                }
                            }
                        })
                    } else {
                        if (typeof callback == "function") {
                            callback({
                                status: true,
                                task: task
                            });
                        }
                    }
                } else {
                    if (typeof callback == "function") {
                        callback({
                            status: false,
                            err: err
                        });
                    }
                }
            })
        },

        deleteTaskImage: function(task) {
            stTask.init();
            if (task.imagePath) {
                fs.remove({
                    path: task.imagePath
                });
            }
        },

        deleteTask: function(task, callback) {
            stTask.init();
            var files = $api.getStorage('taskList') || [];
            var index = -1;
            for (var i = 0; i < files.length; i++) {
                if (files[i] = task.id) {
                    index = i;
                    break;
                }
            }
            if (index >= 0) {
                files.splice(index, 1);
                $api.setStorage('taskList', files);
            }
            callback({
                status: true
            })
            fs.remove({
                path: 'fs://task/data/' + task.id
            });
            fs.remove({
                path: 'fs://task/dc/' + task.id
            });
            fs.remove({
                path: 'fs://task/info/' + task.id
            });
            if (task.imagePath) {
                fs.remove({
                    path: task.imagePath
                })
            }
        },

        sendTaskImgToRemote: function(imagePath, taskId, callback) {
            api.ajax({
                url: globalConfig.serverUrl + "app/scanTask/img",
                method: 'post',
                headers: {
                    hytoken: 'hyscan' + appConfig.token,
                    Accept: 'application/json'
                },
                method: 'post',
                data: {
                    values: {
                        taskId: taskId
                    },
                    files: {
                        file: imagePath
                    }
                }
            }, callback);
        },

        sendTaskToRemote: function(task, callback) {
            console.log("发送任务到服务器");
            api.ajax({
                url: globalConfig.serverUrl + "app/scanTask/",
                method: 'post',
                headers: {
                    hytoken: 'hyscan' + appConfig.token,
                    "Content-Type": 'application/json',
                    Accept: 'application/json'
                },
                data: {
                    body: task
                }
            }, callback);
        },

        getTestResult: function(data, callback) {
            api.ajax({
                url: globalConfig.serverUrl + "app/spAnalysis?model=" + appConfig.device.model,
                method: 'post',
                headers: {
                    hytoken: 'hyscan' + appConfig.token,
                    "Content-Type": 'application/json',
                    Accept: 'application/json'
                },
                data: {
                    body: data
                }
            }, function(ret, err) {
                if (!ret) {
                    console.log(JSON.stringify(err))
                    ret = {};
                    ret.level = 0;
                    ret.material = "检测失败";
                }
                if (typeof callback == "function")
                    callback(ret);
            });
        },

        findTask: function(callback, start, limit) {
            stTask.init();
            start = start || 0;
            limit = limit || 500;
            var files = $api.getStorage('taskList');
            if (files && files.length > 0 && start <= files.length - 1) {
                var tasks = [];
                var beginIndex = files.length - 1 - start;
                if (beginIndex < 0) {
                    callback([]);
                }
                var endIndex = beginIndex - limit + 1;
                endIndex = endIndex < 0 ? 0 : endIndex;
                var  fileNum = beginIndex - endIndex + 1;
                for (var i = beginIndex; i >= endIndex; i--) {
                    var path = files[i];
                    stTask.getTask(path, false, function(ret) {
                        fileNum--;
                        if (ret.status) {
                            tasks.push(ret.task);
                        }
                        if (fileNum == 0 && typeof callback == "function") {
                            callback(tasks);
                        }
                    });
                }
            } else {
                callback([]);
            }
        },

        dateFormat: dateFormat
    }

    function dateFormat(fmt, date) {
        var o = {
            "M+": date.getMonth() + 1, //月份
            "d+": date.getDate(), //日
            "h+": date.getHours(), //小时
            "m+": date.getMinutes(), //分
            "s+": date.getSeconds(), //秒
            "q+": Math.floor((date.getMonth() + 3) / 3), //季度
            "S": date.getMilliseconds() //毫秒
        };
        if (/(y+)/.test(fmt))
            fmt = fmt.replace(RegExp.$1, (date.getFullYear() + "").substr(4 - RegExp.$1.length));
        for (var k in o)
            if (new RegExp("(" + k + ")").test(fmt))
                fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));
        return fmt;
    }

    window.stTask = __task;
})(window);
