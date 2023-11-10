/*
 * @author andypliang
 * @email t-cong@163.com
 * @description 移动端多级联动选择器 
 * @version 1.0.0
 */
'use strict';

;(function(window){
    var ObjToArray = function(obj) {
        if(!obj) return [];
        if(Array.isArray(obj)) return obj;
        const arr = Object.entries(obj);
        if(!arr.length) return [];
        return Object.entries(obj).map(item => {
            return {
                label: item[1],
                value: item[0]
            }
        });
    }
	var PickerView = function(opts) {
			// 参数存起来
			this.pickerOpts = opts;
            this.pickerOpts.defaultCols = opts.initData();
            this.pickerOpts.cols = opts.initData();
			// 选择器前缀
	    	this.prefix = '_picker-' + new Date().getTime();
	    	// 每一项的高度
			this.itemHeight = 30;
			// 记录鼠标位置
			this.pos = {
				startY: 0,
				moveY: 0,
				endY: 0,
				curY: 0,
				itemStartY: 0
            };

	    	// 生成选择器Dom结构
	    	this.createPickerDom();

			// 记录选择器对应的dom
            this.container = document.querySelector('.' + this.prefix);
            this.mask = this.container.querySelector('._picker-mask');
			this.cols = this.container.querySelectorAll('._picker-col');
			this.col_list = this.container.querySelectorAll('._picker-data-list');
			this.btnCancel = this.container.querySelector('._picker-btn-cancel');
			this.btnConfirm = this.container.querySelector('._picker-btn-confirm');
			if (this.pickerOpts.selector) {
                this.selector = document.getElementById(this.pickerOpts.selector);
            }

			// 绑定选择器的事件
			this.bind();
	}

	PickerView.prototype = {
        show: function() {
            this.container.className = '_picker-container ' + this.prefix;
        },
		bind: function() {
			var _this = this;
            var hidePicker = function() {
                if (typeof _this.pickerOpts.onCancel === "function") {
	                _this.pickerOpts.onCancel();
	            }
	            _this.container.className = '_picker-container hide';
            };
            // 选择取消事件
            this.mask.addEventListener('touchend', hidePicker, false);
			this.btnCancel.addEventListener('touchend', hidePicker, false);

			// 选择确定事件
			this.btnConfirm.addEventListener('touchend', function() {
				if (typeof _this.pickerOpts.onConfirm === "function") {
	                var values = [];
	                // 获取每一个当前选中值 没有的话默认第一个
	                for (var i = 0; i < _this.pickerOpts.cols.length; i++) {
                        var val = _this.pickerOpts.cols[i].curVal !== undefined ? _this.pickerOpts.cols[i].curVal : _this.pickerOpts.cols[i].values[0];
                        values.push(val);
	                }
	                _this.pickerOpts.onConfirm(values);
				}
	            _this.container.className = '_picker-container hide';
			},false);

			// 唤起选择器事件
			this.selector && this.selector.addEventListener('touchend', function() {
	            _this.show();
			},false);

            // 绑定选项滑动事件
	        for (var i = 0; i < this.cols.length; i++) {
	            this.cols[i].addEventListener('touchstart', _this.touchEventCallBack(i, 'touchstart', _this.pos), false);
	            this.cols[i].addEventListener('touchmove', _this.touchEventCallBack(i, 'touchmove', _this.pos), false);
	            this.cols[i].addEventListener('touchend', _this.touchEventCallBack(i, 'touchend', _this.pos), false);
	        }
		},
		touchEventCallBack: function(index, event, pos) {
	        var _this = this;
			return function(e) {
                e.preventDefault();
	            switch (event) {
					case 'touchstart':
						// 计算起始每个值的位置
						pos.startY = e.touches[0].clientY;
						pos.curY = pos.itemStartY =  (3 - _this.pickerOpts.cols[index].curIndex) * _this.itemHeight;
                        _this.col_list[index].classList.remove('animate');
						break;
					case 'touchmove':
	                    // 移动的位置
	                    pos.moveY = e.changedTouches[0].clientY;
	                    // 动态计算当前位置
	                    pos.curY = pos.itemStartY + (pos.moveY - pos.startY);
                        _this.col_list[index].setAttribute('style','-webkit-transform:translate3d(0, ' + pos.curY + 'px, 0);transform:translate3d(0, ' + pos.curY + 'px, 0)');
						break;
					case 'touchend':
	                    // 结束的位置
	                    pos.endY = e.changedTouches[0].clientY;
	                    var curIndex = Math.round((pos.startY - pos.endY) / _this.itemHeight) + _this.pickerOpts.cols[index].curIndex;
						var len = _this.pickerOpts.cols[index].values.length;
						if (curIndex < 0) {
							curIndex = 0;
						} else if (curIndex >= len) {
							curIndex = len - 1;
						}
	                    // 更新当前选中值
	                    _this.pickerOpts.cols[index].curIndex = curIndex;
                        _this.pickerOpts.cols[index].curVal = _this.pickerOpts.cols[index].values[curIndex];
                        _this.col_list[index].classList.add('animate');
	                    _this.col_list[index].setAttribute('style', '-webkit-transform:translate3d(0, ' + (3 - curIndex) * _this.itemHeight+'px, 0);transform:translate3d(0, ' + (3 - curIndex) * _this.itemHeight + 'px, 0);');
                        // 选中事件回调
                        for (let i = index+1; i< _this.pickerOpts.cols.length;i++) {
                            _this.updateCol(i,_this.pickerOpts.cols[i])
                        }
                        
						if (typeof _this.pickerOpts.onSelected === 'function') {
                            var val = _this.pickerOpts.cols[index].curVal;
	                        _this.pickerOpts.onSelected(index, _this.pickerOpts.cols[index].curIndex, val);
                            
                        }
						break;
				}
			}
        },
        
	    // 创建选择器的Dom结构
	    createPickerDom: function() {
            var opts = this.pickerOpts;
			var mainDom = '';
			for (var i = 0; i < opts.cols.length; i++) {
				mainDom += '<div class="_picker-col">' + this.setOptions(i) + '</div>';
			}
            var dom = '<div class="_picker-container hide ' + this.prefix + '">' +
                            '<div class="_picker-mask"></div>' +
							'<div class="_picker-wrapper">' +
								'<div class="_picker-head">' +
									'<h3 class="_picker-title">' + (opts.title || '') + '</h3>' +
									'<a class="_picker-btn-cancel" href="javascript:;">取消</a>' +
									'<a class="_picker-btn-confirm" href="javascript:;">确定</a>' +
								'</div>' +
								'<div class="_picker-content">' + mainDom + '</div>' +
							'</div>' +
					  '</div>';
			var wrapper = document.createElement('div');
            wrapper.innerHTML = dom;
			document.body.appendChild(wrapper);
		},
		// 设置选择器里的列内容
		setOptions: function(curIndex) {
            console.log(curIndex, 'curIndex');  
            if (curIndex-1>=0) {
                const parent = this.pickerOpts.cols[curIndex-1];
                const parentSelectVal = parent.curVal;
                console.log(parentSelectVal, parent)
                const parentSelectValue = parentSelectVal.value.toString().replace(/0{1,}$/g,'');
                const newVal = ObjToArray(this.pickerOpts.defaultCols[curIndex].values).filter(item => {
                    return item.value.indexOf(parentSelectValue) === 0;
                })
                this.pickerOpts.cols[curIndex].values = newVal;
                
            }
            this.initCol(this.pickerOpts.cols[curIndex]);
            console.log(this.pickerOpts.cols[curIndex].values, 'sssss');
			var dom  = '<ul class="_picker-data-list" style="-webkit-transform:translate3d(0, ' + (3 - this.pickerOpts.cols[curIndex].curIndex) * this.itemHeight + 'px, 0);transform:translate3d(0, ' + (3 - this.pickerOpts.cols[curIndex].curIndex) * this.itemHeight + 'px, 0)">';
			for (var i = 0; i < this.pickerOpts.cols[curIndex].values.length; i++) {
				dom += '<li>' + this.pickerOpts.cols[curIndex].values[i].label + '</li>';
			}
			return dom + '</ul>';
        },
        // 初始化列选项
        initCol: function(col) {
            col.values = ObjToArray(col.values);
            if (!col.values.length) return;
            col.curVal = col.values[0];
            col.curIndex = 0;
            console.log(col, 'init')
        },
		// 更新列内容
		updateCol: function(colIndex,col) {
            console.log('ssss2333');
			this.cols[colIndex].innerHTML = this.setOptions(colIndex);
	        // 更新pickerOpts
	        this.pickerOpts.cols[colIndex] = col;
	        // 更新col list
	        this.col_list = document.querySelectorAll('.' + this.prefix + ' ._picker-data-list');
		}
    }
    // 样式注入
    var style = document.createElement('style');
    style.innerText = "._picker-container{position:fixed;z-index:9999;top:0;left:0;bottom:0;right:0;font-size:0;font-family:PingFangSC-Light,'Helvetica Neue',sans-serif;margin:0;padding:0;-webkit-user-select:none;user-select:none;visibility:visible}._picker-container a{outline:0;-webkit-tap-highlight-color:rgba(0,0,0,0)}._picker-mask{position:absolute;top:0;left:0;bottom:0;right:0;background-color:rgba(0,0,0,0.5);-webkit-transition:all .3s ease 0s;transition:all .3s ease 0s;opacity:1}._picker-wrapper{position:absolute;bottom:0;width:100%;-webkit-transition:all .3s ease;transition:all .3s ease}._picker-head{position:relative;height:50px;line-height:50px;background-color:#f4f4f4;overflow:hidden;text-align:center}._picker-title{font-size:16px;font-weight:bold;width:68%;margin:0 auto;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}._picker-btn-cancel,._picker-btn-confirm{font-size:16px;color:#888;text-decoration:none;position:absolute;left:0;top:0;bottom:0;width:16%}._picker-btn-confirm{color:#0c86ff;left:initial;right:0}._picker-content{display:-webkit-box;display:-webkit-flex;display:flex;height:220px;background-color:#fff;font-size:18px;text-align:center;overflow:hidden;position:relative}._picker-content:before{content:'';position:absolute;left:0;right:0;bottom:120px;top:0;pointer-events:none;background:linear-gradient(180deg,hsla(0,0%,100%,.9),hsla(0,0%,100%,.6));border-bottom:solid 1px #ddd;z-index:2}._picker-content:after{content:'';position:absolute;left:0;right:0;bottom:0;top:130px;pointer-events:none;background:linear-gradient(0deg,hsla(0,0%,100%,.9),hsla(0,0%,100%,.6));border-top:solid 1px #ddd;z-index:2}._picker-col{-webkit-box-flex:1;-webkit-flex:1;flex:1;position:relative}._picker-col-inner{position:absolute;width:100%;height:100%;left:0;right:0;top:0;bottom:0}._picker-data-list{padding:0;margin:10px 0}._picker-data-list.animate{-webkit-transition:transform .3s ease 0s;transition:transform .3s ease 0s}._picker-data-list>li{list-style:none;height:30px;line-height:30px}._picker-container.hide{pointer-events:none;visibility:hidden}._picker-container.hide ._picker-mask{opacity:0}._picker-container.hide ._picker-wrapper{bottom:-100%}";
    document.body.appendChild(style);
    window.PickerView = PickerView;
}(window));

if (typeof define === "function" && define.amd) {
    define("pickerView", [], function () {
        return PickerView;
    });
} else if (typeof module !== 'undefined' && module.exports) {
    module.exports = PickerView;
} 
