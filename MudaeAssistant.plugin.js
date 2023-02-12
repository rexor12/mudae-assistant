 /**
 * @name Mudae Assistant
 * @author rexor12
 * @description Adds notifications to Mudae's messages.
 * @version 1.0.0
 */
 
// ---------------- CONFIGURATIONS START ----------------

/**
 * The identifier of the guild to watch.
 */
const relevantGuildId = "676889696302792774";

/**
 * The identifier of the channel in the configured guild to watch.
 */
const relevantChannelId = "782691890838765599";

/**
 * Whether embed images should be removed in the specified channel to decrease the number of re-renders.
 */
const removeEmbedImages = true;

/**
 * The path to the audio file that is played as a notification sound.
 */
const assetDirectoryPath = "C:\\MudaeAssistant"

/**
 * The list of characters (as their names are displayed by $im) you want to claim.
 */
const claimTargets = [
	"Holo",
	"Myuri",
	"Kraft Lawrence"
];

/**
 * The list of kakera types you want to claim.
 */ 
const kakeraTargets = [
	// purple (free)
	"609264156347990016",
	// light
	"815961697918779422",
	// rainbow
	"608192076286263297",
	// red
	"605112980295647242",
	// orange
	"605112954391887888",
	// yellow
	"605112931168026629",
	// green
	// "609264166381027329",
	// teal
	// "609264180851376132",
	// blue
	// "469791929106956298",
];

/**
 * The list of characters (as their names are displayed by $im) you want to claim regardless of the type of kakera.
 * You will be notified even if the type of kakera this roll gives isn't specified above.
 */
const kakeraSoulmateTargets = [
	"Holo",
	"Shuten Douji"
];

// ----------------  CONFIGURATIONS END  ----------------

/**
 * @typedef {Object} MessageInfo
 * @property {string} messageId The identifier of the message.
 * @property {boolean} isRelevantMessage Whether the message is relevant.
 * @property {boolean} isRoll Whether the message is a character roll.
 * @property {boolean} isPersonalWish Whether the message is a rolled wish of the current user.
 * @property {boolean} isFreeClaim Whether the message is an event character (eg. Christmas, Halloween).
 * @property {boolean} isKakeraRoll Whether the message is a kakera roll (already claimed character with a reaction).
 * @property {string | null} characterName If the message is a personal wish, the name of the character; otherwise, null.
 */

/**
 * @typedef {Object} MessageAuthor
 * @property {string} id The identifier of the user.
 */

/**
 * @typedef {Object} MessageEmbedAuthor
 * @property {string | null} name The name of the author.
 */

/**
 * @typedef {Object} MessageEmbed
 * @property {MessageEmbedAuthor | null} author Information about the author of the embed.
 * @property {string | null} description If any, the description of the embed.
 * @property {any | null} image If any ,the embed's image descriptor.
 */

/**
 * @typedef {Object} MessageComponentEmoji
 * @property {string} id The identifier of the emoji.
 * @property {string | null} name The name of the emoji.
 */

/**
 * @typedef {Object} MessageComponent
 * @property {string | null} custom_id Data that describes the component.
 * @property {MessageComponentEmoji | null} emoji If any, the emoji displayed in the component.
 * @property {MessageComponent[] | null} components If any, the children of the component.
*/

/**
 * @typedef {Object} Message
 * @property {string} id The identifier of the message.
 * @property {string | null} guild_id The identifier of the guild the message was sent in.
 * @property {string | null} channel_id The identifier of the channel the message was sent in.
 * @property {MessageAuthor | null} author The author of the message.
 * @property {MessageEmbed[] | null} embeds If any, the embeds in the message.
 * @property {MessageComponent[] | null} components If any, the components of the message.
 */

const { Webpack, Webpack: { Filters }, Data } = BdApi;

const mudaeUserId = "432610292342587392";

function getAssetPath(assetName) {
	return assetDirectoryPath.endsWith("\\") ? `${assetDirectoryPath}${assetName}` : `${assetDirectoryPath}\\${assetName}`;
}

