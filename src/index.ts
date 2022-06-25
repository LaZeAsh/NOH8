// --------------------------------------------------Classic Imports---------------------------------------------------------
import Discord, { Client } from 'discord.js';
import dotenv from 'dotenv';
dotenv.config();
// -------------------------------------------------Database Imports------------------------------------------------------------
import mongo from './database/mongo';
import userSchema from './database/schemas/user';

mongo(); // Returns void

let map = new Map();

let prefix = "-"
const client = new Client({intents: [
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



client.on('messageCreate', async(message) => {
    if(message.author.bot) return;

    // console.log(message.content);
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
        if(!await userSchema.exists({ randID: callerID })) { 
            message.channel.send("This user does not have a profile!"); 
            return;
        }
        await userSchema.findOne({ randID: callerID }).then((doc) => {
            if(!doc) return;
            userID = doc.userID;
        });

        let user = client.users.cache.get(userID);
        if(!user) return;
        try {
            user.send(`${message.author.username} is trying to call you! Say "Yes" to accept / "No" to decline`);
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
                    authorCollector.on('collect', msg => {
                        if(msg.author.bot) return;
                        user?.send(msg.content);
                    });
                    userCollector?.on('collect', msg => {
                        if(msg.author.bot) return;
                        message.channel.send(msg.content);
                    })
                }
            })
        } catch(error) {
            console.log(error);
            message.channel.send("This user does not have their DMs open!");
        }

    }

    if(message.content === '-help') {
        if(message.channel.type !== "DM") { 
            message.channel.send("This is a DM only command");
            return; 
        }
    
    }
});

// -------------------------------------------------Functions------------------------------------------------------------


client.login(process.env.TOKEN as string);
