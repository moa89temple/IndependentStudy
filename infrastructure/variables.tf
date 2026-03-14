variable "aws_region" {
  description = "AWS region for all resources"
  type        = string
  default     = "us-east-1"
}

variable "project_name" {
  description = "Project name used for resource naming"
  type        = string
  default     = "lizard"
}

variable "ecs_task_cpu" {
  description = "CPU units for ECS Fargate task (1024 = 1 vCPU)"
  type        = number
  default     = 512
}

variable "ecs_task_memory_mb" {
  description = "Memory in MB for ECS Fargate task"
  type        = number
  default     = 1024
}

variable "ecs_desired_count" {
  description = "Desired number of ECS tasks"
  type        = number
  default     = 1
}

variable "github_actions_role_arn" {
  description = "Optional: IAM role ARN for GitHub Actions OIDC (leave empty to create later)"
  type        = string
  default     = ""
}

variable "main_app_image_tag" {
  description = "Docker image tag for main app (used by ECS task definition)"
  type        = string
  default     = "latest"
}