function getPluginDownloaderClass() {
	return class {
		constructor (meta) {for (const key in meta) this[key] = meta[key];}
		getName () {return this.name;}
		getName () {return this.name;}
		getAuthor () {return this.author;}
		getVersion () {return this.version;}
		getDescription () {return `The Library Plugin needed for ${this.name} is missing. Open the Plugin Settings to download it. \n\n${this.description}`;}
		
		downloadLibrary () {
			require("request").get("https://mwittrien.github.io/BetterDiscordAddons/Library/0BDFDB.plugin.js", (e, r, b) => {
				if (!e && b && r.statusCode == 200) require("fs").writeFile(require("path").join(BdApi.Plugins.folder, "0BDFDB.plugin.js"), b, _ => BdApi.showToast("Finished downloading BDFDB Library", {type: "success"}));
				else BdApi.alert("Error", "Could not download BDFDB Library Plugin. Try again later or download it manually from GitHub: https://mwittrien.github.io/downloader/?library");
			});
		}
		
		load () {
			if (!window.BDFDB_Global || !Array.isArray(window.BDFDB_Global.pluginQueue)) window.BDFDB_Global = Object.assign({}, window.BDFDB_Global, {pluginQueue: []});
			if (!window.BDFDB_Global.downloadModal) {
				window.BDFDB_Global.downloadModal = true;
				BdApi.showConfirmationModal("Library Missing", `The Library Plugin needed for ${this.name} is missing. Please click "Download Now" to install it.`, {
					confirmText: "Download Now",
					cancelText: "Cancel",
					onCancel: _ => {delete window.BDFDB_Global.downloadModal;},
					onConfirm: _ => {
						delete window.BDFDB_Global.downloadModal;
						this.downloadLibrary();
					}
				});
			}
			if (!window.BDFDB_Global.pluginQueue.includes(this.name)) window.BDFDB_Global.pluginQueue.push(this.name);
		}

		start () {this.load();}

		stop () {}

		getSettingsPanel () {
			const template = document.createElement("template");
			template.innerHTML = `<div style="color: var(--header-primary); font-size: 16px; font-weight: 300; white-space: pre; line-height: 22px;">The Library Plugin needed for ${this.name} is missing.\nPlease click <a style="font-weight: 500;">Download Now</a> to install it.</div>`;
			template.content.firstElementChild.querySelector("a").addEventListener("click", this.downloadLibrary);
			return template.content.firstElementChild;
		}
	};
}

