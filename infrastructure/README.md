# Lizard – AWS Infrastructure (Terraform)

This directory defines AWS resources for the flow:

- **GitHub** (push) → **GitHub Actions** → build & push image to **ECR**, deploy **Lambda** (features)
- **ECR** → **ECS (Main App)** pulls image and runs the full app
- **Lambda** (flashcards, study-questions) handle feature endpoints via **API Gateway**

## Prerequisites

- [Terraform](https://www.terraform.io/downloads) >= 1.0
- AWS CLI configured (`aws configure`) or env vars `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`
- Docker (for building the main app image locally)

## Quick start

```bash
cd infrastructure
terraform init
terraform plan
terraform apply
```

After apply, use the **outputs** (e.g. `ecr_repository_url`, `main_app_url`, `api_gateway_invoke_url`) for:

1. **First-time ECS run**: Build and push the main app image to ECR, then ECS will pull it.
2. **GitHub Actions**: Use these outputs in your workflow to build/push to ECR and deploy Lambda.

## Resources

| Resource | Purpose |
|----------|---------|
| **ECR** | Repository for the main app Docker image (build & push from CI) |
| **ECS** | Fargate cluster + service running the main app (backend + frontend in one container) |
| **ALB** | Load balancer in front of ECS; `main_app_url` points here |
| **Lambda** | Two functions: `lizard-flashcards`, `lizard-study-questions` (proxy to main app or custom logic) |
| **API Gateway** | HTTP API exposing `/flashcards` and `/study-questions` to invoke Lambda |
| **ElastiCache (Redis)** | Single-node Redis for RAG; `REDIS_URL` in ECS is auto-filled from the primary endpoint |

## Main app image

From the **repo root**:

```bash
docker build -t lizard-main-app -f Dockerfile .
# Tag and push to ECR (replace ACCOUNT and REGION):
docker tag lizard-main-app:latest ACCOUNT.dkr.ecr.REGION.amazonaws.com/lizard-main-app:latest
docker push ACCOUNT.dkr.ecr.REGION.amazonaws.com/lizard-main-app:latest
```

ECS task definition uses `main_app_image_tag` (default `latest`). After the first push, ECS will pull and run the image.

## DevOps (GitHub Actions)

Connect your repo to GitHub Actions and use Terraform outputs:

- **ECR**: `ecr_repository_url` – authenticate and push the image built from the root `Dockerfile`.
- **ECS**: After pushing a new image, force a new deployment (e.g. `aws ecs update-service --cluster <ecs_cluster_name> --service <ecs_service_name> --force-new-deployment`).
- **Lambda**: Deploy feature code (e.g. zip and `aws lambda update-function-code`) using `lambda_flashcards_arn` and `lambda_study_questions_arn`.

See `.github/workflows/` for workflow stubs (add your own from these outputs).

## Variables

- `aws_region` – AWS region (default `us-east-1`)
- `project_name` – Resource name prefix (default `lizard`)
- `ecs_task_cpu` / `ecs_task_memory_mb` – Fargate task size
- `main_app_image_tag` – Image tag for the ECS task definition (default `latest`)
- `redis_node_type` – ElastiCache node type (default `cache.t3.micro`)
- `redis_engine_version` – Redis engine version (default `7.0`)

## Secrets (Option B – Secrets Manager)

The ECS task gets `OPENAI_API_KEY` and `REDIS_URL` from **AWS Secrets Manager**. Terraform creates two secrets:

| Secret name | Env var in container | Source |
|-------------|----------------------|--------|
| `lizard/openai-api-key` | `OPENAI_API_KEY` | You set this (see below) |
| `lizard/redis-url` | `REDIS_URL` | **Auto-filled** from Terraform-created ElastiCache; override with `redis_url_secret` if needed |

**Redis:** Terraform creates an ElastiCache Redis cluster and writes its URL into `lizard/redis-url`. ECS tasks can connect via the existing security group. No manual Redis setup required unless you override with `redis_url_secret`.

**OpenAI API key** – set once (choose one):

1. **AWS Console**  
   Secrets Manager → `lizard/openai-api-key` → “Retrieve secret value” → “Edit” and set your key.

2. **First apply with variable:**  
   `terraform apply -var="openai_api_key_secret=sk-..."`  
   Use only if you are comfortable passing the key on the CLI.

3. **AWS CLI**  
   ```bash
   aws secretsmanager put-secret-value --secret-id lizard/openai-api-key --secret-string "sk-your-key"
   ```

The ECS task execution role has permission to read both secrets.
