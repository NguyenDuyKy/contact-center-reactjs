function StringeeHashMap() {
	var obj = [];
	obj.size = function () {
		return this.length;
	};
	obj.isEmpty = function () {
		return this.length === 0;
	};
	obj.containsKey = function (key) {
		key = key + '';

		for (var i = 0; i < this.length; i++) {
			if (this[i].key === key) {
				return i;
			}
		}
		return -1;
	};
	obj.get = function (key) {
		key = key + '';

		var index = this.containsKey(key);
		if (index > -1) {
			return this[index].value;
		}
	};
	obj.put = function (key, value) {
		key = key + '';

		if (this.containsKey(key) !== -1) {
			return this.get(key);
		}
		this.push({ 'key': key, 'value': value });
	};
	obj.allKeys = function () {
		var allKeys = [];
		for (var i = 0; i < this.length; i++) {
			allKeys.push(this[i].key);
		}
		return allKeys;
	};
	obj.allIntKeys = function () {
		var allKeys = [];
		for (var i = 0; i < this.length; i++) {
			allKeys.push(parseInt(this[i].key));
		}
		return allKeys;
	};
	obj.remove = function (key) {
		key = key + '';

		var index = this.containsKey(key);
		if (index > -1) {
			this.splice(index, 1);
		}
	};

	obj.clear = function () {
		var allKeys = this.allKeys();
		for (var i = 0; i < allKeys.length; i++) {
			var key = allKeys[i];
			this.remove(key);
		}
	};

	return obj;
}
var queryString = window.location.search;
var urlParams = new URLSearchParams(queryString);
var language = urlParams.get('lang') || 'vi';
var apiStringeexBaseUrl = 'BASE_URL_API_STRINGEEX';

var StringeeSoftPhone = StringeeSoftPhone || {
	//private
	_ready: false,
	_iframe: null,
	_access_token: null,

	_onMethods: new StringeeHashMap(),

	_stringeeServerAddr: null,

	_stringeeServerAddrs: null,
	_stringeeApiBaseUrl: null,

	connected: false,

	//public
	showMode: 'full', //full | min | none
	top: undefined,
	left: undefined,
	right: undefined,
	bottom: undefined,
	arrowDisplay: 'top', //top | bottom | none
	arrowLeft: 20,
	recentCalls: [],
	fromNumbers: [],
	askCallTypeWhenMakeCall: false, //true
	appendToElement: null,

	makeAndReceiveCallInNewPopupWindow: false,
	showIconSetting: true,
	showButtonClose: true,
	routingType: 1,
	lang: language,
	autoPickUp: false,
	callTypeDefaultWhenClick: null,
	// baseUrl: 'http://127.0.0.1/stringee/StringeeWebPhone-X/dist/'
	// baseUrl: 'https://test3.stringee.com/stringeex/web_phone/lastest/'
	baseUrl: 'https://static.stringee.com/stringeex/web_phone/latest/',
	mappCallAnswered: new StringeeHashMap()
};



StringeeSoftPhone.on = function (eventName, method) {
	StringeeSoftPhone._onMethods.put(eventName, method);
};

StringeeSoftPhone._callOnEvent = function (eventName, ...param) {
	var eventMethod = StringeeSoftPhone._onMethods.get(eventName);
	if (eventMethod) {
		if (param) {
			eventMethod.call(this, ...param);
		} else {
			eventMethod.call(this);
		}
	} else {
		console.log('Please implement StringeeSoftPhone event: ' + eventName);
	}
};

StringeeSoftPhone.init = function (config) {
	if (document.readyState === "interactive" || document.readyState === "complete") {
		StringeeSoftPhone._initOnReady(config);
		return;
	}

	document.addEventListener("DOMContentLoaded", function () {
		StringeeSoftPhone._initOnReady(config);
	});
};

