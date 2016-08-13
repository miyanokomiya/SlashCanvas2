/*!
 * SlashCanvas2
 * v1.0.0 (c) 2016 miyanokomiya.tokyo
 * license MIT
 */
define(function(require) {
	var Matter = require("matter");
	var $ = require("jquery");

	var Engine = Matter.Engine,
		Render = Matter.Render,
	    World = Matter.World,
		Bodies = Matter.Bodies,
		Body = Matter.Body,
		Svg = Matter.Svg,
		MouseConstraint = Matter.MouseConstraint;

	var Sound = require("common/Sound");
	var Block = require("slashCanvas2/model/Block");
	var mathUtil = require("common/mathUtil");
	var svgUtil = require("common/svgUtil");
	var canvasUtil = require("common/canvasUtil");

	/**
	 * スラッシュキャンバス2本体
	 * @class App
	 * @namespace slashCanvas2
	 * @constructor
	 * @param rootDomId {string} 設置先DOMのID
	 * @param option {} オプション
	 */
	var Constructor = function(rootDomId, option) {
		/**
		 * 設置先DOMのID
		 * @property rootDomId
		 * @type {string}
		 */
		this.rootDomId = rootDomId;

		/**
		 * matterエンジン
		 * @property engine
		 * @type {Matter.Engine}
		 * @default null
		 */
		this.engine = null;

		/**
		 * matterレンダー
		 * @property render
		 * @type {Matter.Render}
		 * @default null
		 */
		this.render = null;

		/**
		 * キャンバスDOM
		 * @property canvas
		 * @type {}
		 * @default null
		 */
		this.canvas = null;

		/**
		 * キャンバスの描画要素
		 * @property ctx
		 * @type {}
		 * @default null
		 */
		this.ctx = null;

		/**
		 * ブロックリスト
		 * @property blockList
		 * @type {[]}
		 * @default []
		 */
		this.blockList = [];

		/**
		 * スラッシュラインリスト<br>
		 * オブジェクト{s : 始点, e : 終点, life : 残り生存時間}の配列
		 * @property slashLineList
		 * @type {[]}
		 * @default []
		 */
		this.slashLineList = [];

		//
		// オプション要素
		//

		if (!option) {
			option = {};
		}

		/**
		 * 幅
		 * @property width
		 * @type {number}
		 * @default 400
		 */
		this.width = option.width || 400;

		/**
		 * 高さ
		 * @property height
		 * @type {number}
		 * @default 400
		 */
		this.height = option.height || 400;

		/**
		 * x軸重力
		 * @property gravityX
		 * @type {number}
		 * @default 0
		 */
		this.gravityX = !isNaN(option.gravityX) ? option.gravityX : 0;

		/**
		 * y軸重力
		 * @property gravityY
		 * @type {number}
		 * @default 0
		 */
		this.gravityY = !isNaN(option.gravityY) ? option.gravityY : 0;

		/**
		 * サウンド
		 * @property sound
		 * @type {slashCanvas.common.Sound}
		 * @default null
		 */
		this.sound = option.sound ? new Sound(option.sound) : null;

		/**
		 * SVGソースファイルの場所
		 * @property svgSource
		 * @type {string}
		 * @default null
		 */
		this.svgSource = option.svgSource || null;

		/**
		 * SVGの座標スケール
		 * @property svgScale
		 * @type {number}
		 * @default 1
		 */
		this.svgScale = option.svgScale || 1;

		/**
		 * SVG座標の移動(スケール調整後に実施)
		 * @property svgShift
		 * @type {vector}
		 * @default {x:0,y:0}
		 */
		this.svgShift = option.svgShift || {x:0,y:0};

		/**
		 * スラッシュ線カラー
		 * @property slashLineColor
		 * @type {color}
		 * @defalut {yellow};
		 */
		this.slashLineColor = option.slashLineColor || "yellow";

		//
		// Blockクラスのオプション
		//
		if (!isNaN(option.slashMovementPower)) {
		Block.prototype.slashMovementPower = option.slashMovementPower;
		}

		// 初期化
		this.init();
	};

	/**
	 * 初期化
	 * @method init
	 */
	Constructor.prototype.init = function() {
		var self = this;

		this.initWorld();

		// SVGリソース取得
		var req = new XMLHttpRequest();
		req.open("get", this.svgSource, true);
		req.onload = function() {
			// パース
			var svgInfoList = svgUtil.loadSvgGraphicsPath(req.responseText);

			// ブロック作成
			var bodyList = [];
			for (var i = 0; i < svgInfoList.length; i++) {
				var info = svgInfoList[i];
				// 座標調整
				info.pointList.forEach(function(p) {
					p.x = p.x * self.svgScale + self.svgShift.x;
					p.y = p.y * self.svgScale + self.svgShift.y;
				});
				block = new Block();
				block.createBody(info.pointList, info.style);
				self.blockList.push(block);
				bodyList = bodyList.concat(block.body);
			}

			World.add(self.engine.world, bodyList);

			self.bindCanvasEvent(self.render.canvas);
		};
		req.send(null);
	};

	/**
	 * 世界の初期化
	 * @method initWorld
	 */
	Constructor.prototype.initWorld = function() {
		var self = this;

		this.engine = Engine.create();
		this.render = Render.create({
			element : document.getElementById(this.rootDomId),
			engine : this.engine,
			options : {
				wireframes : false
			}
		});

		this.engine.world.gravity.x = this.gravityX;
		this.engine.world.gravity.y = this.gravityY;

		this.canvas = this.render.canvas;
		this.render.canvas.width = this.width;
		this.render.canvas.height = this.height;

		this.resetBodies();

		Engine.run(this.engine);
		Render.run(this.render);

		// ステップ後イベントハンドラ
		Matter.Events.on(this.render, "afterRender", function(){
			// スプライト描画
			var ctx = self.render.canvas.getContext("2d");
			self.blockList.forEach(function(block) {
				block.onPaint(ctx);
			});

			ctx.strokeStyle = self.slashLineColor;
			ctx.globalAlpha = 1;
			ctx.lineWidth = 2;

			// スラッシュ線描画
			self.slashLineList.forEach(function(line) {
				var start = line.s;
				var end = line.e;

				ctx.beginPath();
				ctx.moveTo(start.x, start.y);
				ctx.lineTo(end.x, end.y);
				ctx.stroke();

				line.life--;
			});

			// スラッシュ線削除
			self.slashLineList = self.slashLineList.filter(function(line) {
				// ライフが残っているものだけ回収
				return (line.life > 0);
			});
		});
	};

	/**
	 * ボディ作り直し
	 * @method resetBodies
	 */
	Constructor.prototype.resetBodies = function() {
		var engine = this.engine;

		World.clear(this.engine.world);
		Engine.clear(this.engine);
		/*
		var mc = MouseConstraint.create(this.engine, {
			element : this.render.canvas
		});

		World.add(this.engine.world, mc);
		*/
		// 矩形で枠線を作る(rectangle(x座標,y座標,横幅,縦幅,option))
		var frameWidth = this.width;
		var frameHeight = this.height;
		var offset = 15;

		World.add(engine.world, [
			// 床
			Bodies.rectangle(
				frameWidth / 2,
				frameHeight,
				frameWidth + 2 * offset,
				offset,
				{ isStatic: true}),

			// 天井
			Bodies.rectangle(
				frameWidth / 2,
				0,
				frameWidth + 2 * offset,
				offset,
				{ isStatic: true}),

			// 右壁
			Bodies.rectangle(
				frameWidth,
				0,
				offset,
				2 * (frameHeight + 2 * offset),
				{ isStatic: true}),

			// 左壁
			Bodies.rectangle(
				0,
				0,
				offset,
				2 * (frameHeight + 2 * offset),
				{ isStatic: true})
		]);
	};

	/**
	 * キャンバスへのイベントハンドラ
	 * @method bindCanvasEvent
	 * @param target {} イベントハンドラ設定先
	 */
	Constructor.prototype.bindCanvasEvent = function(target) {
		var self = this;

		// 始点と終点記録用
		var slash = [];

		var length = this.width * this.width + this.height * this.height;

		$(target).on("mousedown touchstart", function(e) {
			// 始点記録
			slash.length = 0;
			slash[0] = canvasUtil.getCursorPoint(e);
		});

		$(target).on("mousemove touchmove", function(e) {
			e.preventDefault();

			// 終点記録
			if (slash.length > 0) {
				slash[1] = canvasUtil.getCursorPoint(e);
			}
		});

		$(target).on("mouseup touchend touchcancel", function(e) {
			if (slash.length > 1) {
				// 長さチェック
				var vec = mathUtil.vecSub2D(slash[0], slash[1]);
				var slashLength = mathUtil.length2D({x:0,y:0}, vec);
				if (slashLength > 5) {
					if (self.sound) {
						self.sound.play();
					}

					// ブロック分割
					var blockList = [];
					self.blockList.forEach(function(block) {
						blockList = blockList.concat(block.slash(slash));
					});

					// ボディリセット
					self.resetBodies();

					// 作り直し
					self.blockList = blockList;
					self.bodyList = [];
					blockList.forEach(function(block) {
						self.bodyList.push(block.body);
					});
					World.add(self.engine.world, self.bodyList);

					// スラッシュ線として記録
					var scale = length / slashLength;
					vec = mathUtil.vecMult2D(vec, scale);

					// 外接円の半径分拡大
					var p1 = mathUtil.vecSub2D(slash[0], vec);
					var p2 = mathUtil.vecAdd2D(slash[1], vec);

					self.slashLineList.push({s : p1, e : p2, life : 60});
				}
			}

			slash.length = 0;
		});
	};
	return Constructor;
});
