const { SlashCommandBuilder } = require("@discordjs/builders");
const fs = require("fs");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("reset_shift")
    .setDescription("Reset profile shift"),
  async execute(interaction, client) {
    const user = interaction.user;

    // Check if the user has the required role
    if (
      !user.bot &&
      !interaction.member.roles.cache.some((x) => x.name == "Assigner")
    ) {
      interaction.reply({
        content: `You don't have the role for that`,
        ephemeral: true,
      });
      return;
    }

    const members = await client.guilds.cache
      .get(interaction.guild.id)
      .members.fetch()
      .then((member) => {
        return Array.from(member)
          .filter((x) => !x[1].user.bot)
          .map((x) => x[0]);
      });

    fs.writeFileSync(`./${interaction.guild.id}_profile_shift.json`, "{}");
    const profileShiftJson = JSON.parse(
      fs.readFileSync(`./${interaction.guild.id}_profile_shift.json`),
    );

    members.forEach((memberId) => {
      profileShiftJson[memberId] = {
        id: memberId,
      };
    });

    fs.writeFileSync(
      `./${interaction.guild.id}_profile_shift.json`,
      JSON.stringify(profileShiftJson, null, 2),
    );

    interaction.reply({
      content: `Profile shift is resetted`,
      ephemeral: false,
    });
  },
};
