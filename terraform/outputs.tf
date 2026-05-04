output "ec2_public_ip" {
  description = "IP publico da EC2 (Elastic IP)"
  value       = var.eip_allocation_id
}

output "ec2_instance_id" {
  description = "ID da instancia EC2"
  value       = aws_instance.prod.id
}

output "ec2_ssh_command" {
  description = "Comando SSH para acessar a EC2"
  value       = "ssh -i ~/.ssh/projeto-clientes.pem ubuntu@98.87.127.2"
}
