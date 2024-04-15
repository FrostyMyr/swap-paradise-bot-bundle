const { SlashCommandBuilder } = require("@discordjs/builders");
const fs = require("fs");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("character_shift")
    .setDescription("Swap the characters around."),
  async execute(interaction, client) {
    if (!interaction.member.roles.cache.some((x) => x.name == "Assigner")) {
      interaction.reply({
        content: `You don't have the role for that`,
        ephemeral: true,
      });
      return;
    }

    // Read the JSON file
    let characterListJson;
    try {
      characterListJson = JSON.parse(
        fs.readFileSync(`./${interaction.guild.id}_character_list.json`),
      );
    } catch (error) {
      fs.writeFileSync(`./${interaction.guild.id}_character_list.json`, "{}");
      characterListJson = JSON.parse(
        fs.readFileSync(`./${interaction.guild.id}_character_list.json`),
      );
    }

    // Shuffle the user IDs
    const shuffledCharacterList = derange(Object.entries(characterListJson));

    // Update the JSON object
    Object.entries(characterListJson).forEach((data, index) => {
      const shuffledCharacter = shuffledCharacterList[index];
      characterListJson[data[0]] = {
        name: shuffledCharacter[1].name,
        image: shuffledCharacter[1].image,
      };
    });

    // Write the updated JSON back to the file
    fs.writeFileSync(
      `./${interaction.guild.id}_character_list.json`,
      JSON.stringify(characterListJson, null, 2),
    );

    interaction.reply({
      content: `Everyone is swapped`,
      ephemeral: false,
    });

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
  },
};
