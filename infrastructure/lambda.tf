# Zip Lambda source for deployment
data "archive_file" "flashcards" {
  type        = "zip"
  source_dir  = "${path.module}/lambda/flashcards"
  output_path = "${path.module}/lambda/flashcards.zip"
}

data "archive_file" "study_questions" {
  type        = "zip"
  source_dir  = "${path.module}/lambda/study_questions"
  output_path = "${path.module}/lambda/study_questions.zip"
}

# Lambda: Flashcards feature (proxies to main app or implements flashcards logic)
resource "aws_lambda_function" "flashcards" {
  function_name  = "${var.project_name}-flashcards"
  role           = aws_iam_role.lambda.arn
  handler        = "index.handler"
  runtime        = "python3.12"
  timeout        = 30
  memory_size    = 256
  filename       = data.archive_file.flashcards.output_path
  source_code_hash = data.archive_file.flashcards.output_base64sha256
  environment {
    variables = {
      MAIN_APP_URL = "http://${aws_lb.main.dns_name}"
    }
  }
}

# Lambda: Study questions feature
resource "aws_lambda_function" "study_questions" {
  function_name  = "${var.project_name}-study-questions"
  role           = aws_iam_role.lambda.arn
  handler        = "index.handler"
  runtime        = "python3.12"
  timeout        = 30
  memory_size    = 256
  filename       = data.archive_file.study_questions.output_path
  source_code_hash = data.archive_file.study_questions.output_base64sha256
  environment {
    variables = {
      MAIN_APP_URL = "http://${aws_lb.main.dns_name}"
    }
  }
}

# Allow API Gateway HTTP API to invoke Lambda (permissions in api_gateway.tf to avoid circular ref)
