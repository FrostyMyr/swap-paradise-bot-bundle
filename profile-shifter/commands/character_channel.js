const { SlashCommandBuilder } = require("@discordjs/builders");
const fs = require("fs");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("character_channel")
    .setDescription("Setting a character channel.")
    .addStringOption((option) =>
      option
        .setName("type")
        .setDescription("Setting Type.")
        .setRequired(true)
        .addChoices(
          { name: "Set", value: "set" },
          { name: "Unset", value: "unset" },
        ),
    ),
  async execute(interaction, client) {
    const settingType = interaction.options.getString("type");
    const thisChannel = interaction.channel.id;

    if (!interaction.member.roles.cache.some((x) => x.name == "Assigner")) {
      interaction.reply({
        content: `You don't have the role for that`,
        ephemeral: true,
      });
      return;
    }

    let characterChannelJson;
    try {
      characterChannelJson = JSON.parse(
        fs.readFileSync(`./${interaction.guild.id}_character_channel.json`),
      );
    } catch (error) {
      fs.writeFileSync(
        `./${interaction.guild.id}_character_channel.json`,
        "[]",
      );
      characterChannelJson = JSON.parse(
        fs.readFileSync(`./${interaction.guild.id}_character_channel.json`),
      );
    }

    if (settingType == "set" && !characterChannelJson.includes(thisChannel)) {
      const newCharacterChannelJson = [...characterChannelJson, thisChannel];
      fs.writeFileSync(
        `./${interaction.guild.id}_character_channel.json`,
        JSON.stringify(newCharacterChannelJson, null, 2),
      );

      interaction.reply({
        content: `This channel has become character channel`,
        ephemeral: false,
      });

      return;
    } else if (settingType == "unset") {
      const newCharacterChannelJson = characterChannelJson.filter(
        (x) => x != thisChannel,
      );
      fs.writeFileSync(
        `./${interaction.guild.id}_character_channel.json`,
        JSON.stringify(newCharacterChannelJson, null, 2),
      );

      interaction.reply({
        content: `This channel is not character channel anymore`,
        ephemeral: false,
      });
    } else {
      interaction.reply({
        content: `This channel is already character channel`,
        ephemeral: true,
      });
    }
  },
};
