import cassandra from 'cassandra-driver';

interface Messages {
  messages: cassandra.types.Row[] | null;
  error: Error | null;
}

class Db {
  private client: cassandra.Client;

  constructor(client: cassandra.Client) {
    this.client = client;
  }

  // Create Channel Method
  async createChannel(channelName: string) {
    try {
      await this.client.execute(`
      CREATE TABLE IF NOT EXISTS channels.${channelName} (
          id UUID,
          message_content TEXT,
          channel_name TEXT,
          timestamp TIMESTAMP,
          sender UUID,
          PRIMARY KEY (channel_name, timestamp)
      ) WITH CLUSTERING ORDER BY (timestamp DESC);`);
    } catch (e) {
      console.log(`Error creating new channel: ${e as Error}`);
    }
  }

  // Send message method
  async sendMessage(channelName: string, content: string, sender: string, id: string) {
    try {
      const now = new Date();
      await this.client.execute(`INSERT INTO channels.${channelName} (id, message_content, channel_name, timestamp, sender) VALUES (?, ?, ?, ?, ?)`, {
        id,
        message_content: content,
        channel_name: channelName,
        timestamp: now.getTime(),
        sender,
      });
    } catch (e) {
      console.log(`Error storing messages: ${e as Error}`);
    }
  }

  // Get Channels method
  async getChannels(): Promise<cassandra.types.Row[] | undefined> {
    try {
      const res = await this.client.execute(`SELECT table_name FROM system_schema.tables WHERE keyspace_name = 'channels'`);
      return res.rows;
    } catch (e) {
      console.log(`Error fetching channels: ${e as Error}`);
      return;
    }
  }

  // Get messages method
  async getMessages(channelName: string, limit: number): Promise<Messages> {
    try {
      const res = await this.client.execute(`SELECT * FROM channels.${channelName} WHERE channel_name = ? ORDER BY timestamp DESC LIMIT ${limit}`, {
        channel_name: channelName,
      });
      return {
        messages: res.rows,
        error: null,
      };
    } catch (e) {
      console.log(`Error fetching messages: ${(e as Error).message}`);
      return {
        messages: null,
        error: e as Error,
      };
    }
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
  console.log(`Error connecting to DB: ${e as Error}`);
  process.exit(1);
}

try {
  await client.execute(`CREATE KEYSPACE IF NOT EXISTS users WITH REPLICATION = {'class': 'SimpleStrategy', 'replication_factor': 1};`);
  await client.execute(`CREATE KEYSPACE IF NOT EXISTS channels WITH REPLICATION = {'class': 'SimpleStrategy', 'replication_factor': 1};`);
} catch (e) {
  console.log(`Error generating keyspaces: ${e as Error}`);
  process.exit(1);
}

const db = new Db(client);
await db.createChannel('general');

export { db, type Messages };
