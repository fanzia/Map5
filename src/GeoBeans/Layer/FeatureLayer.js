
GeoBeans.Layer.FeatureLayer = GeoBeans.Class(GeoBeans.Layer, {
	
	features : null,
	
	style : null,
		
	geometryType : null,
	
	featureType : null,
	
	enableHit : false,
	selection : null,
	unselection : null,

	hitControl : null,
	hitEvent : null,
	hitTooltipEvent : null,

	//选中的绘制图层
	hitCanvas : null,
	hitRenderer : null,

	//缓冲区图层
	bufferCanvas : null,
	bufferRenderer : null,
	bufferFeatures : null,
	bufferSymbolizer : null,


	// click
	clickStyle : null,
	clickFeature : null,
	clickCanvas : null,
	clickRenderer : null,


	//绘制辅助元素
	bufferTracker : null,
	
	initialize : function(name){
		GeoBeans.Layer.prototype.initialize.apply(this, arguments);
		
		this.featureType = null;
		// this.features = [];
		this.features = null;
		
		this.selection = [];
		this.unselection = [];

	},
	
	CLASS_NAME : "GeoBeans.Layer.FeatureLayer",

	destroy : function(){
		this.features = null;
		this.style = null;
		this.renderer = null;
		this.geometryType = null;
		
		this.featureType = null;
		this.unRegisterClickEvent();
		
		GeoBeans.Layer.prototype.destroy.apply(this, arguments);
	},

	setMap : function(map){
		GeoBeans.Layer.prototype.setMap.apply(this, arguments);	
		this.clickCanvas = document.createElement("canvas");
		this.clickCanvas.width = this.canvas.width;
		this.clickCanvas.height = this.canvas.height;
		this.clickRenderer  = new GeoBeans.Renderer(this.clickCanvas);
	},
	
	addFeature : function(feature){
		if(feature!=null){
			if(this.features == null){
				this.features = [];
			}
			this.features.push(feature);
		}
	},
	

	addFeatureObj : function(fid,geometry,values){
		if(fid == null || values == null || geometry == null){
			return;
		}
		var feature = new GeoBeans.Feature(this.featureType,fid,geometry,values);
		this.addFeature(feature);
	},

	addFeatures : function(features){
		if(features==null){
			return;	
		}
		if(!(features instanceof Array)){
			return ;
		}
		for(var i=0,len=features.length; i<len; i++){
			var f = features[i];
			this.features.push(f);
		}
	},

	getFeatures : function(){
		return this.features;
	},
	
	getFeature : function(i){
		if(i<0){
			return null;
		}
		if(i>=this.features.length){
			return null;
		}
		return this.features[i];
	},

	getFeatureByID : function(id){
		if(this.features == null){
			return null;
		}
		var feature = null;
		for(var i = 0; i < this.features.length; ++i){
			feature = this.features[i];
			if(feature != null && feature.fid == id){
				return feature;
			}
		}
		return null;
	},
	
	setStyle : function(style){
		this.style = style;
		this.flag = GeoBeans.Layer.Flag.READY;
	},
	
	count : function(){
		return this.features.length;
	},
	
	// draw : function(){
	// 	var style = this.style;
	// 	if(style==null){
	// 		return;
	// 	}
	// 	rules = style.rules;
	// 	if(rules.length==0){
	// 		return;
	// 	}
	// 	for(var i=0; i<rules.length; i++){
	// 		var rule = rules[i];
	// 		var features = this.selectFeatures(rule.filter);						
	// 		this.drawFeatures(features, rule.symbolizer);
	// 	}
	// },
	/******************************************************************/
	/* Draw Layer                                                     */
	/******************************************************************/

	load : function(){
		var viewer = this.map.getViewer();
		var extent = viewer.getExtent();
		if(extent != null && this.viewer != null && extent.equal(this.viewer)
			&& this.flag == GeoBeans.Layer.Flag.LOADED){
			this.flag = GeoBeans.Layer.Flag.LOADED;
			var bboxFilter = new GeoBeans.BBoxFilter(this.featureType.geomFieldName,this.viewer);
			var features = this.selectFeaturesByFilter(bboxFilter,this.features);
			this.drawLabelFeatures(features);
			this.drawClickLayer();
			return;
		}
		
		this.viewer = new GeoBeans.Envelope(extent.xmin,extent.ymin,
			extent.xmax,extent.ymax);
		this.renderer.clearRect();
		var bboxFilter = new GeoBeans.BBoxFilter(this.featureType.geomFieldName,this.viewer);
		var features = this.selectFeaturesByFilter(bboxFilter,this.features);
		console.log("count:" + features.length);
		this.drawLayerFeatures(features);
		this.drawClickLayer();
		this.flag = GeoBeans.Layer.Flag.LOADED;

	},

	//绘制要素
	drawLayerFeatures : function(features){
		var style = this.style;
		if(style==null){
			style = this.getDefaultStyle();
			if(style == null){
				return;
			}
			this.style = style;
		}
		rules = style.rules;
		if(rules.length==0){
			return;
		}
		for(var i=0; i<rules.length; i++){
			var rule = rules[i];
			var selection = this.selectFeaturesByFilter(rule.filter,features);
			if(rule.symbolizer != null){
				if(rule.symbolizer.symbol != null){
					this.renderer.drawIcons(selection, rule.symbolizer, this.map.getViewer());
				}else{
					this.drawFeatures(selection, rule.symbolizer);
				}	
			}

			if(rule.textSymbolizer != null){
				this.labelFeatures(selection,rule.textSymbolizer);
			}
		}
		
	},

	drawLayer : function(){
		var style = this.style;
		if(style==null){
			style = this.getDefaultStyle();
			if(style == null){
				return;
			}
			this.style = style;
		}
		rules = style.rules;
		if(rules.length==0){
			return;
		}
		for(var i=0; i<rules.length; i++){
			var rule = rules[i];
			var features = this.selectFeaturesByFilter(rule.filter,this.features);
			if(rule.symbolizer != null){
				if(rule.symbolizer.symbol != null){
					this.renderer.drawIcons(features, rule.symbolizer, this.map.getViewer());
				}else{
					this.drawFeatures(features, rule.symbolizer);
				}	
			}

			if(rule.textSymbolizer != null){
				this.labelFeatures(features,rule.textSymbolizer);
			}
		}
		this.drawClickLayer();
	},


	getGeomType : function(){
		var featureType = this.featureType;
		if(featureType == null){
			return null;
		}	
		var geomFieldName = featureType.geomFieldName;
		if(geomFieldName == null){
			return null;
		}
		var geomFieldIndex = featureType.getFieldIndex(geomFieldName);
		if(geomFieldIndex == null){
			return null;
		}
		var geomField = featureType.fields[geomFieldIndex];
		if(geomField == null){
			return null;
		}
		var geomType = geomField.geomType;
		return geomType;
	},

	//获取点线面的样式
	getDefaultStyle : function(){
		var geomType = this.getGeomType();
		var style = null; 
		switch(geomType){
			case GeoBeans.Geometry.Type.POINT:
			case GeoBeans.Geometry.Type.MULTIPOINT:{
				style = new GeoBeans.Style.FeatureStyle("default",
					GeoBeans.Style.FeatureStyle.GeomType.Point);
				var rule = new GeoBeans.Rule();
				var symbolizer = new GeoBeans.Symbolizer.PointSymbolizer();
				rule.symbolizer = symbolizer;
				style.addRule(rule);
				break;
			}
			case GeoBeans.Geometry.Type.LINESTRING:
			case GeoBeans.Geometry.Type.MULTILINESTRING:{
				style = new GeoBeans.Style.FeatureStyle("default",
					GeoBeans.Style.FeatureStyle.GeomType.LineString);
				var rule = new GeoBeans.Rule();
				var symbolizer = new GeoBeans.Symbolizer.LineSymbolizer();
				rule.symbolizer = symbolizer;
				style.addRule(rule);
				break;
			}
			case GeoBeans.Geometry.Type.POLYGON:
			case GeoBeans.Geometry.Type.MULTIPOLYGON:{
				style = new GeoBeans.Style.FeatureStyle("default",
					GeoBeans.Style.FeatureStyle.GeomType.Polygon);
				var rule = new GeoBeans.Rule();
				var symbolizer = new GeoBeans.Symbolizer.PolygonSymbolizer(); 
				rule.symbolizer = symbolizer;
				style.addRule(rule);
				break;
			}
			default :
				break;
		}

		return style;
	},
	
	drawFeatures : function(features, symbolizer){		
		if(features.length==0){
			return;
		}
		

		this.renderer.save();
		this.renderer.setSymbolizer(symbolizer);
		for(var i=0,len=features.length; i<len; i++){
			feature = features[i];
			if((symbolizer!=null) && (symbolizer!='undefined')){
				this.renderer.draw(feature, symbolizer, this.map.getViewer());
			}
		}
		this.renderer.restore();
	},

	// 单独绘制文本
	drawLabelFeatures : function(features){
		var style = this.style;
		if(style==null){
			style = this.getDefaultStyle();
			if(style == null){
				return;
			}
			this.style = style;
		}
		rules = style.rules;
		if(rules.length==0){
			return;
		}
		for(var i=0; i<rules.length; i++){
			var rule = rules[i];
			// var features = this.selectFeatures(rule.filter);
			var selection = this.selectFeaturesByFilter(rule.filter,features);

			if(rule.textSymbolizer != null){
				this.labelFeatures(selection,rule.textSymbolizer);
			}
		}
	},

	// 加上碰撞检测的文字样式
	labelFeatures : function(features,symbolizer){
		if(features == null || features.length == 0){
			return;
		}

		this.renderer.save();
		this.renderer.setSymbolizer(symbolizer);
		var feature = features[0];
		var text = null;
		var labelText = symbolizer.labelText;
		if(labelText == null || labelText.length == 0){
			var labelProp = symbolizer.labelProp;
			if(labelProp != null){
				var findex = feature.featureType.getFieldIndex(labelProp);
			}
		}else{
			text = labelText;
		}

		var value = null;
		var geometry = null;
		var label = null;
		for(var i=0,len=features.length; i<len; i++){
			feature = features[i];
			geometry = feature.geometry;
			if(geometry == null){
				continue;
			}
			label = new GeoBeans.PointLabel();
			label.geometry = geometry;
			label.textSymbolizer = symbolizer;
			if(text == null){
				value = feature.values[findex];
			}else{
				value = text;
			}
			label.text = value;
			label.computePosition(this.renderer,this.map.getViewer());
			label.adjustPosition(this.canvas.width,this.canvas.height);
			if(!this.map.maplex.isCollision(label)){
				this.map.maplex.addLabel(this.name,label);
			}
		}		

		this.renderer.restore();

	},
	
	// drawFeature : function(feature, symbolizer){
	// 	var rules = this.selectRules(feature);
	// 	var len = rules.length;
	// 	for(var i=0; i<len; i++){
	// 		var r = rules[i];
	// 		if( (symbolizer==null) || (symbolizer=='undefined')){
	// 			symbolizer = r.symbolizer;
	// 		}
	// 		this.map.renderer.save();
	// 		this.map.renderer.setSymbolizer(symbolizer);
	// 		if(symbolizer instanceof GeoBeans.Symbolizer.TextSymbolizer){
	// 			var findex = feature.featureType.getFieldIndex(symbolizer.field);
	// 			this.map.renderer.label(feature.geometry, feature.values[findex], symbolizer, this.map.transformation);
	// 		}
	// 		else{
	// 			this.map.renderer.draw(feature, symbolizer, this.map.transformation);
	// 		}
	// 		this.map.renderer.restore();
	// 	}
	// 	rules = null;
	// },
	
	// clearFeature : function(feature){
	// 	switch(feature.geometry.type){
	// 		case GeoBeans.Geometry.Type.POINT:
	// 		case GeoBeans.Geometry.Type.MULTIPOINT:{
	// 				var s = this.getSymbolizer(feature);
	// 				this.map.renderer.clear(feature.geometry, this.map.bgColor, s.size, this.map.transformation);	
	// 			}
	// 			break;
	// 		default:{
	// 			this.map.renderer.clear(feature.geometry, this.map.bgColor, 0, this.map.transformation);
	// 		}
	// 	}
	// },
	
	selectFeatures : function(filter){
		if(filter == null){
			return this.features;
		}
		var type = filter.type;
		if(type == GeoBeans.Filter.Type.FilterComparsion){
			var field = null;
			var value = null;
			var expression1 = filter.expression1;
			if(expression1 != null){
				if(expression1.type == 
					GeoBeans.Expression.Type.PropertyName){
					field = expression1.name;
				}else if(expression1.type == 
					GeoBeans.Expression.Type.Literal){
					value = expression1.value;
				}
			}
			
			var expression2 = filter.expression2;
			if(expression2 != null){
				if(expression2.type == 
					GeoBeans.Expression.Type.PropertyName){
					field = expression2.name;
				}else if(expression2.type == 
					GeoBeans.Expression.Type.Literal){
					value = expression2.value;
				}
			}
		}
		if(field == null || value == null){
			return this.features;
		}
		var selection = [];
		var findex = this.featureType.getFieldIndex(field);
		if(findex >= 0){
			var feature = null;
			var length = this.features.length;
			for(var i = 0; i < length; ++i){
				feature = this.features[i];
				fvalue = feature.values[findex];
				if(fvalue == value){
					selection.push(feature);
				}
			}
		}
		return selection;
	},

	selectFeaturesByFilter : function(filter,features,maxFeatures,offset){
		if(filter == null){
			return features;
		}
		var type = filter.type;
		var selection = features; 
		switch(type){
			case GeoBeans.Filter.Type.FilterID:{
				selection = this.selectFeaturesByIDFilter(filter,features,maxFeatures,offset);
				break;
			}
			case GeoBeans.Filter.Type.FilterComparsion:{
				selection = this.selectFeaturesByComparsion(filter,features,maxFeatures,offset);
				break;
			}
			case GeoBeans.Filter.Type.FilterLogic:{
				selection = this.selectFeatureByLogic(filter,features,maxFeatures,offset);
				break;
			}
			case GeoBeans.Filter.Type.FilterSpatial:{
				selection = this.selectFeaturesBySpatial(filter,features,maxFeatures,offset);
				break;
			}
		}
		return selection;
	},

	selectFeaturesByIDFilter : function(filter,features,maxFeatures,offset){
		if(filter == null){
			return features;
		}
		var ids = filter.ids;
		if(ids == null){
			return features;
		}

		var total =null;
		if(maxFeatures != null){
			total = maxFeatures;
		}
		if(offset != null){
			total += offset;
		}

		var selection = [];
		for(var i = 0; i < features.length; ++i){
			var feature = features[i];
			var fid = feature.fid;
			if(ids.indexOf(fid) != -1){
				selection.push(feature);
				if(total != null && selection.length == total){
					break;
				}
			}
		}
		
		var result = null;
		if(maxFeatures != null && offset != null){
			result = selection.slice(offset,total);
		}else if(maxFeatures != null && offset == null){
			result = selection.slice(0,maxFeatures);
		}else if(maxFeatures == null && offset != null){
			result = selection.slice(offset);
		}else{
			result = selection;
		}
		return result;
	},

	selectFeaturesByComparsion : function(filter,features,maxFeatures,offset){
		if(filter == null){
			return features;
		}
		
		var total =null;
		if(maxFeatures != null){
			total = maxFeatures;
		}
		if(offset != null){
			total += offset;
		}

		var oper = filter.operator;
		var selection = [];

		var field = null;
		var value = null;
		var expression1 = filter.expression1;
		if(expression1 != null){
			if(expression1.type == GeoBeans.Expression.Type.PropertyName){
				field = expression1.name;
			}else if(expression1.type == GeoBeans.Expression.Type.Literal){
				value = expression1.value;
			}
		}

		var expression2 = filter.expression2;
		if(expression2 != null){
			if(expression2.type == GeoBeans.Expression.Type.PropertyName){
				field = expression2.name;
			}else if(expression2.type == GeoBeans.Expression.Type.Literal){
				value = expression2.value;
			}
		}

		switch(oper){
			case GeoBeans.ComparisionFilter.OperatorType.ComOprEqual:{
				if(field == null || value == null){
					selection = features;
					break;
				}

				var findex = this.featureType.getFieldIndex(field);
				if(findex == -1){
					selection = features;
					break;
				}

				var feature = null,fvalue = null;
				for(var i = 0; i < features.length;++i){
					feature = features[i];
					fvalue = feature.values[findex];
					if(fvalue == value){
						selection.push(feature);
					}
					if(total != null && selection.length == total){
						break;
					}
				}
				break;
			}
			case GeoBeans.ComparisionFilter.OperatorType.ComOprNotEqual:{
				if(field == null || value == null){
					selection = features;
					break;
				}

				var findex = this.featureType.getFieldIndex(field);
				if(findex == -1){
					selection = features;
					break;
				}

				var feature = null,fvalue = null;
				for(var i = 0; i < features.length;++i){
					feature = features[i];
					fvalue = feature.values[findex];
					if(fvalue != value){
						selection.push(feature);
					}
					if(total != null && selection.length == total){
						break;
					}
				}
				break;
			}
			case GeoBeans.ComparisionFilter.OperatorType.ComOprLessThan:{
				if(field == null || value == null){
					selection = features;
					break;
				}

				var findex = this.featureType.getFieldIndex(field);
				if(findex == -1){
					selection = features;
					break;
				}

				var feature = null,fvalue = null;
				for(var i = 0; i < features.length;++i){
					feature = features[i];
					fvalue = feature.values[findex];
					if(fvalue < value){
						selection.push(feature);
					}
					if(total != null && selection.length == total){
						break;
					}
				}				
				break;
			}
			case GeoBeans.ComparisionFilter.OperatorType.ComOprGreaterThan:{
				if(field == null || value == null){
					selection = features;
					break;
				}

				var findex = this.featureType.getFieldIndex(field);
				if(findex == -1){
					selection = features;
					break;
				}

				var feature = null,fvalue = null;
				for(var i = 0; i < features.length;++i){
					feature = features[i];
					fvalue = feature.values[findex];
					if(fvalue > value){
						selection.push(feature);
					}
					if(total != null && selection.length == total){
						break;
					}
				}
				break;
			}
			case GeoBeans.ComparisionFilter.OperatorType.ComOprLessThanOrEqual:{
				if(field == null || value == null){
					selection = features;
					break;
				}

				var findex = this.featureType.getFieldIndex(field);
				if(findex == -1){
					selection = features;
					break;
				}

				var feature = null,fvalue = null;
				for(var i = 0; i < features.length;++i){
					feature = features[i];
					fvalue = feature.values[findex];
					if(fvalue <= value){
						selection.push(feature);
					}
					if(total != null && selection.length == total){
						break;
					}
				}
				break;
			}
			case GeoBeans.ComparisionFilter.OperatorType.ComOprGreaterThanOrEqual:{
				if(field == null || value == null){
					selection = features;
					break;
				}

				var findex = this.featureType.getFieldIndex(field);
				if(findex == -1){
					selection = features;
					break;
				}

				var feature = null,fvalue = null;
				for(var i = 0; i < features.length;++i){
					feature = features[i];
					fvalue = feature.values[findex];
					if(fvalue >= value){
						selection.push(feature);
					}
					if(total != null && selection.length == total){
						break;
					}
				}
				break;
			}
			case GeoBeans.ComparisionFilter.OperatorType.ComOprIsLike:{
				if(field == null || value == null){
					selection = features;
					break;
				}

				var findex = this.featureType.getFieldIndex(field);
				if(findex == -1){
					selection = features;
					break;
				}

				var feature = null,fvalue = null;
				for(var i = 0; i < features.length;++i){
					feature = features[i];
					fvalue = feature.values[findex];
					if(fvalue.like(value)){
						selection.push(feature);
					}
					if(total != null && selection.length == total){
						break;
					}
				}
				break;
			}
			case GeoBeans.ComparisionFilter.OperatorType.ComOprIsNull:{
				// if(field == null || value == null){
				// 	selection = features;
				// 	break;
				// }
				var properyName = filter.properyName;
				var field = properyName.name;
				var findex = this.featureType.getFieldIndex(field);
				if(findex == -1){
					selection = features;
					break;
				}

				var feature = null,fvalue = null;
				for(var i = 0; i < features.length;++i){
					feature = features[i];
					fvalue = feature.values[findex];
					if(fvalue == null){
						selection.push(feature);
					}
					if(total != null && selection.length == total){
						break;
					}
				}
				break;
			}
			case GeoBeans.ComparisionFilter.OperatorType.ComOprIsBetween:{
				var expression = filter.expression;
				var lowerBound = filter.lowerBound;
				var upperBound = filter.upperBound;

				var field = expression.name;
				var lowerValue = lowerBound.value;
				var upperValue = upperBound.value;
				if(field == null || lowerValue == null || upperValue == null){
					selection = features;
					break;
				}
				var findex = this.featureType.getFieldIndex(field);
				if(findex == -1){
					selection = features;
					break;
				}

				var feature = null,fvalue = null;
				for(var i = 0; i < features.length;++i){
					feature = features[i];
					fvalue = feature.values[findex];
					if(fvalue >= lowerValue && fvalue <= upperValue){
						selection.push(feature);
					}
					if(total != null && selection.length == total){
						break;
					}

				}

				break;
			}
		}
		var result = null;
		if(maxFeatures != null && offset != null){
			result = selection.slice(offset,total);
		}else if(maxFeatures != null && offset == null){
			result = selection.slice(0,maxFeatures);
		}else if(maxFeatures == null && offset != null){
			result = selection.slice(offset);
		}else{
			result = selection;
		}
		return result;
	},

	// 逻辑查询
	selectFeatureByLogic : function(filter,features,maxFeatures,offset){
		if(filter == null){
			return features;
		}

		var total =null;
		if(maxFeatures != null){
			total = maxFeatures;
		}
		if(offset != null){
			total += offset;
		}

		var selection = features;

		var oper = filter.operator;
		switch(oper){
			case GeoBeans.LogicFilter.OperatorType.LogicOprAnd:{
				selection = this.selectFeatureByLogicAnd(filter,features,maxFeatures,offset); 
				break;
			}
			case GeoBeans.LogicFilter.OperatorType.LogicOprOr:{
				selection = this.selectFeatureByLogicOr(filter,features,maxFeatures,offset);
				break;
			}
			case GeoBeans.LogicFilter.OperatorType.LogicOprNot:{
				selection = this.selectFeatureByLogicNot(filter,features,maxFeatures,offset);
				break;
			}
			default:
				break;
		}

		return selection;
	},

	selectFeatureByLogicAnd : function(filter,features,maxFeatures,offset){
		if(filter == null){
			return features;
		}

		var total =null;
		if(maxFeatures != null){
			total = maxFeatures;
		}
		if(offset != null){
			total += offset;
		}

		var selection = features;
		var filters = filter.filters;
		for(var i = 0; i < filters.length;++i){
			var f = filters[i];
			selection = this.selectFeaturesByFilter(f,selection,null,null);
		}

		var result = null;
		if(maxFeatures != null && offset != null){
			result = selection.slice(offset,total);
		}else if(maxFeatures != null && offset == null){
			result = selection.slice(0,maxFeatures);
		}else if(maxFeatures == null && offset != null){
			result = selection.slice(offset);
		}else{
			result = selection;
		}
		return result;
	},

	selectFeatureByLogicOr : function(filter,features,maxFeatures,offset){
		if(filter == null){
			return features;
		}

		var total =null;
		if(maxFeatures != null){
			total = maxFeatures;
		}
		if(offset != null){
			total += offset;
		}

		var selection = [];
		var filters = filter.filters;
		for(var i = 0; i < filters.length;++i){
			var f = filters[i];
			var selected = this.selectFeaturesByFilter(f,features,null,null);
			selection = this.concatArray(selection,selected);
			if(total != null && selection.length >= total){
				break;
			}
		}

		var result = null;
		if(maxFeatures != null && offset != null){
			result = selection.slice(offset,total);
		}else if(maxFeatures != null && offset == null){
			result = selection.slice(0,maxFeatures);
		}else if(maxFeatures == null && offset != null){
			result = selection.slice(offset);
		}else{
			result = selection;
		}
		return result;
	},

	concatArray : function(array1,array2){
		if(!$.isArray(array1) || !$.isArray(array2)){
			return;
		}
		var array = array1.slice(0,array1.length);
		for(var i = 0; i < array2.length;++i){
			if($.inArray(array2[i],array) == -1){
				array.push(array2[i]);
			}
		}
		return array;
	},

	selectFeatureByLogicNot : function(filter,features,maxFeatures,offset){
		if(filter == null){
			return features;
		}
		var total =null;
		if(maxFeatures != null){
			total = maxFeatures;
		}
		if(offset != null){
			total += offset;
		}

		var f = filter.filters[0];
		var selection = this.selectFeaturesByFilter(f,features,maxFeatures,offset);
		var s = [];
		for(var i = 0; i < features.length; ++i){
			if($.inArray(features[i],selection) == -1){
				s.push(features[i]);
			}
			if(total != null && selection.length >= total){
				break;
			}
		}
		var result = null;
		if(maxFeatures != null && offset != null){
			result = s.slice(offset,total);
		}else if(maxFeatures != null && offset == null){
			result = s.slice(0,maxFeatures);
		}else if(maxFeatures == null && offset != null){
			result = s.slice(offset);
		}else{
			result = s;
		}
		return result;

	},
	
	selectRules : function(f){
		var rules = [];
		
		if(this.style!=null){
			var len = this.style.rules.length;
			for(var i=0; i<len; i++){
				var r = this.style.rules[i];
				if(r.filter!=null){
					var fname = r.filter.field;
					var value = null;
					var findex = this.featureType.getFieldIndex(fname);
					value = f.values[findex];
					if(value==r.filter.value){
						rules.push(r);
					}	
				}
				else{
					rules.push(r);
				}
			}
		}
		return rules;
	},
	
	getSymbolizer : function(feature){
		var rules = this.selectRules(feature);
		var len = rules.length;
		for(var i=0; i<len; i++){
			var r = rules[i];
			var s = r.symbolizer;
			if(!(s instanceof GeoBeans.Style.TextSymbolizer)){
				return s;
			}
		}
		return null;
	},


	selectFeaturesBySpatial : function(filter,features,maxFeatures,offset){
		if(filter == null){
			return features;
		}
		var oper = filter.operator;
		var selection = features;
		switch(oper){
			case GeoBeans.SpatialFilter.OperatorType.SpOprBBox:{
				selection = this.selectFeaturesByBBoxFilter(filter,features,maxFeatures,offset);
				break;
			}
			default:
				break;
		}
		return selection;
	},

	selectFeaturesByBBoxFilter : function(filter,features,maxFeatures,offset){
		if(filter == null){
			return features;
		}

		var extent = filter.extent;

		var geomType = this.getGeomType();

		var selection = [];

		var total =null;
		if(maxFeatures != null){
			total = maxFeatures;
		}
		if(offset != null){
			total += offset;
		}

		for(var i = 0; i < features.length;++i){
			var f = features[i];
			var g = f.geometry;
			if(g == null){
				continue;
			}
			var g_extent = g.extent;
			if(extent.intersects(g_extent) || extent.containOther(g_extent)){
				selection.push(f);
			}
			if(total != null && selection.length == total){
				break;
			}
		}
		var result = null;
		if(maxFeatures != null && offset != null){
			result = selection.slice(offset,total);
		}else if(maxFeatures != null && offset == null){
			result = selection.slice(0,maxFeatures);
		}else if(maxFeatures == null && offset != null){
			result = selection.slice(offset);
		}else{
			result = selection;
		}
		return result;
	},

	getFeatureBBoxGet : function(bbox,maxFeatures,offset){
		var bboxFilter = new GeoBeans.BBoxFilter(this.featureType.geomFieldName,bbox);
		return this.selectFeaturesByFilter(bboxFilter,this.features,maxFeatures,offset);
	},
	/******************************************************************/
	/* Draw Layer End                                                 */
	/******************************************************************/

	setHitControl : function(control){
		if((control==null) || (control=='undefined')){
			return;
		}
		this.hitControl = null;
		this.hitControl = control;
	},
	
	init : function(){
	},
	
	enableHit : function(enable){
		this.enableHit = enable;
	},
	
	hit : function(x, y, callback){
		if(this.features==null){
			return;
		}
		
		var render = this.map.renderer;
		
		// this.unselection = this.selection;
		this.selection = [];
		
		var i=0, j=0;
		var f=null, g=null;
		var len = this.features.length;
		for(i=0; i<len; i++){
			f = this.features[i];
			g = f.geometry;
			if(g!=null){
				if(g.hit(x, y, this.map.tolerance)){
					this.selection.push(f);
				}
			}
		}
		
		this.hitRenderer.clearRect(0,0,this.hitCanvas.height,this.hitCanvas.width);
		this.map.drawLayersAll();
		if(callback!=undefined){
			var point = new GeoBeans.Geometry.Point(x,y);
			callback(this, this.selection,point);
		}
	},
	
	registerHitEvent : function(callback){
		var map = this.map;
		var layer = this;
		var x_o = null;
		var y_o = null;
		var tolerance = 10;

		this.hitCanvas = document.createElement("canvas");
		this.hitCanvas.width = this.canvas.width;
		this.hitCanvas.height = this.canvas.height;

		this.hitRenderer  = new GeoBeans.Renderer(this.hitCanvas);


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
				
					var mp = map.getViewer().toMapPoint(evt.layerX, evt.layerY);
					
					layer.hit(mp.x, mp.y, callback);
				}
			}
			
		};
		map.mapDiv[0].addEventListener('mousemove', this.hitEvent);
		this.events.addEvent('mousemove', this.hitEvent);
	},

	unRegisterHitEvent : function(){
		this.map.mapDiv[0].removeEventListener('mousemove',this.hitEvent);
		this.hitRenderer.clearRect(0,0,this.hitCanvas.height,this.hitCanvas.width);
		this.map.drawLayersAll();
		this.hitEvent = null;
	},

	//绘制选中的图层
	drawHitFeature : function(feature, symbolizer){

		var rules = this.selectRules(feature);
		var len = rules.length;
		for(var i=0; i<len; i++){
			var r = rules[i];
			if( (symbolizer==null) || (symbolizer=='undefined')){
				symbolizer = r.symbolizer;
			}
			this.hitRenderer.save();
			this.hitRenderer.setSymbolizer(symbolizer);
			if(symbolizer instanceof GeoBeans.Symbolizer.TextSymbolizer){
				var findex = feature.featureType.getFieldIndex(symbolizer.field);
				this.hitRenderer.label(feature.geometry, feature.values[findex], symbolizer, this.map.getViewer());
			}
			else{
				this.hitRenderer.draw(feature, symbolizer, this.map.getViewer());
			}
			this.hitRenderer.restore();
		}
		rules = null;

		// this.map.drawHitLayer();
		this.map.drawLayersAll();
	},	

	cleanup : function(){
		this.enableHit = false;
		this.map.canvas.removeEventListener('mousemove', this.hitEvent);
		this.map.canvas.removeEventListener('mousemove', this.hitTooltipEvent);
	},
	

	registerHitTooltipEvent : function(callback){
		var map = this.map;
		var layer = this;
		var x_o = null;
		var y_o = null;
		var tolerance = 10;

		this.hitTooltipEvent = function(evt){
			if(x_o==null){
				x_o = evt.layerX;
				y_o = evt.layerY;
			}
			else{
				var dis = Math.abs(evt.layerX-x_o) + Math.abs(evt.layerY-y_o);
				if(dis > tolerance){
					x_o = evt.layerX;
					y_o = evt.layerY;
					layer.hitTooltip(evt.layerX, evt.layerY, callback);
				}
			}
			
		};

		map.canvas.addEventListener("mousemove", this.hitTooltipEvent);
	},

	unregisterHitTooltipEvent : function(){
		this.map.canvas.removeEventListener("mousemove",this.hitTooltipEvent);
		this.hitTooltipEvent = null;
	},

	hitTooltip : function(x, y, callback){
		if(this.features==null || callback == null){
			return;
		}
		var map = this.map;
		var mp = map.getViewer().toMapPoint(x, y);

		var layerX = mp.x;
		var layerY = mp.y;

		var render = this.map.renderer;

		var i=0, j=0;
		var f=null, g=null;
		var len = this.features.length;
		for(i=0; i<len; i++){
			f = this.features[i];
			g = f.geometry;
			if(g!=null){
				if(g.hit(layerX, layerY, this.map.tolerance)){
					// callback(this,x,y,f);
					callback(this,layerX,layerY,f);
					return;
				}
			}
		}
		// callback(this,x,y,null);
		callback(this,layerX,layerY,null);		
	},

