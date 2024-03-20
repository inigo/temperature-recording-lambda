resource "aws_cloudwatch_event_rule" "thermostat_lambda_trigger" {
  name                = "thermostat-lambda-trigger"
  description         = "Trigger thermostat storage lambda function every five minutes"
  schedule_expression = "cron(*/5 * * * ? *)" # Runs every five minutes

  // This is how to disable the timer when testing
  state = "ENABLED"
}

resource "aws_cloudwatch_event_target" "thermostat" {
  rule      = aws_cloudwatch_event_rule.thermostat_lambda_trigger.name
  target_id = "lambda"
  arn       = aws_lambda_function.record_thermostat.arn
}

resource "aws_lambda_permission" "allow_cloudwatch_to_call_thermostat" {
  statement_id  = "AllowExecutionFromCloudWatch"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.record_thermostat.function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.thermostat_lambda_trigger.arn
}
