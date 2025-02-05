import cassandra from 'cassandra-driver';

async function createChannel(client: cassandra.Client, channelName: string) {
  try {
    await client.execute(`
    CREATE TABLE IF NOT EXISTS channels.channel_${channelName} (
        id UUID,
        message_content TEXT,
        channel_name TEXT,
        timestamp TIMESTAMP,
        sender UUID,
        PRIMARY KEY (channel_name, timestamp)
    ) WITH CLUSTERING ORDER BY (timestamp DESC);`);
  } catch (e) {
    // @ts-expect-error I don't like this thing yelling at me
    console.log(`Error creating new channel: ${e.message}`);
  }
}

async function storeMessage(client: cassandra.Client, channelName: string, content: string, sender: string, id: string) {
  try {
    const now = new Date();
    await client.execute(`INSERT INTO channels.channel_${channelName} (id, message_content, channel_name, timestamp, sender)
                 VALUES (${id}, '${content}', '${channelName}', ${now.getTime()}, ${sender})`);
  } catch (e) {
    // @ts-expect-error I don't like this thing yelling at me
    console.log(`Error storing messages: ${e.message}`);
  }
}

async function getChannels(client: cassandra.Client): Promise<cassandra.types.Row[] | undefined> {
  try {
    const res = await client.execute(`SELECT table_name FROM system_schema.tables WHERE keyspace_name = 'channels'`);
    return res.rows;
  } catch (e) {
    // @ts-expect-error I don't like this thing yelling at me
    console.log(`Error fetching channels: ${e.message}`);
    return;
  }
}

async function getMessages(client: cassandra.Client, channelName: string, limit: number): Promise<cassandra.types.Row[] | undefined> {
  try {
    const res = await client.execute(
      `SELECT * FROM channels.channel_${channelName} WHERE channel_name = '${channelName}' ORDER BY timestamp DESC LIMIT ${limit}`,
    );
    return res.rows;
  } catch (e) {
    // @ts-expect-error I don't like this thing yelling at me
    console.log(`Error fetching messages: ${e.message}`);
    return;
  }
}

const client = new cassandra.Client({
  contactPoints: ['localhost'],
  localDataCenter: 'datacenter1',
});

// Connect to Cassandra/ScyllaDB and create
// the necessary tables, keyspaces, etc.
try {
  await client.connect();
} catch (e) {
  // @ts-expect-error I don't like this thing yelling at me
  console.log(`Error connecting to DB: ${e.message}`);
  process.exit(1);
}

try {
  await client.execute(`CREATE KEYSPACE IF NOT EXISTS users WITH REPLICATION = {'class': 'SimpleStrategy', 'replication_factor': 1};`);
  await client.execute(`CREATE KEYSPACE IF NOT EXISTS channels WITH REPLICATION = {'class': 'SimpleStrategy', 'replication_factor': 1};`);
} catch (e) {
  // @ts-expect-error I don't like this thing yelling at me
  console.log(`Error generating keyspaces: ${e.message}`);
  process.exit(1);
}

export { client, createChannel, getChannels, getMessages, storeMessage };
