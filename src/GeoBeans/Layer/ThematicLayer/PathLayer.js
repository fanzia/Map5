/**
 * @classdesc
 * 轨迹线
 * @class
 * @extends {GeoBeans.Layer}
 */
GeoBeans.Layer.PathLayer = GeoBeans.Class(GeoBeans.Layer,{
	_pathLines : null,

	_animateCanvas : null,

	_animateRenderer : null,

	initialize :  function(name){
		GeoBeans.Layer.prototype.initialize.apply(this, arguments);
		this._pathLines = [];
		this._animateCanvas = document.createElement("canvas");
	},

	setMap : function(map){
		GeoBeans.Layer.prototype.setMap.apply(this, arguments);
		

		var mapCanvasHeight = map.getHeight();
		var mapCanvasWidth = map.getWidth();

		
		this._animateCanvas.height = mapCanvasHeight;
		this._animateCanvas.width = mapCanvasWidth;

		this._animateCanvas.id = this.name + "_animate";
		this._animateCanvas.className = "map5-canvas";


		var mapContainer = this.map.getContainer();
		$(mapContainer).append(this._animateCanvas);
		this._animateRenderer = new GeoBeans.Renderer(this._animateCanvas);

		this.map.beginAnimate();
	},

	destroy : function(){
		var mapContainer = this.map.getContainer();
		$(mapContainer).find(".map5-canvas[id='" + this.name + "_animate']").remove();
		GeoBeans.Layer.prototype.destroy.apply(this, arguments);
	}
});

/**
 * 是否是动画图层
 * @private
 * @return {Boolean} 
 */
GeoBeans.Layer.PathLayer.prototype.isAnimation = function(){
	return true;
};

/**
 * 添加轨迹线
 * @public
 * @param {GeoBeans.PathLine} pathLine 轨迹线
 */
GeoBeans.Layer.PathLayer.prototype.addPathLine = function(pathLine){
	if(isValid(pathLine)){
		this._pathLines.push(pathLine);
	}
}

/**
 * 根据id查询轨迹线
 * @public
 * @param  {string} id  查询id
 * @return {GeoBeans.PathLine}   查询的轨迹线
 */
GeoBeans.Layer.PathLayer.prototype.getPathLine = function(id){
	for(var i = 0; i < this._pathLines.length;++i){
		if(this._pathLines[i].getID() == id){
			return this._pathLines[i];
		}
	}
	return null;
}

/**
 * 绘制
 * @private
 */
GeoBeans.Layer.PathLayer.prototype.draw = function(time){
	this._animateCanvas.width = this.map.getViewer().getWindowWidth();
	this._animateCanvas.height = this.map.getViewer().getWindowHeight();
	if(!isValid(time)){
		this.clear();
		this._drawPathLinesStatic();
		return;
	}

	this._animateRenderer.clearRect(0,0,this._animateCanvas.width,this._animateCanvas.height);
	for(var i = 0; i < this._pathLines.length;++i){
		var pathLine = this._pathLines[i];
		this._drawPathLineByTime(pathLine,time);
	}
}

/**
 * 绘制轨迹线
 * @private
 */
GeoBeans.Layer.PathLayer.prototype._drawPathLineByTime = function(pathLine,time){
	if(!isValid(pathLine,time)){
		return;
	}

	var pathPoints =  pathLine.getPathPoints();
	if(!isValid(pathPoints)){
		return;
	}
	if(pathPoints.length == 1){
		this.clear();
		this._drawPathLinesStatic();
		return;
	}
	if(pathPoints.length == 2){
		this.clear();
		this._drawPathLinesStatic();
	}

	var viewer = this.map.getViewer();

	var lineSymbolizer = pathLine.getSymbolizer();
	var pathPoint = null,bPathPoint = null;

	var start = 1;
	var end = pathPoints.length;
	var maxCount = pathLine.getMaxCount();
	if(isValid(maxCount)){
		start = end - maxCount;
		if(start < 0){
			start = 0;
		}
		start += 1;
		if(pathPoints.length > maxCount){
			// this.clear();
			// this._drawPathLinesStatic();
		}
	}
	for(var i = end -1 ; i >= start;--i){
		pathPoint = pathPoints[i];
		bPathPoint = pathPoints[i - 1];
		// 已经经过该点
		if(pathPoint.getStatus()){
			var point = pathPoint.getPoint();
			var symbolizer = pathPoint.getSymbolizer();
			if(i == pathPoints.length -1){
				var rotation = this._getRotation(bPathPoint.getPoint(),pathPoint.getPoint());
				
				symbolizer.symbol.rotation = rotation;
				this._animateRenderer.drawGeometry(point,symbolizer,viewer);
			}
			break;
		}else{
			// 还未经过该点
			this._drawAnimationLine(bPathPoint,pathPoint,lineSymbolizer,time);
			break;
		}
	}
}

/**
 * 绘制线段，按照样式
 * @private
 */
GeoBeans.Layer.PathLayer.prototype._drawLine = function(point1,point2,lineSymbolizer,renderer){
	if(!isValid(point1) || !isValid(point2) || !isValid(lineSymbolizer)){
		return;
	}

	var points = [point1,point2];
	var line = new GeoBeans.Geometry.LineString(points);

	var viewer = this.map.getViewer();
	renderer.setSymbolizer(lineSymbolizer);
	renderer.drawGeometry(line,lineSymbolizer,viewer);
};


/**
 * 按照两个轨迹点绘制动态线
 * @private
 */