StringeeSoftPhone._initOnReady = function (config) {
	//copy toan bo thuoc tinh cua config qua
	for (var propertyName in config) {
		StringeeSoftPhone[propertyName] = config[propertyName];
	}

	window.onbeforeunload = function (e) {
		e = e || window.event;

		// For IE and Firefox prior to version 4
		if (e && StringeeSoftPhone._iframe.contentWindow.stringeePhone.currentCall) {
			e.returnValue = 'Sure?';
		}

		// For Safari
		if (StringeeSoftPhone._iframe.contentWindow.stringeePhone.currentCall) {
			return 'Sure?';
		}
	};

	//build css: https://www.minifier.org/ : style_page.css
	var style = document.createElement('style');
	style.type = 'text/css';
	style.innerHTML = '.stringee_iframe_wrapper{margin-top:0;margin-right:0;margin-bottom:0;padding:0;display:block;background:transparent;position:fixed;z-index:16000015;border-radius:20px;width:294px;height:556px;box-shadow:0 10px 30px 0 rgba(0,0,0,.15);border:1px solid #E9EBED;box-sizing: content-box}.stringee_iframe_wrapper .iframe{background-color:transparent;vertical-align:text-bottom;position:relative;width:100%;height:100%;min-width:100%;min-height:100%;max-width:100%;max-height:100%;margin:0;overflow:hidden;display:block;border-width:0}.drop-down-rectangle1{position:absolute;width:15px;height:15px;background:#FFF;transform:rotate(45deg);top:-5px;right:35px;border:1px solid #E9EBED}';
	document.getElementsByTagName('head')[0].appendChild(style);

	getContentIframe = function (iframe_html) {
		//tao the div chua iframe
		var div = document.createElement("div");
		div.innerHTML = '<span class="drop-down-rectangle1"></span>';
		div.setAttribute('class', 'stringee_iframe_wrapper');
		div.style.display = 'none';

		//iframe
		var iframe = document.createElement('iframe');
		iframe.setAttribute('class', 'iframe');

		div.appendChild(iframe);

		//append vao body
		if (!StringeeSoftPhone.appendToElement) {
			document.body.appendChild(div);
		} else {
			//append vao the div bat ky
			//position: absolute;
			div.style.position = "absolute";

			var toElement = document.getElementById(StringeeSoftPhone.appendToElement);
			if (toElement) {
				toElement.appendChild(div);
			} else {
				console.log('ERROR: element with ID: ' + StringeeSoftPhone.appendToElement + ' not found!');
				return;
			}
		}


		iframe.contentWindow.document.open();
		iframe.contentWindow.document.write(iframe_html);
		iframe.contentWindow.document.close();


		// append language vao iframe
		// var langAllowed = ['vi','en'];
		// var lang = config.lang && langAllowed.includes(config.lang) ? config.lang : 'vi';
		// StringeeSoftPhone.lang = lang;
		// var srcLang = StringeeSoftPhone.baseUrl + 'js/lang/lang.'+ lang + '.js';
		// var jsElm = document.createElement("script");
		// jsElm.type = "application/javascript";
		// jsElm.src = srcLang;
		// iframe.contentWindow.document.getElementsByTagName('head')[0].prepend(jsElm)

		StringeeSoftPhone._iframe = iframe;

		console.log('++++ 1 append xong')
	};

	var iframe_html = '<!DOCTYPE html><html>    <head>        <title>Stringee Web Phone</title>        <meta charset="UTF-8">        <meta name="viewport" content="width=device-width, initial-scale=1.0">         <!-- load config : https://static.stringee.com/stringeex/web_phone/latest/ ## 1712890534-->        <link href="https://static.stringee.com/stringeex/web_phone/latest/css/all-style.css?version=v2.0.1.6618a2a68fdc9" rel="stylesheet" type="text/css" />        <style>            #btnToolCall.btn-red:disabled,            #btnToolCall.btn-red[disabled] {                background: linear-gradient(262.92deg, #94343a 6.49%, #94343a 108.73%);            }            #btn-incomming-decline:disabled,            #btn-incomming-decline[disabled] {                background: linear-gradient(262.92deg, #94343a 6.49%, #94343a 108.73%);            }            #btn-incomming-accept:disabled,            #btn-incomming-accept[disabled] {                background: linear-gradient(262.92deg, #336b25 6.49%, #336b25 108.73%);            }            #btnToolCall.btn-green:disabled,            #btnToolCall.btn-green[disabled] {                background: linear-gradient(262.92deg, #40882f 6.49%, #40882f 108.73%);            }            .top-bar-title {                font-size: 14px !important;            }            .min-no-calls {                color: #525252;                width: 176px;                text-align: center;                padding-top: 3px;            }        </style>        <script type="text/javascript">            var apiStringeexBaseUrl = "https://api.stringeex.com/";            if (!apiStringeexBaseUrl.startsWith("https://")) {                apiStringeexBaseUrl = "https://" + apiStringeexBaseUrl            }            if (!apiStringeexBaseUrl.endsWith("/")) {                apiStringeexBaseUrl += "/";            }            console.log("api stringeex base url: ", apiStringeexBaseUrl);        </script>        <script type="text/javascript" src="https://static.stringee.com/stringeex/web_phone/latest/js/all-js.min.js?2.0.1.6618a2a68fdc9"></script>    </head>    <body>        <div id="stringee_clound" class="overflow-hidden">            <div id="app-minimize" class="cursor-pointer">                <div class="wrap-info-minimize display-flex justify-content-space-between font-size-16">                    <div class="time bg-pink border-radius-16 color-white display-none">00:28</div>                    <div class="line-vertical display-none"></div>                    <div class="phone line-height-26 display-none">0966123456</div>                    <div class="min-no-calls" data-translate="no_calls">No calls</div>                </div>            </div>            <div id="app">                <!--  TOP TOAST --><section class="wrap-top-bar height-40 position-absolute top-0 width-100-percent">    <div id="toast-area" class="toast display-none">        toast message    </div></section><!--  END TOAST  -->                <!--  TOP BAR --><section class="wrap-top-bar height-40 position-absolute top-0 width-100-percent">    <div class="top-bar-status color-red" data-translate="not_connected">        Chưa kết nối    </div>    <div class="text-center top-bar-title">        CONTACT    </div>    <div class="wrap-action-top-right float-right mr position-absolute right-15 top-10">        <div class="wrapper-dropdown wrapper-dropdown-call">            <div id="dropdown-option-call" class="wrapper-dropdown-3" tabindex="1">                <span id="routingTypeLabelActived"><img src="https://static.stringee.com/stringeex/web_phone/latest/images/icon-browser.png" class="icon-option-active"                        title="Đổ cuộc gọi đến app và sipphone" /></span>                <ul class="dropdown">                    <li data-value="1"><a href="javascript:void(0)"><img src="https://static.stringee.com/stringeex/web_phone/latest/images/icon-browser.png"                                class="icon-option" title="Đổ cuộc gọi đến app và sipphone"/><span data-translate="route_to_app_and_sipphone">Đổ cuộc gọi đến app và                            sipphone</span></a></li>                    <li data-value="2"><a href="javascript:void(0)"><img src="https://static.stringee.com/stringeex/web_phone/latest/images/icon-phone.png" class="icon-option"                                title="Đổ cuộc gọi đến số điện thoại" /><span data-translate="route_to_phone_number">Đổ cuộc gọi đến số điện thoại</span></a></li>                    <li data-value="3"><a href="javascript:void(0)"><img src="https://static.stringee.com/stringeex/web_phone/latest/images/icon-app.png" class="icon-option"                                title="Đổ cuộc gọi đến app" /><span data-translate="route_to_app">Đổ                            cuộc gọi đến app</span></a></li>                    <li data-value="4"><a href="javascript:void(0)"><img src="https://static.stringee.com/stringeex/web_phone/latest/images/icon-ipphone.png"                                class="icon-option" title="Đổ cuộc gọi đến ipphone" /><span data-translate="route_to_ipphone">Đổ cuộc gọi đến ipphone</span></a></li>                </ul>            </div>            ​        </div>        <button id="btnMinimize" class="btn-minimize border-none bg-transparent" title="Minimize">            <img src="https://static.stringee.com/stringeex/web_phone/latest/images/icon-minimize.svg">        </button>        <div class="wrapper-dropdown wrapper-dropdown-call auto" style="float:right">            <div id="dropdown-auto-receive-call" class="wrapper-dropdown-3" tabindex="3">                <span id="settingAgent">                    <img src="https://static.stringee.com/stringeex/web_phone/latest/images/icon-setting-gray.svg" class="icon-option-active" title="personal settings" />                </span>                <ul class="dropdown setting-agent">                    <li data-value="1" class="auto-pick-call">                        <label>                            <img src="https://static.stringee.com/stringeex/web_phone/latest/images/icon-setting-gray.svg" class="icon-option" title="Auto Pick Call"/>                            <span data-translate="auto_pick_call">Auto Pick Call</span>                        </label>                        <input type="checkbox" id="autopickcheckbox"/>                    </li>                    <li data-value="2" class="item-transfer-ipphone">                        <label>                            <img src="https://static.stringee.com/stringeex/web_phone/latest/images/icon-setting-gray.svg" class="icon-option" title="Auto Pick Call"/>                            <span data-translate="transfer_ip_phone">Transfer to IPPhone</span>                        </label>                        <input type="checkbox" id="transfer-ip-phone"/>                    </li>                </ul>            </div>            ​        </div>    </div>    <!-- <input type="checkbox" id="autopickcheckbox" > --></section><!--  END TOP BAR  -->                <!-- PAGE CALLING  --><section id="page-calling" class="page display-none">    <section class="wrap-status p-l-r-20 top-0 position-relative display-flex">        <div class="if-coaching">            <div class="call-type-icon icon-call-out">                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">                    <g clip-path="url(#clip0_3629_9169)">                    <path d="M5 4H9L11 9L8.5 10.5C9.57096 12.6715 11.3285 14.429 13.5 15.5L15 13L20 15V19C20 19.5304 19.7893 20.0391 19.4142 20.4142C19.0391 20.7893 18.5304 21 18 21C14.0993 20.763 10.4202 19.1065 7.65683 16.3432C4.8935 13.5798 3.23705 9.90074 3 6C3 5.46957 3.21071 4.96086 3.58579 4.58579C3.96086 4.21071 4.46957 4 5 4Z" stroke="#4CAF50" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>                    <path d="M15 9L20 4" stroke="#4CAF50" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>                    <path d="M16 4H20V8" stroke="#4CAF50" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>                    </g>                    <defs>                    <clipPath id="clip0_3629_9169">                    <rect width="24" height="24" fill="white"/>                    </clipPath>                    </defs>                </svg>            </div>            <div class="call-type-icon icon-call-in display-none">                <svg width="20" height="20" viewBox="0 0 21 21" fill="none" xmlns="http://www.w3.org/2000/svg">                    <g clip-path="url(#clip0_3629_9176)">                    <path d="M4.375 3.5H7.875L9.625 7.875L7.4375 9.1875C8.37459 11.0876 9.91241 12.6254 11.8125 13.5625L13.125 11.375L17.5 13.125V16.625C17.5 17.0891 17.3156 17.5342 16.9874 17.8624C16.6592 18.1906 16.2141 18.375 15.75 18.375C12.3369 18.1676 9.11763 16.7182 6.69973 14.3003C4.28182 11.8824 2.83242 8.66314 2.625 5.25C2.625 4.78587 2.80937 4.34075 3.13756 4.01256C3.46575 3.68437 3.91087 3.5 4.375 3.5Z" stroke="#F39C12" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>                    <path d="M13.125 7.875L17.5 3.5" stroke="#F39C12" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>                    <path d="M13.125 4.375V7.875H16.625" stroke="#F39C12" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>                    </g>                    <defs>                    <clipPath id="clip0_3629_9176">                    <rect width="21" height="21" fill="white"/>                    </clipPath>                    </defs>                </svg>            </div>        </div>        <div class="wrap-status-text line-height-30">            <span class="status-text" data-translate="currently_in_call">Currently in call..</span>            <div class="line-red-short"></div>        </div>        <div class="wrap-status-time line-height-30 position-absolute right-0">            <span class="status-time"> </span>        </div>    </section>    <section class="wrap-info p-20">        <div class="info-name pb-10">            Pattrick Penna        </div>        <div class="wrap-location">            <span class="location-via" data-translate="via">thông qua</span>            <span class="location-text" data-translate="location">Vietnam</span>        </div>    </section>    <div class="line-dotted"></div>    <section class="wrap-action display-flex justify-content-space-between">        <button id="btnMic" class="action-call text-center flex-basis p-10 bg-white border-none">            <img class="icon" src="https://static.stringee.com/stringeex/web_phone/latest/images/icon-mic.svg" />            <img class="icon-on display-none" src="https://static.stringee.com/stringeex/web_phone/latest/images/icon-mic-off.svg" />        </button>        <button id="btnHold" class="action-call text-center flex-basis p-10 bg-white border-none disable-w-coaching">            <img class="icon" src="https://static.stringee.com/stringeex/web_phone/latest/images/icon-pause.svg" />            <img class="icon-on display-none" src="https://static.stringee.com/stringeex/web_phone/latest/images/icon-pause-red.svg">        </button>        <button id="btnKeypadInCall" class="action-call text-center flex-basis p-10 bg-white border-none disable-w-coaching">            <img src="https://static.stringee.com/stringeex/web_phone/latest/images/icon-pad-gray.svg" />        </button>        <button id="btnTransfer" class="action-call text-center flex-basis p-10 bg-white border-none disable-w-coaching">            <img src="https://static.stringee.com/stringeex/web_phone/latest/images/icon-back.svg" />        </button>        <button id="btnAddToCall" class="action-call text-center flex-basis p-10 bg-white border-none disable-w-coaching">            <img src="https://static.stringee.com/stringeex/web_phone/latest/images/icon-add-to-call.svg">        </button>        <button id="btnSwitchVoiceToVideo" class="action-call text-center flex-basis p-10 bg-white border-none disable-w-coaching">            <img src="https://static.stringee.com/stringeex/web_phone/latest/images/icon-switch-videocall.svg">        </button>        <!--        <button id="btnMore" class="action-call text-center flex-basis p-10 bg-white border-none position-relative">            <img src="https://static.stringee.com/stringeex/web_phone/latest/images/icon-more.svg" />            <span class="drop-down-action display-none">                <span class="drop-down-rectangle"></span>                <ul>                    <li>                        <img src="https://static.stringee.com/stringeex/web_phone/latest/images/icon-assign-call.svg" class="icon" />                        <img src="https://static.stringee.com/stringeex/web_phone/latest/images/icon-assign-call-purple.svg" class="icon-hover display-none" />                        <span>Assign this call</span>                    </li>                    <li>                        <img src="https://static.stringee.com/stringeex/web_phone/latest/images/icon-add-tag.svg" class="icon" />                        <img src="https://static.stringee.com/stringeex/web_phone/latest/images/icon-add-tag-purple.svg" class="icon-hover display-none" />                        <span>Add a tag</span>                    </li>                    <li>                        <img src="https://static.stringee.com/stringeex/web_phone/latest/images/icon-comment.svg" class="icon" />                        <img src="https://static.stringee.com/stringeex/web_phone/latest/images/icon-comment-purple.svg" class="icon-hover display-none" />                        <span>Add a comment</span>                    </li>                </ul>            </span>        </button>-->    </section>    <section class="wrap-background bg-gradient-purple height-350 width-100-percent">        <div class="wrap-avatar-round text-center">            <img class="avatar-agent" src="https://static.stringee.com/stringeex/web_phone/latest/images/avatar.png" class="mt-80" />            <div class="avatar-loading custom-loading"></div>            <div class="callstart-time">                <div class="location-queue"> </div>            </div>            <div class="box-ctrl-coaching if-coaching">                <button class="btn-action active" id="btn-overhear-call">                    <svg class="light" width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">                        <path fill-rule="evenodd" clip-rule="evenodd" d="M10.4082 2.64855C11.2567 2.41358 12.148 2.37797 13.0126 2.54449C13.8771 2.71101 14.6915 3.07517 15.392 3.60851C16.0926 4.14184 16.6603 4.82992 17.0509 5.61899C17.4415 6.40805 17.6443 7.27674 17.6436 8.15719C17.6433 8.5714 17.9788 8.90745 18.393 8.90778C18.8073 8.90811 19.1433 8.57259 19.1436 8.15838C19.1445 7.04669 18.8884 5.94985 18.3952 4.95354C17.902 3.95724 17.1852 3.08844 16.3007 2.41503C15.4162 1.74162 14.3879 1.28182 13.2963 1.07156C12.2047 0.861303 11.0792 0.906273 10.0079 1.20296C8.93649 1.49964 7.94823 2.04001 7.12026 2.78185C6.2923 3.52369 5.64706 4.44691 5.23495 5.47938C4.82283 6.51186 4.65501 7.62564 4.74459 8.73371C4.83416 9.84179 5.17871 10.9141 5.75131 11.867C5.7645 11.889 5.77881 11.9102 5.79417 11.9307C6.3528 12.6755 7.01286 13.3385 7.75511 13.9003C8.47596 14.5876 9.03296 15.4284 9.38458 16.3606C9.3957 16.3901 9.40867 16.4188 9.42341 16.4467C9.76156 17.0857 10.2368 17.6421 10.8152 18.0759C11.3935 18.5097 12.0607 18.8103 12.7688 18.9561C13.4769 19.1019 14.2085 19.0893 14.9112 18.9192C15.6139 18.7491 16.2703 18.4257 16.8334 17.9723C17.156 17.7125 17.2069 17.2403 16.9471 16.9177C16.6873 16.5951 16.2151 16.5442 15.8925 16.804C15.5017 17.1188 15.0461 17.3432 14.5584 17.4613C14.0706 17.5793 13.5628 17.5881 13.0713 17.4869C12.5798 17.3857 12.1167 17.1771 11.7153 16.8759C11.3255 16.5836 11.0032 16.2111 10.77 15.7837C10.3321 14.6444 9.64328 13.618 8.75448 12.7808C8.73409 12.7616 8.71265 12.7436 8.69024 12.7268C8.05773 12.2524 7.49472 11.6919 7.01753 11.0617C6.5757 10.3152 6.30963 9.47778 6.23971 8.61285C6.16876 7.73527 6.30168 6.85316 6.62807 6.03545C6.95446 5.21773 7.46548 4.48655 8.12122 3.89902C8.77696 3.31149 9.55966 2.88353 10.4082 2.64855ZM10.0863 8.30546C10.0863 8.56796 10.138 8.82789 10.2385 9.0704C10.3389 9.31291 10.4862 9.53327 10.6718 9.71888C11.0466 10.0937 11.5551 10.3043 12.0852 10.3043C12.3477 10.3043 12.6076 10.2526 12.8501 10.1522C13.0926 10.0517 13.313 9.90449 13.4986 9.71888C13.6842 9.53327 13.8315 9.31291 13.9319 9.0704C14.0324 8.82789 14.0841 8.56796 14.0841 8.30546C14.0841 7.77533 13.8735 7.26691 13.4986 6.89204C13.1238 6.51718 12.6153 6.30659 12.0852 6.30659C11.5551 6.30659 11.0466 6.51718 10.6718 6.89204C10.2969 7.26691 10.0863 7.77533 10.0863 8.30546ZM3.99645 2.25735C4.31036 2.57126 4.30472 3.07819 4.02606 3.42378C3.03854 4.64849 2.45506 6.20435 2.45506 7.91191C2.45506 9.62248 3.0406 11.1808 4.02628 12.4115C4.3015 12.7552 4.30551 13.2574 3.99419 13.5687C3.68288 13.88 3.17499 13.8822 2.89299 13.5441C1.6209 12.0189 0.855957 10.0556 0.855957 7.91191C0.855957 5.76939 1.62008 3.80703 2.89095 2.28219C3.17395 1.94264 3.68389 1.94479 3.99645 2.25735Z" fill="#6574DF"/>                    </svg>                    <svg class="dark" width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">                        <path fill-rule="evenodd" clip-rule="evenodd" d="M10.4082 2.64855C11.2567 2.41358 12.148 2.37797 13.0126 2.54449C13.8771 2.71101 14.6915 3.07517 15.392 3.60851C16.0926 4.14184 16.6603 4.82992 17.0509 5.61899C17.4415 6.40805 17.6443 7.27674 17.6436 8.15719C17.6433 8.5714 17.9788 8.90745 18.393 8.90778C18.8073 8.90811 19.1433 8.57259 19.1436 8.15838C19.1445 7.04669 18.8884 5.94985 18.3952 4.95354C17.902 3.95724 17.1852 3.08844 16.3007 2.41503C15.4162 1.74162 14.3879 1.28182 13.2963 1.07156C12.2047 0.861303 11.0792 0.906273 10.0079 1.20296C8.93649 1.49964 7.94823 2.04001 7.12026 2.78185C6.2923 3.52369 5.64706 4.44691 5.23495 5.47938C4.82283 6.51186 4.65501 7.62564 4.74459 8.73371C4.83416 9.84179 5.17871 10.9141 5.75131 11.867C5.7645 11.889 5.77881 11.9102 5.79417 11.9307C6.3528 12.6755 7.01286 13.3385 7.75511 13.9003C8.47596 14.5876 9.03296 15.4284 9.38458 16.3606C9.3957 16.3901 9.40867 16.4188 9.42341 16.4467C9.76156 17.0857 10.2368 17.6421 10.8152 18.0759C11.3935 18.5097 12.0607 18.8103 12.7688 18.9561C13.4769 19.1019 14.2085 19.0893 14.9112 18.9192C15.6139 18.7491 16.2703 18.4257 16.8334 17.9723C17.156 17.7125 17.2069 17.2403 16.9471 16.9177C16.6873 16.5951 16.2151 16.5442 15.8925 16.804C15.5017 17.1188 15.0461 17.3432 14.5584 17.4613C14.0706 17.5793 13.5628 17.5881 13.0713 17.4869C12.5798 17.3857 12.1167 17.1771 11.7153 16.8759C11.3255 16.5836 11.0032 16.2111 10.77 15.7837C10.3321 14.6444 9.64328 13.618 8.75448 12.7808C8.73409 12.7616 8.71265 12.7436 8.69024 12.7268C8.05773 12.2524 7.49472 11.6919 7.01753 11.0617C6.5757 10.3152 6.30963 9.47778 6.23971 8.61285C6.16876 7.73527 6.30168 6.85316 6.62807 6.03545C6.95446 5.21773 7.46548 4.48655 8.12122 3.89902C8.77696 3.31149 9.55966 2.88353 10.4082 2.64855ZM10.0863 8.30546C10.0863 8.56796 10.138 8.82789 10.2385 9.0704C10.3389 9.31291 10.4862 9.53327 10.6718 9.71888C11.0466 10.0937 11.5551 10.3043 12.0852 10.3043C12.3477 10.3043 12.6076 10.2526 12.8501 10.1522C13.0926 10.0517 13.313 9.90449 13.4986 9.71888C13.6842 9.53327 13.8315 9.31291 13.9319 9.0704C14.0324 8.82789 14.0841 8.56796 14.0841 8.30546C14.0841 7.77533 13.8735 7.26691 13.4986 6.89204C13.1238 6.51718 12.6153 6.30659 12.0852 6.30659C11.5551 6.30659 11.0466 6.51718 10.6718 6.89204C10.2969 7.26691 10.0863 7.77533 10.0863 8.30546ZM3.99645 2.25735C4.31036 2.57126 4.30472 3.07819 4.02606 3.42378C3.03854 4.64849 2.45506 6.20435 2.45506 7.91191C2.45506 9.62248 3.0406 11.1808 4.02628 12.4115C4.3015 12.7552 4.30551 13.2574 3.99419 13.5687C3.68288 13.88 3.17499 13.8822 2.89299 13.5441C1.6209 12.0189 0.855957 10.0556 0.855957 7.91191C0.855957 5.76939 1.62008 3.80703 2.89095 2.28219C3.17395 1.94264 3.68389 1.94479 3.99645 2.25735Z" fill="#fff"/>                    </svg>                    <span>Nghe lén</span>                    <div class="button-loading custom-loading"></div>                </button>                <button class="btn-action" id="btn-whisper">                    <svg class="light" width="22" height="20" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">                        <path fill-rule="evenodd" clip-rule="evenodd" d="M19.2362 12.0826C21.8004 8.70687 21.7685 4.12413 19.0899 0.686665C18.7525 0.253628 18.0947 0.357164 17.8551 0.851137C17.7136 1.14307 17.7681 1.48994 17.9708 1.74328C20.1271 4.43853 20.1281 8.08186 17.9736 10.9024C17.7662 11.174 17.703 11.5344 17.8333 11.8504C18.0784 12.4444 18.8475 12.5943 19.2362 12.0826ZM15.9712 8.91755C16.8627 7.37031 16.8003 5.42774 15.8452 3.81011C15.5675 3.33976 14.9085 3.47108 14.7358 3.98926C14.6634 4.20641 14.7041 4.44255 14.8123 4.64423C15.3423 5.63176 15.3523 6.96722 14.8424 7.9679C14.7206 8.2069 14.6773 8.48537 14.7719 8.7364C14.9782 9.28423 15.6789 9.42478 15.9712 8.91755ZM4.26185 3.47605C5.15265 2.58525 6.36083 2.08481 7.62061 2.08481C8.88038 2.08481 10.0886 2.58525 10.9794 3.47605C11.8702 4.36685 12.3706 5.57503 12.3706 6.83481C12.3706 8.09459 11.8702 9.30277 10.9794 10.1936C10.0886 11.0844 8.88038 11.5848 7.62061 11.5848C6.36083 11.5848 5.15265 11.0844 4.26185 10.1936C3.37105 9.30277 2.87061 8.09459 2.87061 6.83481C2.87061 5.57503 3.37105 4.36685 4.26185 3.47605ZM7.62061 3.58481C6.75865 3.58481 5.932 3.92722 5.32251 4.53671C4.71302 5.1462 4.37061 5.97286 4.37061 6.83481C4.37061 7.69676 4.71302 8.52341 5.32251 9.13291C5.932 9.7424 6.75865 10.0848 7.62061 10.0848C8.48256 10.0848 9.30921 9.7424 9.9187 9.13291C10.5282 8.52341 10.8706 7.69676 10.8706 6.83481C10.8706 5.97286 10.5282 5.1462 9.9187 4.53671C9.30921 3.92722 8.48256 3.58481 7.62061 3.58481ZM3.32251 16.5367C3.932 15.9272 4.75865 15.5848 5.62061 15.5848H9.62061C10.4826 15.5848 11.3092 15.9272 11.9187 16.5367C12.5282 17.1462 12.8706 17.9729 12.8706 18.8348V20.8348C12.8706 21.249 13.2064 21.5848 13.6206 21.5848C14.0348 21.5848 14.3706 21.249 14.3706 20.8348V18.8348C14.3706 17.575 13.8702 16.3668 12.9794 15.4761C12.0886 14.5853 10.8804 14.0848 9.62061 14.0848H5.62061C4.36083 14.0848 3.15265 14.5853 2.26185 15.4761C1.37105 16.3669 0.870605 17.575 0.870605 18.8348V20.8348C0.870605 21.249 1.20639 21.5848 1.62061 21.5848C2.03482 21.5848 2.37061 21.249 2.37061 20.8348V18.8348C2.37061 17.9729 2.71301 17.1462 3.32251 16.5367Z" fill="#6574DF"/>                    </svg>                    <svg class="dark" width="22" height="20" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">                        <path fill-rule="evenodd" clip-rule="evenodd" d="M19.2362 12.0826C21.8004 8.70687 21.7685 4.12413 19.0899 0.686665C18.7525 0.253628 18.0947 0.357164 17.8551 0.851137C17.7136 1.14307 17.7681 1.48994 17.9708 1.74328C20.1271 4.43853 20.1281 8.08186 17.9736 10.9024C17.7662 11.174 17.703 11.5344 17.8333 11.8504C18.0784 12.4444 18.8475 12.5943 19.2362 12.0826ZM15.9712 8.91755C16.8627 7.37031 16.8003 5.42774 15.8452 3.81011C15.5675 3.33976 14.9085 3.47108 14.7358 3.98926C14.6634 4.20641 14.7041 4.44255 14.8123 4.64423C15.3423 5.63176 15.3523 6.96722 14.8424 7.9679C14.7206 8.2069 14.6773 8.48537 14.7719 8.7364C14.9782 9.28423 15.6789 9.42478 15.9712 8.91755ZM4.26185 3.47605C5.15265 2.58525 6.36083 2.08481 7.62061 2.08481C8.88038 2.08481 10.0886 2.58525 10.9794 3.47605C11.8702 4.36685 12.3706 5.57503 12.3706 6.83481C12.3706 8.09459 11.8702 9.30277 10.9794 10.1936C10.0886 11.0844 8.88038 11.5848 7.62061 11.5848C6.36083 11.5848 5.15265 11.0844 4.26185 10.1936C3.37105 9.30277 2.87061 8.09459 2.87061 6.83481C2.87061 5.57503 3.37105 4.36685 4.26185 3.47605ZM7.62061 3.58481C6.75865 3.58481 5.932 3.92722 5.32251 4.53671C4.71302 5.1462 4.37061 5.97286 4.37061 6.83481C4.37061 7.69676 4.71302 8.52341 5.32251 9.13291C5.932 9.7424 6.75865 10.0848 7.62061 10.0848C8.48256 10.0848 9.30921 9.7424 9.9187 9.13291C10.5282 8.52341 10.8706 7.69676 10.8706 6.83481C10.8706 5.97286 10.5282 5.1462 9.9187 4.53671C9.30921 3.92722 8.48256 3.58481 7.62061 3.58481ZM3.32251 16.5367C3.932 15.9272 4.75865 15.5848 5.62061 15.5848H9.62061C10.4826 15.5848 11.3092 15.9272 11.9187 16.5367C12.5282 17.1462 12.8706 17.9729 12.8706 18.8348V20.8348C12.8706 21.249 13.2064 21.5848 13.6206 21.5848C14.0348 21.5848 14.3706 21.249 14.3706 20.8348V18.8348C14.3706 17.575 13.8702 16.3668 12.9794 15.4761C12.0886 14.5853 10.8804 14.0848 9.62061 14.0848H5.62061C4.36083 14.0848 3.15265 14.5853 2.26185 15.4761C1.37105 16.3669 0.870605 17.575 0.870605 18.8348V20.8348C0.870605 21.249 1.20639 21.5848 1.62061 21.5848C2.03482 21.5848 2.37061 21.249 2.37061 20.8348V18.8348C2.37061 17.9729 2.71301 17.1462 3.32251 16.5367Z" fill="white"/>                    </svg>                    <span>Nhắc bài</span>                    <div class="button-loading custom-loading"></div>                </button>                <button class="btn-action" id="btn-call-pick-up">                    <svg class="light" width="16" height="20" viewBox="0 0 16 20" fill="none" xmlns="http://www.w3.org/2000/svg">                        <path fill-rule="evenodd" clip-rule="evenodd" d="M5.25 1.75C4.91848 1.75 4.60054 1.8817 4.36612 2.11612C4.1317 2.35054 4 2.66848 4 3V5C4 5.41421 3.66421 5.75 3.25 5.75C2.83579 5.75 2.5 5.41421 2.5 5V3C2.5 2.27065 2.78973 1.57118 3.30546 1.05546C3.82118 0.539731 4.52065 0.25 5.25 0.25H13.25C13.9793 0.25 14.6788 0.539731 15.1945 1.05546C15.7103 1.57118 16 2.27065 16 3V17C16 17.7293 15.7103 18.4288 15.1945 18.9445C14.6788 19.4603 13.9793 19.75 13.25 19.75H5.25C4.52065 19.75 3.82118 19.4603 3.30546 18.9445C2.78973 18.4288 2.5 17.7293 2.5 17V15C2.5 14.5858 2.83579 14.25 3.25 14.25C3.66421 14.25 4 14.5858 4 15V17C4 17.3315 4.1317 17.6495 4.36612 17.8839C4.60054 18.1183 4.91848 18.25 5.25 18.25H13.25C13.5815 18.25 13.8995 18.1183 14.1339 17.8839C14.3683 17.6495 14.5 17.3315 14.5 17V3C14.5 2.66848 14.3683 2.35054 14.1339 2.11612C13.8995 1.8817 13.5815 1.75 13.25 1.75H10.9573C10.985 1.82819 11 1.91234 11 2C11 2.41421 10.6642 2.75 10.25 2.75H8.25C7.83579 2.75 7.5 2.41421 7.5 2C7.5 1.91234 7.51504 1.82819 7.54268 1.75H5.25ZM10 15C10 14.5858 9.66421 14.25 9.25 14.25C8.83579 14.25 8.5 14.5858 8.5 15V15.01C8.5 15.4242 8.83579 15.76 9.25 15.76C9.66421 15.76 10 15.4242 10 15.01V15ZM0.21967 6.46967C0.512563 6.17678 0.987437 6.17678 1.28033 6.46967L3.25 8.43934L5.21967 6.46967C5.51256 6.17678 5.98744 6.17678 6.28033 6.46967C6.57322 6.76256 6.57322 7.23744 6.28033 7.53033L4.31066 9.5L6.28033 11.4697C6.57322 11.7626 6.57322 12.2374 6.28033 12.5303C5.98744 12.8232 5.51256 12.8232 5.21967 12.5303L3.25 10.5607L1.28033 12.5303C0.987437 12.8232 0.512563 12.8232 0.21967 12.5303C-0.0732233 12.2374 -0.0732233 11.7626 0.21967 11.4697L2.18934 9.5L0.21967 7.53033C-0.0732233 7.23744 -0.0732233 6.76256 0.21967 6.46967Z" fill="#6574DF"/>                    </svg>                    <svg class="dark" width="16" height="20" viewBox="0 0 16 20" fill="none" xmlns="http://www.w3.org/2000/svg">                        <path fill-rule="evenodd" clip-rule="evenodd" d="M5.25 1.75C4.91848 1.75 4.60054 1.8817 4.36612 2.11612C4.1317 2.35054 4 2.66848 4 3V5C4 5.41421 3.66421 5.75 3.25 5.75C2.83579 5.75 2.5 5.41421 2.5 5V3C2.5 2.27065 2.78973 1.57118 3.30546 1.05546C3.82118 0.539731 4.52065 0.25 5.25 0.25H13.25C13.9793 0.25 14.6788 0.539731 15.1945 1.05546C15.7103 1.57118 16 2.27065 16 3V17C16 17.7293 15.7103 18.4288 15.1945 18.9445C14.6788 19.4603 13.9793 19.75 13.25 19.75H5.25C4.52065 19.75 3.82118 19.4603 3.30546 18.9445C2.78973 18.4288 2.5 17.7293 2.5 17V15C2.5 14.5858 2.83579 14.25 3.25 14.25C3.66421 14.25 4 14.5858 4 15V17C4 17.3315 4.1317 17.6495 4.36612 17.8839C4.60054 18.1183 4.91848 18.25 5.25 18.25H13.25C13.5815 18.25 13.8995 18.1183 14.1339 17.8839C14.3683 17.6495 14.5 17.3315 14.5 17V3C14.5 2.66848 14.3683 2.35054 14.1339 2.11612C13.8995 1.8817 13.5815 1.75 13.25 1.75H10.9573C10.985 1.82819 11 1.91234 11 2C11 2.41421 10.6642 2.75 10.25 2.75H8.25C7.83579 2.75 7.5 2.41421 7.5 2C7.5 1.91234 7.51504 1.82819 7.54268 1.75H5.25ZM10 15C10 14.5858 9.66421 14.25 9.25 14.25C8.83579 14.25 8.5 14.5858 8.5 15V15.01C8.5 15.4242 8.83579 15.76 9.25 15.76C9.66421 15.76 10 15.4242 10 15.01V15ZM0.21967 6.46967C0.512563 6.17678 0.987437 6.17678 1.28033 6.46967L3.25 8.43934L5.21967 6.46967C5.51256 6.17678 5.98744 6.17678 6.28033 6.46967C6.57322 6.76256 6.57322 7.23744 6.28033 7.53033L4.31066 9.5L6.28033 11.4697C6.57322 11.7626 6.57322 12.2374 6.28033 12.5303C5.98744 12.8232 5.51256 12.8232 5.21967 12.5303L3.25 10.5607L1.28033 12.5303C0.987437 12.8232 0.512563 12.8232 0.21967 12.5303C-0.0732233 12.2374 -0.0732233 11.7626 0.21967 11.4697L2.18934 9.5L0.21967 7.53033C-0.0732233 7.23744 -0.0732233 6.76256 0.21967 6.46967Z" fill="white"/>                    </svg>                    <span>Cướp</span>                    <div class="button-loading custom-loading"></div>                </button>                <button class="btn-action" id="btn-join-call">                    <svg class="light" width="30" height="20" viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg">                        <path d="M15 8V22" stroke="#6574DF" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>                        <path d="M8 15H22" stroke="#6574DF" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>                    </svg>                    <svg class="dark" width="30" height="20" viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg">                        <path d="M15 8V22" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>                        <path d="M8 15H22" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>                    </svg>                    <span>Tham gia</span>                    <div class="button-loading custom-loading"></div>                </button>            </div>        </div>    </section>    <section class="wrap-diapad-when-calling display-none">        <div class="wrap-typing-number pl-15 pr-15 mt-10 mb-10 display-flex justify-content-space-between">            <input type="text" value="" placeholder="*101#" class="font-size-24 color-black border-none" />            <button class="btn-close border-none bg-transparent">                <img src="https://static.stringee.com/stringeex/web_phone/latest/images/icon-close.svg" />            </button>        </div>        <div class="wrap-diapad mb-20 diapad-size-medium">            <div class="diapad-row">                <button class="diapad-key" id="diapad-key-dtmf-1">                    <span class="diapad-key-number">                        1                    </span>                </button>                <button class="diapad-key" id="diapad-key-dtmf-2">                    <span class="diapad-key-number">                        2                    </span>                </button>                <button class="diapad-key" id="diapad-key-dtmf-3">                    <span class="diapad-key-number">                        3                    </span>                </button>            </div>            <div class="diapad-row">                <button class="diapad-key" id="diapad-key-dtmf-4">                    <span class="diapad-key-number">                        4                    </span>                </button>                <button class="diapad-key" id="diapad-key-dtmf-5">                    <span class="diapad-key-number">                        5                    </span>                </button>                <button class="diapad-key" id="diapad-key-dtmf-6">                    <span class="diapad-key-number">                        6                    </span>                </button>            </div>            <div class="diapad-row">                <button class="diapad-key" id="diapad-key-dtmf-7">                    <span class="diapad-key-number">                        7                    </span>                </button>                <button class="diapad-key" id="diapad-key-dtmf-8">                    <span class="diapad-key-number">                        8                    </span>                </button>                <button class="diapad-key" id="diapad-key-dtmf-9">                    <span class="diapad-key-number">                        9                    </span>                </button>            </div>            <div class="diapad-row">                <button class="diapad-key" id="diapad-key-dtmf-star">                    <span class="diapad-key-number">                        *                    </span>                </button>                <button class="diapad-key" id="diapad-key-dtmf-0">                    <span class="diapad-key-number">                        0                    </span>                </button>                <button class="diapad-key" id="diapad-key-dtmf-sharp">                    <span class="diapad-key-number">                        #                    </span>                </button>            </div>        </div>    </section></section><!-- END PAGE CALLING  -->                <!--  PAGE INCOMMING CALL  --><section id="page-incomming-call" class="page display-none">    <div class="incomming-call-info box-shadow1 border-radius-18 bg-gradient-purple overflow-hidden mb-20">        <div class="wrap-info-text bg-white pt-20 pb-20">            <section class="wrap-status p-l-r-20 top-0 position-relative display-flex ">                <div class="wrap-status-text line-height-30">                    <span class="status-text" data-tranlate="currently_in_call">Currently in call..</span>                    <div class="line-red-short"></div>                </div>                <div class="wrap-agent-time line-height-30 position-absolute right-0">                    <span class="agent-time"> </span>                </div>            </section>            <section class="wrap-info p-20">                <div class="info-name pb-10">                    Pattrick Penna                </div>                <div class="wrap-location">                    <span class="location-via" data-translate="via">thông qua</span>                    <span class="location-text" data-translate="location">Vietnam</span>                </div>            </section>        </div>        <section class="wrap-background bg-gradient-purple height-350 width-100-percent">            <div class="wrap-avatar-round text-center">                <img class="avatar-agent" src="https://static.stringee.com/stringeex/web_phone/latest/images/avatar.png" class="mt-50" />                <div class="avatar-loading custom-loading"></div>            </div>            <div class="callstart-time">                <div class="location-queuetime"> </div>                <div class="location-queue"> </div>            </div>        </section>    </div>    <div class="incomming-call-action display-flex justify-content-space-between">        <button id="btn-incomming-decline" class="btn-action-incomming btn-round btn-red btn-size-55 display-table-cell border-none">            <img src="https://static.stringee.com/stringeex/web_phone/latest/images/icon-phone.svg" class="icon" style="transform: rotate(135deg)" />        </button>        <img src="https://static.stringee.com/stringeex/web_phone/latest/images/icon-dotted-end.svg" />        <img src="https://static.stringee.com/stringeex/web_phone/latest/images/icon-dotted-call.svg" />        <button id="btn-incomming-accept" class="btn-action-incomming btn-round btn-green btn-size-55 display-table-cell border-none">            <img src="https://static.stringee.com/stringeex/web_phone/latest/images/icon-phone.svg" class="icon" />        </button>    </div></section><!-- END PAGE INCOMMING CALL -->                <!-- PAGE DIAPAD --><section id="page-diapad" class="page">    <div class="wrap-typing-number pl-15 pr-15 mt-10 mb-10 display-flex justify-content-space-between">        <input type="text" value="" placeholder="+84966050926" class="font-size-24 color-black border-none" />        <button class="btn-close border-none bg-transparent">            <img src="https://static.stringee.com/stringeex/web_phone/latest/images/icon-close.svg" />        </button>    </div>    <div class="wrap-diapad mb-10">        <div class="diapad-row">            <button class="diapad-key" id="diapad-key-1">                <span class="diapad-key-number">                    1                </span>                <span class="diapad-key-text">                </span>            </button>            <button class="diapad-key" id="diapad-key-2">                <span class="diapad-key-number">                    2                </span>                <span class="diapad-key-text">                    ABC                </span>            </button>            <button class="diapad-key" id="diapad-key-3">                <span class="diapad-key-number">                    3                </span>                <span class="diapad-key-text">                    DEF                </span>            </button>        </div>        <div class="diapad-row">            <button class="diapad-key" id="diapad-key-4">                <span class="diapad-key-number">                    4                </span>                <span class="diapad-key-text">                    GHI                </span>            </button>            <button class="diapad-key" id="diapad-key-5">                <span class="diapad-key-number">                    5                </span>                <span class="diapad-key-text">                    JKL                </span>            </button>            <button class="diapad-key" id="diapad-key-6">                <span class="diapad-key-number">                    6                </span>                <span class="diapad-key-text">                    MNO                </span>            </button>        </div>        <div class="diapad-row">            <button class="diapad-key" id="diapad-key-7">                <span class="diapad-key-number">                    7                </span>                <span class="diapad-key-text">                    PQRS                </span>            </button>            <button class="diapad-key" id="diapad-key-8">                <span class="diapad-key-number">                    8                </span>                <span class="diapad-key-text">                    TUV                </span>            </button>            <button class="diapad-key" id="diapad-key-9">                <span class="diapad-key-number">                    9                </span>                <span class="diapad-key-text">                    WXYZ                </span>            </button>        </div>        <div class="diapad-row">            <button class="diapad-key" id="diapad-key-star">                <span class="diapad-key-number">                    *                </span>                <span class="diapad-key-text">                </span>            </button>            <button class="diapad-key" id="diapad-key-0">                <span class="diapad-key-number">                    0                </span>                <span class="diapad-key-text" style="font-size: 18px;">                    <span>                        <!-- + -->                    </span>                </span>            </button>            <button class="diapad-key" id="diapad-key-sharp">                <span class="diapad-key-number">                    #                </span>                <span class="diapad-key-text">                </span>            </button>        </div>    </div>    <div class="wrap-call-using-dropdown position-relative display-none">        <div id="list-from-numbers" class="call-using-dropdown box-shadow3 border-radius-8 bg-white">            <!--			<div class="call-using-dropdown-item cursor-pointer p-15 pt-10 pb-10">				<div>					<span class="call-using-text-name display-block">Number 1</span>					<span class="call-using-text-phone display-block">+84899199586</span>				</div>			</div>-->        </div>        <div class="icon-dropdown right-40">        </div>    </div>    <div class="wrap-call-using pl-20 pr-20 mb-10 position-relative cursor-pointer">        <div class="call-using-text mb-5" data-translate="using_number">            Sử dụng số        </div>        <div class="call-using-select pt-10 pb-10 pr-15 pl-15 display-flex justify-content-space-between">            <div>                <span id="from-number-callout-alias" class="call-using-text-name display-block">Number 1</span>                <span id="from-number-callout" class="call-using-text-phone display-block">+84899199586</span>            </div>            <img src="https://static.stringee.com/stringeex/web_phone/latest/images/icon-dropdown.svg" />        </div>    </div>    <!-- dropdown select call type-->    <div class="wrap-select-beauty-dropdown position-relative display-none">        <div id="list-call-type" class="select-beauty-dropdown box-shadow3 border-radius-8 bg-white">            <div class="select-beauty-dropdown-item cursor-pointer p-15 pt-10 pb-10" data-value="ask">				<div>					<span class="select-beauty-text-phone display-block">Ask</span>				</div>			</div>            <div class="select-beauty-dropdown-item cursor-pointer p-15 pt-10 pb-10" data-value="free-video-call">				<div>					<span class="select-beauty-text-phone display-block">Free video call</span>				</div>			</div>            <div class="select-beauty-dropdown-item cursor-pointer p-15 pt-10 pb-10" data-value="free-voice-call">				<div>					<span class="select-beauty-text-phone display-block">Free voice call</span>				</div>			</div>            <div class="select-beauty-dropdown-item cursor-pointer p-15 pt-10 pb-10" data-value="callout">				<div>					<span class="select-beauty-text-phone display-block">Call out</span>				</div>			</div>        </div>        <div class="icon-dropdown right-40">        </div>    </div>    <div class="wrap-select-beauty pl-20 pr-20 position-relative cursor-pointer">        <div class="select-beauty-text mb-5" data-translate="using_call_type">            Loại cuộc gọi        </div>        <div class="select-beauty-select pt-10 pb-10 pr-15 pl-15 display-flex justify-content-space-between">            <div>                <span id="call-type-text" class="call-using-text-name display-block">Call out</span>            </div>            <img src="https://static.stringee.com/stringeex/web_phone/latest/images/icon-dropdown.svg" />        </div>    </div>    <!-- end dropdown select call type --></section><!-- END PAGE DIAPAD --->                <!-- PAGE CONTACT --><section id="page-contact" class="page display-none">    <div class="wrap-contact-filter p-l-r-20 mb-20 display-table">        <div class="contact-filter display-flex font-size-12">            <button class="contact-filter-item active p-5 p-l-r-10 mr-10 mt-5 border-none">Tất cả</button>            <button class="contact-filter-item p-5 p-l-r-10 mt-5 border-none">Nhóm</button>        </div>        <div class="wrap-input-search">            <input type="text" id="inputSearchContact" class="input-search position-absolute font-size-18 pl-15 right-0 top-0 display-none border-none outline-none" />            <button id="btnSearchContact" class="bg-transparent border-none position-absolute btn-finter-search right-15 top-5 p-10 outline-none cursor-pointer"><img class="pointer-events-none" src="https://static.stringee.com/stringeex/web_phone/latest/images/icon-search.svg" /></button>        </div>    </div>    <div class="line-dotted"></div>    <div class="wrap-contact-list">        <div class="wrap-contact-list-content">            <div class="wrap-contact-group display-flex pl-15 pt-20">                <div class="contact-group-name">                    A                </div>                <div class="contact-group-item width-100-percent">                    <div class="contact-item display-flex">                        <button class="wrap-contact-item-avatar bg-purple border-radius-12 width-35 height-35 text-center">                            <span class="contact-item-avatar"><img src="https://static.stringee.com/stringeex/web_phone/latest/images/icon-user.svg" /></span>                            <span class="contact-item-status status-offline"></span>                        </button>                        <div class="wrap-contact-item-info">                            <div class="contact-item-name">                                Pattrick Penna                            </div>                            <div class="contact-item-phone">                                Stringee                            </div>                            <div class="contact-item-call visibility-hidden">                                <button class="btn-round btn-green btn-call-item display-table-cell border-none cursor-pointer">                                    <img src="https://static.stringee.com/stringeex/web_phone/latest/images/icon-phone.svg" class="icon" />                                </button>                            </div>                        </div>                    </div>                    <div class="contact-item display-flex">                        <button class="wrap-contact-item-avatar bg-light-green border-radius-12 width-35 height-35 text-center">                            <span class="contact-item-avatar"><img src="https://static.stringee.com/stringeex/web_phone/latest/images/icon-user.svg" /></span>                            <span class="contact-item-status status-online"></span>                        </button>                        <div class="wrap-contact-item-info">                            <div class="contact-item-name">                                Pattrick Penna                            </div>                            <div class="contact-item-phone">                                Stringee                            </div>                            <div class="contact-item-call visibility-hidden">                                <button class="btn-round btn-green btn-call-item display-table-cell border-none cursor-pointer">                                    <img src="https://static.stringee.com/stringeex/web_phone/latest/images/icon-phone.svg" class="icon" />                                </button>                            </div>                        </div>                    </div>                    <div class="contact-item display-flex">                        <button class="wrap-contact-item-avatar bg-light-blue border-radius-12 width-35 height-35 text-center">                            <span class="contact-item-avatar"><img src="https://static.stringee.com/stringeex/web_phone/latest/images/icon-user.svg" /></span>                            <span class="contact-item-status status-offline"></span>                        </button>                        <div class="wrap-contact-item-info">                            <div class="contact-item-name">                                Pattrick Penna                            </div>                            <div class="contact-item-phone">                                Stringee                            </div>                            <div class="contact-item-call visibility-hidden">                                <button class="btn-round btn-green btn-call-item display-table-cell border-none cursor-pointer">                                    <img src="https://static.stringee.com/stringeex/web_phone/latest/images/icon-phone.svg" class="icon" />                                </button>                            </div>                        </div>                    </div>                </div>            </div>            <div class="wrap-contact-group display-flex pl-15 pt-20">                <div class="contact-group-name">                    B                </div>                <div class="contact-group-item width-100-percent">                    <div class="contact-item display-flex">                        <button class="wrap-contact-item-avatar bg-purple border-radius-12 width-35 height-35 text-center">                            <span class="contact-item-avatar"><img src="https://static.stringee.com/stringeex/web_phone/latest/images/icon-user.svg" /></span>                            <span class="contact-item-status status-offline"></span>                        </button>                        <div class="wrap-contact-item-info">                            <div class="contact-item-name">                                Pattrick Penna                            </div>                            <div class="contact-item-phone">                                Stringee                            </div>                            <div class="contact-item-call visibility-hidden">                                <button class="btn-round btn-green btn-call-item display-table-cell border-none cursor-pointer">                                    <img src="https://static.stringee.com/stringeex/web_phone/latest/images/icon-phone.svg" class="icon" />                                </button>                            </div>                        </div>                    </div>                    <div class="contact-item display-flex">                        <button class="wrap-contact-item-avatar bg-light-green border-radius-12 width-35 height-35 text-center">                            <span class="contact-item-avatar"><img src="https://static.stringee.com/stringeex/web_phone/latest/images/icon-user.svg" /></span>                            <span class="contact-item-status status-online"></span>                        </button>                        <div class="wrap-contact-item-info">                            <div class="contact-item-name">                                Pattrick Penna                            </div>                            <div class="contact-item-phone">                                Stringee                            </div>                            <div class="contact-item-call visibility-hidden">                                <button class="btn-round btn-green btn-call-item display-table-cell border-none cursor-pointer">                                    <img src="https://static.stringee.com/stringeex/web_phone/latest/images/icon-phone.svg" class="icon" />                                </button>                            </div>                        </div>                    </div>                    <div class="contact-item display-flex">                        <button class="wrap-contact-item-avatar bg-light-blue border-radius-12 width-35 height-35 text-center">                            <span class="contact-item-avatar"><img src="https://static.stringee.com/stringeex/web_phone/latest/images/icon-user.svg" /></span>                            <span class="contact-item-status status-offline"></span>                        </button>                        <div class="wrap-contact-item-info">                            <div class="contact-item-name">                                Pattrick Penna                            </div>                            <div class="contact-item-phone">                                Stringee                            </div>                            <div class="contact-item-call visibility-hidden">                                <button class="btn-round btn-green btn-call-item display-table-cell border-none cursor-pointer">                                    <img src="https://static.stringee.com/stringeex/web_phone/latest/images/icon-phone.svg" class="icon" />                                </button>                            </div>                        </div>                    </div>                </div>            </div>            <div class="wrap-contact-group display-flex pl-15 pt-20">                <div class="contact-group-name">                    C                </div>                <div class="contact-group-item width-100-percent">                    <div class="contact-item display-flex">                        <button class="wrap-contact-item-avatar bg-purple border-radius-12 width-35 height-35 text-center">                            <span class="contact-item-avatar"><img src="https://static.stringee.com/stringeex/web_phone/latest/images/icon-user.svg" /></span>                            <span class="contact-item-status status-offline"></span>                        </button>                        <div class="wrap-contact-item-info">                            <div class="contact-item-name">                                Pattrick Penna                            </div>                            <div class="contact-item-phone">                                Stringee                            </div>                            <div class="contact-item-call visibility-hidden">                                <button class="btn-round btn-green btn-call-item display-table-cell border-none cursor-pointer">                                    <img src="https://static.stringee.com/stringeex/web_phone/latest/images/icon-phone.svg" class="icon" />                                </button>                            </div>                        </div>                    </div>                </div>            </div>        </div>    </div></section><!-- END PAGE CONTACT -->                <!-- PAGE ACTIVITY --><section id="page-activity" class="page display-none">    <!-- <div class="wrap-contact-filter p-l-r-20 mb-20 display-table">        <div class="contact-filter display-flex font-size-12">            <button class="contact-filter-item active p-5 p-l-r-10 mt-5 mr-10 border-none">Inbox</button>            <button class="contact-filter-item p-5 p-l-r-10 mt-5 border-none">All</button>        </div>    </div> -->    <div class="line-dotted"></div>    <div class="wrap-activity-list">        <div  class="wrap-activity-list-content">            <div id="list-recent-calls">            </div>        </div>    </div></section><!-- <div class="call-wrapper">            </div> -->                <!-- <div class="activity-date">20/06/2018</div>                <div  class="wrap-activity-group" >                    <div class="wrap-activity-item display-flex">                        <div class="activity-icon">                            <img src="https://static.stringee.com/stringeex/web_phone/latest/images/icon-call-out.svg" />                        </div>                        <div class="activity-info">                            <div class="activity-phone">+84 966050824</div>                            <div class="activity-via">Giangle via Stringee</div>                        </div>                        <div class="activity-time">                            6:40 PM                        </div>                        <div class="activity-more">                            <img src="https://static.stringee.com/stringeex/web_phone/latest/images/icon-arrow-point-to-right.svg" />                        </div>                    </div>                </div> --><!-- END PAGE ACTIVITY -->                <!-- TOOLBAR FOOTER --><section class="wrap-toolbar-bottom position-absolute bottom-0 height-100 width-100-percent box-shadow2 z-index-100 bg-white">    <div class="wrap-toolbar text-center display-flex justify-content-space-evenly">        <button id="btnToolActivity" class="toolbar-item display-table-cell border-none bg-transparent">            <img src="https://static.stringee.com/stringeex/web_phone/latest/images/icon-list-gray.svg" class="icon-gray"/>            <img src="https://static.stringee.com/stringeex/web_phone/latest/images/icon-list.svg" class="icon"/>        </button>        <button id="btnToolSetting" class="toolbar-item display-table-cell border-none bg-transparent display-none">            <img src="https://static.stringee.com/stringeex/web_phone/latest/images/icon-setting-gray.svg" class="icon-gray" />            <img src="https://static.stringee.com/stringeex/web_phone/latest/images/icon-setting.svg" class="icon" />        </button>        <button id="btnToolCall" class="btn-action-incomming btn-round btn-green btn-size-55 display-table-cell border-none mt-15-negative">            <img src="https://static.stringee.com/stringeex/web_phone/latest/images/icon-phone.svg" class="icon-gray" />            <img src="https://static.stringee.com/stringeex/web_phone/latest/images/icon-phone.svg" class="icon" />        </button><!--		<button id="btnToolEndCall" class="btn-action-incomming btn-round btn-red btn-size-55 display-table-cell border-none mt-15-negative">            <img src="images/icon-phone.svg" class="icon-gray" />            <img src="images/icon-phone.svg" class="icon" />        </button>-->        <button id="btnToolPad" class="btn-action-incomming btn-round btn-green btn-size-55 display-table-cell border-none mt-15-negative display-none">            <img src="https://static.stringee.com/stringeex/web_phone/latest/images/icon-pad.svg" class="icon-gray" />            <img src="https://static.stringee.com/stringeex/web_phone/latest/images/icon-pad.svg" class="icon" />        </button>        <button id="btnToolContact" class="toolbar-item display-table-cell border-none bg-transparent">            <img src="https://static.stringee.com/stringeex/web_phone/latest/images/icon-user-gray.svg" class="icon-gray" />            <img src="https://static.stringee.com/stringeex/web_phone/latest/images/icon-user.svg" class="icon"/>        </button>        <button id="btnToolAdd" class="toolbar-item display-table-cell border-none bg-transparent display-none">            <img src="https://static.stringee.com/stringeex/web_phone/latest/images/icon-add-gray.svg" class="icon-gray" />            <img src="https://static.stringee.com/stringeex/web_phone/latest/images/icon-add.svg" class="icon" />        </button>    </div></section><!-- END TOOLBAR FOOTER -->                <!-- Select call type --><section class="wrap-option-call position-absolute z-index-100 display-none">	<button class="btn-close-option-call border-none bg-transparent float-right">		<img src="https://static.stringee.com/stringeex/web_phone/latest/images/icon-close.svg">	</button>	<div class="mt-150">		<button class="btn-otption-call btn-free-voice-call">			<span class="btn-icon">				<img src="https://static.stringee.com/stringeex/web_phone/latest/images/icon-phone.svg" class="icon-gray" width="15">			</span>			<span data-translate="free_voice_call">Free voice call</span>		</button>		<button class="btn-otption-call btn-free-video-call">			<span class="btn-icon">				<img src="https://static.stringee.com/stringeex/web_phone/latest/images/icon-videocall.svg" class="icon-gray" width="15">			</span>			<span data-translate="free_video_call">Free video cal</span>		</button>		<button class="btn-otption-call btn-free-callout">			<span class="btn-icon">				<img src="https://static.stringee.com/stringeex/web_phone/latest/images/icon-phone.svg" class="icon-gray" width="15">			</span>			<span data-translate="call_out">Call out</span>		</button>	</div></section><!-- Select call type -->            </div>            <audio preload="auto" id="ringtonePlayer" playsinline style="width: 1px" src="https://static.stringee.com/stringeex/web_phone/latest/audio/Antique-Phone5.mp3"></audio>            <video id="remoteVideo" playsinline autoplay style="width: 1px"></video>            <audio id="remoteAudio" playsinline autoplay style="width: 1px"></audio>        </div>    </body></html>';
	getContentIframe(iframe_html);




};

