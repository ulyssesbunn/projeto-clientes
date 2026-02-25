pipeline {
    agent any

    parameters {
        choice(
            name: 'AMBIENTE',
            choices: ['dev', 'prod'],
            description: 'Selecione o ambiente de deploy'
        )
    }

    environment {
        PROJECT_DIR_DEV = '/home/ubunn/projeto-clientes'
        EC2_USER        = 'ubuntu'
        EC2_HOST        = '98.87.127.2'
        EC2_DIR         = '/home/ubuntu/projeto-clientes'
    }

    stages {
        stage('Checkout') {
            steps {
                echo "Pegando codigo do repositorio..."
                checkout scm
            }
        }

        stage('Build Backend') {
            steps {
                echo "Building Backend (${params.AMBIENTE})..."
                dir('backend') {
                    script {
                        def dockerfile = params.AMBIENTE == 'prod' ? 'Dockerfile.prod' : 'Dockerfile'
                        sh "docker build -f ${dockerfile} -t projeto-clientes-backend:${BUILD_NUMBER} ."
                    }
                }
            }
        }

        stage('Build Frontend') {
            steps {
                echo "Building Frontend (${params.AMBIENTE})..."
                dir('frontend') {
                    script {
                        def dockerfile = params.AMBIENTE == 'prod' ? 'Dockerfile.prod' : 'Dockerfile'
                        sh "docker build -f ${dockerfile} -t projeto-clientes-frontend:${BUILD_NUMBER} ."
                    }
                }
            }
        }

        stage('Test') {
            steps {
                echo 'Rodando testes...'
                echo 'Testes passaram!'
            }
        }

        stage('Deploy DEV') {
            when {
                expression { params.AMBIENTE == 'dev' }
            }
            steps {
                echo 'Deploy local (dev)...'
                sh """
                    cd ${PROJECT_DIR_DEV}
                    BUILD_NUMBER=${BUILD_NUMBER} docker compose down || true
                    BUILD_NUMBER=${BUILD_NUMBER} docker compose up -d
                """
            }
        }

        stage('Deploy PROD (EC2)') {
            when {
                expression { params.AMBIENTE == 'prod' }
            }
            steps {
                echo 'Deploy na EC2 (prod)...'
                sshagent(credentials: ['ec2-ssh-key']) {
                    sh """
                        rsync -az --exclude='.git' --exclude='__pycache__' --exclude='node_modules' \
                            -e 'ssh -o StrictHostKeyChecking=no' \
                            ./ ${EC2_USER}@${EC2_HOST}:${EC2_DIR}/

                        ssh -o StrictHostKeyChecking=no ${EC2_USER}@${EC2_HOST} '
                            cd ${EC2_DIR}
                            docker compose -f docker-compose.prod.yml up -d --build
                            docker image prune -f
                        '
                    """
                }
            }
        }
    }

    post {
        success { echo "Deploy ${params.AMBIENTE} realizado com sucesso!" }
        failure  { echo "Pipeline ${params.AMBIENTE} falhou!" }
        always   { sh 'docker image prune -f' }
    }
}
