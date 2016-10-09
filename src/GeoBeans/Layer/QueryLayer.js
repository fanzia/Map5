GeoBeans.Layer.FeatureLayer.QueryLayer = GeoBeans.Class(GeoBeans.Layer.FeatureLayer,{
	layer : null,
	blinkFeature : null,//闪烁的feature
	blinkFeatureIndex : -1,
	timer : null,

	initialize : function(name){
		GeoBeans.Layer.prototype.initialize.apply(this, arguments);
	},

	setLayer : function(layer,style){
		if(layer == null){
			return;
		}
		this.layer = layer;
		if(style != null){
			this.style = style;
		}else{
			this.style = this.getStyle(layer.getGeomType());	
		}
	},

	setFeatures : function(features){
		this.features = features;
		this.blinkFeatureIndex = null;
		this.blinkFeature = null;
		clearInterval(this.timer);
	},

	clearFeatures : function(){
		// this.canvas.
		this.features = null;
		this.layer = null;
		this.style = null;
		this.blinkFeatureIndex = null;
		this.blinkFeature = null;
		// this.map.drawLayersAll();
		this.map.draw();
	},

	load : function(){
		this.flag = GeoBeans.Layer.Flag.LOADED;
		this.renderer.clearRect();
		if(this.style == null || this.features == null
			|| this.layer == null){
			return;
		}
		var rules = this.style.rules;
		if(rules == null || rules.length == 0){
			return;
		}
		for(var i = 0; i < rules.length; ++i){
			var rule = rules[i];
			// var features =  this.selectFeatures(rule.filter);
			var features = this.selectFeaturesByFilter(rule.filter,this.features);

			if(rule.symbolizer != null){
				if(rule.symbolizer.symbol!=null){
					this.renderer.drawIcons(features, rule.symbolizer, this.map.getViewer());
				}else{
					this.drawFeatures(features, rule.symbolizer);
				}	
			}

			if(rule.textSymbolizer != null){
				this.labelFeatures(features,rule.textSymbolizer);
			}
		}
		
	},

	//根据
	getStyle : function(geomType){
		if(geomType == null){
			return null;
		}
		
		var style = null;
		switch(geomType){
			case GeoBeans.Geometry.Type.POINT:
			case GeoBeans.Geometry.Type.MULTIPOINT:{
				style = new GeoBeans.Style.FeatureStyle();
				var rule = new GeoBeans.Style.Rule();
				var symbolizer = new GeoBeans.Symbolizer.PointSymbolizer();
				symbolizer.fill.color.set(255,0,0,1);
				symbolizer.stroke.color.set(252,240,244,0.9);
				rule.symbolizer = symbolizer;
				style.addRule(rule);
				break;
			}
			case GeoBeans.Geometry.Type.LINESTRING:
			case GeoBeans.Geometry.Type.MULTILINESTRING:{
				style = new GeoBeans.Style.FeatureStyle();
				var rule = new GeoBeans.Style.Rule();
				var symbolizer = new GeoBeans.Symbolizer.LineSymbolizer();
				symbolizer.stroke.color.set(255,0,0,1);
				symbolizer.stroke.width = 4;
				rule.symbolizer = symbolizer;
				style.addRule(rule);
				break;
				break;
			}
			case GeoBeans.Geometry.Type.POLYGON:
			case GeoBeans.Geometry.Type.MULTIPOLYGON:{
				style = new GeoBeans.Style.FeatureStyle();
				var rule = new GeoBeans.Style.Rule();
				var symbolizer = new GeoBeans.Symbolizer.PolygonSymbolizer(); 
				symbolizer.fill.color.set(255,0,0,1);
				symbolizer.stroke.color.set(252,240,244,0.9);
				rule.symbolizer = symbolizer;
				style.addRule(rule);
				break;
			}
			default:
				break;
		}
		return style;
	},

	//闪烁
	setFeatureBlink : function(feature,count){
		if(feature == null || count == null || this.features == null){
			return;
		}
		if(this.blinkFeature != null){
			clearInterval(this.timer);
			if(this.features.indexOf(this.blinkFeature) == -1){
				this.features.splice(this.blinkFeatureIndex
					,0,this.blinkFeature);
				this.map.drawLayersAll();
			}
			 
		}
		this.blinkFeature = feature;
		var that = this;
		var index = this.features.indexOf(feature);
		this.blinkFeatureIndex = index;
		if(index == -1){
			return;
		}
		
		var flag = false;
		
		var timer = setInterval(function(){
			if(count == 0 || that.features == null){
				clearInterval(timer);
				return;
			}
			if(flag){
				
				that.features.splice(index,0,feature);
				// that.features.push(feature);
				that.map.drawLayersAll();
				flag = false;
				count--;
			}else{
				// index = that.features.indexOf(feature);
				
				that.features.splice(index,1);
				that.map.drawLayersAll();
				flag = true;
			}
			
		}, 500);
		this.timer = timer;

	}

});