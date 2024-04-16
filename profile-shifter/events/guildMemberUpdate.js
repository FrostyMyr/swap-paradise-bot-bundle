const { ChannelType, PermissionsBitField } = require("discord.js");
const proxy = require("../proxy.js");

module.exports = (client) => {
  client.on("guildMemberUpdate", async (oldMember, newMember) => {
    const verifiedRole = newMember.guild.roles.cache.find(
      (role) => role.name.toLowerCase() === "verified",
    );

    if (!verifiedRole) {
      console.log("Role 'verified' not found.");
      return;
    }

    const hadVerifiedRole = oldMember.roles.cache.has(verifiedRole.id);
    const hasVerifiedRole = newMember.roles.cache.has(verifiedRole.id);

    if (!hadVerifiedRole && hasVerifiedRole) {
      if (!newMember.user.avatar) {
        await newMember.roles.remove(verifiedRole);
        console.log(`Removed 'verified' role from ${newMember.user.tag} due to no avatar.`);
      } else {
        proxy.autoProfileShiftInteraction(client, ChannelType, PermissionsBitField);
      }
    } else if (hadVerifiedRole && !hasVerifiedRole) {
      proxy.autoProfileShiftInteraction(client, ChannelType, PermissionsBitField);
    }
  });
};
