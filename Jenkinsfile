pipeline {
    agent any

    environment {
        DOCKERHUB = "tanish190"
        IMAGE_TAG = "v${BUILD_NUMBER}"
    }

    stages {

        stage('Clone Code') {
            steps {
                git branch: 'main',
                    url: 'https://github.com/tanish7819/capstone_project.git'
            }
        }

        stage('Docker Login') {
            steps {
                script {
                    withCredentials([
                        usernamePassword(
                            credentialsId: 'dockerhub',
                            usernameVariable: 'USER',
                            passwordVariable: 'PASS'
                        )
                    ]) {
                        sh '''
                        echo "$PASS" | docker login -u "$USER" --password-stdin
                        '''
                    }
                }
            }
        }

        stage('Build Docker Images') {
            steps {
                sh '''
                docker build -t $DOCKERHUB/frontend:$IMAGE_TAG ./frontend
                docker build -t $DOCKERHUB/product:$IMAGE_TAG ./product-service
                docker build -t $DOCKERHUB/order:$IMAGE_TAG ./order-service
                docker build -t $DOCKERHUB/inventory:$IMAGE_TAG ./inventory-service
                docker build -t $DOCKERHUB/mysql:$IMAGE_TAG ./mysql

                docker tag $DOCKERHUB/frontend:$IMAGE_TAG $DOCKERHUB/frontend:latest
                docker tag $DOCKERHUB/product:$IMAGE_TAG $DOCKERHUB/product:latest
                docker tag $DOCKERHUB/order:$IMAGE_TAG $DOCKERHUB/order:latest
                docker tag $DOCKERHUB/inventory:$IMAGE_TAG $DOCKERHUB/inventory:latest
                docker tag $DOCKERHUB/mysql:$IMAGE_TAG $DOCKERHUB/mysql:latest
                '''
            }
        }

        stage('Push Images') {
            steps {
                script {
                    withCredentials([
                        usernamePassword(
                            credentialsId: 'dockerhub',
                            usernameVariable: 'USER',
                            passwordVariable: 'PASS'
                        )
                    ]) {
                        sh '''
                        echo "$PASS" | docker login -u "$USER" --password-stdin

                        docker push $DOCKERHUB/frontend:$IMAGE_TAG
                        docker push $DOCKERHUB/product:$IMAGE_TAG
                        docker push $DOCKERHUB/order:$IMAGE_TAG
                        docker push $DOCKERHUB/inventory:$IMAGE_TAG
                        docker push $DOCKERHUB/mysql:$IMAGE_TAG

                        docker push $DOCKERHUB/frontend:latest
                        docker push $DOCKERHUB/product:latest
                        docker push $DOCKERHUB/order:latest
                        docker push $DOCKERHUB/inventory:latest
                        docker push $DOCKERHUB/mysql:latest
                        '''
                    }
                }
            }
        }

        stage('Deploy to Kubernetes') {
            steps {
                sh '''
                sed -i "s|IMAGE_TAG|$IMAGE_TAG|g" k8s/*.yaml

                kubectl apply --validate=false -f k8s/
                '''
            }
        }
    }
}
