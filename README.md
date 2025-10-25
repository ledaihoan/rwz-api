# Location-Based Service Search System

A scalable RESTful API system for searching location-based services (stores, restaurants, gas stations) with real-time user location tracking and favorites management.

## Features

- **User Authentication**: JWT-based auth with refresh tokens in httpOnly cookies
- **Location Management**: Real-time user location updates with geospatial indexing
- **Store Search**: Search stores by name, service type, and radius with country filtering
- **Favorites**: Add/remove stores to user favorites list
- **Geospatial Queries**: MySQL spatial indexes for efficient radius-based searches

## Tech Stack

- **Runtime**: Node.js 20 + TypeScript
- **Framework**: Express.js
- **Database**: MySQL 8.0 with spatial support
- **ORM**: Prisma
- **Validation**: Zod
- **Process Manager**: PM2 (cluster mode)
- **Containerization**: Docker + Docker Compose

## Architecture Overview

### Database Schema

```
┌─────────────┐       ┌──────────────┐       ┌─────────────┐
│   Country   │       │     User     │       │   Store     │
├─────────────┤       ├──────────────┤       ├─────────────┤
│ id (PK)     │◄──┐   │ id (PK)      │   ┌──►│ id (PK)     │
│ iso_3166_2  │   └───┤ countryId    │   │   │ name        │
│ iso_3166_3  │       │ email        │   │   │ englishName │
│ name        │       │ password     │   │   │ serviceType │
└─────────────┘       │ firstName    │   │   │ countryId   │
                      │ lastName     │   │   │ location    │
                      │ location     │   │   │ latitude    │
                      │ latitude     │   │   │ longitude   │
                      │ longitude    │   │   └─────────────┘
                      └──────────────┘   │          ▲
                             │           │          │
                             ▼           │          │
                      ┌──────────────┐   │          │
                      │   Favorite   │   │          │
                      ├──────────────┤   │          │
                      │ id (PK)      │   │          │
                      │ userId (FK)  ├───┘          │
                      │ storeId (FK) ├──────────────┘
                      └──────────────┘
```

### Geospatial Implementation

**Current**: MySQL 8.0 with POINT data type and spatial indexes
- Uses `ST_Distance_Sphere()` for radius calculations
- Spatial indexes on `location` column (POINT type)
- Haversine formula for accurate distance calculations

**Search Strategy**:
```sql
-- Search within radius, filtered by countries and service types
SELECT *, ST_Distance_Sphere(location, ST_GeomFromText('POINT(lng lat)', 4326)) as distance
FROM Store
WHERE countryId IN (?, ?, ...) -- Multiple countries supported
  AND ST_Distance_Sphere(location, ST_GeomFromText('POINT(lng lat)', 4326)) <= ?
  AND serviceType IN (?, ?, ...) -- Multiple service types supported
  AND MATCH(englishName) AGAINST (? IN BOOLEAN MODE)
ORDER BY distance ASC
LIMIT 50;
```

**Performance Optimization**:
- Country filtering reduces search space significantly
- Combined indexes: `(countryId, serviceType)`
- Spatial index on `location` for geospatial queries
- Full-text index on `englishName` for name searches
- Default to user's current country for better performance and relevance

## Architecture Decisions & Future Improvements

### 1. OpenSearch / Elasticsearch Integration

**Current Limitation**: MySQL full-text search with spatial queries has limitations:
- Limited text search capabilities (no fuzzy matching, typo tolerance)
- Geospatial + full-text queries are not optimally indexed together
- Difficulty handling multi-language search
- Limited aggregations and analytics

**Proposed Solution**: OpenSearch (open-source Elasticsearch alternative)

**Benefits**:
```javascript
// OpenSearch query example with multiple countries and service types
{
  "query": {
    "bool": {
      "must": [
        {
          "multi_match": {
            "query": "coffee",
            "fields": ["name", "englishName"],
            "fuzziness": "AUTO"
          }
        }
      ],
      "filter": [
        {
          "geo_distance": {
            "distance": "5km",
            "location": {
              "lat": 21.0285,
              "lon": 105.8048
            }
          }
        },
        { "terms": { "countryId": [1, 2, 3] } },
        { "terms": { "serviceType": ["cafe", "restaurant", "bakery"] } }
      ]
    }
  },
  "sort": [
    {
      "_geo_distance": {
        "location": { "lat": 21.0285, "lon": 105.8048 },
        "order": "asc"
      }
    }
  ]
}
```

**Implementation Strategy**:
1. **Dual-Write Pattern**: Write to MySQL (source of truth) + OpenSearch (search layer)
2. **Event-Driven Sync**: Use change data capture (CDC) or application-level events
3. **Fallback**: Keep MySQL search as fallback if OpenSearch unavailable

