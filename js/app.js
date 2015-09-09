$($(document).ready( function() {



	openSocket();

	function openSocket() {

		$.getJSON('https://slack.com/api/rtm.start',
		 {token: 'xoxp-2315976778-2315977822-10394561350-ca4652'
			},
			function(json, textStatus) {
				//console.log(json.channels[2].latest.text);
				//addReceivedMsgtoDOM(json.channels[2].latest.text);
				var connection = new WebSocket(json.url);
				connection.onopen = function () {
					// console.log("ws url is  : " + json.url);
					// console.log("web socket connected!!! (i think)");
					// var msg = {
					// 	type: "message",
					// 	id: 1,
					// 	channel: "C0ABS4QNL",
					// 	text: "sending a messssaaaage"
					// };
					// connection.send(JSON.stringify(msg));
				};
				connection.onerror = function (error) {
			  	console.log('Error Logged: ' + error); //log errors
				};
				connection.onmessage = function (e) {
				 console.log(e.data);
					var parsedData = JSON.parse(e.data);
				//	console.log("message text:  " + parsedData.text);
					//console.log("reply to:  " + parsedData.reply_to);
					if ((parsedData.text !== undefined)&&(parsedData.subtype !== "bot_message")&&(parsedData.reply_to === undefined)&&(parsedData.subtype !== "channel_join")) addReceivedMsgtoDOM(parsedData.text);
				};

			});

	}

	$('div.container').on('click', 'form.msgform button.sendmsgbutton', function(event) {
		event.preventDefault();
		/* Act on the event */
		console.log('button clicked');
		var msgContent = $('input.msginput').val();
		var phoneNumber = $('input.phoneinput').val();
		console.log(phoneNumber);
		setChannel(msgContent, phoneNumber);
		addSentMsgtoDOM(msgContent);
	});


	function addSentMsgtoDOM(msgContent) {
		var html = "";
		html += "<div class='sentmsg msg pure-g'><div class=pure-u-1-8'></div><div class='pure-u-3-4'><div class='bubbleright'><div class='msgtext'>" + msgContent + "</div></div></div><div class='pure-u-1-8'></div></div>";
		$(html).appendTo('.chatarea');
	}

	function addReceivedMsgtoDOM(msgContent) {
		var html = "";
		html += "<div class='receivedmsg msg pure-g'><div class=pure-u-1-8'></div><div class='pure-u-3-4'><div class='bubbleleft'><div class='msgtext'>" + msgContent + "</div></div></div><div class='pure-u-1-8'></div></div>";
		$(html).appendTo('.chatarea');
	}

	function setChannel(msgContent, channelName) {
		// if channelName doesn't exists on error make the channelname first
		//i thihnk have to switch to $.ajax.  does $
		$.ajax({
			url: 'https://slack.com/api/channels.create',
			type: 'GET',
			dataType: 'json',
			data: {
				token: 'xoxp-2315976778-2315977822-10394561350-ca4652',
				name: channelName,
				scope: "admin"}
		})
		.done(function(json) {
			console.log("success");
			console.log("channelName is: " + channelName + " msgContent is " + msgContent);
			console.log("stringified channelName " + JSON.stringify(channelName));
			console.log(json.channel.id);


			addMsgtoSlack(msgContent, json.channel.id);
		})
		.fail(function() {
			console.log("fail");
			return false;
		})
		.error(function() {
			/* Act on the event */
			console.log("error");
		})
		.always(function() {
			console.log("complete");
		});
	}

	function addMsgtoSlack(msgContent, channelName) {
		$.getJSON('https://slack.com/api/chat.postMessage', {
			token: 'xoxp-2315976778-2315977822-10394561350-ca4652',
			channel: channelName,
			text: msgContent
		},
		function(json, textStatus) {
				/*optional stuff to do after success */
				console.log('chat should be posted to channel????  ' + channelName);
		});
	}

	// var oldLatestMsg = "";
	// function getMsgfromSlack() {
	// 	// $.getJSON('https://slack.com/api/rtm.start',
	// 	//  {token: 'xoxp-2315976778-2315977822-10394561350-ca4652'
	// 	// 	},
	// 	// 	function(json, textStatus) {
	// 	// 		/*optional stuff to do after success */
	// 	// 		console.log(json.channels[2].latest.text);
	// 	// 		addReceivedMsgtoDOM(json.channels[2].latest.text);
	// 	// 		return;
	// 	// 	});
	//
	// 		$.ajax({
	// 			url: 'https://slack.com/api/rtm.start',
	// 			type: 'GET',
	// 			dataType: 'json',
	// 			data: {token: 'xoxp-2315976778-2315977822-10394561350-ca4652'},
	// 		})
	// 		.done(function(json) {
	// 			var newLatestMsg = json.channels[2].latest.text;
	// 			if (newLatestMsg !== oldLatestMsg) {
	// 				addReceivedMsgtoDOM(newLatestMsg);
	// 				oldLatestMsg = newLatestMsg;
	// 			}
	// 			//console.log(json.channels[2]);
	//
	//
	//
	// 		})
	// 		.fail(function() {
	//
	// 		})
	// 		.always(function(json) {
	//
	// 		});
	// }


}));
