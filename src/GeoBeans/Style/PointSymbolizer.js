/**
 * @classdesc
 * 点几何对象样式类。
 * 定义线的渲染样式，包括颜色、线型、宽度等。
 * @class
 * @extends {GeoBeans.Symbolizer}
 * @param {GeoBeans.Style.Stroke} stroke 边界线样式
 * @param {GeoBeans.Style.Fill} fill 填充样式
 * @param {GeoBeans.Style.Symbol} symbol 符号
 * @param {string} icon 图标url地址
 * @param {double} offsetX x方向偏移量
 * @param {double} offsetY y方向偏移量
 */
GeoBeans.Symbolizer.PointSymbolizer = GeoBeans.Class(GeoBeans.Symbolizer,{
	size : null,
	fill : null,
	stroke : null,
	icon_url : null,
	icon_offset_x : null,
	icon_offset_y : null,

	// 符号名称
	symbol : null,

	initialize : function(){
		GeoBeans.Symbolizer.prototype.initialize.apply(this, arguments);
		this.type = GeoBeans.Symbolizer.Type.Point;
		this.fill = new GeoBeans.Style.Fill();
		this.stroke = new GeoBeans.Style.Stroke();
		this.size = 3;
	},

	clone : function(){
		var clone = new GeoBeans.Symbolizer.PointSymbolizer();
		if(this.fill != null){
			clone.fill = this.fill.clone();
		}else{
			clone.fill = null;
		}
		if(this.stroke != null){
			clone.stroke = this.stroke.clone();
		}else{
			clone.stroke = null;
		}
		clone.size = this.size;
		if(this.symbol != null){
			clone.symbol = this.symbol.clone();
		}else{
			clone.symbol = null;
		}
		return clone;
	}
});