**Architecture**:
```
                     ┌──────────────┐
                     │   API Layer  │
                     └──────┬───────┘
                            │
                ┌───────────┴────────────┐
                ▼                        ▼
         ┌────────────┐          ┌──────────────┐
         │   MySQL    │          │  OpenSearch  │
         │ (Primary)  │          │   (Search)   │
         └─────┬──────┘          └──────────────┘
               │                         ▲
               │    ┌──────────────┐    │
               └───►│  CDC/Events  ├────┘
                    └──────────────┘
```

**Tradeoffs**:
- **Pros**: Superior search, scalability, analytics
- **Cons**: Increased complexity, eventual consistency, additional infrastructure cost
- **When to Migrate**: When search queries > 1000/sec or advanced search features needed

### 2. Redis Caching Layer

**Current**: Simple in-memory cache (application-level)
```typescript
// Current: Node.js Map-based cache
const cache = new Map<string, any>();
```

**Limitation**:
- Lost on server restart
- Not shared across PM2 instances
- No TTL/eviction strategy
- Memory pressure on application

**Proposed Solution**: Redis as distributed cache

**Cache Strategy**:
```typescript
// Redis cache implementation
import { createClient } from 'redis';

// 1. Cache popular searches (Least Recently Used - LRU)
const cacheKey = `search:${countryIds.sort().join(',')}:${serviceTypes.sort().join(',')}:${lat}:${lon}:${radius}`;
await redis.setex(cacheKey, 300, JSON.stringify(results)); // 5 min TTL

// 2. Cache user location (last known)
await redis.hset(`user:${userId}:location`, {
  lat, lon, countryId, updatedAt: Date.now()
});

// 3. Cache store details (frequently accessed)
await redis.setex(`store:${storeId}`, 3600, JSON.stringify(store)); // 1 hour TTL

// 4. Cache aggregations (service type counts per country)
await redis.setex(`agg:${countryIds.join(',')}:serviceTypes`, 1800, JSON.stringify(counts));
```

**Cache Layers**:
```
Request → Redis (L1) → MySQL (L2) → Response
          (ms)          (10-50ms)
```

**Implementation Pattern**:
```typescript
// Cache-aside pattern
async function searchStores(params) {
  const cacheKey = generateCacheKey(params);
  
  // Try cache first
  const cached = await redis.get(cacheKey);
  if (cached) return JSON.parse(cached);
  
  // Cache miss: query database
  const results = await storeRepo.search(params);
  
  // Store in cache with TTL
  await redis.setex(cacheKey, TTL, JSON.stringify(results));
  
  return results;
}
```

**Cache Invalidation Strategy**:
```typescript
// On store update/delete
await redis.del(`store:${storeId}`);
await redis.del(`search:*`); // Invalidate all search caches

// Or use Redis keyspace notifications
redis.on('expired', (key) => {
  logger.info(`Cache expired: ${key}`);
});
```

**Architecture with Redis**:
```
┌──────────────────────────────────────┐
│         Application Layer            │
│   (PM2 Cluster - 4 instances)        │
└────────┬─────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────┐
│         Redis (Distributed)          │
│  - Search results (5 min TTL)        │
│  - User locations (hash)             │
│  - Store details (1 hour TTL)        │
│  - Rate limiting counters            │
└────────┬─────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────┐
│         MySQL (Primary DB)           │
│  - Users, Stores, Favorites          │
│  - Geospatial indexes                │
└──────────────────────────────────────┘
```

**Additional Redis Use Cases**:
1. **Session Storage**: Store JWT refresh tokens
2. **Rate Limiting**: Track API request counts per user
3. **Real-time Features**: Pub/Sub for location updates
4. **Leaderboard**: Popular stores by country (sorted sets)

**Performance Impact**:
```
Without Redis:  MySQL query ~50ms
With Redis:     Cache hit ~2ms, Cache miss ~52ms
Hit Rate:       70-80% for search queries
Load Reduction: 70-80% less MySQL queries
```

**Tradeoffs**:
- **Pros**: Fast, distributed, reduces DB load, enables new features
- **Cons**: Additional infrastructure, cache invalidation complexity, memory cost
- **When to Add**: When query load > 500 req/sec or response time > 200ms

### 3. Search Performance Optimization

**Country Filtering Default**:
- All search queries default to user's current country (can be expanded to multiple countries)
- Significantly reduces search space (e.g., 1M stores → 50K stores per country)
- Better relevance (users typically search locally)
- Allows aggressive caching per country
- Supports multi-country searches for border regions or travel use cases

**Pagination**:
- Limit results to 50 per page
- Use cursor-based pagination for geospatial queries
- Cache first page more aggressively (90% of requests)

**Index Strategy**:
```sql
-- Composite index for filtered searches
CREATE INDEX idx_store_country_service ON Store(countryId, serviceType);

-- Spatial index for geolocation
CREATE SPATIAL INDEX idx_store_location ON Store(location);

-- Full-text index for name search
CREATE FULLTEXT INDEX idx_store_englishName ON Store(englishName);
```

