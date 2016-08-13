define(function(require) {
	/**
	 * 音声クラス
	 * @class Sound
	 * @namespace slashCanvas/common
	 * @constructor
	 * @param src {string} ソースURL
	 */
	var Constructor = function(src) {
		/**
		 * ソースURL
		 * @property src
		 * @type {string}
		 */
		this.src = src;

		/**
		 * 音声DOM
		 * @property audio
		 * @type {Audio}
		 * @default new Audio()
		 */
		this.audio = new Audio();

		// 初期化
		this.audio.src = src;
		this.audio.load();
		this.audio.volume = 0.3;
	};

	Constructor.prototype.play = function() {
		var dom = this.audio;
		// 初回以外だったら音声ファイルを巻き戻す
		if( typeof(dom.currentTime ) !== 'undefined' )
		{
			dom.currentTime = 0;
		}
		dom.play();
	};

	return Constructor;
});
