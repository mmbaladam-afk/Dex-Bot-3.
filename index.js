
require("dotenv").config();

const {
  Client,
  GatewayIntentBits,
  REST,
  Routes,
  SlashCommandBuilder,
  EmbedBuilder,
  PermissionFlagsBits
} = require("discord.js");

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

const commands = [
  new SlashCommandBuilder()
    .setName("ping")
    .setDescription("معرفة سرعة البوت"),

  new SlashCommandBuilder()
    .setName("help")
    .setDescription("عرض أوامر البوت"),

  new SlashCommandBuilder()
    .setName("server")
    .setDescription("معلومات السيرفر"),

  new SlashCommandBuilder()
    .setName("user")
    .setDescription("معلومات حسابك"),

  new SlashCommandBuilder()
    .setName("say")
    .setDescription("إرسال رسالة باسم البوت")
    .addStringOption(option =>
      option.setName("message")
        .setDescription("الرسالة")
        .setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),

  new SlashCommandBuilder()
    .setName("clear")
    .setDescription("حذف رسائل من الشات")
    .addIntegerOption(option =>
      option.setName("amount")
        .setDescription("عدد الرسائل (1 إلى 100)")
        .setMinValue(1)
        .setMaxValue(100)
        .setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
].map(command => command.toJSON());

client.once("ready", async () => {
  console.log(`✅ ${client.user.tag} is online`);

  try {
    const rest = new REST({ version: "10" })
      .setToken(process.env.DISCORD_TOKEN);

    await rest.put(
      Routes.applicationCommands(process.env.CLIENT_ID),
      { body: commands }
    );

    console.log("✅ Commands registered");
  } catch (error) {
    console.error(error);
  }
});

client.on("interactionCreate", async interaction => {
  if (!interaction.isChatInputCommand()) return;

  try {
    switch (interaction.commandName) {
      case "ping":
        await interaction.reply({
          content: `🏓 سرعة البوت: ${client.ws.ping}ms`,
          ephemeral: true
        });
        break;

      case "help": {
        const embed = new EmbedBuilder()
          .setTitle("𝘿𝙚𝙭 𝘽𝙤𝙩")
          .setColor(0x5865F2)
          .setDescription(
            "**الأوامر:**\n\n" +
            "`/ping` - سرعة البوت\n" +
            "`/help` - قائمة الأوامر\n" +
            "`/server` - معلومات السيرفر\n" +
            "`/user` - معلومات حسابك\n" +
            "`/say` - إرسال رسالة\n" +
            "`/clear` - حذف رسائل"
          );

        await interaction.reply({ embeds: [embed] });
        break;
      }

      case "server":
        await interaction.reply({
          content:
            `🏠 **السيرفر:** ${interaction.guild.name}\n` +
            `👥 **الأعضاء:** ${interaction.guild.memberCount}`,
          ephemeral: true
        });
        break;

      case "user":
        await interaction.reply({
          content:
            `👤 **الحساب:** ${interaction.user.tag}\n` +
            `🆔 **ID:** ${interaction.user.id}`,
          ephemeral: true
        });
        break;

      case "say": {
        if (!interaction.memberPermissions.has(PermissionFlagsBits.ManageMessages)) {
          await interaction.reply({ content: "ليس لديك صلاحية.", ephemeral: true });
          break;
        }

        const message = interaction.options.getString("message");

        await interaction.reply({
          content: message,
          allowedMentions: { parse: [] }
        });
        break;
      }

      case "clear": {
        if (!interaction.memberPermissions.has(PermissionFlagsBits.ManageMessages)) {
          await interaction.reply({ content: "ليس لديك صلاحية.", ephemeral: true });
          break;
        }

        if (!interaction.channel || !interaction.channel.bulkDelete) {
          await interaction.reply({ content: "لا يمكن حذف الرسائل هنا.", ephemeral: true });
          break;
        }

        const amount = interaction.options.getInteger("amount");
        const deleted = await interaction.channel.bulkDelete(amount, true);

        await interaction.reply({
          content: `🧹 تم حذف ${deleted.size} رسالة.`,
          ephemeral: true
        });
        break;
      }
    }
  } catch (error) {
    console.error(error);

    const reply = {
      content: "حدث خطأ أثناء تنفيذ الأمر.",
      ephemeral: true
    };

    if (interaction.replied || interaction.deferred) {
      await interaction.followUp(reply);
    } else {
      await interaction.reply(reply);
    }
  }
});

if (!process.env.DISCORD_TOKEN || !process.env.CLIENT_ID) {
  console.error("Missing environment variables.");
  process.exit(1);
}

client.login(process.env.DISCORD_TOKEN);
