module.exports = (client) => {
  client.on("interactionCreate", async (interaction) => {
    if (!(interaction.isCommand() || interaction.isButton())) return;

    let command;

    if (interaction.isCommand()) {
      command = client.commands.get(interaction.commandName);
    } else if (interaction.isButton()) {
      command = client.commands.get(interaction.customId.split("[-]")[0]);
    }

    if (!command) return;

    try {
      await command.execute(interaction, client);
    } catch (err) {
      if (err) console.error(err);
      await interaction.reply({
        content: "There is something wrong with your input.",
        ephemeral: true,
      });
    }
  });
};
