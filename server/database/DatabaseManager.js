const redis = require('redis');
const { Pool } = require('pg');

class DatabaseManager {
  constructor() {
    this.redis = null;
    this.pg = null;
    this.connected = false;
    
    this.init();
  }

  async init() {
    try {
      // Initialize Redis connection (optional)
      try {
        this.redis = redis.createClient({
          url: process.env.REDIS_URL || 'redis://localhost:6379',
          retry_strategy: () => null // Retry yapma
        });
        
        this.redis.on('error', (err) => {
          console.warn('⚠️ Redis connection error (continuing without Redis):', err.message);
          this.redis = null;
        });
        
        // 3 saniye timeout ile bağlantı dene
        const connectPromise = this.redis.connect();
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Connection timeout')), 3000)
        );
        
        await Promise.race([connectPromise, timeoutPromise]);
        console.log('✅ Redis connection established');
      } catch (redisError) {
        console.warn('⚠️ Redis not available, continuing without Redis:', redisError.message);
        this.redis = null;
      }
      
      // Initialize PostgreSQL connection (optional)
      try {
        this.pg = new Pool({
          user: process.env.DB_USER || 'postgres',
          host: process.env.DB_HOST || 'localhost',
          database: process.env.DB_NAME || 'railrush',
          password: process.env.DB_PASSWORD || 'password',
          port: process.env.DB_PORT || 5432,
        });
        
        // Test PostgreSQL connection
        await this.pg.query('SELECT 1');
        console.log('✅ PostgreSQL connection established');
        
        // Initialize database tables
        await this.initTables();
      } catch (pgError) {
        console.warn('⚠️ PostgreSQL not available, continuing without database:', pgError.message);
        this.pg = null;
      }
      
      this.connected = true;
      console.log('✅ Database manager initialized');
      
    } catch (error) {
      console.error('❌ Database initialization failed:', error);
      this.connected = false;
    }
  }

  async initTables() {
    if (!this.pg) {
      console.log('⚠️ PostgreSQL not available, skipping table initialization');
      return;
    }
    
    try {
      // Create players table
      await this.pg.query(`
        CREATE TABLE IF NOT EXISTS players (
          id SERIAL PRIMARY KEY,
          player_id VARCHAR(255) UNIQUE NOT NULL,
          name VARCHAR(255) NOT NULL,
          total_score BIGINT DEFAULT 0,
          games_played INTEGER DEFAULT 0,
          total_rails_placed INTEGER DEFAULT 0,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          last_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      
      // Create game_sessions table
      await this.pg.query(`
        CREATE TABLE IF NOT EXISTS game_sessions (
          id SERIAL PRIMARY KEY,
          session_id VARCHAR(255) UNIQUE NOT NULL,
          room_id VARCHAR(255) NOT NULL,
          player_count INTEGER DEFAULT 0,
          duration INTEGER DEFAULT 0,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          ended_at TIMESTAMP
        )
      `);
      
      // Create leaderboard table
      await this.pg.query(`
        CREATE TABLE IF NOT EXISTS leaderboard (
          id SERIAL PRIMARY KEY,
          player_id VARCHAR(255) NOT NULL,
          player_name VARCHAR(255) NOT NULL,
          score BIGINT DEFAULT 0,
          rank INTEGER,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      
      console.log('✅ Database tables initialized');
      
    } catch (error) {
      console.error('❌ Table initialization failed:', error);
    }
  }

  // Player management
  async getPlayer(playerId) {
    if (!this.pg) return null;
    
    try {
      const result = await this.pg.query(
        'SELECT * FROM players WHERE player_id = $1',
        [playerId]
      );
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error getting player:', error);
      return null;
    }
  }

  async createPlayer(playerId, name) {
    if (!this.pg) return null;
    
    try {
      const result = await this.pg.query(
        'INSERT INTO players (player_id, name) VALUES ($1, $2) RETURNING *',
        [playerId, name]
      );
      return result.rows[0];
    } catch (error) {
      console.error('Error creating player:', error);
      return null;
    }
  }

  async updatePlayerStats(playerId, score, railsPlaced) {
    if (!this.pg) return;
    
    try {
      await this.pg.query(
        `UPDATE players 
         SET total_score = total_score + $1,
             games_played = games_played + 1,
             total_rails_placed = total_rails_placed + $2,
             last_seen = CURRENT_TIMESTAMP
         WHERE player_id = $3`,
        [score, railsPlaced, playerId]
      );
    } catch (error) {
      console.error('Error updating player stats:', error);
    }
  }

  // Leaderboard management
  async updateLeaderboard(playerId, playerName, score) {
    try {
      // Update or insert leaderboard entry
      await this.pg.query(
        `INSERT INTO leaderboard (player_id, player_name, score)
         VALUES ($1, $2, $3)
         ON CONFLICT (player_id) 
         DO UPDATE SET 
           player_name = $2,
           score = GREATEST(leaderboard.score, $3),
           updated_at = CURRENT_TIMESTAMP`,
        [playerId, playerName, score]
      );
      
      // Update ranks
      await this.pg.query(`
        UPDATE leaderboard 
        SET rank = subquery.rank 
        FROM (
          SELECT player_id, ROW_NUMBER() OVER (ORDER BY score DESC) as rank
          FROM leaderboard
        ) subquery 
        WHERE leaderboard.player_id = subquery.player_id
      `);
      
    } catch (error) {
      console.error('Error updating leaderboard:', error);
    }
  }

  async getLeaderboard(limit = 10) {
    try {
      const result = await this.pg.query(
        'SELECT * FROM leaderboard ORDER BY score DESC LIMIT $1',
        [limit]
      );
      return result.rows;
    } catch (error) {
      console.error('Error getting leaderboard:', error);
      return [];
    }
  }

  // Room management with Redis
  async setRoomState(roomId, state) {
    if (!this.redis) return;
    
    try {
      await this.redis.set(`room:${roomId}`, JSON.stringify(state), 'EX', 3600); // 1 hour expiry
    } catch (error) {
      console.error('Error setting room state:', error);
    }
  }

  async getRoomState(roomId) {
    if (!this.redis) return null;
    
    try {
      const state = await this.redis.get(`room:${roomId}`);
      return state ? JSON.parse(state) : null;
    } catch (error) {
      console.error('Error getting room state:', error);
      return null;
    }
  }

  async removeRoom(roomId) {
    if (!this.redis) return;
    
    try {
      await this.redis.del(`room:${roomId}`);
    } catch (error) {
      console.error('Error removing room:', error);
    }
  }

  // Game session tracking
  async createGameSession(sessionId, roomId) {
    try {
      const result = await this.pg.query(
        'INSERT INTO game_sessions (session_id, room_id) VALUES ($1, $2) RETURNING *',
        [sessionId, roomId]
      );
      return result.rows[0];
    } catch (error) {
      console.error('Error creating game session:', error);
      return null;
    }
  }

  async endGameSession(sessionId, playerCount, duration) {
    try {
      await this.pg.query(
        'UPDATE game_sessions SET player_count = $1, duration = $2, ended_at = CURRENT_TIMESTAMP WHERE session_id = $3',
        [playerCount, duration, sessionId]
      );
    } catch (error) {
      console.error('Error ending game session:', error);
    }
  }

  // Analytics
  async getGameStats() {
    try {
      const result = await this.pg.query(`
        SELECT 
          COUNT(*) as total_games,
          AVG(player_count) as avg_players,
          AVG(duration) as avg_duration,
          COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '1 hour') as games_last_hour
        FROM game_sessions
        WHERE ended_at IS NOT NULL
      `);
      return result.rows[0];
    } catch (error) {
      console.error('Error getting game stats:', error);
      return null;
    }
  }

  // Cleanup old data
  async cleanup() {
    try {
      // Remove old game sessions (older than 30 days)
      await this.pg.query(
        'DELETE FROM game_sessions WHERE created_at < NOW() - INTERVAL \'30 days\''
      );
      
      // Remove old leaderboard entries (keep top 1000)
      await this.pg.query(`
        DELETE FROM leaderboard 
        WHERE rank > 1000
      `);
      
      console.log('✅ Database cleanup completed');
    } catch (error) {
      console.error('❌ Database cleanup failed:', error);
    }
  }

  // Health check
  async healthCheck() {
    try {
      // Test Redis
      await this.redis.ping();
      
      // Test PostgreSQL
      await this.pg.query('SELECT 1');
      
      return true;
    } catch (error) {
      console.error('Database health check failed:', error);
      return false;
    }
  }

  // Close connections
  async close() {
    try {
      if (this.redis) {
        await this.redis.quit();
      }
      if (this.pg) {
        await this.pg.end();
      }
      console.log('✅ Database connections closed');
    } catch (error) {
      console.error('❌ Error closing database connections:', error);
    }
  }
}

module.exports = DatabaseManager; 