const fs = require("fs");
const proxy = require("../proxy.js");

module.exports = (client) => {
  client.on("messageCreate", async (message) => {
    if (message.author.bot || message.webhookId || message.content == "") return;

    // Character Group Swap
    if (message.content.startsWith("swap-characters")) {
      proxy.characterGroupSwap(client, message);
      return;
    }
      
    // Create character
    if (message.content.startsWith("+character")) {
      message.content = message.content.split("+character ")[1];
      proxy.createCharacter(client, message);
      return;
    }

    // Delete character
    if (message.content.toLowerCase().startsWith("-character")) {
      proxy.deleteCharacter(client, message);
      return;
    }

    let messageChannel = message.channel;
    let messageThreadId = null;
    if (message.channel.type == 11 || message.channel.type == 12) {
      messageChannel = await client.channels.fetch(message.channel.parentId);
      messageThreadId = message.channel.id;
    }

    let webhook = await messageChannel
      .fetchWebhooks()
      .then((webhook) => webhook.find((wh) => wh.owner.id == client.user.id));
    if (!webhook) messageChannel.createWebhook({ name: "Profile Shifter" });

    let characterChannelJson;
    try {
      characterChannelJson = JSON.parse(
        fs.readFileSync(`./${message.guild.id}_character_channel.json`),
      );
    } catch (error) {
      fs.writeFileSync(`./${message.guild.id}_character_channel.json`, "[]");
      characterChannelJson = JSON.parse(
        fs.readFileSync(`./${message.guild.id}_character_channel.json`),
      );
    }

    if (
      characterChannelJson.includes(message.channel.id) ||
      message.channel.type == 11 ||
      message.channel.type == 12
    ) {
      proxy.chatCharacter(client, message, messageChannel, messageThreadId);
    } else {
      proxy.chat(client, message, messageChannel, messageThreadId);
    }
  });
};
