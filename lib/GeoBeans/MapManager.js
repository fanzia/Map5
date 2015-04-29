GeoBeans.MapManager = GeoBeans.Class({
	service : "ims",
	version : "1.0.0",
	server : null,
	maps : null,

	createMap_u_id : null,
	createMap_u_name : null,
	createMap_u_extent : null,
	createMap_u_srid : null,

	removeMap_u_callback : null,

	initialize : function(server){
		this.server = server;
		this.maps = [];
	},

	getMaps : function(callback){
		var that = this;
		var params = "service=" + this.service + "&version="
					+ this.version + "&request=GetMap";
		$.ajax({
			type 	: "get",
			url 	: this.server,
			data 	: encodeURI(params),
			dataType:"xml",
			async : false,
			beforeSend: function(XMLHttpRequest){
			},
			success	: function(xml, textStatus){
				that.maps = that.parseMaps(xml);
				if(callback != undefined){
					callback(that.maps);
				}
			},			 
			complete: function(XMLHttpRequest, textStatus){
			},
			error	: function(){
			}
		});
	},

	getMap : function(name,callback){
		if(name == null || name == ""){
			return;
		}

		var that = this;
		var params = "service=" + this.service + "&version="
					+ this.version + "&request=GetMap&"
					+ "name=" + name;
		$.ajax({
			type 	: "get",
			url 	: this.server,
			data 	: encodeURI(params),
			dataType:"xml",
			async : false,
			beforeSend: function(XMLHttpRequest){
			},
			success	: function(xml, textStatus){
				var map = that.parseMap(xml);
				if(callback != undefined){
					callback(map);
				}
			},			 
			complete: function(XMLHttpRequest, textStatus){
			},
			error : function(){
			}
		});
	},

	// 创建地图
	createMap : function(id,name,extent,srid,callback){
		if(name == null || extent == null 
			|| srid == null){
			return;
		}
		this.createMap_u_id = id;
		this.createMap_u_name = name;
		this.createMap_u_extent = extent;
		this.createMap_u_srid = srid;
		this.createMap_u_callback = callback;
		var extentStr = extent.toString();
		var that = this;
		var params = "service=" + this.service + "&version="
					+ this.version + "&request=CreateMap"
					+ "&name=" + name + "&extent=" 
					+ extentStr + "&srid=" + srid;
		$.ajax({
			type 	: "get",
			url 	: this.server,
			data 	: encodeURI(params),
			dataType:"xml",
			async : false,
			beforeSend: function(XMLHttpRequest){
			},
			success	: function(xml, textStatus){
				var result = that.parseCreateMap(xml);
				that.createMap_callback(result);
			},			 
			complete: function(XMLHttpRequest, textStatus){
			},
			error	: function(){
			}
		});
	},


	removeMap : function(name,callback){
		if(name == null || name == ""){
			return;
		}
		this.removeMap_u_callback = callback;
		var that = this;
		var params = "service=" + this.service + "&version="
					+ this.version + "&request=RemoveMap"
					+ "&name=" + name;
		$.ajax({
			type 	: "get",
			url 	: this.server,
			data 	: encodeURI(params),
			dataType:"xml",
			async : false,
			beforeSend: function(XMLHttpRequest){
			},
			success	: function(xml, textStatus){
				var result = that.parseRemoveMap(xml);
				that.removeMap_callback(result);
			},			 
			complete: function(XMLHttpRequest, textStatus){
			},
			error	: function(){
			}
		});
	},

	parseMaps : function(xml){
		var maps = [];
		var that = this;
		$(xml).find("Map").each(function(){
			var map = new GeoBeans.Map();
			var name = $(this).find("Name").text();
			var srid = $(this).find("Srid").text();
			var envelopeXML = $(this).find("BoundingBox");
			var extent = that.parseBoundingBox(envelopeXML);

			map.name = name;
			map.srid = srid;
			map.extent = extent;
			maps.push(map);
		});
		return maps;
	},

	parseMap : function(xml){
		var that = this;
		var name = $(xml).find("name").text();
		var map = new GeoBeans.Map(name);
		map.layers = [];
		$(xml).find("Capability>Layer").each(function(){
			var layer = that.parseLayer(this);
			if(layer instanceof GeoBeans.Layer.GroupLayer){
				map.groupLayer = layer;
			}else{
				map.addLayer(layer);
			}
		});
		return map;
		// var layerXML = $(xml).find("Layer:first");
		// var layer = that.parseLayers(layersXML);
	},

	parseBoundingBox : function(xml){
		if(xml == null){
			return null;
		}
		var xmin = parseFloat($(xml).attr("minx"));
		var ymin = parseFloat($(xml).attr("miny"));
		var xmax = parseFloat($(xml).attr("maxx"));
		var ymax = parseFloat($(xml).attr("maxy"));

		return (new GeoBeans.Envelope(xmin, ymin, xmax, ymax));
	},

	parseLayer : function(xml){
		if(xml == null){
			return null;
		}
		var layer = null;
		
		var type = $(xml).find("Type").text();
		if(type == "Group"){
			layer = this.parseGroupLayer(xml);
		}else{

		}
		return layer;
	},

	parseGroupLayer : function(xml){
		if(xml == null){
			return null;
		}
		var that = this;
		

		var name = $(xml).find("Name:first").text();
		var extentXML = $(xml).find("BoundingBox:first");
		var extent = this.parseBoundingBox(extentXML);

		var groupLayer = new GeoBeans.Layer.GroupLayer(name);
		// groupLayer.name = name;
		groupLayer.extent = extent;
		$(xml).find("Layer").each(function(){
			var dbLayer = that.parseDBLayer(this);
			groupLayer.addLayer(dbLayer);
		});
		return groupLayer;
	},

	parseDBLayer : function(xml){
		if(xml == null){
			return null;
		}
		
		var name = $(xml).find("Name:first").text();
		var queryable = parseInt($(xml).attr("queryable"));
		var extentXML = $(xml).find("BoundingBox:first");
		var extent = this.parseBoundingBox(extentXML);

		var dbLayer = new GeoBeans.Layer.DBLayer(name);
		// dbLayer.name = name;
		dbLayer.queryable = queryable;
		dbLayer.extent = extent;

		return dbLayer;

	},

	parseCreateMap : function(xml){
		var result = $(xml).find("CreateMap")
					.text();
		if(result.toLowerCase() == "success"){
			return "success";
		}
		var exception = $(xml).find("ExceptionText").text();
		return exception;
	},

	createMap_callback : function(result){
		if(this.createMap_u_callback == null){
			return;
		}
		if(result != "success"){
			this.createMap_u_callback(null,result);
			return;
		}
		var map = new GeoBeans.Map(this.server,
					this.createMap_u_id,
					this.createMap_u_name,
					this.createMap_u_extent,
					this.createMap_u_srid);
		this.createMap_u_callback(map,result);
	},

	parseRemoveMap : function(xml){
		var result = $(xml).find("RemoveMap")
					.text();
		if(result.toLowerCase() == "success"){
			return "success";
		}
		var exception = $(xml).find("ExceptionText").text();
		return exception;
	},

	removeMap_callback : function(result){
		if(this.removeMap_u_callback != null){
			this.removeMap_u_callback(result);
		}
	}

});