StringeeSoftPhone.connect = function (access_token) {
	StringeeSoftPhone._access_token = access_token;
	if (StringeeSoftPhone._iframe && StringeeSoftPhone._iframe.contentWindow.stringeePhone) {
		StringeeSoftPhone._iframe.contentWindow.stringeePhone.connect(access_token);
	}
};

StringeeSoftPhone.showPopupAskCallType = function (show) {
	StringeeSoftPhone._iframe.contentWindow.stringeePhone.showPopupAskCallType(show);
};

StringeeSoftPhone.disconnect = function () {
	if (StringeeSoftPhone._iframe && StringeeSoftPhone._iframe.contentWindow.stringeePhone) {
		StringeeSoftPhone._iframe.contentWindow.stringeePhone.disconnect();
	} else {
		console.log('StringeePhone not ready');
	}
};

StringeeSoftPhone.config = function (config) { //{top, left, right, bottom}
	//copy toan bo thuoc tinh cua config qua
	for (var propertyName in config) {
		StringeeSoftPhone[propertyName] = config[propertyName];
	}

	if (!StringeeSoftPhone._ready) {
		return;
	}

	var iframe_wrappers = document.getElementsByClassName("stringee_iframe_wrapper");
	if (iframe_wrappers.length > 0) {
		var iframe_wrapper = iframe_wrappers[0];

		//vi tri cua iframe
		if (config.top !== undefined) {
			iframe_wrapper.style.top = config.top + 'px';
		}
		if (config.left !== undefined) {
			iframe_wrapper.style.left = config.left + 'px';
		}
		if (config.right !== undefined) {
			iframe_wrapper.style.right = config.right + 'px';
		}
		if (config.bottom !== undefined) {
			iframe_wrapper.style.bottom = config.bottom + 'px';
		}

		//vi tri cua arrow
		var arrows = document.getElementsByClassName("drop-down-rectangle1");
		if (arrows.length > 0) {
			var arrow = arrows[0];
			if (config.arrowDisplay !== undefined) {
				if (config.arrowDisplay === 'top') {
					arrow.style.top = '-5px';
					arrow.style.display = 'block';
				} else if (config.arrowDisplay === 'bottom') {
					arrow.style.top = '526px';
					arrow.style.display = 'block';
				} else if (config.arrowDisplay === 'none') {
					arrow.style.display = 'none';
				}
			}

			if (config.arrowLeft !== undefined) {
				arrow.style.left = config.arrowLeft + 'px';
			}
		}

		//show mode
		if (config.showMode === 'full' || config.showMode === 'min') {
			if (StringeeSoftPhone._ready) {
				iframe_wrapper.style.display = 'block';

				if (config.showMode === 'min') {
					iframe_wrapper.style.width = '206px';
					iframe_wrapper.style.height = '44px';
				} else {
					iframe_wrapper.style.width = '287px';
					iframe_wrapper.style.height = '538px';
				}

				StringeeSoftPhone._iframe.contentWindow.stringeePhone.showMode(config.showMode);

				StringeeSoftPhone._callOnEvent('displayModeChange', config.showMode);
			}
		} else if (config.showMode === 'none') {
			if (StringeeSoftPhone._ready) {
				iframe_wrapper.style.display = 'none';

				StringeeSoftPhone._callOnEvent('displayModeChange', config.showMode);
			}
		}

		//fromNumbers
		if (config.fromNumbers !== undefined) {
			StringeeSoftPhone._iframe.contentWindow.stringeePhone.setFromNumbers(config.fromNumbers);
		}

		//recentCalls
		// if (StringeeSoftPhone.recentCalls !== undefined) {
		// 	StringeeSoftPhone._iframe.contentWindow.stringeePhone.setRecentCalls(StringeeSoftPhone.recentCalls);
		// }

		//showButtonClose
		if (config.showButtonClose !== undefined) {
			if (config.showButtonClose) {
				StringeeSoftPhone._iframe.contentWindow.stringeePhone.showButtonClose('show');
			} else {
				StringeeSoftPhone._iframe.contentWindow.stringeePhone.showButtonClose('none');
			}
		}

		if (config.routingType !== undefined) {
			StringeeSoftPhone._iframe.contentWindow.stringeePhone.showIconRoutingType(config.routingType)
		}

		if (config.ringToneFile !== undefined) {
			StringeeSoftPhone._iframe.contentWindow.stringeePhone.setRingTone(config.ringToneFile);
		}
	}
};





