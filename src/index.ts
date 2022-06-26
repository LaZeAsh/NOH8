// --------------------------------------------------Classic Imports---------------------------------------------------------
import Discord, { Client, InteractionCollector } from 'discord.js';
import dotenv from 'dotenv';
import cohere from 'cohere-ai';
dotenv.config();
// -------------------------------------------------Database Imports------------------------------------------------------------
import mongo from './database/mongo';
import userSchema from './database/schemas/user';

cohere.init(process.env.COHERE_API_KEY as string);
mongo(); // Returns void

let map = new Map();

let prefix = "-"
const client = new Client({partials: ['USER', 'CHANNEL'], intents: [
    Discord.Intents.FLAGS.GUILDS,
  //   Discord.Intents.FLAGS.GUILD_MEMBERS ,
  //   Discord.Intents.FLAGS.GUILD_BANS ,
  //   Discord.Intents.FLAGS.GUILD_EMOJIS_AND_STICKERS ,
  //   Discord.Intents.FLAGS.GUILD_INTEGRATIONS ,
  //   Discord.Intents.FLAGS.GUILD_WEBHOOKS ,
  //   Discord.Intents.FLAGS.GUILD_INVITES ,
  //   Discord.Intents.FLAGS.GUILD_VOICE_STATES ,
  //   Discord.Intents.FLAGS.GUILD_PRESENCES ,
    Discord.Intents.FLAGS.GUILD_MESSAGES ,
  //   Discord.Intents.FLAGS.GUILD_MESSAGE_REACTIONS ,
    Discord.Intents.FLAGS.GUILD_MESSAGE_TYPING ,
    Discord.Intents.FLAGS.DIRECT_MESSAGES ,
    Discord.Intents.FLAGS.DIRECT_MESSAGE_REACTIONS ,
    Discord.Intents.FLAGS.DIRECT_MESSAGE_TYPING ,
]});

client.on('ready', (client) => {
    console.log(`${client.user.username} is ready to be used!`);
})


client.on("messageCreate", async (message) => {
    if(message.author.bot) return; 
    if(message.channel.type === "DM") return;
    let parameter: string[] = [message.content];
    const response = await cohere.classify(
        "247a5954-8e30-419a-b3b0-95499970f635-ft", {inputs: parameter, examples: undefined}
    ),
        isToxic = response.body.classifications[0].prediction === "Toxic" ? true : false;
        try {
            if(isToxic) {
                try {
                    message.delete();
                } catch (error) {
                    console.log(`Unknown Message`)
                }
                message.channel.send("Toxic message detected. Message deleted.");
                }
        } catch (error) {
            console.log("Unknown Message");
        }
    });


