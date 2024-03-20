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

data "aws_iam_policy_document" "dynamo_write" {
  statement {
    actions = [
      "dynamodb:PutItem",
    ]
    resources = [
      aws_dynamodb_table.temperature_data.arn,
      aws_dynamodb_table.thermostat_data.arn,
    ]
  }
}

resource "aws_iam_policy" "dynamo_write" {
  name        = "dynamo-write-policy"
  path        = "/"
  policy      = data.aws_iam_policy_document.dynamo_write.json
  description = "Allow writing to DynamoDB tables"
}

# Attach DynamoDB Write Policy to Lambda Execution Role
resource "aws_iam_role_policy_attachment" "lambda_dynamo_write_policy_attachment" {
  role       = aws_iam_role.lambda_execution_role.name
  policy_arn = aws_iam_policy.dynamo_write.arn
}

# IAM Policy for CloudWatch Logs
data "aws_iam_policy_document" "lambda_cloudwatch_logs_policy" {
  statement {
    actions = [
      "logs:CreateLogGroup",
      "logs:CreateLogStream",
      "logs:PutLogEvents"
    ]
    resources = [
      "arn:aws:logs:*:*:*"
    ]
  }
}

resource "aws_iam_policy" "lambda_cloudwatch_logs_policy" {
  name        = "lambda-cloudwatch-logs-policy"
  path        = "/"
  policy      = data.aws_iam_policy_document.lambda_cloudwatch_logs_policy.json
  description = "Allow Lambda to write to CloudWatch Logs"
}

# Attach CloudWatch Logs Policy to Lambda Execution Role
resource "aws_iam_role_policy_attachment" "lambda_cloudwatch_logs_policy_attachment" {
  role       = aws_iam_role.lambda_execution_role.name
  policy_arn = aws_iam_policy.lambda_cloudwatch_logs_policy.arn
}

resource "aws_iam_policy" "lambda_ssm_policy" {
  name        = "lambda-ssm-policy"
  path        = "/"
  description = "IAM policy for Lambda to access SSM parameters"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = [
          "ssm:GetParameter",
          "ssm:GetParameters",
          "ssm:GetParametersByPath"
        ]
        Effect   = "Allow"
        Resource = [
          "arn:aws:ssm:*:*:parameter/thermostat/access-token",
          "arn:aws:ssm:*:*:parameter/thermostat/refresh-token"
        ]
      },
      {
        Action   = "ssm:PutParameter"
        Effect   = "Allow"
        Resource = "arn:aws:ssm:*:*:parameter/thermostat/access-token"
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "lambda_ssm_policy_attachment" {
  policy_arn = aws_iam_policy.lambda_ssm_policy.arn
  role       = aws_iam_role.lambda_execution_role.name
}
