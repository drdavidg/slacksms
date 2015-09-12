$($(document).ready( function() {

	var slackChat = {
		currChannel: null,
		lastMessageTimeStamp: [],
		openSocket: function() {//this is used to detect messages created in Slack and then send them via Twilio SMS
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
						var msg = {
							type: "message",
							channel: "C0ACK7RR7",
							text: "sending a messssaaaage",
							user: "U0299URQ6",
							ts: "1355517523.000005"
						};
						//connection.send(JSON.stringify(msg));
					};
					connection.onerror = function (error) {
				  //	console.log('Error Logged: ' + error); //log errors
					};
					connection.onmessage = function (e) { //message event slack->app
					 //console.log(e.data);
						var parsedData = JSON.parse(e.data);
						if ((parsedData.text !== undefined)&&(parsedData.subtype !== "bot_message")&&(parsedData.reply_to === undefined)&&(parsedData.subtype !== "channel_join")) {
							slackChat.addReceivedMsgtoDOM(parsedData.text);
							$.getJSON('https://slack.com/api/channels.info',
							{
								token: 'xoxp-2315976778-2315977822-10394561350-ca4652',
								channel: parsedData.channel
							},
							function(json, textStatus) {
								slackChat.sendSMS(parsedData.text, json.channel.name);
							});

						}
					};
				});
		},
		setChannel: function(channelName, msgContent) {
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
				console.log(json);
				if (json.ok === true) slackChat.currChannel = json.channel.id;
				//else if (json.error === "name_taken") slackChat.addMsgtoSlack(msgContent, channelName);
				else {
					console.log('gots an errorz ' + json.error);
					// slackChat.currChannel = json.channel.id;
					slackChat.addMsgtoSlack(msgContent, slackChat.currChannel);
				}
				console.log("slackChat.currChannel equals =  " + slackChat.currChannel);

				if (slackChat.currChannel) slackChat.addMsgtoSlack(msgContent, slackChat.currChannel);

			})
			.fail(function() {
				console.log("fail");
			})
			.always(function() {
				console.log("complete");
			});
		},
		addMsgtoSlack: function(msgContent, channelName) {
			$.getJSON('https://slack.com/api/chat.postMessage', {
				token: 'xoxp-2315976778-2315977822-10394561350-ca4652',
				channel: channelName,
				text: msgContent,
				username: "Guest103" //TODO need to un-hardcode this
			},
			function(json, textStatus) {
					console.log('chat should be posted to Slack channel????  ' + channelName);
			});
		},
		sendSMS: function(smsText, toPhoneNumber) { //new Slack message -> send out SMS texts using Twilio
			$.ajax({
				url: 'https://api.twilio.com/2010-04-01/Accounts/AC4e170477bd4abe4c97d8818f156ea4fb/Messages',
				type: 'POST',
				dataType: 'json',
				headers: {
					authorization: "Basic QUM0ZTE3MDQ3N2JkNGFiZTRjOTdkODgxOGYxNTZlYTRmYjo3OWVkZTMzM2NiZTc0NTI0MmM1OGVlZDk4Zjg1MGEwMA=="
				},
				data: {
					From: '+13105041517',
					To: toPhoneNumber,
					Body: smsText,
				}
			})
			.done(function() {
				console.log("twilio success");
			})
			.fail(function() {
				console.log("twilio error");
			})
			.always(function() {
				console.log("twilio complete");
			});
		},
		checkLatestSMS: function() {
			//look through twilio REST API sms history.  somehow see if there is a new one (maybe using length of returned array??)
			$.ajax({
				url: 'https://api.twilio.com/2010-04-01/Accounts/AC4e170477bd4abe4c97d8818f156ea4fb/Messages.json',
				type: 'GET',
				dataType: 'json',
				headers: {
					authorization: "Basic QUM0ZTE3MDQ3N2JkNGFiZTRjOTdkODgxOGYxNTZlYTRmYjo3OWVkZTMzM2NiZTc0NTI0MmM1OGVlZDk4Zjg1MGEwMA=="
				},
				data: {
					To: "13105041517"
				}
			})
			.done(function(jsonTwilio) {

			})
			.fail(function() {
				console.log("twilio error");
			})
			.always(function(jsonTwilio) {
				console.log("twilio complete");
				//pull latest twilio sms timestamp.  pull latest slack message timestamp.  if twilio sms timestamp > slack message timestamp push twilio sms to slack as message

				var channelString = jsonTwilio.messages[0].from;
				channelString = channelString.substr(1);
				channelString = JSON.stringify(channelString);
				//console.log(channelString);

				createChannel(channelString);


				function createChannel(channelID) {
					$.getJSON('https://slack.com/api/channels.create',
					{
						token: 'xoxp-2315976778-2315977822-10394561350-ca4652',
						name: channelID,
					}, function(json, textStatus) {
						console.log(json);
						console.log("channel ID is:  ");
						console.log(json.channel.id);
						compareThenSendtoSlack(json.channel.id);
					});
				}



				function compareThenSendtoSlack(channelString) {
					//get list of channel messages to compare with twilio records and send message to slack if theres newer ones in twilio
					$.getJSON('https://slack.com/api/channels.history',
					{
						token: 'xoxp-2315976778-2315977822-10394561350-ca4652',
						channel: channelString,
					}, function(jsonSlack, textStatus) {
						//console.log(jsonSlack);
						//only pull slack messages from this user (not from the hotel).  and only pull twilio messages sent to the phone number of this channel
						if ((jsonSlack.messages[0] !== undefined) && ((Math.floor((new Date(jsonTwilio.messages[0].date_created).valueOf())/1000)) > (jsonSlack.messages[0].ts).valueOf())) {
							console.log("twilioTimeStamp > slackTimeStamp");
							slackChat.addMsgtoSlack(jsonTwilio.messages[0].body, channelString);
						}
						else if (jsonSlack.messages[0] === undefined) {
							slackChat.addMsgtoSlack(jsonTwilio.messages[0].body, channelString);
						}
					});
				}


				//turning this off for now by commenting out
				//setInterval(slackChat.checkLatestSMS(), 7000);
			});


		},
		setSendClick: function() {//acts on click of Send Button in DOM
			$('div.container').on('click', 'form.msgform button.sendmsgbutton', function(event) {
				event.preventDefault();
				var msgContent = $('input.msginput').val();
				var phoneNumber = $('input.phoneinput').val();

				slackChat.setChannel(phoneNumber, msgContent);

				slackChat.addSentMsgtoDOM(msgContent);
			});
		},
		addSentMsgtoDOM: function(msgContent) {
			var html = "";
			html += "<div class='sentmsg msg pure-g'><div class=pure-u-1-8'></div><div class='pure-u-3-4'><div class='bubbleright'><div class='msgtext'>" + msgContent + "</div></div></div><div class='pure-u-1-8'></div></div>";
			$(html).appendTo('.chatarea');
		},
		addReceivedMsgtoDOM: function(msgContent) {
			var html = "";
			html += "<div class='receivedmsg msg pure-g'><div class=pure-u-1-8'></div><div class='pure-u-3-4'><div class='bubbleleft'><div class='msgtext'>" + msgContent + "</div></div></div><div class='pure-u-1-8'></div></div>";
			$(html).appendTo('.chatarea');
		},
	};

	slackChat.openSocket();
	slackChat.setSendClick();

	setInterval(slackChat.checkLatestSMS(), 2000);

}));