StringeeSoftPhone.show = function (showMode) {
	var config = {
		showMode: showMode
	};
	StringeeSoftPhone.config(config);


};

StringeeSoftPhone.setRecentCalls = function (recentCalls) {
	StringeeSoftPhone.recentCalls = recentCalls;
	if (!StringeeSoftPhone._ready) {
		return false;
	}
	return StringeeSoftPhone._iframe.contentWindow.stringeePhone.setRecentCalls(recentCalls);

	// if (StringeeSoftPhone._iframe && StringeeSoftPhone._iframe.contentWindow.stringeePhone) {
	// 	StringeeSoftPhone._iframe.contentWindow.stringeePhone.setRecentCalls(recentCalls);
	// }
}
/**
 *
 * @param fromNumber
 * @param toNumber
 * @param callback
 * @param callType
 * @param passedInEncryptedPhone string showing the encrypt phone
 */
StringeeSoftPhone.makeCall = function (fromNumber, toNumber, callback, callType, passedInEncryptedPhone = null, switchVideoCall2 = false, customData = {}) {
	console.log("STSF: Making call with:", fromNumber, toNumber, "and passed in encrypt phone", passedInEncryptedPhone);
	if (!StringeeSoftPhone._ready) {
		callback.call(this, {
			r: 1,
			msg: 'StringeeSoftphone is not ready yet'
		});
		return;
	}

	StringeeSoftPhone._iframe.contentWindow.stringeePhone.makeCallWithUI(fromNumber, toNumber, callback, callType, passedInEncryptedPhone, switchVideoCall2, customData);
};

