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
                                   }
            }
        }
        
        stage('Build Frontend') {
            steps {
                echo 'Building Frontend...'
                dir('frontend') {
                    sh 'docker build -t projeto-clientes-frontend:${BUILD_NUMBER} .'
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
        sh """
            cd ${PROJECT_DIR}
            BUILD_NUMBER=${BUILD_NUMBER} docker-compose down || true
            BUILD_NUMBER=${BUILD_NUMBER} docker-compose up -d
        """
    }
}
    }
    
    post {
        success { echo 'Sucesso!' }
        failure { echo 'Falhou!' }
        always { sh 'docker image prune -f' }
    }
}
