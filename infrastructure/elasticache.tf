# ElastiCache Redis for Lizard RAG (embeddings + retrieval)
# ECS tasks connect via REDIS_URL from Secrets Manager (populated from primary endpoint).

resource "aws_elasticache_subnet_group" "redis" {
  name       = "${var.project_name}-redis"
  subnet_ids = data.aws_subnets.default.ids
}

resource "aws_security_group" "redis" {
  name        = "${var.project_name}-redis"
  description = "Redis for Lizard; allow ECS tasks only"
  vpc_id      = data.aws_vpc.default.id
  ingress {
    from_port       = 6379
    to_port         = 6379
    protocol        = "tcp"
    security_groups = [aws_security_group.ecs_tasks.id]
  }
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

resource "aws_elasticache_replication_group" "redis" {
  replication_group_id = "${var.project_name}-redis"
  description          = "Lizard RAG cache"
  engine               = "redis"
  engine_version             = var.redis_engine_version
  node_type                  = var.redis_node_type
  num_cache_clusters         = 1
  port                       = 6379
  subnet_group_name          = aws_elasticache_subnet_group.redis.name
  security_group_ids         = [aws_security_group.redis.id]
  automatic_failover_enabled = false
}
