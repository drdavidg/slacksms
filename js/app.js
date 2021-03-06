$($(document).ready( function() {

		//commenting out because i already created this channel (using api)
		// $.getJSON('https://slack.com/api/channels.create',
		//  {token: 'xoxp-2315976778-2315977822-10394561350-ca4652',
		// 	name: "working channel",
		// 	scope: "admin"
		// 	}, function(json, textStatus) {
		// 		/*optional stuff to do after success */
		// 		console.log("gots the jsons");
		// });

	// $('form.msgform').submit( function(event){
	// 	console.log("form submitted!!");
	//
	// 	var msgContent = $('input.msginput').val();
	// 	console.log(msgContent);
	// 	addMsgtoSlack(msgContent);
	// 	addSentMsgtoDOM(msgContent);
	// 	return false;
	// });

	$('div.container').on('click', 'form.msgform button.sendmsgbutton', function(event) {
		event.preventDefault();
		/* Act on the event */
		console.log('button clicked');
		var msgContent = $('input.msginput').val();
		addMsgtoSlack(msgContent);
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

	function addMsgtoSlack(msgContent) {

			$.getJSON('https://slack.com/api/chat.postMessage',
			 {token: 'xoxp-2315976778-2315977822-10394561350-ca4652',
				channel: "#working-channel",
				text: msgContent,
				username: "Guest3201"
				}, function(json, textStatus) {
						/*optional stuff to do after success */
						console.log("message was postered!");
			});

	}


}));
