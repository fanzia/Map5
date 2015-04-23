GeoBeans.Layer.OverlayLayer = GeoBeans.Class(GeoBeans.Layer.FeatureLayer,{
	
	overlays : null,


	hitOverlay : null,

	hitOverlayCallback : null,

	editCanvas : null,
	editRenderer : null,
	editEvent : null,
	editOverlay : null,
	// isEdit : false,

	initialize : function(name){
		GeoBeans.Layer.prototype.initialize.apply(this, arguments);

		this.overlays = [];
		// this.features = this.overlays; 
		// this.registerHitEvent(this.onOverlayHit);

	},

	addOverlay : function(overlay){
		if(overlay == null){
			return;
		}
		overlay.setLayer(this);
		this.overlays.push(overlay);

	},

	addOverlays : function(overlays){
		for(var i = 0; i < overlays.length; ++i){
			var overlay = overlays[i];
			this.addOverlay(overlay);
		}
	},

	removeOverlay : function(id){

		var len = this.overlays.length;
		for(var i=len-1; i>=0; i--){
			var o = this.overlays[i];
			if(i == id){
				this.overlays.splice(i,1);
				// this.features.splice(i,1);
			}
		}

	},
	
	removeOverlays : function(ids){
		// this.overlays = [];
		for(var i = 0; i < ids.length; ++i){
			var id = ids[i];
			this.overlays.splice(id,1);
		}
	},

	clearOverlays : function(){

		// this.overlays = [];
		var n = this.overlays.length;
		while(n>0){
			this.overlays.splice(n-1,1);
			n = this.overlays.length;
		}
		// this.features = [];
		this.editRenderer.clearRect();
		this.hitRenderer.clearRect();
	},

	load : function(){
		this.renderer.clearRect();
		if(this.hitRenderer != null){
			this.hitRenderer.clearRect();
		}
		if(this.editRenderer != null){
			this.editRenderer.clearRect();
		}
		
		for(var i = 0; i < this.overlays.length;++i){
			var overlay = this.overlays[i];
			overlay.draw();
		}

	},

	draw : function(){
		var flag = this.getLoadFlag();
		if(flag == GeoBeans.Layer.Flag.LOADED){
			this.map.drawLayersAll();
		}
	},

	getLoadFlag : function(){
		for(var i = 0; i < this.overlays.length;++i){
			var overlay = this.overlays[i];
			var flag = overlay.loadFlag;
			if(flag != GeoBeans.Overlay.Flag.LOADED){
				return GeoBeans.Layer.Flag.READY;
			}
		}
		return GeoBeans.Layer.Flag.LOADED;		

	},


	setHitOverlayCallback : function(callback){
		this.hitOverlayCallback = callback;
	},


	onOverlayHit : function(layer,selection){
		// var symbolizer = new GeoBeans.Style.PointSymbolizer();
		// symbolizer.icon_url = "pin-32.png";
		// symbolizer.icon_offset_x = 0;
		// symbolizer.icon_offset_y = 0;	

		// 只绘制最后一个selection
		var len = selection.length;
		if(len >=1){
			var f = selection[len-1];
			if(f.isEdit){
				layer.hitRenderer.clearRect();
				layer.map.drawLayersAll();
				return;
			}
			// if(layer.editOverlay != null){
			// 	layer.editOverlay.isEdit = false;
			// }
			// if(layer.editOverlay != null && layer.editOverlay != f){
			// 	layer.editOverlay.isEdit = false;
			// }
			
			var symbolizer = layer.getHitOverlaySymbolizer(f);
			layer.drawHitOverlay(f, symbolizer);
			// layer.editOverlay = f; //待编辑的
			if(layer.hitOverlay != null){
				layer.hitOverlay.isHit = false;
			}
			
			layer.hitOverlay = f;
			f.isHit = true;
			
			layer.hitOverlayCallback(f);
			// layer.editOverlay = null;
		}else{
			if(layer.editOverlay != null){
				layer.editOverlay.isHit = false;
				// layer.editOverlay.isEdit = false;
			}
			if(layer.hitOverlayCallback != null){
				layer.hitOverlayCallback(null);
			}
			if(layer.hitOverlay != null){
				layer.hitOverlay.isHit = false;
			}
			// layer.editRenderer.clearRect();
			// layer.editOverlay = null;
		}

		// len = selection.length;
		// for(i=0; i<len; i++){
		// 	var f = selection[i];
		// 	layer.drawHitOverlay(f, symbolizer);
		// }
		// if(len == 1){
		// 	layer.hitOverlayCallback(selection[0]);
		// }
		
	},

	//根据类型选取样式
	getHitOverlaySymbolizer : function(overlay){
		var type = overlay.type;
		var symbolizer = null;
		switch(type){
			case GeoBeans.Overlay.Type.MARKER:
				symbolizer = new GeoBeans.Style.PointSymbolizer();
				symbolizer.icon_url = "images/marker-hit.png";
				symbolizer.icon_offset_x = 0;
				symbolizer.icon_offset_y = 0;
				break;
			case GeoBeans.Overlay.Type.PLOYLINE:
				symbolizer = new GeoBeans.Style.LineSymbolizer();
				symbolizer.width = 4;
				symbolizer.color = "rgba(255,0,0,1)";
				symbolizer.outLineCap = GeoBeans.Style.LineCap.ROUND;;
				symbolizer.outLineJoin =  GeoBeans.Style.LineJoin.ROUND;
				symbolizer.showOutline = true;	
				break;
			case GeoBeans.Overlay.Type.POLYGON:
				symbolizer = new GeoBeans.Style.PolygonSymbolizer();
				symbolizer.size = 8;
				symbolizer.fillColor = "rgba(255,255,255,1)";
				symbolizer.outLineWidth = 1.0;
				symbolizer.outLineColor = "Red";
				symbolizer.outLineCap	= GeoBeans.Style.LineCap.ROUND;
				symbolizer.outLineJoin  = GeoBeans.Style.LineJoin.ROUND;
				symbolizer.showOutline = true;				
			default:
				break;
		}
		return symbolizer;
	},

	//绘制选中的overlay
	drawHitOverlay : function(overlay,symbolizer){
		// this.hitRenderer.draw(overlay, symbolizer, this.map.transformation);
		this.hitRenderer.clearRect();
		this.hitRenderer.setSymbolizer(symbolizer);
		var ret = this.hitRenderer.drawOverlay(overlay, symbolizer, this.map.transformation);
		if(ret){
			this.map.renderer.drawImage(this.hitCanvas,0,0,this.hitCanvas.width,this.hitCanvas.height);
		}
	},

	//注册hit事件
	registerHitEvent:function(){
		this.hitCanvas = document.createElement("canvas");
		this.hitCanvas.width = this.canvas.width;
		this.hitCanvas.height = this.canvas.height;

		this.hitRenderer  = new GeoBeans.Renderer(this.hitCanvas);

		var that = this;	
		var x_o = null;
		var y_o = null;
		var tolerance = 10;
		var map = that.map;		

		this.hitEvent = function(evt){
			if(x_o==null){
				x_o = evt.layerX;
				y_o = evt.layerY;
			}
			else{
				var dis = Math.abs(evt.layerX-x_o) + Math.abs(evt.layerY-y_o);
				if(dis > tolerance){
					
					x_o = evt.layerX;
					y_o = evt.layerY;
				
					var mp = map.transformation.toMapPoint(evt.layerX, evt.layerY);
					
					that.hit(mp.x, mp.y);
				}
			}

		};
		map.canvas.addEventListener('mousemove', this.hitEvent);
		this.registerEditEvent();

	},

	unregisterHitEvent:function(){
		var map = this.map;
		map.canvas.removeEventListener('mousemove', this.hitEvent);
		this.unregisterEditEvent();
		// this.editOver
		this.editOverlay = null;
		// this.hitOverlayCallback = null;
		this.editRenderer.clearRect();
		this.hitRenderer.clearRect();
		this.map.drawLayersAll();
	},

	hit : function(x, y){
		if(this.overlays==null){
			return;
		}
		
		var render = this.map.renderer;
		var transformation = this.map.transformation;
		
		// this.unselection = this.selection;
		this.selection = [];
		
		var i=0, j=0;
		var f=null, g=null;
		var len = this.overlays.length;
		for(i=0; i<len; i++){
			f = this.overlays[i];
			g = f.geometry;
			if(g!=null){
				if(g.hit(x, y, this.map.tolerance)){
					this.selection.push(f);
				}
			}
		}
		
		this.hitRenderer.clearRect();
		// this.map.drawHitLayer();
		this.map.drawLayersAll();
		if(this.onOverlayHit != undefined){
			this.onOverlayHit(this,this.selection);
		}
		// if(callback!=undefined){
		// 	callback(this, this.selection);
		// }
	},


	// 注册edit编辑事件
	registerEditEvent : function(){
		if(this.editCanvas == null){
			this.editCanvas = document.createElement("canvas");
			this.editCanvas.width = this.canvas.width;
			this.editCanvas.height = this.canvas.height;
			this.editRenderer = new GeoBeans.Renderer(this.editCanvas);

		}

		var map = this.map;
		var that = this;


		this.editEvent = function(evt){
		
			// var overlay = that.editOverlay;
			var overlay = that.hitOverlay;
			if(overlay == null){
				return;
			}
			if(that.editOverlay != null){
				that.editOverlay.isEdit = false;
			}

			var mp = map.transformation.toMapPoint(evt.layerX, evt.layerY);
			var geometry = overlay.geometry;
			if(geometry.hit(mp.x, mp.y, map.tolerance)){
				//绘制当前编辑的overlay
				that.editOverlay = overlay;
				var symbolizer = that.getEditOverlaySymbolizer(overlay);
				that.drawEditOverlay(overlay,symbolizer);
				overlay.isEdit = true;
				that.hitOverlayCallback(overlay);
			}else{
				// overlay.isEdit = false;
				// that.editRenderer.clearRect(); //清空
				// map.drawLayersAll();
				// that.editOverlay = null;

			}

			// that.unregisterEditEvent();

		}

		this.map.canvas.addEventListener("click", this.editEvent);
	},

	unregisterEditEvent : function(){
		this.map.canvas.removeEventListener("click",this.editEvent);
	},

	//根据类型选取样式
	getEditOverlaySymbolizer : function(overlay){
		var type = overlay.type;
		var symbolizer = null;
		switch(type){
			case GeoBeans.Overlay.Type.MARKER:
				symbolizer = new GeoBeans.Style.PointSymbolizer();
				symbolizer.icon_url = "images/marker-edit.png";
				symbolizer.icon_offset_x = 0;
				symbolizer.icon_offset_y = 0;
				break;
			case GeoBeans.Overlay.Type.PLOYLINE:
				symbolizer = new GeoBeans.Style.LineSymbolizer();
				symbolizer.width = 6;
				symbolizer.color = "rgba(255,0,0,1)";
				symbolizer.outLineCap = GeoBeans.Style.LineCap.ROUND;;
				symbolizer.outLineJoin =  GeoBeans.Style.LineJoin.ROUND;
				symbolizer.showOutline = true;	
				break;
			case GeoBeans.Overlay.Type.POLYGON:
				symbolizer = new GeoBeans.Style.PolygonSymbolizer();
				symbolizer.size = 8;
				symbolizer.fillColor = "rgba(255,0,0,1)";
				symbolizer.outLineWidth = 3.0;
				symbolizer.outLineColor = "Red";
				symbolizer.outLineCap	= GeoBeans.Style.LineCap.ROUND;
				symbolizer.outLineJoin  = GeoBeans.Style.LineJoin.ROUND;
				symbolizer.showOutline = true;				
			default:
				break;
		}
		return symbolizer;
	},

	//绘制编辑中的overlay
	drawEditOverlay : function(overlay,symbolizer){
		this.editRenderer.clearRect();
		this.editRenderer.setSymbolizer(symbolizer);
		var ret = this.editRenderer.drawOverlay(overlay, symbolizer, this.map.transformation);
		// this.map.drawLayersAll();
		if(ret){
			this.map.renderer.drawImage(this.editCanvas,0,0,this.editCanvas.width,this.editCanvas.height);
		}

	},

});