/***********************缓冲区*******************************************/
	// getBufferTracker : function(){
	// 	if(this.bufferTracker == null){
	// 		var bufferTracker = new GeoBeans.Control.TrackBufferControl();
	// 		var index = this.map.controls.find(bufferTracker.type); 
	// 		if(index == -1){
	// 			this.bufferTracker = bufferTracker;
	// 			this.map.controls.add(this.bufferTracker);
	// 		}else{
	// 			this.bufferTracker = this.map.controls.get(index);
	// 		}
	// 	}
	// 	return this.bufferTracker;
	// },

	// //线缓冲区
	// queryByBufferLine : function(distance,callback){
	// 	var bufferTracker = this.getBufferTracker(); 
	// 	bufferTracker.trackBufferLine(this,distance,callback,this.callbackQueryByBufferTrack);
	// },


	// //圆缓冲区
	// queryByBufferCircle : function(callback){
	// 	var bufferTracker = this.getBufferTracker();
	// 	bufferTracker.trackBufferCircle(this,callback,this.callbackQueryByBufferTrack);
	// },

	// //回调函数，调用wfs的
	// callbackQueryByBufferTrack : function(layer,distance,geometry,callback){
	// 	if(geometry == null || distance < 0){
	// 		return;
	// 	}

	// 	var featureType = layer.featureType;
	// 	if(featureType == null){
	// 		return;
	// 	}

	// 	var workspace = layer.workspace;
	// 	if(workspace == null){
	// 		return;
	// 	}
	// 	workspace.queryByBuffer(distance,geometry,featureType,callback);

	// },

