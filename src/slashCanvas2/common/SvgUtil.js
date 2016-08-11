define(function(require) {
	var mathUtil = require("slashCanvas2/common/mathUtil");
	/**
	 * SVG関連処理
	 * @class SvgUtil
	 * @namespace slashCanvas2
	 * @static
	 */
	var util = {
		/**
		 * ベジェ曲線を何本の直線で近似するか
		 * @property BEZIER_SPLIT_COUNT
		 * @type {number}
		 * @default 5
		 */
		BEZIER_SPLIT_COUNT : 5,

		/**
		 * pathタグを解析する
		 * @method parsePath
		 * @param svgPath {} SVGのpathタグDOM
		 * @return {point[]} {x,y}の座標リスト
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

				switch (current.command) {
					case "M":
						// 初期位置(絶対)
						pList.push({x : current.x, y : current.y});
						break;
					case "m":
						// 初期位置(相対)
						pList.push({x : pastVec.x + current.x, y : pastVec.y + current.y});
						break;
					case "L":
						// 直線(絶対)
						pList.push({x : current.x, y : current.y});
						break;
					case "l":
						// 直線(相対)
						pList.push({x : pastVec.x + current.x, y : pastVec.y + current.y});
						break;
					case "Q" :
						// 制御点準備
						b0 = pastVec;
						b1 = {
							x : current.x,
							y : current.y
						};
						b2 = {
							x : current.x2,
							y : current.y2
						};
						// 近似
						pList = mathUtil.approximateBezier([b0, b1, b2], this.BEZIER_SPLIT_COUNT);
						break;
					case "q" :
						// 制御点準備
						b0 = pastVec;
						b1 = {
							x : b0.x + current.x,
							y : b0.y + current.y
						};
						b2 = {
							x : b0.x + current.x2,
							y : b0.y + current.y2
						};
						// 近似
						pList = mathUtil.approximateBezier([b0, b1, b2], this.BEZIER_SPLIT_COUNT);
						break;
					case "T" :
						// 制御点準備
						b0 = pastVec;
						b1 = mathUtil.symmetryPoint2D(b0, pastControlVec);
						b2 = {
							x : current.x,
							y : current.y
						};
						// 近似
						pList = mathUtil.approximateBezier([b0, b1, b2], this.BEZIER_SPLIT_COUNT);
						break;
					case "t" :
						// 制御点準備
						b0 = pastVec;
						b1 = mathUtil.symmetryPoint2D(b0, pastControlVec);
						b2 = {
							x : b0.x + current.x,
							y : b0.y + current.y
						};
						// 近似
						pList = mathUtil.approximateBezier([b0, b1, b2], this.BEZIER_SPLIT_COUNT);
						break;
					case "C" :
						// 制御点準備
						b0 = pastVec;
						b1 = {
							x : current.x,
							y : current.y
						};
						b2 = {
							x : current.x2,
							y : current.y2
						};
						b3 = {
							x : current.x3,
							y : current.y3
						};
						// 近似
						pList = mathUtil.approximateBezier([b0, b1, b2, b3], this.BEZIER_SPLIT_COUNT);
						pList.splice(0, 1);
						break;
					case "c" :
						// 制御点準備
						b0 = pastVec;
						b1 = {
							x : b0.x + current.x,
							y : b0.y + current.y
						};
						b2 = {
							x : b0.x + current.x2,
							y : b0.y + current.y2
						};
						b3 = {
							x : b0.x + current.x3,
							y : b0.y + current.y3
						};
						// 近似
						pList = mathUtil.approximateBezier([b0, b1, b2, b3], this.BEZIER_SPLIT_COUNT);
						pList.splice(0, 1);
						break;
					case "S" :
						// 制御点準備
						b0 = pastVec;
						b1 = mathUtil.symmetryPoint2D(b0, pastControlVec);
						b2 = {
							x : current.x,
							y : current.y
						};
						b3 = {
							x : current.x2,
							y : current.y2
						};
						// 近似
						pList = mathUtil.approximateBezier([b0, b1, b2, b3], this.BEZIER_SPLIT_COUNT);
						pList.splice(0, 1);
						break;
					case "s" :
						// 制御点準備
						b0 = pastVec;
						b1 = mathUtil.symmetryPoint2D(b0, pastControlVec);
						b2 = {
							x : b0.x + current.x,
							y : b0.y + current.y
						};
						b3 = {
							x : b0.x + current.x2,
							y : b0.y + current.y2
						};
						// 近似
						pList = mathUtil.approximateBezier([b0, b1, b2, b3], this.BEZIER_SPLIT_COUNT);
						pList.splice(0, 1);
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

			return ret;
		},

		/**
		 * pathタグd属性文字列を分割する
		 * @method splitD
		 * @param dString {string} pathのd要素文字列
		 * @return {[]} {command, x, y}要素リスト
		 */
		splitD : function(dString) {
			var ret = [];

			// 全コマンドリスト
			var reg = /M|m|L|l|H|h|V|v|C|c|S|s|Q|q|T|t|A|a|Z|z|B|b|R|r/;
			// 座標１つ以上のコマンド
			var onePointReg = /M|m|L|l|T|t|Q|q|C|c/;
			// 座標２つ以上のコマンド
			var twoPointReg = /Q|q|C|c|S|s/;
			// 座標3つ以上のコマンド
			var threePointReg = /C|c/;

			// 残り文字列
			var current = dString;

			while (current.length > 0) {
				var element = {};
				// コマンド部分)
				element.command = current[0];
				current = current.slice(1);

				// このブロックの情報部分
				var block = null;

				// 次の要素開始位置
				var index = current.search(reg);
				if (index === -1) {
					// 次の要素なし
					block = current.slice(0);
					current = "";
				} else {
				block = current.slice(0, index);
					current = current.slice(index);
				}

				// 座標１つ
				if (element.command.search(onePointReg) !== -1) {
					var pointStrList = block.trim().split(/,| /);
					element.x = parseFloat(pointStrList[0]);
					element.y = parseFloat(pointStrList[1]);

					// 座標２つ
					if (element.command.search(twoPointReg) !== -1) {
						element.x2 = parseFloat(pointStrList[2]);
						element.y2 = parseFloat(pointStrList[3]);

						// 座標3つ
						if (element.command.search(threePointReg) !== -1) {
							element.x3 = parseFloat(pointStrList[4]);
							element.y3 = parseFloat(pointStrList[5]);
						}
					}
				}

				ret.push(element);
			}

			return ret;
		},

		/**
		 * pathタグのスタイルを取得する
		 * @method parsePathStyle
		 * @param svgPath {} SVGのpathタグDOM
		 * @return {} スタイルオブジェクト
		 */
		parsePathStyle : function(svgPath) {
			var ret = {};
			var styleStr = svgPath.attributes.style.value;
			// 要素分解
			var elementList = styleStr.split(";");
			elementList.forEach(function(element) {
				var tmp = element.split(":");
				var key = tmp[0];
				var val = tmp[1];

				if (key.toLowerCase() === "fill") {
					ret.fillStyle = val;
				} else if (key.toLowerCase() === "stroke") {
					ret.strokeStyle = val;
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
					var strArray = val.split(",");
					ret.lineDash = [];
					strArray.forEach(function(str) {
						ret.lineDash.push(parseFloat(str, 10));
					});
				} else {
					// 無視
				}
			}, this);

			return ret;
		},
	};

	return util;
});