## API Documentation

See [OpenAPI Specification](./openapi.yaml) for complete API documentation.

### Key Endpoints

- `POST /api/v1/auth/sign-in` - User authentication
- `POST /api/v1/auth/refresh` - Refresh access token
- `GET /api/v1/users/profile` - Get user profile
- `PATCH /api/v1/users/location` - Update user location
- `GET /api/v1/stores/search` - Search stores (defaults to user's country)
- `GET /api/v1/favorites` - Get user favorites
- `POST /api/v1/favorites` - Add store to favorites
- `DELETE /api/v1/favorites/:storeId` - Remove from favorites

### Search Query Parameters

```typescript
interface SearchParams {
  query?: string;           // Store name search
  serviceTypes?: string[];  // Filter by service types (e.g., ["cafe", "restaurant"])
  radius?: number;          // Search radius in km (default: 5)
  latitude: number;         // Center latitude
  longitude: number;        // Center longitude
  countryIds?: number[];    // Filter by countries (default: [user's current country])
  page?: number;            // Pagination (default: 1)
  limit?: number;           // Results per page (default: 50, max: 100)
}
```

## Setup

### Prerequisites

- Node.js 20+
- Docker & Docker Compose
- MySQL 8.0+

### Installation

```bash
# Clone repository
git clone <repository-url>
cd location-service-api

# Install dependencies
yarn install

# Setup environment variables
cp .env.example .env

# Start services with Docker Compose
docker-compose up -d

# Run migrations
yarn prisma migrate deploy

# Seed database
yarn seed
```

### Environment Variables

```env
NODE_ENV=development
PORT=5000

# Database
DATABASE_URL=mysql://user:password@localhost:3306/location_service
SHADOW_DATABASE_URL=mysql://user:password@localhost:3306/location_service_shadow

# JWT
JWT_SECRET=your-secret-key
JWT_REFRESH_SECRET=your-refresh-secret
ACCESS_TOKEN_EXPIRY=15m
REFRESH_TOKEN_EXPIRY=7d

# Redis (when implemented)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# OpenSearch (future)
OPENSEARCH_HOST=localhost
OPENSEARCH_PORT=9200
```

## Development

```bash
# Development with hot reload
yarn dev

# Build for production
yarn build

# Run production build
yarn start

# Run tests
yarn test

# Lint
yarn lint

# Format code
yarn format
```

## Production Deployment

### Docker Build

```bash
# Build image
docker build -t location-service-api .

# Run with docker-compose
docker-compose -f docker-compose.prod.yml up -d
```

### PM2 Cluster Mode

```bash
# ecosystem.config.js
module.exports = {
  apps: [{
    name: 'location-api',
    script: './dist/server.js',
    instances: 'max',        // Uses all CPU cores
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production'
    }
  }]
};

# Start PM2
pm2 start ecosystem.config.js
```

## Performance Considerations

### Database Optimization

1. **Indexes**: Spatial, composite, and full-text indexes
2. **Connection Pooling**: Prisma connection pool (default: 10)
3. **Query Optimization**: Use `EXPLAIN` for slow queries
4. **Partitioning**: Consider table partitioning by country for large datasets

### Application Scaling

1. **Horizontal Scaling**: Multiple instances behind load balancer
2. **Cluster Mode**: PM2 cluster mode for multi-core utilization
3. **Stateless Design**: All state in database/Redis (not in memory)
4. **Caching**: Implement Redis for hot data

### Monitoring

```bash
# PM2 monitoring
pm2 monit

# Logs
pm2 logs location-api

# Metrics
pm2 install pm2-logrotate
```

## Testing

```bash
# Unit tests
yarn test:unit

# Integration tests
yarn test:integration

# E2E tests
yarn test:e2e

# Coverage
yarn test:coverage
```

## Security

- JWT tokens with short expiration (15 min access, 7 day refresh)
- Refresh tokens stored in httpOnly cookies
- Password hashing with bcrypt
- Input validation with Zod
- Rate limiting (future: Redis-based)
- CORS configuration
- SQL injection prevention (Prisma parameterized queries)

## Migration Path

### Phase 1: Current (MVP)
- MySQL with spatial indexes ✅
- Basic caching (in-memory) ✅
- Full-text search ✅
- JWT authentication ✅

### Phase 2: Performance (Scale to 10K users)
- Redis caching layer
- Connection pooling optimization
- Database query optimization
- Monitoring & alerting

### Phase 3: Advanced Search (Scale to 100K+ users)
- OpenSearch integration
- Advanced search features (fuzzy, filters, suggestions)
- Analytics dashboard
- Real-time location updates (WebSocket + Redis Pub/Sub)

### Phase 4: Global Scale (1M+ users)
- Multi-region deployment
- Database read replicas
- CDN for static content
- Microservices architecture

## License

MIT

## Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request