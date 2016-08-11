define(function(require) {
	var Matter = require("matter");
	var Body = Matter.Body;
	var svgUtil = require("slashCanvas2/common/svgUtil");
	var mathUtil = require("slashCanvas2/common/mathUtil");

	/**
	 * ブロッククラス
	 * @class Block
	 * @namespace slashCanvas2.model
	 * @constructor
	 */
	var Constructor = function() {
		/**
		 * matterボディ
		 * @property body
		 * @type {Matter.Body}
		 * @default null
		 */
		this.body = null;

		/**
		 * 座標リスト
		 * @property pointList
		 * @type {vector[]}
		 * @default []
		 */
		this.pointList = [];

		/**
		 * 初期位置
		 * @property initialPosition
		 * @type {vector}
		 * @default null
		 */
		this.initialPosition = null;

		/**
		 * スタイル
		 * @property style
		 * @type {}
		 */
		this.style = {
			fillStyle : "green",
			strokeStyle : "red",
			lineWidth : 2,
			lineDash : [],
			lineCap : "butt",
			lineJoin : "miter",
			strokeGlobalAlpha : 1,
			fillGlobalAlpha : 1,
		};
	};

	/**
	 * スラッシュに伴う動きの強さ
	 * @proeprty slashMovementPower
	 * @type {number}
	 + @default 1
	 * @static
	 */
	Constructor.prototype.slashMovementPower = 1;

	/**
	 * 座標リストからbody作成
	 * @method _createBody
	 * @private
	 * @param points {vector[]} 座標リスト
	 * @return {Matter.Body} ボディ
	 */
	Constructor.prototype._createBody = function(points) {
		// 時計回りに揃える
		points = mathUtil.convertLoopwise(points);

		var position = mathUtil.gravity2D(points);
		// プロパティ
		var prop = {
			position : position,
			frictionAir : 0,
			friction : 0.1,
			restitution : 0.6,
			vertices : points,
			render : {
				visible : false
			},
		};

		var body = Body.create(prop);
		return body;
	};

	/**
	 * 座標リストからbody作成
	 * @method createBody
	 * @param points {vector[]} 座標リスト
	 */
	Constructor.prototype.createBody = function(points) {
		var bodyList = [];

		// 同一座標オミット
		points = mathUtil.omitSamePoint(points);

		// 三角分割して破片作成
		var triList = mathUtil.triangleSplit(points);
		for (var j = 0; j < triList.length; j++) {
			var body = this._createBody(triList[j]);
			bodyList.push(body);
		}

		// マージ
		var compBody = Body.create({
			parts : bodyList
		});

		this.body = compBody;
		this.pointList = points.concat();
		this.initialPosition = mathUtil.pointCopy2D(this.body.position);
	};

	/**
	 * SVGのpathタグからロードする
	 * @method loadSvgPath
	 * @param svgPath {} SVGのpathタグDOM
	 * @param scale {number} 座標のスケール調整値
	 * @param shift {vector} 座標の移動調整(スケール調整後に実施)
	 */
	Constructor.prototype.loadSvgPath = function(svgPath, scale, shift) {
		// スタイルロード
		var style = svgUtil.parsePathStyle(svgPath);
		for (var key in style) {
			this.style[key] = style[key];
		}

		// 座標ロード
		var points = svgUtil.parsePath(svgPath);
		// 座標調整
		scale = scale || 1;
		shift = shift || {x:0,y:0};
		points.forEach(function(p) {
			// スケール→位置の順
			p.x *= scale;
			p.y *= scale;
			p.x += shift.x;
			p.y += shift.y;
		}, this);

		// bodyｓ作成
		this.createBody(points);
	};

	/**
	 * ブロックの座標を取得する
	 * @method getOriginalPointList
	 * @return {vector[]} 座標リスト
	 */
	Constructor.prototype.getOriginalPointList = function() {
		var ret = [];

		var points = this.pointList;
		// 現在位置に変換
		var vec = mathUtil.vecSub2D(this.body.position, this.initialPosition);

		points.forEach(function(point, i) {
			var p = mathUtil.vecAdd2D(point, vec);
			p = mathUtil.rotate2D(p, this.body.angle, this.body.position);
			ret.push(p);
		}, this);

		return ret;
	};

	/**
	 * スラッシュ
	 * @method slash
	 * @param line {vecotr[]} 直線
	 * @return {slashCanvas2.model.Block[]} 分割後ブロックリスト(分割されなければ自分自身のみ)
	 */
	Constructor.prototype.slash = function(line) {
		// オリジナル座標
		var orgPolygon = this.getOriginalPointList();

		// 新座標リスト
		var newPolygonList = this._slashLoop(orgPolygon, line);

		var ret = [];
		newPolygonList.forEach(function(polygon) {
			// 新ブロック作成
			var block = new this.constructor();
			// body生成
			block.createBody(polygon);
			// 情報継承
			block.inherit(this);
			ret.push(block);
		}, this);

		// 分割が発生しているなら動きを加える
		if (ret.length > 1) {
			ret.forEach(function(block) {
				block.addSlashMovement(line);
			}, this);
		}

		return ret;
	};

	/**
	 * 情報を受け継ぐ
	 * @method inherit
	 * @param parent {slashCanvas2.model.Block} 受け継ぎ元
	 */
	Constructor.prototype.inherit = function(parent) {
		// スタイル
		this.style = parent.style;

		// 慣性
		var v = mathUtil.vecSub2D(parent.body.position, parent.body.positionPrev);

		this.body.positionPrev.x -= v.x;
		this.body.positionPrev.y -= v.y;
		this.body.velocity.x = parent.body.velocity.x;
		this.body.velocity.y = parent.body.velocity.y;
	};

	/**
	 * スラッシュに伴う動きを加える
	 * @method addSlashMovement
	 * @param line {vector[2]} スラッシュ線
	 */
	Constructor.prototype.addSlashMovement = function(line) {
		// スラッシュベクトル
		var slashVec = mathUtil.vecSub2D(line[1], line[0]);
		// 重心
		var gravity = mathUtil.gravity2D(this.getOriginalPointList());
		// 重心からスラッシュ線への垂線の足
		var pedal = mathUtil.pedalPoint2D(gravity, line);
		// 垂線の足から重心へ向かうベクトル(→スラッシュ線と直行するベクトル)
		var crossVec = mathUtil.vecSub2D(gravity, pedal);

		try {
			// 単位ベクトル変換
			var v1 = mathUtil.vecUnit2D(slashVec);
			var v2 = mathUtil.vecUnit2D(crossVec);
			// 比率調整
			var random = Math.random();
			v1 = mathUtil.vecMult2D(v1, 0.00002 + (0.0002 * random));
			v2 = mathUtil.vecMult2D(v2, 0.0002 + (0.002 * random));
			// 質量の影響除外
			v1 = mathUtil.vecMult2D(v1, this.body.mass);
			v2 = mathUtil.vecMult2D(v2, this.body.mass);
			// 合成
			var puls = mathUtil.vecAdd2D(v1, v2);
			puls = mathUtil.vecMult2D(puls, this.slashMovementPower);
			// 適用
			Body.applyForce(this.body, pedal, puls);
			// this.body.velocity.x += puls.x;
			// this.body.velocity.y += puls.y;
		} catch (e) {
			// 0割りエラーなどは無視
		}
	};

	/**
	 * 面分断再帰処理
	 * @method _slashLoop
	 * @private
	 * @param polygon {vector[]} 面
	 * @param line {vector[]} 直線
	 * @return {vector[][]} 面リスト
	 */
	Constructor.prototype._slashLoop = function(polygon, line) {
		var ret = [];

		// 直線が横断するか判定
		var crossList = mathUtil.crossPolygonAndLine(polygon, line);
		if (crossList.length > 0) {
			// 分割
			var splitPolygonList = mathUtil.splitPolyByLine(polygon, line);
			if (splitPolygonList.length > 1) {
				splitPolygonList.forEach(function(poly) {
					// 再帰処理
					ret = ret.concat(this._slashLoop(poly, line));
				}, this);
			} else {
				// 分割なし
				ret.push(polygon);
			}
		} else {
			// 分割なし
			ret.push(polygon);
		}
		return ret;
	};

	//
	// 描画系
	//

	Constructor.prototype.onPaint = function(ctx) {
		ctx.strokeStyle = this.style.strokeStyle;
		ctx.lineWidth = this.style.lineWidth;
		ctx.lineJoin = this.style.lineJoin;
		ctx.fillStyle = this.style.fillStyle;
		ctx.setLineDash(this.style.lineDash);

		ctx.beginPath();
		if (this.pointList.length > 1) {
			this.getOriginalPointList().forEach(function(p, i) {
				if (i === 0) {
					ctx.moveTo(p.x, p.y);
				} else {
					ctx.lineTo(p.x, p.y);
				}
			}, this);
		}
		ctx.closePath();
		ctx.globalAlpha = this.style.fillGlobalAlpha;
		ctx.fill();
		ctx.globalAlpha = this.style.strokeGlobalAlpha;
		ctx.stroke();
		ctx.globalAlpha = 1;
	};

	return Constructor;
});
