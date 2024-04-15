const fs = require("fs");
const cron = require("node-cron");

function autoProfileShift(client, ChannelType, PermissionsBitField) {
  // autoProfileShiftInteraction(client, ChannelType, PermissionsBitField);

  cron.schedule("0 0,6,12,18 * * *", () => {
    const currentTime = new Date();
    const currentFormattedTime = currentTime.toLocaleTimeString("en-US", {
      hour12: false,
    });

    console.log(currentFormattedTime);
    autoProfileShiftInteraction(client, ChannelType, PermissionsBitField);
  });
}

function autoProfileShiftInteraction(client, ChannelType, PermissionsBitField) {
  client.guilds.cache.forEach(async (guild) => {
    let autoProfileShiftChannel = await guild.channels.cache.find(
      (channel) => channel.name === "auto-profile-shift",
    );

    if (!autoProfileShiftChannel) {
      await guild.channels
        .create({
          name: "auto-profile-shift",
          type: ChannelType.GuildText,
          permissionOverwrites: [
            {
              id: guild.roles.everyone.id,
              deny: [PermissionsBitField.Flags.ViewChannel],
            },
            {
              id: client.user.id,
              allow: [PermissionsBitField.Flags.ViewChannel],
            },
          ],
        })
        .then((newChannel) => (autoProfileShiftChannel = newChannel));
    }

    const fakeInteraction = {
      user: client.user,
      guild: guild,
      channel: autoProfileShiftChannel,
      createdTimestamp: Date.now(),
    };

    try {
      await client.commands
        .get("profile_shift")
        .execute(fakeInteraction, client);
    } catch (error) {
      console.error(error);
    }
  });
}

function chat(client, message, messageChannel, messageThreadId) {
  fs.readFile(`./${message.guild.id}_profile_shift.json`, async (err, data) => {
    try {
      const swapJson = JSON.parse(data.toString());
      const newUserData = Object.entries(swapJson).find(
        (u) => u[0] == message.author.id,
      );

      if (newUserData == undefined) return;

      client.users.fetch(newUserData[1]["id"]).then(async (data) => {
        message.delete();
        webhook = await messageChannel
          .fetchWebhooks()
          .then((webhook) =>
            webhook.find((wh) => wh.owner.id == client.user.id),
          );
        webhook.send({
          username: data.displayName,
          avatarURL: data.displayAvatarURL(),
          content: message.content,
          files: message.attachments.map((file) => file.attachment),
          threadId: messageThreadId,
        });
      });
    } catch (error) {
      console.error(error);
      return;
    }
  });
}

function chatCharacter(client, message, messageChannel, messageThreadId) {
  fs.readFile(
    `./${message.guild.id}_character_list.json`,
    async (err, data) => {
      try {
        const swapJson = JSON.parse(data.toString());
        const character = Object.entries(swapJson).find(
          (u) => u[0] == message.author.id,
        );

        if (character == undefined) return;

        message.delete();
        webhook = await messageChannel
          .fetchWebhooks()
          .then((webhook) =>
            webhook.find((wh) => wh.owner.id == client.user.id),
          );
        webhook.send({
          username: character[1].name,
          avatarURL: character[1].image,
          content: message.content,
          files: message.attachments.map((file) => file.attachment),
          threadId: messageThreadId,
        });
      } catch (error) {
        console.error(error);
        return;
      }
    },
  );
}

function createCharacter(client, message) {
  let charName, charUser, charImage, characterListJson;

  try {
    charName = message.content.includes("<@")
      ? message.content.split("<@")[0]
      : message.content;
    charUser = message.member.roles.cache.some((x) => x.name == "Assigner")
      ? Array.from(message.mentions.users)[0][0]
      : message.author.id;
    charImage = Array.from(message.attachments)[0][1]["url"];
  } catch (error) {
    return;
  }

  try {
    characterListJson = JSON.parse(
      fs.readFileSync(`./${message.guild.id}_character_list.json`),
    );
  } catch (error) {
    fs.writeFileSync(`./${message.guild.id}_character_list.json`, "{}");
    characterListJson = JSON.parse(
      fs.readFileSync(`./${message.guild.id}_character_list.json`),
    );
  }

  const newCharacterListJson = Object.assign({}, characterListJson, {
    [charUser]: {
      name: charName,
      image: charImage,
    },
  });
  fs.writeFileSync(
    `./${message.guild.id}_character_list.json`,
    JSON.stringify(newCharacterListJson, null, 2),
  );

  message.react("✅");
}

