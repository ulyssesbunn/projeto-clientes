provider "aws" {
  region = var.aws_region
}

resource "aws_instance" "prod" {
  ami                    = var.ami_id
  instance_type          = var.instance_type
  key_name               = var.key_name
  vpc_security_group_ids = [var.security_group_id]

  root_block_device {
    volume_size = 20
    volume_type = "gp3"
  }

  user_data = <<-EOF
    #!/bin/bash
    apt-get update -y
    apt-get install -y docker.io
    curl -L https://github.com/docker/compose/releases/download/v2.24.0/docker-compose-linux-x86_64 -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
    systemctl enable docker
    systemctl start docker
    usermod -aG docker ubuntu
    mkdir -p /home/ubuntu/projeto-clientes
    chown ubuntu:ubuntu /home/ubuntu/projeto-clientes
  EOF

  tags = {
    Name    = "projeto-clientes-prod"
    Project = "projeto-clientes"
  }
}

resource "aws_eip_association" "prod" {
  instance_id   = aws_instance.prod.id
  allocation_id = var.eip_allocation_id
}
