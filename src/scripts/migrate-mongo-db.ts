import { MongoClient } from "mongodb";

async function migrateMongoDb() {
  const client = new MongoClient(process.env.MONGODB_URI!);

  try {
    await client.connect();
    const sourceDb = client.db('college_db');
    const targetDb = client.db('college_social');

    // Collections to migrate
    const collections = [
      'interests',
      'logs',
      'email_logs',
      'upload_logs',
      'messages',
      'posts'
    ];

    for (const collectionName of collections) {
      console.log(`Migrating ${collectionName}...`);
      
      // Get all documents from source collection
      const documents = await sourceDb.collection(collectionName).find({}).toArray();
      
      if (documents.length > 0) {
        // Create collection and insert documents in target database
        await targetDb.createCollection(collectionName);
        await targetDb.collection(collectionName).insertMany(documents);
        console.log(`Migrated ${documents.length} documents from ${collectionName}`);
      } else {
        console.log(`No documents found in ${collectionName}`);
      }
    }

    // After successful migration, you might want to drop the old database
    // Uncomment the following line when you're sure everything is migrated correctly
    // await client.db('college_db').dropDatabase();

    console.log('Migration completed successfully');
  } catch (error) {
    console.error('Migration error:', error);
    throw error;
  } finally {
    await client.close();
  }
}

migrateMongoDb().catch(console.error); 