function getPluginClass([Plugin, BDFDB]) {		
	const controller = class Controller {
		claimToggleButton = null;
		kakeraToggleButton = null;
	};
	
	const _controller = new controller();

	const configComponent = class ConfigComponent extends BdApi.React.Component {
		componentDidMount() {
			this.props.setControl(this);
		}
		
		componentDidUpdate() {
			// Dummy to force BDFDB to re-render the component on prop change.
			this.props.setControl(this);
		}

		render() {
			return BDFDB.ReactUtils.createElement(
				"div",
				{
					className: "expression-picker-chat-input-button buttonContainer-2lnNiN",
					tooltipText: "Mudae Assistant",
					children: BDFDB.ReactUtils.createElement(
						"button",
						{
							className: "button-f2h6uQ lookBlank-21BCro colorBrand-I6CyqQ grow-2sR_-F",
							children: BDFDB.ReactUtils.createElement(
								"div",
								{
									className: "contents-3ca1mk button-2fCJ0o button-3BaQ4X",
									children: BDFDB.ReactUtils.createElement(
										"div",
										{
											className: "buttonWrapper-3YFQGJ",
											children: BDFDB.ReactUtils.createElement(
												BDFDB.LibraryComponents.SvgIcon,
												{
													nativeClass: true,
													width: 24,
													height: 24,
													iconSVG: this.props.isFeatureEnabled ? this.props.icon : this.props.iconDisabled
												}
											)
										}
									)
								}
							),
							onClick: _ => this.props.onButtonClicked()
						}
					)
				}
			);
		}
	};

	return class MudaeAssistant extends Plugin {
		_isClaimDisabled = true;
		_isKakeraDisabled = true;
		_notificationAudio = null;
		_svgs = {};

		onLoad() {
			BDFDB.LibraryRequires.fs.readFile(
				getAssetPath("mudae-assistant-notification.wav"),
				"",
				(error, buffer) => {
					if (error) {
						this.showToast("Failed to load notification audio file.");
						return;
					}
					this._notificationAudio = `data:audio/mpeg;base64,${Buffer.from(buffer).toString("base64")}`;
				});
			
			const svgs = {
				"claim": getAssetPath("claim.svg"),
				"claim-disabled": getAssetPath("claim-disabled.svg"),
				"kakera": getAssetPath("kakera.svg"),
				"kakera-disabled": getAssetPath("kakera-disabled.svg")
			};
			for (const [svg_name, svg_path] of Object.entries(svgs)) {
				this._svgs[svg_name] = BDFDB.LibraryRequires.fs.readFileSync(svg_path);
			}

			// Find the module names in BDFDB.js@InternalData.PatchModules
			this.modulePatches = {
				after: [
					"ChannelTextAreaButtons"
				]
			};
		}

		onStart() {
			const self = this;
			BDFDB.PatchUtils.patch(this, BDFDB.LibraryModules.DispatchApiUtils, "dispatch", {before: e => self.onBeforeDispatch(e)});
			BDFDB.PatchUtils.forceAllUpdates(this);

			this.showToast("Mudae Assistant ready!");
			this.playNotificationAudio();
		}

		onStop() {
			BDFDB.PatchUtils.unpatch(this, BDFDB.LibraryModules.DispatchApiUtils, "dispatch");
			BDFDB.PatchUtils.forceAllUpdates(this);
		}

		/**
		 * Gets basic information about the specified message.
		 * @param {Message} message 
		 * @returns {MessageInfo} Information about the specified message.
		 */
		getMessageInfo(message) {
			const isRelevantMessage = this.isRelevantMessage(message);
			let isRoll = false;
			let isPersonalWish = false;
			let isFreeClaim = false;
			let characterName = null;
			if (isRelevantMessage) {
				const wishInfo = this.getWishInfo(message);
				isRoll = wishInfo.isRoll;
				isPersonalWish = wishInfo.isPersonalWish;
				isFreeClaim = wishInfo.isFreeClaim;
				characterName = wishInfo.characterName;
			}

			return {
				messageId: message.id,
				isRelevantMessage: isRelevantMessage,
				isRoll: isRoll,
				isPersonalWish: isPersonalWish,
				isFreeClaim: isFreeClaim,
				characterName: characterName,
				isKakeraRoll: isRelevantMessage ? this.isKakeraRoll(message) : false
			};
		}

		/**
		 * 
		 * @param {Message} message 
		 * @returns {boolean}
		 */
		isRelevantMessage(message) {
			return message.guild_id === relevantGuildId
					&& message.channel_id === relevantChannelId
					&& message.author?.id === mudaeUserId;
		}

		/**
		 * Gets information about a possible wish.
		 * @param {Message} message 
		 * @returns {{ isRoll: boolean, isPersonalWish: boolean, isFreeClaim: boolean, characterName: boolean | null }}
		 */
		getWishInfo(message) {
			if (!message.embeds || !message.embeds[0]) {
				return {
					isRoll: false,
					isPersonalWish: false,
					isFreeClaim: false,
					characterName: null
				};
			}

			const embed = message.embeds[0];
			// Rolls have the character's name as the embed title
			// and a single action row with a single button (claim).
			if (!embed.author?.name || message.components?.length !== 1 || message.components[0].components?.length !== 1) {
				return {
					isRoll: false,
					isPersonalWish: false,
					isFreeClaim: false,
					characterName: null
				};
			}

			// Rolls either have no footer or the footer contains (at least part of) the character's name.
			const isClaimFooter = !embed.footer?.text || embed.footer.text.indexOf(embed.author.name.substring(0, 6)) !== -1 || embed.footer.text.indexOf("ROLLS LEFT") !== -1;
			const isPersonalWish = isClaimFooter && claimTargets.indexOf(embed.author.name) !== -1;
			const isFreeClaim = isClaimFooter && embed.description && embed.description.replace("\r", "").replace("\n", "").indexOf("Reacton me, it's free!") !== -1;

			return {
				isRoll: true,
				isPersonalWish: isPersonalWish,
				isFreeClaim: isFreeClaim,
				characterName: embed.author?.name
			};
		}

		/**
		 * Determines if the message is a kakera roll.
		 * @param {Message} message 
		 * @returns {boolean}
		 */
		isKakeraRoll(message) {
			if (!message.embeds || !message.embeds[0]) {
				return false;
			}

			const embed = message.embeds[0];
			const isKakeraRoll = embed.author?.name // Rolls have the character's name as the embed title
					&& embed.footer?.text
					&& embed.footer.text.indexOf("Belongs to") !== -1 // Kakera rolls have the owner's name in the footer
					&& message.components?.length === 1 // Rolls have a single action row
					&& message.components[0].components?.length === 1 // Rolls have a single button (claim)
					&& message.components[0].components[0]?.emoji?.id;
			if (!isKakeraRoll) {
				return false;
			}
			
			return kakeraTargets.indexOf(message.components[0].components[0].emoji.id) !== -1
				   || kakeraSoulmateTargets.indexOf(embed.author.name) !== -1;
		}

		/**
		 * Shows a toast notification.
		 * @param {string} message The message to be displayed.
		 * @param {number} timeout The time, in milliseconds, after which the toast disappears.
		 */
		showToast(message, timeout = null) {
			BDFDB.NotificationUtils.toast(
				BDFDB.ReactUtils.createElement(
					"div",
					{
						children: [
							BDFDB.ReactUtils.createElement(
								BDFDB.LibraryComponents.Flex,
								{
									align: BDFDB.LibraryComponents.Flex.Align.CENTER,
									children: [
										BDFDB.ReactUtils.elementToReact(BDFDB.DOMUtils.create(message))
									]
								}
							)
						]
					}
				),
				{
					timeout: timeout ?? 3000,
					barColor: "#00ff00",
				}
			);
		}

		/**
		 * Shows a toast notifying the user about a claim.
		 * @param {MessageInfo} messageInfo Basic information about the message.
		 */
		showClaimToast(messageInfo) {
			let message;
			if (messageInfo.isKakeraRoll) {
				message = BDFDB.StringUtils.htmlEscape("Kakera appeared to claim!");
			} else {
				message = BDFDB.StringUtils
					.htmlEscape("$name appeared to claim!")
					.replace(/'{0,1}\$name'{0,1}/g, `<strong>${BDFDB.StringUtils.htmlEscape(messageInfo.characterName)}</strong>`);
			}

			this.playNotificationAudio();
			this.showToast(message, 60 * 1000);
		}

		isMessageCreateEvent(event) {
			return BDFDB.ObjectUtils.is(event.methodArguments[0])
					&& event.methodArguments[0].type == "MESSAGE_CREATE"
					&& event.methodArguments[0].message;
		}
		
		playNotificationAudio() {
			if (!this._notificationAudio) {
				return;
			}

			const audio = new Audio();
			audio.src = this._notificationAudio;
			audio.play();
		}

		onBeforeDispatch(event) {
			if (!this.isMessageCreateEvent(event)) {
				return;
			}

			/**
			 * @type {Message}
			 */
			const message = event.methodArguments[0].message;

			// Remove embed images to speed up the process during rolls.
			if (removeEmbedImages && message.channel_id === relevantChannelId && message.embeds && message.embeds[0]) {
				message.embeds[0].image = undefined;
			}

			const messageInfo = this.getMessageInfo(message);
			if (!messageInfo.isPersonalWish && !messageInfo.isFreeClaim && !messageInfo.isKakeraRoll) {
				// Not a reaction target.
				return;
			}

			console.log("Encountered a Mudae reaction target: " + JSON.stringify(messageInfo));
			if (messageInfo.isKakeraRoll && this._isKakeraDisabled) {
				console.log("Ignored a Mudae kakera (disabled): " + JSON.stringify(messageInfo));
				return;
			} else if (messageInfo.isPersonalWish && this._isClaimDisabled) {
				console.log("Ignored a Mudae personal wish (disabled): " + JSON.stringify(messageInfo));
				return;
			}

			this.showClaimToast(messageInfo);
		}

		toggleClaim() {
			this.setClaimReactions(!this._isClaimDisabled);
		}

		toggleKakera() {
			this.setKakeraReactions(!this._isKakeraDisabled);
		}
		
		setClaimReactions(isDisabled) {
			this._isClaimDisabled = isDisabled;
			if (_controller.claimToggleButton) {
				_controller.claimToggleButton.props.isFeatureEnabled = !isDisabled;
				BDFDB.ReactUtils.forceUpdate(_controller.claimToggleButton);
			}

			this.showToast(`${this._isClaimDisabled ? "Disabled" : "Enabled"} wish claim notifications.`);
		}

		setKakeraReactions(isDisabled) {
			this._isKakeraDisabled = isDisabled;
			if (_controller.kakeraToggleButton) {
				_controller.kakeraToggleButton.props.isFeatureEnabled = !isDisabled;
				BDFDB.ReactUtils.forceUpdate(_controller.kakeraToggleButton);
			}

			this.showToast(`${this._isKakeraDisabled ? "Disabled" : "Enabled"} kakera claim notifications.`);
		}
			
		processChannelTextAreaButtons(e) {
			e.returnvalue.props.children.unshift(BDFDB.ReactUtils.createElement(
				configComponent,
				{
					onButtonClicked: this.toggleKakera.bind(this),
					isFeatureEnabled: !this._isKakeraDisabled,
					setControl: b => _controller.kakeraToggleButton = b,
					icon: this._svgs["kakera"],
					iconDisabled: this._svgs["kakera-disabled"]
				}));

			e.returnvalue.props.children.unshift(BDFDB.ReactUtils.createElement(
				configComponent,
				{
					onButtonClicked: this.toggleClaim.bind(this),
					isFeatureEnabled: !this._isClaimDisabled,
					setControl: b => _controller.claimToggleButton = b,
					icon: this._svgs["claim"],
					iconDisabled: this._svgs["claim-disabled"]
				}));
		}
	};
}

module.exports = (_ => {
	const changeLog = {
		"improved": {
			"Initial version": "Initial release of the plugin"
		}
	};

	return !window.BDFDB_Global || (!window.BDFDB_Global.loaded && !window.BDFDB_Global.started)
		? getPluginDownloaderClass()
		: getPluginClass(window.BDFDB_Global.PluginUtils.buildPlugin(changeLog));
})();