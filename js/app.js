$($(document).ready( function() {

	$.getJSON('https://slack.com/api/channels.create',
	 {token: 'xoxp-2315976778-2315977822-10394561350-ca4652',
		name: "working channel",
		scope: "admin"
		}, function(json, textStatus) {
			/*optional stuff to do after success */
			console.log("gots the jsons");
	});

	$('.msgform').submit( function(event){
		console.log("form submitted!!");

		var msgContent = $('input.msginput').val();
		console.log(msgContent);
		addMsg(msgContent);

		return false;
	});

function addMsg(msgContent) {

	$.getJSON('https://slack.com/api/chat.postMessage',
	 {token: 'xoxp-2315976778-2315977822-10394561350-ca4652',
		channel: "#working-channel",
		text: msgContent
		}, function(json, textStatus) {
				/*optional stuff to do after success */
				console.log("message was postered!");
	});


}


}));
