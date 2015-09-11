$($(document).ready( function() {

	var slackChat = {
		currChannel: null,
		lastMessageTimeStamp: [],
		openSocket: function() {
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
		setSendClick: function() {
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
				username: "Guest103"
			},
			function(json, textStatus) {
					/*optional stuff to do after success */
					console.log('chat should be posted to channel????  ' + channelName);
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
				//pull latest twilio sms timestampt.  pull latest slack message timestamp.  if twilio sms timestamp > slack message timestamp push twilio sms to slack as message

				console.log(jsonTwilio.messages[0].date_created);
				console.log()

				//get latest slack message timestamp






				if (slackChat.lastMessageTimeStamp === null) {
					console.log("time stamp is null hasn't been set yet");
					slackChat.lastMessageTimeStamp = [jsonTwilio.messages[0].date_created, jsonTwilio.messages[0].sid];
				}
				else {
					for (var key in jsonTwilio.messages) {
						if (jsonTwilio.messages[key].date_created > slackChat.lastMessageTimeStamp[0]) {
							console.log("twilio message is later than last posted message to slack");
						}

					}
				}

				//console.log("twilio success.  below is jsonTwilio.messages");
				//console.log("channel name: " + json.messages[(json.messages.length-1)].body);
				//console.log(jsonTwilio.messages);
				//slackChat.twilioMessages = jsonTwilio.messages;
				// console.log(slackChat.twilioMessages);
				// difference = $.grep(jsonTwilio.messages, function(x) {
				// 	return $.inArray(x, slackChat.twilioMessages) < 0;
				// });
				// console.log("difference is : " + difference);
				// console.log(json.messages.length-1);
				var msg = jsonTwilio.messages[0].body;
				var channel = jsonTwilio.messages[0].from;
				//console.log(channel);
				//console.log(msg);
				channel = channel.substr(1);
				channel = JSON.stringify(channel);
				//console.log(channel);

				//get list of channel messages
				$.getJSON('https://slack.com/api/channels.history',
				{
					token: 'xoxp-2315976778-2315977822-10394561350-ca4652',
					channel: 'C0ACHM8B1',
				}, function(jsonSlack, textStatus) {
					console.log(jsonSlack);
						//lets remove objects that aren't type.message and are user: "U0299URQ6" (ie they're sent from slack user not sms user)
						//store jsonTwilio.messages as property: value in slackChat.  then use it to compare to new jsonTwilio.messages call
						for (var key in jsonSlack.messages) {
							//console.log("key: " + key);
							//console.log("json.messages[key]: ");
							//console.log(json.messages[key]);
							if (jsonSlack.messages[key].user === "U0299URQ6")  {
								//console.log('run, its a slack user message!! delete it!');
								delete jsonSlack.messages[key];
							}
							//console.log("json.messages.hasOwnProperty(key): " + json.messages.hasOwnProperty(key));
						}

						//console.log(jsonTwilio.messages);
						//console.log(jsonSlack.messages);
				});


				//get channelID
				$.getJSON('https://slack.com/api/channels.info',
				{
					token: 'xoxp-2315976778-2315977822-10394561350-ca4652',
					channel: 'C0ACHM8B1',
				}, function(json, textStatus) {
						/*optional stuff to do after success */
						//console.log(json);
				});
				//TODO how do i code to get just the latest messages from twilio messages list???
				//1) could pull message history from slack & twilio and compare and only post the new ones
				//2) latest datetime of twilio message posted to slack.  poll twilio and check for newer ones.

				//slackChat.setChannel(channel, msg);
				//slackChat.addMsgtoSlack(msg, "C0ACHM8B1");
			})
			.fail(function() {
				console.log("twilio error");
			})
			.always(function(json) {
				console.log("twilio complete");
			});


		}
	};

	slackChat.openSocket();
	slackChat.setSendClick();

	setInterval(slackChat.checkLatestSMS(), 2000);
	//slackChat.checkLatestSMS();

}));
