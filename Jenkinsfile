pipeline {

    agent any

    environment {
        TEST_REPO_URL = 'https://github.com/kjhassan/Web-ChatApp-Tests.git'
        TEST_REPO_DIR = 'chatapp-tests'
        TEST_RESULTS  = 'reports/results.xml'
        EMAIL_TO      = 'khadeejahassan561@gmail.com'

        MONGO_URI     = credentials('mongo_uri')
        JWT_SECRET    = credentials('jwt_secret')
    }

    stages {

        stage('Install Dependencies (Node, Python, Chrome, ChromeDriver)') {
            steps {
                sh '''
                    set -e

                    echo "Checking Node..."
                    if ! command -v node > /dev/null; then
                        echo "Installing Node.js 18..."
                        curl -fsSL https://deb.nodesource.com/setup_18.x | sudo bash -
                        sudo apt-get install -y nodejs
                    fi

                    echo "Checking Python..."
                    if ! command -v python3 > /dev/null; then
                        echo "Installing Python..."
                        sudo apt-get install -y python3 python3-pip
                    fi

                    echo "Checking Google Chrome..."
                    if ! command -v google-chrome > /dev/null; then
                        echo "Installing Google Chrome..."
                        wget -q https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb
                        sudo apt-get install -y ./google-chrome-stable_current_amd64.deb
                    fi

                    echo "Checking ChromeDriver..."
                    if ! command -v chromedriver > /dev/null; then
                        echo "Installing ChromeDriver..."
                        sudo apt-get install -y chromium-chromedriver
                    fi
                '''
            }
        }

        stage('Checkout Application Repo') {
            steps {
                checkout scm
            }
        }

        stage('Clone Test Repo') {
            steps {
                dir(env.TEST_REPO_DIR) {
                    git branch: 'main', url: env.TEST_REPO_URL
                }
            }
        }

        stage('Build Frontend') {
            steps {
                sh '''
                    cd frontend
                    npm install
                    npm run build
                '''
            }
        }

        stage('Install Backend Dependencies') {
            steps {
                sh '''
                    cd backend
                    npm install
                '''
            }
        }

        stage('Inject Frontend into Backend') {
            steps {
                sh '''
                    rm -rf backend/dist || true
                    cp -r frontend/dist backend/dist
                '''
            }
        }

        stage('Start Backend (MongoDB Atlas)') {
            steps {
                sh '''
                    cd backend

                    echo "Creating .env file..."
                    echo "MONGO_URI=${MONGO_URI}"    > .env
                    echo "JWT_SECRET=${JWT_SECRET}" >> .env
                    echo "PORT=5000"               >> .env

                    echo "Starting backend server..."
                    nohup npm run server > /tmp/server.log 2>&1 &

                    echo "Waiting for backend on port 5000..."

                    for i in $(seq 1 30); do
                        if curl -sSf http://localhost:5000 > /dev/null 2>&1; then
                            echo "Server is UP!"
                            exit 0
                        fi
                        echo "Waiting... ($i/30)"
                        sleep 2
                    done

                    echo "ERROR: Backend did not start!"
                    echo "--- SERVER LOG ---"
                    cat /tmp/server.log || true
                    exit 1
                '''
            }
        }

        stage('Install Test Dependencies') {
            steps {
                sh """
                    cd ${env.TEST_REPO_DIR}
                    python3 -m pip install --upgrade pip
                    pip3 install -r requirements.txt
                """
            }
        }

        stage('Run Selenium Tests') {
            steps {
                sh """
                    mkdir -p reports
                    cd ${env.TEST_REPO_DIR}
                    pytest -v --junitxml=../${env.TEST_RESULTS}
                """
            }
        }

        stage('Publish Test Results') {
            steps {
                junit "${env.TEST_RESULTS}"
            }
        }
    }

    post {
        always {

            node {
                script {

                    // Make sure the results file exists
                    sh "touch ${env.TEST_RESULTS}"

                    def raw = sh(
                        script: "grep -h \"<testcase\" ${env.TEST_RESULTS} || true",
                        returnStdout: true
                    ).trim()

                    int total = 0, passed = 0, failed = 0, skipped = 0
                    String details = ""

                    raw.split('\n').each { line ->
                        if (!line.trim()) return
                        total++

                        def m = (line =~ /name=\"([^\"]+)\"/)
                        def name = m ? m[0][1] : "UnknownTest"

                        if (line.contains("<failure")) {
                            failed++
                            details += "${name} — FAILED\n"
                        } else if (line.contains("<skipped")) {
                            skipped++
                            details += "${name} — SKIPPED\n"
                        } else {
                            passed++
                            details += "${name} — PASSED\n"
                        }
                    }

                    def emailBody = """
    ChatApp CI – Test Results (Build #${env.BUILD_NUMBER})

    Total:   ${total}
    Passed:  ${passed}
    Failed:  ${failed}
    Skipped: ${skipped}

    Details:
    ${details}
    """

                    emailext(
                        to: env.EMAIL_TO,
                        subject: "ChatApp CI – Build #${env.BUILD_NUMBER} Test Results",
                        body: emailBody
                    )
                }

                cleanWs()
            }
        }
    }
}    








// pipeline {
//     agent {
//         docker {
//             image 'nikolaik/python-nodejs:python3.11-nodejs20'
//             args '-u root:root'
//         }
//     }

//     environment {
//         TEST_REPO_URL = 'https://github.com/kjhassan/Web-ChatApp-Tests.git'
//         TEST_REPO_DIR = 'chatapp-tests'
//         TEST_RESULTS  = 'reports/results.xml'
//         EMAIL_TO      = 'khadeejahassan561@gmail.com'
//     }

//     stages {

//         stage('Checkout Application Repo') {
//             steps {
//                 // Jenkins does an initial checkout, this keeps it explicit
//                 checkout scm
//             }
//         }

//         stage('Clone Test Repo') {
//             steps {
//                 dir(env.TEST_REPO_DIR) {
//                     git branch: 'main', url: env.TEST_REPO_URL
//                 }
//             }
//         }

//         // curl is usually already there, but this is cheap & safe
//         stage('Install System Tools (curl)') {
//             steps {
//                 sh '''
//                   apt-get update
//                   apt-get install -y curl
//                 '''
//             }
//         }

//         stage('Install App Dependencies') {
//             steps {
//                 sh '''
//                   cd backend
//                   npm install
//                 '''
//             }
//         }

//         stage('Start Application (port 5000)') {
//             steps {
//                 sh '''
//                   cd backend

//                   echo "Starting backend server..."
//                   nohup npm run server > /tmp/server.log 2>&1 &

//                   echo "Waiting for server on http://localhost:5000 ..."

//                   # Try for ~60 seconds
//                   for i in $(seq 1 30); do
//                     if curl -sSf http://localhost:5000 > /dev/null 2>&1; then
//                       echo " Server is up!"
//                       exit 0
//                     fi
//                     echo "Still waiting for server... ($i/30)"
//                     sleep 2
//                   done

//                   echo " ERROR: Server did not start on port 5000 in time." >&2
//                   echo "---- server.log ----"
//                   cat /tmp/server.log || true
//                   echo "--------------------"
//                   exit 1
//                 '''
//             }
//         }

//         stage('Install Test Dependencies') {
//             steps {
//                 sh """
//                   cd ${env.TEST_REPO_DIR}
//                   python -m pip install --upgrade pip
//                   pip install -r requirements.txt
//                 """
//             }
//         }

//         stage('Run Tests') {
//             steps {
//                 sh """
//                   mkdir -p reports
//                   cd ${env.TEST_REPO_DIR}
//                   pytest -v --junitxml=../${env.TEST_RESULTS}
//                 """
//             }
//         }

//         stage('Publish Test Results') {
//             steps {
//                 junit "${env.TEST_RESULTS}"
//             }
//         }
//     }

//     post {
//         always {
//             script {
//                 // Read testcases from XML if it exists
//                 def raw = ''
//                 try {
//                     raw = sh(
//                         script: "grep -h \"<testcase\" ${env.TEST_RESULTS} || true",
//                         returnStdout: true
//                     ).trim()
//                 } catch (ignored) {
//                     raw = ''
//                 }

//                 int total = 0
//                 int passed = 0
//                 int failed = 0
//                 int skipped = 0
//                 String details = ""

//                 if (raw) {
//                     raw.split('\n').each { line ->
//                         if (!line.trim()) return

//                         total++

//                         def nameMatch = (line =~ /name=\"([^\"]+)\"/)
//                         def testName = nameMatch ? nameMatch[0][1] : "UnknownTest"

//                         if (line.contains("<failure")) {
//                             failed++
//                             details += "${testName} — FAILED\n"
//                         } else if (line.contains("<skipped") || line.contains("</skipped>")) {
//                             skipped++
//                             details += "${testName} — SKIPPED\n"
//                         } else {
//                             passed++
//                             details += "${testName} — PASSED\n"
//                         }
//                     }
//                 }

//                 def emailBody = """
// Test Summary (Build #${env.BUILD_NUMBER})

// Total Tests:   ${total}
// Passed:        ${passed}
// Failed:        ${failed}
// Skipped:       ${skipped}

// Detailed Results:
// ${details ?: "No test details available (tests may not have run)."}

// """

//                 emailext(
//                     to: env.EMAIL_TO,
//                     subject: "ChatApp CI – Build #${env.BUILD_NUMBER} Test Results",
//                     body: emailBody
//                 )
//             }
//         }
//     }
// }












// pipeline {
//     agent {
//         docker {
//             image 'python:3.11-slim'
//             args '-u root:root'
//         }
//     }

//     environment {
//         TEST_REPO_URL = 'https://github.com/kjhassan/Web-ChatApp-Tests.git'
//         TEST_REPO_DIR = 'chatapp-tests'
//         TEST_RESULTS  = 'reports/results.xml'
//         EMAIL_TO      = 'khadeejahassan561@gmail.com'
//     }

//     stages {

//         stage('Checkout Application Repo') {
//             steps {
//                 // Jenkins already does "Declarative: Checkout SCM" before this,
//                 // so this is usually redundant, but safe to keep:
//                 checkout scm
//             }
//         }

//         stage('Clone Test Repo') {
//             steps {
//                 dir(env.TEST_REPO_DIR) {
//                     git branch: 'main', url: env.TEST_REPO_URL
//                 }
//             }
//         }

//         stage('Install System Tools (Node, npm, curl)') {
//             steps {
//                 sh '''
//                   apt-get update
//                   apt-get install -y nodejs npm curl
//                 '''
//             }
//         }

//         stage('Install App Dependencies') {
//             steps {
//                 sh '''
//                   cd backend
//                   npm install
//                 '''
//             }
//         }

//         stage('Start Application (port 5000)') {
//             steps {
//                 sh '''
//                   cd backend

//                   # Start server in background
//                   nohup npm run server > /tmp/server.log 2>&1 &

//                   echo "Waiting for server on http://51.20.182.160/:5000 ..."

//                   # Try for ~60 seconds
//                   for i in $(seq 1 30); do
//                     if curl -sSf http://51.20.182.160:5000 > /dev/null 2>&1; then
//                       echo "Server is up!"
//                       exit 0
//                     fi
//                     sleep 2
//                   done

//                   echo "ERROR: Server did not start on port 5000 in time." >&2
//                   exit 1
//                 '''
//             }
//         }

//         stage('Install Test Dependencies') {
//             steps {
//                 sh """
//                   cd ${env.TEST_REPO_DIR}
//                   python -m pip install --upgrade pip
//                   pip install -r requirements.txt
//                 """
//             }
//         }

//         stage('Run Tests') {
//             steps {
//                 sh """
//                   mkdir -p reports
//                   cd ${env.TEST_REPO_DIR}
//                   pytest -v --junitxml=../${env.TEST_RESULTS}
//                 """
//             }
//         }

//         stage('Publish Test Results') {
//             steps {
//                 junit "${env.TEST_RESULTS}"
//             }
//         }
//     }

//     post {
//         always {
//             script {
//                 // If there is no report (e.g. early failure), avoid crashing
//                 def raw = ''
//                 try {
//                     raw = sh(
//                         script: "grep -h \"<testcase\" ${env.TEST_RESULTS} || true",
//                         returnStdout: true
//                     ).trim()
//                 } catch (ignored) {
//                     raw = ''
//                 }

//                 int total = 0
//                 int passed = 0
//                 int failed = 0
//                 int skipped = 0
//                 String details = ""

//                 if (raw) {
//                     raw.split('\n').each { line ->
//                         if (!line.trim()) return

//                         total++

//                         def nameMatch = (line =~ /name=\"([^\"]+)\"/)
//                         def testName = nameMatch ? nameMatch[0][1] : "UnknownTest"

//                         if (line.contains("<failure")) {
//                             failed++
//                             details += "${testName} — FAILED\n"
//                         } else if (line.contains("<skipped") || line.contains("</skipped>")) {
//                             skipped++
//                             details += "${testName} — SKIPPED\n"
//                         } else {
//                             passed++
//                             details += "${testName} — PASSED\n"
//                         }
//                     }
//                 }

//                 def emailBody = """
// Test Summary (Build #${env.BUILD_NUMBER})

// Total Tests:   ${total}
// Passed:        ${passed}
// Failed:        ${failed}
// Skipped:       ${skipped}

// Detailed Results:
// ${details ?: "No test details available (tests may not have run)."}

// """

//                 emailext(
//                     to: env.EMAIL_TO,
//                     subject: "ChatApp CI – Build #${env.BUILD_NUMBER} Test Results",
//                     body: emailBody
//                 )
//             }
//         }
//     }
// }











// pipeline {
//     agent {
//         docker {
//             // You can change this to any Python image you like
//             image 'python:3.11-slim'
//             // run as root so pip install works
//             args '-u root:root'
//         }
//     }

//     stages {
//         stage('Clone Repository') {
//             steps {
//                 // Your repo + main branch
//                 git branch: 'main', url: 'https://github.com/kjhassan/MERN-project.git'
//             }
//         }

//         stage('Install Dependencies') {
//             steps {
//                 sh '''
//                     python -m pip install --upgrade pip
//                     pip install -r requirements.txt
//                 '''
//             }
//         }

//         stage('Run Tests') {
//             steps {
//                 sh '''
//                     mkdir -p reports
//                     # Pytest will auto-discover tests (e.g. in tests/ folder)
//                     pytest -v --junitxml=reports/results.xml
//                 '''
//             }
//         }

//         stage('Publish Test Results') {
//             steps {
//                 // Tell Jenkins where the JUnit XML report is
//                 junit 'reports/results.xml'
//             }
//         }
//     }

//     post {
//         always {
//             script {
//                 // (Optional) avoid "unsafe repository" warnings
//                 sh "git config --global --add safe.directory ${env.WORKSPACE}"

//                 // Get commit author email (like your teacher's example)
//                 def committer = sh(
//                     script: "git log -1 --pretty=format:'%ae' || echo 'unknown@local'",
//                     returnStdout: true
//                 ).trim()

//                 // Read all <testcase> lines from the pytest JUnit report
//                 def raw = sh(
//                     script: "grep -h \"<testcase\" reports/results.xml || true",
//                     returnStdout: true
//                 ).trim()

//                 int total = 0
//                 int passed = 0
//                 int failed = 0
//                 int skipped = 0

//                 def details = ""

//                 if (raw) {
//                     raw.split('\\n').each { line ->
//                         total++

//                         def matcher = (line =~ /name=\"([^\"]+)\"/)
//                         def name = matcher ? matcher[0][1] : "UnknownTest"

//                         if (line.contains("<failure")) {
//                             failed++
//                             details += "${name} — FAILED\n"
//                         } else if (line.contains("<skipped") || line.contains("</skipped>")) {
//                             skipped++
//                             details += "${name} — SKIPPED\n"
//                         } else {
//                             passed++
//                             details += "${name} — PASSED\n"
//                         }
//                     }
//                 }

//                 def emailBody = """
// Test Summary (Build #${env.BUILD_NUMBER})

// Total Tests:   ${total}
// Passed:        ${passed}
// Failed:        ${failed}
// Skipped:       ${skipped}

// Committer:     ${committer}

// Detailed Results:
// ${details}
// """

//                 emailext(
//                     // send to you + also to the committer (like teacher's style)
//                     to: "khadeejahassan@gmail.com, ${committer}",
//                     subject: "ChatApp Selenium Tests — Build #${env.BUILD_NUMBER} Results",
//                     body: emailBody
//                 )
//             }
//         }
//     }
// }















// pipeline {
//     agent any

//     options {
//         buildDiscarder(logRotator(numToKeepStr: '5'))
//         timestamps()
//     }

//     environment {
//         // URL of your Selenium tests repo (change this later)
//         TEST_REPO = 'https://github.com/kjhassan/Web-ChatApp-Tests.git'
//         MONGO_URI = credentials('MONGO_DB_URI')
//         JWT_SECRET = credentials('JWT_SECRET')
//         APP_PORT = '5000'
//     }

//     triggers {
//         githubPush()
//     }

//     stages {

//         stage('Checkout App Code') {
//             steps {
//                 echo 'Checking out application code...'
//                 checkout scm
//             }
//         }

//         stage('Clone Test Repo') {
//             steps {
//                 echo 'Cloning Selenium tests repository...'
//                 sh '''
//                   rm -rf tests || true
//                   git clone ${TEST_REPO} tests
//                 '''
//             }
//         }

//         stage('Build & Run Selenium Tests (Docker)') {
//             steps {
//                 echo 'Building test Docker image and running tests...'
//                 dir('tests') {
//                     sh '''
//                       # Build test Docker image (Dockerfile must be in tests repo root)
//                       docker build -t chat-tests .

//                       # Run tests in container
//                       # IMPORTANT: We mount current folder so report.xml is saved on host
//                       docker run --rm \
//                         -v "$PWD:/workspace" \
//                         -w /workspace \
//                         --name chat-tests-container \
//                         chat-tests
//                     '''
//                 }
//             }
//             post {
//                 always {
//                     echo 'Archiving test report (JUnit XML)...'
//                     // Expecting report.xml created by container under tests/report.xml
//                     junit 'tests/report.xml'
//                 }
//             }
//         }

//         stage('Build App Docker Image') {
//             steps {
//                 echo 'Building application Docker image...'
//                 sh '''
//                   docker build -t chatapp:latest -f backend/Dockerfile .
//                 '''
//             }
//         }

//         stage('Deploy App on EC2 (same machine)') {
//             steps {
//                 echo 'Deploying container on EC2 (same host as Jenkins)...'
//                 sh '''
//                 # Stop old container if running
//                 docker stop chatapp || true
//                 docker rm chatapp || true

//                 # Run new container with environment variables from Jenkins
//                 docker run -d \
//                     --name chatapp \
//                     -p ${APP_PORT}:${APP_PORT} \
//                     -e PORT="${APP_PORT}" \
//                     -e MONGO_URI="${MONGO_URI}" \
//                     -e JWT_SECRET="${JWT_SECRET}" \
//                     -e NODE_ENV="production" \
//                     chatapp:latest

//                 # Optional cleanup to save space
//                 docker system prune -af || true
//                 '''
//             }
//         }    
//     }

//     post {
//         success {
//             echo "Pipeline SUCCESS: Build, test, and deploy completed."
//         }
//         failure {
//             echo "Pipeline FAILED: Check the stage logs."
//         }
//         always {
//             cleanWs()
//         }
//     }
// }













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
