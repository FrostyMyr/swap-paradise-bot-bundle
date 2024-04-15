module.exports = (client) => {
  client.on("messageReactionAdd", async (reaction, user) => {
    if (reaction.emoji.name != "🗑️" && reaction.emoji.name != "🔍") return;

    const messageId = reaction.message.id;
    const channelId = reaction.message.channelId;
    const message = await client.channels.cache
      .get(channelId)
      .messages.fetch(messageId);

    if (message.applicationId == client.user.id) {
      if (reaction.emoji.name == "🗑️") {
        await message.delete();
      } else if (reaction.emoji.name == "🔍") {
        reaction.users.remove(user.id);
        const avatarUrl = `https://cdn.discordapp.com/avatars/${message.author.id}/${message.author.avatar}.png`;
        user.send({
          content: `${message.author.username}`,
          files: [
            {
              name: `${message.author.username}_avatar.png`,
              attachment: avatarUrl,
            },
          ],
        });
      }
    }
  });
};
