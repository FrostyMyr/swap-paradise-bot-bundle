const { ChannelType, PermissionsBitField } = require("discord.js");
const proxy = require("../proxy.js");

module.exports = (client) => {
  client.on("guildMemberAdd", async (newMember) => {
    if (!newMember.user.avatar) {
      newMember
        .kick(
          "Default/No avatar, you can join again if you already have an avatar",
        )
        .then(() => {
          console.log(
            `Kicked user ${newMember.user.tag} due to default/no avatar.`,
          );
        });
    } else {
      proxy.autoProfileShiftInteraction(
        client,
        ChannelType,
        PermissionsBitField,
      );
    }
  });
};
