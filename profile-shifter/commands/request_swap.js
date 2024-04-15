const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const { SlashCommandBuilder } = require("@discordjs/builders");
const fs = require("fs");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("request_swap")
    .setDescription("Request swap with someone.")
    .addUserOption((option) =>
      option
        .setName("member")
        .setDescription("Body you wanna swap with.")
        .setRequired(true),
    ),
  async execute(interaction, client) {
    let target, user;
    const guildId = interaction.guild.id;

    // Check interaction type
    if (interaction.isButton()) {
      const swapper = interaction.customId.split(`-${guildId}-`)[1].split("-");
      userOwner = swapper[0];
      targetOwner = swapper[1];
      this.startSwap(client, interaction, targetOwner, userOwner);
      return;
    } else {
      target = interaction.options.getUser("member");
      user = interaction.user;
    }

    // Get user and target data
    const profileShiftJson = JSON.parse(
      fs.readFileSync(`./${guildId}_profile_shift.json`),
    );
    const userData = Object.entries(profileShiftJson).find(
      (u) => u[0] == user.id,
    );
    const targetData = Object.entries(profileShiftJson).find(
      (t) => t[1]["id"] == target.id,
    );
    const userBody = await client.users.fetch(userData[1]["id"]);
    const targetBody = await client.users.fetch(targetData[1]["id"]);

    // Check if user swap with themself
    if (userData[0] == targetData[0]) {
      interaction.reply({
        content: `Can't swap with yourself 🫤`,
        ephemeral: true,
      });
      return;
    }

    // Create temp swap json
    const newSwapJson = {
      [userData[0]]: {
        id: userData[1]["id"],
      },
      [targetData[0]]: {
        id: targetData[1]["id"],
      },
    };
    await fs.writeFileSync(
      `./temp-swap-${guildId}-${userData[0]}.json`,
      JSON.stringify(newSwapJson, null, 2),
    );

    // Create confirm button field
    const confirmButton = new ActionRowBuilder();
    confirmButton.addComponents(
      new ButtonBuilder()
        .setCustomId(
          `${interaction.commandName}[-]y-${guildId}-${userData[0]}-${targetData[0]}`,
        )
        .setLabel("Yes")
        .setStyle(ButtonStyle.Primary),
    );
    confirmButton.addComponents(
      new ButtonBuilder()
        .setCustomId(
          `${interaction.commandName}[-]n-${guildId}-${userData[0]}-${targetData[0]}`,
        )
        .setLabel("No")
        .setStyle(ButtonStyle.Danger),
    );

    // Tag user and target owner then delete afterward
    await interaction.channel
      .send(`<@${userData[0]}><@${targetData[0]}>`)
      .then((sentMessage) => sentMessage.delete());

    // Send reply to command
    await interaction
      .reply({
        components: [confirmButton],
        content: `**${userBody.displayName}** want to swap with **${targetBody.displayName}**`,
      })
      .then((msg) => {
        // Delete after 1 minute
        setTimeout(() => {
          msg
            .delete()
            .then(() =>
              fs.unlinkSync(`./temp-swap-${guildId}-${userData[0]}.json`),
            )
            .catch(() => {
              return;
            });
        }, 60000);
      });
  },
  async startSwap(client, interaction, targetOwnerId, userOwnerId) {
    if (!interaction.customId.endsWith(interaction.user.id)) {
      interaction.reply({
        content: "This button isn't for you.",
        ephemeral: true,
      });
      return;
    }

    interaction.message.delete();
    const guildId = interaction.guild.id;
    const guildName = interaction.guild.name;

    const profileShiftJson = JSON.parse(
      fs.readFileSync(`./${guildId}_profile_shift.json`),
    );
    const userData = Object.entries(profileShiftJson).find(
      (u) => u[0] == userOwnerId,
    );
    const targetData = Object.entries(profileShiftJson).find(
      (t) => t[0] == targetOwnerId,
    );
    const targetBodyAcc = await client.users.fetch(targetData[1]["id"]);

    if (interaction.customId.split("[-]")[1].startsWith("n-")) {
      client.users.fetch(userOwnerId).then(async (user) => {
        user.send({
          content: `**${targetBodyAcc.displayName}** from **${guildName}** don't want to swap with you`,
        });
      });
      fs.unlinkSync(`./temp-swap-${guildId}-${userOwnerId}.json`);
      return;
    }

    newSwapJson = Object.assign({}, profileShiftJson, {
      [userData[0]]: {
        id: targetData[1]["id"],
      },
      [targetData[0]]: {
        id: userData[1]["id"],
      },
    });

    Object.values([userOwnerId, targetOwnerId]).forEach((ownerId) => {
      client.users.fetch(ownerId).then((owner) => {
        owner.send({
          content: `You are now **${targetBodyAcc.displayName}** in **${guildName}** (at least until the shuffle)`,
        });
      });
    });

    await fs.writeFileSync(
      `./${interaction.guild.id}_profile_shift.json`,
      JSON.stringify(newSwapJson, null, 2),
    );
    await fs.unlinkSync(`./temp-swap-${guildId}-${userOwner}.json`);
  },
};
