$($(document).ready( function() {
	var slackChat = {
		openSocket: function() { //this is used to detect messages created in Slack and then send them via Twilio SMS
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
						slackChat.connectionDeferred.reject();
					};
					connection.onmessage = function (e) { //message event slack->app
						var parsedData = JSON.parse(e.data);
						if ((parsedData.text !== undefined)&&(parsedData.subtype !== "bot_message")&&(parsedData.reply_to === undefined)&&(parsedData.subtype !== "channel_join")) {
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
		checkLatestSMS: function() { //look through twilio REST API sms history.  somehow see if there is a new one (maybe using length of returned array??)
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
			.always(function(jsonTwilio) {  //pull latest twilio sms timestamp.  pull latest slack message timestamp.  if twilio sms timestamp > slack message timestamp push twilio sms to slack as message
				console.log("twilio complete");

				for (var z=0; z < jsonTwilio.messages.length; z++ ) {
					var channelString = jsonTwilio.messages[z].from; //TODO-RYAN: go over how this loop works using breakpoints, not sure i understand what its actually doing.
					channelString = channelString.substr(1);
					//channelString = JSON.stringify(channelString);
					createChannel(channelString, compareThenSendtoSlack, z);
				}

				function createChannel(channelString, callback, msgNumber) {
					$.ajax({
						url: 'https://slack.com/api/channels.create',
						type: 'POST',
						dataType: 'json',
						data: {token: "xoxp-2315976778-2315977822-10394561350-ca4652", name: channelString}
					})
					.done(function(json) {
						console.log("createChannel success");
					})
					.fail(function() {
						console.log("createChannel fail");
					})
					.error(function() {
						console.log("error in createChannel");
					})
					.always(function() {
						console.log("createChannel complete");
						//use channelString to find the channelID of the correct slack channel
						$.getJSON('https://slack.com/api/channels.list',
							{token: 'xoxp-2315976778-2315977822-10394561350-ca4652'},
							function(json, textStatus) {
								for (var key in json.channels) {
									if (json.channels[key].name === channelString) {
										channelID = json.channels[key].id;
										console.log("yahtzee!!");
										callback(channelID, channelString, msgNumber);
										return;
									}
								}
						});

					});
				}

				function compareThenSendtoSlack(channelID, userName, msgNumber) { //get list of channel messages to compare with twilio records and send message to slack if theres newer ones in twilio
					$.getJSON('https://slack.com/api/channels.history',
					{
						token: 'xoxp-2315976778-2315977822-10394561350-ca4652',
						channel: channelID,
					}, function(jsonSlack, textStatus) { //only pull slack messages from this user (not from the hotel).  and only pull twilio messages sent to the phone number of this channel
						if ((jsonSlack.messages[msgNumber] !== undefined) && ((Math.floor((new Date(jsonTwilio.messages[msgNumber].date_created).valueOf())/1000)) > (jsonSlack.messages[msgNumber].ts).valueOf())) {
							console.log("twilioTimeStamp > slackTimeStamp");
							slackChat.addMsgtoSlack(jsonTwilio.messages[msgNumber].body, channelID, userName );
						}
						else if (jsonSlack.messages[msgNumber] === undefined) {
							slackChat.addMsgtoSlack(jsonTwilio.messages[msgNumber].body, channelID, userName);
						}
					});
				}
			});
		},
		addMsgtoSlack: function(msgContent, channelID, userName) {
			var msg = {
				type: "message",
				channel: channelID,
				text: msgContent,
				ts: new Date().valueOf()
			};
			function sendtoSlack() {
				slackChat.connection.send(JSON.stringify(msg));
			}
			if (slackChat.connectionDeferred.state()==="resolved") sendtoSlack();
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
		}
	};

	slackChat.openSocket();

	setInterval(slackChat.checkLatestSMS, 2000);
}));