/***********************插入更新*******************************************/
	//插入
	beginTransaction : function(callback){
		var geomFieldIndex = this.featureType.getFieldIndex(this.featureType.geomFieldName);
		var geomField = this.featureType.fields[geomFieldIndex];
		var geomType = geomField.geomType;

		
		var tracker = this.getTransactionTracker();

		switch(geomType){
			case GeoBeans.Geometry.Type.POINT:
				tracker.trackPoint(this.transactionCallback,callback,this);
				break;
			case GeoBeans.Geometry.Type.LINESTRING:
				tracker.trackLine(this.transactionCallback,callback,this,false);
				break;
			case GeoBeans.Geometry.Type.MULTILINESTRING:
				tracker.trackLine(this.transactionCallback,callback,this,true);
				break;
			case GeoBeans.Geometry.Type.POLYGON:
				tracker.trackPolygon(this.transactionCallback,callback,this,false);
				break;
			case GeoBeans.Geometry.Type.MULTIPOLYGON:
				tracker.trackPolygon(this.transactionCallback,callback,this,true);
				break;
			default:
				break;
		}
	},

	transactionCallback : function(geometry,userCallback,layer){
		userCallback(geometry,layer);
	},

	transaction : function(geometry,values,callback){
		this.workspace.transaction(this.featureType,geometry,values,callback);
	},
	
	getTransactionTracker : function(){
		var tracker = null;
		var index = this.map.controls.find(GeoBeans.Control.Type.TRACKTRANSACTION); 
		if(index == -1){
			tracker = new GeoBeans.Control.TrackControl.TrackTransactionControl();
			this.map.controls.add(tracker);
		}else{
			tracker = this.map.controls.get(index);
		}
		return tracker;
	},

