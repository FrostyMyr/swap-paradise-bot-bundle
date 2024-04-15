const { ChannelType, PermissionsBitField } = require("discord.js");
const proxy = require("../proxy.js");

module.exports = (client) => {
  client.on("guildMemberRemove", (member) => {
    proxy.autoProfileShiftInteraction(client, ChannelType, PermissionsBitField);
  });
};
