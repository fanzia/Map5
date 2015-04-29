GeoBeans.DBSManager = GeoBeans.Class({
	
	server : null,
	service : "dbs",
	version : "1.0.0",

	dataSources : null,

	initialize : function(server){
		this.server = server;
		this.dataSources = [];
	},

	getDataSources : function(callback){
		var that = this;
		var params = "service=" + this.service + "&version="
					+ this.version + "&request=GetDataSource";
		$.ajax({
			type 	: "get",
			url 	: this.server,
			data 	: encodeURI(params),
			dataType:"xml",
			async : false,
			beforeSend: function(XMLHttpRequest){
			},
			success	: function(xml, textStatus){
				that.dataSources = that.parseDataSources(xml);
				if(callback != undefined){
					callback(that.dataSources);
				}
			},			 
			complete: function(XMLHttpRequest, textStatus){
			},
			error	: function(){
			}
		});
	},

	getDataSource : function(name,callback){
		if(name == null || name == ""){
			return;
		}

		var that = this;
		var params = "service=" + this.service + "&version="
					+ this.version + "&request=GetDataSource&"
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
				var dataSouce = that.parseDataSource(xml);
				if(callback != undefined){
					callback(dataSouce);
				}
			},			 
			complete: function(XMLHttpRequest, textStatus){
			},
			error	: function(){
			}
		});		

	},

	//注销
	unRegisterDataSource : function(name,callback){
		if(name == null){
			return;
		}
		var that = this;
		var params = "service=" + this.service + "&version="
					+ this.version + "&request=UnRegisterDataSource&"
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
				var result = that.parseUnRegisterDBS(xml);
				if(callback != undefined){
					callback(result);
				}
			},			 
			complete: function(XMLHttpRequest, textStatus){
			},
			error	: function(){
			}
		});		

	},

	//注册
	registerDataSource : function(name,engine,constr,callback){
		if(name == null || constr == null || engine == null){
			return;
		}
		var that = this;
		var params = "service=" + this.service + "&version="
					+ this.version + "&request=RegisterDataSource&"
					+ "name=" + name + "&engine=" + engine
					+ "&uri=" + constr;
		$.ajax({
			type 	: "get",
			url 	: this.server,
			data 	: encodeURI(params),
			dataType:"xml",
			async : false,
			beforeSend: function(XMLHttpRequest){
			},
			success	: function(xml, textStatus){
				var result = that.parseRegisterDBS(xml);
				if(callback != undefined){
					callback(result);
				}
			},			 
			complete: function(XMLHttpRequest, textStatus){
			},
			error	: function(){
			}
		});	

	},

	parseDataSources : function(xml){
		var dataSources = [];
		var that = this;
		$(xml).find("DataSource").each(function(){
			var dataSouce = that.parseDataSource(this);
			dataSources.push(dataSouce);
		});
		return dataSources;
	},

	parseDataSource : function(xml){
		var name = $(xml).find("Name").text();
		var engine = $(xml).find("Engine").text();
		var constr = $(xml).find("ConnectionString").text();
		var dbs = new GeoBeans.DataSource(this.server,
					name,engine,constr);
		return dbs;
	},

	parseUnRegisterDBS : function(xml){
		var result = $(xml).find("UnRegisterDataSource")
					.text();
		if(result.toLowerCase() == "success"){
			return "success";
		}
		var exception = $(xml).find("ExceptionText").text();
		return exception;
	},

	parseRegisterDBS : function(xml){
		var result = $(xml).find("RegisterDataSource")
					.text();
		if(result.toLowerCase() == "success"){
			return "success";
		}
		var exception = $(xml).find("ExceptionText").text();
		return exception;
	}
});