/***********************点击事件*******************************************/	
	registerClickEvent : function(style,callback){
		var map = this.map;
		var x_o = null;
		var y_o = null;
		var tolerance = 10;
		var layer = this;
		if(style != null){
			this.clickStyle = style;
		}
		this.clickEvent = function(evt){
			console.log("click up");
			var index = layer.map.controls.find(GeoBeans.Control.Type.DRAG_MAP)
			var dragControl = layer.map.controls.get(index);
			if(dragControl.draging){
				console.log("draging");
				return;
			}
			layer.clickRenderer.clearRect();
			layer.map.drawLayersAll();

			var mp = map.getViewer().toMapPoint(evt.layerX, evt.layerY);
			layer.clickHit(mp.x, mp.y, callback);
			
		};
		map.canvas.addEventListener('mouseup', this.clickEvent);
	},

	clickHit : function(x,y,callback){
		this.map.closeInfoWindow();
		if(this.features == null){
			if(callback != null){
				callback(null);
			}
			return;
		}

		var selection = [];
		
		var i=0, j=0;
		var f=null, g=null;
		var len = this.features.length;
		for(i=0; i<len; i++){
			f = this.features[i];
			g = f.geometry;
			if(g!=null){
				if(g.hit(x, y, this.map.tolerance)){
					selection.push(f);
				}
			}
		}

		if(selection.length == 0){
			this.clickFeature = null;
			if(callback != null){
				callback(null);	
			}
			return;
		}

		var feature = selection[0];
		var geometry = feature.geometry;
		var distance = this.getDistance(x,y,geometry);
		for(var i = 1; i <  selection.length;++i){
			var f = selection[i];
			var g = f.geometry;
			var d = this.getDistance(x,y,g);
			if(d < distance){
				feature = f;
			}
		}


		if(callback != null){
			this.clickFeature = feature;
			this.map.drawLayersAll();
			callback(feature,x,y);
		}

	},

	getDistance : function(x,y,geometry){
		var geomType = this.getGeomType();
		var distance = null;
		switch(geomType){
			case GeoBeans.Geometry.Type.POINT:
			case GeoBeans.Geometry.Type.MULTIPOINT:{
				var center = geometry.getCentroid();
				distance = GeoBeans.Utility.getDistance(x,y,geometry.x,geometry.y);
				break;
			}
			case GeoBeans.Geometry.Type.LINESTRING:
			case GeoBeans.Geometry.Type.MULTILINESTRING:{
				distance = geometry.distance(x,y);
				break;
			}
			case GeoBeans.Geometry.Type.POLYGON:
			case GeoBeans.Geometry.Type.MULTIPOLYGON:{
				var center = geometry.getCentroid();
				distance = GeoBeans.Utility.getDistance(x,y,geometry.x,geometry.y);
				break;
			}
			default :
				break;
		}

		return distance;
	},

	unRegisterClickEvent : function(){
		this.map.closeInfoWindow();
		this.map.canvas.removeEventListener('mouseup', this.clickEvent);
		this.clickEvent = null;
		this.clickRenderer.clearRect();
		this.clickFeature = null;
		this.map.drawLayersAll();
	},


	drawClickLayer : function(){
		this.clickRenderer.clearRect();
		if(this.clickFeature == null){
			return;
		}
		var style = this.clickStyle;
		if(style == null){
			style = this.getDefaultStyle();
		}
		if(style == null){
			return;
		}

		var rules = style.rules;
		if(rules.length == 0){
			return;
		}

		for(var i=0; i<rules.length; i++){
			var rule = rules[i];
			var features = this.selectFeaturesByFilter(rule.filter,[this.clickFeature]);
			if(rule.symbolizer != null){
				// if(rule.symbolizer.icon_url!=null){
				if(rule.symbolizer.symbol != null){
					this.clickRenderer.drawIcons(features, rule.symbolizer, this.map.getViewer());
				}else{
					this.drawClickFeatures(features, rule.symbolizer);
				}	
			}

			if(rule.textSymbolizer != null){
				this.labelClickFeatures(features,rule.textSymbolizer);
			}
		}
	},


	drawClickFeatures : function(features,symbolizer){
		if(features == null){
			return;
		}
		this.clickRenderer.save();
		this.clickRenderer.setSymbolizer(symbolizer);
		for(var i=0,len=features.length; i<len; i++){
			feature = features[i];
			if((symbolizer!=null) && (symbolizer!='undefined')){
				this.clickRenderer.draw(feature, symbolizer, this.map.getViewer());
			}
		}
		this.clickRenderer.restore();
	},

	labelClickFeatures : function(features, symbolizer){
		var len = features.length;
		if(len == 0){
			return;
		}
		
		this.clickRenderer.save();
		this.clickRenderer.setSymbolizer(symbolizer);
		
		var feature = features[0];
		var text = null;
		var labelText = symbolizer.labelText;
		if(labelText == null || labelText.length == 0){
			var labelProp = symbolizer.labelProp;
			if(labelProp != null){
				var findex = feature.featureType
					.getFieldIndex(labelProp);
			}
		}else{
			text = labelText;
		}
		
		var value = null;
		var geometry = null;
		var label = null;
		for(var i=0,len=features.length; i<len; i++){
			feature = features[i];
			geometry = feature.geometry;
			if(geometry == null){
				continue;
			}
			label = new GeoBeans.PointLabel();
			label.geometry = geometry;
			label.textSymbolizer = symbolizer;
			if(text == null){
				value = feature.values[findex];
			}else{
				value = text;
			}
			label.text = value;
			label.computePosition(this.clickRenderer,this.map.getViewer());
			this.clickRenderer.drawLabel(label);
		}
		this.clickRenderer.restore();
	},	



	// 获取字段值
	getFeatureValue : function(feature,fieldName){
		if(feature == null){
			return;
		}
		return feature.getValue(fieldName);
	},

	setFeatureValue : function(feature,fieldName,value){
		if(feature == null){
			return;
		}
		feature.setValue(fieldName,value);
		this.flag = GeoBeans.Layer.Flag.READY;
	},

	// 查询
	getFeatureFilter : function(filter,maxFeatures,offset,fields,callback){
		var time = new Date();
		var features = this.selectFeaturesByFilter(filter,this.features,maxFeatures,offset);
		var delta = new Date() - time;
		console.log("select feature:" + delta);
		this.map.queryLayer.setFeatures(features);
		this.map.drawLayersAll();
		callback(features);
	}
});