GeoBeans.Layer.PathLayer.prototype._drawAnimationLine = function(bPathPoint,pathPoint,lineSymbolizer,time){
	if(!isValid(bPathPoint) || !isValid(pathPoint) || !isValid(time)){
		return;
	}
	var bPoint = bPathPoint.getPoint();
	var point = pathPoint.getPoint();

	if(!isValid(bPoint) || !isValid(point)){
		return;
	}

	var viewer = this.map.getViewer();

	var distance = GeoBeans.Utility.getDistance(bPoint.x,bPoint.y,point.x,point.y);
	var lineTime = pathPoint.getTime();
	// 每秒走的距离
	var mapDelta = distance/lineTime;

	var elapsedTime = 0;
	// 还没有走过
	if(!isValid(pathPoint.beginTime)){
		pathPoint.beginTime = time;
		elapsedTime = 0;
	}else{
		elapsedTime = time - pathPoint.beginTime;
		if(elapsedTime >= lineTime){
			// 经过该点后，就添加到固定canvas上
			pathPoint.setStatus(true);
			elapsedTime = lineTime;
			var symbolizer = pathPoint.getSymbolizer();
			// this._animateRenderer.drawGeometry(point,symbolizer,viewer);
			this._drawLine(bPoint,point,lineSymbolizer,this.renderer);
			this.drawLabel(pathPoint);
			return;
		}
		var x = bPoint.x + (point.x - bPoint.x) * elapsedTime/lineTime;
		var y = bPoint.y + (point.y - bPoint.y) * elapsedTime/lineTime;
		var pointByTime = new GeoBeans.Geometry.Point(x,y);
		var symbolizer = pathPoint.getSymbolizer();
		var rotation = this._getRotation(bPathPoint.getPoint(),pointByTime);
		symbolizer.symbol.rotation = rotation;
		this._animateRenderer.setSymbolizer(symbolizer);
		this._animateRenderer.drawGeometry(pointByTime,symbolizer,viewer);
		this._drawLine(bPoint,pointByTime,lineSymbolizer,this._animateRenderer);
	}
}

/**
 * 计算点的方位角
 * @private
 */
GeoBeans.Layer.PathLayer.prototype._getRotation = function(point1,point2){
	if(!isValid(point1) && !isValid(point2)){
		return 0;
	}
	return GeoBeans.Utility.getAngle(point1.x,point1.y,point2.x,point2.y);
}


/**
 * 绘制不动的轨迹线
 * @private
 */
GeoBeans.Layer.PathLayer.prototype._drawPathLinesStatic = function(){
	for(var i = 0; i < this._pathLines.length;++i){
		var pathLine = this._pathLines[i];
		this._drawPathLineStatic(pathLine);
	}	
};

/**
 * 绘制不动的轨迹线
 * @private
 * @param  {GeoBeans.PathLine} pathLine 轨迹线
 */
GeoBeans.Layer.PathLayer.prototype._drawPathLineStatic = function(pathLine){
	if(!isValid(pathLine)){
		return;
	}

	var pathPoints =  pathLine.getPathPoints();
	if(!isValid(pathPoints)){
		return;
	}

	var viewer = this.map.getViewer();

	var lineSymbolizer = pathLine.getSymbolizer();
	var pathPoint = null,bPathPoint = null;
	var beginPoint = pathPoints[0];
	if(isValid(beginPoint) && pathPoints.length == 1){
		var symbolizer = beginPoint.getSymbolizer();
		var point = beginPoint.getPoint();
		this.renderer.drawGeometry(point,symbolizer,viewer);
		this.drawLabel(beginPoint);
	}

	var start = 1;
	var end = pathPoints.length;
	var maxCount = pathLine.getMaxCount();
	if(isValid(maxCount)){
		start = end - maxCount;
		if(start < 0){
			start = 0;
		}
		start += 1;
	}
	// var date = new Date();
	this.renderer.setSymbolizer(lineSymbolizer);
	var points = [];
	points.push(pathPoints[start -1].getPoint());
	this.drawLabel(pathPoints[start -1]);
	for(var i = start; i < end;++i){
		pathPoint = pathPoints[i];
		bPathPoint = pathPoints[i - 1];
		// 已经经过该点
		if(pathPoint.getStatus()){
			this.drawLabel(pathPoint);
			points.push(pathPoint.getPoint());
		}
	}
	var line = new GeoBeans.Geometry.LineString(points);
	this.renderer.drawGeometry(line,symbolizer,this.map.getViewer());
	// console.log(new Date() - date);
}

/**
 * 绘制（whaterver 重新绘制)
 * @private
 */
// GeoBeans.Layer.PathLayer.prototype.refresh = function(flag){
// 	this.canvas.width = this.map.getViewer().getWindowWidth();
// 	this.canvas.height = this.map.getViewer().getWindowHeight();
	
// 	if(this.visible){
// 		// this.drawSnap();
// 		this.draw();
// 	}
// 	else{
// 		this.clear();
// 	}
// }

/**
 * 绘制文字样式
 * @private
 */
GeoBeans.Layer.PathLayer.prototype.drawLabel = function(pathPoint){
	if(!isValid(pathPoint)){
		return;
	}

	var textSymbolizer = pathPoint.getTextSymbolizer();
	var name = pathPoint.getName();
	if(!isValid(textSymbolizer) || !isValid(name)){
		return;
	}

	this.renderer.save();
	this.renderer.setSymbolizer(textSymbolizer);
	var label = new GeoBeans.PointLabel();
	label.geometry = pathPoint.getPoint();
	label.textSymbolizer = textSymbolizer;
	label.text = name;
	label.computePosition(this.renderer,this.map.getViewer());
	this.renderer.drawLabel(label);	
	this.renderer.restore();

}