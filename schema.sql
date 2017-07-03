CREATE TABLE sb_user(
  id INTEGER PRIMARY KEY NOT NULL,
  username VARCHAR(50) NOT NULL,
  steamid VARCHAR(50) NOT NULL,
  steamvanity VARCHAR(50),
  slackid VARCHAR(50),
  integration_fk VARCHAR(50) NOT NULL
);