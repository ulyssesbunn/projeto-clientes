pipeline {
    agent any
    environment {
        PROJECT_DIR = '/home/ubunn/projeto-clientes'
        SONAR_HOME = tool 'Sonar'
    }
    stages {
        stage('Checkout') {
            steps {
                echo 'Pegando codigo do repositorio...'
                checkout scm
            }
        }
        stage('SonarQube: Code Analysis') {
            steps {
                withSonarQubeEnv('Sonar') {
                    sh """
                        ${SONAR_HOME}/bin/sonar-scanner \
                        -Dsonar.projectKey=projeto-clientes \
                        -Dsonar.projectName=projeto-clientes \
                        -Dsonar.sources=frontend/src,backend/app \
                        -Dsonar.exclusions=**/node_modules/**,**/__pycache__/**
                    """
                }
            }
        }
        stage('SonarQube: Quality Gate') {
            steps {
                timeout(time: 5, unit: 'MINUTES') {
                    waitForQualityGate abortPipeline: true
                }
            }
        }
        stage('OWASP: Dependency Check') {
            steps {
                echo 'Rodando OWASP Dependency Check...'
                withCredentials([string(credentialsId: 'nvd-api-key', variable: 'NVD_KEY')]) {
                    dir('frontend') {
                        dependencyCheck additionalArguments: '''
                            --scan ./
                            --disableYarnAudit
                            --disableNodeAudit
                            --format HTML
                            --format XML
                        ''' + " --nvdApiKey ${NVD_KEY}",
                        odcInstallation: 'OWASP'
                        dependencyCheckPublisher pattern: '**/dependency-check-report.xml'
                    }
                }
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
        stage('Trivy: Image Scan') {
            steps {
                echo 'Rodando Trivy image scan...'
                sh """
                    docker run --rm \
                        -v /var/run/docker.sock:/var/run/docker.sock \
                        -v \$HOME/.cache/trivy:/root/.cache/trivy \
                        aquasec/trivy:latest image \
                        --exit-code 0 \
                        --severity HIGH,CRITICAL \
                        --format table \
                        projeto-clientes-backend:\${BUILD_NUMBER}

                    docker run --rm \
                        -v /var/run/docker.sock:/var/run/docker.sock \
                        -v \$HOME/.cache/trivy:/root/.cache/trivy \
                        aquasec/trivy:latest image \
                        --exit-code 0 \
                        --severity HIGH,CRITICAL \
                        --format table \
                        projeto-clientes-frontend:\${BUILD_NUMBER}
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
