/**
 * @classdesc
 * 滚动缩放地图控制
 * @class
 * @extends {GeoBeans.Control}
 */
GeoBeans.Control.ScrollMapControl = GeoBeans.Class(GeoBeans.Control, {
	
	onmousewheel : null,
	count : 0,

	initialize : function(map){
		GeoBeans.Control.prototype.initialize.apply(this, arguments);
		
		this.map = map;
		var that = this;
		var mapContainer = this.map.getContainer();
		this.type = GeoBeans.Control.Type.SCROLL_MAP;
		var mousewheelEvent = function(e,count){	
			if(!that.enabled){
				return;
			}
			e.preventDefault();
			var viewer = map.getViewer();
			var maxZoom = viewer.getMaxZoom();
			var minZoom = viewer.getMinZoom();
			// var trackOverlayControl = map._getTrackOverlayControl();
			// if(trackOverlayControl.drawing){
			// 	map.restoreSnap();
			// }
			// var tracker = map.tracker;
			// if(tracker != null && tracker.drawing){
			// 	map.restoreSnap();
			// }

			var viewer = map.getViewer();
			viewer.setStatus(GeoBeans.Viewer.Status.SCROLL);
			var extent = viewer.getExtent();
			if(isValid(map.baseLayer)){
				var zoom = viewer.getZoom();
				if(e.wheelDelta>0 || e.detail < 0){
					var target_zoom = zoom + count;
					if(target_zoom > maxZoom){
						target_zoom = maxZoom;
					}
					map.saveSnap();
					map.zoomTo(target_zoom);
				}else{
					var target_zoom = zoom - count;
					if(target_zoom < minZoom){
						target_zoom = minZoom;
					}
					map.saveSnap();
					map.zoomTo(target_zoom);
				}
			}
			else{
				if(e.wheelDelta>0 || e.detail < 0){
					var resolution = viewer.getResolution();
					var target_res = resolution / Math.pow(1.2,count);
					viewer.setResolution(target_res);
				}
				else{
					var resolution = viewer.getResolution();
					var target_res = resolution * Math.pow(1.2,count);
					viewer.setResolution(target_res);
				}
			}
			// // 保存snap,为了绘制使用
			// map.saveSnap();
			// if(trackOverlayControl.drawing){
			// 	trackOverlayControl.drawingEvent();
			// }
			// if(tracker != null && tracker.drawing){
			// 	tracker.drawingEvent();
			// }

			
			var drawInteraction = that.map.getInteraction(GeoBeans.Interaction.Type.DRAW);
			if(isValid(drawInteraction) && drawInteraction.isDrawing()){
				map.saveSnap();
				drawInteraction.drawingEvent();
			}
			viewer.setStatus(GeoBeans.Viewer.Status.NONE);
		};

		this.mousewheel = function(e){
			that.count = that.count + 1;
			var countLo = that.count;
			setTimeout(function(){
				// console.log("setTimeout:that:" + that.count + " ,this:"+ countLo);
				if(that.count == countLo){
					// console.log("draw:" + that.count);
					mousewheelEvent(e,that.count);
					that.count = 0;

					var wheelHandler = null;
					var mouseWheelEvent = that.map.events.getEvent(GeoBeans.Event.MOUSE_WHEEL);
					if(mouseWheelEvent != null){
						wheelHandler = mouseWheelEvent.handler;
					}

					var viewer = that.map.getViewer();
					var delta = isValid(e.wheelDelta) ? (e.wheelDelta >0? 1 : -1) : (e.detail<0 ? -1:1);
					if(wheelHandler != null){
						var args = {
							delta: delta,
							zoom : viewer.getZoom()
						}
						wheelHandler(args);
					}
				}
			}, 200);
		};

		var userAgent = navigator.userAgent;
		if(userAgent.indexOf("Firefox") > -1){
			mapContainer.addEventListener('DOMMouseScroll', this.mousewheel);
		}else{
			mapContainer.addEventListener('mousewheel', this.mousewheel);
		}
		
	},

	destory : function(){

		var mapContainer = this.map.getContainer();
		mapContainer.removeEventListener('mousewheel', this.mousewheel);
		GeoBeans.Control.prototype.destory.apply(this, arguments);
	},
});