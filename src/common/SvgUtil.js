define(function(require) {
	var mathUtil = require("./mathUtil");
	/**
	 * SVG関連処理
	 * @class svgUtil
	 * @namespace MiyanokoLib
	 * @static
	 */
	var util = {
		/**
		 * ベジェ曲線を何本の直線で近似するか
		 * @property BEZIER_SPLIT_COUNT
		 * @type {number}
		 * @default 5
		 */
		BEZIER_SPLIT_COUNT : 10,

		/**
		 * 楕円を何本の直線で近似するか
		 * @property ELLIPSE_SPLIT_COUNT
		 * @type {number}
		 * @default 20
		 */
		ELLIPSE_SPLIT_COUNT : 20,

		/**
		 * SVG文字列から図形のパス情報を取得する<br>
		 * 対応タグ：path,rect,ellipse,circle
		 * @method loadSvgGraphics
		 * @param svgString {string} SVGリソース文字列
		 * @return {[]} {tag,pointList,style}のリスト
		 */
		loadSvgGraphicsPath : function(svgString) {
			var dom_parser = new DOMParser();
			var svgDom = null;
			try {
				svgDom = dom_parser.parseFromString(svgString, "image/svg+xml");
			} catch (e) {
				console.log("This svg resouce is invalid to parse.");
				throw e;
			}

			var ret = this.parseSvgGraphics(svgDom);

			return ret;
		},

		/**
		 * SVG文字列から図形のパス情報を取得する<br>
		 * 対応タグ：path,rect,ellipse,circle
		 * @method parseSvgGraphics
		 * @param svgTag {} SVGタグ
		 * @return {[]} {tag,pointList,style}のリスト
		 */
		parseSvgGraphics : function(svgTag) {
			var ret = [];
			var i = 0;

			// パス
			var tagPathList = svgTag.getElementsByTagName("path");
			for (i = 0; i < tagPathList.length; i++) {
				ret.push({
					tag : "path",
					pointList : this.parsePath(tagPathList[i]),
					style : this.parseTagStyle(tagPathList[i]),
					close : tagPathList[i].attributes.d.value.match(/Z|z/)
				});
			}

			// 矩形
			var tagRectList = svgTag.getElementsByTagName("rect");
			for (i = 0; i < tagRectList.length; i++) {
				ret.push({
					tag : "rect",
					pointList : this.parseRect(tagRectList[i]),
					style : this.parseTagStyle(tagRectList[i]),
					close : true
				});
			}

			// 楕円
			var tagEllipseList = svgTag.getElementsByTagName("ellipse");
			for (i = 0; i < tagEllipseList.length; i++) {
				ret.push({
					tag : "ellipse",
					pointList : this.parseEllipse(tagEllipseList[i]),
					style : this.parseTagStyle(tagEllipseList[i]),
					close : true
				});
			}

			// 円
			var tagCircleList = svgTag.getElementsByTagName("circle");
			for (i = 0; i < tagCircleList.length; i++) {
				ret.push({
					tag : "circle",
					pointList : this.parseCircle(tagCircleList[i]),
					style : this.parseTagStyle(tagCircleList[i]),
					close : true
				});
			}

			// // gタグ→「getElementsByTagName」は子孫全検索なので再帰必要なし
			// var gTagList = svgTag.getElementsByTagName("g");
			// for (i = 0; i < gTagList.length; i++) {
			// 	// グループなので再帰処理
			// 	ret = ret.concat(this.parseSvgGraphics(gTagList[i]));
			// }

			return ret;
		},

		/**
		 * タグに設定されたtransformを行う
		 * @method adoptTransform
		 * @param svgTag {} SVGのタグDOM
		 * @param points {point[]} 変換前座標リスト
		 * @return {point[]} {x,y}の座標リスト
		 */
		adoptTransform : function(svgTag, points) {
			var ret = [];

			// コピー
			points.forEach(function(p) {
				ret.push(mathUtil.pointCopy2D(p));
			}, this);

			// transformタグない場合もある
			if (!svgTag.attributes.transform) {
				return ret;
			}

			// 複数コマンドの場合もあるのでループ
			var commandList = svgTag.attributes.transform.value.split(/\)/);
			commandList.forEach(function(current) {
				var tmp = current.split(/\(/);
				if (tmp.length === 2) {
					var command = tmp[0];
					var params = [];
					tmp[1].split(/,/).forEach(function(str) {
						params.push(parseFloat(str, 10));
					});

					switch (command.trim().toLowerCase()) {
						case "matrix":
							ret = mathUtil.transform2D(ret, params);
							break;
						case "translate":
							ret.forEach(function(p) {
								p.x += params[0];
								p.y += params[1];
							}, this);
							break;
						case "scale":
							var scaleX = params[0];
							// XY等倍の場合を考慮
							var scaleY = params[0];
							if (params.length > 1) {
								scaleY = params[1];
							}
							ret.forEach(function(p) {
								p.x *= scaleX;
								p.y *= scaleY;
							}, this);
							break;
						case "rotate":
							// 回転基準点
							var base = null;
							if (params.length > 2) {
								base = {
									x : params[1],
									y : params[2]
								};
							}
							ret.forEach(function(p) {
								var rotated = mathUtil.rotate2D(p, params[0] * Math.PI / 180, base);
								p.x = rotated.x;
								p.y = rotated.y;
							}, this);
							break;
						case "skewx":
							ret.forEach(function(p) {
								p.x += Math.tan(params[0]) * p.y;
							}, this);
							break;
						case "skewy":
							ret.forEach(function(p) {
								p.y += Math.tan(params[0]) * p.x;
							}, this);
							break;
						defalut:
							break;
					}
				}
			}, this);

			return ret;
		},

		/**
		 * circleタグを解析する
		 * @method parseCircle
		 * @param svgCircle {} SVGのcircleタグDOM
		 * @return {point[]} {x,y}の座標リスト
		 */
		parseCircle : function(svgCircle) {
			var ret = [];

			var cx = parseFloat(svgCircle.attributes.cx.value, 10);
			var cy = parseFloat(svgCircle.attributes.cy.value, 10);
			var r = parseFloat(svgCircle.attributes.r.value, 10);

			// 近似方法は楕円と同様
			ret = mathUtil.approximateArc(
				r, r,
				0, Math.PI * 2,
				{x:cx,y:cy},
				0, this.ELLIPSE_SPLIT_COUNT);

			// トランスフォーム
			ret = this.adoptTransform(svgCircle, ret);

			return ret;
		},

		/**
		 * ellipseタグを解析する
		 * @method parseEllipse
		 * @param svgEllipse {} SVGのellipseタグDOM
		 * @return {point[]} {x,y}の座標リスト
		 */
		parseEllipse : function(svgEllipse) {
			var ret = [];

			var cx = parseFloat(svgEllipse.attributes.cx.value, 10);
			var cy = parseFloat(svgEllipse.attributes.cy.value, 10);
			var rx = parseFloat(svgEllipse.attributes.rx.value, 10);
			var ry = parseFloat(svgEllipse.attributes.ry.value, 10);

			ret = mathUtil.approximateArc(
				rx, ry,
				0, Math.PI * 2,
				{x:cx,y:cy},
				0, this.ELLIPSE_SPLIT_COUNT);

			// トランスフォーム
			ret = this.adoptTransform(svgEllipse, ret);

			return ret;
		},

		/**
		 * rectタグを解析する
		 * @method parseRect
		 * @param svgRect {} SVGのrectタグDOM
		 * @return {point[]} {x,y}の座標リスト
		 */
		parseRect : function(svgRect) {
			var ret = [];

			var x = parseFloat(svgRect.attributes.x.value, 10);
			var y = parseFloat(svgRect.attributes.y.value, 10);
			var width = parseFloat(svgRect.attributes.width.value, 10);
			var height = parseFloat(svgRect.attributes.height.value, 10);

			ret.push({x : x, y : y});
			ret.push({x : x + width, y : y});
			ret.push({x : x + width, y : y + height});
			ret.push({x : x, y : y + height});

			// トランスフォーム
			ret = this.adoptTransform(svgRect, ret);

			return ret;
		},

		/**
		 * pathタグを解析する
		 * @method parsePath
		 * @param svgPath {} SVGのpathタグDOM
		 * @return {vector[]} 座標リスト
		 */
		parsePath : function(svgPath) {
			var ret = [];

			// d属性分解
			var elementList = this.splitD(svgPath.attributes.d.value);

			// 前回座標
			var pastVec = {x:0,y:0};
			// 前回制御点
			var pastControlVec = {x:0,y:0};
			for (var i = 0; i < elementList.length; i++) {
				var current = elementList[i];
				var pList = [];

				var b0 = null;
				var b1 = null;
				var b2 = null;
				var b3 = null;
				var centers = null;

				switch (current[0]) {
					case "M":
					case "L":
					case "H":
						// 直線(絶対)
						pList.push({x : parseFloat(current[1], 10), y : parseFloat(current[2], 10)});
						break;
					case "m":
					case "l":
					case "h":
						// 直線(相対)
						pList.push({x : pastVec.x + parseFloat(current[1], 10), y : pastVec.y + parseFloat(current[2], 10)});
						break;
					case "V":
						// 垂直(絶対)
						pList.push({x : pastVec.x, y : parseFloat(current[1], 10)});
						break;
					case "v":
						// 垂直(相対)
						pList.push({x : pastVec.x, y : pastVec.y + parseFloat(current[1], 10)});
						break;
					case "Q" :
						// 制御点準備
						b0 = pastVec;
						b1 = {
							x : parseFloat(current[1], 10),
							y : parseFloat(current[2], 10)
						};
						b2 = {
							x : parseFloat(current[3], 10),
							y : parseFloat(current[4], 10)
						};
						// 近似
						pList = mathUtil.approximateBezier([b0, b1, b2], this.BEZIER_SPLIT_COUNT);
						// 始点は前回点なので除去
						pList.shift();
						break;
					case "q" :
						// 制御点準備
						b0 = pastVec;
						b1 = {
							x : b0.x + parseFloat(current[1], 10),
							y : b0.y + parseFloat(current[2], 10)
						};
						b2 = {
							x : b0.x + parseFloat(current[3], 10),
							y : b0.y + parseFloat(current[4], 10)
						};
						// 近似
						pList = mathUtil.approximateBezier([b0, b1, b2], this.BEZIER_SPLIT_COUNT);
						// 始点は前回点なので除去
						pList.shift();
						break;
					case "T" :
						// 制御点準備
						b0 = pastVec;
						b1 = mathUtil.symmetryPoint2D(b0, pastControlVec);
						b2 = {
							x : parseFloat(current[1], 10),
							y : parseFloat(current[2], 10)
						};
						// 近似
						pList = mathUtil.approximateBezier([b0, b1, b2], this.BEZIER_SPLIT_COUNT);
						// 始点は前回点なので除去
						pList.shift();
						break;
					case "t" :
						// 制御点準備
						b0 = pastVec;
						b1 = mathUtil.symmetryPoint2D(b0, pastControlVec);
						b2 = {
							x : b0.x + parseFloat(current[1], 10),
							y : b0.y + parseFloat(current[2], 10)
						};
						// 近似
						pList = mathUtil.approximateBezier([b0, b1, b2], this.BEZIER_SPLIT_COUNT);
						// 始点は前回点なので除去
						pList.shift();
						break;
					case "C" :
						// 制御点準備
						b0 = pastVec;
						b1 = {
							x : parseFloat(current[1], 10),
							y : parseFloat(current[2], 10)
						};
						b2 = {
							x : parseFloat(current[3], 10),
							y : parseFloat(current[4], 10)
						};
						b3 = {
							x : parseFloat(current[5], 10),
							y : parseFloat(current[6], 10)
						};
						// 近似
						pList = mathUtil.approximateBezier([b0, b1, b2, b3], this.BEZIER_SPLIT_COUNT);
						// 始点は前回点なので除去
						pList.shift();
						break;
					case "c" :
						// 制御点準備
						b0 = pastVec;
						b1 = {
							x : b0.x + parseFloat(current[1], 10),
							y : b0.y + parseFloat(current[2], 10)
						};
						b2 = {
							x : b0.x + parseFloat(current[3], 10),
							y : b0.y + parseFloat(current[4], 10)
						};
						b3 = {
							x : b0.x + parseFloat(current[5], 10),
							y : b0.y + parseFloat(current[6], 10)
						};
						// 近似
						pList = mathUtil.approximateBezier([b0, b1, b2, b3], this.BEZIER_SPLIT_COUNT);
						// 始点は前回点なので除去
						pList.shift();
						break;
					case "S" :
						// 制御点準備
						b0 = pastVec;
						b1 = mathUtil.symmetryPoint2D(b0, pastControlVec);
						b2 = {
							x : parseFloat(current[1], 10),
							y : parseFloat(current[2], 10)
						};
						b3 = {
							x : parseFloat(current[3], 10),
							y : parseFloat(current[4], 10)
						};
						// 近似
						pList = mathUtil.approximateBezier([b0, b1, b2, b3], this.BEZIER_SPLIT_COUNT);
						// 始点は前回点なので除去
						pList.shift();
						break;
					case "s" :
						// 制御点準備
						b0 = pastVec;
						b1 = mathUtil.symmetryPoint2D(b0, pastControlVec);
						b2 = {
							x : b0.x + parseFloat(current[1], 10),
							y : b0.y + parseFloat(current[2], 10)
						};
						b3 = {
							x : b0.x + parseFloat(current[3], 10),
							y : b0.y + parseFloat(current[4], 10)
						};
						// 近似
						pList = mathUtil.approximateBezier([b0, b1, b2, b3], this.BEZIER_SPLIT_COUNT);
						// 始点は前回点なので除去
						pList.shift();
						break;
					case "A":
						b0 = pastVec;
						b1 = {
							x : parseFloat(current[6], 10),
							y : parseFloat(current[7], 10)
						};

						pList = mathUtil.approximateArcWithPoint(
							parseFloat(current[1], 10), parseFloat(current[2], 10),
							b0,
							b1,
							parseInt(current[4], 10),
							parseInt(current[5], 10),
							parseFloat(current[3], 10) / 180 * Math.PI,
							this.BEZIER_SPLIT_COUNT);
						// 始点は前回点なので除去
						pList.shift();
						break;
					case "a":
						b0 = pastVec;
						b1 = {
							x : b0.x + parseFloat(current[6], 10),
							y : b0.y + parseFloat(current[7], 10)
						};

						pList = mathUtil.approximateArcWithPoint(
							parseFloat(current[1], 10), parseFloat(current[2], 10),
							b0,
							b1,
							parseInt(current[4], 10),
							parseInt(current[5], 10),
							parseFloat(current[3], 10) / 180 * Math.PI,
							this.BEZIER_SPLIT_COUNT);
						// 始点は前回点なので除去
						pList.shift();
						break;
					default:
						// 無視して次へ
						continue;
				}

				if (pList.length > 0) {
					pastVec = pList[pList.length - 1];
					ret = ret.concat(pList);

					if (pList.length > 1) {
						// 前回制御点記録
						pastControlVec = pList[pList.length - 2];
					}
				}
			}

			// トランスフォーム
			ret = this.adoptTransform(svgPath, ret);

			return ret;
		},

		/**
		 * pathタグd属性文字列を分割する
		 * @method splitD
		 * @param dString {string} pathのd要素文字列
		 * @return {string[][]} コマンド単位の情報配列の配列
		 */
		splitD : function(dString) {
			var ret = [];

			// 全コマンドリスト(BbRr非対応)
			var allCommand = /M|m|L|l|H|h|V|v|C|c|S|s|Q|q|T|t|A|a|Z|z/;

			// 要素分割
			var strList = dString.trim().split(/,| /);
			// 空要素削除(カンマとスペースが続くと空が入る)
			strList = strList.filter(function(str) {
				return str !== "";
			});

			// 直前のコマンド
			var pastCommand = "M";

			for (var i = 0; i < strList.length;) {
				var info = [];
				// コマンドがあるか？
				if (strList[i].match(allCommand)) {
					// あるので回収
					info[0] = strList[i].trim();
					pastCommand = info[0];
					// 進む
					i++;
				} else {
					// 前回同様
					info[0] = pastCommand;
				}

				// 情報数で場合分け
				if (info[0].match(/Z|z/)) {
					// 0つ
				} else if (info[0].match(/V|v|H|h/)) {
					// 2つ
					info = info.concat(strList.slice(i, i + 2));
					i += 2;
				} else if (info[0].match(/M|m|L|l|T|t/)) {
					// 2つ
					info = info.concat(strList.slice(i, i + 2));
					i += 2;
				} else if (info[0].match(/Q|q|S|s/)) {
					// 4つ
					info = info.concat(strList.slice(i, i + 4));
					i += 4;
				} else if (info[0].match(/C|c/)) {
					// 6つ
					info = info.concat(strList.slice(i, i + 6));
					i += 6;
				} else if (info[0].match(/A|a/)) {
					// 7つ
					info = info.concat(strList.slice(i, i + 7));
					i += 7;
				}

				ret.push(info);
			}

			return ret;
		},

		/**
		 * pathタグのスタイルを取得する
		 * @method parseTagStyle
		 * @param svgPath {} SVGのpathタグDOM
		 * @return {} スタイルオブジェクト
		 */
		parseTagStyle : function(svgPath) {
			var ret = {};

			// スタイル候補要素リスト
			var styleObject = [];

			if (!svgPath.attributes.style) {
				// 要素から直接取得
				for (var i = 0; i < svgPath.attributes.length; i++) {
					styleObject[svgPath.attributes[i].name] = svgPath.attributes[i].value;
				}
			} else {
				// style要素から取得
				var styleStr = svgPath.attributes.style.value;
				styleStr.split(";").forEach(function(elem) {
					var tmp = elem.split(":");
					var key = tmp[0];
					var val = tmp[1];
					styleObject[key] = val;
				}, this);
			}

			for (var key in styleObject) {
				var val = styleObject[key];

				if (key.toLowerCase() === "fill") {
					// fillなし考慮
					if (val.toLowerCase() === "none") {
						ret.fillStyle = 0;
						ret.fill = false;
					} else {
						ret.fillStyle = val;
						ret.fill = true;
					}
				} else if (key.toLowerCase() === "stroke") {
					// strokeなし考慮
					if (val.toLowerCase() === "none") {
						ret.strokeStyle = 0;
						ret.stroke = false;
					} else {
						ret.strokeStyle = val;
						ret.stroke = true;
					}
				} else if (key.toLowerCase() === "stroke-width") {
					ret.lineWidth = parseFloat(val, 10);
				} else if (key.toLowerCase() === "stroke-opacity") {
					ret.strokeGlobalAlpha = parseFloat(val, 10);
				} else if (key.toLowerCase() === "fill-opacity") {
					ret.fillGlobalAlpha = parseFloat(val, 10);
				} else if (key.toLowerCase() === "stroke-linecap") {
					ret.lineCap = val;
				} else if (key.toLowerCase() === "stroke-linejoin") {
					ret.lineJoin = val;
				} else if (key.toLowerCase() === "stroke-dasharray") {
					if (val.toLowerCase() === "none") {
						ret.lineDash = [];
					} else {
						var strArray = val.split(",");
						ret.lineDash = [];
						strArray.forEach(function(str) {
							ret.lineDash.push(parseFloat(str, 10));
						});
					}
				} else {
					// 無視
				}
			}

			return ret;
		},

		/**
		 * svg文字列を生成する
		 * @method serializeSvgString
		 * @param infoList {[]} path情報リスト
		 * @return {string} xml文字列
		 */
		serializeSvgString : function(infoList) {
			var svg = this.serializeSvg(infoList);
			var xml_serializer = new XMLSerializer();
			var text_xml = xml_serializer.serializeToString(svg);
			return text_xml;
		},

		/**
		 * svgタグを生成する
		 * @method serializeSvg
		 * @param infoList {[]} path情報リスト
		 * @return {dom} dom
		 */
		serializeSvg : function(infoList) {
			var dom = document.createElementNS("http://www.w3.org/2000/svg", "svg");

			// キャンバスサイズ用
			var width = 100;
			var height = 100;

			infoList.forEach(function(info) {
				var path = this.serializePath(info.pointList, info.style);
				dom.appendChild(path);

				info.pointList.forEach(function(p) {
					width = Math.max(width, p.x);
					height = Math.max(height, p.y);
				}, this);
			}, this);

			width *= 1.1;
			height *= 1.1;

			dom.setAttribute("width", width);
			dom.setAttribute("height", height);

			return dom;
		},

		/**
		 * pathタグを生成する
		 * @method serializePath
		 * @param pointList {vector[]} 座標リスト
		 * @param style {} スタイル情報
		 * @return {dom} dom
		 */
		serializePath : function(pointList, style) {
			var dom = document.createElementNS("http://www.w3.org/2000/svg", "path");

			var d = this.serializePointList(pointList);
			dom.setAttribute("d", d);

			var style = this.serializeStyle(style);
			dom.setAttribute("style", style);

			return dom;
		},

		/**
		 * 座標リストをd属性文字列に変換する
		 * @method serializePointList
		 * @param pointList {vector[]} 座標リスト
		 * @return {string} d属性文字列
		 */
		serializePointList : function(pointList) {
			var ret = "";

			pointList.forEach(function(p, i) {
				if (i === 0) {
					// M
					ret += "M " + p.x + "," + p.y;
				} else {
					// L
					ret += " L " + p.x + "," + p.y;

					if (i === pointList.length - 1) {
						// Z
						ret += " Z";
					}
				}
			}, this);

			return ret;
		},

		/**
		 * スタイル情報をstyle属性文字列に変換する
		 * @method serializeStyle
		 * @param style {} スタイル情報
		 * @return {string} style属性文字列
		 */
		serializeStyle : function(style) {
			var ret = "";

			// fill情報
			if (!style.fill) {
				ret += "fill:none;";
			} else {
				ret += "fill:" + style.fillStyle + ";";
			}
			if (style.fillGlobalAlpha) {
				ret += "fill-opacity:" + style.fillGlobalAlpha + ";";
			}

			// stroke情報
			if (!style.stroke) {
				ret += "stroke:none;";
			} else {
				ret += "stroke:" + style.strokeStyle + ";";
			}
			if (style.lineWidth) {
				ret += "stroke-width:" + style.lineWidth + ";";
			}
			if (style.strokeGlobalAlpha) {
				ret += "stroke-opacity:" + style.strokeGlobalAlpha + ";";
			}
			if (style.lineCap) {
				ret += "stroke-linecap:" + style.lineCap + ";";
			}
			if (style.lineJoin) {
				ret += "stroke-linejoin:" + style.lineJoin + ";";
			}
			if (style.lineDash) {
				if (style.lineDash.length > 0) {
					ret += "stroke-dasharray:" + style.lineDash.join(",") + ";";
				} else {
					ret += "stroke-dasharray:none;";
				}
			}

			return ret;
		},
	};

	return util;
});
