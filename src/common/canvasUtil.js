define(function(require) {
	/**
	 * キャンバス処理
	 * @class canvasUtil
	 * @namespace lifeGame.common.canvas
	 * @static
	 */
	var ret = {
		/**
		 * マウスイベント発生座標取得
		 * @method getCursorPoint
		 * @param e {} イベント引数
		 * @return {x,y} キャンバス上の座標
		 */
		getCursorPoint : function(e) {
			var p = null;

			// jqueryイベントに対応
			var event = e.originalEvent || e;

			// タッチイベントの場合
			if (event.touches && event.touches.length > 0) {
				event = event.touches[0];
			}

			var rect = event.target.getBoundingClientRect();

			// 要素の位置座標を計算
			var positionX = rect.left + window.pageXOffset;
			var positionY = rect.top + window.pageYOffset;

			// ターゲット上の座標取得
			p = {
				x : event.pageX  - positionX,
				y : event.pageY  - positionY
			};

			return p;
		},
	};

	return ret;
});
