import { mysqlPool } from './mysql';
import { getMongoDb } from './mongodb';
import { MongoDBCollections } from './types';

export class DatabaseConnection {
  private static instance: DatabaseConnection | null = null;
  private mongoDb: MongoDBCollections | null = null;

  private constructor() {}

  public static async getInstance(): Promise<DatabaseConnection> {
    if (!DatabaseConnection.instance) {
      DatabaseConnection.instance = new DatabaseConnection();
      await DatabaseConnection.instance.initialize();
    }
    return DatabaseConnection.instance;
  }

  private async initialize() {
    this.mongoDb = await getMongoDb();
  }

  public get mysql() {
    return mysqlPool;
  }

  public get mongo(): MongoDBCollections {
    if (!this.mongoDb) {
      throw new Error('MongoDB not initialized');
    }
    return this.mongoDb;
  }
}

export const getDatabase = DatabaseConnection.getInstance; 