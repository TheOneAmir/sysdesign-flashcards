// Default deck: Software System Design interview deep dives.
// Each card: front / back / scenarios ("Commonly used in") / tags
export const SEED_SUBJECT = "System Design";

export const SEED_CARDS = [
  {
    front: "CAP theorem — what does it actually force you to choose?",
    back: "Under a network partition (P, non-negotiable in distributed systems) you must choose Consistency (reject/stall requests that can't see the latest write) or Availability (answer with possibly stale data). Without a partition you can have both, so real systems are better described by PACELC: else (E) you trade Latency vs Consistency.",
    scenarios:
      "CP: etcd/ZooKeeper for leader election & config, Spanner for money. AP: DynamoDB/Cassandra shopping carts, DNS, session stores, feeds.",
    tags: ["distributed", "cap"],
  },
  {
    front: "Explain quorum reads/writes (R + W > N).",
    back: "With N replicas, a write is ack'd by W and a read polls R. If R + W > N the read set intersects the write set, so you see the latest ack'd write (strong-ish consistency). W=N gives fast reads/slow writes; W=1,R=N the reverse. Sloppy quorums + hinted handoff trade this for availability.",
    scenarios: "Cassandra/DynamoDB tunable consistency; N=3, W=2, R=2 is the standard default.",
    tags: ["distributed", "replication"],
  },
  {
    front: "Consistent hashing — the problem it solves and how.",
    back: "hash(key) % N remaps nearly every key when N changes. Consistent hashing maps nodes and keys onto a ring; a key belongs to the next node clockwise, so adding/removing a node moves only ~K/N keys. Virtual nodes (100–256 per physical node) smooth out hot spots and heterogeneous capacity.",
    scenarios: "Cache fleets (memcached/Redis), Cassandra/Dynamo partitioning, CDN edge selection, sharded rate limiters.",
    tags: ["sharding", "hashing"],
  },
  {
    front: "Idempotency: how do you make a payment/POST endpoint safe to retry?",
    back: "Client generates an idempotency key (UUID) per logical operation. Server stores key -> (status, response) in a durable table with a unique constraint, inside the same transaction as the side effect. Repeat requests return the stored response instead of re-executing. Add a TTL and a 409 for same-key-different-payload.",
    scenarios: "Stripe payments, order placement, webhook consumers, at-least-once queue consumers (Kafka/SQS).",
    tags: ["api", "reliability"],
  },
  {
    front: "Compare write-through, write-back, and cache-aside.",
    back: "Cache-aside (lazy): app reads cache, on miss reads DB and populates; writes invalidate. Simple, tolerant of cache loss, but first read is slow and there's a stale-window race. Write-through: write cache+DB synchronously — consistent, slower writes. Write-back: write cache, flush async — fastest, risks data loss on node failure.",
    scenarios: "Cache-aside is the default for Redis in front of Postgres; write-back for counters/metrics; write-through for small hot config.",
    tags: ["caching"],
  },
  {
    front: "How do you prevent cache stampede / thundering herd?",
    back: "(1) Per-key mutex or single-flight so only one request recomputes. (2) Probabilistic early expiration (XFetch) — refresh before TTL with rising probability. (3) Stale-while-revalidate: serve stale, refresh in background. (4) Jitter TTLs so keys don't expire together. (5) Negative caching for misses.",
    scenarios: "Hot product page after a cache flush, celebrity user profile, homepage feed at peak.",
    tags: ["caching", "reliability"],
  },
  {
    front: "Outbox pattern — why and how?",
    back: "You can't atomically write to a DB and publish to a broker (dual write). Instead, write the domain row and an `outbox` row in one transaction; a relay (CDC via Debezium, or a poller) reads the outbox and publishes to Kafka, marking rows sent. Gives at-least-once delivery with no lost events — consumers must be idempotent.",
    scenarios: "Order service emitting OrderPlaced, user signup -> email/analytics, microservice event sourcing.",
    tags: ["messaging", "consistency"],
  },
  {
    front: "Saga pattern vs 2PC for distributed transactions.",
    back: "2PC gives atomicity but blocks on coordinator failure and couples availability of all participants — rarely used across services. Sagas split the transaction into local transactions with compensating actions. Choreography (events, no coordinator, hard to trace) vs orchestration (a saga orchestrator, explicit state machine, easier to debug).",
    scenarios: "Book flight + hotel + car; e-commerce reserve inventory -> charge -> ship; refund flows.",
    tags: ["distributed", "transactions"],
  },
  {
    front: "Rate limiting algorithms: fixed window, sliding window, token bucket, leaky bucket.",
    back: "Fixed window: cheap counter, allows 2x burst at boundaries. Sliding window log: exact, memory heavy. Sliding window counter: weighted blend, good default. Token bucket: allows bursts up to bucket size with steady refill. Leaky bucket: smooths output to a constant rate (queue).",
    scenarios: "API gateways (token bucket per API key), login brute-force protection, per-tenant fairness, Redis INCR + EXPIRE implementations.",
    tags: ["api", "scaling"],
  },
  {
    front: "How do you generate unique IDs at scale? (Snowflake)",
    back: "64-bit: 41 bits ms timestamp + 10 bits machine id + 12 bits sequence. Sortable by time, no coordination per-ID, ~4M/s per node. Alternatives: UUIDv4 (random, index-unfriendly), UUIDv7/ULID (time-sortable, 128-bit), DB ticket server (SPOF), range allocation per node.",
    scenarios: "Tweet/message IDs, event IDs in Kafka pipelines, sharded primary keys where B-tree locality matters.",
    tags: ["scaling", "ids"],
  },
  {
    front: "Fan-out on write vs fan-out on read for a social feed.",
    back: "Fan-out on write pushes each post into every follower's precomputed timeline — O(followers) write, O(1) read; terrible for celebrities. Fan-out on read merges the authors' timelines at query time — cheap writes, expensive reads. Real systems go hybrid: push for normal users, pull for high-fanout accounts, merged at read.",
    scenarios: "Twitter/X home timeline, Instagram feed, Slack channel unreads, notification inboxes.",
    tags: ["feeds", "scaling"],
  },
  {
    front: "Database indexing: B-tree vs LSM-tree.",
    back: "B-tree: in-place updates, read-optimized, predictable latency, write amplification from page splits (Postgres/MySQL). LSM-tree: buffer writes in a memtable, flush sorted SSTables, compact in background — write-optimized, needs bloom filters for reads, suffers compaction spikes (RocksDB/Cassandra/HBase).",
    scenarios: "Choose LSM for write-heavy time-series/logging/metrics; B-tree for OLTP with mixed reads and range scans.",
    tags: ["databases", "storage"],
  },
  {
    front: "How do you shard a relational database, and what breaks?",
    back: "Pick a shard key with high cardinality and even access (user_id, tenant_id). Strategies: range (good scans, hot spots), hash (even, no range scans), directory (flexible, lookup SPOF). Breaks: cross-shard joins, global unique constraints, distributed transactions, resharding — solved by denormalization, Snowflake IDs, sagas, and consistent hashing / logical shards.",
    scenarios: "Multi-tenant SaaS by tenant_id, chat by conversation_id, Vitess/Citus deployments.",
    tags: ["databases", "sharding"],
  },
  {
    front: "Kafka: partitions, consumer groups, and ordering guarantees.",
    back: "Ordering is guaranteed only within a partition. Key selects the partition, so same-key events stay ordered. A consumer group assigns each partition to exactly one consumer — parallelism is capped by partition count. Offsets are committed per group; commit after processing for at-least-once, use transactions + idempotent producer for effectively-once.",
    scenarios: "Ordering per user/account, CDC streams, event sourcing, log aggregation, backpressure-tolerant pipelines.",
    tags: ["messaging", "kafka"],
  },
  {
    front: "Design a URL shortener — the interesting decisions.",
    back: "Encode a 7-char base62 key (62^7 ≈ 3.5T). Options: hash+collision retry, counter -> base62 (needs a distributed counter / Snowflake), or pre-generated key pool. Store key -> URL in a KV store; reads dominate ~100:1 so cache aggressively and serve 301 (cacheable, loses analytics) vs 302 (analytics, more traffic).",
    scenarios: "bit.ly, tracking links, QR codes, deep-link services.",
    tags: ["case-study"],
  },
  {
    front: "Design a rate-limited, globally distributed counter (likes/views).",
    back: "Exact counting at scale is expensive. Use sharded counters (N rows per entity, sum on read), or per-node in-memory aggregation flushed every few seconds to Redis/Kafka, then rolled up. For approximations use HyperLogLog (unique counts) or Count-Min Sketch (frequency). Accept eventual consistency in the UI.",
    scenarios: "YouTube view counts, post likes, unique visitors, trending topics, quota metering.",
    tags: ["case-study", "scaling"],
  },
  {
    front: "Load balancing: L4 vs L7, and common algorithms.",
    back: "L4 balances TCP/UDP by IP:port — fast, protocol-agnostic, no content routing. L7 parses HTTP — path/header routing, TLS termination, retries, canaries. Algorithms: round robin, weighted RR, least connections, least response time, consistent hashing (sticky cache locality), power-of-two-choices (near-optimal with tiny state).",
    scenarios: "ALB/Envoy/NGINX at the edge; L4 (NLB) for gRPC/DB proxies; consistent hashing to keep cache hit rates high.",
    tags: ["networking", "scaling"],
  },
  {
    front: "Circuit breaker, bulkhead, backpressure — how do you stop cascading failure?",
    back: "Circuit breaker: after an error threshold, open the circuit and fail fast, half-open to probe recovery. Bulkhead: isolate thread/connection pools per dependency so one slow service can't consume all capacity. Backpressure: bounded queues + load shedding + timeouts everywhere. Always add jittered exponential retry budgets, never naive retries (retry storms).",
    scenarios: "Service mesh (Envoy) outlier detection, payment provider outages, downstream ML inference timeouts.",
    tags: ["reliability"],
  },
  {
    front: "Read replicas: what consistency problems appear?",
    back: "Async replication means replica lag: read-your-writes violations, monotonic-read violations (bouncing between replicas). Fixes: route a user to the primary for T seconds after a write, sticky sessions to one replica, LSN/GTID token passed by the client and waited on, or synchronous/semi-sync replication for critical paths.",
    scenarios: "Post a comment then reload and it's gone; analytics on replicas; MySQL/Postgres read scaling.",
    tags: ["databases", "consistency"],
  },
  {
    front: "How does a CDN reduce load and latency, and how do you invalidate?",
    back: "Edge PoPs cache static and cacheable dynamic responses near users; anycast routes to the nearest PoP. Control with Cache-Control/s-maxage, ETag, Vary, and stale-while-revalidate. Invalidate via versioned/immutable URLs (best), surrogate-key/tag purges, or global purge (slow, expensive).",
    scenarios: "Static assets, images/video segments, API GET caching, DDoS absorption, edge auth via signed URLs.",
    tags: ["networking", "caching"],
  },
  {
    front: "Design a chat system — key components.",
    back: "Persistent WebSocket connections to a gateway layer, session registry (user -> gateway node) in Redis, message service writing to a partitioned store keyed by conversation_id (Cassandra/DynamoDB), fan-out via pub/sub to the right gateways, per-conversation monotonic sequence IDs for ordering and gap detection, offline queue + push notifications, read receipts as a separate low-priority stream.",
    scenarios: "Slack, WhatsApp, in-app support chat, multiplayer presence.",
    tags: ["case-study", "realtime"],
  },
  {
    front: "Object storage vs block vs file — and how do you handle large uploads?",
    back: "Object (S3): flat keys, HTTP, cheap, immutable-ish, great for media/backups. Block (EBS): raw volumes for DBs. File (NFS/EFS): shared POSIX semantics. Large uploads: presigned URLs so bytes never touch your API, multipart upload with per-part retry, checksum verification, then an async pipeline (queue -> transcode/thumbnail -> metadata DB).",
    scenarios: "Video platforms, document management, user avatars, data lakes.",
    tags: ["storage"],
  },
  {
    front: "What is a bloom filter and when do you reach for one?",
    back: "A probabilistic bitset with k hash functions: no false negatives, tunable false positives, ~10 bits/element for ~1% FP. Can't delete (use counting bloom) or enumerate. Use it as a cheap pre-filter before an expensive lookup.",
    scenarios: "LSM SSTable lookups, 'has this user seen this post', malicious URL checks, dedup before hitting the DB, cache-penetration protection.",
    tags: ["algorithms", "storage"],
  },
  {
    front: "How do you design for multi-region: active-passive vs active-active?",
    back: "Active-passive: one write region, async replication, failover via DNS/health checks — simple, RPO > 0, wasted capacity. Active-active: writes in every region, needs conflict resolution (CRDTs, last-write-wins with clocks, or partition data by region/home-region routing) and careful handling of unique constraints. Latency vs consistency is the core tension (PACELC).",
    scenarios: "Global SaaS with data residency, disaster recovery mandates, Spanner/Cosmos/DynamoDB Global Tables.",
    tags: ["distributed", "availability"],
  },
  {
    front: "What is a service mesh and why would you use one?",
    back: "A service mesh is a dedicated infrastructure layer for service-to-service communication. It handles traffic management, security, observability, and resilience through sidecars or proxies without changing application code.",
    scenarios: "Istio/Linkerd for mTLS, retries, circuit breaking, traffic shifting, and telemetry in microservice platforms.",
    tags: ["networking", "reliability"],
  },
  {
    front: "How do you handle schema changes in a live distributed database?",
    back: "Use backward/forward-compatible changes, deploy consumers before producers for additive fields, version data formats, and run dual reads/writes when necessary. For DB schemas, add nullable columns, backfill gradually, then switch readers and remove old fields later.",
    scenarios: "API evolution, database migrations, protobuf/Avro schema rollout.",
    tags: ["databases", "reliability"],
  },
  {
    front: "What is eventual consistency and how can clients cope with it?",
    back: "Eventual consistency means replicas converge over time but may differ temporarily. Clients cope with idempotent operations, read-repair strategies, version vectors, or routing to a single source of truth for strong reads when needed.",
    scenarios: "DNS, distributed caches, replicated catalogs, collaborative document editing.",
    tags: ["consistency", "distributed"],
  },
  {
    front: "How do you implement pagination for large result sets?",
    back: "Use keyset pagination for stable, performant next/previous navigation; avoid OFFSET with deep pages. For APIs, return a cursor/token from the last seen item and sort by a unique deterministic key.",
    scenarios: "Feed APIs, search results, user dashboards, mobile infinite scrolling.",
    tags: ["api", "databases"],
  },
  {
    front: "Design a chat system — key components.",
    back: "Persistent WebSocket connections to a gateway layer, session registry in Redis, partitioned message storage by conversation_id, fan-out via pub/sub to active gateways, offline queue, and sequence IDs for ordering.",
    scenarios: "Slack, WhatsApp, in-app support chat, multiplayer presence.",
    tags: ["case-study", "realtime"],
  },
  {
    front: "Estimation drill: how do you size a system in an interview?",
    back: "DAU -> QPS (DAU x actions/day / 86400, peak = 2–10x average). Storage = objects/day x size x retention x replication factor. Bandwidth = QPS x payload. Memory for cache = hot set (80/20 rule). Sanity anchors: 1 SSD read ~100µs, network RTT same DC ~0.5ms, cross-region ~50–150ms, one commodity box ~10–50k simple QPS.",
    scenarios: "Opening 5 minutes of any system design interview — always state assumptions out loud and round aggressively.",
    tags: ["interview", "estimation"],
  },
];
