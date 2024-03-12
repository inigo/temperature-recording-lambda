
provider "aws" {
  region = "eu-west-2" # London
}

terraform {
  required_providers {
    archive = {
      source = "hashicorp/archive"
      version = "~> 2.4.2"
    }
    aws = {
      source = "hashicorp/aws"
      version = "~> 5.40.0"
    }
  }
  required_version = "~> 1.7.4"
}
