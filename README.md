# Steam Buddy

[![Deploy](https://www.herokucdn.com/deploy/button.png)](https://heroku.com/deploy)

## Description
Steam buddy is a small node bot that watches for Steam users to join a game. When a member starts playing a game, Steam Buddy sends out notifications to let all of their friends know they are starting to play. Steam Buddy is currently configured to integrate with slack chat, but there are plans to extend Steam Buddy's functionality to include other means of communication.

Get notified immediately when your friends begin playing a steam game!
![Steam Buddy Screenshot](/img/steam_buddy.png)

## Using Steam Buddy
Steam Buddy will run silently, constantly listening for input from either users within your team channel, or for a user to launch a game on one of the supported systems. Interacting with steam buddy is easy - just @ him! Assuming you name your integration steam_buddy, you can:

`@steam_buddy: add steam my_steam_user` - Adds a steam user for your channel to be notified about.

`@steam_buddy: remove my_steam_user` - Removes a steam user that your channel was previously being notified about.

`@steam_buddy: online` - Lists any users currently in game.

## Configuration for Steam Buddy
As of version 2.0, Steam Buddy no longer stores information in a configuration file. Instead, you must run a db. Currently only Postgres is supported, although you can easily make your own db integration and add it to the `DAO` directory.

The reason Steam Buddy has moved to an actual database is because it allows Steam Buddy to grow. A configuration file is tricky to manage manually and required you to do a lot of manual mapping of usernames to id's. With a database, Steam Buddy can handle all of it, while also gaining the very useful ability to easily add new users and to restore the users it is watching should it crash.

### Setting up Postgres

The Postgres setup for Steam Buddy is actually very easy. Just set up postgres run this command:

`psql -f schema.sql <postgres_url>`

and you are set!

The Postgres class in `lib/js/dao/` creates a connection string that is populated by environment variables. You must set all of these variables in order for Steam Buddy to connect to the database.

`PSQL_USERNAME` - The username of your PSQL user

`PSQL_PASS` - The password of your PSQL user

`PSQL_URL` - The url of your database (typically just `localhost`)

`PSQL_DB_NAME` - The name of your PSQL database

And that's it! That's all that the postgres instance requires for Steam Buddy to be fully functional.

### Configuring for Slack
In order for Steam Buddy to send Slack messages, it needs to be set up as a slack bot. Simply add a new bot integration to your slack team and set the channel(s) that you want Steam Buddy to run on. This is very simple. You can follow the instructions [here](https://api.slack.com/bot-users) to add a new integration to your channel.

Once you have created the integration, there are then 2 ways you can tell Steam Buddy about the bot. If you are only going to run Steam Buddy within a single Slack team, you can set the slack token as an environment variable: `export SLACK_TOKEN="abcd-1234-abcd-1234"`. Steam Buddy will read this token in when launched and use it to authenticate into Slack and send messages.

Steam Buddy also requires a steam API key. You can generate an api key in steam, and then add it to your environment with `STEAM_API_KEY="ABCDEFGHIJKLMNOP1234567890"`.

## Running Steam Buddy
Running Steam Buddy requires that you have a few environment variables set:
* [Steam API Key](http://steamcommunity.com/dev/registerkey): set as environment variable `STEAM_API_KEY`
* [Slack Integration](https://api.slack.com/bot-users): set the slack token provided for the integration as `SLACK_TOKEN`

1. Clone the Steam Buddy repository.
2. Set up the database (see Configuration section above)
3. Set up your integrations and environment variables (see Configuring for Slack above)
4. run `yarn` to install all dependencies
5. run `npm start` to run steam buddy

It is suggested you run Steam Buddy on Heroku!
