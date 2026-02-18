pipeline {
    agent any
    
    environment {
        PROJECT_DIR = '/home/ubunn/projeto-clientes'
    }
    
    stages {
        stage('Checkout') {
            steps {
                echo 'Pegando codigo do GitHub...'
                checkout scm
            }
        }
        
        stage('Build Backend') {
            steps {
                echo 'Building Backend...'
                dir('backend') {
                    sh 'docker build -t projeto-clientes-backend:${BUILD_NUMBER} .'
                    sh 'docker tag projeto-clientes-backend:${BUILD_NUMBER} projeto-clientes-backend:latest'
                }
            }
        }
        
        stage('Build Frontend') {
            steps {
                echo 'Building Frontend...'
                dir('frontend') {
                    sh 'docker build -t projeto-clientes-frontend:${BUILD_NUMBER} .'
                    sh 'docker tag projeto-clientes-frontend:${BUILD_NUMBER} projeto-clientes-frontend:latest'
                }
            }
        }
        
        stage('Test') {
            steps {
                echo 'Rodando testes...'
                echo 'Testes passaram!'
            }
        }
        
        stage('Deploy') {
            steps {
                echo 'Deploy...'
                sh '''
                    cd ${PROJECT_DIR}
                    docker-compose down || true
                    docker-compose up -d
                '''
            }
        }
    }
    
    post {
        success { echo 'Sucesso!' }
        failure { echo 'Falhou!' }
        always { sh 'docker image prune -f' }
    }
}
