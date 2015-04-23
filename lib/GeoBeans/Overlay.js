GeoBeans.Overlay = GeoBeans.Class({
	geometry : null,
	symbolizer : null,
	name : null,
	layer : null,
	loadFlag : null,
	visible : true,
	isEdit : false,
	isHit : false,
	kvMap : {},



	initialize : function(name,geometry,symbolizer){
		this.name = name;
		this.geometry = geometry;
		this.symbolizer = symbolizer;
		this.loadFlag = GeoBeans.Overlay.Flag.READY;
		this.visible = true;
		this.kvMap = {};
	},

	setLayer : function(layer){
		this.layer = layer;
	},

	draw : function(){
		if(this.visible){
			this.loadFlag = GeoBeans.Overlay.Flag.LOADED;
			var transformation = this.layer.map.transformation;
			this.layer.renderer.setSymbolizer(this.symbolizer);
			this.layer.renderer.drawOverlay(this, this.symbolizer,transformation);			
			//如果是hit状态
			if(this.isHit){
				var symbolizer = this.layer.getHitOverlaySymbolizer(this);
				this.layer.drawHitOverlay(this,symbolizer);				
			}

			//如果是编辑状态
			if(this.isEdit){
				var symbolizer = this.layer.getEditOverlaySymbolizer(this);
				this.layer.drawEditOverlay(this,symbolizer);
			}
		}
	},

	setVisible : function(visible){
		this.visible = visible;
	},

	beginEdit : function(){
		var symbolizer = this.layer.getEditOverlaySymbolizer(this);
		this.layer.drawEditOverlay(this,symbolizer);
		this.isEdit = true;
	},

	endEdit : function(){
		this.isHit = false;
		this.isEdit = false;
		this.layer.editOverlay = null;
		this.layer.editRenderer.clearRect();
		this.layer.map.drawLayersAll();
	},

	getKeyValueMap : function(){
		return this.kvMap;
	},

	hasKey : function(key){
		if(key in this.kvMap){
			return true;
		}else{
			return false;
		}
	},

	getValue : function(key){
		if(this.hasKey(key)){
			return this.kvMap[key];
		}else{
			return null;
		}
	},

	removeKey : function(key){
		if(this.hasKey(key)){
			delete this.kvMap[key];
		}
	},

	addKeyValue : function(key,value){
		if(this.hasKey(key)){
			return;
		}else{
			this.kvMap[key] = value;
		}
	},

	removeKeys : function(){
		for(var key in this.kvMap){
			this.removeKey(key);
		}
		this.kvMap = {};
	},

	clone : function(){
		var geometry = new GeoBeans.Geometry();
		geometry = this.geometry;

		var symbolizer = new GeoBeans.Style.Symbolizer();
		symbolizer = this.symbolizer;

		var kvMap_c = {};

		var name = this.name;
		var overlay = new GeoBeans.Overlay(name,geometry,symbolizer);
		overlay.visible = this.visible;
		overlay.isEdit = this.isEdit;
		overlay.isHit = this.isHit;

		for(var key in this.kvMap){
			var value = this.kvMap[key];
			kvMap_c[key] = value;
		}
		overlay.kvMap = kvMap_c;
		return overlay;
	},

	getExtent : function(){
		var geometry = this.geometry;
		var extent = null;
		if(this.type == GeoBeans.Overlay.Type.MARKER){
			var x = geometry.x;
			var y = geometry.y;
			extent = new GeoBeans.Envelope(x-1,y-1,x+1,y+1);
		}else{
			extent = geometry.extent;
		}
		return extent;
	}
});

GeoBeans.Overlay.Type = {
	MARKER : 'Marker',
	PLOYLINE : 'Polyline',
	CIRCLE : 'Circle',
	POLYGON : 'Polygon'
};

GeoBeans.Overlay.Flag = {
	READY : "ready",
	LOADED : "loaded"
};