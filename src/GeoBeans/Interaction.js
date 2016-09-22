/**
 * Map5的交互类
 * @class
 * @description 实现Map5与用户的交互功能
 */
GeoBeans.Interaction = GeoBeans.Class({
	_type : null,
	_map : null,
	_enabled : true,
	
	initialize : function(options){
		//GeoBeans.Class.prototype.initialize.apply(this, arguments);
	},
	
	destory : function(){
		//GeoBeans.Class.prototype.destory.apply(this, arguments);
	},
	
	attach : function(_map){
		this._map = _map;
	},
	
	detach : function(){
		this._map = _map;
	},
	
	enable : function(f){
		this._enabled = f;
	},

	CLASS_NAME : "GeoBeans.Interaction"
});

/**
 * Interaction类型
 * @type {Object}
 */
GeoBeans.Interaction.Type = {
	DRAW	: "Draw",
	SELECT	: "Select",
	ROTATE	: "Rotate"
};


GeoBeans.Interaction.Interactions = GeoBeans.Class({
	map : null,
	_interactions : [],
	
	initialize : function(map){
		this.map = map;
	},

	destory : function(){
		this.cleanup();
		this._interactions = null;
	},
	
	add : function(c){
		if(!isValid(c)){
			return;
		}
		c.attach(this.map);
		this._interactions.push(c);
	},
	
	remove : function(i){
		if(i>=0&&i<this._interactions.length){
			this._interactions[i].splice(i,1);	
		}
	},

	get : function(i){
		return this._interactions[i];
	},

	count : function(){
		return this._interactions.length;
	},

	cleanup : function(){
		var len = this._interactions.length;
		for(var i=0; i<len; i++){
			this._interactions[i].destory();
			this._interactions[i] = null;
		}
		this._interactions = [];
	},
	find : function(type){
		var len = this._interactions.length;
		for(var i=0; i<len; i++){
			if(this._interactions[i]._type == type){
				return this._interactions[i];
			}
		}
		return null;
	}
});