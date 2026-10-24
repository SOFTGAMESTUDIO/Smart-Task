import mongoose from 'mongoose';
import { env } from './env.js';

let isConnected = false;

export const sanitizeDbName = (name) => {
  if (!name || name === 'AI Task Management Platform' || name === 'AI_Task_Management_Platform') {
    return 'AiTaksManagemt';
  }
  return name.trim().replace(/\s+/g, '_').replace(/[\/\\\.\ "$\*\<\>\:\|\?]/g, '_');
};

export const buildMongoUri = () => {
  const safeDbName = sanitizeDbName(env.MONGODB_DB_NAME || 'AiTaksManagemt');

  // If individual encoded Atlas credentials are provided
  if (
    env.MONGODB_USERNAME &&
    env.MONGODB_PASSWORD &&
    env.MONGODB_CLUSTER &&
    !env.MONGODB_USERNAME.includes('<username>') &&
    !env.MONGODB_CLUSTER.includes('<clusterName>')
  ) {
    const username = encodeURIComponent(env.MONGODB_USERNAME.trim());
    const password = encodeURIComponent(env.MONGODB_PASSWORD.trim());
    const cluster = env.MONGODB_CLUSTER.trim();
    const dbName = encodeURIComponent(safeDbName);

    const params = new URLSearchParams();
    if (env.MONGODB_AUTH_SOURCE && !env.MONGODB_AUTH_SOURCE.includes('<authSource>') && env.MONGODB_AUTH_SOURCE.trim().length > 0) {
      params.append('authSource', env.MONGODB_AUTH_SOURCE.trim());
    }
    // Only accept modern auth mechanisms (SCRAM-SHA-1 or SCRAM-SHA-256). MONGODB-CR was removed in MongoDB 4.0+.
    if (
      env.MONGODB_AUTH_MECHANISM &&
      !env.MONGODB_AUTH_MECHANISM.includes('<authMechanism>') &&
      !env.MONGODB_AUTH_MECHANISM.toUpperCase().includes('CR') &&
      env.MONGODB_AUTH_MECHANISM.trim().length > 0
    ) {
      params.append('authMechanism', env.MONGODB_AUTH_MECHANISM.trim());
    }
    params.append('retryWrites', 'true');
    params.append('w', 'majority');

    return `mongodb+srv://${username}:${password}@${cluster}/${dbName}?${params.toString()}`;
  }

  // Fallback to direct URI (strip obsolete authMechanism=MONGODB-CR if present)
  if (env.MONGODB_URI && env.MONGODB_URI.trim().length > 0) {
    let cleanUri = env.MONGODB_URI.trim();
    cleanUri = cleanUri.replace(/[?&]authMechanism=MONGODB-CR/gi, '');
    if (!cleanUri.includes('?') && cleanUri.includes('&')) {
      cleanUri = cleanUri.replace('&', '?');
    }
    return cleanUri;
  }

  // Fallback to local MongoDB
  return `mongodb://localhost:27017/${safeDbName}`;
};

export const connectDatabase = async () => {
  if (isConnected) {
    return true;
  }

  const uri = buildMongoUri();
  const safeDbName = sanitizeDbName(env.MONGODB_DB_NAME || 'AI_Task_Management_Platform');

  try {
    const conn = await mongoose.connect(uri, {
      dbName: safeDbName,
      serverSelectionTimeoutMS: 5000,
    });
    isConnected = !!conn.connections[0].readyState;
    console.log(`✅ MongoDB Atlas connected successfully to database: "${safeDbName}"`);
    console.log(`🌐 Host: ${conn.connection.host}`);
    return true;
  } catch (error) {
    console.warn(`⚠️ Database connection warning: ${error.message}`);
    console.warn('ℹ️ Running in resilient/disconnected database mode. Ensure credentials in .env are valid to enable persistence.');
    return false;
  }
};

export const getDatabaseStatus = () => {
  const states = ['disconnected', 'connected', 'connecting', 'disconnecting'];
  const stateCode = mongoose.connection.readyState;
  return states[stateCode] || 'unknown';
};

export const disconnectDatabase = async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
    isConnected = false;
  }
};
