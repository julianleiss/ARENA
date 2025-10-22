# ARENA V1.0 - Environment Variables Template
# Copy this file to .env.local and fill in your actual values

# Site Configuration
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# Supabase Configuration
# Get these from: https://app.supabase.com/project/_/settings/api
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# Database URL (Supabase PostgreSQL)
# Format: postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
DATABASE_URL=postgresql://postgres:your-password@db.your-project-id.supabase.co:5432/postgres

# Node Environment
NODE_ENV=development
