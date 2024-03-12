# IAM Role for Lambda Execution
resource "aws_iam_role" "lambda_execution_role" {
  name               = "lambda-execution-role"
  assume_role_policy = data.aws_iam_policy_document.lambda_assume_role_policy.json
}

data "aws_iam_policy_document" "lambda_assume_role_policy" {
  statement {
    actions = ["sts:AssumeRole"]
    principals {
      type        = "Service"
      identifiers = ["lambda.amazonaws.com"]
    }
  }
}

# Lambda Function
data "archive_file" "lambda_code" {
  type        = "zip"
  source_file = "temperature-files/index.js"
  output_path = "temperature-files/temperature-lambda.zip"
}

resource "aws_lambda_function" "write_to_dynamo" {
  filename         = data.archive_file.lambda_code.output_path
  function_name    = "write-to-dynamo"
  role             = aws_iam_role.lambda_execution_role.arn
  handler          = "index.handler"
  runtime          = "nodejs20.x"
  environment {
    variables = {
      API_KEY = var.datapoint_api_key
    }
  }
  source_code_hash = data.archive_file.lambda_code.output_base64sha256
}

# DynamoDB Write Policy
data "aws_iam_policy_document" "temperature_dynamo_write_policy" {
  statement {
    actions = [
      "dynamodb:PutItem",
    ]
    resources = [
      aws_dynamodb_table.temperature_data.arn,
    ]
  }
}

resource "aws_iam_policy" "temperature_dynamo_write_policy" {
  name        = "dynamo-write-policy"
  path        = "/"
  policy      = data.aws_iam_policy_document.temperature_dynamo_write_policy.json
  description = "Allow writing to DynamoDB temperature table"
}

# Attach DynamoDB Write Policy to Lambda Execution Role
resource "aws_iam_role_policy_attachment" "lambda_dynamo_write_policy_attachment" {
  role       = aws_iam_role.lambda_execution_role.name
  policy_arn = aws_iam_policy.temperature_dynamo_write_policy.arn
}
