variable "aws_region" {
  description = "Regiao AWS"
  type        = string
  default     = "us-east-1"
}

variable "ami_id" {
  description = "AMI Ubuntu 24.04 us-east-1"
  type        = string
  default     = "ami-0c7217cdde317cfec"
}

variable "instance_type" {
  description = "Tipo da instancia EC2"
  type        = string
  default     = "t3.micro"
}

variable "key_name" {
  description = "Nome do Key Pair na AWS"
  type        = string
  default     = "projeto-clientes"
}

variable "security_group_id" {
  description = "ID do Security Group existente"
  type        = string
  default     = "sg-07f8969f209d567ab"
}

variable "eip_allocation_id" {
  description = "Allocation ID do Elastic IP permanente"
  type        = string
  default     = "eipalloc-0e61f556a627528a8"
}