function deleteCharacter(client, message) {
  try {
    let characterListJson;

    try {
      characterListJson = JSON.parse(
        fs.readFileSync(`./${message.guild.id}_character_list.json`),
      );
    } catch (error) {
      fs.writeFileSync(`./${message.guild.id}_character_list.json`, "{}");
      characterListJson = JSON.parse(
        fs.readFileSync(`./${message.guild.id}_character_list.json`),
      );
    }

    const newCharacterListJson = Object.entries(characterListJson).filter(
      (x) => x[0] != message.author.id,
    );
    const objectNewCharacterListJson = Object.fromEntries(newCharacterListJson);

    fs.writeFileSync(
      `./${message.guild.id}_character_list.json`,
      JSON.stringify(objectNewCharacterListJson, null, 2),
    );
  } catch (error) {
    console.error(error);
    return;
  }
}

function characterGroupSwap(client, message) {
  (async () => {
    try {
      const repliedMessage = await message.channel.messages.fetch(message.reference.messageId);

      if (repliedMessage.reactions.cache.size > 0) {
        const reaction = repliedMessage.reactions.cache.find(reaction => reaction.emoji.name == '🔁');
        
        if (reaction) {
          const reactionUsers = await reaction.users.fetch();
          const reactionUserIds = reactionUsers.map(user => user.id);
          
          if (reactionUserIds.includes(message.author.id)) {
            // Get character_list.json
            let characterListJson;
            try {
              characterListJson = JSON.parse(
                fs.readFileSync(`./${message.guild.id}_character_list.json`),
              );
            } catch (error) {
              fs.writeFileSync(`./${message.guild.id}_character_list.json`, "{}");
              characterListJson = JSON.parse(
                fs.readFileSync(`./${message.guild.id}_character_list.json`),
              );
            }

            // Get characters and create a new one if user don't have one
            const characterList = Object.entries(characterListJson).filter(([charUserId]) => reactionUserIds.includes(charUserId));
            for (const userId of reactionUserIds) {
              if (!characterList.some(([charUserId]) => charUserId === userId)) {
                const user = await message.guild.members.fetch(userId);
                characterList.push([
                  userId, {
                    name: user.displayName,
                    image: user.displayAvatarURL(),
                  }
                ])
              }
            }

            // Shuffle the characters
            const shuffledCharacterList = derange(characterList);
            characterList.forEach((data, index) => {
              const shuffledCharacter = shuffledCharacterList[index];
              characterListJson[data[0]] = {
                name: shuffledCharacter[1].name,
                image: shuffledCharacter[1].image,
              };
            });

            // Write the updated JSON back to the file
            fs.writeFileSync(
              `./${message.guild.id}_character_list.json`,
              JSON.stringify(characterListJson, null, 2),
            );

            // Remove the reactions in replied message
            reactionUsers.forEach(async user => {
              await reaction.users.remove(user.id);
            });
          }
        }
      }
      
      // Delete "swap-characters" message
      message.delete();
    } catch (error) {
      return;
    }
  })();

  function derangementNumber(n) {
    if (n == 0) return 1;

    var factorial = 1;

    while (n) {
      factorial *= n--;
    }

    return Math.floor(factorial / Math.E);
  }

  function derange(array) {
    array = array.slice();
    var mark = array.map(function () {
      return false;
    });

    for (var i = array.length - 1, u = array.length - 1; u > 0; i--) {
      if (!mark[i]) {
        var unmarked = mark
          .map(function (_, i) {
            return i;
          })
          .filter(function (j) {
            return !mark[j] && j < i;
          });
        var j = unmarked[Math.floor(Math.random() * unmarked.length)];

        var tmp = array[j];
        array[j] = array[i];
        array[i] = tmp;

        // this introduces the unbiased random characteristic
        if (
          Math.random() <
          (u * derangementNumber(u - 1)) / derangementNumber(u + 1)
        ) {
          mark[j] = true;
          u--;
        }
        u--;
      }
    }

    return array;
  }
}

function setClock(client) {
  const guild = client.guilds.cache.get("1173090024120647690");
  const channel = guild.channels.cache.get("1202476154053861378");

  cron.schedule("*/5 * * * *", () => {
    const currentTime = new Date();
    const formattedTime = currentTime.toLocaleTimeString("en-US", {
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
    });

    try {
      channel.edit({
        name: `🕒 ${formattedTime}`,
      });
    } catch (error) {
      console.error(error);
    }
  });
}

module.exports = {
  autoProfileShift,
  autoProfileShiftInteraction,
  chat,
  chatCharacter,
  createCharacter,
  deleteCharacter,
  characterGroupSwap,
  setClock,
};
