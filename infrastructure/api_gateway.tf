# API Gateway HTTP API for Lambda features (flashcards, study-questions)
resource "aws_apigatewayv2_api" "lambda" {
  name          = "${var.project_name}-features"
  protocol_type = "HTTP"
  cors_configuration {
    allow_origins = ["*"]
    allow_methods = ["GET", "POST", "OPTIONS"]
    allow_headers = ["*"]
  }
}

resource "aws_apigatewayv2_integration" "flashcards" {
  api_id           = aws_apigatewayv2_api.lambda.id
  integration_type = "AWS_PROXY"
  integration_uri  = aws_lambda_function.flashcards.invoke_arn
  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_integration" "study_questions" {
  api_id           = aws_apigatewayv2_api.lambda.id
  integration_type = "AWS_PROXY"
  integration_uri  = aws_lambda_function.study_questions.invoke_arn
  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_route" "flashcards" {
  api_id    = aws_apigatewayv2_api.lambda.id
  route_key = "ANY /flashcards/{proxy+}"
  target    = "integrations/${aws_apigatewayv2_integration.flashcards.id}"
}

resource "aws_apigatewayv2_route" "flashcards_root" {
  api_id    = aws_apigatewayv2_api.lambda.id
  route_key = "ANY /flashcards"
  target    = "integrations/${aws_apigatewayv2_integration.flashcards.id}"
}

resource "aws_apigatewayv2_route" "study_questions" {
  api_id    = aws_apigatewayv2_api.lambda.id
  route_key = "ANY /study-questions/{proxy+}"
  target    = "integrations/${aws_apigatewayv2_integration.study_questions.id}"
}

resource "aws_apigatewayv2_route" "study_questions_root" {
  api_id    = aws_apigatewayv2_api.lambda.id
  route_key = "ANY /study-questions"
  target    = "integrations/${aws_apigatewayv2_integration.study_questions.id}"
}

resource "aws_apigatewayv2_stage" "default" {
  api_id      = aws_apigatewayv2_api.lambda.id
  name        = "$default"
  auto_deploy = true
}

resource "aws_lambda_permission" "api_gw_flashcards" {
  statement_id   = "AllowAPIGatewayInvoke"
  action         = "lambda:InvokeFunction"
  function_name  = aws_lambda_function.flashcards.function_name
  principal      = "apigateway.amazonaws.com"
  source_arn     = "${aws_apigatewayv2_api.lambda.execution_arn}/*/*"
}

resource "aws_lambda_permission" "api_gw_study_questions" {
  statement_id   = "AllowAPIGatewayInvoke"
  action         = "lambda:InvokeFunction"
  function_name  = aws_lambda_function.study_questions.function_name
  principal      = "apigateway.amazonaws.com"
  source_arn     = "${aws_apigatewayv2_api.lambda.execution_arn}/*/*"
}
