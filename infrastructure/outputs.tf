# DevOps / GitHub Actions: use these outputs for build and deploy

output "ecr_repository_url" {
  description = "ECR repository URL for main app image (build & push from GitHub Actions)"
  value       = aws_ecr_repository.main_app.repository_url
}

output "ecr_repository_name" {
  description = "ECR repository name"
  value       = aws_ecr_repository.main_app.name
}

output "ecs_cluster_name" {
  description = "ECS cluster name"
  value       = aws_ecs_cluster.main.name
}

output "ecs_service_name" {
  description = "ECS service name (main app)"
  value       = aws_ecs_service.main_app.name
}

output "main_app_url" {
  description = "Main app URL (ALB). Use this for the app and for Lambda MAIN_APP_URL."
  value       = "http://${aws_lb.main.dns_name}"
}

output "lambda_flashcards_arn" {
  description = "Lambda ARN for flashcards feature (for GitHub Actions deploy)"
  value       = aws_lambda_function.flashcards.arn
}

output "lambda_study_questions_arn" {
  description = "Lambda ARN for study-questions feature (for GitHub Actions deploy)"
  value       = aws_lambda_function.study_questions.arn
}

output "api_gateway_invoke_url" {
  description = "API Gateway URL for feature Lambdas (flashcards, study-questions)"
  value       = "${aws_apigatewayv2_stage.default.invoke_url}"
}

output "aws_region" {
  description = "AWS region (for GitHub Actions)"
  value       = var.aws_region
}

output "redis_primary_endpoint" {
  description = "ElastiCache Redis primary endpoint (REDIS_URL uses this)"
  value       = "${aws_elasticache_replication_group.redis.primary_endpoint_address}:6379"
}
