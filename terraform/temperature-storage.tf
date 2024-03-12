resource "aws_dynamodb_table" "temperature_data" {
  name           = "TemperatureData"
  billing_mode   = "PAY_PER_REQUEST" # On-demand capacity mode
  hash_key       = "type_site"       # Partition key
  range_key      = "datetime"        # Sort key

  attribute {
    name = "type_site"
    type = "S" # String
  }

  attribute {
    name = "datetime"
    type = "S" # String
  }

  tags = {
    Role        = "climate"
    Environment = "production"
    Purpose     = "Store hourly temperature data from several sites"
  }
}




