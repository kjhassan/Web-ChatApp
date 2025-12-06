pipeline {
    agent any

    options {
        buildDiscarder(logRotator(numToKeepStr: '5'))
        timestamps()
    }

    environment {
        // URL of your Selenium tests repo (change this later)
        TEST_REPO = 'https://github.com/kjhassan/Web-ChatApp-Tests.git'
    }

    triggers {
        githubPush()
    }

    stages {

        stage('Checkout App Code') {
            steps {
                echo 'Checking out application code...'
                checkout scm
            }
        }

        stage('Clone Test Repo') {
            steps {
                echo 'Cloning Selenium tests repository...'
                sh '''
                  rm -rf tests || true
                  git clone ${TEST_REPO} tests
                '''
            }
        }

        stage('Build & Run Selenium Tests (Docker)') {
            steps {
                echo 'Building test Docker image and running tests...'
                dir('tests') {
                    sh '''
                      # Build test Docker image (Dockerfile must be in tests repo root)
                      docker build -t chat-tests .

                      # Run tests in container
                      # IMPORTANT: We mount current folder so report.xml is saved on host
                      docker run --rm \
                        -v "$PWD:/workspace" \
                        -w /workspace \
                        --name chat-tests-container \
                        chat-tests
                    '''
                }
            }
            post {
                always {
                    echo 'Archiving test report (JUnit XML)...'
                    // Expecting report.xml created by container under tests/report.xml
                    junit 'tests/report.xml'
                }
            }
        }

        stage('Build App Docker Image') {
            steps {
                echo 'Building application Docker image...'
                sh '''
                  docker build -t chatapp:latest -f backend/Dockerfile .
                '''
            }
        }

        stage('Deploy App on EC2 (same machine)') {
            steps {
                echo 'Deploying container on EC2 (same host as Jenkins)...'
                sh '''
                  # Stop old container if running
                  docker stop chatapp || true
                  docker rm chatapp || true

                  # Run new container
                  docker run -d \
                    --name chatapp \
                    -p 5000:5000 \
                    chatapp:latest

                  # Optional cleanup to save space
                  docker system prune -af || true
                '''
            }
        }
    }

    post {
        success {
            echo "Pipeline SUCCESS: Build, test, and deploy completed."
        }
        failure {
            echo "Pipeline FAILED: Check the stage logs."
        }
        always {
            cleanWs()
        }
    }
}













// pipeline {
//     agent any

//     environment {
//         DOCKER_USER = credentials('dockerhub-username')
//         DOCKER_PASS = credentials('dockerhub-password')
//         TEST_REPO = "https://github.com/kjhassan/Web-ChatApp-Tests.git"
//     }

//     options {
//         buildDiscarder(logRotator(numToKeepStr: '5'))
//         timestamps()
//     }

//     stages {
//         stage('Checkout App Code') {
//             steps {
//                 checkout scm
//                 sh 'rm -rf tests || true'
//             }
//         }

//         stage('Clone Test Repo') {
//             steps {
//                 sh '''
//                 git clone ${TEST_REPO} tests
//                 '''
//             }
//         }

//         stage('Build Test Image & Run Selenium') {
//             steps {
//                 sh '''
//                 cd tests
//                 docker build -t chat-tests .
//                 docker run --rm chat-tests
//                 '''
//             }
//             post {
//                 always {
//                     junit 'tests/report.xml'
//                 }
//             }
//         }

//         stage('Build App Docker Image') {
//             steps {
//                 sh '''
//                 docker build -t chatapp:latest -f backend/Dockerfile .
//                 '''
//             }
//         }

//         stage('Push to DockerHub') {
//             steps {
//                 sh '''
//                 echo $DOCKER_PASS | docker login -u $DOCKER_USER --password-stdin
//                 docker tag chatapp:latest $DOCKER_USER/chatapp:latest
//                 docker push $DOCKER_USER/chatapp:latest
//                 '''
//             }
//         }

//         stage('Deploy to EC2') {
//             steps {
//                 sh '''
//                 ssh -o StrictHostKeyChecking=no ubuntu@YOUR_EC2_PUBLIC_IP "
//                   docker pull $DOCKER_USER/chatapp:latest &&
//                   docker stop chatapp || true &&
//                   docker rm chatapp || true &&
//                   docker run -d --name chatapp -p 5000:5000 $DOCKER_USER/chatapp:latest &&
//                   docker system prune -af
//                 "
//                 '''
//             }
//         }
//     }

//     post {
//         always {
//             cleanWs()
//         }
//     }
// }













// pipeline {
//     agent any

//     environment {
//         COMPOSE_FILE = 'docker-compose.yml'
//     }

//     stages {
//         stage('Checkout') {
//             steps {
//                 echo 'Pulling code from GitHub...'
//                 git branch: 'main', url: 'https://github.com/kjhassan/Web-ChatApp.git'
//             }
//         }

//         stage('Build and Run Containers') {
//             steps {
//                 echo 'Starting containerized environment...'
//                 sh 'docker-compose down || true'
//                 sh 'docker-compose up -d'
//             }
//         }

//         stage('Verify') {
//             steps {
//                 echo 'Checking running containers...'
//                 sh 'docker ps'
//             }
//         }
//     }

//     post {
//         success {
//             echo 'Pipeline executed successfully! Environment is up.'
//         }
//         failure {
//             echo 'Pipeline failed. Please check logs.'
//         }
//     }
// }