client.on('messageCreate', async(message) => {
    if(message.author.bot) return;

    cohere.init(process.env.COHERE_API_KEY);

    if(message.content === '-help') {
        
        if(message.channel.type !== "DM") { 
            message.channel.send("This is a DM only command");
            return; 
        }
        let helpChannel = client.channels.cache.get("990452558197841990") as Discord.TextBasedChannel;
        if(!helpChannel) return console.log(helpChannel);
        let embed = new Discord.MessageEmbed()
        .setTitle(`Anonymous is in need of help`)
        .setDescription(`Please say \`yes\` if you can help this person!`)
        .setColor("RED")
        
        helpChannel.send({ embeds: [embed] })
        let collector = helpChannel.createMessageCollector();
        collector.on('end', () => {
            let embed = new Discord.MessageEmbed()
            .setTitle(`WAIT, you can still get help`)
            .setDescription(`If you get no response after trying multiple times try seeking for help over here: https://suicidepreventionlifeline.org`)
            .setColor("RED")
            message.author.send({ embeds: [embed]});
        })
        collector.on('collect', async(msg) => {
            if(msg.author.bot) return;
            if(msg.content.toLowerCase() === "yes") {
                await message.author.createDM();
                let helpNeeded = message.author.dmChannel.createMessageCollector({ idle: 1000 * 60 });
                await msg.author.createDM();
                
                let helper = msg.author.dmChannel.createMessageCollector({ idle: 1000 * 60 });
                message.author.send("You are connected with a person as anonymous");
                msg.author.send("You are connected with this person as anonymous")
                helpNeeded.on('collect', mesg => {
                    if(mesg.author.bot) return;
                    msg.author.send(`**Anonymous:** ${mesg.content}`);
                });
                helper.on('collect', mesg => {
                    if(mesg.author.bot) return;
                    message.author.send(`**Anonymous:** ${mesg.content}`);
                });
                helper.on('end', () => {
                    message.author.send(`This link was cut due to inactivity!`);
                });
                helpNeeded.on('end', () => {
                    msg.author.send(`This link was cut due to inactivity!`);
                })
            }
        })
        
    }

    if(message.content === '-create') {
        if(await userSchema.exists({userID: message.author.id})) {
            message.channel.send("Profile Exists!");
            return;
        }
        let rand = Math.floor(Math.random() * 100000);
        while(map.get(rand) !== undefined) {
            rand = Math.floor(Math.random() * 100000);
        }
        map.set(rand, rand);
        await userSchema.create({ userID: message.author.id, randID: rand });
        message.channel.send("Profile Created!");
    }

    if(message.content === "-viewprofile") {
        if(await userSchema.exists({ userID: message.author.id })) {
            let placeHolder: string = "";
            await userSchema.findOne({ userID: message.author.id }).then((doc) => {
                if(!doc) return;
                placeHolder = doc.randID;
            });
            const randID = placeHolder;
            let embed = new Discord.MessageEmbed()
                .setTitle(`**${message.author.username}'s** profile`)
                .setColor("RANDOM")
                .addField('User ID', message.author.id, false)
                .addField('Caller ID', randID, false);
            message.channel.send({ embeds: [embed] })
        } else {
            message.channel.send("You have no profile yet!");
        }
    }

    if(message.content.startsWith('-call')) {
        let arg = message.content.split(" ");
        let callerID = arg[1];
        let userID = "";
        let authorRANDID = "";
        if(!await userSchema.exists({ userID: message.author.id })) {
            message.channel.send("You cannot use this command because you don't have a profile!");
            return;
        }
        if(!await userSchema.exists({ randID: callerID })) { 
            message.channel.send("This user does not have a profile!"); 
            return;
        }
        await userSchema.findOne({ randID: callerID }).then((doc) => {
            if(!doc) return;
            userID = doc.userID;
        });
        await userSchema.findOne({ userID: message.author.id }).then((doc) => {
            if(!doc) return;
            authorRANDID = doc.randID;
        })
        let user = client.users.cache.get(userID);
        if(!user) return;
        try {
            user.send(`\☎️ ${message.author.username} is trying to call you! Say "Yes" to accept / "No" to decline`);
            await user.createDM();
            if(!user.dmChannel) return console.log(user.dmChannel);
            const collector = user.dmChannel.createMessageCollector({
                max: 2,
                time: 1000 * 5
            });
            collector.on('collect', (msg) => {
                if(msg.content.toLowerCase() === "yes") {
                    let authorCollector = message.channel.createMessageCollector({ 
                        idle: 1000 * 60
                    })
                    user?.createDM();
                    let userCollector = user?.dmChannel?.createMessageCollector({
                        idle: 1000 * 60
                    })
                    // message.channel.send(`You are connected with **${callerID}**`);
                    // user.send(`You are connected with **${authorRANDID}**`)
                    authorCollector.on('collect', msg => {
                        if(msg.author.bot) return;
                        user?.send(`**${callerID}** ` + msg.content);
                    });
                    userCollector?.on('collect', msg => {
                        if(msg.author.bot) return;
                        message.channel.send(`**${authorRANDID}** ` + msg.content);
                    })
                }
            })
        } catch(error) {
            console.log(error);
            message.channel.send("This user does not have their DMs open!");
        }
    }
});

// -------------------------------------------------Functions------------------------------------------------------------


client.login(process.env.TOKEN as string);
