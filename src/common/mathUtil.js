define(function(){
	/**
	 * 数学計算クラス
	 * @class mathUtil
	 * @namespace MiyanokoLib
	 * @static
	 */
	var mathUtil = {
		/**
		 * 0とみなす閾値
		 * @property MINVALUE
		 * @type {number}
		 * @default 0.000001
		 */
		MINVALUE : 0.000001,

		/**
		 * 同一座標判定
		 * @method isSame2D
		 * @param a {vector} 座標a
		 * @param b {vector} 座標b
		 * @return {bool} 同一である
		 */
		isSame2D : function(a, b) {
			return (Math.abs(a.x - b.x) < this.MINVALUE) && (Math.abs(a.y - b.y) < this.MINVALUE);
		},

		/**
		 * 2点の距離を求める
		 * @method length2D
		 * @param a {vector} 点a
		 * @param b {vector} 点b(省略したら原点)
		 * @return {number} ab間の距離
		 */
		length2D : function(a, b){
			b = b || {x:0,y:0};

			var dx = (a.x - b.x);
			var dy = (a.y - b.y);

			return Math.sqrt(dx * dx + dy * dy);
		},

		/**
		 * ベクトル足し算
		 * @method vecAdd2D
		 * @param a {vector} 座標a
		 * @param b {vector} 座標b
		 * @return {vector} a + b
		 */
		vecAdd2D : function(a, b){
			return {x: a.x + b.x, y: a.y + b.y};
		},

		/**
		 * ベクトル引き算
		 * @method vecSub2D
		 * @param a {vector} 座標a
		 * @param b {vector} 座標b
		 * @return {vector} a - b
		 */
		vecSub2D : function(a, b){
			return {x: a.x - b.x, y: a.y - b.y};
		},

		/**
		 * ベクトル掛け算
		 * @method vecMult2D
		 * @param a {vector} 座標a
		 * @param c {number} スカラc
		 * @return {)ector} a * c
		 */
		vecMult2D : function(a, c){
			return {x: a.x * c, y: a.y * c};
		},

		/**
		 * 単位ベクトル取得
		 * @method vecUnit2D
		 * @param v {vector} 座標v
		 * @return {vector} vの単位ベクトル
		 * @throws {Error} vがゼロベクトルだった場合に発行
		 */
		vecUnit2D : function(v){
			var d = this.length2D(v);

			if (Math.abs(d) < this.MINVALUE) {
				throw new Error("Unit vector cannot be calced from zero vector.");
			}

			return this.vecMult2D(v, 1/d);
		},

		/**
		 * 外積を求める<br/>
		 * = |a||b|sinθ
		 * @method cross2D
		 * @param a {vector}
		 * @param b {vector}
		 * @return {number} 2次元外積
		 */
		cross2D : function(a, b) {
			return a.x * b.y - a.y * b.x;
		},

		/**
		 * 内積を求める<br/>
		 * = |a||b|cosθ
		 * @method inner2D
		 * @param a {vector}
		 * @param b {vector}
		 * @return {number} 2次元内積
		 */
		inner2D : function(a, b) {
			return a.x * b.x + a.y * b.y;
		},

		/**
		 * 座標複製
		 * @method pointCopy2D
		 * @param a {vector} 元座標
		 * @return {vector} 複製座標
		 */
		pointCopy2D : function(a){
			if (a){
				return {x: a.x, y: a.y};
			} else {
				return null;
			}
		},

		/**
		 * 座標リスト複製
		 * @method pointArrayCopy2D
		 * @param arr {point[]} 元座標リスト
		 * @return {point[]} 複製座標リスト
		 */
		pointArrayCopy2D : function(arr){
			var ret = [];

			for (var i = 0; i < arr.length; i++){
				ret.push(this.pointCopy2D(arr[i]));
			}
			return ret;
		},

		/**
		 * 中点取得
		 * @method centralPoint2D
		 * @param a {vector}
		 * @param b {vector}
		 * @return {vector} 中点
		 */
		centralPoint2D : function(a, b){
			var add = this.vecAdd2D(a, b);
			return this.vecMult2D(add, 1/2);
		},

		/**
		 * a点からb点へのラジアンを求める
		 * @method radian2D
		 * @param a {vector}
		 * @param b {vector}
		 * @return {number} aからbへのラジアン
		 */
		radian2D : function(a, b){
			var dx = a.x - b.x;
			var dy = a.y - b.y;
			return (Math.atan2(dy ,dx) + (Math.PI * 2)) % (Math.PI * 2);
		},

		/**
		 * a点についてb点から点対称な点cを求める
		 * @method symmetryPoint2D
		 * @param a {vector}
		 * @param b {vector}
		 * @return {vector} a点についてb点から点対称な点c
		 */
		symmetryPoint2D : function(a, b){
			var ba = this.vecSub2D(b, a);
			var c = this.pointCopy2D(a);
			c.x += ba.x;
			c.y += ba.y;
			return c;
		},

		/**
		 * a点をbを基準にrad回転する
		 * @method rotate2D
		 * @param a {vector} a点
		 * @param rad {number} 回転ラジアン
		 * @param b {vector} 基準点(省略なら原点)
		 * @return {vector} 回転後の点
		 */
		rotate2D : function(a, rad, b) {
			b = b || {x:0,y:0};

			a = this.vecSub2D(a, b);
			var d = this.length2D(a);
			var ret = {};
			ret.x = Math.cos(rad) * a.x - Math.sin(rad) * a.y;
			ret.y = Math.sin(rad) * a.x + Math.cos(rad) * a.y;
			ret = this.vecAdd2D(ret, b);
			return ret;
		},

		/**
		 * 2次方程式の解の公式
		 * a * x^2 + b * x + c = 0
		 * 解に虚数が含まれる場合は解なし扱い
		 * @method solveEquationOrder2
		 * @param a {number}
		 * @param b {number}
		 * @param c {number}
		 * @return {[x, y, z]} 解の配列
		 */
		solveEquationOrder2 : function(a, b, c) {
			if(a === 0) {
				return b === 0 ? [] : [-c / b];
			}

			var d = b * b - 4 * a * c;
			if(d < 0) return [];

			var ia = 0.5 / a;

			if(d === 0) {
				return [-b * ia];
			}

			var sd = Math.sqrt(d);
			return [(-b + sd) * ia, (-b - sd) * ia];
		},

		/**
		 * 点から最短となる直線上の点を求める
		 * @method pedalPoint2D
		 * @param p {vector} 点p
		 * @param line {array} 直線上の2点AB
		 * @return {vector} 最短の点
		 */
		pedalPoint2D : function(P, line){
			var A = line[0];
			var B = line[1];
			var vecAB = this.vecSub2D(B, A);
			var vecAP = this.vecSub2D(P, A);
			var cross = this.inner2D(vecAB, vecAP);
			var rate = cross / this.inner2D(vecAB, vecAB);
			return this.vecAdd2D(A, this.vecMult2D(vecAB, rate));
		},

		/**
		 * 二次ベジェ曲線と直線の当たり判定用パラメータを取得する
		 * @method _rayToBezier2
		 * @private
		 * @param p0 {vector} ベジェ曲線始点
		 * @param p1 {vector} ベジェ曲線制御点
		 * @param p2 {vector} ベジェ曲線終点
		 * @param p {vector} 直線始点
		 * @param q {vector} 直線終点
		 * @return {[a, b, c]} ベジェ曲線パラメータ配列
		 */
		_rayToBezier2 : function(p0, p1, p2, p, q) {
			var vx = q.x - p.x,
				vy = q.y - p.y,
				a = p0.x - 2 * p1.x + p2.x,
				b = 2 * (p1.x - p0.x),
				c = p0.x,
				d = p0.y - 2 * p1.y + p2.y,
				e = 2 * (p1.y - p0.y),
				f = p0.y;

			var t = this.solveEquationOrder2(
				a * vy - vx * d,
				b * vy - vx * e,
				vy * c - vy * p.x - vx * f + vx * p.y
			);

			return t;
		},

		/**
		 * 二次ベジェ曲「線分」と「直線」の交点を取得する
		 * @method crossLineAndBezier
		 * @param p0 {vector} ベジェ曲線始点
		 * @param p1 {vector} ベジェ曲線制御点
		 * @param p2 {vector} ベジェ曲線終点
		 * @param p {vector} 直線始点
		 * @param q {vector} 直線終点
		 * @return {vector[]} 交点リスト
		 */
		crossLineAndBezier : function(p0, p1, p2, p, q){
			// パラメータ取得
			var t = this._rayToBezier2(p0, p1, p2, p, q);

			var vx = q.x - p.x,
				vy = q.y - p.y;

			var ret = [];
			for (var i = 0; i < t.length; i++){
				if (0 <= t[i] && t[i] <= 1){
					// ベジェ曲線分上の点を求める
					ret.push({
						x: (p2.x - 2 * p1.x + p0.x) * t[i] * t[i] + 2 * (p1.x - p0.x) * t[i] + p0.x,
						y: (p2.y - 2 * p1.y + p0.y) * t[i] * t[i] + 2 * (p1.y - p0.y) * t[i] + p0.y,
					});
				}
			}
			return ret;
		},

		/**
		 * 座標郡を囲む矩形を取得する<br>
		 * 境界上に重なる
		 * @method aroundRectangle
		 * @param arr {vector[]} 座標郡
		 * @return {x,y,width,height} 矩形情報
		 */
		aroundRectangle : function(arr){
			var xList = [];
			var yList = [];

			arr.forEach(function(p) {
				xList.push(p.x);
				yList.push(p.y);
			});

			var min = {
				x : Math.min.apply(null, xList),
				y : Math.min.apply(null, yList)
			};

			var max = {
				x : Math.max.apply(null, xList),
				y : Math.max.apply(null, yList)
				};

			return {
				x : min.x,
				y : min.y,
				width : max.x - min.x,
				height : max.y - min.y,
			};
		},

		/**
		 * 座標群を囲む矩形の中心を取得する
		 * @method centerOfAroundRectangle
		 * @param arr {vector[]} 座標群
		 * @return {vector} 中心座標
		 */
		centerOfAroundRectangle : function(arr){
			var lec = this.aroundRectangle(arr);
			return {
				x : lec.x + (lec.width / 2),
				y : lec.y + (lec.height / 2),
			};
		},

		/**
		 * 点が三角形内にあるかを判定する<br>
		 * 境界も含む
		 * @method isPointOnTriangle
		 * @param tri {vector[3]} 三角形
		 * @param p {vector} 点
		 * @return {bool} 内部にあるフラグ
		 */
		isPointOnTriangle : function(tri, p) {
			// 三角形の3つのベクトル
			var ab = this.vecSub2D(tri[1], tri[0]);
			var bc = this.vecSub2D(tri[2], tri[1]);
			var ca = this.vecSub2D(tri[0], tri[2]);

			// 三角形の各点からpへのベクトル
			var ap = this.vecSub2D(p, tri[0]);
			var bp = this.vecSub2D(p, tri[1]);
			var cp = this.vecSub2D(p, tri[2]);

			// 外積を求める
			var crossABP = this.cross2D(ab, bp);
			var crossBCP = this.cross2D(bc, cp);
			var crossCAP = this.cross2D(ca, ap);

			// 外積の符号が全て同じなら内部にある
			// 0も含む→境界も含む
			if ((crossABP >= 0 && crossBCP >= 0 && crossCAP >= 0) ||
				(crossABP <= 0 && crossBCP <= 0 && crossCAP <= 0)) {
				return true;
			}

			return false;
		},

		/**
		 * 面に点が含まれているか判定する
		 * 境界を含む判定
		 * @method isPointOnArea
		 * @param arr {vector[]} 面の座標群
		 * @param point {vector} 対象点
		 * @return {bool} 含まれているならtrue
		 */
		isPointOnArea : function(area, point){
			var i = 0;

			// 判定対象線分取得
			var lines = [];
			for (i = 0; i < area.length; i++){
				var p1 = area[i % area.length];
				var p2 = area[(i + 1) % area.length];
				if (p1.x >= point.x || p2.x >= point.x){
					// 保存
					lines.push([p1, p2]);
				}
			}

			// TODO 線分上判定

			var count = 0;
			for (i = 0; i < lines.length; i++){
				// x方向で交わった線分をカウントする

				// エリアの最大となるx座標を求める
				var rec = this.aroundRectangle(area);
				var max = rec.x + rec.width;

				if (this.isCrossSegAndSeg([point, {x: max, y:point.y}], lines[i])){
					count++;
				}
			}

			return (count % 2) === 1;
		},

		/**
		 * ベジェ曲線を含む面に点が含まれるか判定
		 * area[0]とarea[1]の制御点はbezier[1]となる
		 * areaの最後と最初の制御点はbezier[0]となる
		 * 制御点がない部分はbezier内のその要素にnullを入れること
		 * @method isPointOnBezierArea
		 * @param area {vector[]} 面の座標
		 * @param bezier {vector[]} 制御点
		 * @param {vector} 判定する点
		 * @return {bool} 含まれているならtrue
		 */
		isPointOnBezierArea : function(area, bezier, point){
			var i = 0;
			var p0 = null;
			var p1 = null;
			var p2 = null;

			var pointCount = area.length;
			// 判定対象線分取得
			var lines = [];
			var bezierLines = [];
			for (i = 0; i < pointCount; i++){
				p1 = area[i % pointCount];
				p2 = area[(i + 1) % pointCount];
				//if (p1.x >= point.x || p2.x >= point.x){
				if (true){
					// ベジェは分ける
					if (bezier[(i + 1) % pointCount]){
						bezierLines.push([p1, bezier[(i + 1) % pointCount], p2]);
					} else {
						lines.push([p1, p2]);
					}
				}
			}

			// 交わった合計
			var count = 0;

			// エリアの最大となるx座標を求める
			var rec = this.aroundRectangle(area);
			// x方向に伸ばす
			var max = (rec.x + rec.width) * 10;
			var rightP = {x: max, y:point.y};

			// 直線を判定
			for (i = 0; i < lines.length; i++){
				// x方向で交わった線分をカウントする
				if (this.isCrossSegAndSeg([point, rightP], lines[i])){
					count++;
				}
			}

			// ベジェを判定
			for (i = 0; i < bezierLines.length; i++){
				// x方向で交わった線分をカウントする
				p0 = bezierLines[i][0];
				p1 = bezierLines[i][1];
				p2 = bezierLines[i][2];

				// 直線とベジェ曲線分の交点取得(なし、1点、2点の場合あり)
				var crossPs = this.crossLineAndBezier(p0, p1, p2, point, rightP);

				// 交点数分だけ線分内か判定
				for (var j = 0; j < crossPs.length; j++){
					if (crossPs[j].x >= point.x){
						count++;
					}
				}
			}

			// 交点数が奇数なら面内となる
			return (count % 2) === 1;
		},

		/**
		 * 線分と線分の交差判定
		 * 線分同士が重なっている場合は交差なし扱い
		 * @method isCrossSegAndSeg
		 * @param ab {vector[]} 線分ab
		 * @param cd {vector[]} 線分cd
		 * @return {bool} 交差ありフラグ
		 */
		isCrossSegAndSeg : function(ab, cd) {
			return this._isCrossSegAndSeg(ab[0].x, ab[0].y, ab[1].x, ab[1].y, cd[0].x, cd[0].y, cd[1].x, cd[1].y);
		},

		/**
		 * 線分と線分の交差判定
		 * 線分同士が重なっている場合は交差なし扱い
		 * @method _isCrossSegAndSeg
		 * @private
		 * @param ax {number}
		 * @param ay {number}
		 * @param bx {number}
		 * @param by {number}
		 * @param cx {number}
		 * @param cy {number}
		 * @param dx {number}
		 * @param dy {number}
		 * @return {bool} 交差ありフラグ
		 */
		_isCrossSegAndSeg : function(ax, ay, bx, by, cx, cy, dx, dy) {
			var ta = (cx - dx) * (ay - cy) + (cy - dy) * (cx - ax);
			var tb = (cx - dx) * (by - cy) + (cy - dy) * (cx - bx);
			var tc = (ax - bx) * (cy - ay) + (ay - by) * (ax - cx);
			var td = (ax - bx) * (dy - ay) + (ay - by) * (ax - dx);

			return tc * td < 0 && ta * tb < 0;
		},

		/**
		 * 直線と線分の交差判定
		 * @method isCrossLineAndSeg
		 * @param line {vector[]} 直線
		 * @param seg {vector[]} 線分
		 * @return {bool} 交差ありフラグ
		 */
		isCrossLineAndSeg : function(line, seg){
			var c0 = this.cross2D(line[0], this.vecSub2D(seg[0], line[1]));
			var c1 = this.cross2D(line[0], this.vecSub2D(seg[1], line[1]));
			if(c0 * c1 < 0) {
				return true;
			} else {
				return false;
			}
		},

		/**
		 * 平行判定
		 * @method isParallel
		 * @param ab {vector[]} ベクトル or 2点の配列
		 * @param cd {vector[]} 同上
		 * @return {bool} 平行であるフラグ
		 */
		isParallel : function(ab, cd){
			ab = !Array.isArray(ab) ? ab : this.vecSub2D(ab[1], ab[0]);
			cd = !Array.isArray(cd) ? cd : this.vecSub2D(cd[1], cd[0]);

			var cross = this.cross2D(ab, cd);
			if (Math.abs(cross) < this.MINVALUE){
				return true;
			} else {
				return false;
			}
		},

		/**
		 * 面と直線の交点取得
		 * @method crossPolygonAndLine
		 * @param pol {vector[]} 面
		 * @param line {vector[]} 直線
		 * @return {vector[]} 交点リスト)
		 */
		crossPolygonAndLine : function(pol, line){
			var ret = [];
			var length = pol.length;
			for (var i = 0; i < length; i++){
				// 辺取得
				var targetLine = [pol[i], pol[(i + 1) % length]];
				// 交点取得
				var p = this.crossSegAndLine(targetLine, line);
				if (p !== null){
					ret.push(p);
				}
			}
			return ret;
		},

		/**
		 * 点が直線上にあるか判定
		 * @method isOnLine
		 * @param p {vector} 点
		 * @param line {vector[]} 直線
		 * @return {bool} あるフラグ
		 */
		isOnLine : function(p, line) {
			var pedal = this.pedalPoint2D(p, line);

			return (this.isSame2D(p, pedal));
		},

		/**
		 * 線分と直線の交点取得
		 * @method crossSegAndLine
		 * @param ab {vector[]} 線分
		 * @param cd {vectod[]} 直線
		 * @return {vector} 交点
		 */
		crossSegAndLine : function(ab, cd){
			if (this.isParallel(ab, cd)){
				// 平行判定
				return null;
			}

			// 端点判定
			if (this.isOnLine(ab[0], cd)) {
				return this.pointCopy2D(ab[0]);
			}
			if (this.isOnLine(ab[1], cd)) {
				return this.pointCopy2D(ab[1]);
			}

			var s1 = ((cd[1].x - cd[0].x) * (ab[0].y - cd[0].y) - (cd[1].y - cd[0].y) * (ab[0].x - cd[0].x)) / 2;
			var s2 = ((cd[1].x - cd[0].x) * (cd[0].y - ab[1].y) - (cd[1].y - cd[0].y) * (cd[0].x - ab[1].x)) / 2;

			var rate = s1 / (s1 + s2);

			if (0 < rate && rate < 1){
				var p = {
					x: ab[0].x + (ab[1].x - ab[0].x) * rate,
					y: ab[0].y + (ab[1].y - ab[0].y) * rate
				};

				return p;
			} else {
				return null;
			}
		},

		/**
		 * ポリゴンを直線で分割する
		 * @method splitPolyByLine
		 * @param pol {vector[]} 面
		 * @param line {vector[]} 直線
		 * @return {vector[][]} 分割された点配列の配列
		 */
		splitPolyByLine : function(pol, line){
			var self = this;
			var points = [];
			var crossIndex = [];
			var crossList = [];
			var i = 0;

			var length = pol.length;
			for (i = 0; i < length; i++){
				// 辺取得
				var targetLine = [pol[i % length], pol[(i + 1) % length]];
				// 交点取得
				var p = this.crossSegAndLine(targetLine, line);

				// 点追加
				points.push(pol[i % length]);
				if (p !== null){
					// 交点追加
					points.push(p);
					// 交点インデックス保存
					crossIndex.push(i + 1 + crossIndex.length);

					// 交点をとっておく
					crossList.push(p);
				}
			}

			// 交点数チェック
			if (crossList.length % 2 !== 0) {
				return [];
			}

			// 交点を2つに絞る→直線のベクトルソート
			var rad = this.radian2D(line[0], line[1]);
			var lengthList = [];
			// 近い順に並べる
			crossList.sort(function(a, b) {
				a = self.rotate2D(a, -rad);
				b = self.rotate2D(b, -rad);

				return a.x - b.x;
			});

			// 面の辺と同一ではないものを採用
			var targetSection = [];
			for (var k = 0; k < crossList.length - 1;) {
				var section = [crossList[k], crossList[k + 1]];
				var sameSeg = false;

				for (var l = 0; l < pol.length; l++) {
					if (this.isSameSeg2D(section, [pol[l], pol[(l + 1) % pol.length]])) {
						// 一致する
						sameSeg = true;
						break;
					}
				}

				if (!sameSeg) {
					// 採用
					targetSection = section;
					break;
				}

				k += 2;
			}

			if (targetSection.length !== 2) {
				return [];
			}

			// 除外対象回収
			var dropList = crossList.concat();
			var tmpIndex = dropList.indexOf(targetSection[0]);
			if (tmpIndex !== -1) {
				dropList.splice(tmpIndex, 1);
			}
			tmpIndex = dropList.indexOf(targetSection[1]);
			if (tmpIndex !== -1) {
				dropList.splice(tmpIndex, 1);
			}
			var tmpList = points.concat();
			dropList.forEach(function(p) {
				// 除外
				var i = tmpList.indexOf(p);
				tmpList.splice(i, 1);
			});

			points = tmpList;
			crossList = targetSection;

			var i0 = points.indexOf(crossList[0]);
			var i1 = points.indexOf(crossList[1]);

			if (i0 === -1 || i1 === -1) {
				return [];
			}

			crossIndex = [];
			crossIndex[0] = Math.min(i0, i1);
			crossIndex[1] = Math.max(i0, i1);

			// 分割
			var ret = [];

			if (crossIndex.length == 2){
				// 1つ目
				var splitPol = [];
				// 交点まで追加
				for (i = 0; i <= crossIndex[0]; i++){
					splitPol.push({
						x: points[i].x,
						y: points[i].y,
					});
				}
				// 交点から追加
				for (i = crossIndex[1]; i < points.length; i++){
					splitPol.push({
						x: points[i].x,
						y: points[i].y,
					});
				}
				// 確定
				ret.push(splitPol);
				splitPol = [];

				// 2つ目
				// 交点から交点まで追加
				for (i = crossIndex[0]; i <= crossIndex[1]; i++){
					splitPol.push({
						x: points[i].x,
						y: points[i].y,
					});
				}
				// 確定
				ret.push(splitPol);
				splitPol = [];
			}

			return ret;
		},

		/**
		 * 隣り合う同一点をオミットする
		 * @method omitSamePoint
		 * @param polygon {vector[]}
		 * @return {vector[]} オミット後のポリゴン
		 */
		omitSamePoint : function(polygon) {
			var ret = polygon.concat();

			// サイズ
			var size = polygon.length;
			// 同一点探す
			for (var i = 0; i < size; i++) {
				var p1 = ret[i];
				var p2 = ret[(i + 1) % size];
				if (this.isSame2D(p1, p2)) {
					// 同一
					ret.splice(i, 1);
					// 再帰
					ret = this.omitSamePoint(ret);
					break;
				}
			}

			return ret;
		},

		/**
		 * 三角分割
		 * @method triangleSplit
		 * @param polygon {vector[]} 面
		 * @return {vector[][]} 分割面リスト
		 */
		triangleSplit : function(polygon) {
			var self = this;
			// 時計周りに揃える
			polygon = this.convertLoopwise(polygon);

			// ポリゴン複製
			var targetPoly = polygon.concat();

			// 最遠点のインデックス
			var farthestIndex = 0;
			// 現在の最遠点と前後点で作った三角形の外積
			var currentCross = 0;
			// 分割後の面リスト
			var triangleList = [];

			// ループ
			while (targetPoly.length >= 3) {
				// 最遠点インデックス取得
				var sorted = targetPoly.concat()
				sorted.sort(function(a, b) {
					return self.length2D(b) - self.length2D(a);
				})
				farthestIndex = targetPoly.indexOf(sorted[0]);

				// 分割実行
				var tri = this._getTriangle(targetPoly, farthestIndex);
				if (!tri) {
					// 最遠点では失敗
					var size = targetPoly.length;
					// 外積計算
					var pa = this.vecSub2D(targetPoly[(farthestIndex + 1) % size], targetPoly[farthestIndex]);
					var pb = this.vecSub2D(targetPoly[(farthestIndex - 1 < 0) ? size - 1 : farthestIndex - 1], targetPoly[farthestIndex]);

					currentCross = this.cross2D(pa, pb);

					var index = farthestIndex;
					// 最遠点以外で探す
					while (!tri) {
						index = (index + 1) % size;
						// 最遠点の外積と同じ符号かを判定
						var v1 = this.vecSub2D(targetPoly[(index + 1) % size], targetPoly[index]);
						var v2 = this.vecSub2D(targetPoly[(index - 1 < 0) ? size - 1 : index - 1], targetPoly[index]);
						var tmpCross = this.cross2D(v1, v2);
						if (tmpCross * currentCross > 0) {
							// 判定続行
							tri = this._getTriangle(targetPoly, index);
						}
					}

					// 採用された点を削除
					targetPoly.splice(index, 1);
				} else {
					// 最遠点削除
					targetPoly.splice(farthestIndex, 1);
				}
				triangleList.push(tri);
			}
			return triangleList;
		},

		/**
		 * 面から三角形を取得する
		 * @method _getTriangle
		 * @private
		 * @param polygon {vector[]} 面
		 * @param index {number} このインデックスの点とその両側の点で三角形を作る
		 * @return {vector[]} 三角形、内部に入り込む点がある場合はnull
		 */
		_getTriangle : function(polygon, index) {
			// indexとその前後点で三角形作成
			var size = polygon.length;
			var p0 = polygon[index];
			var p1 = polygon[(index + 1) % size];
			var p2 = polygon[(index - 1 < 0) ? size - 1 : index - 1];

			var tri = [p0, p1, p2];

			// 内部に点が入り込まないか判定
			polygon.some(function(p) {
				if (p !== p0 && p !== p1 && p !== p2) {
					if (this.isPointOnTriangle(tri, p)) {
						// 失敗
						tri = null;
						return true;
					}
				}
			}, this);

			return tri;
		},

		/**
		 * 面積取得
		 * @method area
		 * @param polygon {vector[]} 面
		 * @param allowNegative {bool} 負値を許すフラグ
		 * @return {number} 面積
		 */
		area : function(polygon, allowNegative) {
			var area = 0;

			if (polygon.length > 2) {
				var size = polygon.length;
				for (var i = 0; i < size - 1; i++) {
					area += (polygon[i].x - polygon[i + 1].x) * (polygon[i].y + polygon[i + 1].y);
				}

				// 最後分
				area += (polygon[size - 1].x - polygon[0].x) * (polygon[size - 1].y + polygon[0].y);

				area /= 2;

				// 負値を許さないなら絶対値
				if (!allowNegative) {
					area = Math.abs(area);
				}
			}

			return area;
		},

		/**
		 * 面の座標が時計回りかを判定する
		 * @method loopwise
		 * @param polygon {vector[]} 面
		 * @return {number} -1:反時計 0:不定 1:時計
		 */
		loopwise : function(polygon) {
			var area = this.area(polygon, true);

			if (area > 0) {
				return 1;
			} else if (area < 0) {
				return -1;
			} else {
				return 0;
			}
		},

		/**
		 * 面を時計回りに変換する
		 * @method convertLoopwise
		 * @param polygon {vector[]} 面
		 * @return {vector[]} 時計回りにした面(引数とは別配列にする)
		 */
		convertLoopwise : function(polygon) {
			var ret = polygon.concat();
			if (this.loopwise(polygon) === -1) {
				ret.reverse();
			}
			return ret;
		},

		/**
		 * 重心を求める
		 * @method gravity2D
		 * @param polygon {vector[]} 面
		 * @return {vector} 重心
		 */
		gravity2D : function(polygon) {
			var ret = {x : 0, y : 0};
			polygon.forEach(function(p) {
				ret.x += p.x;
				ret.y += p.y;
			});

			ret.x /= polygon.length;
			ret.y /= polygon.length;

			return ret;
		},

		/**
		 * 同一線分かを判定する
		 * @method isSameSeg2D
		 * @param ab {vector[]} 線分ab
		 * @param cd {vector[]} 線分cd
		 * @return {bool} 同一であるフラグ
		 */
		isSameSeg2D : function(ab, cd) {
			if ((this.isSame2D(ab[0], cd[0]) && this.isSame2D(ab[1], cd[1])) ||
				(this.isSame2D(ab[1], cd[0]) && this.isSame2D(ab[0], cd[1]))) {
				return true;
			} else {
				return false;
			}
		},

		/**
		 * ベジェ曲線を直線で近似する(３次まで対応)
		 * @method approximateBezier
		 * @param pointList {vector[]} 制御点リスト
		 * @param size {number} 分割数(1なら制御点両端のみ)
		 * @return {vector[]} 座標リスト
		 */
		approximateBezier : function(pointList, size) {
			var ret = [];
			var i;
			var p;
			var unitT;
			var t;
			var c0;
			var c1;
			var c2;
			var c3;

			if (pointList.length === 3) {
				// ２次ベジェの場合
				// 分割単位
				unitT = 1 / size;
				for (i = 0; i <= size; i++) {
					t = unitT * i;
					c0 = this.vecMult2D(pointList[0], (1 - t) * (1 - t));
					c1 = this.vecMult2D(pointList[1], 2 * t * (1 - t));
					c2 = this.vecMult2D(pointList[2], 2 * t * t);
					p = {
						x : c0.x + c1.x + c2.x,
						y : c0.y + c1.y + c2.y
					};
					ret.push(p);
				}
			} else if (pointList.length === 4) {
				// 3次ベジェの場合
				// 分割単位
				unitT = 1 / size;
				for (i = 0; i <= size; i++) {
					t = unitT * i;
					c0 = this.vecMult2D(pointList[0], (1 - t) * (1 - t) * (1 - t));
					c1 = this.vecMult2D(pointList[1], 3 * t * (1 - t) * (1 - t));
					c2 = this.vecMult2D(pointList[2], 3 * t * t * (1 - t));
					c3 = this.vecMult2D(pointList[3], t * t * t);
					p = {
						x : c0.x + c1.x + c2.x + c3.x,
						y : c0.y + c1.y + c2.y + c3.y
					};
					ret.push(p);
				}
			}

			return ret;
		},

		/**
		 * 円弧を直線で近似する
		 * @method approximateArc
		 * @param rx {number} x軸半径
		 * @param ry {number} y軸半径
		 * @param startRadian {number} 開始ラジアン
		 * @param endRadian {number} 終了ラジアン
		 * @param center {vector} 中心座標
		 * @param radian {number} 傾き
		 * @param size {number} 分割数
		 * @return {vector[]} 座標リスト
		 */
		approximateArc : function(rx, ry, startRadian, endRadian, center, radian, size) {
			var ret = [];
			var i = 0;
			var p = null;
			var t = 0;

			// 近似範囲
			var range = endRadian - startRadian;
			// 近似単位
			var unitT = range / size;

			for (i = 0; i <= size; i++) {
				t = unitT * i + startRadian - radian;
				p = {
					x : rx * Math.cos(t),
					y : ry * Math.sin(t),
				};
				ret.push(p);
			}

			// 回転考慮
			ret.forEach(function(p) {
				var rotated = this.rotate2D(p, radian);
				p.x = rotated.x;
				p.y = rotated.y;
			}, this);

			// 位置調整
			ret.forEach(function(p) {
				p.x += center.x;
				p.y += center.y;
			}, this);

			return ret;
		},

		/**
		 * ２点指定の円弧を直線で近似する
		 * @method approximateArcWithPoint
		 * @param rx {number} x軸半径
		 * @param ry {number} y軸半径
		 * @param startPoint {vector} 開始点
		 * @param endPoint {vector} 終了点
		 * @param largeArcFlag {number} 円弧の大きい側を使うフラグ
		 * @param sweepFlag {number} 時計回り円弧を使うフラグ
		 * @param radian {number} 傾き
		 * @param size {number} 分割数
		 * @return {vector[]} 座標リスト
		 */
		approximateArcWithPoint : function(rx, ry, startPoint, endPoint, largeArcFlag, sweepFlag, radian, size) {
			// 楕円中心取得
			var centers = mathUtil.getEllipseCenter(startPoint, endPoint, rx, ry, radian);

			var center = null;

			if ((largeArcFlag && sweepFlag) || (!largeArcFlag && !sweepFlag)) {
				// 時計回り＆大きい側
				// 反時計回り＆小さい側
				// →始点終点中心が反時計回りになる
				if (this.loopwise([startPoint, endPoint, centers[0]]) < 0) {
					center = centers[0];
				} else {
					center = centers[1];
				}
			} else {
				if (this.loopwise([startPoint, endPoint, centers[0]]) > 0) {
					center = centers[0];
				} else {
					center = centers[1];
				}
			}

			// 回り方に応じて始点と終点を設定
			var startRadian = 0;
			var endRadian = 0;
			var r1 = mathUtil.getRadianOnArc(startPoint, rx, ry, center, radian);
			var r2 = mathUtil.getRadianOnArc(endPoint, rx, ry, center, radian);
			if (sweepFlag) {
				if (r1 > r2) {
					startRadian = r1 - Math.PI * 2;
					endRadian = r2;
				} else {
					startRadian = r1;
					endRadian = r2;
				}
			} else {
				if (r1 > r2) {
					startRadian = r1;
					endRadian = r2;
				} else {
					startRadian = r1;
					endRadian = r2 - Math.PI * 2;
				}
			}

			pList = mathUtil.approximateArc(
				rx, ry,
				startRadian,
				endRadian,
				center,
				radian, size);

			return pList;
		},

		/**
		 * 円弧上の点の角度を求める
		 * @method getRadianOnArc
		 * @param a {vector} 円弧上の点
		 * @param rx {number} x軸半径
		 * @param ry {number} y軸半径
		 * @param center {vector} 中心座標
		 * @param radian {number} 傾き
		 * @return {number} ラジアン(0 <= t <= 2 * Math.PI)
		 */
		getRadianOnArc : function(a, rx, ry, center, radian) {
			// 回転打ち消し
			a = this.rotate2D(a, -radian, center);
			var ret = Math.acos((a.x - center.x) / rx);

			// y座標の位置をみて絞り込み
			if (a.y - center.y < 0) {
				ret = -ret + Math.PI * 2;
			}

			// 回転戻す
			ret += radian;
			ret %= Math.PI * 2;

			return ret;
		},

		/**
		 * ２点を通る楕円の中心を求める
		 * @method getEllipseCenter
		 * @param a {vector} 点a
		 * @param b {vector} 点b
		 * @param rx {number} x軸半径
		 * @param ry {number} y軸半径
		 * @param radian {number} 傾き
		 * @return {vector[]} 解となる２点
		 */
		getEllipseCenter : function(a, b, rx, ry, radian) {
			// 回転を打ち消す
			a = this.rotate2D(a, -radian);
			b = this.rotate2D(b, -radian);

			// 媒介変数を利用して円の中心問題にする
			var A = {
				x : a.x / rx,
				y : a.y / ry,
			};
			var B = {
				x : b.x / rx,
				y : b.y / ry,
			};

			// 円の中心取得
			var C = this.getCircleCenter(A, B, 1);

			// 楕円に戻す
			var ans1 = {
				x : C[0].x * rx,
				y : C[0].y * ry,
			};
			var ans2 = {
				x : C[1].x * rx,
				y : C[1].y * ry,
			};

			// 回転を戻す
			ans1 = this.rotate2D(ans1, radian);
			ans2 = this.rotate2D(ans2, radian);

			return [ans1, ans2];
		},

		/**
		 * ２点を通る円の中心を求める
		 * @method getCircleCenter
		 * @param a {vector} 点a
		 * @param b {vector} 点b
		 * @param radius {number} 半径
		 * @return {vector[]} 解となる２点
		 */
		getCircleCenter : function(a, b, radius) {
			var u1 = (a.x + b.x) / 2;
			var u2 = (a.x - b.x) / 2;
			var v1 = (a.y + b.y) / 2;
			var v2 = (a.y - b.y) / 2;
			var L = Math.sqrt(u2 * u2 + v2 * v2);
			var t = Math.sqrt(Math.pow((radius / L), 2) - 1);

			var ans1 = {
				x : u1 + v2 * t,
				y : v1 - u2 * t,
			};
			var ans2 = {
				x : u1 - v2 * t,
				y : v1 + u2 * t,
			};

			return [ans1, ans2];
		},

		/**
		 * ２次元アフィン変換を行う<br>
		 * paramsには以下の行列をa b c d e fの順で指定する<br>
		 * a c e<br>
		 * b d f
		 * @method transform2D
		 * @param points {vector[]} 変換前の座標リスト
		 * @param params {number[6]} 行列成分
		 * @return {vector[]} 座標リスト
		 */
		transform2D : function(points, params) {
			var ret = [];
			var a = params[0];
			var b = params[1];
			var c = params[2];
			var d = params[3];
			var e = params[4];
			var f = params[5];

			points.forEach(function(p) {
				var converted = {
					x : a * p.x + c * p.y + e,
					y : b * p.x + d * p.y + f
				};
				ret.push(converted);
			}, this);

			return ret;
		},
	};

	return mathUtil;
});
