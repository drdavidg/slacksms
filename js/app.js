$($(document).ready( function() {

	var slackChat = {
		openSocket: function() {//this is used to detect messages created in Slack and then send them via Twilio SMS
			slackChat.connectionDeferred = new $.Deferred();
			$.getJSON('https://slack.com/api/rtm.start',
			 {token: 'xoxp-2315976778-2315977822-10394561350-ca4652'
				},
				function(json, textStatus) {
					var connection = slackChat.connection = new WebSocket(json.url);
					connection.onopen = function () {
						slackChat.connectionDeferred.resolve();
					};
					connection.onerror = function (error) {
				  //	console.log('Error Logged: ' + error); //log errors
						slackChat.connectionDeferred.reject();
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
		addMsgtoSlack: function(msgContent, channelName) {
			var msg = {//TODO sending messages to Slack now works using websockets.  add sending using websockets in this function
				type: "message",
				channel: channelName,
				text: msgContent,
				user: "GuestBot",
				ts: "1355517523.000005"
			};
			console.log('msg should be added to slack using websocket');

			function sendtoSlack() {
				slackChat.connection.send(JSON.stringify(msg));
			}
			if (slackChat.connectionDeferred.status()==="resolved") sendtoSlack();
			else slackChat.connectionDeferred.done(sendtoSlack);
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

				//createChannel(channelString);
				createChannel(channelString, compareThenSendtoSlack);

				function createChannel(channelID, callback) {
					$.ajax({
						url: 'https://slack.com/api/channels.create',
						type: 'GET',
						dataType: 'json',
						data: {token: "xoxp-2315976778-2315977822-10394561350-ca4652", name: channelID}
					})
					.done(function(json) {
						console.log("createChannel success");
						console.log(json.ok);
						if (!json.ok) {

						}
					})
					.fail(function() {
						console.log("createChannel fail");
					})
					.error(function() {
						console.log("error in createChannel");
					})
					.always(function() {
						console.log("createChannel complete");
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

			});


		}
	};

	slackChat.openSocket();

	setInterval(slackChat.checkLatestSMS, 2000);
}));