StringeeSoftPhone.hangupCall = function () {
	if (!StringeeSoftPhone._ready) {
		return false;
	}

	return StringeeSoftPhone._iframe.contentWindow.stringeePhone.hangupCall();
};

StringeeSoftPhone.answerCall = function () {
	if (!StringeeSoftPhone._ready) {
		return false;
	}

	return StringeeSoftPhone._iframe.contentWindow.stringeePhone.answerCall();
};

StringeeSoftPhone.setLabelHtml = function (selector, html) {
	if (!StringeeSoftPhone._ready) {
		return false;
	}

	return StringeeSoftPhone._iframe.contentWindow.stringeePhone.setLabelHtml(selector, html);
};


StringeeSoftPhone.setAutoPickUp = function (val, type) {
	return StringeeSoftPhone._iframe.contentWindow.stringeePhone.setAutoPickUp(val, type)
}

StringeeSoftPhone.setTransferToIPPhone = function (val, type) {
	return StringeeSoftPhone._iframe.contentWindow.stringeePhone.setTransferToIPPhone(val, type)
}

StringeeSoftPhone.sendHold = function (musicOnHold) {
	StringeeSoftPhone._iframe.contentWindow.stringeePhone.sendHold(musicOnHold)
}

StringeeSoftPhone.sendUnHold = function () {
	StringeeSoftPhone._iframe.contentWindow.stringeePhone.sendUnHold();
}

StringeeSoftPhone.setRingTone = function (source) {
	if (source) {
		StringeeSoftPhone._iframe.contentWindow.stringeePhone.setRingTone(source);
	}
}

StringeeSoftPhone.joinCall = function (callId, isCreateLocalVideoTrack = false) {
	if (!StringeeSoftPhone._ready) {
		return false;
	}
	return StringeeSoftPhone._iframe.contentWindow.stringeePhone.joinCall(callId, isCreateLocalVideoTrack);
}