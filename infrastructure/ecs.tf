# Security group for ALB (allow 80 from internet)
resource "aws_security_group" "alb" {
  name        = "${var.project_name}-alb"
  description = "ALB for Lizard main app"
  vpc_id      = data.aws_vpc.default.id
  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

# Security group for ECS tasks (allow from ALB only)
resource "aws_security_group" "ecs_tasks" {
  name        = "${var.project_name}-ecs-tasks"
  description = "ECS tasks for Lizard main app"
  vpc_id      = data.aws_vpc.default.id
  ingress {
    from_port       = 8000
    to_port         = 8000
    protocol        = "tcp"
    security_groups = [aws_security_group.alb.id]
  }
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

# ECS cluster
resource "aws_ecs_cluster" "main" {
  name = "${var.project_name}-cluster"
}

# CloudWatch log group for main app
resource "aws_cloudwatch_log_group" "main_app" {
  name              = "/ecs/${var.project_name}-main-app"
  retention_in_days  = 7
}

# Task definition: main app (single container with backend + frontend)
resource "aws_ecs_task_definition" "main_app" {
  family                   = "${var.project_name}-main-app"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = var.ecs_task_cpu
  memory                   = var.ecs_task_memory_mb
  execution_role_arn       = aws_iam_role.ecs_task_execution.arn
  task_role_arn            = aws_iam_role.ecs_task.arn
  container_definitions = jsonencode([{
    name  = "main-app"
    image = "${aws_ecr_repository.main_app.repository_url}:${var.main_app_image_tag}"
    portMappings = [{
      containerPort = 8000
      protocol      = "tcp"
    }]
    essential = true
    logConfiguration = {
      logDriver = "awslogs"
      options = {
        "awslogs-group"         = aws_cloudwatch_log_group.main_app.name
        "awslogs-region"         = var.aws_region
        "awslogs-stream-prefix"  = "ecs"
      }
    }
    environment = [
      { name = "CORS_ORIGINS", value = "*" }
    ]
    secrets = [] # Add OPENAI_API_KEY, REDIS_URL, etc. via Secrets Manager or SSM in production
  }])
}

# ALB
resource "aws_lb" "main" {
  name               = "${var.project_name}-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb.id]
  subnets            = data.aws_subnets.default.ids
}

# Target group for ECS
resource "aws_lb_target_group" "main_app" {
  name        = "${var.project_name}-main"
  port        = 8000
  protocol    = "HTTP"
  vpc_id      = data.aws_vpc.default.id
  target_type = "ip"
  health_check {
    path                = "/health"
    healthy_threshold   = 2
    unhealthy_threshold = 3
    timeout             = 5
    interval            = 30
  }
}

# ALB listener
resource "aws_lb_listener" "main" {
  load_balancer_arn = aws_lb.main.arn
  port              = "80"
  protocol          = "HTTP"
  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.main_app.arn
  }
}

# ECS service
resource "aws_ecs_service" "main_app" {
  name            = "${var.project_name}-main-app"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.main_app.arn
  desired_count   = var.ecs_desired_count
  launch_type     = "FARGATE"
  network_configuration {
    subnets          = data.aws_subnets.default.ids
    security_groups  = [aws_security_group.ecs_tasks.id]
    assign_public_ip = true
  }
  load_balancer {
    target_group_arn = aws_lb_target_group.main_app.arn
    container_name   = "main-app"
    container_port   = 8000
  }
  depends_on = [aws_lb_listener.main]
}
