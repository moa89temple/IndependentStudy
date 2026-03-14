# Secrets Manager: store OPENAI_API_KEY and REDIS_URL for ECS task
# After apply, set the real values in AWS Console (Secrets Manager) or via CLI.

resource "aws_secretsmanager_secret" "openai_api_key" {
  name        = "${var.project_name}/openai-api-key"
  description = "OpenAI API key for Lizard main app (set value in Console after create)"
}

resource "aws_secretsmanager_secret_version" "openai_api_key" {
  secret_id     = aws_secretsmanager_secret.openai_api_key.id
  secret_string = var.openai_api_key_secret != "" ? var.openai_api_key_secret : "replace-me-in-console"

  lifecycle {
    ignore_changes = [secret_string]
  }
}

resource "aws_secretsmanager_secret" "redis_url" {
  name        = "${var.project_name}/redis-url"
  description = "Redis URL for Lizard RAG (Terraform-managed ElastiCache or override via var)"
}

resource "aws_secretsmanager_secret_version" "redis_url" {
  secret_id     = aws_secretsmanager_secret.redis_url.id
  secret_string = var.redis_url_secret != "" ? var.redis_url_secret : "redis://${aws_elasticache_replication_group.redis.primary_endpoint_address}:6379/0"
}

# ECS task execution role: allow reading these secrets
resource "aws_iam_role_policy" "ecs_task_execution_secrets" {
  name   = "${var.project_name}-ecs-secrets"
  role   = aws_iam_role.ecs_task_execution.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect   = "Allow"
      Action   = ["secretsmanager:GetSecretValue"]
      Resource = [
        aws_secretsmanager_secret.openai_api_key.arn,
        aws_secretsmanager_secret.redis_url.arn
      ]
    }]
  })
}
