const { ChannelType, PermissionsBitField } = require("discord.js");
const { REST } = require("@discordjs/rest");
const { Routes } = require("discord-api-types/v9");
const fs = require("fs");
const proxy = require("../proxy.js");

module.exports = (client, commands) => {
  client.once("ready", async () => {
    console.log(`Logged in as ${client.user.tag}!`);

    const clientId = client.user.id;
    const rest = new REST({
      version: "9",
    }).setToken(process.env.TOKEN);

    try {
      await rest.put(Routes.applicationCommands(clientId), {
        body: commands,
      });

      await fs
        .readdirSync("./")
        .filter((file) => file.startsWith("temp-swap"))
        .forEach((file) => {
          fs.unlinkSync(file);
        });

      console.log("Successfully registered commands globally!");

      proxy.autoProfileShift(client, ChannelType, PermissionsBitField);
      proxy.setClock(client);
    } catch (err) {
      console.error(err);
    }
  });
};
