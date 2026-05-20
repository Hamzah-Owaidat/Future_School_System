# Quick Start Guide - Database Setup

## Step 1: Install MySQL Dependencies

```bash
npm install
```

This will install `mysql2` package along with other dependencies.

## Step 2: Configure Environment Variables

Create a `.env` file in the root directory with your database credentials:

```env
PORT=3000
NODE_ENV=development

# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_NAME=futurschool
DB_USER=root
DB_PASSWORD=your_password_here
```

## Step 3: Create Database in phpMyAdmin

### Option A: Using phpMyAdmin Web Interface

1. Open phpMyAdmin in your browser (usually `http://localhost/phpmyadmin`)
2. Click on "SQL" tab
3. Copy and paste the contents of `database/schema.sql`
4. Click "Go" to execute
5. The database `futurschool` will be created with all tables

### Option B: Using MySQL Command Line

```bash
mysql -u root -p < database/schema.sql
```

## Step 4: (Optional) Insert Sample Data

### Option A: Using phpMyAdmin

1. Select the `futurschool` database
2. Click on "SQL" tab
3. Copy and paste the contents of `database/seed_data.sql`
4. Click "Go" to execute

### Option B: Using MySQL Command Line

```bash
mysql -u root -p futurschool < database/seed_data.sql
```

## Step 5: Verify Database Connection

Start your server:

```bash
npm run dev
```

You should see:
```
✅ MySQL Database Connected Successfully
🚀 FuturSchool System Server is running on port 3000
```

## Database Tables Created

After running `schema.sql`, you'll have these tables:

1. ✅ **roles** - User roles (admin, teacher, etc.)
2. ✅ **permissions** - System permissions
3. ✅ **role_permissions** - Role-permission relationships
4. ✅ **employees** - School staff
5. ✅ **classes** - Class/grade levels
6. ✅ **students** - Student information
7. ✅ **notes** - Student notes

## Troubleshooting

### Connection Error
- Check your MySQL server is running
- Verify database credentials in `.env` file
- Ensure database `futurschool` exists

### Permission Denied
- Make sure your MySQL user has CREATE, INSERT, UPDATE, DELETE permissions
- Check user privileges in phpMyAdmin → User Accounts

### Port Already in Use
- Change `PORT` in `.env` file
- Or stop the process using port 3000

