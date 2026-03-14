# ECR repository for main app Docker image (build & push from GitHub Actions)
resource "aws_ecr_repository" "main_app" {
  name                 = "${var.project_name}-main-app"
  image_tag_mutability = "MUTABLE"
  image_scanning_configuration {
    scan_on_push = true
  }
}

resource "aws_ecr_lifecycle_policy" "main_app" {
  repository = aws_ecr_repository.main_app.name
  policy = jsonencode({
    rules = [{
      rulePriority = 1
      description  = "Keep last 10 images"
      selection = {
        tagStatus   = "any"
        countType   = "imageCountMoreThan"
        countNumber = 10
      }
      action = { type = "expire" }
    }]
  })
}
