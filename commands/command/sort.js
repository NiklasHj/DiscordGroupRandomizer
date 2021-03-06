const { readMembersVoice, moveMember, giveRole } = require("../../lib/manageMembers");
const { createChannel } = require("../../lib/manageChannels");
const { createRoles } = require("../../lib/manageServer");
const _config = require("../../config.json");
const fs = require("fs");

module.exports = {
  name: "sort",
  aliases: ["s"],
  description: "Sorts something",
  run: async (client, message, args) => {

    //If the user is not admin reject!
    if (!message.member._roles.includes(_config.adminRoleID))
      return message.channel.send("Not admin");

    //If the user didn't give a number input reject
    if (!args[0])
      return message.channel.send("Please provide an amount of how many groups you want");

    //If not a number then lol?
    if (typeof parseInt(args[0]) !== "number") 
      return message.channel.send("Not a number");

    //Parse it into a int
    const amountOfGroups = parseInt(args[0]);

    //For sorting members
    let somevariableidk = 0;

    //An object to push into so we can store it later..
    let membersObject = [];

    try {
      //Stop!
      fs.readFile(`./data/${message.author.id}.json`, async (err, data) => {
        if (data) {
          //If they already have a .json file reject.
          return message.channel.send(
            `You've been using this command before, please use ${_config.prefix}clear first.`
          );
        } else {

          //The name of the channels
          let names = `${message.author.username} Grupprum`;

          //An array for the channels
          let nameArray = [];

          //The data of the members on the voice channel.
          const data = await readMembersVoice(message);

          //Creates the names kek
          for (let i = 0; i < amountOfGroups; ++i) {
            nameArray.push(names + (i+1));
          }

          //Create the roles.
          await createRoles(message, amountOfGroups, nameArray).then(async (roles) => {

            //Channel
            let server = await createChannel(message, roles);

            //Channel ID
            let serverID = server.map((channel) => channel.id);

            //Roles ID
            let roleID = roles.map((role) => role.id);

            //For safety reasons...
            if(data.members.length === 1) {
              if(data.members[0].id === message.author.id) {
                //Save it in an object
                const emptyMembers = {
                  authorID: message.author.id,
                  authorChannel: data.channelID,
                  serverID,
                  roleID,
                };
                //Save it for now for later.
                fs.appendFile(
                  `./data/${message.author.id}.json`,
                  JSON.stringify(emptyMembers),
                  (err, file) => {
                    if (err) throw err;
                  }
                );
              }
            }

            //Loop for each members in the channel.
            for (let i = 0; i < data.members.length; ++i) 
            {

              //Explains it self?
              if (somevariableidk === amountOfGroups) {
                somevariableidk = 0;
              }
              
              //If the user is author, dont give any role.
              if (data.members[i].id === message.author.id) {
                continue;
              
              //Otherwise move and give role etc..  
              } else {

                //push into object for later
                membersObject.push({
                  Member: data.members[i].id,
                  Server: serverID[somevariableidk],
                });

                //Give the user the role.
                giveRole(message, data.members[i].id, roleID[somevariableidk]);

                //Move the member to the channel
                moveMember(client, message, data.members[i].id, serverID[somevariableidk], (err, data) => null);

                //++
                ++somevariableidk;
              }

              //When the loop is finished
              if (i + 1 === data.members.length) {
                
                //Save it in an object
                const dataObject = {
                  authorID: message.author.id,
                  authorChannel: data.channelID,
                  serverID,
                  roleID,
                  Members: membersObject,
                };

                message.channel.send("Created all of the channels and moved the members.");

                //Save it for now for later.
                fs.appendFile(
                  `./data/${message.author.id}.json`,
                  JSON.stringify(dataObject),
                  (err, file) => {
                    if (err) throw err;
                  }
                );
              }
            }
          });
        }
      });
    } catch (err) {
      message.channel.send(err);
    }
  },
};
