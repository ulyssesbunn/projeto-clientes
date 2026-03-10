pipeline {
    agent any
    environment {
        PROJECT_DIR = '/home/ubunn/projeto-clientes'
    }
    stages {
        stage('Checkout') {
            steps {
                echo 'Pegando codigo do repositorio...'
                checkout scm
            }
        }
        stage('Build Backend') {
            steps {
                echo 'Building Backend (dev)...'
                dir('backend') {
                    sh 'docker build -t projeto-clientes-backend:${BUILD_NUMBER} .'
                }
            }
        }
        stage('Build Frontend') {
            steps {
                echo 'Building Frontend (dev)...'
                dir('frontend') {
                    sh 'docker build -t projeto-clientes-frontend:${BUILD_NUMBER} .'
                }
            }
        }
        stage('Test') {
            steps {
                echo 'Garantindo PostgreSQL rodando...'
                sh "cd ${PROJECT_DIR} && docker-compose up -d --wait postgres"
                echo 'Rodando testes reais...'
                sh """
                    docker run --rm \
                        --network projeto-clientes_projeto-network \
                        -e DATABASE_URL=postgresql://admin:admin123@postgres:5432/clientes_db \
                        projeto-clientes-backend:${BUILD_NUMBER} \
                        python -m pytest tests/ -v --tb=short
                """
            }
        }
        stage('Deploy DEV') {
            steps {
                echo 'Deploy local (dev)...'
                sh """
                    cd ${PROJECT_DIR}
                    BUILD_NUMBER=${BUILD_NUMBER} docker-compose down || true
                    BUILD_NUMBER=${BUILD_NUMBER} docker-compose up -d
                """
            }
        }
    }
    post {
        success { echo 'Deploy DEV realizado com sucesso!' }
        failure  { echo 'Pipeline DEV falhou!' }
        always   { sh 'docker image prune -f' }
    }
}
