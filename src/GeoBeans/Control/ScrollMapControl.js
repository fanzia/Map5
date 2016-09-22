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
			var trackOverlayControl = map._getTrackOverlayControl();
			if(trackOverlayControl.drawing){
				map.restoreSnap();
			}
			var trackBufferControl = map._getBufferTracker();
			if(trackBufferControl != null && trackBufferControl.drawing){
				map.restoreSnap();
			}
			var tracker = map.tracker;
			if(tracker != null && tracker.drawing){
				map.restoreSnap();
			}

			var viewer = map.getViewer();
			var extent = viewer.getExtent();
			if(map.baseLayer!=null){
				var zoom = viewer.getZoom();
				if(e.wheelDelta>0){
					// 底图缩放比例不为1
					if(map.baseLayer.imageScale != 1.0){
						var zoom = 1/(1 + count *0.2);
						extent.scale(zoom);
						map.saveSnap();
						map.drawBackground();
						map.drawLayersSnap(zoom);
						viewer.setExtent(extent);
						map.draw();
					}else{
						zoom = zoom + count;
						if(zoom > maxZoom){
							zoom = maxZoom;
						}
						map.saveSnap();
						map.drawBackground();
						map.drawBaseLayerSnap(zoom);
						viewer.setZoom(zoom);
						map.draw();
					}
				}else{
					if(map.baseLayer.imageScale != 1.0){
						var zoom = 1 + 0.2*count;
						extent.scale(zoom);
						map.saveSnap();
						map.drawBackground();
						map.drawLayersSnap(zoom);
						viewer.setExtent(extent);
						map.draw();
					}else{
						zoom = zoom - count;
						if(zoom < minZoom){
							zoom = minZoom;
						}
						map.saveSnap();
						map.drawBackground();
						map.drawBaseLayerSnap(zoom);
						viewer.setZoom(zoom);
						map.draw();						
					}
				}
			}
			else{
				if(e.wheelDelta>0){
					var zoom = 1/(1 + count *0.2);
					map.saveSnap();
					map.drawBackground();
					map.drawLayersSnap(zoom);
					extent.scale(zoom);
					viewer.setExtent(extent);
					map.draw();
				}
				else{
					var zoom = 1 + 0.2*count;
					map.saveSnap();
					map.drawBackground();
					map.drawLayersSnap(zoom);
					extent.scale(zoom);
					viewer.setExtent(extent);
					map.draw();
				}
			}
			// 保存snap,为了绘制使用
			map.saveSnap();
			if(trackOverlayControl.drawing){
				trackOverlayControl.drawingEvent();
			}
			if(trackBufferControl != null && trackBufferControl.drawing){
				trackBufferControl.drawingEvent();
			}
			if(tracker != null && tracker.drawing){
				tracker.drawingEvent();
			}
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
					if(wheelHandler != null){
						var args = new GeoBeans.Event.MouseArgs();
						args.buttn = null;
						args.X = null;
						args.Y = null;
						args.mapX = null;
						args.mapY = null;
						args.zoom = viewer.getZoom();
						wheelHandler(args);
					}
				}
			}, 200);
		};

		mapContainer.addEventListener('mousewheel', this.mousewheel);
	},

	destory : function(){

		var mapContainer = this.map.getContainer();
		mapContainer.removeEventListener('mousewheel', this.mousewheel);
		GeoBeans.Control.prototype.destory.apply(this, arguments);
	},
	
	
});